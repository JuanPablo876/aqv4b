import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

// CORS headers defined inline
const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'POST, GET, OPTIONS, PUT, DELETE',
}

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')

serve(async (req) => {
  console.log('🚀 Edge Function started, method:', req.method);
  
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ Handling OPTIONS request');
    return new Response('ok', { headers: corsHeaders })
  }

  console.log('📧 Starting invitation email process...');

  try {
    console.log('📧 Processing invitation email request...');
    const { invitation_id } = await req.json()
    console.log('📋 Invitation ID:', invitation_id);

    // Check if we have required environment variables
    const hasResendKey = !!RESEND_API_KEY;
    const supabaseUrl = Deno.env.get('SUPABASE_URL');
    console.log('🔑 Environment check:', { 
      hasResendKey, 
      hasSupabaseUrl: !!supabaseUrl 
    });

    // Initialize Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    )


    // Get invitation details (no join)
    const { data: invitation, error: invitationError } = await supabaseClient
      .from('invitations')
      .select('*')
      .eq('id', invitation_id)
      .single()

    if (invitationError) {
      console.error('❌ Failed to fetch invitation:', invitationError)
      throw new Error(`Failed to fetch invitation: ${invitationError.message}`)
    }

    if (!invitation) {
      console.error('❌ Invitation not found')
      throw new Error('Invitation not found')
    }

    // Get inviter info from auth.users
    let inviterName = 'Admin';
    if (invitation.invited_by) {
      const { data: inviter, error: inviterError } = await supabaseClient
        .from('auth.users')
        .select('email, raw_user_meta_data')
        .eq('id', invitation.invited_by)
        .single();
      if (!inviterError && inviter) {
        inviterName = inviter.raw_user_meta_data?.full_name ||
                      inviter.email?.split('@')[0] ||
                      'Admin';
      }
    }

    // Create invitation URL
    const invitationUrl = `${Deno.env.get('APP_URL') || 'http://localhost:3000'}/accept-invitation?id=${invitation.id}`

    // Email content
    const emailHtml = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
          <title>Invitación a AquaLiquim</title>
          <style>
            body { 
              font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
              line-height: 1.6;
              color: #333;
              max-width: 600px;
              margin: 0 auto;
              padding: 20px;
            }
            .header {
              background: linear-gradient(135deg, #1e40af 0%, #3b82f6 100%);
              color: white;
              padding: 30px;
              text-align: center;
              border-radius: 8px 8px 0 0;
            }
            .content {
              background: #f8fafc;
              padding: 30px;
              border-radius: 0 0 8px 8px;
            }
            .button {
              display: inline-block;
              background: #1e40af;
              color: white;
              padding: 12px 30px;
              text-decoration: none;
              border-radius: 6px;
              font-weight: 600;
              margin: 20px 0;
            }
            .info-box {
              background: #e0f2fe;
              border-left: 4px solid #0284c7;
              padding: 15px;
              margin: 20px 0;
            }
            .footer {
              text-align: center;
              padding: 20px;
              color: #6b7280;
              font-size: 14px;
            }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>🏊‍♂️ AquaLiquim</h1>
            <p>Has sido invitado a unirte a nuestro equipo</p>
          </div>
          
          <div class="content">
            <h2>¡Bienvenido/a!</h2>
            <p>Hola,</p>
            <p><strong>${inviterName}</strong> te ha invitado a unirte a <strong>AquaLiquim</strong> con el rol de <strong>${invitation.role}</strong>.</p>
            
            <div class="info-box">
              <p><strong>📧 Email:</strong> ${invitation.email}</p>
              <p><strong>👤 Rol:</strong> ${invitation.role}</p>
              <p><strong>📅 Invitación expira:</strong> ${new Date(invitation.expires_at).toLocaleDateString('es-ES')}</p>
            </div>
            
            <p>Para aceptar esta invitación y crear tu cuenta, haz clic en el siguiente botón:</p>
            
            <p style="text-align: center;">
              <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
            </p>
            
            <p><small>O copia y pega este enlace en tu navegador:<br>
            <a href="${invitationUrl}">${invitationUrl}</a></small></p>
            
            <p><strong>⚠️ Importante:</strong> Esta invitación expirará el ${new Date(invitation.expires_at).toLocaleDateString('es-ES')}. Asegúrate de aceptarla antes de esa fecha.</p>
          </div>
          
          <div class="footer">
            <p>Este email fue enviado por AquaLiquim<br>
            Si no esperabas esta invitación, puedes ignorar este mensaje.</p>
          </div>
        </body>
      </html>
    `

    // Check if we have Resend API key
    if (RESEND_API_KEY) {
      console.log('✅ Resend API key found, attempting to send email...');
      // Send email using Resend
      console.log('📤 Sending email to:', invitation.email);
      const emailResponse = await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${RESEND_API_KEY}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          from: 'AquaLiquim <noreply@yourdomain.com>', // Replace with your verified domain
          to: [invitation.email],
          subject: `Invitación a AquaLiquim - Rol: ${invitation.role}`,
          html: emailHtml,
        }),
      })

      if (!emailResponse.ok) {
        const errorText = await emailResponse.text()
        console.error('❌ Resend API error:', errorText);
        throw new Error(`Failed to send email: ${errorText}`)
      }

      const emailResult = await emailResponse.json()
      console.log('✅ Email sent successfully! Resend ID:', emailResult.id);

      // Update invitation status to indicate email was sent
      const { error: updateError, data: updateData } = await supabaseClient
        .from('invitations')
        .update({
          email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation_id)
        .select();

      if (updateError) {
        console.error("❌ Failed to update invitation record:", updateError);
      } else {
        console.log("✅ Invitation updated:", updateData);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Invitation email sent successfully',
          email_id: emailResult.id 
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    } else {
      console.log('⚠️ No RESEND_API_KEY found - running in simulation mode');
      // No Resend API key - simulate email sending for testing
      const { error: updateError, data: updateData } = await supabaseClient
        .from('invitations')
        .update({
          email_sent_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
        .eq('id', invitation_id)
        .select();

      if (updateError) {
        console.error("❌ Failed to update invitation record:", updateError);
      } else {
        console.log("✅ Invitation updated:", updateData);
      }

      return new Response(
        JSON.stringify({ 
          success: true, 
          message: 'Email sending simulated successfully (no RESEND_API_KEY configured)',
          test_mode: true,
          invitation_url: invitationUrl
        }),
        {
          headers: { ...corsHeaders, 'Content-Type': 'application/json' },
          status: 200,
        }
      )
    }

  } catch (error) {
    console.error('Error sending invitation:', error)
    return new Response(
      JSON.stringify({ 
        error: error.message,
        success: false 
      }),
      {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
        status: 400,
      }
    )
  }
})
