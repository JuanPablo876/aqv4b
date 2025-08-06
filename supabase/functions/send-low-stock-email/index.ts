// Supabase Edge Function to send low stock email notifications
// This should be deployed to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@aqualiquim.mx'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    console.log('📧 Processing low stock email request...');
    
    const { recipients, subject, htmlContent, textContent, lowStockItems } = await req.json()

    if (!recipients || recipients.length === 0) {
      throw new Error('No recipients provided')
    }

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      throw new Error('Email service not configured')
    }

    // Prepare email data for Resend API
    const emailData = {
      from: `Aqualiquim Sistema <${FROM_EMAIL}>`,
      to: recipients,
      subject: subject || '⚠️ Alerta de Stock Bajo - Aqualiquim',
      html: htmlContent,
      text: textContent,
      headers: {
        'X-Priority': '1', // High priority for low stock alerts
        'X-MSMail-Priority': 'High',
        'Importance': 'high'
      }
    }

    console.log('📧 Sending email via Resend API...', {
      recipients: recipients.length,
      subject,
      lowStockItemsCount: lowStockItems?.length || 0
    });

    // Send email using Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()

    if (!response.ok) {
      console.error('❌ Resend API error:', result)
      throw new Error(`Resend API error: ${result.message || 'Unknown error'}`)
    }

    console.log('✅ Low stock email sent successfully:', result.id)

    // Log the notification for audit purposes
    try {
      // Here you could also log to a database table for audit trail
      console.log('📝 Low stock notification logged:', {
        emailId: result.id,
        recipients,
        itemsCount: lowStockItems?.length || 0,
        timestamp: new Date().toISOString()
      });
    } catch (logError) {
      console.error('⚠️ Error logging notification:', logError);
    }

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        message: 'Low stock notification sent successfully',
        timestamp: new Date().toISOString()
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error('❌ Error sending low stock email:', error)
    
    return new Response(
      JSON.stringify({
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
})
