# PowerShell script to run AquaPool database migrations
# Usage: .\run_migrations.ps1 "your-supabase-connection-string"

param(
    [Parameter(Mandatory=$true)]
    [string]$ConnectionString
)

# Migration files in correct order
$migrationFiles = @(
    "01_migrate_clients_data.sql",
    "02_migrate_suppliers_data.sql", 
    "03_migrate_employees_data.sql",
    "04_migrate_products_data.sql",
    "05_migrate_inventory_data.sql",
    "06_migrate_quotes_orders_invoices_data.sql",
    "07_migrate_maintenances_finance_data.sql"
)

Write-Host "🚀 Starting AquaPool Database Migration..." -ForegroundColor Green
Write-Host "Connection: $($ConnectionString -replace 'postgres:.*@', 'postgres:***@')" -ForegroundColor Yellow

$errorCount = 0

foreach ($file in $migrationFiles) {
    if (Test-Path $file) {
        Write-Host "📊 Running migration: $file" -ForegroundColor Cyan
        
        try {
            $result = psql $ConnectionString -f $file 2>&1
            
            if ($LASTEXITCODE -eq 0) {
                Write-Host "✅ $file completed successfully" -ForegroundColor Green
            } else {
                Write-Host "❌ $file failed with exit code $LASTEXITCODE" -ForegroundColor Red
                Write-Host "Error output: $result" -ForegroundColor Red
                $errorCount++
            }
        }
        catch {
            Write-Host "❌ Exception running $file`: $_" -ForegroundColor Red
            $errorCount++
        }
    } else {
        Write-Host "⚠️  Migration file not found: $file" -ForegroundColor Yellow
        $errorCount++
    }
}

Write-Host "`n🏁 Migration Summary:" -ForegroundColor Magenta
if ($errorCount -eq 0) {
    Write-Host "✅ All migrations completed successfully!" -ForegroundColor Green
    Write-Host "🔍 Running verification query..." -ForegroundColor Cyan
    
    # Verification query
    $verificationQuery = @"
SELECT 'clients' as table_name, COUNT(*) as records FROM clients
UNION ALL SELECT 'suppliers', COUNT(*) FROM suppliers
UNION ALL SELECT 'employees', COUNT(*) FROM employees
UNION ALL SELECT 'products', COUNT(*) FROM products
UNION ALL SELECT 'inventory', COUNT(*) FROM inventory
UNION ALL SELECT 'quotes', COUNT(*) FROM quotes
UNION ALL SELECT 'orders', COUNT(*) FROM orders
UNION ALL SELECT 'invoices', COUNT(*) FROM invoices
UNION ALL SELECT 'maintenances', COUNT(*) FROM maintenances
ORDER BY table_name;
"@
    
    psql $ConnectionString -c $verificationQuery
    
    Write-Host "`n🎉 Database migration completed! You can now update your application code." -ForegroundColor Green
} else {
    Write-Host "❌ $errorCount migration(s) failed. Please check the errors above." -ForegroundColor Red
    exit 1
}
