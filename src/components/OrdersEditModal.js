import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { useData } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { calculateSubtotal, calculateDiscount, calculateTax, calculateTotal } from '../utils/helpers';

const OrdersEditModal = ({ isOpen, onClose, onSave, editingOrder = null }) => {
  const { data: clientsList, loading: clientsLoading } = useData('clients');
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: inventoryList, loading: inventoryLoading } = useData('inventory');
  
  const [orderData, setOrderData] = useState({
    clientId: '',
    date: '',
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
  
  const [isDelivery, setIsDelivery] = useState(false);
  const [saving, setSaving] = useState(false);
  
  const loading = clientsLoading || productsLoading || inventoryLoading;

  // Load order data when modal opens
  useEffect(() => {
    if (editingOrder && isOpen) {

      
      const loadedData = {
        clientId: editingOrder.clientId || editingOrder.client_id || '',
        date: editingOrder.date || '',
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
      
      setOrderData(loadedData);
      setIsDelivery(!!(loadedData.delivery.date));
    }
  }, [editingOrder, isOpen]);

  // Get client details by ID
  const getClientDetails = (clientId) => {
    const client = (clientsList || []).find(c => 
      c.id === clientId || 
      c.id === parseInt(clientId) || 
      c.id.toString() === clientId.toString()
    );
    return client || null;
  };

  // Get product details by ID
  const getProductDetails = (productId) => {
    const product = (productsList || []).find(p => 
      p.id === productId || 
      p.id === parseInt(productId) || 
      p.id.toString() === productId.toString()
    );
    return product || null;
  };

  // Handle input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    if (name.startsWith('delivery.')) {
      const deliveryField = name.split('.')[1];
      setOrderData(prev => ({
        ...prev,
        delivery: {
          ...prev.delivery,
          [deliveryField]: value
        }
      }));
    } else {
      setOrderData(prev => ({
        ...prev,
        [name]: value
      }));
    }
  };

  // Handle save
  const handleSave = async (e) => {
    e.preventDefault();
    setSaving(true);
    try {
      const subtotal = calculateSubtotal(orderData.items);
      const discount = calculateDiscount(orderData.items);
      const tax = calculateTax(subtotal, discount);
      const total = subtotal - discount + tax;

      const updatedOrder = {
        client_id: orderData.clientId,
        date: orderData.date,
        status: orderData.status,
        payment_status: orderData.paymentStatus,
        payment_method: orderData.paymentMethod,
        subtotal: parseFloat(subtotal.toFixed(2)),
        discount: parseFloat(discount.toFixed(2)),
        tax: parseFloat(tax.toFixed(2)),
        total: parseFloat(total.toFixed(2)),
        notes: orderData.notes,
        delivery_date: isDelivery ? orderData.delivery.date : null,
        delivery_time: isDelivery ? orderData.delivery.time : null,
        delivery_address: isDelivery ? orderData.delivery.address : null,
        delivery_google_maps_link: isDelivery ? orderData.delivery.googleMapsLink : null,
        items: orderData.items
      };

      // Filter out virtual/computed fields that don't exist in database
      // Removed: id (redundant for updates), orderNumber (virtual field)

      await onSave(updatedOrder);
    } catch (error) {
      console.error('❌ Error saving order:', error);
      alert('Error al actualizar el pedido: ' + error.message);
    } finally {
      setSaving(false);
    }
  };

  if (!isOpen) return null;

  const client = getClientDetails(orderData.clientId);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">
              Editar Pedido {editingOrder?.orderNumber || editingOrder?.order_number}
            </h3>
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
            {/* Order Info */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cliente
                </label>
                <select
                  name="clientId"
                  value={orderData.clientId}
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
                  value={orderData.date}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado del Pedido
                </label>
                <select
                  name="status"
                  value={orderData.status}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="processing">En Proceso</option>
                  <option value="shipped">Enviado</option>
                  <option value="delivered">Entregado</option>
                  <option value="completed">Completado</option>
                  <option value="cancelled">Cancelado</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Estado de Pago
                </label>
                <select
                  name="paymentStatus"
                  value={orderData.paymentStatus}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="pending">Pendiente</option>
                  <option value="partial">Parcial</option>
                  <option value="paid">Pagado</option>
                  <option value="refunded">Reembolsado</option>
                </select>
              </div>

              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notas del Pedido
                </label>
                <textarea
                  name="notes"
                  value={orderData.notes}
                  onChange={handleInputChange}
                  rows="2"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>

            {/* Products in Order */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-blue-800 mb-4">Productos del Pedido</h4>
              
              {orderData.items && orderData.items.length > 0 ? (
                <div className="bg-blue-50 rounded-lg overflow-hidden">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Producto
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Cantidad
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Precio Unitario
                        </th>
                        <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Descuento
                        </th>
                        <th className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Subtotal
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {orderData.items.map((item, index) => {
                        const product = getProductDetails(item.productId || item.product_id);
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
                              <div className="text-sm text-gray-900">{formatCurrency(item.price || product?.price || 0)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap">
                              <div className="text-sm text-gray-900">{formatCurrency(item.discount || 0)}</div>
                            </td>
                            <td className="px-6 py-4 whitespace-nowrap text-right">
                              <div className="text-sm font-medium text-gray-900">
                                {formatCurrency(((item.price || product?.price || 0) * item.quantity) - (item.discount || 0))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              ) : (
                <div className="text-center py-8 text-gray-500">
                  No hay productos en este pedido
                </div>
              )}
            </div>

            {/* Delivery Information */}
            <div className="mb-6">
              <div className="flex items-center mb-4">
                <input
                  type="checkbox"
                  id="hasDelivery"
                  checked={isDelivery}
                  onChange={(e) => setIsDelivery(e.target.checked)}
                  className="focus:ring-blue-500 h-4 w-4 text-blue-600 border-gray-300 rounded"
                />
                <label htmlFor="hasDelivery" className="ml-2 block text-sm font-medium text-gray-700">
                  Entrega a Domicilio
                </label>
              </div>

              {isDelivery && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Fecha de Entrega
                    </label>
                    <input
                      type="date"
                      name="delivery.date"
                      value={orderData.delivery.date}
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
                      value={orderData.delivery.time}
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
                      value={orderData.delivery.address}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Order Summary */}
            {orderData.items && orderData.items.length > 0 && (
              <div className="mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
                <h4 className="text-lg font-semibold text-blue-800 mb-3">Resumen del Pedido</h4>
                
                <div className="space-y-2">
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">Subtotal:</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(calculateSubtotal(orderData.items))}
                    </span>
                  </div>
                  
                  {calculateDiscount(orderData.items) > 0 && (
                    <div className="flex justify-between text-sm">
                      <span className="text-gray-600">Descuento:</span>
                      <span className="font-medium text-red-600">
                        -{formatCurrency(calculateDiscount(orderData.items))}
                      </span>
                    </div>
                  )}
                  
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-600">IVA (16%):</span>
                    <span className="font-medium text-gray-900">
                      {formatCurrency(calculateTax(calculateSubtotal(orderData.items), calculateDiscount(orderData.items)))}
                    </span>
                  </div>
                  
                  <div className="flex justify-between text-lg font-bold border-t pt-2 border-gray-200">
                    <span className="text-blue-800">Total:</span>
                    <span className="text-blue-800">
                      {formatCurrency(calculateTotal(orderData.items))}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center mt-6">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Cancelar
              </button>
              
              <button
                type="button"
                onClick={handleSave}
                disabled={saving}
                className="px-6 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {saving ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    <span>Actualizando...</span>
                  </>
                ) : (
                  <>
                    <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-3m-1 4l-3 3m0 0l-3-3m3 3V4" />
                    </svg>
                    <span>Actualizar Pedido</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}
      </VenetianTile>
    </div>
  );
};

export default OrdersEditModal;
