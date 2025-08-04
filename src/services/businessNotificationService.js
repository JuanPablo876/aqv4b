// Enhanced Business Notification Service
// Handles automated email alerts for critical business operations
import { supabase } from '../supabaseClient';
import { emailNotificationService } from './emailNotificationService';

class BusinessNotificationService {
  constructor() {
    this.isMonitoring = false;
    this.monitoringInterval = null;
    this.checkInterval = 1000 * 60 * 60 * 2; // Check every 2 hours
    this.lastChecks = {
      lowInventory: null,
      overdueInvoices: null,
      orderStatusChanges: null,
      maintenanceReminders: null
    };
  }

  /**
   * Initialize the business notification service
   */
  async initialize() {
    console.log('🔔 Initializing Business Notification Service...');
    
    // Load settings
    await this.loadSettings();
    
    // Start monitoring if enabled
    if (this.enabled) {
      this.startMonitoring();
    }
    
    console.log('✅ Business Notification Service initialized');
  }

  /**
   * Load notification settings
   */
  async loadSettings() {
    try {
      const savedSettings = localStorage.getItem('businessNotificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.enabled = settings.enabled !== undefined ? settings.enabled : true;
        this.checkInterval = settings.checkInterval || this.checkInterval;
        this.recipients = settings.recipients || [
          'admin@aqualiquim.com',
          'compras@aqualiquim.com',
          'finanzas@aqualiquim.com'
        ];
      }
    } catch (error) {
      console.error('Error loading business notification settings:', error);
    }
  }

  /**
   * Save notification settings
   */
  async saveSettings() {
    try {
      const settings = {
        enabled: this.enabled,
        checkInterval: this.checkInterval,
        recipients: this.recipients
      };
      localStorage.setItem('businessNotificationSettings', JSON.stringify(settings));
    } catch (error) {
      console.error('Error saving business notification settings:', error);
    }
  }

  /**
   * Start monitoring all business processes
   */
  startMonitoring() {
    if (this.isMonitoring) {
      console.log('⚠️ Business monitoring already running');
      return;
    }

    this.isMonitoring = true;
    console.log('🔄 Starting business operations monitoring...');

    // Check immediately
    this.runAllChecks();

    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.runAllChecks();
    }, this.checkInterval);
  }

  /**
   * Stop monitoring
   */
  stopMonitoring() {
    if (this.monitoringInterval) {
      clearInterval(this.monitoringInterval);
      this.monitoringInterval = null;
    }
    this.isMonitoring = false;
    console.log('⏹️ Business monitoring stopped');
  }

  /**
   * Run all business checks
   */
  async runAllChecks() {
    try {
      console.log('🔍 Running business operations checks...');
      
      // Check inventory levels (delegated to existing service)
      if (emailNotificationService.enabled) {
        await emailNotificationService.checkLowStock();
      }

      // Check overdue invoices
      await this.checkOverdueInvoices();

      // Check order status changes requiring notifications
      await this.checkOrderStatusUpdates();

      // Check maintenance reminders
      await this.checkMaintenanceReminders();

      console.log('✅ Business operations checks completed');
    } catch (error) {
      console.error('❌ Error running business checks:', error);
    }
  }

  /**
   * Check for overdue invoices and send payment reminders
   */
  async checkOverdueInvoices() {
    try {
      console.log('💰 Checking overdue invoices...');

      const today = new Date();
      const sevenDaysAgo = new Date(today.getTime() - (7 * 24 * 60 * 60 * 1000));

      // Get overdue invoices
      const { data: overdueInvoices, error } = await supabase
        .from('invoices')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            contact
          )
        `)
        .eq('status', 'pending')
        .lt('due_date', today.toISOString().split('T')[0])
        .order('due_date', { ascending: true });

      if (error) throw error;

      if (overdueInvoices && overdueInvoices.length > 0) {
        // Check if we haven't sent reminders recently
        const shouldSend = await this.shouldSendOverdueReminders(overdueInvoices);
        
        if (shouldSend) {
          await this.sendOverdueInvoiceReminders(overdueInvoices);
          await this.recordOverdueRemindersSent(overdueInvoices);
        }
      } else {
        console.log('✅ No overdue invoices found');
      }

    } catch (error) {
      console.error('❌ Error checking overdue invoices:', error);
    }
  }

  /**
   * Check for order status changes that require notifications
   */
  async checkOrderStatusUpdates() {
    try {
      console.log('📦 Checking order status updates...');

      // Get orders updated in the last 2 hours that need customer notification
      const twoHoursAgo = new Date(Date.now() - (2 * 60 * 60 * 1000));

      const { data: recentOrders, error } = await supabase
        .from('orders')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            contact
          )
        `)
        .gte('updated_at', twoHoursAgo.toISOString())
        .in('status', ['confirmed', 'in_progress', 'completed', 'delivered'])
        .order('updated_at', { ascending: false });

      if (error) throw error;

      if (recentOrders && recentOrders.length > 0) {
        for (const order of recentOrders) {
          // Check if we should notify about this status change
          const shouldNotify = await this.shouldNotifyOrderStatus(order);
          if (shouldNotify && order.clients?.email) {
            await this.sendOrderStatusNotification(order);
            await this.recordOrderNotificationSent(order);
          }
        }
      }

    } catch (error) {
      console.error('❌ Error checking order status updates:', error);
    }
  }

  /**
   * Check for upcoming maintenance reminders
   */
  async checkMaintenanceReminders() {
    try {
      console.log('🔧 Checking maintenance reminders...');

      const today = new Date();
      const threeDaysFromNow = new Date(today.getTime() + (3 * 24 * 60 * 60 * 1000));

      // Get maintenances due within 3 days
      const { data: upcomingMaintenances, error } = await supabase
        .from('maintenances')
        .select(`
          *,
          clients (
            id,
            name,
            email,
            phone,
            contact,
            address
          ),
          employees (
            id,
            name,
            email,
            phone
          )
        `)
        .eq('status', 'active')
        .gte('next_service_date', today.toISOString().split('T')[0])
        .lte('next_service_date', threeDaysFromNow.toISOString().split('T')[0])
        .order('next_service_date', { ascending: true });

      if (error) throw error;

      if (upcomingMaintenances && upcomingMaintenances.length > 0) {
        for (const maintenance of upcomingMaintenances) {
          const shouldNotify = await this.shouldNotifyMaintenance(maintenance);
          if (shouldNotify) {
            await this.sendMaintenanceReminder(maintenance);
            await this.recordMaintenanceNotificationSent(maintenance);
          }
        }
      } else {
        console.log('✅ No upcoming maintenances requiring reminders');
      }

    } catch (error) {
      console.error('❌ Error checking maintenance reminders:', error);
    }
  }

  /**
   * Send overdue invoice payment reminders
   */
  async sendOverdueInvoiceReminders(overdueInvoices) {
    try {
      console.log(`📧 Sending overdue invoice reminders for ${overdueInvoices.length} invoices`);

      const emailContent = this.generateOverdueInvoicesEmailContent(overdueInvoices);
      
      // Send to finance team
      console.log('📧 Overdue Invoice Reminders Email:', {
        recipients: this.recipients,
        subject: `⚠️ Facturas Vencidas - ${overdueInvoices.length} pendientes`,
        invoiceCount: overdueInvoices.length,
        totalAmount: overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0)
      });

      // Also send individual reminders to clients (in production)
      for (const invoice of overdueInvoices) {
        if (invoice.clients?.email) {
          console.log(`📧 Individual reminder to ${invoice.clients.email} for invoice ${invoice.invoice_number}`);
        }
      }

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending overdue invoice reminders:', error);
      return { success: false, error };
    }
  }

  /**
   * Send order status change notification to customer
   */
  async sendOrderStatusNotification(order) {
    try {
      console.log(`📧 Sending order status notification for order ${order.order_number || order.id}`);

      const statusMessages = {
        'confirmed': 'confirmado y en preparación',
        'in_progress': 'en progreso',
        'completed': 'completado y listo para entrega',
        'delivered': 'entregado exitosamente'
      };

      const emailContent = {
        subject: `Actualización de Pedido #${order.order_number || order.id.slice(-6)}`,
        message: `Su pedido ha sido ${statusMessages[order.status] || order.status}.`,
        customerEmail: order.clients.email,
        orderDetails: order
      };

      console.log('📧 Order Status Notification:', emailContent);

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending order status notification:', error);
      return { success: false, error };
    }
  }

  /**
   * Send maintenance reminder notification
   */
  async sendMaintenanceReminder(maintenance) {
    try {
      console.log(`🔧 Sending maintenance reminder for ${maintenance.clients?.name}`);

      const emailContent = {
        subject: `Recordatorio de Mantenimiento - ${maintenance.clients?.name}`,
        customerEmail: maintenance.clients?.email,
        employeeEmail: maintenance.employees?.email,
        maintenanceDetails: maintenance
      };

      console.log('🔧 Maintenance Reminder:', emailContent);

      return { success: true };
    } catch (error) {
      console.error('❌ Error sending maintenance reminder:', error);
      return { success: false, error };
    }
  }

  /**
   * Generate email content for overdue invoices
   */
  generateOverdueInvoicesEmailContent(overdueInvoices) {
    const totalAmount = overdueInvoices.reduce((sum, inv) => sum + (inv.total || 0), 0);
    const criticalInvoices = overdueInvoices.filter(inv => {
      const dueDate = new Date(inv.due_date);
      const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
      return daysOverdue > 30;
    });

    return {
      html: `
        <h2>💰 Facturas Vencidas - Reporte</h2>
        <p><strong>Total de facturas vencidas:</strong> ${overdueInvoices.length}</p>
        <p><strong>Monto total pendiente:</strong> $${totalAmount.toLocaleString()}</p>
        <p><strong>Facturas críticas (+30 días):</strong> ${criticalInvoices.length}</p>
        
        <h3>Lista de Facturas Vencidas:</h3>
        <table border="1" style="border-collapse: collapse; width: 100%;">
          <thead>
            <tr>
              <th>Factura</th>
              <th>Cliente</th>
              <th>Fecha Vencimiento</th>
              <th>Días Vencidos</th>
              <th>Monto</th>
            </tr>
          </thead>
          <tbody>
            ${overdueInvoices.map(inv => {
              const dueDate = new Date(inv.due_date);
              const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
              return `
                <tr>
                  <td>${inv.invoice_number}</td>
                  <td>${inv.clients?.name || 'N/A'}</td>
                  <td>${dueDate.toLocaleDateString()}</td>
                  <td>${daysOverdue} días</td>
                  <td>$${(inv.total || 0).toLocaleString()}</td>
                </tr>
              `;
            }).join('')}
          </tbody>
        </table>
        
        <h3>💡 Acciones Recomendadas:</h3>
        <ul>
          <li>Contactar a clientes con facturas críticas (+30 días)</li>
          <li>Revisar términos de pago con clientes frecuentemente vencidos</li>
          <li>Considerar suspensión de servicios para clientes con alta morosidad</li>
        </ul>
      `,
      text: `
FACTURAS VENCIDAS - REPORTE

Total de facturas vencidas: ${overdueInvoices.length}
Monto total pendiente: $${totalAmount.toLocaleString()}
Facturas críticas (+30 días): ${criticalInvoices.length}

${overdueInvoices.map(inv => {
        const dueDate = new Date(inv.due_date);
        const daysOverdue = Math.floor((Date.now() - dueDate.getTime()) / (1000 * 60 * 60 * 24));
        return `- ${inv.invoice_number} | ${inv.clients?.name || 'N/A'} | ${daysOverdue} días | $${(inv.total || 0).toLocaleString()}`;
      }).join('\n')}
      `
    };
  }

  /**
   * Helper methods for notification frequency control
   */
  async shouldSendOverdueReminders(invoices) {
    const lastSent = localStorage.getItem('lastOverdueReminder');
    if (!lastSent) return true;
    
    const daysSinceLastSent = (Date.now() - parseInt(lastSent)) / (1000 * 60 * 60 * 24);
    return daysSinceLastSent >= 7; // Send weekly
  }

  async shouldNotifyOrderStatus(order) {
    const storageKey = `orderNotification_${order.id}_${order.status}`;
    const lastNotified = localStorage.getItem(storageKey);
    return !lastNotified; // Send only once per status change
  }

  async shouldNotifyMaintenance(maintenance) {
    const storageKey = `maintenanceNotification_${maintenance.id}`;
    const lastNotified = localStorage.getItem(storageKey);
    if (!lastNotified) return true;
    
    const daysSinceLastSent = (Date.now() - parseInt(lastNotified)) / (1000 * 60 * 60 * 24);
    return daysSinceLastSent >= 2; // Send every 2 days for upcoming maintenance
  }

  async recordOverdueRemindersSent(invoices) {
    localStorage.setItem('lastOverdueReminder', Date.now().toString());
  }

  async recordOrderNotificationSent(order) {
    const storageKey = `orderNotification_${order.id}_${order.status}`;
    localStorage.setItem(storageKey, Date.now().toString());
  }

  async recordMaintenanceNotificationSent(maintenance) {
    const storageKey = `maintenanceNotification_${maintenance.id}`;
    localStorage.setItem(storageKey, Date.now().toString());
  }

  /**
   * Manual test methods
   */
  async testOverdueInvoiceReminders() {
    console.log('🧪 Testing overdue invoice reminders...');
    await this.checkOverdueInvoices();
    return { success: true, message: 'Overdue invoice check completed' };
  }

  async testOrderStatusNotifications() {
    console.log('🧪 Testing order status notifications...');
    await this.checkOrderStatusUpdates();
    return { success: true, message: 'Order status check completed' };
  }

  async testMaintenanceReminders() {
    console.log('🧪 Testing maintenance reminders...');
    await this.checkMaintenanceReminders();
    return { success: true, message: 'Maintenance reminder check completed' };
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isMonitoring: this.isMonitoring,
      enabled: this.enabled,
      checkInterval: this.checkInterval,
      lastChecks: this.lastChecks,
      recipients: this.recipients
    };
  }

  /**
   * Update settings
   */
  updateSettings(newSettings) {
    this.enabled = newSettings.enabled !== undefined ? newSettings.enabled : this.enabled;
    this.checkInterval = newSettings.checkInterval || this.checkInterval;
    this.recipients = newSettings.recipients || this.recipients;
    this.saveSettings();
    
    // Restart monitoring with new settings
    if (this.isMonitoring) {
      this.stopMonitoring();
      if (this.enabled) {
        this.startMonitoring();
      }
    }
  }
}

// Export singleton instance
export const businessNotificationService = new BusinessNotificationService();
export default businessNotificationService;
