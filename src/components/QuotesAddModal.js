import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { useData } from '../hooks/useData';
import { calculateSubtotal, calculateDiscount, calculateTax, calculateTotal } from '../utils/helpers';
import { formatCurrency, formatDate } from '../utils/storage';
import { sendQuoteEmail, printQuote } from '../utils/emailPrint';

const QuotesAddModal = ({ isOpen, onClose, onSave, preSelectedClient = null }) => {
  const { data: clientsList, loading: clientsLoading } = useData('clients');
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: quotesList, loading: quotesLoading } = useData('quotes');
  
  const [newQuote, setNewQuote] = useState({
    client_id: '',
    clientName: '', // For custom client name
    clientEmail: '', // For custom client email
    clientPhone: '', // For custom client phone
    clientAddress: '', // For custom client address
    date: new Date().toISOString().split('T')[0],
    validUntil: '',
    status: 'pending',
    items: [],
    notes: '',
    google_maps_link: '' // Added google_maps_link field
  });
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [productQuantityToAdd, setProductQuantityToAdd] = useState(1);
  const [productDiscountToAdd, setProductDiscountToAdd] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [printing, setPrinting] = useState(false);
  const [isCustomClient, setIsCustomClient] = useState(false); // New state for custom client
  
  const loading = clientsLoading || productsLoading;
  
  useEffect(() => {
    // Auto-fill client if pre-selected
    if (preSelectedClient) {
      setNewQuote(prev => ({
        ...prev,
        client_id: preSelectedClient.id
      }));
    }
  }, [preSelectedClient]);
  
  // Generate next sequential quote number
  const generateNextQuoteNumber = () => {
    if (!quotesList || quotesList.length === 0) {
      return 'COT-001'; // First quote
    }
    
    // Extract numbers from existing quote numbers and find the highest
    const quoteNumbers = quotesList
      .map(quote => {
        if (!quote.quote_number) return 0;
        const match = quote.quote_number.match(/COT-(\d+)/);
        return match ? parseInt(match[1], 10) : 0;
      })
      .filter(num => num > 0);
    
    if (quoteNumbers.length === 0) {
      return 'COT-001'; // No valid quote numbers found
    }
    
    const nextNumber = Math.max(...quoteNumbers) + 1;
    return `COT-${nextNumber.toString().padStart(3, '0')}`;
  };
  
  // Get product details by ID
  const getProductDetails = (productId) => {
    // Support both string and integer comparison for ID matching
    const product = (productsList || []).find(p => {
      return p.id === productId || p.id === parseInt(productId) || p.id.toString() === productId.toString();
    });
    
    return product || null;
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
    // console.log('🔍 handleAddProductToQuote called', {
    //   selectedProductToAdd,
    //   productQuantityToAdd,
    //   productsList: productsList?.length,
    //   productsListSample: productsList?.slice(0, 2)?.map(p => ({ id: p.id, name: p.name }))
    // });
    
    if (!selectedProductToAdd || productQuantityToAdd <= 0) {

      return;
    }
    
    const product = getProductDetails(selectedProductToAdd);
    if (!product) {
      // console.log('❌ Product not found:', {
      //   selectedProductToAdd,
      //   typeof: typeof selectedProductToAdd,
      //   availableProducts: productsList?.map(p => ({ id: p.id, type: typeof p.id, name: p.name }))
      // });
      return;
    }
    

    
    const newItem = {
      productId: String(product.id), // Ensure consistent string format
      quantity: parseInt(productQuantityToAdd),
      price: product.price,
      discount: parseFloat(productDiscountToAdd) || 0
    };
    
    setNewQuote(prevQuote => {
      const updatedQuote = {
        ...prevQuote,
        items: [...prevQuote.items, newItem]
      };

      return updatedQuote;
    });
    
    // Reset product selection fields
    setSelectedProductToAdd('');
    setProductQuantityToAdd(1);
    setProductDiscountToAdd(0);
  };
  
  // Handle remove product from quote
  const handleRemoveProductFromQuote = (index) => {
    const updatedItems = newQuote.items.filter((_, i) => i !== index);
    setNewQuote(prevQuote => ({
      ...prevQuote,
      items: updatedItems
    }));
  };
  
  // Handle save quote
  const handleSaveQuote = async () => {
    const hasValidClient = isCustomClient ? 
      (newQuote.clientName && newQuote.clientEmail) : 
      newQuote.client_id;
      
    if (!hasValidClient || newQuote.items.length === 0 || !newQuote.validUntil) {
      alert('Por favor, completa todos los campos obligatorios antes de guardar.');
      return;
    }
    
    setSaving(true);
    try {
      const quoteData = {
        client_id: newQuote.client_id,
        date: newQuote.date,
        valid_until: newQuote.validUntil, // Convert camelCase to snake_case
        status: newQuote.status,
        notes: newQuote.notes,
        google_maps_link: newQuote.google_maps_link,
        // Note: clientName, clientEmail, clientPhone, clientAddress are not saved to quotes table
        // They are only used for display and email/print functionality for custom clients
        // The items will be saved separately to quote_items table
        items: newQuote.items // Include items for processing
      };

      await onSave(quoteData);
      alert('Cotización guardada exitosamente.');
      onClose();
    } catch (error) {
      console.error('Error al guardar la cotización:', error);
      alert('Error al guardar la cotización: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Get client details by ID or custom client info
  const getClientDetails = (clientId) => {
    if (isCustomClient) {
      return {
        name: newQuote.clientName,
        email: newQuote.clientEmail,
        phone: newQuote.clientPhone,
        address: newQuote.clientAddress
      };
    }
    // Support both string and integer comparison for ID matching
    return (clientsList || []).find(c => {
      return c.id === clientId || c.id === parseInt(clientId) || c.id.toString() === clientId.toString();
    }) || null;
  };
  
  // Handle email quote
  const handleEmailQuote = async () => {
    const hasValidClient = isCustomClient ? 
      (newQuote.clientName && newQuote.clientEmail) : 
      newQuote.client_id;
      
    if (!hasValidClient || newQuote.items.length === 0) {
      alert('Por favor, completa la información del cliente y agrega productos antes de enviar por email.');
      return;
    }
    
    const client = getClientDetails(newQuote.client_id);
    if (!client?.email) {
      alert('No se encontró email del cliente.');
      return;
    }
    
    setSendingEmail(true);
    try {
      const quoteData = {
        quote_number: generateNextQuoteNumber(),
        date: newQuote.date,
        valid_until: newQuote.validUntil,
        total: calculateTotal(newQuote.items),
        notes: newQuote.notes
      };
      
      const result = await sendQuoteEmail(quoteData, client, newQuote.items);
      if (result.success) {
        alert('✅ Email enviado exitosamente');
      } else {
        alert('❌ Error al enviar email: ' + result.message);
      }
    } catch (error) {
      console.error('❌ Error sending email:', error);
      alert('Error al enviar email: ' + error.message);
    } finally {
      setSendingEmail(false);
    }
  };
  
  // Handle print quote
  const handlePrintQuote = () => {
    const hasValidClient = isCustomClient ? 
      (newQuote.clientName) : 
      newQuote.client_id;
      
    if (!hasValidClient || newQuote.items.length === 0) {
      alert('Por favor, completa la información del cliente y agrega productos antes de imprimir.');
      return;
    }
    
    setPrinting(true);
    try {
      const client = getClientDetails(newQuote.client_id);
      const quoteData = {
        quote_number: generateNextQuoteNumber(),
        date: newQuote.date,
        valid_until: newQuote.validUntil,
        total: calculateTotal(newQuote.items),
        notes: newQuote.notes
      };
      
      printQuote(quoteData, client, newQuote.items);
    } catch (error) {
      console.error('❌ Error printing quote:', error);
      alert('Error al imprimir: ' + error.message);
    } finally {
      setTimeout(() => setPrinting(false), 1000); // Reset after print dialog
    }
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
        
        {loading ? (
          <div className="p-6">
            <div className="flex items-center justify-center h-32">
              <div className="text-center">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto mb-2"></div>
                <p className="text-blue-600 text-sm">Cargando datos...</p>
              </div>
            </div>
          </div>
        ) : (
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
                Tipo de Cliente
              </label>
              <div className="flex space-x-4 mb-2">
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="clientType"
                    value="existing"
                    checked={!isCustomClient}
                    onChange={() => setIsCustomClient(false)}
                    className="mr-2 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  Cliente Existente
                </label>
                <label className="flex items-center text-gray-700 dark:text-gray-300">
                  <input
                    type="radio"
                    name="clientType"
                    value="custom"
                    checked={isCustomClient}
                    onChange={() => setIsCustomClient(true)}
                    className="mr-2 text-blue-600 focus:ring-blue-500 focus:ring-2"
                  />
                  Cliente Nuevo
                </label>
              </div>
              
              {!isCustomClient ? (
                <select
                  name="client_id"
                  value={newQuote.client_id}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  disabled={!!preSelectedClient}
                >
                  <option value="">Seleccionar Cliente...</option>
                  {(clientsList || []).map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.contact})
                    </option>
                  ))}
                </select>
              ) : (
                <input
                  type="text"
                  name="clientName"
                  value={newQuote.clientName}
                  onChange={handleInputChange}
                  placeholder="Nombre del cliente"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              )}
            </div>
            
            {isCustomClient && (
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Email del Cliente
                </label>
                <input
                  type="email"
                  name="clientEmail"
                  value={newQuote.clientEmail}
                  onChange={handleInputChange}
                  placeholder="email@ejemplo.com"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                />
              </div>
            )}
            
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
            
            {isCustomClient && (
              <>
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono del Cliente
                  </label>
                  <input
                    type="tel"
                    name="clientPhone"
                    value={newQuote.clientPhone}
                    onChange={handleInputChange}
                    placeholder="Teléfono"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección del Cliente
                  </label>
                  <input
                    type="text"
                    name="clientAddress"
                    value={newQuote.clientAddress}
                    onChange={handleInputChange}
                    placeholder="Dirección"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500 bg-white dark:bg-gray-700 border border-gray-300 dark:border-gray-600 text-gray-900 dark:text-gray-100"
                  />
                </div>
              </>
            )}
            
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Google Maps Link
              </label>
              <input
                type="url"
                name="google_maps_link"
                value={newQuote.google_maps_link}
                onChange={handleInputChange}
                placeholder="https://maps.google.com/..."
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
                  {(productsList || []).map(product => (
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
              type="button"
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
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              
              {/* Email Button */}
              <button
                type="button"
                onClick={handleEmailQuote}
                disabled={
                  newQuote.items.length === 0 || 
                  sendingEmail ||
                  (isCustomClient ? (!newQuote.clientName || !newQuote.clientEmail) : !newQuote.client_id)
                }
                className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {sendingEmail ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Enviando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 4.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                    </svg>
                    <span>Email</span>
                  </>
                )}
              </button>
              
              {/* Print Button */}
              <button
                type="button"
                onClick={handlePrintQuote}
                disabled={
                  newQuote.items.length === 0 || 
                  printing ||
                  (isCustomClient ? !newQuote.clientName : !newQuote.client_id)
                }
                className="px-4 py-2 bg-purple-600 text-white rounded-md hover:bg-purple-700 focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 disabled:bg-purple-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {printing ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Imprimiendo...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m-1 4h6a2 2 0 002-2v-4a2 2 0 00-2-2H9a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Imprimir</span>
                  </>
                )}
              </button>
              
              {/* Save Button */}
              <button
                type="button"
                onClick={handleSaveQuote}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center space-x-2"
                disabled={
                  newQuote.items.length === 0 || 
                  !newQuote.validUntil || 
                  saving ||
                  (isCustomClient ? (!newQuote.clientName || !newQuote.clientEmail) : !newQuote.client_id)
                }
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Guardando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Guardar Cotización</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
        )}
      </VenetianTile>
    </div>
  );
};

export default QuotesAddModal;
