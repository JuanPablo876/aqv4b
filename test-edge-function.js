// Test script for send-quote-email Edge Function
// Run this in the browser console or Node.js to test the function directly

const testQuoteEmail = async () => {
  try {
    console.log('🧪 Testing send-quote-email Edge Function...');
    
    const testData = {
      clientEmail: 'test@example.com',
      clientName: 'Test Client',
      quote: {
        id: 'test-123',
        quote_number: 'Q-2025-001',
        date: new Date().toISOString(),
        valid_until: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
        total: 1500.00,
        notes: 'Test quote for debugging'
      },
      quoteItems: [
        {
          product_name: 'Test Product 1',
          quantity: 2,
          price: 500.00
        },
        {
          product_name: 'Test Product 2',
          quantity: 1,
          price: 500.00
        }
      ]
    };

    const response = await fetch('https://gbdmutklayjmatlquktt.supabase.co/functions/v1/send-quote-email', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': 'Bearer YOUR_ANON_KEY_HERE', // Replace with your anon key
      },
      body: JSON.stringify(testData)
    });

    console.log('📡 Response status:', response.status);
    console.log('📡 Response headers:', Object.fromEntries(response.headers.entries()));
    
    const result = await response.json();
    console.log('📧 Response data:', result);
    
    if (response.ok) {
      console.log('✅ Test passed! Function is working correctly.');
    } else {
      console.log('❌ Test failed. Check the error details above.');
    }
    
  } catch (error) {
    console.error('❌ Test error:', error);
  }
};

// Uncomment the line below to run the test
// testQuoteEmail();

console.log('📋 Test script loaded. Call testQuoteEmail() to run the test.');
console.log('⚠️  Remember to replace YOUR_ANON_KEY_HERE with your actual Supabase anon key.');
