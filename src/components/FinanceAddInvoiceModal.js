import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { clients } from '../mock/clients';

const FinanceAddInvoiceModal = ({ isOpen, onClose, onSave }) => {
  const [clientsList, setClientsList] = useState([]);
  const [newInvoice, setNewInvoice] = useState({
    clientId: '',
    rfc: '',
    razonSocial: '',
    invoiceNumber: '',
    date: new Date().toISOString().split('T')[0],
    total: '',
    status: 'paid', // Default to paid for simplicity
    paymentMethod: '',
    orderId: '',
    notes: ''
  });
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setClientsList(clients);
  }, []);
  
  // Handle input change for new invoice
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewInvoice({
      ...newInvoice,
      [name]: value
    });
  };
  
  // Handle client selection to pre-fill RFC and Razon Social
  const handleClientSelect = (e) => {
    const clientId = e.target.value;
    const client = clientsList.find(c => c.id === parseInt(clientId));
    setNewInvoice({
      ...newInvoice,
      clientId: clientId ? parseInt(clientId) : '',
      rfc: client?.rfc || '', // Assuming clients mock has rfc
      razonSocial: client?.razonSocial || '' // Assuming clients mock has razonSocial
    });
  };
  
  // Handle save new invoice
  const handleSaveInvoice = () => {
    if (!newInvoice.clientId || !newInvoice.invoiceNumber || !newInvoice.total) {
      alert('Por favor, completa los campos obligatorios (Cliente, # Factura/Nota, Total).');
      return;
    }
    
    const invoiceToSave = {
      ...newInvoice,
      id: Date.now(), // Simple ID generation
      total: parseFloat(newInvoice.total) || 0,
      orderId: newInvoice.orderId ? parseInt(newInvoice.orderId) : null
    };
    
    onSave(invoiceToSave);
    onClose();
  };
  
  if (!isOpen) return null;

  return (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
      <VenetianTile className="max-w-md w-full max-h-[90vh] overflow-y-auto scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
        <div className="p-6 border-b border-blue-100">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800">Nueva Factura/Nota</h3>
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
                Cliente
              </label>
              <select
                name="clientId"
                value={newInvoice.clientId}
                onChange={handleClientSelect}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Seleccionar Cliente...</option>
                {clientsList.map(client => (
                  <option key={client.id} value={client.id}>
                    {client.name}
                  </option>
                ))}
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Fecha
              </label>
              <input
                type="date"
                name="date"
                value={newInvoice.date}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                # Factura/Nota
              </label>
              <input
                type="text"
                name="invoiceNumber"
                value={newInvoice.invoiceNumber}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                RFC
              </label>
              <input
                type="text"
                name="rfc"
                value={newInvoice.rfc}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Razón Social
              </label>
              <input
                type="text"
                name="razonSocial"
                value={newInvoice.razonSocial}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Total
              </label>
              <input
                type="number"
                name="total"
                value={newInvoice.total}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Estado
              </label>
              <select
                name="status"
                value={newInvoice.status}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="paid">Pagada</option>
                <option value="pending">Pendiente</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Método de Pago
              </label>
              <input
                type="text"
                name="paymentMethod"
                value={newInvoice.paymentMethod}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                # Pedido Asociado (Opcional)
              </label>
              <input
                type="text"
                name="orderId"
                value={newInvoice.orderId}
                onChange={handleInputChange}
                className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notas (Opcional)
              </label>
              <textarea
                name="notes"
                value={newInvoice.notes}
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
              onClick={handleSaveInvoice}
              className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              Guardar Factura/Nota
            </button>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

export default FinanceAddInvoiceModal;
