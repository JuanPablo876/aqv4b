import React, { useState, useEffect } from 'react';
import { useSuppliers, useProducts } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage'; // Import formatCurrency
import { filterBySearchTerm, sortByField } from '../utils/helpers';
import { validateFormData, formSchemas, cleanFormData } from '../utils/formValidation';
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { supabase } from '../supabaseClient';
import VenetianTile from './VenetianTile';

const SuppliersPage = () => {
  const { data: suppliersList, loading: suppliersLoading, error: suppliersError, create, update, delete: deleteSupplier } = useSuppliers();
  const { data: productsList, loading: productsLoading, error: productsError } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedSupplier, setSelectedSupplier] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isPurchaseHistoryModalOpen, setIsPurchaseHistoryModalOpen] = useState(false);
  const [editingSupplier, setEditingSupplier] = useState(null);
  const [selectedHistorySupplier, setSelectedHistorySupplier] = useState(null);
  const [purchaseHistory, setPurchaseHistory] = useState([]);
  const [purchaseHistoryLoading, setPurchaseHistoryLoading] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [newSupplier, setNewSupplier] = useState({
    name: '',
    contact_person: '', // Updated to match database field name
    email: '',
    phone: '',
    address: '',
    lead_time: '', // Updated to match database field name
    payment_terms: '', // Updated to match database field name
    notes: '',
    status: 'active'
  });

  // Combined loading state
  const loading = suppliersLoading || productsLoading;
  const error = suppliersError || productsError;

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando proveedores...</span>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-2xl mx-auto">
          <div className="flex items-start">
            <div className="flex-shrink-0">
              <svg className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div className="ml-3 flex-1">
              <h3 className="text-lg font-medium text-red-800 mb-2">Error de conexión con la base de datos</h3>
              <p className="text-red-700 mb-4">No se pudo cargar la información de proveedores:</p>
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
                  className="bg-red-600 text-white px-4 py-2 rounded hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  🔄 Recargar página
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }
  
  // Filter and sort suppliers
  const filteredSuppliers = sortByField(
    filterBySearchTerm(suppliersList, searchTerm, ['name', 'contact_person', 'email', 'notes']), // Updated field references
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
  
  // Handle supplier selection
  const handleSelectSupplier = (supplier) => {
    // Get supplier products - for now we'll show all products since relationship needs to be established
    setSelectedSupplier({
      ...supplier,
      productsList: productsList.filter(product => 
        product.supplier_name && product.supplier_name.toLowerCase().includes(supplier.name.toLowerCase())
      )
    });
  };
  
  // Handle add new supplier
  const handleAddSupplier = () => {
    setIsAddModalOpen(true);
  };
  
  // Handle input change for new supplier
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewSupplier({
      ...newSupplier,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Handle save new supplier
  const handleSaveSupplier = async (e) => {
    e.preventDefault();
    await handleFormSubmission(
      async () => {
        // Validate form data
        const validation = validateFormData(newSupplier, formSchemas.supplier);
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          throw new Error('Por favor corrige los errores en el formulario');
        }

        // Clean and prepare data
        const cleanedData = cleanFormData(validation.data);
        await create(cleanedData);
        
        // Reset form and close modal
        setIsAddModalOpen(false);
        setNewSupplier({
          name: '',
          contact_person: '',
          email: '',
          phone: '',
          address: '',
          lead_time: '',
          payment_terms: '',
          notes: '',
          status: 'active'
        });
        setFormErrors({});
        
        handleSuccess('Proveedor creado exitosamente');
      },
      setIsSubmitting,
      'create supplier'
    );
  };
  
  // Handle edit supplier
  const handleEditSupplier = (supplier) => {
    setEditingSupplier({ ...supplier });
    setIsEditModalOpen(true);
    setFormErrors({}); // Clear any previous errors
  };

  // Handle save edited supplier
  const handleSaveEditedSupplier = async (e) => {
    e.preventDefault();
    await handleFormSubmission(
      async () => {
        // Validate form data
        const validation = validateFormData(editingSupplier, formSchemas.supplier);
        if (!validation.isValid) {
          setFormErrors(validation.errors);
          throw new Error('Por favor corrige los errores en el formulario');
        }

        // Clean and update data
        const cleanedData = cleanFormData(validation.data);
        await update(editingSupplier.id, cleanedData);
        
        // Reset form and close modal
        setIsEditModalOpen(false);
        setEditingSupplier(null);
        setFormErrors({});
        
        handleSuccess('Proveedor actualizado exitosamente');
      },
      setIsSubmitting,
      'update supplier'
    );
  };

  // Handle input change for editing supplier
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingSupplier({
      ...editingSupplier,
      [name]: value
    });
    
    // Clear specific field error when user starts typing
    if (formErrors[name]) {
      setFormErrors({
        ...formErrors,
        [name]: ''
      });
    }
  };
  
  // Handle close supplier details
  const handleCloseDetails = () => {
    setSelectedSupplier(null);
  };
  
  // Fetch purchase history for a supplier
  const fetchPurchaseHistory = async (supplierId, supplierName) => {
    setPurchaseHistoryLoading(true);
    try {
      // Try to get purchase orders or orders from this supplier
      // First attempt: Check if there's a purchase_orders table
      let { data: purchaseOrders, error: poError } = await supabase
        .from('purchase_orders')
        .select('*')
        .eq('supplier_id', supplierId)
        .order('created_at', { ascending: false });

      if (poError && poError.code === 'PGRST116') {
        // purchase_orders table doesn't exist, try to get products from this supplier and related orders
        const { data: supplierProducts, error: spError } = await supabase
          .from('products')
          .select('id, name')
          .eq('supplier_id', supplierId);

        if (spError) throw spError;

        if (supplierProducts && supplierProducts.length > 0) {
          const productIds = supplierProducts.map(p => p.id);
          
          // Get orders that contain products from this supplier
          const { data: orderItems, error: oiError } = await supabase
            .from('order_items')
            .select(`
              *, 
              orders!inner(id, date, total, status, client_id, created_at),
              products!inner(name, supplier_id)
            `)
            .in('product_id', productIds);

          if (oiError) throw oiError;

          if (orderItems && orderItems.length > 0) {
            // Group by order and calculate supplier totals
            const orderMap = new Map();
            orderItems.forEach(item => {
              const order = item.orders;
              const orderKey = order.id;
              
              if (!orderMap.has(orderKey)) {
                orderMap.set(orderKey, {
                  id: orderKey,
                  date: order.date || order.created_at,
                  order_number: `ORD-${orderKey.slice(-6)}`,
                  items: [],
                  total: 0,
                  status: order.status || 'completed',
                  type: 'order',
                  supplier_total: 0
                });
              }
              
              const orderData = orderMap.get(orderKey);
              orderData.items.push({
                product_name: item.products.name,
                quantity: item.quantity,
                price: item.price
              });
              orderData.supplier_total += (item.quantity * item.price);
            });

            return Array.from(orderMap.values());
          }
        }
        
        // No real data found, generate mock data
        return generateMockPurchaseHistory(supplierName);
      } else if (poError) {
        throw poError;
      }

      if (purchaseOrders && purchaseOrders.length > 0) {
        return purchaseOrders.map(po => ({
          ...po,
          order_number: po.order_number || `PO-${po.id.slice(-6)}`,
          type: 'purchase_order'
        }));
      } else {
        // No purchase orders found, generate mock data
        return generateMockPurchaseHistory(supplierName);
      }
    } catch (error) {
      console.error('Error fetching purchase history:', error);
      handleError(error, 'fetch purchase history', 'Error al cargar el historial de compras');
      return generateMockPurchaseHistory(supplierName);
    } finally {
      setPurchaseHistoryLoading(false);
    }
  };

  // Generate mock purchase history for demonstration
  const generateMockPurchaseHistory = (supplierName) => {
    const mockHistory = [];
    
    // Generate 5 mock purchase transactions
    for (let i = 0; i < 5; i++) {
      const daysAgo = (i + 1) * 15; // 15, 30, 45, 60, 75 days ago
      const baseAmount = 5000 + (Math.random() * 10000); // Random amount between 5k-15k
      
      mockHistory.push({
        id: `mock-${i}`,
        date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        order_number: `PO-${String(Math.floor(Math.random() * 999999)).padStart(6, '0')}`,
        items: [
          { product_name: `Producto ${i + 1} de ${supplierName}`, quantity: Math.floor(Math.random() * 10) + 1, price: baseAmount / 3 },
          { product_name: `Producto ${i + 2} de ${supplierName}`, quantity: Math.floor(Math.random() * 5) + 1, price: baseAmount / 4 }
        ],
        supplier_total: baseAmount,
        status: Math.random() > 0.7 ? 'pending' : 'completed',
        type: 'mock_purchase',
        is_mock: true
      });
    }
    
    return mockHistory;
  };

  // Handle purchase history
  const handlePurchaseHistory = async (supplier) => {

    setSelectedHistorySupplier(supplier);
    setIsPurchaseHistoryModalOpen(true);
    
    // Fetch purchase history
    const history = await fetchPurchaseHistory(supplier.id, supplier.name);
    setPurchaseHistory(history);
  };
  
  return (
    <div className="p-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Proveedores</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar proveedores..."
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
          
          <button
            onClick={handleAddSupplier}
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
              Nuevo Proveedor
            </div>
          </button>
        </div>
      </div>
      
      {/* Suppliers table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortConfig.field === 'name' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('contact_person')}
                >
                  <div className="flex items-center">
                    Contacto
                    {sortConfig.field === 'contact_person' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider"
                >
                  Contacto
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('lead_time')}
                >
                  <div className="flex items-center">
                    Tiempo de Entrega
                    {sortConfig.field === 'lead_time' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider"
                >
                  Condiciones de Pago
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredSuppliers.map((supplier) => (
                <tr 
                  key={supplier.id} 
                  className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectSupplier(supplier)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{supplier.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.contact_person}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{supplier.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.lead_time} días</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{supplier.payment_terms}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectSupplier(supplier);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditSupplier(supplier);
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
      
      {/* Supplier details modal */}
      {selectedSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">{selectedSupplier.name}</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información del Proveedor</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Contacto:</span>
                      <p className="text-blue-800 font-medium">{selectedSupplier.contact_person}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="text-blue-800">{selectedSupplier.email}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="text-blue-800">{selectedSupplier.phone}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Dirección:</span>
                      <p className="text-blue-800">{selectedSupplier.address}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Condiciones Comerciales</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Tiempo de Entrega:</span>
                      <p className="text-blue-800 font-medium">{selectedSupplier.lead_time} días</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Condiciones de Pago:</span>
                      <p className="text-blue-800">{selectedSupplier.payment_terms}</p>
                    </div>
                    
                    {selectedSupplier.notes && (
                      <div>
                        <span className="text-gray-500">Notas:</span>
                        <p className="text-blue-800 mt-1">{selectedSupplier.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-blue-800 mb-4">Productos Suministrados</h4>
              
              {selectedSupplier.productsList && selectedSupplier.productsList.length > 0 ? (
                <div className="bg-blue-50 rounded-lg overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Producto
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          SKU
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Categoría
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Precio
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedSupplier.productsList.map((product) => (
                        <tr key={product.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm font-medium text-gray-900">{product.name}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.sku}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{product.category}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(product.price)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <VenetianTile className="p-6 text-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-blue-800 mb-1">No hay productos asociados</h3>
                  <p className="text-gray-500">Este proveedor aún no tiene productos registrados</p>
                </VenetianTile>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Editar Proveedor
                  </button>
                  
                  <button 
                    className="px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={() => handlePurchaseHistory(selectedSupplier)}
                  >
                    Historial de Compras
                  </button>
                </div>
                
                <button className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  Agregar Producto
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add supplier modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Nuevo Proveedor</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newSupplier.name}
                    onChange={handleInputChange}
                    className={`w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 ${
                      formErrors.name ? 'border-red-500' : 'border-gray-300'
                    }`}
                  />
                  {formErrors.name && (
                    <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={newSupplier.contact_person}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newSupplier.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={newSupplier.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiempo de Entrega (días)
                  </label>
                  <input
                    type="number"
                    name="lead_time"
                    value={newSupplier.lead_time}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newSupplier.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    name="payment_terms"
                    value={newSupplier.payment_terms}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={newSupplier.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveSupplier();
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar Proveedor'}
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Edit supplier modal */}
      {isEditModalOpen && editingSupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Editar Proveedor</h3>
                <button 
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingSupplier.name || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contact_person"
                    value={editingSupplier.contact_person || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={editingSupplier.email || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={editingSupplier.phone || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tiempo de Entrega (días)
                  </label>
                  <input
                    type="number"
                    name="lead_time"
                    value={editingSupplier.lead_time || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={editingSupplier.address || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Condiciones de Pago
                  </label>
                  <input
                    type="text"
                    name="payment_terms"
                    value={editingSupplier.payment_terms || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={editingSupplier.status || 'active'}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={editingSupplier.notes || ''}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingSupplier(null);
                  }}
                  className="px-4 py-2 rounded-lg text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveEditedSupplier(e);
                  }}
                  disabled={isSubmitting}
                  className={`px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 ${
                    isSubmitting ? 'opacity-50 cursor-not-allowed' : ''
                  }`}
                >
                  {isSubmitting ? 'Actualizando...' : 'Actualizar Proveedor'}
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Purchase History Modal */}
      {isPurchaseHistoryModalOpen && selectedHistorySupplier && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">
                  Historial de Compras - {selectedHistorySupplier.name}
                </h3>
                <button 
                  onClick={() => setIsPurchaseHistoryModalOpen(false)}
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
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Proveedor:</span> {selectedHistorySupplier.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Contacto:</span> {selectedHistorySupplier.contact_person}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Teléfono:</span> {selectedHistorySupplier.phone}
                </p>
              </div>

              {/* Show if data is mock or real */}
              {purchaseHistory.length > 0 && purchaseHistory[0]?.is_mock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Los datos mostrados son de ejemplo. 
                    Para datos reales se conectará a purchase_orders o order_items relacionados con productos de este proveedor.
                  </p>
                </div>
              )}

              {purchaseHistoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando historial...</span>
                </div>
              ) : purchaseHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay historial de compras disponible para este proveedor.</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-50">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          N° Orden/Factura
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Productos
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Total
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Estado
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Tipo
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {purchaseHistory.map((purchase, index) => {
                        const productsSummary = purchase.items && purchase.items.length > 0 
                          ? purchase.items.map(item => `${item.product_name} (${item.quantity})`).join(', ')
                          : 'Productos no especificados';
                        
                        const total = purchase.supplier_total || purchase.total || 0;
                        
                        return (
                          <tr key={purchase.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(purchase.date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {purchase.order_number || `#${purchase.id?.slice(-6)}`}
                            </td>
                            <td className="px-6 py-4 text-sm text-gray-900 dark:text-gray-100 max-w-xs truncate" title={productsSummary}>
                              {productsSummary}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                              {formatCurrency(total)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                                purchase.status === 'completed' || purchase.status === 'entregado' ? 'bg-green-100 text-green-800' :
                                purchase.status === 'pending' || purchase.status === 'en_transito' ? 'bg-yellow-100 text-yellow-800' :
                                purchase.status === 'cancelled' ? 'bg-red-100 text-red-800' :
                                'bg-gray-100 text-gray-800'
                              }`}>
                                {purchase.status === 'completed' ? 'Completado' :
                                 purchase.status === 'pending' ? 'Pendiente' :
                                 purchase.status === 'cancelled' ? 'Cancelado' :
                                 purchase.status === 'entregado' ? 'Entregado' :
                                 purchase.status === 'en_transito' ? 'En Tránsito' :
                                 purchase.status || 'Sin estado'}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {purchase.type === 'purchase_order' ? 'Orden de Compra' :
                               purchase.type === 'order' ? 'Pedido Cliente' :
                               purchase.type === 'mock_purchase' ? 'Ejemplo' :
                               'No especificado'}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => {
                    setIsPurchaseHistoryModalOpen(false);
                    setPurchaseHistory([]);
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
    </div>
  );
};

export default SuppliersPage;
