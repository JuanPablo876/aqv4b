import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { useData } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { sendOrderEmail, printOrder } from '../utils/emailPrint';
import { calculateSubtotal, calculateDiscount, calculateTax, calculateTotal } from '../utils/helpers';

const OrdersAddModal = ({ isOpen, onClose, onSave, preSelectedClient = null, editingOrder = null }) => {
  const { data: clientsList, loading: clientsLoading } = useData('clients');
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: inventoryList, loading: inventoryLoading } = useData('inventory');
  const { data: ordersList, loading: ordersLoading } = useData('orders');
  
  const [newOrder, setNewOrder] = useState({
    clientId: '',
    date: new Date().toISOString().split('T')[0],
    status: 'pending',
    paymentStatus: 'pending',
    paymentMethod: '',
    items: [],
    notes: '',
    delivery: {
      date: '',
      time: '',
      address: '',
      googleMapsLink: ''
    }
  });
  const [selectedProductToAdd, setSelectedProductToAdd] = useState('');
  const [productQuantityToAdd, setProductQuantityToAdd] = useState(1);
  const [productDiscountToAdd, setProductDiscountToAdd] = useState(0);
  const [saving, setSaving] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [printing, setPrinting] = useState(false);
  
  const loading = clientsLoading || productsLoading || inventoryLoading || ordersLoading;
  const [isDelivery, setIsDelivery] = useState(false);
  
  useEffect(() => {
    // Reset form when modal closes or when switching between add/edit modes
    if (!isOpen) {
      setNewOrder({
        clientId: '',
        date: new Date().toISOString().split('T')[0],
        status: 'pending',
        paymentStatus: 'pending',
        paymentMethod: '',
        items: [],
        notes: '',
        delivery: {
          date: '',
          time: '',
          address: '',
          googleMapsLink: ''
        }
      });
      setIsDelivery(false);
    }
  }, [isOpen]);

  useEffect(() => {
    // Auto-fill client if pre-selected
    if (preSelectedClient && !editingOrder) {
      setNewOrder(prev => ({
        ...prev,
        clientId: preSelectedClient.id
      }));
    }
    
    // Auto-fill order data if editing
    if (editingOrder && isOpen) {
      console.log('📝 Loading order for edit:', editingOrder); // Debug log
      
      const orderData = {
        clientId: editingOrder.clientId || editingOrder.client_id || '',
        date: editingOrder.date || new Date().toISOString().split('T')[0],
        status: editingOrder.status || 'pending',
        paymentStatus: editingOrder.paymentStatus || editingOrder.payment_status || 'pending',
        paymentMethod: editingOrder.paymentMethod || editingOrder.payment_method || '',
        items: editingOrder.items || [],
        notes: editingOrder.notes || '',
        delivery: {
          date: editingOrder.delivery?.date || editingOrder.delivery_date || '',
          time: editingOrder.delivery?.time || editingOrder.delivery_time || '',
          address: editingOrder.delivery?.address || editingOrder.delivery_address || '',
          googleMapsLink: editingOrder.delivery?.googleMapsLink || editingOrder.delivery_google_maps_link || ''
        }
      };
      
      console.log('📝 Setting order data:', orderData); // Debug log
      setNewOrder(orderData);
      setIsDelivery(!!(orderData.delivery.date));
    }
  }, [preSelectedClient, editingOrder, isOpen]);
  
  // Generate next sequential order number based on current date
  const generateNextOrderNumber = () => {
    const today = new Date();
    const day = today.getDate().toString().padStart(2, '0');
    const month = (today.getMonth() + 1).toString().padStart(2, '0');
    const year = today.getFullYear();
    const dateStr = `${day}${month}${year}`; // DDMMYYYY format
    
    // Count orders created today
    const todayOrders = (ordersList || []).filter(order => {
      const orderDate = new Date(order.date);
      return orderDate.toDateString() === today.toDateString();
    });
    
    const nextNumber = todayOrders.length + 1;
    return `AQV-${dateStr}${nextNumber}`;
  };

  // Get product details by ID
  const getProductDetails = (productId) => {
    // Support both string and integer comparison for ID matching
    const product = (productsList || []).find(p => {
      return p.id === productId || p.id === parseInt(productId) || p.id.toString() === productId.toString();
    });
    
    return product || null;
  };
  
  // Get client details by ID
  const getClientDetails = (clientId) => {
    // Support both string and integer comparison for ID matching
    const client = (clientsList || []).find(c => {
      return c.id === clientId || c.id === parseInt(clientId) || c.id.toString() === clientId.toString();
    });
    
    return client || null;
  };
  
  // Handle input change for new order
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('delivery.')) {
      const deliveryField = name.split('.')[1];
      setNewOrder({
        ...newOrder,
        delivery: {
          ...newOrder.delivery,
          [deliveryField]: value
        }
      });
    } else {
      setNewOrder({
        ...newOrder,
        [name]: value
      });
    }
  };
  
  // Handle add product to order
  const handleAddProductToOrder = () => {
    if (!selectedProductToAdd || productQuantityToAdd <= 0) return;
    
    const product = getProductDetails(selectedProductToAdd);
    if (!product) return;
    
    const newItem = {
      productId: product.id,
      quantity: parseInt(productQuantityToAdd),
      price: product.price,
      discount: parseFloat(productDiscountToAdd) || 0
    };
    
    const updatedItems = [...newOrder.items, newItem];
    
    setNewOrder(prevOrder => ({
      ...prevOrder,
      items: updatedItems
    }));
    
    // Reset product selection fields
    setSelectedProductToAdd('');
    setProductQuantityToAdd(1);
    setProductDiscountToAdd(0);
  };
  
  // Handle remove product from order
  const handleRemoveProductFromOrder = (index) => {
    const updatedItems = newOrder.items.filter((_, i) => i !== index);
    setNewOrder({
      ...newOrder,
      items: updatedItems
    });
  };
  
  // Handle save order
  const handleSaveOrder = async () => {
    if (!newOrder.clientId || newOrder.items.length === 0) {
      alert('Por favor, selecciona un cliente y agrega al menos un producto.');
      return;
    }
    
    setSaving(true);
    try {
      const subtotal = calculateSubtotal(newOrder.items);
      const discount = calculateDiscount(newOrder.items);
      const tax = calculateTax(subtotal, discount);
      const total = subtotal - discount + tax;
      
      // Generate order number only for new orders
      const orderNumber = editingOrder ? 
        (editingOrder.orderNumber || editingOrder.order_number) : 
        generateNextOrderNumber();
      
      // For display purposes, we'll let the table handle the numbering
      // But we'll still generate a unique ID for database reference
      const orderToSave = {
        ...(editingOrder ? { id: editingOrder.id } : {}), // Keep existing ID for edits
        order_number: editingOrder ? (editingOrder.order_number || `AQV-2024-${editingOrder.id}`) : generateNextOrderNumber(),
        client_id: newOrder.clientId,
        date: newOrder.date,
        status: newOrder.status,
        payment_status: newOrder.paymentStatus,
        payment_method: newOrder.paymentMethod || null,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        amount_paid: 0,
        notes: newOrder.notes || null,
        delivery_date: isDelivery && newOrder.delivery.date ? newOrder.delivery.date : null,
        delivery_time: isDelivery && newOrder.delivery.time ? newOrder.delivery.time : null,
        delivery_address: isDelivery && newOrder.delivery.address ? newOrder.delivery.address : null,
        delivery_google_maps_link: isDelivery && newOrder.delivery.googleMapsLink ? newOrder.delivery.googleMapsLink : null,
        priority: 'normal',
        urgent_order: false,
        installation_required: false,
        items: newOrder.items // Include items in the order
      };
      
      // Update inventory for new orders only
      if (!editingOrder) {
        // Reduce inventory quantities for ordered items
        for (const item of newOrder.items) {
          const inventoryItem = inventoryList.find(inv => 
            inv.product_id === item.productId || 
            inv.product_id === parseInt(item.productId)
          );
          
          if (inventoryItem) {
            const newQuantity = Math.max(0, inventoryItem.quantity - item.quantity);
            console.log(`📦 Actualizando inventario: ${inventoryItem.product_name} ${inventoryItem.quantity} → ${newQuantity}`);
            // In a real app, you would update the inventory via API
            // await updateInventory(inventoryItem.id, { quantity: newQuantity });
          }
        }
      }
      
      await onSave(orderToSave);
    } catch (error) {
      console.error('❌ Error saving order:', error);
      alert('Error al guardar el pedido: ' + error.message);
    } finally {
      setSaving(false);
    }
  };
  
  // Handle email order
  const handleEmailOrder = async () => {
    
    if (!newOrder.clientId || newOrder.items.length === 0) {
      alert('Por favor, guarda el pedido primero antes de enviarlo por email.');
      return;
    }
    
    const client = getClientDetails(newOrder.clientId);
    if (!client?.email) {
      alert('El cliente seleccionado no tiene email registrado.');
      return;
    }
    
    setSendingEmail(true);
    try {
      const orderData = {
        order_number: generateNextOrderNumber(),
        date: newOrder.date,
        total: calculateTotal(newOrder.items),
        notes: newOrder.notes
      };
      
      const result = await sendOrderEmail(orderData, client, newOrder.items);
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
  
  // Handle print order
  const handlePrintOrder = () => {
    if (!newOrder.clientId || newOrder.items.length === 0) {
      alert('Por favor, selecciona un cliente y agrega productos antes de imprimir.');
      return;
    }
    
    setPrinting(true);
    try {
      const client = getClientDetails(newOrder.clientId);
      const orderData = {
        order_number: generateNextOrderNumber(),
        date: newOrder.date,
        total: calculateTotal(newOrder.items),
        notes: newOrder.notes,
        status: newOrder.status
      };
      
      printOrder(orderData, client, newOrder.items);
    } catch (error) {
      console.error('❌ Error printing order:', error);
      alert('Error al imprimir: ' + error.message);
    } finally {
      setTimeout(() => setPrinting(false), 1000); // Reset after print dialog
    }
    onClose();
  };
  
  // Update delivery address and link when client is selected
  useEffect(() => {
    if (newOrder.clientId) {
      const client = getClientDetails(newOrder.clientId);
      if (client) {
        setNewOrder(prevOrder => ({
          ...prevOrder,
          delivery: {
            ...prevOrder.delivery,
            address: client.address || '',
            googleMapsLink: client.googleMapsLink || ''
          }
        }));
      }
    } else {
       setNewOrder(prevOrder => ({
          ...prevOrder,
          delivery: {
            ...prevOrder.delivery,
            address: '',
            googleMapsLink: ''
          }
        }));
    }
  }, [newOrder.clientId, clientsList]);
  
  if (!isOpen) return null;
  
  const availableProducts = (productsList || []).filter(product => {
    // Check if product exists in inventory with quantity > 0
    const inventoryItem = (inventoryList || []).find(item => {
      return item.product_id === product.id || 
             item.product_id === parseInt(product.id) || 
             item.product_id.toString() === product.id.toString();
    });
    
    return inventoryItem && inventoryItem.quantity > 0;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">{editingOrder ? 'Editar Pedido' : 'Nuevo Pedido'}</h3>
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
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  name="clientId"
                  value={newOrder.clientId}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar Cliente...</option>
                  {(clientsList || []).map(client => (
                    <option key={client.id} value={client.id}>
                      {client.name} ({client.contact})
                    </option>
                  ))}
                </select>
              </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha del Pedido
              </label>
              <input
                type="date"
                name="date"
                value={newOrder.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas del Pedido (Opcional)
              </label>
              <textarea
                name="notes"
                value={newOrder.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-blue-800 mb-4">Productos del Pedido</h4>
            
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-4">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Producto
                </label>
                <select
                  value={selectedProductToAdd}
                  onChange={(e) => setSelectedProductToAdd(e.target.value)}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Seleccionar Producto...</option>
                  {(availableProducts || []).map(product => (
                    <option key={product.id} value={product.id}>
                      {product.name} ({product.stock} en stock)
                    </option>
                  ))}
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cantidad
                </label>
                <input
                  type="number"
                  value={productQuantityToAdd}
                  onChange={(e) => setProductQuantityToAdd(parseInt(e.target.value) || 0)}
                  min="1"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Descuento Unitario
                </label>
                <input
                  type="number"
                  value={productDiscountToAdd}
                  onChange={(e) => setProductDiscountToAdd(parseFloat(e.target.value) || 0)}
                  min="0"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <button
              onClick={handleAddProductToOrder}
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
              disabled={!selectedProductToAdd || productQuantityToAdd <= 0}
            >
              Agregar Producto
            </button>
            
            {newOrder.items.length > 0 && (
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
                    {(newOrder.items || []).map((item, index) => {
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
                              onClick={() => handleRemoveProductFromOrder(index)}
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
          
          <div className="mb-6">
            <h4 className="text-lg font-medium text-blue-800 mb-4">Tipo de Entrega</h4>
            <div className="flex items-center space-x-4">
              <div className="flex items-center">
                <input
                  type="radio"
                  id="deliveryTypeMostrador"
                  name="deliveryType"
                  value="mostrador"
                  checked={!isDelivery}
                  onChange={() => setIsDelivery(false)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="deliveryTypeMostrador" className="ml-2 block text-sm font-medium text-gray-700">
                  Venta en Mostrador
                </label>
              </div>
              <div className="flex items-center">
                <input
                  type="radio"
                  id="deliveryTypeDelivery"
                  name="deliveryType"
                  value="delivery"
                  checked={isDelivery}
                  onChange={() => setIsDelivery(true)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300"
                />
                <label htmlFor="deliveryTypeDelivery" className="ml-2 block text-sm font-medium text-gray-700">
                  Entrega a Domicilio
                </label>
              </div>
            </div>
          </div>
          
          {isDelivery && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Fecha de Entrega
                </label>
                <input
                  type="date"
                  name="delivery.date"
                  value={newOrder.delivery.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Horario de Entrega
                </label>
                <input
                  type="text"
                  name="delivery.time"
                  value={newOrder.delivery.time}
                  onChange={handleInputChange}
                  placeholder="Ej: 10:00 - 12:00"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección de Entrega
                </label>
                <input
                  type="text"
                  name="delivery.address"
                  value={newOrder.delivery.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
                {newOrder.clientId && getClientDetails(newOrder.clientId)?.googleMapsLink && (
                   <a 
                    href={getClientDetails(newOrder.clientId).googleMapsLink} 
                    target="_blank" 
                    rel="noopener noreferrer" 
                    className="text-blue-600 hover:underline text-sm mt-1 block"
                  >
                    Ver dirección del cliente en Google Maps
                  </a>
                )}
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Enlace Google Maps de Entrega (Opcional)
                </label>
                <input
                  type="text"
                  name="delivery.googleMapsLink"
                  value={newOrder.delivery.googleMapsLink}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          )}
          
          {/* Order Summary */}
          <div className="mt-6 p-4 bg-blue-50 dark:bg-gray-700 rounded-lg border border-blue-200 dark:border-gray-600">
            <h4 className="text-lg font-semibold text-blue-800 dark:text-blue-200 mb-3">Resumen del Pedido</h4>
            
            <div className="space-y-2">
              {/* Subtotal */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">Subtotal:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(calculateSubtotal(newOrder.items))}
                </span>
              </div>
              
              {/* Discount */}
              {calculateDiscount(newOrder.items) > 0 && (
                <div className="flex justify-between text-sm">
                  <span className="text-gray-600 dark:text-gray-400">Descuento:</span>
                  <span className="font-medium text-red-600 dark:text-red-400">
                    -{formatCurrency(calculateDiscount(newOrder.items))}
                  </span>
                </div>
              )}
              
              {/* Tax */}
              <div className="flex justify-between text-sm">
                <span className="text-gray-600 dark:text-gray-400">IVA (16%):</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatCurrency(calculateTax(calculateSubtotal(newOrder.items), calculateDiscount(newOrder.items)))}
                </span>
              </div>
              
              {/* Total */}
              <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-200 dark:border-gray-600">
                <span className="text-blue-800 dark:text-blue-200">Total:</span>
                <span className="text-blue-800 dark:text-blue-200">
                  {formatCurrency(calculateTotal(newOrder.items))}
                </span>
              </div>
              
              {/* Items count */}
              <div className="text-xs text-gray-500 dark:text-gray-400 text-center mt-2">
                {newOrder.items.length} {newOrder.items.length === 1 ? 'producto' : 'productos'}
              </div>
            </div>
          </div>
          
          <div className="flex justify-between items-center mt-6">
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
            </div>
            
            <div className="flex space-x-3">
              {/* Email Button */}
              <button
                onClick={handleEmailOrder}
                disabled={!newOrder.clientId || newOrder.items.length === 0 || sendingEmail}
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
                    <span>Enviar Email</span>
                  </>
                )}
              </button>
              
              {/* Print Button */}
              <button
                onClick={handlePrintOrder}
                disabled={!newOrder.clientId || newOrder.items.length === 0 || printing}
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
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 17h2a2 2 0 002-2v-4a2 2 0 00-2-2H5a2 2 0 00-2 2v4a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-4a2 2 0 00-2 2v4a2 2 0 002 2zm8-12V5a2 2 0 00-2-2H9a2 2 0 00-2 2v4h10z" />
                    </svg>
                    <span>Imprimir</span>
                  </>
                )}
              </button>
              
              {/* Save Button */}
              <button
                onClick={handleSaveOrder}
                disabled={!newOrder.clientId || newOrder.items.length === 0 || saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center space-x-2"
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
                    <span>{editingOrder ? 'Actualizar Pedido' : 'Guardar Pedido'}</span>
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

export default OrdersAddModal;