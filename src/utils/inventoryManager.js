// Inventory Management Utilities
// Handles stock updates, validation, and movement tracking
import { supabase } from '../supabaseClient';

/**
 * Update inventory quantities when order items are processed
 * @param {Array} orderItems - Array of order items with productId and quantity
 * @param {string} operation - 'reduce' for sales, 'restore' for cancellations
 * @param {string} reason - Reason for the inventory movement
 * @param {string} orderId - Order ID for tracking
 * @returns {Promise<Array>} Array of inventory updates performed
 */
export const updateInventoryFromOrder = async (orderItems, operation = 'reduce', reason = 'Venta', orderId = null) => {
  const updates = [];
  const movements = [];
  
  try {
    console.log(`📦 Starting inventory ${operation} for ${orderItems.length} items`);
    
    for (const item of orderItems) {
      const productId = item.productId || item.product_id;
      const quantity = parseInt(item.quantity) || 0;
      
      if (!productId || quantity <= 0) {
        console.warn(`⚠️ Skipping invalid item:`, item);
        continue;
      }
      
      // Get current inventory record
      const { data: inventoryItems, error: fetchError } = await supabase
        .from('inventory')
        .select('*')
        .eq('product_id', productId);
      
      if (fetchError) {
        console.error(`❌ Error fetching inventory for product ${productId}:`, fetchError);
        continue;
      }
      
      if (!inventoryItems || inventoryItems.length === 0) {
        console.warn(`⚠️ No inventory record found for product ${productId}`);
        continue;
      }
      
      // Process each inventory location for this product
      for (const inventoryItem of inventoryItems) {
        const currentQuantity = inventoryItem.quantity || 0;
        let newQuantity;
        
        if (operation === 'reduce') {
          newQuantity = Math.max(0, currentQuantity - quantity);
        } else if (operation === 'restore') {
          newQuantity = currentQuantity + quantity;
        } else {
          console.error(`❌ Invalid operation: ${operation}`);
          continue;
        }
        
        // Update inventory quantity
        const { data: updatedInventory, error: updateError } = await supabase
          .from('inventory')
          .update({
            quantity: newQuantity,
            last_updated: new Date().toISOString()
          })
          .eq('id', inventoryItem.id)
          .select();
        
        if (updateError) {
          console.error(`❌ Error updating inventory ${inventoryItem.id}:`, updateError);
          continue;
        }
        
        console.log(`✅ Inventory updated: Product ${productId}, ${currentQuantity} → ${newQuantity}`);
        
        updates.push({
          inventoryId: inventoryItem.id,
          productId: productId,
          previousQuantity: currentQuantity,
          newQuantity: newQuantity,
          quantityChanged: operation === 'reduce' ? -quantity : quantity,
          location: inventoryItem.location
        });
        
        // Create inventory movement record
        const movementRecord = {
          inventory_id: inventoryItem.id,
          product_id: productId,
          movement_type: operation === 'reduce' ? 'salida' : 'entrada',
          quantity: operation === 'reduce' ? -quantity : quantity,
          previous_stock: currentQuantity,
          new_stock: newQuantity,
          reason: orderId ? `${reason} - Pedido #${orderId}` : reason,
          movement_date: new Date().toISOString(),
          reference_type: 'order',
          reference_id: orderId
        };
        
        movements.push(movementRecord);
      }
    }
    
    // Save all movement records if any updates were made
    if (movements.length > 0) {
      const { data: savedMovements, error: movementError } = await supabase
        .from('inventory_movements')
        .insert(movements)
        .select();
      
      if (movementError) {
        console.error('❌ Error saving inventory movements:', movementError);
      } else {
        console.log(`✅ Saved ${savedMovements.length} inventory movements`);
      }
    }
    
    console.log(`🎉 Inventory ${operation} completed: ${updates.length} items updated`);
    return updates;
    
  } catch (error) {
    console.error(`❌ Error in updateInventoryFromOrder:`, error);
    throw error;
  }
};

/**
 * Check if sufficient inventory is available for order items
 * @param {Array} orderItems - Array of order items to check
 * @returns {Promise<Object>} Validation result with availability info
 */
export const validateInventoryAvailability = async (orderItems) => {
  const validationResults = [];
  let allAvailable = true;
  
  try {
    console.log(`🔍 Validating inventory for ${orderItems.length} items`);
    
    for (const item of orderItems) {
      const productId = item.productId || item.product_id;
      const requestedQuantity = parseInt(item.quantity) || 0;
      
      if (!productId || requestedQuantity <= 0) {
        validationResults.push({
          productId,
          requested: requestedQuantity,
          available: 0,
          isAvailable: false,
          message: 'Producto o cantidad inválida'
        });
        allAvailable = false;
        continue;
      }
      
      // Get total available inventory for this product across all locations
      const { data: inventoryItems, error } = await supabase
        .from('inventory')
        .select('quantity, location, product_id')
        .eq('product_id', productId);
      
      if (error) {
        console.error(`❌ Error checking inventory for product ${productId}:`, error);
        validationResults.push({
          productId,
          requested: requestedQuantity,
          available: 0,
          isAvailable: false,
          message: 'Error al consultar inventario'
        });
        allAvailable = false;
        continue;
      }
      
      const totalAvailable = inventoryItems?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
      const isAvailable = totalAvailable >= requestedQuantity;
      
      validationResults.push({
        productId,
        requested: requestedQuantity,
        available: totalAvailable,
        isAvailable,
        locations: inventoryItems?.map(item => ({
          location: item.location,
          quantity: item.quantity
        })) || [],
        message: isAvailable ? 'Stock disponible' : `Stock insuficiente (disponible: ${totalAvailable})`
      });
      
      if (!isAvailable) {
        allAvailable = false;
      }
    }
    
    return {
      isValid: allAvailable,
      items: validationResults,
      summary: {
        total: orderItems.length,
        available: validationResults.filter(r => r.isAvailable).length,
        unavailable: validationResults.filter(r => !r.isAvailable).length
      }
    };
    
  } catch (error) {
    console.error('❌ Error in validateInventoryAvailability:', error);
    return {
      isValid: false,
      items: [],
      error: error.message
    };
  }
};

/**
 * Get low stock alerts based on minimum stock levels
 * @returns {Promise<Array>} Array of products with low stock
 */
export const getLowStockAlerts = async () => {
  try {
    const { data: alerts, error } = await supabase
      .from('inventory')
      .select(`
        id,
        quantity,
        location,
        product_id,
        products!inner (
          id,
          name,
          sku,
          min_stock
        )
      `)
      .lte('quantity', supabase.raw('products.min_stock'));
    
    if (error) {
      console.error('❌ Error fetching low stock alerts:', error);
      return [];
    }
    
    return alerts?.map(alert => ({
      inventoryId: alert.id,
      productId: alert.product_id,
      productName: alert.products.name,
      sku: alert.products.sku,
      currentStock: alert.quantity,
      minStock: alert.products.min_stock,
      location: alert.location,
      status: alert.quantity === 0 ? 'critical' : 'warning'
    })) || [];
    
  } catch (error) {
    console.error('❌ Error in getLowStockAlerts:', error);
    return [];
  }
};

/**
 * Create inventory movement record manually (for adjustments, receipts, etc.)
 * @param {Object} movementData - Movement details
 * @returns {Promise<Object>} Created movement record
 */
export const createInventoryMovement = async (movementData) => {
  try {
    const {
      inventoryId,
      productId,
      movementType, // 'entrada', 'salida', 'ajuste'
      quantity,
      reason,
      reference = null
    } = movementData;
    
    // Get current inventory quantity
    const { data: inventory, error: fetchError } = await supabase
      .from('inventory')
      .select('quantity')
      .eq('id', inventoryId)
      .single();
    
    if (fetchError || !inventory) {
      throw new Error(`Error fetching inventory: ${fetchError?.message || 'Not found'}`);
    }
    
    const previousStock = inventory.quantity;
    const newStock = movementType === 'entrada' 
      ? previousStock + Math.abs(quantity)
      : movementType === 'salida'
      ? Math.max(0, previousStock - Math.abs(quantity))
      : Math.abs(quantity); // For adjustments, set absolute value
    
    // Update inventory quantity
    const { error: updateError } = await supabase
      .from('inventory')
      .update({ 
        quantity: newStock,
        last_updated: new Date().toISOString()
      })
      .eq('id', inventoryId);
    
    if (updateError) {
      throw new Error(`Error updating inventory: ${updateError.message}`);
    }
    
    // Create movement record
    const movementRecord = {
      inventory_id: inventoryId,
      product_id: productId,
      movement_type: movementType,
      quantity: movementType === 'salida' ? -Math.abs(quantity) : Math.abs(quantity),
      previous_stock: previousStock,
      new_stock: newStock,
      reason,
      movement_date: new Date().toISOString(),
      reference_type: reference?.type || 'manual',
      reference_id: reference?.id || null
    };
    
    const { data: savedMovement, error: movementError } = await supabase
      .from('inventory_movements')
      .insert(movementRecord)
      .select()
      .single();
    
    if (movementError) {
      throw new Error(`Error saving movement: ${movementError.message}`);
    }
    
    console.log(`✅ Inventory movement created: ${movementType} ${quantity} for product ${productId}`);
    return savedMovement;
    
  } catch (error) {
    console.error('❌ Error in createInventoryMovement:', error);
    throw error;
  }
};

export default {
  updateInventoryFromOrder,
  validateInventoryAvailability,
  getLowStockAlerts,
  createInventoryMovement
};
