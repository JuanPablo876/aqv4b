/**
 * Utility functions for generating unique order numbers
 */

/**
 * Generate a unique order number that avoids conflicts with existing orders
 * @param {Array} existingOrders - Array of existing orders with order_number field
 * @param {string} prefix - Prefix for the order number (default: 'AQV')
 * @returns {string} Unique order number
 */
export const generateUniqueOrderNumber = (existingOrders = [], prefix = 'AQV') => {
  const today = new Date();
  const day = today.getDate().toString().padStart(2, '0');
  const month = (today.getMonth() + 1).toString().padStart(2, '0');
  const year = today.getFullYear();
  const dateStr = `${day}${month}${year}`; // DDMMYYYY format
  
  // Get all existing order numbers to ensure uniqueness
  const existingOrderNumbers = new Set(
    existingOrders
      .map(order => order.order_number || order.orderNumber)
      .filter(Boolean) // Remove null/undefined values
  );
  
  // Find next available number for today
  let nextNumber = 1;
  let proposedOrderNumber;
  do {
    proposedOrderNumber = `${prefix}-${dateStr}${nextNumber}`;
    nextNumber++;
  } while (existingOrderNumbers.has(proposedOrderNumber));
  
  return proposedOrderNumber;
};

/**
 * Generate a unique test order number using timestamp to avoid conflicts
 * @param {number} index - Index for the test order
 * @param {string} prefix - Prefix for the order number (default: 'TEST')
 * @returns {string} Unique test order number
 */
export const generateUniqueTestOrderNumber = (index = 1, prefix = 'TEST') => {
  const timestamp = Date.now();
  return `${prefix}-${timestamp}-${String(index).padStart(3, '0')}`;
};

/**
 * Validate if an order number is unique among existing orders
 * @param {string} orderNumber - The order number to check
 * @param {Array} existingOrders - Array of existing orders
 * @returns {boolean} True if unique, false if duplicate
 */
export const isOrderNumberUnique = (orderNumber, existingOrders = []) => {
  const existingOrderNumbers = existingOrders
    .map(order => order.order_number || order.orderNumber)
    .filter(Boolean);
  
  return !existingOrderNumbers.includes(orderNumber);
};
