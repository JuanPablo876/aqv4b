-- Comprehensive Database Schema Fixes Migration
-- This fixes column name mismatches between the database schema and the application code

-- The maintenances table already has google_maps_link column, so no changes needed
-- The suppliers table already has the correct columns, so no changes needed
-- The employees table already has google_maps_link column, so no changes needed

-- Note: The application code has been updated to match the existing database schema:
-- - SuppliersPage: contact_person -> contact
-- - EmployeesPage: googleMapsLink -> google_maps_link  
-- - MaintenancesAddModal: camelCase fields -> snake_case fields

-- No database changes are required as the schema is already correct.
-- The JavaScript code has been updated to match the existing schema.
