-- Comprehensive Database Schema Fixes Migration
-- This fixes column name mismatches between the database schema and the application code

-- Add google_maps_link column to quotes table (this field was added in the application but missing from schema)
ALTER TABLE quotes ADD COLUMN IF NOT EXISTS google_maps_link TEXT;

-- The maintenances table already has google_maps_link column, so no changes needed
-- The suppliers table already has the correct columns, so no changes needed  
-- The employees table already has google_maps_link column, so no changes needed

-- Note: The application code has been updated to match the existing database schema:
-- - SuppliersPage: contact_person -> contact
-- - SuppliersPage: Removed status field (doesn't exist in suppliers table)
-- - EmployeesPage: googleMapsLink -> google_maps_link  
-- - MaintenancesAddModal: camelCase fields -> snake_case fields
-- - MaintenancesAddModal: Fixed last_service_employee_id UUID handling (don't parse as integer)
-- - QuotesAddModal: google_maps_link field added to both app and database
-- - QuotesAddModal: Fixed to only send valid database fields (not clientName, clientEmail, etc.)
-- - useData.js: Fixed quote_items mapping (productId -> product_id)
