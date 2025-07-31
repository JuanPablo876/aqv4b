-- Data Migration Script - Maintenances and Finance Data
-- This script migrates maintenances and finance data from mock files to database

-- ============================================================================
-- MAINTENANCES DATA
-- ============================================================================
INSERT INTO maintenances (
  id, client_id, address, google_maps_link, service_type, frequency, 
  last_service_date, next_service_date, last_service_employee_id, status, 
  notes, created_at, updated_at
) VALUES 
(
  '90000000-0000-0000-0000-000000000001',
  '00000000-0000-0000-0000-000000000001',
  'Av. Costera 234, Acapulco',
  'https://maps.google.com/?q=Av.+Costera+234,+Acapulco',
  'Mantenimiento Semanal',
  'Semanal',
  '2023-11-15',
  '2023-11-22',
  '20000000-0000-0000-0000-000000000002',
  'active',
  'Incluye limpieza de fondo, paredes y revisión de químicos.',
  '2023-01-15T00:00:00.000Z',
  '2023-11-15T14:30:00.000Z'
),
(
  '90000000-0000-0000-0000-000000000002',
  '00000000-0000-0000-0000-000000000004',
  'Av. Reforma 567, CDMX',
  'https://maps.google.com/?q=Av.+Reforma+567,+CDMX',
  'Mantenimiento Quincenal',
  'Quincenal',
  '2023-11-10',
  '2023-11-24',
  '20000000-0000-0000-0000-000000000001',
  'active',
  'Servicio completo de spa, incluyendo jacuzzi.',
  '2023-02-01T00:00:00.000Z',
  '2023-11-10T11:15:00.000Z'
),
(
  '90000000-0000-0000-0000-000000000003',
  '00000000-0000-0000-0000-000000000008',
  'Paseo de las Palmas 67, Querétaro',
  'https://maps.google.com/?q=Paseo+de+las+Palmas+67,+Quer%C3%A9taro',
  'Mantenimiento Mensual',
  'Mensual',
  '2023-11-01',
  '2023-12-01',
  '20000000-0000-0000-0000-000000000002',
  'active',
  'Revisión de equipos y limpieza general.',
  '2023-03-01T00:00:00.000Z',
  '2023-11-01T09:30:00.000Z'
),
(
  '90000000-0000-0000-0000-000000000004',
  '00000000-0000-0000-0000-000000000002',
  'Blvd. de los Deportes 45, CDMX',
  'https://maps.google.com/?q=Blvd.+de+los+Deportes+45,+CDMX',
  'Mantenimiento Correctivo',
  'Bajo Demanda',
  '2023-10-28',
  NULL,
  '20000000-0000-0000-0000-000000000001',
  'completed',
  'Reparación de fuga en tubería.',
  '2023-10-25T00:00:00.000Z',
  '2023-10-28T16:45:00.000Z'
),
(
  '90000000-0000-0000-0000-000000000005',
  '00000000-0000-0000-0000-000000000005',
  'Carretera Tijuana-Ensenada Km 15, Tijuana',
  'https://maps.google.com/?q=Carretera+Tijuana-Ensenada+Km+15,+Tijuana',
  'Mantenimiento Integral',
  'Semanal',
  '2023-11-18',
  '2023-11-25',
  '20000000-0000-0000-0000-000000000002',
  'active',
  'Mantenimiento completo de parque acuático con múltiples albercas.',
  '2023-01-01T00:00:00.000Z',
  '2023-11-18T13:20:00.000Z'
),
(
  '90000000-0000-0000-0000-000000000006',
  '00000000-0000-0000-0000-000000000007',
  'Zona Hotelera Sur, Cancún',
  'https://maps.google.com/?q=Zona+Hotelera+Sur,+Canc%C3%BAn',
  'Mantenimiento de Hotel',
  'Quincenal',
  '2023-11-05',
  '2023-11-19',
  '20000000-0000-0000-0000-000000000006',
  'active',
  'Mantenimiento de múltiples albercas de hotel.',
  '2023-03-01T00:00:00.000Z',
  '2023-11-05T10:45:00.000Z'
);

-- ============================================================================
-- BANK ACCOUNTS DATA
-- ============================================================================
INSERT INTO bank_accounts (
  id, name, bank, account_number, balance, currency, status, 
  created_at, updated_at
) VALUES 
(
  'A0000000-0000-0000-0000-000000000001',
  'Cuenta Principal Banamex',
  'Banamex',
  'XXXX-XXXX-XXXX-1234',
  150000.75,
  'MXN',
  'active',
  '2023-01-01T00:00:00.000Z',
  '2024-07-31T23:59:59.000Z'
),
(
  'A0000000-0000-0000-0000-000000000002',
  'Cuenta de Ahorro BBVA',
  'BBVA',
  'XXXX-XXXX-XXXX-5678',
  50000.00,
  'MXN',
  'active',
  '2023-01-01T00:00:00.000Z',
  '2024-07-31T23:59:59.000Z'
),
(
  'A0000000-0000-0000-0000-000000000003',
  'Cuenta Dólares Santander',
  'Santander',
  'XXXX-XXXX-XXXX-9012',
  10000.50,
  'USD',
  'active',
  '2023-01-01T00:00:00.000Z',
  '2024-07-31T23:59:59.000Z'
);

-- ============================================================================
-- CASH BOXES DATA
-- ============================================================================
INSERT INTO cash_boxes (
  id, name, responsible, balance, currency, location, last_updated, created_at
) VALUES 
(
  'B0000000-0000-0000-0000-000000000001',
  'Caja Chica Principal',
  'Ana López',
  2500.00,
  'MXN',
  'Oficina Principal CDMX',
  '2023-11-17T16:30:00.000Z',
  '2023-01-01T00:00:00.000Z'
),
(
  'B0000000-0000-0000-0000-000000000002',
  'Caja Chica Sucursal Guadalajara',
  'Luis Hernández',
  1500.00,
  'MXN',
  'Sucursal Guadalajara',
  '2023-11-16T14:20:00.000Z',
  '2023-02-01T00:00:00.000Z'
);

-- ============================================================================
-- TRANSACTIONS DATA
-- ============================================================================
INSERT INTO transactions (
  id, transaction_type, amount, description, category, account_id, 
  account_type, reference_document, date, status, notes, created_by, 
  created_at, updated_at
) VALUES 
(
  'C0000000-0000-0000-0000-000000000001',
  'income',
  20241.95,
  'Pago de factura F-0001',
  'Ventas',
  'A0000000-0000-0000-0000-000000000001',
  'bank',
  'F-0001',
  '2023-11-17',
  'completed',
  'Pago completo de Hotel Acapulco Resort',
  '20000000-0000-0000-0000-000000000004',
  '2023-11-17T15:30:00.000Z',
  '2023-11-17T15:30:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000002',
  'income',
  63219.90,
  'Pago de factura F-0002',
  'Ventas',
  'A0000000-0000-0000-0000-000000000001',
  'bank',
  'F-0002',
  '2023-11-14',
  'completed',
  'Pago completo de Parque Acuático Splash',
  '20000000-0000-0000-0000-000000000004',
  '2023-11-14T16:45:00.000Z',
  '2023-11-14T16:45:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000003',
  'income',
  4871.97,
  'Pago de nota de venta N-0001',
  'Ventas',
  'B0000000-0000-0000-0000-000000000001',
  'cash',
  'N-0001',
  '2023-11-15',
  'completed',
  'Pago en efectivo de Spa Wellness Center',
  '20000000-0000-0000-0000-000000000001',
  '2023-11-15T12:15:00.000Z',
  '2023-11-15T12:15:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000004',
  'expense',
  45000.00,
  'Pago a proveedor AquaTech',
  'Compras',
  'A0000000-0000-0000-0000-000000000001',
  'bank',
  'PO-2024-001',
  '2024-06-28',
  'completed',
  'Pago de facturas pendientes a AquaTech',
  '20000000-0000-0000-0000-000000000004',
  '2024-06-28T10:30:00.000Z',
  '2024-06-28T10:30:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000005',
  'expense',
  25000.00,
  'Pago a proveedor FilterPro',
  'Compras',
  'A0000000-0000-0000-0000-000000000001',
  'bank',
  'PO-2024-002',
  '2024-07-02',
  'completed',
  'Pago de facturas pendientes a FilterPro',
  '20000000-0000-0000-0000-000000000004',
  '2024-07-02T14:15:00.000Z',
  '2024-07-02T14:15:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000006',
  'expense',
  3500.00,
  'Gastos de combustible',
  'Gastos Operativos',
  'B0000000-0000-0000-0000-000000000001',
  'cash',
  'TICKET-001',
  '2024-07-15',
  'completed',
  'Combustible para vehículos de entrega',
  '20000000-0000-0000-0000-000000000002',
  '2024-07-15T08:30:00.000Z',
  '2024-07-15T08:30:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000007',
  'expense',
  1200.00,
  'Papelería y suministros oficina',
  'Gastos Administrativos',
  'B0000000-0000-0000-0000-000000000001',
  'cash',
  'TICKET-002',
  '2024-07-10',
  'completed',
  'Compra de suministros para oficina',
  '20000000-0000-0000-0000-000000000004',
  '2024-07-10T11:45:00.000Z',
  '2024-07-10T11:45:00.000Z'
),
(
  'C0000000-0000-0000-0000-000000000008',
  'transfer',
  5000.00,
  'Transferencia a caja chica Guadalajara',
  'Transferencias Internas',
  'A0000000-0000-0000-0000-000000000001',
  'bank',
  'TRANS-001',
  '2024-07-01',
  'completed',
  'Reposición de fondos caja chica sucursal',
  '20000000-0000-0000-0000-000000000004',
  '2024-07-01T09:00:00.000Z',
  '2024-07-01T09:00:00.000Z'
);
