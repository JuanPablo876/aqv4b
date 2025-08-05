import React, { useState, useEffect } from 'react';
import { useProducts } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/placeholders';
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData, productSchema } from '../utils/formValidation';
import { supabase } from '../supabaseClient';
import VenetianTile from './VenetianTile';

const ProductsPage = () => {
  const { data: productsList, loading, error, create, update, delete: deleteProduct } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState(null);
  const [isPriceHistoryModalOpen, setIsPriceHistoryModalOpen] = useState(false);
  const [selectedHistoryProduct, setSelectedHistoryProduct] = useState(null);
  const [priceHistory, setPriceHistory] = useState([]);
  const [priceHistoryLoading, setPriceHistoryLoading] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    min_stock: '', // Updated to match database field name
    sku: '',
    supplier_id: '', // Updated to match database field name
    supplier_name: '', // Updated to match database field name
    image_url: '', // Updated to match database field name
    status: 'active',
    brand: '',
    model: '',
    weight: '',
    dimensions: '',
    warranty: '',
    installation_required: false,
    seasonal_demand: 'moderate',
    last_restock_date: ''
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando productos...</span>
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
              <p className="text-red-700 mb-4">No se pudo cargar la información de productos:</p>
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
  
  // Get unique categories for filter
  const categories = [...new Set(productsList.map(product => product.category))];
  
  // Filter and sort products
  const filteredProducts = sortByField(
    filterBySearchTerm(
      categoryFilter 
        ? productsList.filter(product => product.category === categoryFilter)
        : productsList, 
      searchTerm, 
      ['name', 'description', 'sku', 'supplier_name'] // Updated to match database field
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
  
  // Handle product selection
  const handleSelectProduct = (product) => {
    setSelectedProduct(product);
  };
  
  // Handle add new product
  const handleAddProduct = () => {
    setIsAddModalOpen(true);
  };
  
  // Handle input change for new product
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewProduct({
      ...newProduct,
      [name]: value
    });
  };
  
  // Handle file input change for image
  const handleImageChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setNewProduct({
          ...newProduct,
          image_url: reader.result // Store image as base64 string (for demo purposes)
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle save new product
  const handleSaveProduct = async () => {
    await handleFormSubmission(async () => {
      // Clean and validate form data
      const cleanedData = cleanFormData(newProduct);
      
      // Convert string values to numbers where needed
      const formattedProduct = {
        ...cleanedData,
        price: parseFloat(cleanedData.price) || 0,
        cost: parseFloat(cleanedData.cost) || 0,
        stock: parseInt(cleanedData.stock) || 0,
        min_stock: parseInt(cleanedData.min_stock) || 0,
        image_url: cleanedData.image_url || DEFAULT_PRODUCT_IMAGE,
        installation_required: Boolean(cleanedData.installation_required),
        last_restock_date: cleanedData.last_restock_date || null
      };
      
      await create(formattedProduct);
      setIsAddModalOpen(false);
      setNewProduct({
        name: '',
        category: '',
        description: '',
        price: '',
        cost: '',
        stock: '',
        min_stock: '',
        sku: '',
        supplier_id: '',
        supplier_name: '',
        image_url: '',
        status: 'active',
        brand: '',
        model: '',
        weight: '',
        dimensions: '',
        warranty: '',
        installation_required: false,
        seasonal_demand: 'moderate',
        last_restock_date: ''
      });
      
      return 'Producto creado exitosamente';
    });
  };
  
  // Fetch price history for a product
  const fetchPriceHistory = async (productId) => {
    setPriceHistoryLoading(true);
    try {
      // First, check if we have a price_history table
      const { data: priceHistoryData, error: historyError } = await supabase
        .from('price_history')
        .select('*')
        .eq('product_id', productId)
        .order('change_date', { ascending: false });

      if (historyError && historyError.code === 'PGRST116') {
        // Table doesn't exist, create mock data for now

        return generateMockPriceHistory();
      } else if (historyError) {
        throw historyError;
      }

      if (priceHistoryData && priceHistoryData.length > 0) {
        return priceHistoryData;
      } else {
        // No price history found, generate some based on current price
        return generateMockPriceHistory();
      }
    } catch (error) {
      handleError(error, 'fetch price history', 'Error al cargar el historial de precios');
      return generateMockPriceHistory();
    } finally {
      setPriceHistoryLoading(false);
    }
  };

  // Generate mock price history for demonstration
  const generateMockPriceHistory = () => {
    const currentProduct = selectedHistoryProduct;
    if (!currentProduct) return [];

    const currentPrice = parseFloat(currentProduct.price) || 100;
    const mockHistory = [];
    
    // Generate 5 historical price changes
    for (let i = 0; i < 5; i++) {
      const daysAgo = (i + 1) * 30; // 30, 60, 90, 120, 150 days ago
      const priceVariation = 0.8 + (Math.random() * 0.4); // ±20% variation
      const oldPrice = currentPrice * priceVariation;
      
      mockHistory.push({
        id: `mock-${i}`,
        change_date: new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000).toISOString(),
        old_price: oldPrice,
        new_price: i === 0 ? currentPrice : mockHistory[i-1].old_price,
        change_reason: i === 0 ? 'Actualización de precio actual' : 
                     Math.random() > 0.5 ? 'Ajuste por inflación' : 'Cambio de proveedor',
        changed_by: 'Sistema',
        notes: i === 0 ? 'Precio actual del producto' : 
               `Cambio de precio ${oldPrice < currentPrice ? 'incremento' : 'reducción'}`,
        is_mock: true
      });
    }
    
    return mockHistory;
  };

  // Handle price history
  const handlePriceHistory = async (product) => {

    setSelectedHistoryProduct(product);
    setIsPriceHistoryModalOpen(true);
    
    // Fetch price history
    const history = await fetchPriceHistory(product.id);
    setPriceHistory(history);
  };
  
  // Handle close product details
  const handleCloseDetails = () => {
    setSelectedProduct(null);
  };

  // Handle edit product
  const handleEditProduct = (product) => {
    setEditingProduct({ ...product });
    setIsEditModalOpen(true);
  };

  // Handle edit form input change
  const handleEditInputChange = (e) => {
    const { name, value, type, checked } = e.target;
    setEditingProduct(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }));
  };

  // Handle update product
  const handleUpdateProduct = async () => {
    await handleFormSubmission(async () => {
      // Clean and validate form data
      const cleanedData = cleanFormData(editingProduct);
      
      // Convert string values to numbers where needed
      const processedProduct = {
        ...cleanedData,
        price: parseFloat(cleanedData.price) || 0,
        cost: parseFloat(cleanedData.cost) || 0,
        stock: parseInt(cleanedData.stock) || 0,
        min_stock: parseInt(cleanedData.min_stock) || 0,
        weight: parseFloat(cleanedData.weight) || 0
      };

      await update(editingProduct.id, processedProduct);
      setIsEditModalOpen(false);
      setEditingProduct(null);
      
      return 'Producto actualizado exitosamente';
    });
  };

  // Handle delete product with confirmation
  const handleDeleteProduct = async (productId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar este producto? Esta acción no se puede deshacer.')) {
      try {
        await deleteProduct(productId);
        handleSuccess('Producto eliminado exitosamente');
      } catch (error) {
        handleError(error, 'Error al eliminar producto');
      }
    }
  };
  
  // Calculate profit margin
  const calculateMargin = (price, cost) => {
    if (!price || !cost || cost === 0) return 0;
    return ((price - cost) / price) * 100;
  };
  
  return (
    <div className="p-6">
      {/* Header with search, filter and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Productos</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar productos..."
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
            value={categoryFilter}
            onChange={(e) => setCategoryFilter(e.target.value)}
          >
            <option value="">Todas las categorías</option>
            {categories.map((category) => (
              <option key={category} value={category}>
                {category}
              </option>
            ))}
            <option value="Nueva Categoría">Nueva Categoría</option>
          </select>
          
          <button
            onClick={handleAddProduct}
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
              Nuevo Producto
            </div>
          </button>
        </div>
      </div>
      
      {/* Products grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
        {filteredProducts.map((product) => (
          <VenetianTile 
            key={product.id} 
            className="overflow-hidden hover:shadow-md transition-shadow cursor-pointer"
            onClick={() => handleSelectProduct(product)}
          >
            <div className="h-48 bg-gray-200 relative">
              <img 
                src={product.imageUrl} 
                alt={product.name} 
                className="w-full h-full object-cover"
              />
              <div className="absolute top-2 right-2">
                <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(product.status)}`}>
                  {product.status === 'active' ? 'Activo' : 'Inactivo'}
                </span>
              </div>
            </div>
            
            <div className="p-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-lg font-medium text-blue-800 mb-1">{product.name}</h3>
                  <p className="text-sm text-blue-500 mb-2">{product.category}</p>
                </div>
                <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium">
                  {product.sku}
                </span>
              </div>
              
              <p className="text-gray-600 text-sm mb-3 line-clamp-2">{product.description}</p>
              
              <div className="flex justify-between items-center">
                <div>
                  <p className="text-lg font-semibold text-blue-800">{formatCurrency(product.price)}</p>
                  <p className="text-xs text-gray-500">Costo: {formatCurrency(product.cost)}</p>
                </div>
                
                <div className="text-right">
                  <p className="text-sm font-medium text-blue-800">{product.stock} unidades</p>
                  <p className="text-xs text-gray-500">Mín: {product.min_stock}</p>
                </div>
              </div>
              
              {/* Action buttons */}
              <div className="mt-4 flex justify-end space-x-2">
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleEditProduct(product);
                  }}
                  className="px-3 py-1.5 bg-blue-100 text-blue-700 text-xs font-medium rounded-md hover:bg-blue-200 transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-1"
                >
                  Editar
                </button>
                <button
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteProduct(product.id);
                  }}
                  className="px-3 py-1.5 bg-red-100 text-red-700 text-xs font-medium rounded-md hover:bg-red-200 transition-colors focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-1"
                >
                  Eliminar
                </button>
              </div>
            </div>
          </VenetianTile>
        ))}
      </div>
      
      {filteredProducts.length === 0 && (
        <VenetianTile className="p-8 text-center">
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
              d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
            />
          </svg>
          <h3 className="text-lg font-medium text-blue-800 mb-1">No se encontraron productos</h3>
          <p className="text-gray-500">Intenta con otra búsqueda o categoría</p>
        </VenetianTile>
      )}
      
      {/* Product details modal */}
      {selectedProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Detalles del Producto</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <div className="bg-gray-200 rounded-lg h-64 mb-4">
                    <img 
                      src={selectedProduct.image_url} 
                      alt={selectedProduct.name} 
                      className="w-full h-full object-cover rounded-lg"
                    />
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Precio</p>
                      <p className="text-xl font-semibold text-blue-800">{formatCurrency(selectedProduct.price)}</p>
                    </div>
                    
                    <div className="bg-green-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Costo</p>
                      <p className="text-xl font-semibold text-blue-800">{formatCurrency(selectedProduct.cost)}</p>
                    </div>
                    
                    <div className="bg-blue-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Margen</p>
                      <p className="text-xl font-semibold text-blue-800">
                        {calculateMargin(selectedProduct.price, selectedProduct.cost).toFixed(2)}%
                      </p>
                    </div>
                    
                    <div className="bg-amber-50 p-4 rounded-lg">
                      <p className="text-sm text-gray-500">Stock</p>
                      <p className="text-xl font-semibold text-blue-800">{selectedProduct.stock} unidades</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <div className="mb-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <h2 className="text-2xl font-semibold text-blue-800">{selectedProduct.name}</h2>
                        <div className="flex items-center mt-1">
                          <span className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-md font-medium mr-2">
                            {selectedProduct.sku}
                          </span>
                          <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(selectedProduct.status)}`}>
                            {selectedProduct.status === 'active' ? 'Activo' : 'Inactivo'}
                          </span>
                        </div>
                      </div>
                      
                      <span className="bg-gray-100 text-gray-800 text-sm px-3 py-1 rounded-md font-medium">
                        {selectedProduct.category}
                      </span>
                    </div>
                    
                    <div className="mt-4">
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Descripción</h4>
                      <p className="text-gray-700">{selectedProduct.description}</p>
                    </div>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 mb-6">
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Proveedor</h4>
                      <p className="text-gray-700">{selectedProduct.supplier}</p>
                    </div>
                    
                    <div>
                      <h4 className="text-sm font-medium text-gray-500 mb-1">Stock Mínimo</h4>
                      <p className="text-gray-700">{selectedProduct.minStock} unidades</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-blue-800 mb-4">Acciones Rápidas</h4>
                    
                    <div className="grid grid-cols-3 gap-3">
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => handleEditProduct(selectedProduct)}
                      >
                        Editar Producto
                      </button>
                      
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                        Ajustar Inventario
                      </button>

                      <button 
                        className="bg-red-600 text-white px-4 py-2 rounded-lg hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                        onClick={() => handleDeleteProduct(selectedProduct.id)}
                      >
                        Eliminar
                      </button>
                      
                      <button 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        onClick={() => handlePriceHistory(selectedProduct)}
                      >
                        Historial de Precios
                      </button>
                      
                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                        Ver Movimientos
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add product modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Nuevo Producto</h3>
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
                    Nombre del Producto
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newProduct.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <select
                    name="category"
                    value={newProduct.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    {categories.map((category) => (
                      <option key={category} value={category}>
                        {category}
                      </option>
                    ))}
                    <option value="Nueva Categoría">Nueva Categoría</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    SKU
                  </label>
                  <input
                    type="text"
                    name="sku"
                    value={newProduct.sku}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={newProduct.description}
                    onChange={handleInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio de Venta
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={newProduct.price}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={newProduct.cost}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Inicial
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={newProduct.stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={newProduct.min_stock}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Proveedor
                  </label>
                  <input
                    type="text"
                    name="supplier_name"
                    value={newProduct.supplier_name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={newProduct.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="discontinued">Descontinuado</option>
                  </select>
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Imagen del Producto
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleImageChange}
                    className="w-full text-gray-700 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                  />
                   {newProduct.image_url && (
                    <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img src={newProduct.image_url} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveProduct();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Producto
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Price History Modal */}
      {isPriceHistoryModalOpen && selectedHistoryProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">
                  Historial de Precios - {selectedHistoryProduct.name}
                </h3>
                <button 
                  onClick={() => setIsPriceHistoryModalOpen(false)}
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
                  <span className="font-medium">Producto:</span> {selectedHistoryProduct.name}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">SKU:</span> {selectedHistoryProduct.sku}
                </p>
                <p className="text-sm text-gray-600">
                  <span className="font-medium">Precio Actual:</span> {formatCurrency(selectedHistoryProduct.price)}
                </p>
              </div>

              {/* Show if data is mock or real */}
              {priceHistory.length > 0 && priceHistory[0]?.is_mock && (
                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-4">
                  <p className="text-yellow-800 text-sm">
                    <strong>Nota:</strong> Los datos mostrados son de ejemplo. 
                    Para conectar con datos reales, se necesita crear la tabla price_history en la base de datos.
                  </p>
                </div>
              )}

              {priceHistoryLoading ? (
                <div className="flex justify-center items-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando historial...</span>
                </div>
              ) : priceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <p className="text-gray-500">No hay historial de precios disponible para este producto.</p>
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
                          Precio Anterior
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Precio Nuevo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Cambio
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Motivo
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Usuario
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {priceHistory.map((priceChange, index) => {
                        const oldPrice = parseFloat(priceChange.old_price) || 0;
                        const newPrice = parseFloat(priceChange.new_price) || 0;
                        const change = newPrice - oldPrice;
                        
                        return (
                          <tr key={priceChange.id || index}>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {formatDate(priceChange.change_date)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 dark:text-gray-100">
                              {formatCurrency(oldPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900 dark:text-gray-100">
                              {formatCurrency(newPrice)}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <span className={`text-sm font-medium ${
                                change > 0 ? 'text-green-600' : change < 0 ? 'text-red-600' : 'text-gray-600'
                              }`}>
                                {change > 0 ? '+' : ''}{formatCurrency(change)}
                              </span>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {priceChange.change_reason || 'No especificado'}
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                              {priceChange.changed_by || 'Sistema'}
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
                    setIsPriceHistoryModalOpen(false);
                    setPriceHistory([]);
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

      {/* Edit product modal */}
      {isEditModalOpen && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Editar Producto</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre del Producto *
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={editingProduct.name || ''}
                    onChange={handleEditInputChange}
                    required
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Precio de Venta *
                  </label>
                  <input
                    type="number"
                    name="price"
                    value={editingProduct.price || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    min="0"
                    required
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Costo
                  </label>
                  <input
                    type="number"
                    name="cost"
                    value={editingProduct.cost || ''}
                    onChange={handleEditInputChange}
                    step="0.01"
                    min="0"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Actual
                  </label>
                  <input
                    type="number"
                    name="stock"
                    value={editingProduct.stock || ''}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Stock Mínimo
                  </label>
                  <input
                    type="number"
                    name="min_stock"
                    value={editingProduct.min_stock || ''}
                    onChange={handleEditInputChange}
                    min="0"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={editingProduct.category || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={editingProduct.description || ''}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>

              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleUpdateProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Cambios
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
    </div>
  );
};

export default ProductsPage;
