import { useEffect, useRef } from 'react';
import { useNotifications } from '../contexts/NotificationContext';
import { useData } from './useData';

/**
 * Hook for generating business event notifications based on data changes
 * Monitors orders, inventory, invoices, and maintenances for business-critical events
 */
export const useBusinessNotifications = () => {
  const { notify } = useNotifications();
  
  // Data hooks
  const { data: orders = [] } = useData('orders');
  const { data: inventory = [] } = useData('inventory');
  const { data: products = [] } = useData('products');
  const { data: invoices = [] } = useData('invoices');
  const { data: maintenances = [] } = useData('maintenances');
  const { data: clients = [] } = useData('clients');
  
  // Track previous states to detect changes
  const previousDataRef = useRef({
    orders: [],
    inventory: [],
    invoices: [],
    maintenances: []
  });

  // Check for new orders
  useEffect(() => {
    if (orders.length > 0 && previousDataRef.current.orders.length > 0) {
      const newOrders = orders.filter(order => 
        !previousDataRef.current.orders.find(prevOrder => prevOrder.id === order.id)
      );
      
      newOrders.forEach(order => {
        const client = clients.find(c => c.id === order.client_id);
        notify.success(
          `Nuevo pedido #${order.order_number || order.id.slice(-6)} de ${client?.name || 'Cliente'}`,
          {
            title: 'Nuevo Pedido',
            persistent: true,
            metadata: {
              type: 'new_order',
              orderId: order.id,
              clientId: order.client_id,
              total: order.total
            },
            actions: [
              {
                label: 'Ver Pedido',
                primary: true,
                handler: () => {
                  // Navigate to order details

                }
              }
            ]
          }
        );
      });
    }
    
    // Update previous orders
    previousDataRef.current.orders = [...orders];
  }, [orders, clients, notify]);

  // Check for order status changes
  useEffect(() => {
    if (orders.length > 0 && previousDataRef.current.orders.length > 0) {
      orders.forEach(order => {
        const prevOrder = previousDataRef.current.orders.find(prev => prev.id === order.id);
        if (prevOrder && prevOrder.status !== order.status) {
          const client = clients.find(c => c.id === order.client_id);
          const statusMessages = {
            'confirmed': 'confirmado',
            'in_progress': 'en progreso',
            'completed': 'completado',
            'cancelled': 'cancelado',
            'delivered': 'entregado'
          };
          
          const statusType = order.status === 'completed' || order.status === 'delivered' ? 'success' : 'info';
          const notificationMethod = statusType === 'success' ? notify.success : notify.info;
          
          notificationMethod(
            `Pedido #${order.order_number || order.id.slice(-6)} ${statusMessages[order.status] || order.status}`,
            {
              title: 'Estado de Pedido Actualizado',
              metadata: {
                type: 'order_status_change',
                orderId: order.id,
                oldStatus: prevOrder.status,
                newStatus: order.status,
                clientName: client?.name
              }
            }
          );
        }
      });
    }
  }, [orders, clients, notify]);

  // Check for low inventory alerts
  useEffect(() => {
    if (inventory.length > 0 && products.length > 0) {
      const lowStockItems = inventory.filter(item => {
        const product = products.find(p => p.id === item.product_id);
        return product && item.quantity <= (product.min_stock || 5);
      });

      // Only notify for critically low items (at or below minimum)
      const criticalItems = lowStockItems.filter(item => {
        const product = products.find(p => p.id === item.product_id);
        return item.quantity <= (product.min_stock || 0);
      });

      criticalItems.forEach(item => {
        const product = products.find(p => p.id === item.product_id);
        if (product) {
          // Check if we haven't already notified about this item recently
          const storageKey = `inventory_alert_${item.id}`;
          const lastNotified = localStorage.getItem(storageKey);
          const hoursSinceLastNotification = lastNotified 
            ? (Date.now() - parseInt(lastNotified)) / (1000 * 60 * 60)
            : 24; // Assume 24 hours if no previous notification

          // Only notify once every 12 hours for the same item
          if (hoursSinceLastNotification >= 12) {
            const alertType = item.quantity === 0 ? 'error' : 'warning';
            const notificationMethod = item.quantity === 0 ? notify.error : notify.warning;
            
            notificationMethod(
              `${product.name} ${item.quantity === 0 ? 'agotado' : 'stock bajo'} (${item.quantity} unidades)`,
              {
                title: 'Alerta de Inventario',
                persistent: true,
                metadata: {
                  type: 'inventory_alert',
                  productId: product.id,
                  currentStock: item.quantity,
                  minStock: product.min_stock || 5,
                  severity: item.quantity === 0 ? 'critical' : 'warning'
                },
                actions: [
                  {
                    label: 'Ver Inventario',
                    primary: true,
                    handler: () => {

                    }
                  }
                ]
              }
            );

            // Record that we notified about this item
            localStorage.setItem(storageKey, Date.now().toString());
          }
        }
      });
    }
  }, [inventory, products, notify]);

  // Check for overdue invoices
  useEffect(() => {
    if (invoices.length > 0 && clients.length > 0) {
      const today = new Date();
      const overdueInvoices = invoices.filter(invoice => {
        if (invoice.status === 'paid' || !invoice.due_date) return false;
        
        const dueDate = new Date(invoice.due_date);
        return dueDate < today;
      });

      overdueInvoices.forEach(invoice => {
        const client = clients.find(c => c.id === invoice.client_id);
        const daysPastDue = Math.floor((today - new Date(invoice.due_date)) / (1000 * 60 * 60 * 24));
        
        // Check if we haven't notified about this invoice recently
        const storageKey = `overdue_invoice_${invoice.id}`;
        const lastNotified = localStorage.getItem(storageKey);
        const daysSinceLastNotification = lastNotified 
          ? (Date.now() - parseInt(lastNotified)) / (1000 * 60 * 60 * 24)
          : 7; // Assume 7 days if no previous notification

        // Notify every 7 days for overdue invoices
        if (daysSinceLastNotification >= 7) {
          notify.warning(
            `Factura ${invoice.invoice_number} vencida hace ${daysPastDue} días`,
            {
              title: 'Factura Vencida',
              persistent: true,
              metadata: {
                type: 'overdue_invoice',
                invoiceId: invoice.id,
                clientId: invoice.client_id,
                clientName: client?.name,
                daysPastDue,
                amount: invoice.total
              },
              actions: [
                {
                  label: 'Ver Factura',
                  primary: true,
                  handler: () => {

                  }
                }
              ]
            }
          );

          localStorage.setItem(storageKey, Date.now().toString());
        }
      });
    }
  }, [invoices, clients, notify]);

  // Check for upcoming maintenance
  useEffect(() => {
    if (maintenances.length > 0 && clients.length > 0) {
      const today = new Date();
      const upcomingMaintenances = maintenances.filter(maintenance => {
        if (maintenance.status !== 'active' || !maintenance.next_service_date) return false;
        
        const nextServiceDate = new Date(maintenance.next_service_date);
        const daysUntilService = Math.floor((nextServiceDate - today) / (1000 * 60 * 60 * 24));
        
        // Alert for maintenances due within 7 days
        return daysUntilService >= 0 && daysUntilService <= 7;
      });

      upcomingMaintenances.forEach(maintenance => {
        const client = clients.find(c => c.id === maintenance.client_id);
        const daysUntilService = Math.floor((new Date(maintenance.next_service_date) - today) / (1000 * 60 * 60 * 24));
        
        // Check if we haven't notified about this maintenance recently
        const storageKey = `upcoming_maintenance_${maintenance.id}`;
        const lastNotified = localStorage.getItem(storageKey);
        const daysSinceLastNotification = lastNotified 
          ? (Date.now() - parseInt(lastNotified)) / (1000 * 60 * 60 * 24)
          : 3; // Assume 3 days if no previous notification

        // Notify every 3 days for upcoming maintenance
        if (daysSinceLastNotification >= 3) {
          const urgency = daysUntilService <= 1 ? 'warning' : 'info';
          const notificationMethod = urgency === 'warning' ? notify.warning : notify.info;
          
          notificationMethod(
            `Mantenimiento programado ${daysUntilService === 0 ? 'hoy' : `en ${daysUntilService} días`} para ${client?.name || 'cliente'}`,
            {
              title: 'Mantenimiento Próximo',
              persistent: true,
              metadata: {
                type: 'upcoming_maintenance',
                maintenanceId: maintenance.id,
                clientId: maintenance.client_id,
                clientName: client?.name,
                daysUntilService,
                serviceType: maintenance.service_type
              },
              actions: [
                {
                  label: 'Ver Mantenimiento',
                  primary: true,
                  handler: () => {

                  }
                }
              ]
            }
          );

          localStorage.setItem(storageKey, Date.now().toString());
        }
      });
    }
  }, [maintenances, clients, notify]);

  return {
    // No return values needed - this hook manages notifications internally
  };
};
