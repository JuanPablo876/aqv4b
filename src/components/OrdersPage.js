import React, { useState, useEffect } from 'react';
import { orders } from '../mock/orders';
import { clients } from '../mock/clients';
import { products } from '../mock/products';
import { employees } from '../mock/employees'; // Import employees
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { alertNewOrder } from '../utils/alerts'; // Import alert utility
import VenetianTile from './VenetianTile';
import OrdersAddModal from './OrdersAddModal'; // Import the new modal

const OrdersPage = () => {
  const [ordersList, setOrdersList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]); // State for employees
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [isAssignEmployeeModalOpen, setIsAssignEmployeeModalOpen] = useState(false);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState('');
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false); // State for add modal
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setOrdersList(orders);
    setClientsList(clients);
    setProductsList(products);
    setEmployeesList(employees); // Load employees
  }, []);
  
  // Combine orders with client and employee details
  const ordersWithDetails = ordersList.map(order => {
    const client = clientsList.find(c => c.id === order.clientId) || {};
    const employee = order.delivery && order.delivery.employeeId 
      ? employeesList.find(e => e.id === order.delivery.employeeId) || {}
      : {};
      
    return {
      ...order,
      clientName: client.name || 'Cliente Desconocido',
      clientContact: client.contact || 'N/A',
      clientEmail: client.email || 'N/A',
      clientPhone: client.phone || 'N/A',
      deliveryEmployeeName: employee.name || 'Sin asignar'
    };
  });
  
  // Filter and sort orders
  const filteredOrders = sortByField(
    filterBySearchTerm(
      statusFilter 
        ? ordersWithDetails.filter(order => order.status === statusFilter)
        : ordersWithDetails, 
      searchTerm, 
      ['clientName', 'id', 'notes', 'deliveryEmployeeName']
    ),
    sortConfig.field,
    sortConfig.direction
  );
  
  // Handle sort
  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: 
        sortConfig.field === field && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };
  
  // Handle order selection
  const handleSelectOrder = (order) => {
    // Enhance order with product details
    const orderWithProductDetails = {
      ...order,
      items: order.items.map(item => {
        const product = productsList.find(p => p.id === item.productId) || {};
        return {
          ...item,
          productName: product.name || 'Producto Desconocido',
          sku: product.sku || 'N/A',
          category: product.category || 'N/A'
        };
      })
    };
    
    setSelectedOrder(orderWithProductDetails);
  };
  
  // Handle close order details
  const handleCloseDetails = () => {
    setSelectedOrder(null);
  };
  
  // Handle status change
  const handleStatusChange = (orderId, newStatus) => {
    const updatedOrders = ordersList.map(order => {
      if (order.id === orderId) {
        return { ...order, status: newStatus };
      }
      return order;
    });
    
    setOrdersList(updatedOrders);
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, status: newStatus });
    }
  };
  
  // Handle payment status change
  const handlePaymentStatusChange = (orderId, newPaymentStatus) => {
    const updatedOrders = ordersList.map(order => {
      if (order.id === orderId) {
        return { ...order, paymentStatus: newPaymentStatus };
      }
      return order;
    });
    
    setOrdersList(updatedOrders);
    
    if (selectedOrder && selectedOrder.id === orderId) {
      setSelectedOrder({ ...selectedOrder, paymentStatus: newPaymentStatus });
    }
  };
  
  // Handle assign employee
  const handleAssignEmployee = (order) => {
    setSelectedItem(order); // Use selectedItem for the order being assigned
    setSelectedEmployeeForAssignment(order.delivery?.employeeId || '');
    setIsAssignEmployeeModalOpen(true);
  };
  
  // Handle save employee assignment
  const handleSaveEmployeeAssignment = () => {
    const updatedOrders = ordersList.map(order => {
      if (order.id === selectedItem.id) {
        return {
          ...order,
          delivery: {
            ...order.delivery,
            employeeId: selectedEmployeeForAssignment ? parseInt(selectedEmployeeForAssignment) : null
          }
        };
      }
      return order;
    });
    
    setOrdersList(updatedOrders);
    setIsAssignEmployeeModalOpen(false);
    
    // Find the updated order and associated client/employee for the alert
    const updatedOrder = updatedOrders.find(o => o.id === selectedItem.id);
    const client = clientsList.find(c => c.id === updatedOrder.clientId);
    const employee = employeesList.find(emp => emp.id === updatedOrder.delivery?.employeeId);

    // Simulate sending notification (in a real app, this would be an API call)
    if (updatedOrder && client && employee && updatedOrder.delivery) {
       alertNewOrder(updatedOrder, client, employee);
    }
    
    setSelectedItem(null); // Clear selected item
  };
  
  // Handle add order
  const handleAddOrder = () => {
    setIsAddOrderModalOpen(true);
  };
  
  // Handle save new order from modal
  const handleSaveNewOrder = (newOrderData) => {
    const updatedOrders = [...ordersList, { ...newOrderData, id: ordersList.length + 1 }];
    setOrdersList(updatedOrders);
    // Optionally update inventory here based on the new order items
    
    // Simulate alerting warehouse and delivery employee if delivery is needed
    if (newOrderData.delivery && newOrderData.delivery.employeeId) {
       const client = clientsList.find(c => c.id === newOrderData.clientId);
       const employee = employeesList.find(emp => emp.id === newOrderData.delivery.employeeId);
       if (client && employee) {
          alertNewOrder({ ...newOrderData, id: ordersList.length + 1 }, client, employee);
       }
    }
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'processing': return 'En Proceso';
      case 'shipped': return 'Enviado';
      case 'delivered': return 'Entregado';
      case 'completed': return 'Completado';
      case 'cancelled': return 'Cancelado';
      default: return status;
    }
  };
  
  // Get payment status label
  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'partial': return 'Parcial';
      case 'paid': return 'Pagado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };
  
  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'credit_card': return 'Tarjeta de Crédito';
      default: return method;
    }
  };
  
  return (
    <div className="p-6">
      {/* Header with search, filter and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Pedidos</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar pedidos..."
              className="w-full md:w-64 px-4 py-2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          
          <select
            className="w-full md:w-48 px-4 py-2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="processing">En Proceso</option>
            <option value="shipped">Enviados</option>
            <option value="completed">Completados</option>
            <option value="cancelled">Cancelados</option>
          </select>
          
          <button
            onClick={handleAddOrder}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Nuevo Pedido
            </div>
          </button>
        </div>
      </div>
      
      {/* Orders table */}
      <VenetianTile className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    # Pedido
                    {sortConfig.field === 'id' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    Cliente
                    {sortConfig.field === 'clientName' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortConfig.field === 'date' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Total
                    {sortConfig.field === 'total' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Estado
                    {sortConfig.field === 'status' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('paymentStatus')}
                >
                  <div className="flex items-center">
                    Pago
                    {sortConfig.field === 'paymentStatus' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredOrders.map((order) => (
                <tr 
                  key={order.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectOrder(order)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">#{order.id}</div>
                    {order.quoteId && (
                      <div className="text-xs text-gray-500">Cotización: #{order.quoteId}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{order.clientName}</div>
                    <div className="text-xs text-gray-500">{order.clientContact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(order.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(order.total)}</div>
                    {order.balance > 0 && (
                      <div className="text-xs text-gray-500">Saldo: {formatCurrency(order.balance)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(order.status)}`}>
                      {getStatusLabel(order.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(order.paymentStatus)}`}>
                      {getPaymentStatusLabel(order.paymentStatus)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectOrder(order);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit action
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Order details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Pedido #{selectedOrder.id}</h3>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información del Pedido</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="text-blue-800 font-medium">{formatDate(selectedOrder.date)}</span>
                    </div>
                    
                    {selectedOrder.quoteId && (
                      <div className="flex justify-between">
                        <span className="text-gray-500">Cotización:</span>
                        <span className="text-blue-800 font-medium">#{selectedOrder.quoteId}</span>
                      </div>
                    )}
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedOrder.status)}`}>
                        {getStatusLabel(selectedOrder.status)}
                      </span>
                    </div>
                    
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-gray-500">Notas:</span>
                        <p className="text-blue-800 mt-1">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información del Cliente</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <p className="text-blue-800 font-medium">{selectedOrder.clientName}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Contacto:</span>
                      <p className="text-blue-800">{selectedOrder.clientContact}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="text-blue-800">{selectedOrder.clientEmail}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="text-blue-800">{selectedOrder.clientPhone}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información de Pago</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedOrder.paymentStatus)}`}>
                        {getPaymentStatusLabel(selectedOrder.paymentStatus)}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Método:</span>
                      <span className="text-blue-800">{getPaymentMethodLabel(selectedOrder.paymentMethod)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Total:</span>
                      <span className="text-blue-800 font-medium">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Pagado:</span>
                      <span className="text-blue-800">{formatCurrency(selectedOrder.amountPaid)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Saldo:</span>
                      <span className={`text-blue-800 font-medium ${selectedOrder.balance > 0 ? 'text-red-600' : ''}`}>
                        {formatCurrency(selectedOrder.balance)}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
              
              {selectedOrder.delivery && (
                <div className="mb-6">
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información de Entrega</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <span className="text-gray-500">Empleado Asignado:</span>
                      <p className="text-blue-800 font-medium">{selectedOrder.deliveryEmployeeName}</p>
                    </div>
                    <div>
                      <span className="text-gray-500">Fecha y Hora:</span>
                      <p className="text-blue-800 font-medium">{formatDate(selectedOrder.delivery.date)} - {selectedOrder.delivery.time}</p>
                    </div>
                    <div className="md:col-span-2">
                      <span className="text-gray-500">Dirección:</span>
                      <p className="text-blue-800">{selectedOrder.delivery.address}</p>
                      {selectedOrder.delivery.googleMapsLink && (
                        <a 
                          href={selectedOrder.delivery.googleMapsLink} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver en Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              )}
              
              <h4 className="text-lg font-medium text-blue-800 mb-4">Productos</h4>
              
              <div className="bg-blue-50 rounded-lg overflow-hidden mb-6">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-100">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Producto
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Precio Unitario
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Descuento
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Subtotal
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedOrder.items.map((item, index) => {
                      const product = productsList.find(p => p.id === item.productId);
                      return (
                        <tr key={index}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product?.name || 'Producto Desconocido'}</div>
                            <div className="text-xs text-gray-500">{product?.sku || 'N/A'}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{item.quantity}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(item.price)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatCurrency(item.discount || 0)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">
                              {formatCurrency((item.price * item.quantity) - (item.discount || 0))}
                            </div>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between mb-6">
                <div></div>
                <div className="w-64 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="text-blue-800">{formatCurrency(selectedOrder.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Descuento:</span>
                    <span className="text-blue-800">-{formatCurrency(selectedOrder.discount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Impuestos:</span>
                    <span className="text-blue-800">{formatCurrency(selectedOrder.tax)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-blue-800 font-medium">Total:</span>
                    <span className="text-blue-800 font-bold">{formatCurrency(selectedOrder.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Imprimir
                  </button>
                  
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Enviar por Email
                  </button>
                </div>
                
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'processing')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Procesar Pedido
                  </button>
                )}
                
                {selectedOrder.status === 'processing' && (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, 'shipped')}
                      className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2"
                    >
                      Marcar como Enviado
                    </button>
                    <button 
                      onClick={() => handleAssignEmployee(selectedOrder)}
                      className="px-4 py-2 border border-blue-600 text-blue-600 rounded-md hover:bg-blue-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    >
                      Asignar Empleado
                    </button>
                  </div>
                )}
                
                {selectedOrder.status === 'shipped' && (
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'completed')}
                    className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                  >
                    Completar Pedido
                  </button>
                )}
                
                {selectedOrder.status !== 'completed' && selectedOrder.status !== 'cancelled' && (
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'cancelled')}
                    className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                  >
                    Cancelar Pedido
                  </button>
                )}
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Assign Employee Modal */}
      {isAssignEmployeeModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-sm w-full">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Asignar Empleado a Pedido #{selectedItem.id}</h3>
                <button 
                  onClick={() => setIsAssignEmployeeModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            <div className="p-6">
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Seleccionar Empleado
                </label>
                <select
                  value={selectedEmployeeForAssignment}
                  onChange={(e) => setSelectedEmployeeForAssignment(e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">-- Seleccionar --</option>
                  {employeesList.filter(emp => emp.status === 'active').map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAssignEmployeeModalOpen(false)}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEmployeeAssignment}
                  disabled={!selectedEmployeeForAssignment}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                >
                  Asignar y Notificar
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add Order Modal */}
      <OrdersAddModal 
        isOpen={isAddOrderModalOpen}
        onClose={() => setIsAddOrderModalOpen(false)}
        onSave={handleSaveNewOrder}
      />
    </div>
  );
};

export default OrdersPage;
