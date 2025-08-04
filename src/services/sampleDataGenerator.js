import { supabase } from '../supabaseClient';

/**
 * Sample Data Generator for Financial and Reports Data
 * This creates realistic sample data to populate the database
 */
class SampleDataGenerator {
  async generateSampleFinancialData() {
    try {
      console.log('Generating sample financial data...');

      // 1. Create bank accounts if they don't exist
      const { data: existingAccounts } = await supabase
        .from('bank_accounts')
        .select('id')
        .limit(1);

      if (!existingAccounts || existingAccounts.length === 0) {
        const bankAccounts = [
          {
            name: 'Cuenta Principal BBVA',
            bank: 'BBVA',
            account_number: '0123456789',
            balance: 50000.00,
            currency: 'MXN',
            status: 'active'
          },
          {
            name: 'Cuenta de Ahorros Banamex',
            bank: 'Banamex',
            account_number: '9876543210',
            balance: 25000.00,
            currency: 'MXN',
            status: 'active'
          }
        ];

        await supabase.from('bank_accounts').insert(bankAccounts);
        console.log('✅ Created sample bank accounts');
      }

      // 2. Create cash boxes if they don't exist
      const { data: existingCashBoxes } = await supabase
        .from('cash_boxes')
        .select('id')
        .limit(1);

      if (!existingCashBoxes || existingCashBoxes.length === 0) {
        const cashBoxes = [
          {
            name: 'Caja Principal',
            responsible: 'Gerente General',
            balance: 5000.00,
            currency: 'MXN',
            location: 'Oficina Principal'
          },
          {
            name: 'Caja Secundaria',
            responsible: 'Supervisor',
            balance: 2000.00,
            currency: 'MXN',
            location: 'Almacén'
          }
        ];

        await supabase.from('cash_boxes').insert(cashBoxes);
        console.log('✅ Created sample cash boxes');
      }

      // 3. Generate financial transactions for the last 3 months
      const { data: existingTransactions } = await supabase
        .from('transactions')
        .select('id')
        .limit(1);

      if (!existingTransactions || existingTransactions.length === 0) {
        const transactions = [];
        const startDate = new Date();
        startDate.setMonth(startDate.getMonth() - 3); // 3 months ago

        // Get bank account IDs
        const { data: accounts } = await supabase
          .from('bank_accounts')
          .select('id');

        const accountIds = accounts?.map(a => a.id) || [];

        // Generate transactions
        for (let i = 0; i < 50; i++) {
          const transactionDate = new Date(startDate);
          transactionDate.setDate(transactionDate.getDate() + Math.floor(Math.random() * 90));

          const isIncome = Math.random() > 0.3; // 70% income, 30% expense
          const amount = isIncome 
            ? Math.round((Math.random() * 5000 + 500) * 100) / 100 // $500-$5500 income
            : Math.round((Math.random() * 2000 + 100) * 100) / 100; // $100-$2100 expense

          const categories = isIncome 
            ? ['Ventas', 'Servicios', 'Intereses', 'Otros Ingresos']
            : ['Materiales', 'Salarios', 'Servicios', 'Mantenimiento', 'Oficina', 'Transporte'];

          transactions.push({
            date: transactionDate.toISOString().split('T')[0],
            transaction_type: isIncome ? 'income' : 'expense',
            category: categories[Math.floor(Math.random() * categories.length)],
            description: isIncome 
              ? `Pago cliente - Orden #${1000 + i}`
              : `Gasto operativo - ${categories[Math.floor(Math.random() * categories.length)]}`,
            amount: amount,
            account_type: 'bank',
            account_id: accountIds.length > 0 ? accountIds[Math.floor(Math.random() * accountIds.length)] : null,
            reference_document: `DOC-${Date.now()}-${i}`,
            status: 'completed'
          });
        }

        await supabase.from('transactions').insert(transactions);
        console.log('✅ Created sample financial transactions');
      }

      // 4. Generate sample orders with realistic data
      await this.generateSampleOrders();

      // 5. Generate sample invoices
      await this.generateSampleInvoices();

      console.log('🎉 Sample financial data generation completed!');
      return true;

    } catch (error) {
      console.error('Error generating sample financial data:', error);
      throw error;
    }
  }

  async generateSampleOrders() {
    const { data: existingOrders } = await supabase
      .from('orders')
      .select('id')
      .limit(1);

    if (existingOrders && existingOrders.length > 0) {
      console.log('Orders already exist, skipping...');
      return;
    }

    // Get clients and products for realistic orders
    const { data: clients } = await supabase.from('clients').select('id').limit(10);
    const { data: products } = await supabase.from('products').select('id, price').limit(20);

    if (!clients || clients.length === 0 || !products || products.length === 0) {
      console.log('Need clients and products to generate orders');
      return;
    }

    const orders = [];
    const orderItems = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let i = 0; i < 30; i++) {
      const orderDate = new Date(startDate);
      orderDate.setDate(orderDate.getDate() + Math.floor(Math.random() * 90));

      const client = clients[Math.floor(Math.random() * clients.length)];
      const numProducts = Math.floor(Math.random() * 3) + 1; // 1-3 products per order

      let total = 0;
      const orderNumber = `ORD-${Date.now()}-${i}`;
      
      // Create the order first (we'll generate a UUID for it)
      const orderId = `ord-${Date.now()}-${i}-${Math.random().toString(36).substr(2, 9)}`;
      
      for (let j = 0; j < numProducts; j++) {
        const product = products[Math.floor(Math.random() * products.length)];
        const quantity = Math.floor(Math.random() * 5) + 1;
        const price = product.price || 100;
        const subtotal = quantity * price;
        
        // Create order item record
        orderItems.push({
          order_id: orderId,
          product_id: product.id,
          quantity: quantity,
          price: price,
          subtotal: subtotal
        });
        
        total += subtotal;
      }

      const statuses = ['pending', 'confirmed', 'completed', 'delivered'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      orders.push({
        id: orderId,
        order_number: orderNumber,
        client_id: client.id,
        status: status,
        date: orderDate.toISOString().split('T')[0],
        subtotal: total * 0.84, // Before tax
        tax: total * 0.16, // 16% tax
        total: total,
        notes: `Orden generada automáticamente #${i + 1}`,
        created_at: orderDate.toISOString()
      });
    }

    // Insert orders first
    await supabase.from('orders').insert(orders);
    console.log('✅ Created sample orders');
    
    // Then insert order items
    await supabase.from('order_items').insert(orderItems);
    console.log('✅ Created sample order items');
  }

  async generateSampleInvoices() {
    const { data: existingInvoices } = await supabase
      .from('invoices')
      .select('id')
      .limit(1);

    if (existingInvoices && existingInvoices.length > 0) {
      console.log('Invoices already exist, skipping...');
      return;
    }

    // Get clients for realistic invoices
    const { data: clients } = await supabase.from('clients').select('id').limit(10);

    if (!clients || clients.length === 0) {
      console.log('Need clients to generate invoices');
      return;
    }

    const invoices = [];
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    for (let i = 0; i < 20; i++) {
      const invoiceDate = new Date(startDate);
      invoiceDate.setDate(invoiceDate.getDate() + Math.floor(Math.random() * 90));

      const client = clients[Math.floor(Math.random() * clients.length)];
      const amount = Math.round((Math.random() * 8000 + 1000) * 100) / 100; // $1000-$9000

      const statuses = ['pending', 'paid', 'overdue'];
      const status = statuses[Math.floor(Math.random() * statuses.length)];

      invoices.push({
        invoice_number: `INV-${Date.now()}-${i}`,
        client_id: client.id,
        status: status,
        date: invoiceDate.toISOString().split('T')[0],
        due_date: new Date(invoiceDate.getTime() + 30 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 30 days
        subtotal: amount * 0.84,
        tax: amount * 0.16,
        total: amount,
        description: `Factura por servicios - ${i + 1}`,
        created_at: invoiceDate.toISOString()
      });
    }

    await supabase.from('invoices').insert(invoices);
    console.log('✅ Created sample invoices');
  }

  async clearAllSampleData() {
    try {
      console.log('Clearing all sample data...');
      
      // Clear in order due to foreign key constraints
      await supabase.from('order_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('transactions').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('invoices').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('orders').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('cash_boxes').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      await supabase.from('bank_accounts').delete().neq('id', '00000000-0000-0000-0000-000000000000');
      
      console.log('✅ Sample data cleared');
    } catch (error) {
      console.error('Error clearing sample data:', error);
      throw error;
    }
  }
}

export default new SampleDataGenerator();
