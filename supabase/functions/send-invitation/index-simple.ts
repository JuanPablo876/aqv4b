import { serve } from "https://deno.land/std@0.168.0/http/server.ts"

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { 
      headers: { 
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'POST',
        'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type'
      } 
    })
  }

  try {
    const { email, role } = await req.json()
    const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
    const APP_URL = Deno.env.get('APP_URL') || 'http://localhost:3000'

    // Simple email with Resend
    const emailData = {
      from: 'noreply@yourdomain.com', // Replace with your domain
      to: [email],
      subject: 'You have been invited to join our team',
      html: `
        <h2>Team Invitation</h2>
        <p>You have been invited to join as a <strong>${role}</strong>.</p>
        <p><a href="${APP_URL}/accept-invitation" style="background: #007bff; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Accept Invitation</a></p>
      `
    }

    // Send email via Resend API
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${RESEND_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    const result = await response.json()

    if (!response.ok) {
      throw new Error(`Resend API error: ${result.message}`)
    }

    return new Response(
      JSON.stringify({ success: true, emailId: result.id }),
      { 
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        } 
      }
    )

  } catch (error) {
    return new Response(
      JSON.stringify({ error: error.message }),
      { 
        status: 500,
        headers: { 
          'Content-Type': 'application/json',
          'Access-Control-Allow-Origin': '*'
        }
      }
    )
  }
})
