import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

// Global variables for token caching and reuse
let cachedAuthHeaders: Record<string, string> | null = null
let authCacheTimestamp = 0
const AUTH_CACHE_DURATION = 3600000 // 1 hour in milliseconds

// Initialize authentication headers and cache them
const initializeAuth = () => {
  const RESEND_API_KEY = Deno.env.get('RESEND_API_KEY')
  const FROM_EMAIL = Deno.env.get('FROM_EMAIL') || 'noreply@aqualiquim.mx'
  
  if (!RESEND_API_KEY) {
    throw new Error('RESEND_API_KEY is required')
  }

  // Cache the auth headers for reuse
  cachedAuthHeaders = {
    'Authorization': `Bearer ${RESEND_API_KEY}`,
    'Content-Type': 'application/json',
  }
  
  authCacheTimestamp = Date.now()
  
  console.log('🔧 Auth initialized and cached:', {
    hasResendKey: !!RESEND_API_KEY,
    fromEmail: FROM_EMAIL,
    cacheTime: new Date(authCacheTimestamp).toISOString()
  })

  return { RESEND_API_KEY, FROM_EMAIL }
}

// Get cached auth headers or initialize if needed
const getAuthHeaders = () => {
  const now = Date.now()
  
  // Check if cache is still valid
  if (cachedAuthHeaders && (now - authCacheTimestamp) < AUTH_CACHE_DURATION) {
    console.log('✅ Using cached auth headers')
    return cachedAuthHeaders
  }
  
  console.log('🔄 Auth cache expired or not initialized, refreshing...')
  initializeAuth()
  return cachedAuthHeaders!
}

// Reusable API client for making authenticated requests
const makeAuthenticatedRequest = async (url: string, data: any, method = 'POST') => {
  const headers = getAuthHeaders()
  
  console.log(`📡 Making ${method} request to:`, url)
  
  const response = await fetch(url, {
    method,
    headers,
    body: JSON.stringify(data)
  })

  const result = await response.json()
  
  if (!response.ok) {
    console.error(`❌ API request failed:`, result)
    throw new Error(`API request failed: ${result.message || 'Unknown error'}`)
  }

  return { response, result }
}

serve(async (req) => {
  console.log('🚀 Edge Function invoked:', req.method, req.url)

  // Handle CORS preflight requests
  if (req.method === 'OPTIONS') {
    console.log('✅ CORS preflight request handled')
    return new Response(null, {
      status: 200,
      headers: corsHeaders,
    })
  }

  try {
    console.log('📧 Processing quote email request')
    
    // Initialize or get cached auth - this only happens once per cache period
    let FROM_EMAIL: string
    try {
      const authConfig = initializeAuth()
      FROM_EMAIL = authConfig.FROM_EMAIL
    } catch (error) {
      console.error('❌ Auth initialization failed:', error.message)
      return new Response(JSON.stringify({
        success: false,
        error: 'Email service not configured'
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Parse request body
    const body = await req.json()
    const { clientEmail, clientName, quote, quoteItems } = body
    
    console.log('📋 Request data:', {
      hasEmail: !!clientEmail,
      hasName: !!clientName,
      hasQuote: !!quote,
      itemsCount: quoteItems?.length || 0
    })

    if (!clientEmail) {
      console.error('❌ Missing client email')
      return new Response(JSON.stringify({
        success: false,
        error: 'Client email is required'
      }), {
        status: 400,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    // Format currency
    const formatCurrency = (amount) => {
      return new Intl.NumberFormat('es-MX', {
        style: 'currency',
        currency: 'MXN'
      }).format(amount || 0)
    }

    // Format date
    const formatDate = (dateString) => {
      if (!dateString) return 'No especificada'
      return new Date(dateString).toLocaleDateString('es-MX', {
        year: 'numeric',
        month: 'long',
        day: 'numeric'
      })
    }

    // Generate quote number
    const quoteNumber = quote?.quote_number || `#${quote?.id?.toString().slice(-6) || 'TEMP'}`

    // Generate items HTML
    let itemsHtml = ''
    if (quoteItems && Array.isArray(quoteItems) && quoteItems.length > 0) {
      itemsHtml = quoteItems.map(item => `
        <tr>
          <td style="padding: 12px; border-bottom: 1px solid #ddd;">${item.product_name || 'Producto'}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity || 1}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
          <td style="padding: 12px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency((item.quantity || 1) * (item.price || 0))}</td>
        </tr>
      `).join('')
    }

    // Create email HTML
    const emailHtml = `
<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="utf-8">
  <meta name="viewport" content="width=device-width, initial-scale=1">
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
    .info-box { background: #f0f9ff; border: 1px solid #0ea5e9; border-radius: 8px; padding: 20px; margin: 30px 0; }
  </style>
</head>
<body>
  <div class="container">
    <div class="header">
      <h1>🏊‍♂️ Aqualiquim</h1>
      <p>Cotización Profesional</p>
    </div>
    <div class="content">
      <h2 style="color: #7c3aed; margin-top: 0;">Cotización ${quoteNumber}</h2>
      
      <div class="quote-info">
        <p><strong>📅 Fecha:</strong> ${formatDate(quote?.date || quote?.created_at)}</p>
        <p><strong>⏳ Válida hasta:</strong> ${formatDate(quote?.valid_until)}</p>
        <p><strong>👤 Cliente:</strong> ${clientName || 'Cliente'}</p>
        <p><strong>📄 Estado:</strong> ${quote?.status || 'Pendiente'}</p>
      </div>

      ${itemsHtml ? `
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
              ${formatCurrency(quote?.total)}
            </td>
          </tr>
        </tfoot>
      </table>
      ` : ''}

      ${quote?.notes ? `
      <div class="notes">
        <p><strong>📝 Notas adicionales:</strong></p>
        <p>${quote.notes}</p>
      </div>
      ` : ''}

      <div class="info-box">
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
      <p>Este email fue generado automáticamente</p>
    </div>
  </div>
</body>
</html>`

    // Email data for Resend
    const emailData = {
      from: `Aqualiquim <${FROM_EMAIL}>`,
      to: [clientEmail],
      subject: `Cotización ${quoteNumber} - Aqualiquim`,
      html: emailHtml,
      text: `
Cotización ${quoteNumber}
Fecha: ${formatDate(quote?.date || quote?.created_at)}
Cliente: ${clientName || 'Cliente'}
Total: ${formatCurrency(quote?.total)}

${quote?.notes ? `Notas: ${quote.notes}` : ''}

Aqualiquim - Sistema de Gestión
      `.trim()
    }

    console.log('📧 Sending email to:', clientEmail)

    // Send email via Resend API
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
      return new Response(JSON.stringify({
        success: false,
        error: `Email send failed: ${result.message || 'Unknown error'}`
      }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' }
      })
    }

    console.log('✅ Email sent successfully:', result.id)

    return new Response(JSON.stringify({
      success: true,
      emailId: result.id,
      message: 'Quote email sent successfully',
      timestamp: new Date().toISOString()
    }), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })

  } catch (error) {
    console.error('❌ Function error:', error)
    
    return new Response(JSON.stringify({
      success: false,
      error: error.message || 'Internal server error',
      timestamp: new Date().toISOString()
    }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' }
    })
  }
})
