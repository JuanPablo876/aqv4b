-- AquaPool System - Complete Database Schema
-- This file contains all tables needed to migrate from mock data to database
-- Run this file to create the complete database structure

-- Enable necessary extensions
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- ============================================================================
-- CLIENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS clients (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  contact VARCHAR(255),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  google_maps_link TEXT,
  type VARCHAR(100),
  last_purchase DATE,
  total_spent DECIMAL(12,2) DEFAULT 0,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'suspended')),
  rfc VARCHAR(20),
  customer_type VARCHAR(20) DEFAULT 'regular' CHECK (customer_type IN ('regular', 'premium', 'vip')),
  payment_terms VARCHAR(50),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  pools_count INTEGER DEFAULT 0,
  pool_type TEXT,
  last_service_date DATE,
  account_manager VARCHAR(255),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- SUPPLIERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS suppliers (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  business_name VARCHAR(255),
  contact VARCHAR(255),
  email VARCHAR(255),
  phone VARCHAR(50),
  address TEXT,
  rfc VARCHAR(20),
  website VARCHAR(255),
  category VARCHAR(100),
  rating DECIMAL(3,2) DEFAULT 0,
  year_established INTEGER,
  account_manager VARCHAR(255),
  credit_limit DECIMAL(12,2) DEFAULT 0,
  current_balance DECIMAL(12,2) DEFAULT 0,
  last_payment_date DATE,
  contract_end_date DATE,
  preferred_vendor BOOLEAN DEFAULT FALSE,
  certifications JSONB,
  shipping_methods JSONB,
  minimum_order DECIMAL(12,2) DEFAULT 0,
  discount_tier VARCHAR(20),
  lead_time INTEGER DEFAULT 7,
  payment_terms VARCHAR(50),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- EMPLOYEES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS employees (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  employee_number VARCHAR(20) UNIQUE,
  name VARCHAR(255) NOT NULL,
  role VARCHAR(100),
  department VARCHAR(100),
  email VARCHAR(255) UNIQUE,
  phone VARCHAR(50),
  address TEXT,
  google_maps_link TEXT,
  hire_date DATE,
  birth_date DATE,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'terminated')),
  supervisor VARCHAR(255),
  salary DECIMAL(10,2),
  commission_rate DECIMAL(5,4) DEFAULT 0,
  emergency_contact JSONB,
  skills JSONB,
  territory VARCHAR(255),
  sales_target DECIMAL(12,2),
  performance_rating DECIMAL(3,2),
  last_review DATE,
  next_review DATE,
  vacation_data JSONB,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- PRODUCTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS products (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  category VARCHAR(100),
  description TEXT,
  price DECIMAL(10,2) NOT NULL,
  cost DECIMAL(10,2),
  stock INTEGER DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  sku VARCHAR(100) UNIQUE,
  supplier_id UUID REFERENCES suppliers(id),
  supplier_name VARCHAR(255), -- Denormalized for easier queries
  image_url TEXT,
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'discontinued')),
  brand VARCHAR(100),
  model VARCHAR(100),
  weight VARCHAR(50),
  dimensions VARCHAR(100),
  warranty VARCHAR(100),
  installation_required BOOLEAN DEFAULT FALSE,
  seasonal_demand VARCHAR(20) DEFAULT 'moderate' CHECK (seasonal_demand IN ('low', 'moderate', 'high')),
  last_restock_date DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVENTORY TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  product_id UUID REFERENCES products(id) ON DELETE CASCADE,
  location VARCHAR(255) NOT NULL,
  warehouse_code VARCHAR(50),
  zone VARCHAR(10),
  shelf VARCHAR(20),
  quantity INTEGER NOT NULL DEFAULT 0,
  min_stock INTEGER DEFAULT 0,
  max_stock INTEGER DEFAULT 0,
  reorder_point INTEGER DEFAULT 0,
  supplier_lead_time INTEGER DEFAULT 7,
  average_usage DECIMAL(8,2) DEFAULT 0,
  seasonal_factor DECIMAL(5,2) DEFAULT 1,
  abc_classification CHAR(1) CHECK (abc_classification IN ('A', 'B', 'C')),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  UNIQUE(product_id, location)
);

-- ============================================================================
-- INVENTORY MOVEMENTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS inventory_movements (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  inventory_id UUID REFERENCES inventory(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  movement_type VARCHAR(20) NOT NULL CHECK (movement_type IN ('entrada', 'salida', 'ajuste', 'transferencia')),
  quantity INTEGER NOT NULL,
  reason VARCHAR(255),
  balance_after INTEGER NOT NULL,
  employee_id UUID REFERENCES employees(id),
  reference_document VARCHAR(100), -- Order ID, adjustment ID, etc.
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUOTES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quotes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_number VARCHAR(50) UNIQUE,
  client_id UUID REFERENCES clients(id),
  date DATE NOT NULL,
  valid_until DATE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'approved', 'rejected', 'expired')),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- QUOTE ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS quote_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  quote_id UUID REFERENCES quotes(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * price) - discount) STORED
);

-- ============================================================================
-- ORDERS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS orders (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_number VARCHAR(50) UNIQUE,
  client_id UUID REFERENCES clients(id),
  quote_id UUID REFERENCES quotes(id),
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'processing', 'shipped', 'delivered', 'cancelled')),
  payment_status VARCHAR(20) DEFAULT 'pending' CHECK (payment_status IN ('pending', 'partial', 'paid')),
  payment_method VARCHAR(50),
  subtotal DECIMAL(12,2) NOT NULL DEFAULT 0,
  discount DECIMAL(12,2) DEFAULT 0,
  tax DECIMAL(12,2) DEFAULT 0,
  total DECIMAL(12,2) NOT NULL DEFAULT 0,
  amount_paid DECIMAL(12,2) DEFAULT 0,
  balance DECIMAL(12,2) GENERATED ALWAYS AS (total - amount_paid) STORED,
  notes TEXT,
  delivery_employee_id UUID REFERENCES employees(id),
  delivery_date DATE,
  delivery_time VARCHAR(50),
  delivery_address TEXT,
  delivery_google_maps_link TEXT,
  priority VARCHAR(20) DEFAULT 'normal' CHECK (priority IN ('low', 'normal', 'high', 'urgent')),
  estimated_delivery DATE,
  actual_delivery DATE,
  sales_person VARCHAR(255),
  created_by UUID REFERENCES employees(id),
  customer_po VARCHAR(100),
  shipping_method VARCHAR(100),
  shipping_cost DECIMAL(10,2) DEFAULT 0,
  warehouse VARCHAR(100),
  urgent_order BOOLEAN DEFAULT FALSE,
  installation_required BOOLEAN DEFAULT FALSE,
  installation_scheduled DATE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- ORDER ITEMS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS order_items (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  order_id UUID REFERENCES orders(id) ON DELETE CASCADE,
  product_id UUID REFERENCES products(id),
  quantity INTEGER NOT NULL,
  price DECIMAL(10,2) NOT NULL,
  discount DECIMAL(10,2) DEFAULT 0,
  total DECIMAL(12,2) GENERATED ALWAYS AS ((quantity * price) - discount) STORED
);

-- ============================================================================
-- INVOICES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invoices (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  invoice_number VARCHAR(50) UNIQUE NOT NULL,
  order_id UUID REFERENCES orders(id),
  client_id UUID REFERENCES clients(id),
  rfc VARCHAR(20),
  razon_social VARCHAR(255),
  date DATE NOT NULL,
  total DECIMAL(12,2) NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'paid', 'overdue', 'cancelled')),
  payment_method VARCHAR(50),
  due_date DATE,
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- MAINTENANCES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS maintenances (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  client_id UUID REFERENCES clients(id),
  address TEXT,
  google_maps_link TEXT,
  service_type VARCHAR(100),
  frequency VARCHAR(50),
  last_service_date DATE,
  next_service_date DATE,
  last_service_employee_id UUID REFERENCES employees(id),
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'completed', 'cancelled')),
  notes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCE - BANK ACCOUNTS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS bank_accounts (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  bank VARCHAR(100),
  account_number VARCHAR(100),
  balance DECIMAL(15,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'MXN',
  status VARCHAR(20) DEFAULT 'active' CHECK (status IN ('active', 'inactive', 'closed')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCE - CASH BOXES TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS cash_boxes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  responsible VARCHAR(255),
  balance DECIMAL(12,2) DEFAULT 0,
  currency VARCHAR(3) DEFAULT 'MXN',
  location VARCHAR(255),
  last_updated TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- FINANCE - TRANSACTIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS transactions (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  transaction_type VARCHAR(20) NOT NULL CHECK (transaction_type IN ('income', 'expense', 'transfer')),
  amount DECIMAL(12,2) NOT NULL,
  description TEXT,
  category VARCHAR(100),
  account_id UUID, -- Could reference bank_accounts or cash_boxes
  account_type VARCHAR(20) CHECK (account_type IN ('bank', 'cash')),
  reference_document VARCHAR(100), -- Invoice, order, etc.
  date DATE NOT NULL,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'completed', 'cancelled')),
  notes TEXT,
  created_by UUID REFERENCES employees(id),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- ============================================================================
-- INVITATIONS TABLE
-- ============================================================================
CREATE TABLE IF NOT EXISTS invitations (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  email VARCHAR(255) NOT NULL,
  role VARCHAR(50) NOT NULL CHECK (role IN ('admin', 'manager', 'employee')),
  invited_by UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) DEFAULT 'pending' CHECK (status IN ('pending', 'accepted', 'expired', 'cancelled')),
  expires_at TIMESTAMP WITH TIME ZONE DEFAULT (NOW() + INTERVAL '7 days'),
  email_sent_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create unique index to prevent duplicate pending invitations for same email
CREATE UNIQUE INDEX IF NOT EXISTS invitations_email_pending_unique 
ON invitations (email) 
WHERE status = 'pending';

-- ============================================================================
-- INDEXES FOR BETTER PERFORMANCE
-- ============================================================================

-- Clients indexes
CREATE INDEX IF NOT EXISTS idx_clients_email ON clients(email);
CREATE INDEX IF NOT EXISTS idx_clients_status ON clients(status);
CREATE INDEX IF NOT EXISTS idx_clients_customer_type ON clients(customer_type);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);
CREATE INDEX IF NOT EXISTS idx_products_supplier_id ON products(supplier_id);
CREATE INDEX IF NOT EXISTS idx_products_status ON products(status);

-- Inventory indexes
CREATE INDEX IF NOT EXISTS idx_inventory_product_id ON inventory(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_location ON inventory(location);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_product_id ON inventory_movements(product_id);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_type ON inventory_movements(movement_type);

-- Orders indexes
CREATE INDEX IF NOT EXISTS idx_orders_client_id ON orders(client_id);
CREATE INDEX IF NOT EXISTS idx_orders_status ON orders(status);
CREATE INDEX IF NOT EXISTS idx_orders_date ON orders(date);
CREATE INDEX IF NOT EXISTS idx_orders_order_number ON orders(order_number);

-- Quotes indexes
CREATE INDEX IF NOT EXISTS idx_quotes_client_id ON quotes(client_id);
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_date ON quotes(date);

-- Invoices indexes
CREATE INDEX IF NOT EXISTS idx_invoices_client_id ON invoices(client_id);
CREATE INDEX IF NOT EXISTS idx_invoices_order_id ON invoices(order_id);
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_date ON invoices(date);

-- Finance indexes
CREATE INDEX IF NOT EXISTS idx_transactions_type ON transactions(transaction_type);
CREATE INDEX IF NOT EXISTS idx_transactions_date ON transactions(date);
CREATE INDEX IF NOT EXISTS idx_transactions_account ON transactions(account_id, account_type);

-- Invitations indexes
CREATE INDEX IF NOT EXISTS idx_invitations_email ON invitations(email);
CREATE INDEX IF NOT EXISTS idx_invitations_status ON invitations(status);
CREATE INDEX IF NOT EXISTS idx_invitations_invited_by ON invitations(invited_by);

-- ============================================================================
-- TRIGGERS FOR AUTO-UPDATING TIMESTAMPS
-- ============================================================================

-- Function to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Apply triggers to all tables with updated_at column
CREATE TRIGGER update_clients_updated_at BEFORE UPDATE ON clients
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_suppliers_updated_at BEFORE UPDATE ON suppliers
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_employees_updated_at BEFORE UPDATE ON employees
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_products_updated_at BEFORE UPDATE ON products
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_inventory_updated_at BEFORE UPDATE ON inventory
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_quotes_updated_at BEFORE UPDATE ON quotes
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_orders_updated_at BEFORE UPDATE ON orders
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invoices_updated_at BEFORE UPDATE ON invoices
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_maintenances_updated_at BEFORE UPDATE ON maintenances
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_bank_accounts_updated_at BEFORE UPDATE ON bank_accounts
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_transactions_updated_at BEFORE UPDATE ON transactions
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

CREATE TRIGGER update_invitations_updated_at BEFORE UPDATE ON invitations
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- ============================================================================
-- ROW LEVEL SECURITY (RLS) SETUP
-- ============================================================================

-- Enable RLS on all tables
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE suppliers ENABLE ROW LEVEL SECURITY;
ALTER TABLE employees ENABLE ROW LEVEL SECURITY;
ALTER TABLE products ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory ENABLE ROW LEVEL SECURITY;
ALTER TABLE inventory_movements ENABLE ROW LEVEL SECURITY;
ALTER TABLE quotes ENABLE ROW LEVEL SECURITY;
ALTER TABLE quote_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE orders ENABLE ROW LEVEL SECURITY;
ALTER TABLE order_items ENABLE ROW LEVEL SECURITY;
ALTER TABLE invoices ENABLE ROW LEVEL SECURITY;
ALTER TABLE maintenances ENABLE ROW LEVEL SECURITY;
ALTER TABLE bank_accounts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cash_boxes ENABLE ROW LEVEL SECURITY;
ALTER TABLE transactions ENABLE ROW LEVEL SECURITY;
ALTER TABLE invitations ENABLE ROW LEVEL SECURITY;

-- Basic RLS policies (allow all for authenticated users - customize as needed)
-- You may want to create more specific policies based on user roles

CREATE POLICY "Allow all for authenticated users" ON clients
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON suppliers
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON employees
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON products
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON inventory
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON inventory_movements
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON quotes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON quote_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON orders
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON order_items
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON invoices
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON maintenances
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON bank_accounts
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON cash_boxes
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON transactions
  FOR ALL USING (auth.role() = 'authenticated');

CREATE POLICY "Allow all for authenticated users" ON invitations
  FOR ALL USING (auth.role() = 'authenticated');

-- ============================================================================
-- VIEWS FOR COMMON QUERIES
-- ============================================================================

-- View for products with inventory information
CREATE OR REPLACE VIEW products_with_inventory AS
SELECT 
  p.*,
  COALESCE(SUM(i.quantity), 0) as total_stock,
  COALESCE(MIN(i.min_stock), 0) as min_stock_alert
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id;

-- View for orders with client information
CREATE OR REPLACE VIEW orders_with_client AS
SELECT 
  o.*,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone
FROM orders o
JOIN clients c ON o.client_id = c.id;

-- View for quotes with client information
CREATE OR REPLACE VIEW quotes_with_client AS
SELECT 
  q.*,
  c.name as client_name,
  c.email as client_email,
  c.phone as client_phone
FROM quotes q
JOIN clients c ON q.client_id = c.id;

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

-- ============================================================================
-- INITIAL DATA SETUP COMMENTS
-- ============================================================================

-- After running this schema, you should:
-- 1. Run the data migration scripts to populate tables with mock data
-- 2. Set up proper user roles and permissions
-- 3. Configure backup and maintenance procedures
-- 4. Update application code to use database instead of mock data

-- Schema creation completed successfully
-- AquaPool System Database - Complete schema for pool equipment and services management
