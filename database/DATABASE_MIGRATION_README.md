# AquaPool Database Migration Guide

This directory contains all the SQL scripts needed to migrate the AquaPool system from mock data to a PostgreSQL database with Supabase.

## 📁 File Structure

```
database/
├── 00_complete_database_schema.sql     # Complete database schema
├── 01_migrate_clients_data.sql         # Client data migration
├── 02_migrate_suppliers_data.sql       # Supplier data migration
├── 03_migrate_employees_data.sql       # Employee data migration
├── 04_migrate_products_data.sql        # Product data migration
├── 05_migrate_inventory_data.sql       # Inventory data migration
├── 06_migrate_quotes_orders_invoices_data.sql  # Sales data migration
├── 07_migrate_maintenances_finance_data.sql    # Maintenance and finance data
├── 99_master_migration.sql             # Master migration script
└── DATABASE_MIGRATION_README.md        # This file
```

## 🚀 Migration Process

### Step 1: Prepare Your Database

1. Ensure you have a PostgreSQL database ready (Supabase recommended)
2. Make sure you have the necessary permissions to create tables and insert data
3. Backup any existing data if applicable

### Step 2: Run Schema Creation

First, run the schema creation script:

```sql
-- Run this first to create all tables and relationships
\i 00_complete_database_schema.sql
```

### Step 3: Run Data Migration

You have two options:

#### Option A: Run Master Migration (Recommended)
```sql
-- This runs all migrations in the correct order
\i 99_master_migration.sql
```

#### Option B: Run Individual Migrations
```sql
-- Run in this exact order to respect foreign key dependencies
\i 01_migrate_clients_data.sql
\i 02_migrate_suppliers_data.sql
\i 03_migrate_employees_data.sql
\i 04_migrate_products_data.sql
\i 05_migrate_inventory_data.sql
\i 06_migrate_quotes_orders_invoices_data.sql
\i 07_migrate_maintenances_finance_data.sql
```

### Step 4: Verify Migration

After running the migrations, verify the data:

```sql
-- Check record counts
SELECT 'clients' as table_name, COUNT(*) FROM clients
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'orders', COUNT(*) FROM orders;

-- Test relationships
SELECT o.order_number, c.name 
FROM orders o 
JOIN clients c ON o.client_id = c.id 
LIMIT 5;
```

## 📊 Database Schema Overview

### Core Tables

1. **clients** - Customer information
2. **suppliers** - Vendor information  
3. **employees** - Staff information
4. **products** - Product catalog
5. **inventory** - Stock management
6. **inventory_movements** - Stock movement history

### Sales Tables

7. **quotes** - Customer quotations
8. **quote_items** - Quote line items
9. **orders** - Customer orders
10. **order_items** - Order line items
11. **invoices** - Billing information

### Service Tables

12. **maintenances** - Maintenance schedules

### Finance Tables

13. **bank_accounts** - Bank account information
14. **cash_boxes** - Cash box management
15. **transactions** - Financial transactions

## 🔄 Data Migration Details

### Mock Data Mapping

The migration scripts transform mock data from JavaScript files to proper database records:

- **UUIDs**: All entities use UUID primary keys instead of integer IDs
- **Relationships**: Proper foreign key relationships established
- **JSON Fields**: Complex data structures stored as JSONB
- **Timestamps**: Proper timestamp handling with time zones
- **Constraints**: Data integrity enforced through database constraints

### Key Changes from Mock Data

1. **ID Format**: Changed from strings like '1', '2' to proper UUIDs
2. **Relationships**: Foreign keys properly defined and enforced
3. **Data Types**: Appropriate data types for each field (DECIMAL for money, etc.)
4. **Indexes**: Performance indexes added for common queries
5. **Security**: Row Level Security (RLS) policies implemented

## 🛠 Application Code Updates Required

After running the migration, update your application:

### 1. Update supabaseClient.js
```javascript
// Example: Replace localStorage with Supabase queries
const { data: clients } = await supabase
  .from('clients')
  .select('*')
  .eq('status', 'active');
```

### 2. Update dataService.js
Replace mock data imports with database queries:

```javascript
// Before
import mockClients from '../mock/clients.js';

// After  
async getClients() {
  const { data, error } = await supabase
    .from('clients')
    .select('*')
    .order('name');
  return data;
}
```

### 3. Update Components
Replace hardcoded IDs with UUID handling:

```javascript
// Before
const client = clients.find(c => c.id === '1');

// After
const client = clients.find(c => c.id === clientUuid);
```

## ⚠️ Important Notes

1. **Foreign Key Dependencies**: Always respect the migration order to avoid foreign key constraint errors

2. **UUID Format**: The migration uses specific UUID patterns:
   - Clients: `00000000-0000-0000-0000-00000000000X`
   - Suppliers: `10000000-0000-0000-0000-00000000000X`
   - Employees: `20000000-0000-0000-0000-00000000000X`
   - Products: `30000000-0000-0000-0000-00000000000X`
   - Inventory: `40000000-0000-0000-0000-00000000000X`

3. **Data Integrity**: All foreign key relationships are enforced

4. **Security**: RLS policies are enabled but set to allow all authenticated users

5. **Performance**: Indexes are created for common query patterns

## 🔍 Common Queries After Migration

### Get Products with Inventory
```sql
SELECT p.name, p.price, COALESCE(SUM(i.quantity), 0) as stock
FROM products p
LEFT JOIN inventory i ON p.id = i.product_id
GROUP BY p.id, p.name, p.price;
```

### Get Orders with Client Details
```sql
SELECT o.order_number, c.name as client, o.total, o.status
FROM orders o
JOIN clients c ON o.client_id = c.id
ORDER BY o.created_at DESC;
```

### Get Low Stock Alerts
```sql
SELECT p.name, i.quantity, i.min_stock
FROM inventory i
JOIN products p ON i.product_id = p.id
WHERE i.quantity <= i.min_stock;
```

## 🐛 Troubleshooting

### Foreign Key Errors
If you get foreign key constraint errors:
1. Check migration order
2. Verify referenced records exist
3. Check UUID format consistency

### Data Type Errors
If you get data type errors:
1. Check DECIMAL vs INTEGER usage
2. Verify date format (YYYY-MM-DD)
3. Check JSONB syntax for complex fields

### RLS Policy Issues
If queries fail due to RLS:
1. Verify user is authenticated
2. Check RLS policies are correctly defined
3. Consider disabling RLS for testing

## 📞 Support

If you encounter issues during migration:
1. Check PostgreSQL logs for detailed error messages
2. Verify all prerequisites are met
3. Test with a small subset of data first
4. Ensure proper permissions on the database

## ✅ Post-Migration Checklist

- [ ] All tables created successfully
- [ ] All data migrated without errors
- [ ] Foreign key relationships working
- [ ] Indexes created and functional
- [ ] RLS policies active
- [ ] Application code updated
- [ ] Testing completed
- [ ] Backup procedures established

---

**Migration Date**: Created July 2025  
**Database Version**: PostgreSQL 14+ with Supabase  
**Mock Data Source**: JavaScript files in `/src/mock/`
