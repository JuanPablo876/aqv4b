// Supabase Edge Function to send invitation emails
// This file should be deployed to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const SENDGRID_API_KEY = Deno.env.get('SENDGRID_API_KEY')
const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@aqualiquim.com'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req) => {
  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { to, role, invitationUrl, invitedBy } = await req.json()

    const emailData = {
      personalizations: [
        {
          to: [{ email: to }],
          subject: 'Invitación a Aqualiquim - Sistema de Gestión'
        }
      ],
      from: { email: FROM_EMAIL, name: 'Aqualiquim' },
      content: [
        {
          type: 'text/html',
          value: `
            <!DOCTYPE html>
            <html>
            <head>
              <meta charset="utf-8">
              <title>Invitación a Aqualiquim</title>
              <style>
                body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; }
                .container { max-width: 600px; margin: 0 auto; padding: 20px; }
                .header { background: linear-gradient(135deg, #1e3a8a, #3b82f6); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
                .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
                .button { display: inline-block; padding: 15px 30px; background: #3b82f6; color: white; text-decoration: none; border-radius: 8px; font-weight: bold; margin: 20px 0; }
                .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
              </style>
            </head>
            <body>
              <div class="container">
                <div class="header">
                  <h1>🏊‍♂️ Aqualiquim</h1>
                  <p>Sistema de Gestión Integral</p>
                </div>
                <div class="content">
                  <h2>¡Has sido invitado!</h2>
                  <p>Hola,</p>
                  <p><strong>${invitedBy}</strong> te ha invitado a unirte al sistema Aqualiquim como <strong>${role}</strong>.</p>
                  
                  <p>Con tu cuenta podrás acceder a:</p>
                  <ul>
                    <li>📊 Panel de control personalizado</li>
                    <li>👥 Gestión de clientes</li>
                    <li>📦 Control de inventario</li>
                    <li>💰 Seguimiento financiero</li>
                    <li>📋 Reportes y análisis</li>
                  </ul>
                  
                  <div style="text-align: center;">
                    <a href="${invitationUrl}" class="button">Aceptar Invitación</a>
                  </div>
                  
                  <p><strong>Importante:</strong> Esta invitación expira en 7 días.</p>
                  
                  <p>Si no solicitaste esta invitación, puedes ignorar este email.</p>
                </div>
                <div class="footer">
                  <p>© 2025 Aqualiquim - Sistema de Gestión</p>
                  <p>Este es un email automático, no responder.</p>
                </div>
              </div>
            </body>
            </html>
          `
        }
      ]
    }

    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${SENDGRID_API_KEY}`,
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(emailData)
    })

    if (!response.ok) {
      const error = await response.text()
      throw new Error(`SendGrid error: ${error}`)
    }

    return new Response(JSON.stringify({ success: true }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })

  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
