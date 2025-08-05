import React, { useState, useEffect } from 'react';
import { useInventory, useProducts } from '../hooks/useData';
import { formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData } from '../utils/formValidation';
import { supabase } from '../supabaseClient';
import VenetianTile from './VenetianTile';
import InventoryOrderButton from './InventoryOrderButton'; // Import the new button
import InventoryMovementModal from './InventoryMovementModal'; // Import the new modal
import ProductsAddModal from './ProductsAddModal'; // Import the ProductsAddModal

const InventoryPage = () => {
  const { data: inventoryList, loading: inventoryLoading, update: updateInventory } = useInventory();
  const { data: productsList, loading: productsLoading } = useProducts();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'last_updated', direction: 'desc' });
  const [locationFilter, setLocationFilter] = useState('');
  const [isAdjustModalOpen, setIsAdjustModalOpen] = useState(false);
  const [isMovementModalOpen, setIsMovementModalOpen] = useState(false); // State for movement modal
  const [isAddProductModalOpen, setIsAddProductModalOpen] = useState(false); // State for add product modal
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false); // State for history modal
  const [selectedItem, setSelectedItem] = useState(null);
  const [selectedHistoryItem, setSelectedHistoryItem] = useState(null);
  const [movementHistory, setMovementHistory] = useState([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [adjustmentData, setAdjustmentData] = useState({
    quantity: '',
    reason: '',
    notes: ''
  });
  
  // Get unique locations for filter
  const locations = [...new Set((inventoryList || []).map(item => item.location))];
  
  // Combine inventory with product details
  const inventoryWithProducts = (inventoryList || []).map(item => {
    const product = (productsList || []).find(p => p.id === item.product_id) || {};
    return {
      ...item,
      productName: product.name || 'Producto Desconocido',
      sku: product.sku || 'N/A',
      category: product.category || 'N/A',
      minStock: item.min_stock || 0,
      status: item.quantity <= (item.min_stock || 0) ? 'low' : 'ok'
    };
  });
  
  // Filter and sort inventory
  const filteredInventory = sortByField(
    filterBySearchTerm(
      locationFilter 
        ? inventoryWithProducts.filter(item => item.location === locationFilter)
        : inventoryWithProducts, 
      searchTerm, 
      ['productName', 'sku', 'location', 'notes']
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
  
  // Handle inventory adjustment
  const handleAdjustInventory = (item) => {
    setSelectedItem(item);
    setAdjustmentData({
      quantity: item.quantity.toString(),
      reason: '',
      notes: ''
    });
    setIsAdjustModalOpen(true);
  };
  
  // Handle input change for adjustment
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setAdjustmentData({
      ...adjustmentData,
      [name]: value
    });
  };
  
  // Handle save adjustment
  const handleSaveAdjustment = async () => {
    await handleFormSubmission(async () => {
      const cleanedData = cleanFormData(adjustmentData);
      
      const updatedItem = {
        quantity: parseInt(cleanedData.quantity),
        last_updated: new Date().toISOString(),
        notes: cleanedData.notes
      };
      
      await updateInventory(selectedItem.id, updatedItem);
      setIsAdjustModalOpen(false);
      setAdjustmentData({ quantity: '', reason: '', notes: '' });
      
      return 'Ajuste de inventario guardado exitosamente';
    });
  };
  
  // Handle add new movement
  const handleAddMovement = () => {
    setIsMovementModalOpen(true);
  };
  
  // Handle save new movement from modal
  const handleSaveNewMovement = (movementData) => {
    // Simplified logic: just add the movement to a list (not updating inventory stock here)

    // In a real app, you would update the inventory list based on the movement type and quantity
    setIsMovementModalOpen(false);
  };
  
  // Handle add new product
  const handleAddProduct = () => {
    setIsAddProductModalOpen(true);
  };
  
  // Handle save new product from modal (placeholder)
  const handleSaveNewProduct = (productData) => {

    // In a real app, you would add the new product to the productsList state
    setIsAddProductModalOpen(false);
  };
  
  // Handle order from inventory alert (placeholder)
  const handleOrderFromInventory = (product) => {

    // In a real app, this would navigate to the order creation page
    // or open a modal to create a purchase order for this product.
    handleSuccess(`Funcionalidad "Realizar Pedido" para ${product.name} pendiente de implementar.`);
  };
  
  // Handle view inventory history
  const handleViewHistory = async (item) => {

    setSelectedHistoryItem(item);
    setIsHistoryModalOpen(true);
    
    // Fetch real movement history from database
    await fetchMovementHistory(item.product_id);
  };
  
  // Fetch movement history for a specific product
  const fetchMovementHistory = async (productId) => {
    try {
      setHistoryLoading(true);
      
      const { data, error } = await supabase
        .from('inventory_movements')
        .select(`
          *,
          products:product_id (
            name,
            sku
          )
        `)
        .eq('product_id', productId)
        .order('movement_date', { ascending: false })
        .limit(50); // Get last 50 movements
        
      if (error) {
        throw error;
      }
      
      // console.log('📦 Movement history loaded:', {
      //   productId,
      //   movementsCount: data?.length || 0,
      //   movements: data
      // });
      
      setMovementHistory(data || []);
    } catch (error) {
      console.error('Error fetching movement history:', error);
      handleError(error, 'fetch movement history', 'Error al cargar el historial de movimientos');
      setMovementHistory([]);
    } finally {
      setHistoryLoading(false);
    }
  };
  
  return (
    <div className="p-6">
      {/* Loading state */}
      {(inventoryLoading || productsLoading) && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando inventario...</span>
        </div>
      )}

      {/* Content - only show when data is loaded */}
      {!inventoryLoading && !productsLoading && (
        <>
          {/* Header with search, filter and add button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Inventario</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar en inventario..."
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
            className="w-full md:w-48 px-4 py-2 rounded-lg bg-background border border-border text-foreground focus:outline-none focus:ring-2 focus:ring-primary focus:border-primary"
            value={locationFilter}
            onChange={(e) => setLocationFilter(e.target.value)}
          >
            <option value="">Todas las ubicaciones</option>
            {locations.map((location) => (
              <option key={location} value={location}>
                {location}
              </option>
            ))}
          </select>
          
          <button
            onClick={handleAddMovement}
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
              Nuevo Movimiento
            </div>
          </button>
           <button
            onClick={handleAddProduct}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
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
              Nuevo Producto
            </div>
          </button>
        </div>
      </div>
      
      {/* Inventory summary cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Total de Productos</p>
              <h3 className="text-2xl font-bold text-blue-800">{productsList.length}</h3>
            </div>
          </div>
        </VenetianTile>
        
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Ubicaciones</p>
              <h3 className="text-2xl font-bold text-blue-800">{locations.length}</h3>
            </div>
          </div>
        </VenetianTile>
        
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-red-100 text-red-600 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 text-sm">Productos Bajo Stock</p>
              <h3 className="text-2xl font-bold text-blue-800">
                {inventoryWithProducts.filter(item => item.status === 'low').length}
              </h3>
            </div>
          </div>
        </VenetianTile>
      </div>
      
      {/* Inventory table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('productName')}
                >
                  <div className="flex items-center">
                    Producto
                    {sortConfig.field === 'productName' && (
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
                  onClick={() => handleSort('sku')}
                >
                  <div className="flex items-center">
                    SKU
                    {sortConfig.field === 'sku' && (
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
                  onClick={() => handleSort('location')}
                >
                  <div className="flex items-center">
                    Ubicación
                    {sortConfig.field === 'location' && (
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
                  onClick={() => handleSort('quantity')}
                >
                  <div className="flex items-center">
                    Cantidad
                    {sortConfig.field === 'quantity' && (
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
                  onClick={() => handleSort('last_updated')}
                >
                  <div className="flex items-center">
                    Última Actualización
                    {sortConfig.field === 'last_updated' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                >
                  Estado
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInventory.map((item) => (
                <tr key={item.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    <div className="text-xs text-gray-500">{item.category}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{item.sku}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{item.location}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100 font-medium">{item.quantity}</div>
                    <div className="text-xs text-gray-500">Mín: {item.minStock}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(item.last_updated)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      item.status === 'low' 
                        ? 'bg-red-100 text-red-800' 
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {item.status === 'low' ? 'Bajo Stock' : 'OK'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    {item.status === 'low' && (
                      <InventoryOrderButton product={productsList.find(p => p.id === item.productId)} onOrder={handleOrderFromInventory} />
                    )}
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handleAdjustInventory(item)}
                    >
                      Ajustar
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-200"
                      onClick={() => handleViewHistory(item)}
                    >
                      Historial
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Adjust inventory modal */}
      {isAdjustModalOpen && selectedItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Ajustar Inventario</h3>
                <button 
                  onClick={() => setIsAdjustModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Producto
                  </label>
                  <p className="text-blue-800 font-medium">{selectedItem.productName}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Ubicación
                  </label>
                  <p className="text-blue-800">{selectedItem.location}</p>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cantidad Actual
                  </label>
                  <input
                    type="number"
                    name="quantity"
                    value={adjustmentData.quantity}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Razón del Ajuste
                  </label>
                  <select
                    name="reason"
                    value={adjustmentData.reason}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="recuento">Recuento físico</option>
                    <option value="daño">Producto dañado</option>
                    <option value="devolucion">Devolución</option>
                    <option value="ajuste">Ajuste de inventario</option>
                    <option value="otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Notas
                  </label>
                  <textarea
                    name="notes"
                    value={adjustmentData.notes}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAdjustModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveAdjustment();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Ajuste
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* New Movement Modal */}
      <InventoryMovementModal 
        isOpen={isMovementModalOpen}
        onClose={() => setIsMovementModalOpen(false)}
        onSave={handleSaveNewMovement}
      />
      
      {/* Add Product Modal */}
      <ProductsAddModal 
        isOpen={isAddProductModalOpen}
        onClose={() => setIsAddProductModalOpen(false)}
        onSave={handleSaveNewProduct}
      />

      {/* Inventory History Modal */}
      {isHistoryModalOpen && selectedHistoryItem && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">
                  Historial de Movimientos - {selectedHistoryItem.product_name}
                </h3>
                <button 
                  onClick={() => setIsHistoryModalOpen(false)}
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
                  <span className="font-medium">Producto:</span> {selectedHistoryItem.product_name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">SKU:</span> {selectedHistoryItem.sku}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Ubicación:</span> {selectedHistoryItem.location}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Stock Actual:</span> {selectedHistoryItem.quantity}
                </p>
              </div>

              {/* Movement history status */}
              {historyLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-3 text-gray-600">Cargando historial...</span>
                </div>
              ) : movementHistory.length === 0 ? (
                <div className="bg-gray-50 border border-gray-200 rounded-lg p-4 mb-4">
                  <p className="text-gray-800 text-sm">
                    No se encontraron movimientos para este producto.
                  </p>
                </div>
              ) : (
                <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
                  <p className="text-green-800 text-sm">
                    <strong>✅ Datos reales:</strong> Mostrando {movementHistory.length} movimientos del historial de inventario.
                  </p>
                </div>
              )}

              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-blue-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Fecha
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Tipo de Movimiento
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Cantidad
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Stock Anterior
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Stock Nuevo
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Motivo
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {/* Real movement history data */}
                    {movementHistory.map((movement, index) => (
                      <tr key={movement.id || index}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                          {formatDate(movement.movement_date || movement.created_at)}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                            movement.movement_type === 'entrada' ? 'bg-green-100 text-green-800' :
                            movement.movement_type === 'salida' ? 'bg-red-100 text-red-800' :
                            movement.movement_type === 'ajuste' ? 'bg-blue-100 text-blue-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {movement.movement_type?.charAt(0).toUpperCase() + movement.movement_type?.slice(1) || 'N/A'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={`font-medium ${
                            movement.quantity_change > 0 ? 'text-green-600' : 
                            movement.quantity_change < 0 ? 'text-red-600' : 'text-gray-600'
                          }`}>
                            {movement.quantity_change > 0 ? '+' : ''}{movement.quantity_change || 0}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.previous_stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {movement.new_stock || 0}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-600">
                          {movement.notes || movement.reference_type || 'Sin motivo especificado'}
                        </td>
                      </tr>
                    ))}
                    
                    {/* Show message if no movements */}
                    {!historyLoading && movementHistory.length === 0 && (
                      <tr>
                        <td colSpan="6" className="px-6 py-8 text-center text-gray-500">
                          No hay movimientos registrados para este producto
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>

              <div className="mt-6 flex justify-end">
                <button
                  onClick={() => setIsHistoryModalOpen(false)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      </>
      )}
    </div>
  );
};

export default InventoryPage;
