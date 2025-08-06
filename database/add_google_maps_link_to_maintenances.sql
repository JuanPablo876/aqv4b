-- Migration to rename an existing column to googleMapsLink in the maintenances table
ALTER TABLE maintenances
RENAME COLUMN existing_column_name TO googleMapsLink;
