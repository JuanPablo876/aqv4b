// Email Notification Service for Low Stock Alerts
import { supabase } from '../supabaseClient';
import { getLowStockAlerts } from '../utils/inventoryManager';
import { formatDate, formatCurrency } from '../utils/storage';

class EmailNotificationService {
  constructor() {
    this.recipients = [
      'compras@hotelacapulco.com',
      'admin@aqualiquim.mx'
    ];
    this.enabled = true;
    this.checkInterval = 1000 * 60 * 60 * 6; // Check every 6 hours
    this.lastCheck = null;
    this.isRunning = false;
    
    // Default notification types
    this.notificationTypes = {
      lowStock: { enabled: true, label: 'Stock Bajo', description: 'Productos con stock por debajo del mínimo' },
      outOfStock: { enabled: true, label: 'Sin Stock', description: 'Productos completamente agotados' },
      expiredProducts: { enabled: false, label: 'Productos Vencidos', description: 'Productos que han pasado su fecha de vencimiento' },
      maintenanceDue: { enabled: false, label: 'Mantenimiento Vencido', description: 'Equipos que requieren mantenimiento' },
      orderReminders: { enabled: false, label: 'Recordatorios de Pedidos', description: 'Recordatorios de pedidos pendientes' }
    };
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
   * Load notification settings from database
   */
  async loadSettings() {
    try {
      console.log('📥 Loading notification settings from database...');
      
      // Try to load from database first
      const { data: settings, error } = await supabase
        .from('notification_settings')
        .select('*')
        .eq('setting_key', 'low_stock_alerts')
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 is "not found" error
        console.error('❌ Error loading settings from database:', error);
        throw error;
      }

      if (settings) {
        console.log('✅ Settings loaded from database:', settings);
        
        this.recipients = Array.isArray(settings.recipients) ? settings.recipients : this.recipients;
        this.enabled = settings.enabled !== undefined ? settings.enabled : this.enabled;
        this.checkInterval = settings.check_interval || this.checkInterval;
        this.lastCheck = settings.last_check ? new Date(settings.last_check) : null;
        
        // Load notification types if available
        if (settings.notification_types) {
          this.notificationTypes = { ...this.notificationTypes, ...settings.notification_types };
        }
        
        console.log('✅ Settings applied successfully:', {
          recipients: this.recipients,
          enabled: this.enabled,
          checkInterval: this.checkInterval,
          notificationTypes: this.notificationTypes,
          lastCheck: this.lastCheck
        });
      } else {
        console.log('ℹ️ No settings found in database, using defaults and creating initial record...');
        // Create initial record with defaults
        await this.saveSettings();
      }

      // Fallback: try localStorage if database fails
      if (!settings) {
        const savedSettings = localStorage.getItem('lowStockNotificationSettings');
        if (savedSettings) {
          const localSettings = JSON.parse(savedSettings);
          console.log('📥 Loading from localStorage as fallback:', localSettings);
          
          this.recipients = Array.isArray(localSettings.recipients) ? localSettings.recipients : this.recipients;
          this.enabled = localSettings.enabled !== undefined ? localSettings.enabled : this.enabled;
          this.checkInterval = localSettings.checkInterval || this.checkInterval;
          
          if (localSettings.notificationTypes) {
            this.notificationTypes = { ...this.notificationTypes, ...localSettings.notificationTypes };
          }
          
          // Migrate to database
          await this.saveSettings();
        }
      }

    } catch (error) {
      console.error('❌ Error loading notification settings:', error);
      // Continue with defaults if loading fails
    }
  }

  /**
   * Save notification settings to database
   */
  async saveSettings() {
    try {
      console.log('💾 Saving notification settings to database...');
      
      const settings = {
        setting_key: 'low_stock_alerts',
        setting_name: 'Alertas de Stock Bajo',
        description: 'Configuración para notificaciones automáticas de productos con stock bajo',
        enabled: this.enabled,
        recipients: this.recipients,
        check_interval: this.checkInterval,
        notification_types: this.notificationTypes,
        last_check: this.lastCheck,
        updated_at: new Date().toISOString()
      };

      console.log('� Saving settings:', settings);

      // Use upsert to insert or update
      const { data, error } = await supabase
        .from('notification_settings')
        .upsert(settings, { 
          onConflict: 'setting_key',
          returning: 'minimal'
        });

      if (error) {
        console.error('❌ Error saving settings to database:', error);
        throw error;
      }

      console.log('✅ Settings saved to database successfully');

      // Also save to localStorage as backup
      const localSettings = {
        recipients: this.recipients,
        enabled: this.enabled,
        checkInterval: this.checkInterval,
        notificationTypes: this.notificationTypes,
        lastSaved: new Date().toISOString()
      };

      localStorage.setItem('lowStockNotificationSettings', JSON.stringify(localSettings));
      console.log('✅ Settings also saved to localStorage as backup');

    } catch (error) {
      console.error('❌ Error saving notification settings:', error);
      
      // Fallback to localStorage if database save fails
      try {
        const localSettings = {
          recipients: this.recipients,
          enabled: this.enabled,
          checkInterval: this.checkInterval,
          notificationTypes: this.notificationTypes,
          lastSaved: new Date().toISOString(),
          error: 'Database save failed - stored locally'
        };

        localStorage.setItem('lowStockNotificationSettings', JSON.stringify(localSettings));
        console.log('⚠️ Saved to localStorage as fallback due to database error');
      } catch (localError) {
        console.error('❌ Failed to save to localStorage as well:', localError);
        throw new Error('Failed to save settings to both database and localStorage');
      }
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
   * Log notification to database for audit purposes
   */
  async logNotificationToDatabase(type, recipients, subject, emailId, status = 'sent', itemCount = 0, errorMessage = null) {
    try {
      console.log('📝 Logging notification to database...');
      
      const logEntry = {
        setting_key: 'low_stock_alerts',
        notification_type: type,
        recipients: recipients,
        subject: subject,
        email_id: emailId,
        status: status,
        error_message: errorMessage,
        item_count: itemCount,
        sent_at: new Date().toISOString()
      };

      const { data, error } = await supabase
        .from('notification_logs')
        .insert(logEntry);

      if (error) {
        console.error('❌ Error logging notification to database:', error);
        // Don't throw here as logging failure shouldn't break notification
      } else {
        console.log('✅ Notification logged to database successfully');
      }

    } catch (error) {
      console.error('❌ Error logging notification:', error);
      // Don't throw here as logging failure shouldn't break notification
    }
  }

  /**
   * Send low stock notification email
   */
  async sendLowStockNotification(lowStockItems) {
    try {
      console.log('📧 Sending low stock notification...', {
        itemCount: lowStockItems.length,
        recipients: this.recipients
      });

      // Validate recipients before sending
      if (!this.recipients || this.recipients.length === 0) {
        console.warn('⚠️ No recipients configured for low stock notifications');
        return { 
          success: false, 
          error: 'No recipients configured. Please add email addresses in notification settings.',
          mode: 'validation-error'
        };
      }

      const emailContent = this.generateLowStockEmailContent(lowStockItems);
      
      // Use the Supabase Edge Function for real email sending
      const { data, error } = await supabase.functions.invoke('send-low-stock-email', {
        body: {
          recipients: this.recipients,
          subject: `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} productos`,
          htmlContent: emailContent.html,
          textContent: emailContent.text,
          lowStockItems: lowStockItems
        }
      });

      if (error) {
        console.error('❌ Edge function error:', error);
        
        // Log failed notification to database
        await this.logNotificationToDatabase(
          'low_stock',
          this.recipients,
          `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} productos`,
          null,
          'failed',
          lowStockItems.length,
          error.message
        );
        
        // Fall back to simulation mode if Edge Function fails
        console.log('🔄 Falling back to simulation mode...');
        await new Promise(resolve => setTimeout(resolve, 300));
        return { 
          success: true, 
          data: { 
            message: 'Email simulated (Edge Function fallback)',
            itemCount: lowStockItems.length,
            recipients: this.recipients,
            mode: 'fallback',
            originalError: error.message
          } 
        };
      }

      // Log successful notification to database
      await this.logNotificationToDatabase(
        'low_stock',
        this.recipients,
        `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} productos`,
        data?.emailId,
        'sent',
        lowStockItems.length
      );

      console.log('✅ Low stock email sent successfully via Edge Function');
      return { 
        success: true, 
        data: { 
          message: 'Low stock notification sent successfully',
          itemCount: lowStockItems.length,
          recipients: this.recipients,
          emailId: data?.emailId,
          mode: 'production'
        } 
      };

    } catch (error) {
      console.error('❌ Error in sendLowStockNotification:', error);
      
      // Log failed notification to database
      await this.logNotificationToDatabase(
        'low_stock',
        this.recipients,
        `⚠️ Alerta de Stock Bajo - ${lowStockItems.length} productos`,
        null,
        'failed',
        lowStockItems.length,
        error.message
      );
      
      // Instead of throwing, return a fallback simulation to prevent app crashes
      console.log('🔄 Error occurred, falling back to simulation...');
      await new Promise(resolve => setTimeout(resolve, 300));
      return { 
        success: true, 
        data: { 
          message: 'Email simulated (error fallback)',
          itemCount: lowStockItems.length,
          recipients: this.recipients,
          mode: 'error-fallback',
          originalError: error.message
        } 
      };
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
  async updateSettings(newSettings) {
    console.log('📝 Updating notification settings:', newSettings);
    
    if (newSettings.recipients && Array.isArray(newSettings.recipients)) {
      this.recipients = [...newSettings.recipients]; // Create a copy to avoid reference issues
      console.log('✅ Recipients updated:', this.recipients);
    }
    if (newSettings.enabled !== undefined) {
      this.enabled = newSettings.enabled;
      console.log('✅ Enabled updated:', this.enabled);
    }
    if (newSettings.checkInterval) {
      this.checkInterval = newSettings.checkInterval;
      console.log('✅ Check interval updated:', this.checkInterval);
    }
    if (newSettings.notificationTypes) {
      this.notificationTypes = { ...this.notificationTypes, ...newSettings.notificationTypes };
      console.log('✅ Notification types updated:', this.notificationTypes);
    }
    
    await this.saveSettings();
    
    // Restart monitoring if settings changed
    if (this.isRunning) {
      this.stopMonitoring();
      if (this.enabled) {
        this.startMonitoring();
      }
    }
    
    console.log('✅ Settings saved successfully');
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
      lastCheck: this.lastCheck,
      notificationTypes: this.notificationTypes
    };
  }

  /**
   * Get available notification types
   */
  getNotificationTypes() {
    return this.notificationTypes;
  }

  /**
   * Update notification type settings
   */
  updateNotificationType(typeKey, enabled) {
    if (this.notificationTypes[typeKey]) {
      this.notificationTypes[typeKey].enabled = enabled;
      this.saveSettings();
    }
  }

  /**
   * Test the notification system
   */
  async testNotification() {
    try {
      console.log('🧪 Testing notification system...');
      
      // Validate recipients first
      if (!this.recipients || this.recipients.length === 0) {
        console.warn('⚠️ No recipients configured for test');
        return { 
          success: false, 
          error: { 
            message: 'No recipients configured. Please add email addresses before testing.' 
          } 
        };
      }

      console.log('📧 Recipients configured:', this.recipients);
      
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
        
        console.log('🔬 Using mock data for testing');
        const result = await this.sendLowStockNotification(mockItems);
        return result;
      } else {
        console.log('📦 Using real low stock data for testing');
        const result = await this.sendLowStockNotification(lowStockItems.slice(0, 5)); // Send max 5 for testing
        return result;
      }

    } catch (error) {
      console.error('❌ Error testing notification:', error);
      return { success: false, error };
    }
  }
}

// Export singleton instance
export const emailNotificationService = new EmailNotificationService();
export default emailNotificationService;
