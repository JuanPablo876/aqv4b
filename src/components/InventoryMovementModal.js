import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { products } from '../mock/products';
import { inventory } from '../mock/inventory';

const InventoryMovementModal = ({ isOpen, onClose, onSave }) => {
  const [productsList, setProductsList] = useState([]);
  const [inventoryList, setInventoryList] = useState([]);
  const [newMovement, setNewMovement] = useState({
    productId: '',
    location: '',
    type: 'entry', // 'entry' or 'exit'
    quantity: '',
    date: new Date().toISOString().split('T')[0],
    notes: ''
  });
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setProductsList(products);
    setInventoryList(inventory);
  }, []);
  
  // Get unique locations for dropdown
  const locations = [...new Set(inventoryList.map(item => item.location))];
  
  // Handle input change for new movement
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewMovement({
      ...newMovement,
      [name]: value
    });
  };
  
  // Handle save new movement
  const handleSaveMovement = () => {
    if (!newMovement.productId || !newMovement.location || !newMovement.quantity || newMovement.quantity <= 0) {
      alert('Por favor, completa los campos obligatorios (Producto, Ubicación, Cantidad).');
      return;
    }
    
    const movementToSave = {
      ...newMovement,
      id: Date.now(), // Simple ID generation
      productId: parseInt(newMovement.productId),
      quantity: parseInt(newMovement.quantity)
    };
    
    onSave(movementToSave);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-md w-full max-h-[90vh] overflow-y-auto">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">Nuevo Movimiento de Inventario</h3>
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
          <div className="grid grid-cols-1 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Producto
              </label>
              <select
                name="productId"
                value={newMovement.productId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar Producto...</option>
                {productsList.map(product => (
                  <option key={product.id} value={product.id}>
                    {product.name} ({product.sku})
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Ubicación
              </label>
              <select
                name="location"
                value={newMovement.location}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar Ubicación...</option>
                {locations.map(location => (
                  <option key={location} value={location}>
                    {location}
                  </option>
                ))}
                <option value="Nueva Ubicación">Nueva Ubicación</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Tipo de Movimiento
              </label>
              <select
                name="type"
                value={newMovement.type}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="entry">Entrada</option>
                <option value="exit">Salida</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Cantidad
              </label>
              <input
                type="number"
                name="quantity"
                value={newMovement.quantity}
                onChange={handleInputChange}
                min="1"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={newMovement.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                name="notes"
                value={newMovement.notes}
                onChange={handleInputChange}
                rows="2"
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              ></textarea>
            </div>
          </div>
          
          <div className="mt-6 flex justify-end space-x-3">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Cancelar
            </button>
            
            <button
              onClick={handleSaveMovement}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Guardar Movimiento
            </button>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default InventoryMovementModal;
