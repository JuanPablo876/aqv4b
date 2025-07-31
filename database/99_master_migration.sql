-- Master Migration Script for AquaPool System
-- This script runs all migrations in the correct order to set up the complete database

-- ============================================================================
-- INSTRUCTIONS
-- ============================================================================
-- 1. First, run the schema creation script: 00_complete_database_schema.sql
-- 2. Then run this master migration script to populate all data
-- 3. Verify data integrity with the test queries at the end

-- ============================================================================
-- MIGRATION EXECUTION ORDER
-- ============================================================================

-- Step 1: Create base entities (no foreign key dependencies)
\echo 'Migrating Clients Data...'
\i 01_migrate_clients_data.sql

\echo 'Migrating Suppliers Data...'
\i 02_migrate_suppliers_data.sql

\echo 'Migrating Employees Data...'
\i 03_migrate_employees_data.sql

-- Step 2: Create products (depends on suppliers)
\echo 'Migrating Products Data...'
\i 04_migrate_products_data.sql

-- Step 3: Create inventory (depends on products and employees)
\echo 'Migrating Inventory Data...'
\i 05_migrate_inventory_data.sql

-- Step 4: Create quotes, orders, and invoices (depends on clients, products, employees)
\echo 'Migrating Quotes, Orders, and Invoices Data...'
\i 06_migrate_quotes_orders_invoices_data.sql

-- Step 5: Create maintenances and finance data
\echo 'Migrating Maintenances and Finance Data...'
\i 07_migrate_maintenances_finance_data.sql

-- ============================================================================
-- DATA VERIFICATION QUERIES
-- ============================================================================

\echo 'Running data verification queries...'

-- Count records in each table
SELECT 'clients' as table_name, COUNT(*) as record_count FROM clients
UNION ALL
SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL
SELECT 'employees', COUNT(*) FROM employees
UNION ALL
SELECT 'products', COUNT(*) FROM products
UNION ALL
SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL
SELECT 'inventory_movements', COUNT(*) FROM inventory_movements
UNION ALL
SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL
SELECT 'quote_items', COUNT(*) FROM quote_items
UNION ALL
SELECT 'orders', COUNT(*) FROM orders
UNION ALL
SELECT 'order_items', COUNT(*) FROM order_items
UNION ALL
SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL
SELECT 'maintenances', COUNT(*) FROM maintenances
UNION ALL
SELECT 'bank_accounts', COUNT(*) FROM bank_accounts
UNION ALL
SELECT 'cash_boxes', COUNT(*) FROM cash_boxes
UNION ALL
SELECT 'transactions', COUNT(*) FROM transactions
ORDER BY table_name;

-- Verify foreign key relationships
\echo 'Verifying foreign key relationships...'

-- Products with suppliers
SELECT 
  p.name as product_name,
  s.name as supplier_name
FROM products p
LEFT JOIN suppliers s ON p.supplier_id = s.id
WHERE p.supplier_id IS NOT NULL
LIMIT 5;

-- Orders with clients
SELECT 
  o.order_number,
  c.name as client_name,
  o.total
FROM orders o
JOIN clients c ON o.client_id = c.id
LIMIT 5;

-- Inventory with products
SELECT 
  p.name as product_name,
  i.quantity,
  i.location
FROM inventory i
JOIN products p ON i.product_id = p.id
LIMIT 5;

-- ============================================================================
-- SUMMARY STATISTICS
-- ============================================================================

\echo 'Generating summary statistics...'

-- Total values
SELECT 
  'Total Clients' as metric,
  COUNT(*)::text as value
FROM clients
UNION ALL
SELECT 
  'Total Products',
  COUNT(*)::text
FROM products
UNION ALL
SELECT 
  'Total Inventory Value',
  TO_CHAR(SUM(p.price * i.quantity), 'FM999,999,999.00')
FROM inventory i
JOIN products p ON i.product_id = p.id
UNION ALL
SELECT 
  'Total Orders Value',
  TO_CHAR(SUM(total), 'FM999,999,999.00')
FROM orders
UNION ALL
SELECT 
  'Total Pending Invoices',
  TO_CHAR(SUM(total), 'FM999,999,999.00')
FROM invoices
WHERE status = 'pending';

\echo 'Migration completed successfully!'
\echo 'Database is ready for the AquaPool application.'
