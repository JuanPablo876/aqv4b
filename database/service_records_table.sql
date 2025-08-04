-- ============================================================================
-- SERVICE RECORDS TABLE
-- ============================================================================
-- Table to store detailed service history for maintenance contracts
CREATE TABLE IF NOT EXISTS service_records (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  maintenance_id UUID REFERENCES maintenances(id) ON DELETE CASCADE,
  service_date DATE NOT NULL,
  service_type VARCHAR(100) NOT NULL,
  description TEXT,
  employee_id UUID REFERENCES employees(id),
  cost DECIMAL(10,2) DEFAULT 0,
  duration_hours DECIMAL(4,2),
  status VARCHAR(20) DEFAULT 'completed' CHECK (status IN ('pending', 'in_progress', 'completed', 'cancelled')),
  notes TEXT,
  products_used JSONB, -- Array of products used: [{product_id, quantity, price}]
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_service_records_maintenance_id ON service_records(maintenance_id);
CREATE INDEX IF NOT EXISTS idx_service_records_service_date ON service_records(service_date);
CREATE INDEX IF NOT EXISTS idx_service_records_employee_id ON service_records(employee_id);
CREATE INDEX IF NOT EXISTS idx_service_records_status ON service_records(status);

-- Add RLS policies
ALTER TABLE service_records ENABLE ROW LEVEL SECURITY;

-- Policy: Users can view all service records
CREATE POLICY "Users can view service records" ON service_records
    FOR SELECT USING (true);

-- Policy: Users can insert service records
CREATE POLICY "Users can insert service records" ON service_records
    FOR INSERT WITH CHECK (true);

-- Policy: Users can update service records
CREATE POLICY "Users can update service records" ON service_records
    FOR UPDATE USING (true);

-- Policy: Users can delete service records
CREATE POLICY "Users can delete service records" ON service_records
    FOR DELETE USING (true);

-- Add some sample service records for existing maintenances
INSERT INTO service_records (maintenance_id, service_date, service_type, description, employee_id, cost, duration_hours, status, notes)
SELECT 
    m.id as maintenance_id,
    CURRENT_DATE - INTERVAL '30 days' as service_date,
    'Mantenimiento Preventivo' as service_type,
    'Revisión completa de sistemas y limpieza general' as description,
    e.id as employee_id,
    150.00 as cost,
    2.5 as duration_hours,
    'completed' as status,
    'Servicio realizado según cronograma' as notes
FROM maintenances m
CROSS JOIN LATERAL (
    SELECT id FROM employees LIMIT 1
) e
WHERE m.id IS NOT NULL
LIMIT 5;

-- Add more varied sample records
INSERT INTO service_records (maintenance_id, service_date, service_type, description, employee_id, cost, duration_hours, status, notes)
SELECT 
    m.id as maintenance_id,
    CURRENT_DATE - INTERVAL '60 days' as service_date,
    CASE 
        WHEN random() < 0.3 THEN 'Reparación Correctiva'
        WHEN random() < 0.6 THEN 'Cambio de Filtros'
        ELSE 'Inspección de Seguridad'
    END as service_type,
    CASE 
        WHEN random() < 0.3 THEN 'Reparación de componente defectuoso'
        WHEN random() < 0.6 THEN 'Reemplazo de filtros según cronograma'
        ELSE 'Verificación de sistemas de seguridad'
    END as description,
    e.id as employee_id,
    (random() * 300 + 50)::decimal(10,2) as cost,
    (random() * 4 + 1)::decimal(4,2) as duration_hours,
    'completed' as status,
    NULL as notes
FROM maintenances m
CROSS JOIN LATERAL (
    SELECT id FROM employees ORDER BY random() LIMIT 1
) e
WHERE m.id IS NOT NULL;
