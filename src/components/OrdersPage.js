import React, { useState, useEffect, useMemo } from 'react';
import { useOrders, useClients, useProducts, useEmployees } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass, getOrderNumber, getQuoteNumber } from '../utils/helpers';
import { alertNewOrder } from '../utils/alerts'; // Import alert utility
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData } from '../utils/formValidation';
import VenetianTile from './VenetianTile';
import PaginatedTable from './PaginatedTable';
import OrdersAddModal from './OrdersAddModal'; // Import the new modal
import OrdersEditModal from './OrdersEditModal';
import { 
  useBreakpoint, 
  getResponsiveTableConfig, 
  getTouchOptimizedClasses,
  ResponsiveContainer,
  TableCard,
  MobileDrawer
} from '../utils/responsiveUtils';
import { businessNotificationService } from '../services/businessNotificationService';

const OrdersPage = ({ preSelectedClient = null, setSelectedClientForOrder }) => {
  const { data: ordersList, loading: ordersLoading, error: ordersError, create, update, delete: deleteOrder } = useOrders();
  const { data: clientsList, loading: clientsLoading, error: clientsError } = useClients();
  const { data: productsList, loading: productsLoading, error: productsError } = useProducts();
  const { data: employeesList, loading: employeesLoading, error: employeesError } = useEmployees();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedItem, setSelectedItem] = useState(null); // Added for employee assignment
  const [isAssignEmployeeModalOpen, setIsAssignEmployeeModalOpen] = useState(false);
  const [selectedEmployeeForAssignment, setSelectedEmployeeForAssignment] = useState('');
  const [isAddOrderModalOpen, setIsAddOrderModalOpen] = useState(false); // State for add modal
  const [isEditOrderModalOpen, setIsEditOrderModalOpen] = useState(false); // State for edit modal
  const [editingOrder, setEditingOrder] = useState(null); // Order being edited
  
  // Responsive state
  const { isMobile, isTablet, breakpoint } = useBreakpoint();
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);
  const [performanceMode, setPerformanceMode] = useState(false);

  // Auto-enable performance mode for large datasets
  useEffect(() => {
    if (ordersList?.length > 500) {
      setPerformanceMode(true);
    }
  }, [ordersList?.length]);

  // Initialize business notifications
  useEffect(() => {
    businessNotificationService.initialize();
  }, []);

  // Auto-open modal if preSelectedClient is provided
  useEffect(() => {
    if (preSelectedClient && !isAddOrderModalOpen) {
      setIsAddOrderModalOpen(true);
    }
  }, [preSelectedClient, isAddOrderModalOpen]);

  // Combined loading state
  const loading = ordersLoading || clientsLoading || productsLoading || employeesLoading;
  const error = ordersError || clientsError || productsError || employeesError;

  // ====== EVENT HANDLERS ======
  
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
    if (!order) {
      console.error('OrdersPage: handleSelectOrder called with null/undefined order');
      return;
    }

    const orderWithProductDetails = {
      ...order,
      items: (order.items || []).map(item => {
        const product = productsList.find(p => 
          p.id === item.productId || 
          p.id === item.product_id || 
          p.id === parseInt(item.productId) || 
          p.id === parseInt(item.product_id)
        ) || {};
        return {
          ...item,
          productId: item.productId || item.product_id,
          productName: product.name || 'Producto Desconocido',
          sku: product.sku || 'N/A',
          price: item.price || product.price || 0,
          quantity: item.quantity || 0,
          discount: item.discount || 0,
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
  const handleStatusChange = async (orderId, newStatus) => {
    try {
      await update(orderId, { status: newStatus });
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, status: newStatus });
      }
      
      handleSuccess('Estado actualizado exitosamente');
    } catch (error) {
      handleError(error, 'Error al actualizar el estado');
    }
  };
  
  // Handle payment status change
  const handlePaymentStatusChange = async (orderId, newPaymentStatus) => {
    try {
      await update(orderId, { payment_status: newPaymentStatus });
      
      if (selectedOrder && selectedOrder.id === orderId) {
        setSelectedOrder({ ...selectedOrder, payment_status: newPaymentStatus });
      }
      
      handleSuccess('Estado de pago actualizado exitosamente');
    } catch (error) {
      handleError(error, 'Error al actualizar el estado de pago');
    }
  };
  
  // Handle assign employee
  const handleAssignEmployee = (order) => {
    setSelectedItem(order);
    setSelectedEmployeeForAssignment(order.delivery_employee_id || '');
    setIsAssignEmployeeModalOpen(true);
  };
  
  // Handle save employee assignment
  const handleSaveEmployeeAssignment = async () => {
    try {
      await update(selectedItem.id, {
        delivery_employee_id: selectedEmployeeForAssignment || null
      });
      
      setIsAssignEmployeeModalOpen(false);
      
      const updatedOrder = ordersList.find(o => o.id === selectedItem.id);
      const client = clientsList.find(c => c.id === updatedOrder.client_id);
      const employee = employeesList.find(emp => emp.id === selectedEmployeeForAssignment);

      if (updatedOrder && client && employee) {
         alertNewOrder(updatedOrder, client, employee);
      }
      
      setSelectedItem(null);
      handleSuccess('Empleado asignado exitosamente');
    } catch (error) {
      handleError(error, 'Error al asignar empleado');
    }
  };
  
  // Handle add order
  const handleAddOrder = () => {
    setIsAddOrderModalOpen(true);
  };
  
  // Handle edit order
  const handleEditOrder = (order) => {

    setEditingOrder(order);
    setIsEditOrderModalOpen(true);
  };

  // Handle delete order
  const handleDeleteOrder = async (orderId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta orden?')) {
      try {
        await remove(orderId);
        handleSuccess('Orden eliminada exitosamente');
      } catch (error) {
        handleError(error, 'Error al eliminar la orden');
      }
    }
  };
  
  // Handle save new order from modal
  const handleSaveNewOrder = async (newOrderData) => {
    try {
      await create(newOrderData);
      
      if (newOrderData.delivery_employee_id) {
         const client = clientsList.find(c => c.id === newOrderData.client_id);
         const employee = employeesList.find(emp => emp.id === newOrderData.delivery_employee_id);
         if (client && employee) {
            alertNewOrder(newOrderData, client, employee);
         }
      }
      
      handleSuccess('Orden creada exitosamente');
    } catch (error) {
      handleError(error, 'Error al guardar la orden');
    }
  };
  
  // ====== UTILITY FUNCTIONS ======
  
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

  // Responsive table configuration
  const tableConfig = useMemo(() => {
    return getResponsiveTableConfig(isMobile, isTablet);
  }, [isMobile, isTablet]);

  // Processed data with performance optimization
  const processedOrders = useMemo(() => {
    if (!ordersList || ordersList.length === 0) return [];
    
    // Add client information to orders
    const ordersWithClients = ordersList.map(order => ({
      ...order,
      clientName: clientsList?.find(c => c.id === order.client_id)?.name || 'Cliente no encontrado',
      clientType: clientsList?.find(c => c.id === order.client_id)?.customer_type || 'N/A'
    }));

    // Apply filters
    let filtered = ordersWithClients;
    
    if (statusFilter) {
      filtered = filtered.filter(order => order.status === statusFilter);
    }
    
    if (searchTerm) {
      filtered = filterBySearchTerm(filtered, searchTerm, ['order_number', 'clientName']);
    }

    // Apply sorting
    if (sortConfig.field) {
      filtered = sortByField(filtered, sortConfig.field, sortConfig.direction);
    }

    return filtered;
  }, [ordersList, clientsList, statusFilter, searchTerm, sortConfig]);

  // Table columns configuration
  const tableColumns = useMemo(() => {
    const baseColumns = [
      {
        key: 'order_number',
        header: 'N° Pedido',
        sortable: true,
        render: (value, item) => (
          <span className="font-mono font-semibold text-primary">
            {value || `ORD-${item.id?.slice(-6)}`}
          </span>
        )
      },
      {
        key: 'clientName',
        header: 'Cliente',
        sortable: true,
        render: (value, item) => (
          <div>
            <div className="font-medium text-gray-900 dark:text-dark-100">{value}</div>
            <div className="text-sm text-gray-500 dark:text-dark-300">{item.clientType}</div>
          </div>
        )
      },
      {
        key: 'date',
        header: 'Fecha',
        sortable: true,
        render: (value) => (
          <span className="text-foreground dark:text-dark-200">
            {formatDate(value)}
          </span>
        )
      },
      {
        key: 'status',
        header: 'Estado',
        sortable: true,
        render: (value) => (
          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColorClass(value)}`}>
            {value === 'pending' && '⏳ Pendiente'}
            {value === 'confirmed' && '✅ Confirmado'}
            {value === 'in_progress' && '🔄 En Progreso'}
            {value === 'completed' && '🎉 Completado'}
            {value === 'cancelled' && '❌ Cancelado'}
            {value === 'delivered' && '🚚 Entregado'}
          </span>
        )
      },
      {
        key: 'total',
        header: 'Total',
        sortable: true,
        render: (value) => (
          <span className="font-semibold text-green-600 dark:text-green-400">
            {formatCurrency(value)}
          </span>
        )
      },
      {
        key: 'payment_status',
        header: 'Pago',
        sortable: true,
        render: (value) => (
          <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
            value === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
            value === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
            'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
          }`}>
            {value === 'paid' && '💰 Pagado'}
            {value === 'partial' && '💸 Parcial'}
            {value === 'pending' && '⏳ Pendiente'}
          </span>
        )
      }
    ];

    // Add actions column for desktop
    if (!isMobile) {
      baseColumns.push({
        key: 'actions',
        header: 'Acciones',
        sortable: false,
        render: (value, item) => (
          <div className="flex items-center space-x-2">
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleEditOrder(item);
              }}
              className={`${getTouchOptimizedClasses('sm')} text-blue-600 hover:text-blue-800 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded p-1`}
              title="Editar"
            >
              ✏️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleDeleteOrder(item.id);
              }}
              className={`${getTouchOptimizedClasses('sm')} text-red-600 hover:text-red-800 hover:bg-red-50 dark:hover:bg-red-900/20 rounded p-1`}
              title="Eliminar"
            >
              🗑️
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                handleAssignEmployee(item);
              }}
              className={`${getTouchOptimizedClasses('sm')} text-green-600 hover:text-green-800 hover:bg-green-50 dark:hover:bg-green-900/20 rounded p-1`}
              title="Asignar empleado"
            >
              👥
            </button>
          </div>
        )
      });
    }

    return baseColumns;
  }, [isMobile]);

  // Show loading state
  if (loading) {
    return (
      <ResponsiveContainer>
        <div className="flex items-center justify-center min-h-64">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          <span className="ml-2 text-gray-600">Cargando órdenes...</span>
        </div>
      </ResponsiveContainer>
    );
  }

  // Show error state
  if (error) {
    return (
      <ResponsiveContainer>
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión con la base de datos</h3>
              <p className="text-red-700 mb-4">No se pudo cargar la información de órdenes:</p>
              <div className="bg-red-100 border border-red-300 rounded p-3 mb-4">
                <code className="text-sm text-red-800">{error}</code>
              </div>
              
              <div className="space-y-3">
                <h4 className="font-medium text-red-800">Posibles soluciones:</h4>
                <ul className="list-disc list-inside space-y-1 text-sm text-red-700">
                  <li>Verificar la conexión a internet</li>
                  <li>Revisar las variables de entorno en .env</li>
                  <li>Comprobar el estado del proyecto en Supabase</li>
                  <li>Ejecutar el script disable_rls_dev.sql en Supabase</li>
                </ul>
              </div>
              
              <div className="mt-4">
                <button
                  onClick={() => window.location.reload()}
                  className={`${getTouchOptimizedClasses()} bg-red-600 text-white rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500`}
                >
                  🔄 Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      </ResponsiveContainer>
    );
  }
  
  // Combine orders with client and employee details
  const ordersWithDetails = (ordersList || []).map(order => {
    const client = clientsList.find(c => c.id === order.client_id) || {};
    const employee = order.delivery_employee_id 
      ? employeesList.find(e => e.id === order.delivery_employee_id) || {}
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

  return (
    <ResponsiveContainer>
      {/* Mobile filters drawer */}
      <MobileDrawer
        isOpen={mobileFiltersOpen}
        onClose={() => setMobileFiltersOpen(false)}
        title="Filtros y Búsqueda"
      >
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Buscar órdenes
            </label>
            <input
              type="text"
              placeholder="Buscar por cliente o número..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
              Estado
            </label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
            >
              <option value="">Todos los estados</option>
              <option value="pending">Pendientes</option>
              <option value="confirmed">Confirmados</option>
              <option value="in_progress">En Progreso</option>
              <option value="completed">Completados</option>
              <option value="delivered">Entregados</option>
              <option value="cancelled">Cancelados</option>
            </select>
          </div>
        </div>
      </MobileDrawer>

      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between mb-6">
        <div className="flex items-center mb-4 sm:mb-0">
          <h2 className="text-2xl font-semibold text-primary mr-4">Pedidos</h2>
          {performanceMode && (
            <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900/30 dark:text-blue-400">
              ⚡ Modo rendimiento
            </span>
          )}
        </div>
        
        <div className="flex flex-col sm:flex-row space-y-3 sm:space-y-0 sm:space-x-3">
          {/* Mobile filter button */}
          {isMobile && (
            <button
              onClick={() => setMobileFiltersOpen(true)}
              className={`${getTouchOptimizedClasses()} bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500`}
            >
              🔍 Filtros
            </button>
          )}
          
          {/* Desktop search and filters */}
          {!isMobile && (
            <>
              <div className="relative">
                <input
                  type="text"
                  placeholder="Buscar pedidos..."
                  className="w-full sm:w-64 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
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
                className="w-full sm:w-48 px-4 py-2 rounded-lg border border-gray-300 focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="">Todos los estados</option>
                <option value="pending">Pendientes</option>
                <option value="confirmed">Confirmados</option>
                <option value="in_progress">En Progreso</option>
                <option value="completed">Completados</option>
                <option value="delivered">Entregados</option>
                <option value="cancelled">Cancelados</option>
              </select>
            </>
          )}
          
          <button
            onClick={handleAddOrder}
            className={`${getTouchOptimizedClasses()} bg-primary text-white rounded-lg hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
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

      {/* Performance stats for large datasets */}
      {processedOrders.length > 1000 && (
        <div className="mb-4 p-3 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
          <div className="flex items-center justify-between text-sm">
            <span className="text-blue-700 dark:text-blue-300">
              📊 Dataset grande detectado: {processedOrders.length.toLocaleString()} órdenes
            </span>
            <label className="flex items-center space-x-2">
              <input
                type="checkbox"
                checked={performanceMode}
                onChange={(e) => setPerformanceMode(e.target.checked)}
                className="rounded border-gray-300 text-primary focus:ring-primary"
              />
              <span className="text-blue-700 dark:text-blue-300">Optimización automática</span>
            </label>
          </div>
        </div>
      )}

      {/* Mobile card view for small screens */}
      {isMobile && processedOrders.length > 0 && (
        <div className="space-y-3 mb-6">
          {processedOrders.slice(0, tableConfig.pageSize).map((order) => (
            <TableCard
              key={order.id}
              item={order}
              columns={tableColumns}
              onEdit={() => handleEditOrder(order)}
              onDelete={() => handleDeleteOrder(order.id)}
              onView={() => handleSelectOrder(order)}
              className="hover:shadow-md transition-shadow"
            />
          ))}
        </div>
      )}

      {/* Enhanced table for larger screens */}
      {(!isMobile || processedOrders.length === 0) && (
        <PaginatedTable
          data={processedOrders}
          columns={tableColumns}
          loading={loading}
          error={error}
          pageSize={tableConfig.pageSize}
          virtualScrolling={performanceMode && processedOrders.length > 500}
          onRowClick={handleSelectOrder}
          onSort={(key, direction) => setSortConfig({ field: key, direction })}
          sortable={true}
          searchable={false} // We handle search externally
          exportable={true}
          compact={tableConfig.compact}
          stickyHeader={tableConfig.stickyHeader}
          maxHeight={tableConfig.maxHeight}
          emptyMessage="No hay pedidos disponibles"
          loadingMessage="Cargando pedidos..."
          responsive={true}
          onRefresh={() => window.location.reload()}
        />
      )}

      {/* Business notification status */}
      {businessNotificationService.getStatus().isMonitoring && (
        <div className="mt-4 p-3 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
          <div className="flex items-center text-sm text-green-700 dark:text-green-300">
            <span className="inline-flex items-center w-2 h-2 bg-green-400 rounded-full mr-2"></span>
            Sistema de notificaciones automáticas activo - Monitoreando órdenes y alertas
          </div>
        </div>
      )}
      
      {/* Order details modal */}
      {selectedOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-gray-200 dark:border-dark-600">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">
                  Pedido {selectedOrder.order_number || `ORD-${selectedOrder.id?.slice(-6)}`}
                </h3>
                <button 
                  onClick={handleCloseDetails}
                  className={`${getTouchOptimizedClasses('sm')} text-gray-400 hover:text-gray-500 dark:text-dark-400 dark:hover:text-dark-200 rounded-full p-2`}
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
                  <h4 className="text-lg font-medium text-primary mb-4">Información del Pedido</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Fecha:</span>
                      <span className="text-foreground font-medium">{formatDate(selectedOrder.date)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedOrder.status)}`}>
                        {selectedOrder.status === 'pending' && '⏳ Pendiente'}
                        {selectedOrder.status === 'confirmed' && '✅ Confirmado'}
                        {selectedOrder.status === 'in_progress' && '🔄 En Progreso'}
                        {selectedOrder.status === 'completed' && '🎉 Completado'}
                        {selectedOrder.status === 'cancelled' && '❌ Cancelado'}
                        {selectedOrder.status === 'delivered' && '🚚 Entregado'}
                      </span>
                    </div>
                    
                    {selectedOrder.notes && (
                      <div>
                        <span className="text-muted-foreground">Notas:</span>
                        <p className="text-foreground mt-1">{selectedOrder.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-primary mb-4">Información del Cliente</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-muted-foreground">Nombre:</span>
                      <p className="text-foreground font-medium">{selectedOrder.clientName}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-primary mb-4">Información de Pago</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                        selectedOrder.payment_status === 'paid' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400' :
                        selectedOrder.payment_status === 'partial' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400' :
                        'bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400'
                      }`}>
                        {selectedOrder.payment_status === 'paid' && '💰 Pagado'}
                        {selectedOrder.payment_status === 'partial' && '💸 Parcial'}
                        {selectedOrder.payment_status === 'pending' && '⏳ Pendiente'}
                      </span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-muted-foreground">Total:</span>
                      <span className="text-foreground font-medium">{formatCurrency(selectedOrder.total)}</span>
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button className={`${getTouchOptimizedClasses()} bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}>
                    📄 Imprimir
                  </button>
                  
                  <button className={`${getTouchOptimizedClasses()} bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2`}>
                    📧 Email
                  </button>
                </div>
                
                {selectedOrder.status === 'pending' && (
                  <button 
                    onClick={() => handleStatusChange(selectedOrder.id, 'confirmed')}
                    className={`${getTouchOptimizedClasses()} bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2`}
                  >
                    ✅ Confirmar Pedido
                  </button>
                )}
                
                {selectedOrder.status === 'confirmed' && (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleStatusChange(selectedOrder.id, 'in_progress')}
                      className={`${getTouchOptimizedClasses()} bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2`}
                    >
                      🔄 Iniciar Progreso
                    </button>
                    <button 
                      onClick={() => handleAssignEmployee(selectedOrder)}
                      className={`${getTouchOptimizedClasses()} border border-primary text-primary rounded-md hover:bg-primary-light focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2`}
                    >
                      👥 Asignar Empleado
                    </button>
                  </div>
                )}
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Assign Employee Modal */}
      {isAssignEmployeeModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <VenetianTile className="max-w-sm w-full">
            <div className="p-6 border-b border-gray-200 dark:border-dark-600">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-primary">
                  Asignar Empleado
                </h3>
                <button 
                  onClick={() => setIsAssignEmployeeModalOpen(false)}
                  className={`${getTouchOptimizedClasses('sm')} text-gray-400 hover:text-gray-500 dark:text-dark-400 dark:hover:text-dark-200 rounded-full p-2`}
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
                  className="w-full px-3 py-2 rounded-md border border-gray-300 focus:outline-none focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
                >
                  <option value="">-- Seleccionar --</option>
                  {employeesList?.filter(emp => emp.status === 'active').map(employee => (
                    <option key={employee.id} value={employee.id}>
                      {employee.name} ({employee.role})
                    </option>
                  ))}
                </select>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAssignEmployeeModalOpen(false)}
                  className={`${getTouchOptimizedClasses()} rounded-md text-gray-700 border border-gray-300 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 dark:text-dark-200 dark:border-dark-500 dark:hover:bg-dark-600`}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  onClick={handleSaveEmployeeAssignment}
                  disabled={!selectedEmployeeForAssignment}
                  className={`${getTouchOptimizedClasses()} bg-primary text-white rounded-md hover:bg-primary-dark focus:outline-none focus:ring-2 focus:ring-primary focus:ring-offset-2 disabled:bg-gray-300 disabled:cursor-not-allowed`}
                >
                  ✅ Asignar y Notificar
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add Order Modal */}
      <OrdersAddModal 
        isOpen={isAddOrderModalOpen}
        onClose={() => {
          setIsAddOrderModalOpen(false);
          // Clear pre-selected client after modal close
          if (setSelectedClientForOrder) {
            setSelectedClientForOrder(null);
          }
        }}
        onSave={handleSaveNewOrder}
        preSelectedClient={preSelectedClient}
      />
      
      {/* Edit Order Modal */}
      <OrdersEditModal 
        isOpen={isEditOrderModalOpen}
        onClose={() => {
// console.log('🔒 Closing edit modal'); // Debug log
          setIsEditOrderModalOpen(false);
          setEditingOrder(null);
        }}
        onSave={async (updatedOrder) => {
          try {
// console.log('💾 Saving updated order:', updatedOrder); // Debug log
            await update(editingOrder.id, updatedOrder);
            setIsEditOrderModalOpen(false);
            setEditingOrder(null);
            handleSuccess('Pedido actualizado exitosamente');
          } catch (error) {
            handleError(error, 'Error al actualizar pedido');
          }
        }}
        editingOrder={editingOrder}
      />
    </ResponsiveContainer>
  );
};

export default OrdersPage;
