# Terminal Migration Guide for Supabase

## Prerequisites

1. **Install PostgreSQL Client Tools**
   - Windows: Download from https://www.postgresql.org/download/windows/
   - Or use WSL with: `sudo apt-get install postgresql-client`

2. **Get Your Supabase Connection String**
   - Go to Supabase Dashboard → Settings → Database
   - Copy the connection string (URI format)
   - It looks like: `postgresql://postgres:[password]@[host].supabase.co:5432/postgres`

## Option 1: Run Individual Migration Files (Recommended)

Since Supabase doesn't support `\i` commands for remote connections, we'll run each file individually:

```bash
# Navigate to database directory
cd "c:\Users\Juan Pablo Barba\Documents\Project\aqv4\database"

# Set your Supabase connection string
set SUPABASE_URL="postgresql://postgres:your-password@your-project.supabase.co:5432/postgres"

# Run migrations in order (replace with your actual connection string)
psql "%SUPABASE_URL%" -f 01_migrate_clients_data.sql
psql "%SUPABASE_URL%" -f 02_migrate_suppliers_data.sql  
psql "%SUPABASE_URL%" -f 03_migrate_employees_data.sql
psql "%SUPABASE_URL%" -f 04_migrate_products_data.sql
psql "%SUPABASE_URL%" -f 05_migrate_inventory_data.sql
psql "%SUPABASE_URL%" -f 06_migrate_quotes_orders_invoices_data.sql
psql "%SUPABASE_URL%" -f 07_migrate_maintenances_finance_data.sql
```

## Option 2: Single Command with All Files

```bash
# Navigate to database directory
cd "c:\Users\Juan Pablo Barba\Documents\Project\aqv4\database"

# Run all migrations with one command (Windows)
for %f in (01_migrate_clients_data.sql 02_migrate_suppliers_data.sql 03_migrate_employees_data.sql 04_migrate_products_data.sql 05_migrate_inventory_data.sql 06_migrate_quotes_orders_invoices_data.sql 07_migrate_maintenances_finance_data.sql) do psql "your-connection-string" -f %f

# Or PowerShell version:
$files = @("01_migrate_clients_data.sql", "02_migrate_suppliers_data.sql", "03_migrate_employees_data.sql", "04_migrate_products_data.sql", "05_migrate_inventory_data.sql", "06_migrate_quotes_orders_invoices_data.sql", "07_migrate_maintenances_finance_data.sql")
foreach ($file in $files) { psql "your-connection-string" -f $file }
```

## Option 3: Create Combined Migration Script

Run this script to create a single migration file:
