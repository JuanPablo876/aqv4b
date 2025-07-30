import React, { useState, useEffect } from 'react';
import { products } from '../mock/products';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/placeholders';
import VenetianTile from './VenetianTile';

const ProductsPage = () => {
  const [productsList, setProductsList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    sku: '',
    supplier: '',
    imageUrl: '', // Added imageUrl field
    status: 'active'
  });
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setProductsList(products);
  }, []);
  
  // Get unique categories for filter
  const categories = [...new Set(productsList.map(product => product.category))];
  
  // Filter and sort products
  const filteredProducts = sortByField(
    filterBySearchTerm(
      categoryFilter 
        ? productsList.filter(product => product.category === categoryFilter)
        : productsList, 
      searchTerm, 
      ['name', 'description', 'sku', 'supplier']
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
          imageUrl: reader.result // Store image as base64 string (for demo purposes)
        });
      };
      reader.readAsDataURL(file);
    }
  };
  
  // Handle save new product
  const handleSaveProduct = () => {
    // Convert string values to numbers where needed
    const formattedProduct = {
      ...newProduct,
      id: productsList.length + 1,
      price: parseFloat(newProduct.price) || 0,
      cost: parseFloat(newProduct.cost) || 0,
      stock: parseInt(newProduct.stock) || 0,
      minStock: parseInt(newProduct.minStock) || 0,
      imageUrl: newProduct.imageUrl || DEFAULT_PRODUCT_IMAGE // Use uploaded image or placeholder
    };
    
    setProductsList([...productsList, formattedProduct]);
    setIsAddModalOpen(false);
    setNewProduct({
      name: '',
      category: '',
      description: '',
      price: '',
      cost: '',
      stock: '',
      minStock: '',
      sku: '',
      supplier: '',
      imageUrl: '',
      status: 'active'
    });
  };
  
  // Handle close product details
  const handleCloseDetails = () => {
    setSelectedProduct(null);
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
            className="w-full md:w-48 px-4 py-2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
                  <p className="text-xs text-gray-500">Mín: {product.minStock}</p>
                </div>
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
                      src={selectedProduct.imageUrl} 
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
                    
                    <div className="bg-purple-50 p-4 rounded-lg">
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
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                        Editar Producto
                      </button>
                      
                      <button className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                        Ajustar Inventario
                      </button>
                      
                      <button className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
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
                    name="minStock"
                    value={newProduct.minStock}
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
                    name="supplier"
                    value={newProduct.supplier}
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
                   {newProduct.imageUrl && (
                    <div className="mt-4 w-32 h-32 rounded-lg overflow-hidden border border-gray-200">
                      <img src={newProduct.imageUrl} alt="Preview" className="w-full h-full object-cover" />
                    </div>
                  )}
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSaveProduct}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Producto
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
