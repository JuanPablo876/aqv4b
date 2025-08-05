// Email Notification Service for Low Stock Alerts
import { supabase } from '../supabaseClient';
import { getLowStockAlerts } from '../utils/inventoryManager';
import { formatDate, formatCurrency } from '../utils/storage';

class EmailNotificationService {
  constructor() {
    this.recipients = [
      'compras@hotelacapulco.com',
      'admin@aqualiquim.com'
    ];
    this.enabled = true;
    this.checkInterval = 1000 * 60 * 60 * 6; // Check every 6 hours
    this.lastCheck = null;
    this.isRunning = false;
  }

  /**
   * Initialize the notification service
   */
  async initialize() {

    
    // Load settings from localStorage or database
    await this.loadSettings();
    
    // Start the monitoring service if enabled
    if (this.enabled) {
      this.startMonitoring();
    }
    

  }

  /**
   * Load notification settings
   */
  async loadSettings() {
    try {
      // Try to load from localStorage first
      const savedSettings = localStorage.getItem('lowStockNotificationSettings');
      if (savedSettings) {
        const settings = JSON.parse(savedSettings);
        this.recipients = settings.recipients || this.recipients;
        this.enabled = settings.enabled !== undefined ? settings.enabled : this.enabled;
        this.checkInterval = settings.checkInterval || this.checkInterval;
      }

      // You could also load from database here if needed
      // const { data: settings } = await supabase
      //   .from('notification_settings')
      //   .select('*')
      //   .eq('type', 'low_stock')
      //   .single();

    } catch (error) {
      console.error('Error loading notification settings:', error);
    }
  }

  /**
   * Save notification settings
   */
  async saveSettings() {
    try {
      const settings = {
        recipients: this.recipients,
        enabled: this.enabled,
        checkInterval: this.checkInterval
      };
      
      localStorage.setItem('lowStockNotificationSettings', JSON.stringify(settings));

    } catch (error) {
      console.error('Error saving notification settings:', error);
    }
  }

  /**
   * Start monitoring inventory levels
   */
  startMonitoring() {
    if (this.isRunning) {

      return;
    }

    this.isRunning = true;


    // Check immediately
    this.checkLowStock();

    // Set up interval
    this.monitoringInterval = setInterval(() => {
      this.checkLowStock();
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
    this.isRunning = false;

  }

  /**
   * Check for low stock items and send notifications
   */
  async checkLowStock() {
    try {

      
      const lowStockItems = await getLowStockAlerts();
      
      if (lowStockItems && lowStockItems.length > 0) {

        
        // Check if we should send notification (avoid spam)
        const shouldSend = await this.shouldSendNotification(lowStockItems);
        
        if (shouldSend) {
          await this.sendLowStockNotification(lowStockItems);
          await this.recordNotificationSent(lowStockItems);
        }
      } else {

      }

      this.lastCheck = new Date();
    } catch (error) {
      console.error('❌ Error checking low stock:', error);
    }
  }

  /**
   * Determine if we should send notification to avoid spam
   */
  async shouldSendNotification(lowStockItems) {
    try {
      const today = new Date().toISOString().split('T')[0];
      
      // Check if we've already sent a notification today for these items
      const recentNotifications = JSON.parse(
        localStorage.getItem('recentLowStockNotifications') || '[]'
      );

      const todaysNotifications = recentNotifications.filter(
        notification => notification.date === today
      );

      // If we've already sent a notification today for the same items, don't send again
      if (todaysNotifications.length > 0) {
        const lastNotificationItems = todaysNotifications[todaysNotifications.length - 1].items;
        const currentItemIds = lowStockItems.map(item => item.productId).sort();
        const lastItemIds = lastNotificationItems.map(item => item.productId).sort();
        
        if (JSON.stringify(currentItemIds) === JSON.stringify(lastItemIds)) {

          return false;
        }
      }

      return true;
    } catch (error) {
      console.error('Error checking notification history:', error);
      return true; // Send notification if we can't check history
    }
  }

  /**
   * Record that notification was sent
   */
  async recordNotificationSent(lowStockItems) {
    try {
      const recentNotifications = JSON.parse(
        localStorage.getItem('recentLowStockNotifications') || '[]'
      );

      const notification = {
        date: new Date().toISOString().split('T')[0],
        timestamp: new Date().toISOString(),
        items: lowStockItems,
        recipients: this.recipients
      };

      recentNotifications.push(notification);

      // Keep only last 30 days of notifications
      const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000)
        .toISOString().split('T')[0];
      
      const filteredNotifications = recentNotifications.filter(
        n => n.date >= thirtyDaysAgo
      );

      localStorage.setItem('recentLowStockNotifications', 
        JSON.stringify(filteredNotifications));

    } catch (error) {
      console.error('Error recording notification:', error);
    }
  }

  /**
   * Send low stock notification email
   */
  async sendLowStockNotification(lowStockItems) {
    try {


      const emailContent = this.generateLowStockEmailContent(lowStockItems);
      
      // Simulate email sending (Edge Functions not configured for development)
      // console.log('📧 Email Details:', {
      //   recipients: this.recipients,
      //   subject: `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} productos`,
      //   itemCount: lowStockItems.length,
      //   items: lowStockItems.map(item => `${item.name} (Stock: ${item.stock})`).join(', ')
      // });
      
      // Simulate network delay
      await new Promise(resolve => setTimeout(resolve, 300));
      

      return { 
        success: true, 
        data: { 
          message: 'Email simulated in development mode',
          itemCount: lowStockItems.length,
          recipients: this.recipients
        } 
      };

    } catch (error) {
      console.error('❌ Error in sendLowStockNotification:', error);
      return { success: false, error };
    }
  }

  /**
   * Generate email content for low stock notification
   */
  generateLowStockEmailContent(lowStockItems) {
    const criticalItems = lowStockItems.filter(item => item.status === 'critical');
    const warningItems = lowStockItems.filter(item => item.status === 'warning');

    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="utf-8">
        <title>Alerta de Stock Bajo - Aqualiquim</title>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; margin: 0; padding: 20px; }
          .container { max-width: 800px; margin: 0 auto; }
          .header { background: linear-gradient(135deg, #dc2626, #ef4444); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
          .content { background: #f8fafc; padding: 30px; border-radius: 0 0 10px 10px; }
          .alert-section { margin: 20px 0; }
          .critical { border-left: 5px solid #dc2626; background: #fef2f2; padding: 15px; margin: 10px 0; }
          .warning { border-left: 5px solid #f59e0b; background: #fffbeb; padding: 15px; margin: 10px 0; }
          .item-table { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .item-table th, .item-table td { padding: 12px; text-align: left; border-bottom: 1px solid #ddd; }
          .item-table th { background: #f1f5f9; font-weight: bold; }
          .status-critical { color: #dc2626; font-weight: bold; }
          .status-warning { color: #f59e0b; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 14px; }
          .summary { background: #e0f2fe; padding: 20px; border-radius: 8px; margin: 20px 0; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="header">
            <h1>🚨 Alerta de Stock Bajo</h1>
            <p>Sistema de Gestión Aqualiquim</p>
          </div>
          
          <div class="content">
            <div class="summary">
              <h2>📊 Resumen de Alertas</h2>
              <p><strong>Total de productos con stock bajo:</strong> ${lowStockItems.length}</p>
              <p><strong>Productos en estado crítico:</strong> ${criticalItems.length} (sin stock)</p>
              <p><strong>Productos en estado de advertencia:</strong> ${warningItems.length} (stock bajo)</p>
              <p><strong>Fecha y hora:</strong> ${formatDate(new Date())}</p>
            </div>

            ${criticalItems.length > 0 ? `
              <div class="alert-section">
                <h3 style="color: #dc2626;">🚨 Productos sin Stock (Crítico)</h3>
                <table class="item-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Ubicación</th>
                      <th>Stock Actual</th>
                      <th>Stock Mínimo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${criticalItems.map(item => `
                      <tr>
                        <td><strong>${item.productName}</strong></td>
                        <td>${item.sku}</td>
                        <td>${item.location}</td>
                        <td class="status-critical">${item.currentStock}</td>
                        <td>${item.minStock}</td>
                        <td class="status-critical">SIN STOCK</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            ${warningItems.length > 0 ? `
              <div class="alert-section">
                <h3 style="color: #f59e0b;">⚠️ Productos con Stock Bajo</h3>
                <table class="item-table">
                  <thead>
                    <tr>
                      <th>Producto</th>
                      <th>SKU</th>
                      <th>Ubicación</th>
                      <th>Stock Actual</th>
                      <th>Stock Mínimo</th>
                      <th>Estado</th>
                    </tr>
                  </thead>
                  <tbody>
                    ${warningItems.map(item => `
                      <tr>
                        <td><strong>${item.productName}</strong></td>
                        <td>${item.sku}</td>
                        <td>${item.location}</td>
                        <td class="status-warning">${item.currentStock}</td>
                        <td>${item.minStock}</td>
                        <td class="status-warning">STOCK BAJO</td>
                      </tr>
                    `).join('')}
                  </tbody>
                </table>
              </div>
            ` : ''}

            <div style="background: #dbeafe; padding: 20px; border-radius: 8px; margin: 30px 0;">
              <h3>💡 Recomendaciones</h3>
              <ul>
                <li>Revisar y actualizar los niveles de stock mínimo según la demanda</li>
                <li>Contactar a proveedores para productos críticos inmediatamente</li>
                <li>Considerar pedidos de emergencia para productos sin stock</li>
                <li>Evaluar la rotación de productos para optimizar inventario</li>
              </ul>
            </div>

            <div class="footer">
              <p>Este es un mensaje automático del Sistema de Gestión Aqualiquim</p>
              <p>Generado el ${formatDate(new Date())} a las ${new Date().toLocaleTimeString()}</p>
              <p>Para configurar estas notificaciones, accede al panel de administración</p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const text = `
ALERTA DE STOCK BAJO - AQUALIQUIM

Resumen:
- Total de productos con stock bajo: ${lowStockItems.length}
- Productos críticos (sin stock): ${criticalItems.length}
- Productos con advertencia: ${warningItems.length}
- Fecha: ${formatDate(new Date())}

${criticalItems.length > 0 ? `
PRODUCTOS SIN STOCK (CRÍTICO):
${criticalItems.map(item => 
  `- ${item.productName} (${item.sku}) - Ubicación: ${item.location} - Stock: ${item.currentStock}/${item.minStock}`
).join('\n')}
` : ''}

${warningItems.length > 0 ? `
PRODUCTOS CON STOCK BAJO:
${warningItems.map(item => 
  `- ${item.productName} (${item.sku}) - Ubicación: ${item.location} - Stock: ${item.currentStock}/${item.minStock}`
).join('\n')}
` : ''}

Recomendaciones:
- Revisar proveedores para productos críticos
- Actualizar niveles de stock mínimo
- Considerar pedidos de emergencia

Sistema de Gestión Aqualiquim
${formatDate(new Date())}
    `;

    return { html, text };
  }

  /**
   * Update notification settings
   */
  updateSettings(newSettings) {
    if (newSettings.recipients) this.recipients = newSettings.recipients;
    if (newSettings.enabled !== undefined) this.enabled = newSettings.enabled;
    if (newSettings.checkInterval) this.checkInterval = newSettings.checkInterval;
    
    this.saveSettings();
    
    // Restart monitoring if settings changed
    if (this.isRunning) {
      this.stopMonitoring();
      if (this.enabled) {
        this.startMonitoring();
      }
    }
  }

  /**
   * Get notification settings
   */
  getSettings() {
    return {
      recipients: this.recipients,
      enabled: this.enabled,
      checkInterval: this.checkInterval,
      isRunning: this.isRunning,
      lastCheck: this.lastCheck
    };
  }

  /**
   * Test the notification system
   */
  async testNotification() {
    try {

      
      // Get a few low stock items for testing
      const lowStockItems = await getLowStockAlerts();
      
      if (lowStockItems.length === 0) {
        // Create mock data for testing
        const mockItems = [
          {
            inventoryId: 'test-1',
            productId: 'test-prod-1',
            productName: 'Cloro Test',
            sku: 'CLR-001',
            currentStock: 0,
            minStock: 10,
            location: 'Almacén Principal',
            status: 'critical'
          },
          {
            inventoryId: 'test-2',
            productId: 'test-prod-2',
            productName: 'Ácido Muriático Test',
            sku: 'ACM-002',
            currentStock: 3,
            minStock: 15,
            location: 'Bodega',
            status: 'warning'
          }
        ];
        
        await this.sendLowStockNotification(mockItems);
      } else {
        await this.sendLowStockNotification(lowStockItems.slice(0, 5)); // Send max 5 for testing
      }
      

      return { success: true };
    } catch (error) {
      console.error('❌ Error testing notification:', error);
      return { success: false, error };
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();
export default emailNotificationService;
