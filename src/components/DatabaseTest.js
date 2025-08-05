import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import VenetianTile from './VenetianTile';
import { generateUniqueTestOrderNumber } from '../utils/orderNumberGenerator';

const DatabaseTest = () => {
  const { data: orders = [], loading: ordersLoading, create: createOrder } = useData('orders');
  const { data: clients = [], loading: clientsLoading, create: createClient } = useData('clients');
  const [isCreating, setIsCreating] = useState(false);

  const createSampleData = async () => {
    setIsCreating(true);
    try {
      // First create a sample client if none exist
      if (clients.length === 0) {

        await createClient({
          name: 'Hotel Acapulco Paradise',
          contact: 'Maria Rodriguez',
          email: 'compras@hotelacapulco.com',
          phone: '+52 744 123 4567',
          address: 'Av. Costera Miguel Alemán 123, Acapulco, Guerrero',
          type: 'hotel',
          status: 'active',
          customer_type: 'premium'
        });
      }

      // Get the client ID (use existing or newly created)
      const clientsList = await new Promise(resolve => {
        setTimeout(() => resolve(clients.length > 0 ? clients : [{ id: 'temp-client-id' }]), 100);
      });
      
      const clientId = clientsList[0]?.id;
      
      if (!clientId) {
        throw new Error('No client available for creating orders');
      }

      // Create sample orders with different dates
      const today = new Date();
      
      const sampleOrders = [
        {
          order_number: generateUniqueTestOrderNumber(1),
          client_id: clientId,
          date: new Date(today.getTime() - 1 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 1 day ago
          status: 'completed',
          payment_status: 'paid',
          subtotal: 2300.00,
          tax: 200.00,
          total: 2500.00,
          amount_paid: 2500.00,
          notes: 'Entrega de químicos para piscina principal'
        },
        {
          order_number: generateUniqueTestOrderNumber(2),
          client_id: clientId,
          date: new Date(today.getTime() - 5 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 5 days ago
          status: 'pending',
          payment_status: 'pending',
          subtotal: 1650.00,
          tax: 150.00,
          total: 1800.00,
          amount_paid: 0.00,
          notes: 'Mantenimiento mensual programado'
        },
        {
          order_number: generateUniqueTestOrderNumber(3),
          client_id: clientId,
          date: new Date(today.getTime() - 15 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 15 days ago
          status: 'delivered',
          payment_status: 'paid',
          subtotal: 2900.00,
          tax: 300.00,
          total: 3200.00,
          amount_paid: 3200.00,
          notes: 'Instalación de sistema de filtración'
        },
        {
          order_number: generateUniqueTestOrderNumber(4),
          client_id: clientId,
          date: new Date(today.getTime() - 45 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 45 days ago (within 3 months)
          status: 'completed',
          payment_status: 'paid',
          subtotal: 1800.00,
          tax: 200.00,
          total: 2000.00,
          amount_paid: 2000.00,
          notes: 'Químicos y accesorios'
        },
        {
          order_number: generateUniqueTestOrderNumber(5),
          client_id: clientId,
          date: new Date(today.getTime() - 75 * 24 * 60 * 60 * 1000).toISOString().split('T')[0], // 75 days ago (within 3 months)
          status: 'completed',
          payment_status: 'paid',
          subtotal: 3500.00,
          tax: 400.00,
          total: 3900.00,
          amount_paid: 3900.00,
          notes: 'Equipo de limpieza automática'
        }
      ];


      for (const orderData of sampleOrders) {
        try {
          await createOrder(orderData);

        } catch (error) {
          console.error(`❌ Failed to create order ${orderData.order_number}:`, error);
        }
      }
      
      alert('✅ Sample data created successfully! Check the dashboard now.');
    } catch (error) {
      console.error('Error creating sample data:', error);
      alert('❌ Error creating sample data: ' + error.message);
    } finally {
      setIsCreating(false);
    }
  };

  const clearAllOrders = async () => {
    if (window.confirm('Are you sure you want to delete all orders? This cannot be undone.')) {
      try {
        // Note: This would require a delete function in useData
        alert('Delete function not implemented yet. Use Supabase dashboard to clear data.');
      } catch (error) {
        console.error('Error clearing data:', error);
        alert('Error clearing data: ' + error.message);
      }
    }
  };

  if (ordersLoading || clientsLoading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100">
          Database Test
        </h2>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Current Data */}
        <VenetianTile className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Current Database Status
          </h3>
          <div className="space-y-2">
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Orders:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{orders.length}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-gray-600 dark:text-gray-400">Clients:</span>
              <span className="font-medium text-gray-900 dark:text-gray-100">{clients.length}</span>
            </div>
          </div>
          
          {orders.length > 0 && (
            <div className="mt-4">
              <h4 className="text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">Recent Orders:</h4>
              <div className="space-y-1 max-h-32 overflow-y-auto">
                {orders.slice(0, 5).map(order => (
                  <div key={order.id} className="text-xs text-gray-600 dark:text-gray-400">
                    {order.order_number || order.id.slice(-8)} - ${order.total} ({order.status})
                  </div>
                ))}
              </div>
            </div>
          )}
        </VenetianTile>

        {/* Actions */}
        <VenetianTile className="p-6">
          <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
            Test Actions
          </h3>
          <div className="space-y-3">
            <button
              onClick={createSampleData}
              disabled={isCreating}
              className="w-full bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              {isCreating ? 'Creating...' : 'Create Sample Orders'}
            </button>
            
            <button
              onClick={clearAllOrders}
              className="w-full bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg transition-colors duration-200"
            >
              Clear All Orders
            </button>
            
            <div className="text-xs text-gray-500 dark:text-gray-400 mt-2">
              This will create 5 sample orders with different dates to test the dashboard data visualization.
            </div>
          </div>
        </VenetianTile>
      </div>

      {/* Debug Info */}
      <VenetianTile className="p-6">
        <h3 className="text-lg font-semibold text-gray-900 dark:text-gray-100 mb-4">
          Debug Information
        </h3>
        <div className="space-y-2 text-sm">
          <div>
            <strong>Orders Loading:</strong> {ordersLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Clients Loading:</strong> {clientsLoading ? 'Yes' : 'No'}
          </div>
          <div>
            <strong>Sample Data Available:</strong> {orders.length > 0 ? 'Yes' : 'No'}
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default DatabaseTest;
