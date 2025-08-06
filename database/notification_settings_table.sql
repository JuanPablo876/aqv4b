-- ============================================================================
-- NOTIFICATION SETTINGS TABLE
-- ============================================================================
-- Table to store email notification settings and preferences

CREATE TABLE IF NOT EXISTS notification_settings (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL UNIQUE,
  setting_name VARCHAR(255) NOT NULL,
  description TEXT,
  enabled BOOLEAN DEFAULT false,
  recipients JSONB DEFAULT '[]'::jsonb,
  check_interval INTEGER DEFAULT 21600000, -- 6 hours in milliseconds
  notification_types JSONB DEFAULT '{
    "lowStock": {"enabled": true, "label": "Stock Bajo", "description": "Productos con stock por debajo del mínimo"},
    "outOfStock": {"enabled": true, "label": "Sin Stock", "description": "Productos completamente agotados"},
    "expiredProducts": {"enabled": false, "label": "Productos Vencidos", "description": "Productos que han pasado su fecha de vencimiento"},
    "maintenanceDue": {"enabled": false, "label": "Mantenimiento Vencido", "description": "Equipos que requieren mantenimiento"},
    "orderReminders": {"enabled": false, "label": "Recordatorios de Pedidos", "description": "Recordatorios de pedidos pendientes"}
  }'::jsonb,
  last_check TIMESTAMP WITH TIME ZONE,
  last_notification_sent TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Insert default low stock notification settings
INSERT INTO notification_settings (
  setting_key,
  setting_name,
  description,
  enabled,
  recipients,
  check_interval,
  notification_types
) VALUES (
  'low_stock_alerts',
  'Alertas de Stock Bajo',
  'Configuración para notificaciones automáticas de productos con stock bajo',
  true,
  '["compras@hotelacapulco.com", "admin@aqualiquim.mx"]'::jsonb,
  21600000, -- 6 hours
  '{
    "lowStock": {"enabled": true, "label": "Stock Bajo", "description": "Productos con stock por debajo del mínimo"},
    "outOfStock": {"enabled": true, "label": "Sin Stock", "description": "Productos completamente agotados"},
    "expiredProducts": {"enabled": false, "label": "Productos Vencidos", "description": "Productos que han pasado su fecha de vencimiento"},
    "maintenanceDue": {"enabled": false, "label": "Mantenimiento Vencido", "description": "Equipos que requieren mantenimiento"},
    "orderReminders": {"enabled": false, "label": "Recordatorios de Pedidos", "description": "Recordatorios de pedidos pendientes"}
  }'::jsonb
) ON CONFLICT (setting_key) DO NOTHING;

-- Create function to update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_settings_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ language 'plpgsql';

-- Create trigger to automatically update updated_at
DROP TRIGGER IF EXISTS update_notification_settings_updated_at ON notification_settings;
CREATE TRIGGER update_notification_settings_updated_at
  BEFORE UPDATE ON notification_settings
  FOR EACH ROW
  EXECUTE FUNCTION update_notification_settings_updated_at();

-- ============================================================================
-- NOTIFICATION LOGS TABLE  
-- ============================================================================
-- Table to track notification history and audit trail

CREATE TABLE IF NOT EXISTS notification_logs (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  setting_key VARCHAR(100) NOT NULL,
  notification_type VARCHAR(50) NOT NULL,
  recipients JSONB NOT NULL,
  subject VARCHAR(500),
  content_preview TEXT,
  email_id VARCHAR(255), -- Resend email ID for tracking
  status VARCHAR(20) DEFAULT 'sent' CHECK (status IN ('sent', 'failed', 'pending')),
  error_message TEXT,
  item_count INTEGER DEFAULT 0,
  sent_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  
  FOREIGN KEY (setting_key) REFERENCES notification_settings(setting_key) ON DELETE CASCADE
);

-- Create index for better query performance
CREATE INDEX IF NOT EXISTS idx_notification_logs_setting_key ON notification_logs(setting_key);
CREATE INDEX IF NOT EXISTS idx_notification_logs_sent_at ON notification_logs(sent_at);
CREATE INDEX IF NOT EXISTS idx_notification_logs_status ON notification_logs(status);

-- ============================================================================
-- RLS POLICIES (if using Row Level Security)
-- ============================================================================

-- Enable RLS on notification_settings (optional, depends on your security model)
-- ALTER TABLE notification_settings ENABLE ROW LEVEL SECURITY;
-- ALTER TABLE notification_logs ENABLE ROW LEVEL SECURITY;

-- Example RLS policies (uncomment if needed):
-- CREATE POLICY "notification_settings_access" ON notification_settings FOR ALL USING (true);
-- CREATE POLICY "notification_logs_access" ON notification_logs FOR ALL USING (true);
