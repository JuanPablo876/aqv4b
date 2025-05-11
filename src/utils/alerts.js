// Utility functions for simulating alerts
import { formatDate } from './storage'; // Import formatDate

// Simulate sending an email
const sendEmailAlert = (to, subject, body) => {
  console.log("--- Simulando Envío de Email ---");
  console.log("Para:", to);
  console.log("Asunto:", subject);
  console.log("Cuerpo:", body);
  console.log("------------------------------");
  // In a real application, you would use an email sending library or API here
};

// Simulate sending a WhatsApp message
const sendWhatsAppAlert = (to, message) => {
  console.log("--- Simulando Envío de WhatsApp ---");
  console.log("Para:", to);
  console.log("Mensaje:", message);
  console.log("---------------------------------");
  // In a real application, you would use a WhatsApp API here
};

// Alert for new order (to warehouse and delivery employee)
const alertNewOrder = (order, client, employee) => {
  // Alert Warehouse
  sendEmailAlert(
    "almacen@aqualiquim.com",
    `Nuevo Pedido #${order.id} para Preparar`,
    `Se ha generado un nuevo pedido:\n\n` +
    `# Pedido: ${order.id}\n` +
    `Cliente: ${client.name}\n` +
    `Domicilio de Entrega: ${order.delivery?.address || 'Venta en Mostrador'}\n` +
    `Contenido del Pedido:\n` +
    order.items.map(item => `- ${item.quantity} x ${item.productName}`).join('\n') +
    `\nNotas: ${order.notes || 'Sin notas'}`
  );

  // Alert Delivery Employee (if assigned and delivery is needed)
  if (employee && order.delivery) {
    const emailBody = `Tienes una nueva entrega asignada:\n\n` +
                      `# Pedido: ${order.id}\n` +
                      `Cliente: ${client.name}\n` +
                      `Teléfono Cliente: ${client.phone || 'N/A'}\n` +
                      `Domicilio de Entrega: ${order.delivery.address}\n` +
                      `Enlace Google Maps: ${order.delivery.googleMapsLink || 'N/A'}\n` +
                      `Horario Sugerido: ${order.delivery.time || 'No especificado'}\n` +
                      `Contenido del Pedido:\n` +
                      order.items.map(item => `- ${item.quantity} x ${item.productName}`).join('\n') +
                      `\nNotas del Pedido: ${order.notes || 'Sin notas'}`;

    sendEmailAlert(
      employee.email,
      `Nueva Entrega Asignada: Pedido #${order.id}`,
      emailBody
    );

    // Simulate WhatsApp message (simplified)
    const whatsappMessage = `¡Hola ${employee.name}! Tienes una nueva entrega asignada para el Pedido #${order.id}. Cliente: ${client.name}. Domicilio: ${order.delivery.address}. Horario: ${order.delivery.time || 'No especificado'}. Ver en Maps: ${order.delivery.googleMapsLink || 'N/A'}.`;
    sendWhatsAppAlert(employee.phone, whatsappMessage);
  }
};

// Alert for upcoming maintenance (to employee)
const alertUpcomingMaintenance = (maintenance, client, employee) => {
   if (employee) {
    const emailBody = `Tienes un mantenimiento programado:\n\n` +
                      `Cliente: ${client.name}\n` +
                      `Tipo de Servicio: ${maintenance.serviceType}\n` +
                      `Fecha Programada: ${formatDate(maintenance.lastServiceDate)}\n` + // Assuming lastServiceDate is the next scheduled date for simplicity
                      `Domicilio: ${maintenance.address}\n` +
                      `Enlace Google Maps: ${maintenance.googleMapsLink || 'N/A'}\n` +
                      `Notas: ${maintenance.notes || 'Sin notas'}`;

    sendEmailAlert(
      employee.email,
      `Mantenimiento Programado: ${maintenance.serviceType} para ${client.name}`,
      emailBody
    );

    // Simulate WhatsApp message (simplified)
    const whatsappMessage = `¡Hola ${employee.name}! Tienes un mantenimiento programado para ${client.name} el ${formatDate(maintenance.lastServiceDate)}. Servicio: ${maintenance.serviceType}. Domicilio: ${maintenance.address}. Ver en Maps: ${maintenance.googleMapsLink || 'N/A'}.`;
    sendWhatsAppAlert(employee.phone, whatsappMessage);
   }
};


export { alertNewOrder, alertUpcomingMaintenance };
// DONE