-- Add missing fields to inventory_movements table for better tracking
-- This migration adds fields that are used by the inventory management system

-- Add missing fields to inventory_movements table
ALTER TABLE inventory_movements 
ADD COLUMN IF NOT EXISTS previous_stock INTEGER,
ADD COLUMN IF NOT EXISTS new_stock INTEGER,
ADD COLUMN IF NOT EXISTS movement_date TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
ADD COLUMN IF NOT EXISTS reference_type VARCHAR(50) DEFAULT 'manual',
ADD COLUMN IF NOT EXISTS reference_id VARCHAR(100);

-- Update the check constraint to ensure consistency
ALTER TABLE inventory_movements 
DROP CONSTRAINT IF EXISTS inventory_movements_movement_type_check;

ALTER TABLE inventory_movements 
ADD CONSTRAINT inventory_movements_movement_type_check 
CHECK (movement_type IN ('entrada', 'salida', 'ajuste', 'transferencia'));

-- Add indexes for better performance
CREATE INDEX IF NOT EXISTS idx_inventory_movements_date ON inventory_movements(movement_date);
CREATE INDEX IF NOT EXISTS idx_inventory_movements_reference ON inventory_movements(reference_type, reference_id);

-- Add comments for clarity
COMMENT ON COLUMN inventory_movements.previous_stock IS 'Stock quantity before the movement';
COMMENT ON COLUMN inventory_movements.new_stock IS 'Stock quantity after the movement';
COMMENT ON COLUMN inventory_movements.movement_date IS 'When the movement occurred';
COMMENT ON COLUMN inventory_movements.reference_type IS 'Type of reference (order, manual, adjustment, etc.)';
COMMENT ON COLUMN inventory_movements.reference_id IS 'ID of the referenced document/record';
COMMENT ON COLUMN inventory_movements.balance_after IS 'Deprecated - use new_stock instead';
