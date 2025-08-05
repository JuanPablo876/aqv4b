import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import sampleDataGenerator from '../services/sampleDataGenerator';
import VenetianTile from './VenetianTile';

const DatabaseDiagnostic = () => {
  const [diagnosticData, setDiagnosticData] = useState({});
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    runDiagnostic();
  }, []);

  const generateSampleData = async () => {
    try {
      setGenerating(true);
      await sampleDataGenerator.generateSampleFinancialData();
      await runDiagnostic(); // Refresh the diagnostic after generating data
      alert('✅ Sample data generated successfully! Check Reports and Finance tabs now.');
    } catch (error) {
      console.error('Error generating sample data:', error);
      alert('❌ Error generating sample data: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const clearSampleData = async () => {
    if (window.confirm('Are you sure you want to clear all sample data? This cannot be undone.')) {
      try {
        setGenerating(true);
        await sampleDataGenerator.clearAllSampleData();
        await runDiagnostic(); // Refresh the diagnostic after clearing data
        alert('✅ Sample data cleared successfully!');
      } catch (error) {
        console.error('Error clearing sample data:', error);
        alert('❌ Error clearing sample data: ' + error.message);
      } finally {
        setGenerating(false);
      }
    }
  };

  const initializeReviewsTable = async () => {
    try {
      setGenerating(true);
      
      // Create the reviews table with sample data
      const sampleReviews = [
        {
          review_type: 'general',
          title: 'Excelente servicio al cliente',
          content: 'El equipo de AquaLiquim siempre responde rápidamente a nuestras consultas y necesidades. Muy profesionales.',
          rating: 5,
          status: 'approved',
          is_public: true,
          source: 'internal',
          tags: ['servicio-cliente', 'comunicacion'],
          priority: 'medium'
        },
        {
          review_type: 'general',
          title: 'Productos de alta calidad',
          content: 'Los químicos que compramos siempre llegan en perfectas condiciones y con excelente calidad.',
          rating: 5,
          status: 'approved',
          is_public: true,
          source: 'internal',
          tags: ['calidad', 'productos'],
          priority: 'medium'
        },
        {
          review_type: 'service',
          title: 'Mantenimiento de piscina excelente',
          content: 'El técnico llegó puntual y realizó un trabajo impecable. La piscina quedó cristalina.',
          rating: 5,
          status: 'pending',
          is_public: false,
          source: 'internal',
          tags: ['mantenimiento', 'piscina'],
          priority: 'high'
        },
        {
          review_type: 'general',
          title: 'Precios competitivos',
          content: 'Los precios son justos para la calidad de productos y servicios que ofrecen.',
          rating: 4,
          status: 'approved',
          is_public: true,
          source: 'internal',
          tags: ['precios', 'valor'],
          priority: 'low'
        }
      ];

      // Insert sample reviews
      const { data: reviewsData, error: reviewsError } = await supabase
        .from('reviews')
        .insert(sampleReviews);

      if (reviewsError) {
        console.error('Error inserting sample reviews:', reviewsError);
        alert('❌ Error initializing reviews: ' + reviewsError.message);
        return;
      }

      await runDiagnostic(); // Refresh the diagnostic
      alert('✅ Reviews table initialized with sample data successfully!');
    } catch (error) {
      console.error('Error initializing reviews table:', error);
      alert('❌ Error initializing reviews: ' + error.message);
    } finally {
      setGenerating(false);
    }
  };

  const runDiagnostic = async () => {
    try {
      setLoading(true);
      const results = {};

      // Check orders table
      const { data: orders, error: ordersError } = await supabase
        .from('orders')
        .select('*')
        .limit(10);
      
      results.orders = {
        count: orders?.length || 0,
        sample: orders?.[0] || null,
        error: ordersError?.message || null,
        statuses: orders ? [...new Set(orders.map(o => o.status))] : []
      };

      // Check invoices table
      const { data: invoices, error: invoicesError } = await supabase
        .from('invoices')
        .select('*')
        .limit(10);
      
      results.invoices = {
        count: invoices?.length || 0,
        sample: invoices?.[0] || null,
        error: invoicesError?.message || null
      };

      // Check products table
      const { data: products, error: productsError } = await supabase
        .from('products')
        .select('*')
        .limit(5);
      
      results.products = {
        count: products?.length || 0,
        sample: products?.[0] || null,
        error: productsError?.message || null
      };

      // Check inventory table
      const { data: inventory, error: inventoryError } = await supabase
        .from('inventory')
        .select('*')
        .limit(5);
      
      results.inventory = {
        count: inventory?.length || 0,
        sample: inventory?.[0] || null,
        error: inventoryError?.message || null
      };

      // Check clients table
      const { data: clients, error: clientsError } = await supabase
        .from('clients')
        .select('*')
        .limit(5);
      
      results.clients = {
        count: clients?.length || 0,
        sample: clients?.[0] || null,
        error: clientsError?.message || null
      };

      // Check financial data tables
      const { data: bankAccounts, error: bankError } = await supabase
        .from('bank_accounts')
        .select('*')
        .limit(5);
      
      results.bank_accounts = {
        count: bankAccounts?.length || 0,
        sample: bankAccounts?.[0] || null,
        error: bankError?.message || null
      };

      const { data: transactions, error: transError } = await supabase
        .from('transactions')
        .select('*')
        .limit(5);
      
      results.transactions = {
        count: transactions?.length || 0,
        sample: transactions?.[0] || null,
        error: transError?.message || null
      };

      // Check order_items table (needed for reports)
      const { data: orderItems, error: orderItemsError } = await supabase
        .from('order_items')
        .select('*')
        .limit(5);
      
      results.order_items = {
        count: orderItems?.length || 0,
        sample: orderItems?.[0] || null,
        error: orderItemsError?.message || null
      };

      // Check service_records table (needed for maintenance service)
      const { data: serviceRecords, error: serviceRecordsError } = await supabase
        .from('service_records')
        .select('*')
        .limit(5);
      
      results.service_records = {
        count: serviceRecords?.length || 0,
        sample: serviceRecords?.[0] || null,
        error: serviceRecordsError?.message || null
      };

      // Check maintenances table
      const { data: maintenances, error: maintenancesError } = await supabase
        .from('maintenances')
        .select('*')
        .limit(5);
      
      results.maintenances = {
        count: maintenances?.length || 0,
        sample: maintenances?.[0] || null,
        error: maintenancesError?.message || null
      };

      // Check reviews table
      const { data: reviews, error: reviewsError } = await supabase
        .from('reviews')
        .select('*')
        .limit(5);
      
      results.reviews = {
        count: reviews?.length || 0,
        sample: reviews?.[0] || null,
        error: reviewsError?.message || null
      };

      setDiagnosticData(results);
    } catch (error) {
      console.error('Diagnostic error:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="p-6">
        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
          <span className="ml-3">Running database diagnostic...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <h2 className="text-2xl font-semibold text-primary mb-6">Database Diagnostic</h2>
      
      {Object.entries(diagnosticData).map(([table, data]) => (
        <VenetianTile key={table} className="p-6">
          <h3 className="text-lg font-semibold text-primary mb-4 capitalize">
            {table.replace('_', ' ')} Table
          </h3>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <p className="text-sm font-medium text-gray-500">Record Count</p>
              <p className="text-xl font-bold text-gray-900">{data.count}</p>
            </div>
            
            {data.error && (
              <div className="col-span-3">
                <p className="text-sm font-medium text-red-500">Error</p>
                <p className="text-sm text-red-600">{data.error}</p>
              </div>
            )}
            
            {data.statuses && data.statuses.length > 0 && (
              <div>
                <p className="text-sm font-medium text-gray-500">Order Statuses</p>
                <p className="text-sm text-gray-700">{data.statuses.join(', ')}</p>
              </div>
            )}
            
            {data.sample && (
              <div className="col-span-3">
                <p className="text-sm font-medium text-gray-500 mb-2">Sample Record</p>
                <div className="bg-gray-50 p-3 rounded text-xs overflow-auto">
                  <pre>{JSON.stringify(data.sample, null, 2)}</pre>
                </div>
              </div>
            )}
          </div>
        </VenetianTile>
      ))}
      
      <div className="flex space-x-4">
        <button
          onClick={runDiagnostic}
          className="bg-blue-600 text-white hover:bg-blue-700 dark:bg-blue-600 dark:hover:bg-blue-700"
          disabled={loading}
        >
          {loading ? 'Loading...' : 'Refresh Diagnostic'}
        </button>
        
        <button
          onClick={generateSampleData}
          className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700"
          disabled={generating}
        >
          {generating ? 'Generating...' : 'Generate Sample Data'}
        </button>
        
        <button
          onClick={clearSampleData}
          className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700"
          disabled={generating}
        >
          Clear Sample Data
        </button>
        
        <button
          onClick={initializeReviewsTable}
          className="bg-purple-600 text-white px-4 py-2 rounded hover:bg-purple-700"
          disabled={generating}
        >
          Initialize Reviews
        </button>
      </div>
    </div>
  );
};

export default DatabaseDiagnostic;
