import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { clients } from '../mock/clients';
import { products } from '../mock/products';
import { inventory } from '../mock/inventory';
import { formatCurrency } from '../utils/storage';
import { calculateSubtotal, calculateDiscount, calculateTax, calculateTotal } from '../utils/helpers';

const OrdersAddModal = ({ isOpen, onClose, onSave }) => {
  const [clientsList, setClientsList] = useState([]);
  const [productsList, setProductsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
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
  const [isDelivery, setIsDelivery] = useState(false);
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setClientsList(clients);
    setProductsList(products);
    setInventoryList(inventory);
  }, []);
  
  // Get product details by ID
  const getProductDetails = (productId) => {
    return productsList.find(p => p.id === parseInt(productId));
  };
  
  // Get client details by ID
  const getClientDetails = (clientId) => {
    return clientsList.find(c => c.id === parseInt(clientId));
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
    
    setNewOrder({
      ...newOrder,
      items: [...newOrder.items, newItem]
    });
    
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
  const handleSaveOrder = () => {
    if (!newOrder.clientId || newOrder.items.length === 0) {
      alert('Por favor, selecciona un cliente y agrega al menos un producto.');
      return;
    }
    
    const subtotal = calculateSubtotal(newOrder.items);
    const discount = calculateDiscount(newOrder.items);
    const tax = calculateTax(subtotal, discount);
    const total = subtotal - discount + tax;
    
    const orderToSave = {
      ...newOrder,
      subtotal,
      discount,
      tax,
      total,
      amountPaid: 0, // Assuming 0 initially for new orders
      balance: total,
      delivery: isDelivery ? newOrder.delivery : null
    };
    
    onSave(orderToSave);
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
  
  const availableProducts = productsList.filter(product => {
    // Check if product exists in inventory with quantity > 0
    const inventoryItem = inventoryList.find(item => item.productId === product.id);
    return inventoryItem && inventoryItem.quantity > 0;
  });

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">Nuevo Pedido</h3>
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
                {clientsList.map(client => (
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
                  {availableProducts.map(product => (
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
                    {newOrder.items.map((item, index) => {
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
          
          <div className="flex justify-between items-center mt-6">
            <div>
              <h4 className="text-lg font-medium text-blue-800">Resumen del Pedido</h4>
              <p className="text-sm text-gray-500">Total: {formatCurrency(calculateTotal(newOrder.items))}</p>
            </div>
            
            <div className="flex space-x-3">
              <button
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              
              <button
                onClick={handleSaveOrder}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
                disabled={!newOrder.clientId || newOrder.items.length === 0}
              >
                Guardar Pedido
              </button>
            </div>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default OrdersAddModal;
