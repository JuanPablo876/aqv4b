// Supabase Edge Function to send quote emails
// This should be deployed to Supabase Edge Functions

import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
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
    console.log('📧 Processing quote email request...');
    
    const { 
      clientEmail, 
      clientName, 
      quote, 
      quoteItems 
    } = await req.json()

    if (!clientEmail) {
      throw new Error('Client email is required')
    }

    if (!RESEND_API_KEY) {
      console.error('❌ RESEND_API_KEY not found in environment variables')
      throw new Error('Email service not configured')
    }

    // Generate quote items HTML
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount);
    };

    const formatDate = (dateString) => {
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      });
    };

    const itemsHtml = quoteItems?.map(item => `
      <tr>
        <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.product_name || 'Producto'}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
        <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
      </tr>
    `).join('') || '';

    // Create professional email HTML
    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Cotización - Aqualiquim</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; }
          .header { background: linear-gradient(135deg, #7c3aed, #a855f7); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #ffffff; padding: 30px; border: 1px solid #e5e7eb; border-radius: 0 0 10px 10px; }
          .quote-info { background: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0; }
          .items-table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          .items-table th { background: #f8f9fa; padding: 12px; text-align: left; border-bottom: 2px solid #ddd; font-weight: bold; }
          .items-table td { padding: 12px; border-bottom: 1px solid #ddd; }
          .total-row { background: #f8f9fa; font-weight: bold; font-size: 18px; }
          .notes { background: #fef3cd; border-left: 4px solid #fbbf24; padding: 15px; margin: 20px 0; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; border-top: 1px solid #e5e7eb; padding-top: 20px; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🏊‍♂️ Aqualiquim</h1>
            <p>Cotización Profesional</p>
          </div>
          <div class="content">
            <h2 style="color: #7c3aed; margin-top: 0;">Cotización ${quote.quote_number || `#${quote.id?.toString().slice(-6)}`}</h2>
            
            <div class="quote-info">
              <p><strong>📅 Fecha:</strong> ${formatDate(quote.date || quote.created_at)}</p>
              <p><strong>⏳ Válida hasta:</strong> ${quote.valid_until ? formatDate(quote.valid_until) : 'No especificada'}</p>
              <p><strong>👤 Cliente:</strong> ${clientName}</p>
              <p><strong>📄 Estado:</strong> ${quote.status || 'Pendiente'}</p>
            </div>

            ${quoteItems && quoteItems.length > 0 ? `
            <h3 style="color: #7c3aed;">Productos y Servicios</h3>
            <table class="items-table">
              <thead>
                <tr>
                  <th>Producto</th>
                  <th style="text-align: center;">Cantidad</th>
                  <th style="text-align: right;">Precio Unitario</th>
                  <th style="text-align: right;">Subtotal</th>
                </tr>
              </thead>
              <tbody>
                ${itemsHtml}
              </tbody>
              <tfoot>
                <tr class="total-row">
                  <td colspan="3" style="text-align: right; padding: 15px;">Total:</td>
                  <td style="text-align: right; padding: 15px; color: #16a34a;">
                    ${formatCurrency(quote.total)}
                  </td>
                </tr>
              </tfoot>
            </table>
            ` : ''}

            ${quote.notes ? `
            <div class="notes">
              <p><strong>📝 Notas adicionales:</strong></p>
              <p>${quote.notes}</p>
            </div>
            ` : ''}

            <div style="background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0;">
              <h3 style="color: #0369a1; margin-top: 0;">💡 Información Importante</h3>
              <ul style="margin: 0; padding-left: 20px;">
                <li>Esta cotización es válida hasta la fecha especificada</li>
                <li>Los precios incluyen IVA cuando aplique</li>
                <li>Para proceder con el pedido, responda a este email</li>
                <li>Para consultas adicionales, contáctenos directamente</li>
              </ul>
            </div>

            <div style="text-align: center; margin-top: 30px;">
              <p style="color: #7c3aed; font-weight: bold; font-size: 16px;">¡Gracias por confiar en Aqualiquim!</p>
            </div>
          </div>
          
          <div class="footer">
            <p>© 2025 Aqualiquim - Sistema de Gestión</p>
            <p>Este email fue generado automáticamente desde nuestro sistema de cotizaciones</p>
            <p>Para cualquier consulta, responda a este email o contáctenos directamente</p>
          </div>
        </div>
      </body>
      </html>
    `;

    // Prepare email data for Resend API
    const emailData = {
      from: `Aqualiquim <${FROM_EMAIL}>`,
      to: [clientEmail],
      subject: `Cotización ${quote.quote_number || `#${quote.id?.toString().slice(-6)}`} - Aqualiquim`,
      html: emailHtml,
      // Text fallback
      text: `
Cotización ${quote.quote_number || `#${quote.id?.toString().slice(-6)}`}
Fecha: ${formatDate(quote.date || quote.created_at)}
Cliente: ${clientName}
Total: ${formatCurrency(quote.total)}

${quote.notes ? `Notas: ${quote.notes}` : ''}

Aqualiquim - Sistema de Gestión
      `.trim(),
      headers: {
        'X-Priority': '3', // Normal priority
        'X-MSMail-Priority': 'Normal'
      }
    }

    console.log('📧 Sending quote email via Resend API...', {
      to: clientEmail,
      subject: emailData.subject,
      quoteNumber: quote.quote_number || quote.id
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

    console.log('✅ Quote email sent successfully:', result.id)

    return new Response(
      JSON.stringify({
        success: true,
        emailId: result.id,
        message: 'Quote email sent successfully',
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
    console.error('❌ Error sending quote email:', error)
    
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
