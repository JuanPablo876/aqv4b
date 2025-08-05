// Utility to populate order_items table with test data
import { supabase } from '../supabaseClient';

export const populateOrderItems = async () => {
  try {

    
    // First, get all orders
    const { data: orders, error: ordersError } = await supabase
      .from('orders')
      .select('id, order_number');
    
    if (ordersError) {
      console.error('Error fetching orders:', ordersError);
      return;
    }
    

    
    // Check which orders already have items
    const { data: existingItems, error: existingError } = await supabase
      .from('order_items')
      .select('order_id');
    
    if (existingError) {
      console.error('Error fetching existing order items:', existingError);
      return;
    }
    
    const ordersWithItems = new Set(existingItems?.map(item => item.order_id) || []);
    const ordersNeedingItems = orders?.filter(order => !ordersWithItems.has(order.id)) || [];
    


    
    if (ordersNeedingItems.length === 0) {

      return [];
    }
    
    // Get some products to use as test items
    const { data: products, error: productsError } = await supabase
      .from('products')
      .select('id, name, price')
      .limit(10);
    
    if (productsError) {
      console.error('Error fetching products:', productsError);
      return;
    }
    

    
    if (!ordersNeedingItems?.length || !products?.length) {

      return;
    }
    
    // Create test order items for orders that don't have any
    const orderItemsToInsert = [];
    
    ordersNeedingItems.forEach((order, orderIndex) => {
      // Add 2-4 random products to each order
      const numItems = Math.floor(Math.random() * 3) + 2; // 2-4 items
      
      for (let i = 0; i < numItems; i++) {
        const randomProduct = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1; // 1-5 quantity
        const price = randomProduct.price || Math.floor(Math.random() * 100) + 10; // Use product price or random
        const discount = Math.random() > 0.7 ? Math.floor(Math.random() * 20) + 5 : 0; // 30% chance of discount
        
        orderItemsToInsert.push({
          order_id: order.id,
          product_id: randomProduct.id,
          quantity: quantity,
          price: price,
          discount: discount
        });
      }
    });
    

    
    // Insert the order items
    const { data: insertedItems, error: insertError } = await supabase
      .from('order_items')
      .insert(orderItemsToInsert)
      .select();
    
    if (insertError) {
      console.error('❌ Error inserting order items:', insertError);
      return;
    }
    


    
    return insertedItems;
    
  } catch (error) {
    console.error('❌ Error in populateOrderItems:', error);
  }
};

// Function to check if order items exist
export const checkOrderItems = async () => {
  try {
    const { data: existingItems, error } = await supabase
      .from('order_items')
      .select('id')
      .limit(1);
    
    if (error) {
      console.error('Error checking order items:', error);
      return false;
    }
    
    return existingItems && existingItems.length > 0;
  } catch (error) {
    console.error('Error in checkOrderItems:', error);
    return false;
  }
};
