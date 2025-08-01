// Test Data Script - Add sample orders for testing dashboard filtering
// Run this script to add test data to the database

const { createClient } = require('@supabase/supabase-js');

// Initialize Supabase client
const supabaseUrl = process.env.REACT_APP_SUPABASE_URL || 'your-supabase-url';
const supabaseKey = process.env.REACT_APP_SUPABASE_ANON_KEY || 'your-supabase-key';

const supabase = createClient(supabaseUrl, supabaseKey);

async function addTestOrders() {
  try {
    console.log('🔧 Adding test orders for dashboard filtering...');
    
    // Create test orders with different dates
    const today = new Date();
    const testOrders = [
      {
        client_id: null, // We'll set this after getting a client
        total: 2500.00,
        status: 'completed',
        created_at: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString(), // 1 day ago
        items: [
          { product_id: null, quantity: 10, price: 250.00 }
        ]
      },
      {
        client_id: null,
        total: 1800.00,
        status: 'pending',
        created_at: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString(), // 5 days ago
        items: [
          { product_id: null, quantity: 6, price: 300.00 }
        ]
      },
      {
        client_id: null,
        total: 3200.00,
        status: 'completed',
        created_at: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString(), // 15 days ago
        items: [
          { product_id: null, quantity: 8, price: 400.00 }
        ]
      },
      {
        client_id: null,
        total: 4500.00,
        status: 'completed',
        created_at: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString(), // 45 days ago (outside last 30)
        items: [
          { product_id: null, quantity: 15, price: 300.00 }
        ]
      },
      {
        client_id: null,
        total: 1200.00,
        status: 'pending',
        created_at: new Date(today.getTime() - 100 * 24 * 60 * 60 * 1000).toISOString(), // 100 days ago (outside last 3 months)
        items: [
          { product_id: null, quantity: 4, price: 300.00 }
        ]
      }
    ];

    // First, check if we have any clients
    const { data: clients, error: clientError } = await supabase
      .from('clients')
      .select('id')
      .limit(1);

    if (clientError) throw clientError;

    let clientId = null;
    if (clients && clients.length > 0) {
      clientId = clients[0].id;
    } else {
      // Create a test client
      const { data: newClient, error: createClientError } = await supabase
        .from('clients')
        .insert([{
          name: 'Cliente de Prueba',
          email: 'test@example.com',
          status: 'active'
        }])
        .select()
        .single();

      if (createClientError) throw createClientError;
      clientId = newClient.id;
    }

    // Update all test orders with the client ID
    testOrders.forEach(order => {
      order.client_id = clientId;
    });

    // Insert the test orders
    const { data: insertedOrders, error: insertError } = await supabase
      .from('orders')
      .insert(testOrders)
      .select();

    if (insertError) throw insertError;

    console.log('✅ Successfully added test orders:', insertedOrders.length);
    console.log('📊 Test data summary:');
    testOrders.forEach((order, index) => {
      const daysAgo = Math.round((today - new Date(order.created_at)) / (1000 * 60 * 60 * 24));
      console.log(`   Order ${index + 1}: $${order.total} - ${daysAgo} days ago`);
    });

    console.log('\n🎯 Now you can test the date filtering:');
    console.log('   - "Hoy": Should show $0 (no orders today)');
    console.log('   - "Últimos 7 días": Should show $4,300 (2 orders)');
    console.log('   - "Últimos 30 días": Should show $7,500 (3 orders)');
    console.log('   - "Últimos 3 meses": Should show $12,000 (4 orders)');

  } catch (error) {
    console.error('❌ Error adding test orders:', error);
  }
}

addTestOrders();
