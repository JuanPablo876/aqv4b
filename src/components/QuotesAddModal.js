import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { clients } from '../mock/clients';
import { products } from '../mock/products';
import { calculateSubtotal, calculateDiscount, calculateTax, calculateTotal } from '../utils/helpers';
import { formatCurrency } from '../utils/storage';

const QuotesAddModal = ({ isOpen, onClose, onSave, preSelectedClient = null }) => {
  const [clientsList, setClientsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [newQuote, setNewQuote] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'pending',
    items: [],
    notes: ''
  });
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [productQuantityToAdd, setProductQuantityToAdd] = useState(1);
  const [productDiscountToAdd, setProductDiscountToAdd] = useState(0);
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setClientsList(clients);
    setProductsList(products);
    
    // Auto-fill client if pre-selected
    if (preSelectedClient) {
      setNewQuote(prev => ({
        ...prev,
        clientId: preSelectedClient.id
      }));
    }
  }, [preSelectedClient]);
  
  // Get product details by ID
  const getProductDetails = (productId) => {
    return productsList.find(p => p.id === parseInt(productId));
  };
  
  // Handle input change for new quote
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewQuote({
      ...newQuote,
      [name]: value
    });
  };
  
  // Handle add product to quote
  const handleAddProductToQuote = () => {
    if (!selectedProductToAdd || productQuantityToAdd <= 0) return;
    
    const product = getProductDetails(selectedProductToAdd);
    if (!product) return;
    
    const newItem = {
      productId: product.id,
      quantity: parseInt(productQuantityToAdd),
      price: product.price,
      discount: parseFloat(productDiscountToAdd) || 0
    };
    
    setNewQuote({
      ...newQuote,
      items: [...newQuote.items, newItem]
    });
    
    // Reset product selection fields
    setSelectedProductToAdd('');
    setProductQuantityToAdd(1);
    setProductDiscountToAdd(0);
  };
  
  // Handle remove product from quote
  const handleRemoveProductFromQuote = (index) => {
    const updatedItems = newQuote.items.filter((_, i) => i !== index);
    setNewQuote({
      ...newQuote,
      items: updatedItems
    });
  };
  
  // Handle save quote
  const handleSaveQuote = () => {
    if (!newQuote.clientId || newQuote.items.length === 0 || !newQuote.validUntil) {
      alert('Por favor, selecciona un cliente, agrega al menos un producto y define la fecha de validez.');
      return;
    }
    
    const subtotal = calculateSubtotal(newQuote.items);
    const discount = calculateDiscount(newQuote.items);
    const tax = calculateTax(subtotal, discount);
    const total = subtotal - discount + tax;
    
    const quoteToSave = {
      ...newQuote,
      id: Date.now(), // Simple ID generation
      subtotal,
      discount,
      tax,
      total
    };
    
    onSave(quoteToSave);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">Nueva Cotización</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-500"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6">
          {/* Show client info if pre-selected */}
          {preSelectedClient && (
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
              <h4 className="text-sm font-medium text-blue-800 dark:text-blue-200 mb-2">
                Cotización para:
              </h4>
              <div className="text-sm text-blue-700 dark:text-blue-300">
                <p className="font-semibold">{preSelectedClient.name}</p>
                <p>{preSelectedClient.contact}</p>
                <p>{preSelectedClient.email}</p>
                <p>{preSelectedClient.phone}</p>
              </div>
            </div>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Cliente {preSelectedClient && <span className="text-blue-600 dark:text-blue-400">(Pre-seleccionado)</span>}
              </label>
              <select
                name="clientId"
                value={newQuote.clientId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                disabled={!!preSelectedClient}
              >
                <option value="">Seleccionar Cliente...</option>
                {clientsList.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name} ({client.contact})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Fecha de la Cotización
              </label>
              <input
                type="date"
                name="date"
                value={newQuote.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Válida Hasta
              </label>
              <input
                type="date"
                name="validUntil"
                value={newQuote.validUntil}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Notas de la Cotización (Opcional)
              </label>
              <textarea
                name="notes"
                value={newQuote.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                placeholder="Notas adicionales para la cotización..."
              />
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Productos de la Cotización</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Producto
                </label>
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                >
                  <option value="">Seleccionar Producto...</option>
                  {productsList.map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({formatCurrency(product.price)})
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={productQuantityToAdd}
                  onChange={(e) => setProductQuantityToAdd(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Descuento Unitario
                </label>
                <input
                  type="number"
                  value={productDiscountToAdd}
                  onChange={(e) => setProductDiscountToAdd(parseFloat(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            </div>
            
            <button
              onClick={handleAddProductToQuote}
              className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed"
              disabled={!selectedProductToAdd || productQuantityToAdd <= 0}
            >
              Agregar Producto
            </button>
            
            {newQuote.items.length > 0 && (
              <div className="mt-6 bg-blue-50 rounded-lg overflow-hidden">
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
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                        Acciones
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {newQuote.items.map((item, index) => {
                      const product = getProductDetails(item.productId);
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
                          <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                            <button 
                              onClick={() => handleRemoveProductFromQuote(index)}
                              className="text-red-600 hover:text-red-900"
                            >
                              Eliminar
                            </button>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div>
              <h4 className="text-lg font-medium text-blue-800">Resumen de la Cotización</h4>
              <p className="text-sm text-gray-500">Total: {formatCurrency(calculateTotal(newQuote.items))}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveQuote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                disabled={!newQuote.clientId || newQuote.items.length === 0 || !newQuote.validUntil}
              >
                Guardar Cotización
              </button>
            </div>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default QuotesAddModal;
