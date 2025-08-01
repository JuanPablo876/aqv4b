// Email and Print utilities for orders, quotes, and invoices
import { formatCurrency, formatDate } from './storage';

// Email service integration (placeholder - replace with actual email service)
const sendEmail = async (emailData) => {
  try {
    // In a real app, this would integrate with an email service like:
    // - EmailJS
    // - SendGrid
    // - AWS SES
    // - Your backend email API
    
    console.log('📧 Email would be sent:', emailData);
    
    // Simulate email sending
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return { success: true, message: 'Email enviado exitosamente' };
  } catch (error) {
    console.error('Email sending failed:', error);
    return { success: false, message: 'Error al enviar email: ' + error.message };
  }
};

// Generate email content for orders
export const generateOrderEmail = (order, client, orderItems = []) => {
  const subject = `Pedido ${order.order_number || `#${order.id?.slice(-6)}`} - ${client.name}`;
  
  const itemsHtml = orderItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product_name || 'Producto'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');
  
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #2563eb; border-bottom: 2px solid #2563eb; padding-bottom: 10px;">
            Confirmación de Pedido
          </h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Número de Pedido:</strong> ${order.order_number || `#${order.id?.slice(-6)}`}</p>
            <p><strong>Fecha:</strong> ${formatDate(order.date || order.created_at)}</p>
            <p><strong>Cliente:</strong> ${client.name}</p>
            <p><strong>Estado:</strong> ${order.status || 'Pendiente'}</p>
          </div>
          
          ${orderItems.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left;">Producto</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: center;">Cantidad</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">Precio</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3" style="padding: 12px; border-top: 2px solid #ddd; text-align: right;">Total:</td>
                <td style="padding: 12px; border-top: 2px solid #ddd; text-align: right; color: #16a34a;">
                  ${formatCurrency(order.total)}
                </td>
              </tr>
            </tfoot>
          </table>
          ` : ''}
          
          ${order.notes ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2563eb;">
            <p><strong>Notas:</strong></p>
            <p>${order.notes}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <p>Gracias por su pedido. Nos pondremos en contacto pronto para confirmar los detalles.</p>
            <p>Para cualquier consulta, no dude en contactarnos.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return {
    to: client.email,
    subject,
    html: htmlContent,
    text: `Pedido ${order.order_number || `#${order.id?.slice(-6)}`}\nFecha: ${formatDate(order.date || order.created_at)}\nTotal: ${formatCurrency(order.total)}`
  };
};

// Generate email content for quotes
export const generateQuoteEmail = (quote, client, quoteItems = []) => {
  const subject = `Cotización ${quote.quote_number || `#${quote.id?.slice(-6)}`} - ${client.name}`;
  
  const itemsHtml = quoteItems.map(item => `
    <tr>
      <td style="padding: 8px; border-bottom: 1px solid #ddd;">${item.product_name || 'Producto'}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: center;">${item.quantity}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.price)}</td>
      <td style="padding: 8px; border-bottom: 1px solid #ddd; text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
    </tr>
  `).join('');
  
  const htmlContent = `
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333;">
        <div style="max-width: 600px; margin: 0 auto; padding: 20px;">
          <h2 style="color: #7c3aed; border-bottom: 2px solid #7c3aed; padding-bottom: 10px;">
            Cotización
          </h2>
          
          <div style="margin: 20px 0;">
            <p><strong>Número de Cotización:</strong> ${quote.quote_number || `#${quote.id?.slice(-6)}`}</p>
            <p><strong>Fecha:</strong> ${formatDate(quote.date || quote.created_at)}</p>
            <p><strong>Válida hasta:</strong> ${quote.valid_until ? formatDate(quote.valid_until) : 'No especificada'}</p>
            <p><strong>Cliente:</strong> ${client.name}</p>
          </div>
          
          ${quoteItems.length > 0 ? `
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
            <thead>
              <tr style="background-color: #f8f9fa;">
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: left;">Producto</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: center;">Cantidad</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">Precio</th>
                <th style="padding: 12px; border-bottom: 2px solid #ddd; text-align: right;">Subtotal</th>
              </tr>
            </thead>
            <tbody>
              ${itemsHtml}
            </tbody>
            <tfoot>
              <tr style="background-color: #f8f9fa; font-weight: bold;">
                <td colspan="3" style="padding: 12px; border-top: 2px solid #ddd; text-align: right;">Total:</td>
                <td style="padding: 12px; border-top: 2px solid #ddd; text-align: right; color: #16a34a;">
                  ${formatCurrency(quote.total)}
                </td>
              </tr>
            </tfoot>
          </table>
          ` : ''}
          
          ${quote.notes ? `
          <div style="margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #7c3aed;">
            <p><strong>Notas:</strong></p>
            <p>${quote.notes}</p>
          </div>
          ` : ''}
          
          <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px;">
            <p>Esta cotización es válida hasta ${quote.valid_until ? formatDate(quote.valid_until) : 'la fecha especificada'}.</p>
            <p>Para aceptar esta cotización o hacer consultas, no dude en contactarnos.</p>
          </div>
        </div>
      </body>
    </html>
  `;
  
  return {
    to: client.email,
    subject,
    html: htmlContent,
    text: `Cotización ${quote.quote_number || `#${quote.id?.slice(-6)}`}\nFecha: ${formatDate(quote.date || quote.created_at)}\nTotal: ${formatCurrency(quote.total)}`
  };
};

// Send order via email
export const sendOrderEmail = async (order, client, orderItems = []) => {
  if (!client.email) {
    return { success: false, message: 'El cliente no tiene email registrado' };
  }
  
  const emailData = generateOrderEmail(order, client, orderItems);
  return await sendEmail(emailData);
};

// Send quote via email
export const sendQuoteEmail = async (quote, client, quoteItems = []) => {
  if (!client.email) {
    return { success: false, message: 'El cliente no tiene email registrado' };
  }
  
  const emailData = generateQuoteEmail(quote, client, quoteItems);
  return await sendEmail(emailData);
};

// Print functionality
export const printOrder = (order, client, orderItems = []) => {
  const printContent = `
    <html>
      <head>
        <title>Pedido ${order.order_number || `#${order.id?.slice(-6)}`}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #2563eb; padding-bottom: 10px; margin-bottom: 20px; }
          .info-section { margin: 20px 0; }
          .info-section p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .total-row { background-color: #f8f9fa; font-weight: bold; }
          .notes { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #2563eb; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>PEDIDO</h1>
          <h2>${order.order_number || `#${order.id?.slice(-6)}`}</h2>
        </div>
        
        <div class="info-section">
          <p><strong>Fecha:</strong> ${formatDate(order.date || order.created_at)}</p>
          <p><strong>Cliente:</strong> ${client.name}</p>
          ${client.address ? `<p><strong>Dirección:</strong> ${client.address}</p>` : ''}
          ${client.phone ? `<p><strong>Teléfono:</strong> ${client.phone}</p>` : ''}
          ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
          <p><strong>Estado:</strong> ${order.status || 'Pendiente'}</p>
        </div>
        
        ${orderItems.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${orderItems.map(item => `
              <tr>
                <td>${item.product_name || 'Producto'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td style="text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total:</td>
              <td style="text-align: right; color: #16a34a;">${formatCurrency(order.total)}</td>
            </tr>
          </tfoot>
        </table>
        ` : ''}
        
        ${order.notes ? `
        <div class="notes">
          <p><strong>Notas:</strong></p>
          <p>${order.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 14px;">
          <p>Documento generado el ${formatDate(new Date())}</p>
        </div>
      </body>
    </html>
  `;
  
  // Open in new window and print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Auto-print after content loads
  setTimeout(() => {
    printWindow.print();
  }, 500);
};

// Print quote
export const printQuote = (quote, client, quoteItems = []) => {
  const printContent = `
    <html>
      <head>
        <title>Cotización ${quote.quote_number || `#${quote.id?.slice(-6)}`}</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 20px; }
          .header { text-align: center; border-bottom: 2px solid #7c3aed; padding-bottom: 10px; margin-bottom: 20px; }
          .info-section { margin: 20px 0; }
          .info-section p { margin: 5px 0; }
          table { width: 100%; border-collapse: collapse; margin: 20px 0; }
          th, td { padding: 12px; border-bottom: 1px solid #ddd; text-align: left; }
          th { background-color: #f8f9fa; font-weight: bold; }
          .total-row { background-color: #f8f9fa; font-weight: bold; }
          .notes { margin: 20px 0; padding: 15px; background-color: #f8f9fa; border-left: 4px solid #7c3aed; }
          @media print {
            body { margin: 0; }
            .no-print { display: none; }
          }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>COTIZACIÓN</h1>
          <h2>${quote.quote_number || `#${quote.id?.slice(-6)}`}</h2>
        </div>
        
        <div class="info-section">
          <p><strong>Fecha:</strong> ${formatDate(quote.date || quote.created_at)}</p>
          <p><strong>Válida hasta:</strong> ${quote.valid_until ? formatDate(quote.valid_until) : 'No especificada'}</p>
          <p><strong>Cliente:</strong> ${client.name}</p>
          ${client.address ? `<p><strong>Dirección:</strong> ${client.address}</p>` : ''}
          ${client.phone ? `<p><strong>Teléfono:</strong> ${client.phone}</p>` : ''}
          ${client.email ? `<p><strong>Email:</strong> ${client.email}</p>` : ''}
        </div>
        
        ${quoteItems.length > 0 ? `
        <table>
          <thead>
            <tr>
              <th>Producto</th>
              <th style="text-align: center;">Cantidad</th>
              <th style="text-align: right;">Precio</th>
              <th style="text-align: right;">Subtotal</th>
            </tr>
          </thead>
          <tbody>
            ${quoteItems.map(item => `
              <tr>
                <td>${item.product_name || 'Producto'}</td>
                <td style="text-align: center;">${item.quantity}</td>
                <td style="text-align: right;">${formatCurrency(item.price)}</td>
                <td style="text-align: right;">${formatCurrency(item.quantity * item.price)}</td>
              </tr>
            `).join('')}
          </tbody>
          <tfoot>
            <tr class="total-row">
              <td colspan="3" style="text-align: right;">Total:</td>
              <td style="text-align: right; color: #16a34a;">${formatCurrency(quote.total)}</td>
            </tr>
          </tfoot>
        </table>
        ` : ''}
        
        ${quote.notes ? `
        <div class="notes">
          <p><strong>Notas:</strong></p>
          <p>${quote.notes}</p>
        </div>
        ` : ''}
        
        <div style="margin-top: 50px; text-align: center; color: #666; font-size: 14px;">
          <p>Cotización válida hasta ${quote.valid_until ? formatDate(quote.valid_until) : 'la fecha especificada'}</p>
          <p>Documento generado el ${formatDate(new Date())}</p>
        </div>
      </body>
    </html>
  `;
  
  // Open in new window and print
  const printWindow = window.open('', '_blank');
  printWindow.document.write(printContent);
  printWindow.document.close();
  printWindow.focus();
  
  // Auto-print after content loads
  setTimeout(() => {
    printWindow.print();
  }, 500);
};
