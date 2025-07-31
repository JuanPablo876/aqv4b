import React, { useState, useEffect } from 'react';
import { useQuotes, useClients, useProducts } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass, getQuoteNumber } from '../utils/helpers';
import VenetianTile from './VenetianTile';
import QuotesAddModal from './QuotesAddModal'; // Import the new modal

const QuotesPage = ({ showModal, setShowModal, preSelectedClient = null, setSelectedClientForQuote }) => {
  const { data: quotesList, loading: quotesLoading, error: quotesError, update: updateQuote, create: createQuote } = useQuotes();
  const { data: clientsList, loading: clientsLoading } = useClients();
  const { data: productsList, loading: productsLoading } = useProducts();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'created_at', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedQuote, setSelectedQuote] = useState(null);
  const [isAddQuoteModalOpen, setIsAddQuoteModalOpen] = useState(false); // State for add modal
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingQuote, setEditingQuote] = useState(null);
  
  // Auto-open modal if preSelectedClient is provided
  useEffect(() => {
    if (preSelectedClient && !isAddQuoteModalOpen) {
      setIsAddQuoteModalOpen(true);
    }
  }, [preSelectedClient]);
  
  if (quotesLoading || clientsLoading || productsLoading) {
    return <div className="p-6">Cargando cotizaciones...</div>;
  }

  if (quotesError) {
    return <div className="p-6 text-red-600">Error: {quotesError}</div>;
  }
  
  // Combine quotes with client details
  const quotesWithDetails = quotesList.map(quote => {
    const client = clientsList.find(c => c.id === quote.client_id) || {};
    return {
      ...quote,
      clientName: client.name || 'Cliente Desconocido',
      clientContact: client.contact || 'N/A',
      clientEmail: client.email || 'N/A',
      clientPhone: client.phone || 'N/A'
    };
  });
  
  // Filter and sort quotes
  const filteredQuotes = sortByField(
    filterBySearchTerm(
      statusFilter 
        ? quotesWithDetails.filter(quote => quote.status === statusFilter)
        : quotesWithDetails, 
      searchTerm, 
      ['clientName', 'id', 'notes']
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
  
  // Handle quote selection
  const handleSelectQuote = (quote) => {
    // Enhance quote with product details
    const quoteWithProductDetails = {
      ...quote,
      items: quote.items.map(item => {
        const product = productsList.find(p => p.id === item.product_id) || {};
        return {
          ...item,
          productName: product.name || 'Producto Desconocido',
          sku: product.sku || 'N/A',
          category: product.category || 'N/A'
        };
      })
    };
    
    setSelectedQuote(quoteWithProductDetails);
  };
  
  // Handle close quote details
  const handleCloseDetails = () => {
    setSelectedQuote(null);
  };
  
  // Handle status change
  const handleStatusChange = async (quoteId, newStatus) => {
    try {
      await updateQuote(quoteId, { status: newStatus });
      
      if (selectedQuote && selectedQuote.id === quoteId) {
        setSelectedQuote({ ...selectedQuote, status: newStatus });
      }
    } catch (error) {
      console.error('Error updating quote status:', error);
      alert('Error al actualizar estado de la cotización: ' + error.message);
    }
  };
  
  // Handle add new quote
  const handleAddQuote = () => {
    setIsAddQuoteModalOpen(true);
  };
  
  // Handle save new quote from modal
  const handleSaveNewQuote = async (newQuoteData) => {
    try {
      await createQuote(newQuoteData);
      setIsAddQuoteModalOpen(false);
      // Clear the pre-selected client after successful save
      if (preSelectedClient && setSelectedClientForQuote) {
        setSelectedClientForQuote(null);
      }
    } catch (error) {
      console.error('Error creating quote:', error);
      alert('Error al crear cotización: ' + error.message);
    }
  };

  // Handle close modal (also clear pre-selected client)
  const handleCloseAddModal = () => {
    setIsAddQuoteModalOpen(false);
    if (preSelectedClient && setSelectedClientForQuote) {
      setSelectedClientForQuote(null);
    }
  };

  // Handle edit quote
  const handleEditQuote = (quote) => {
    setEditingQuote({ ...quote });
    setIsEditModalOpen(true);
  };

  // Handle save edited quote
  const handleSaveEditedQuote = async () => {
    try {
      await updateQuote(editingQuote.id, editingQuote);
      setIsEditModalOpen(false);
      setEditingQuote(null);
    } catch (error) {
      console.error('Error updating quote:', error);
      alert('Error al actualizar cotización: ' + error.message);
    }
  };

  // Handle input change for editing quote
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingQuote({
      ...editingQuote,
      [name]: value
    });
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'approved': return 'Aprobada';
      case 'rejected': return 'Rechazada';
      default: return status;
    }
  };
  
  // Get payment status label
  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'partial': return 'Parcial';
      case 'paid': return 'Pagado';
      case 'refunded': return 'Reembolsado';
      default: return status;
    }
  };
  
  // Get payment method label
  const getPaymentMethodLabel = (method) => {
    switch (method) {
      case 'cash': return 'Efectivo';
      case 'transfer': return 'Transferencia';
      case 'credit_card': return 'Tarjeta de Crédito';
      default: return method;
    }
  };
  
  return (
    <div className="p-6">
      {/* Header with search, filter and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Cotizaciones</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar cotizaciones..."
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
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="pending">Pendientes</option>
            <option value="approved">Aprobadas</option>
            <option value="rejected">Rechazadas</option>
          </select>
          
          <button
            onClick={handleAddQuote}
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
              Nueva Cotización
            </div>
          </button>
        </div>
      </div>
      
      {/* Quotes table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('id')}
                >
                  <div className="flex items-center">
                    N° Cotización
                    {sortConfig.field === 'id' && (
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
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    Cliente
                    {sortConfig.field === 'clientName' && (
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
                  onClick={() => handleSort('created_at')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortConfig.field === 'created_at' && (
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
                  onClick={() => handleSort('valid_until')}
                >
                  <div className="flex items-center">
                    Válida Hasta
                    {sortConfig.field === 'valid_until' && (
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
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Total
                    {sortConfig.field === 'total' && (
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
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Estado
                    {sortConfig.field === 'status' && (
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredQuotes.map((quote) => (
                <tr 
                  key={quote.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectQuote(quote)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{getQuoteNumber(quote.id)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{quote.clientName}</div>
                    <div className="text-xs text-gray-500">{quote.clientContact}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(quote.created_at)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(quote.valid_until)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(quote.total)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(quote.status)}`}>
                      {getStatusLabel(quote.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectQuote(quote);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditQuote(quote);
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Quote details modal */}
      {selectedQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Cotización {getQuoteNumber(selectedQuote.id)}</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información de la Cotización</h4>
                  
                  <div className="space-y-3">
                    <div className="flex justify-between">
                      <span className="text-gray-500">Fecha:</span>
                      <span className="text-blue-800 font-medium">{formatDate(selectedQuote.created_at)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Válida hasta:</span>
                      <span className="text-blue-800 font-medium">{formatDate(selectedQuote.valid_until)}</span>
                    </div>
                    
                    <div className="flex justify-between">
                      <span className="text-gray-500">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedQuote.status)}`}>
                        {getStatusLabel(selectedQuote.status)}
                      </span>
                    </div>
                    
                    {selectedQuote.notes && (
                      <div>
                        <span className="text-gray-500">Notas:</span>
                        <p className="text-blue-800 mt-1">{selectedQuote.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información del Cliente</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Nombre:</span>
                      <p className="text-blue-800 font-medium">{selectedQuote.clientName}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Contacto:</span>
                      <p className="text-blue-800">{selectedQuote.clientContact}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Email:</span>
                      <p className="text-blue-800">{selectedQuote.clientEmail}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="text-blue-800">{selectedQuote.clientPhone}</p>
                    </div>
                  </div>
                </div>
              </div>
              
              <h4 className="text-lg font-medium text-blue-800 mb-4">Productos</h4>
              
              <div className="bg-blue-50 rounded-lg overflow-hidden mb-6">
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
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {selectedQuote.items.map((item, index) => {
                      const product = productsList.find(p => p.id === item.product_id);
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
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
              
              <div className="flex justify-between mb-6">
                <div></div>
                <div className="w-64 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-gray-500">Subtotal:</span>
                    <span className="text-blue-800">{formatCurrency(selectedQuote.subtotal)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Descuento:</span>
                    <span className="text-blue-800">-{formatCurrency(selectedQuote.discount)}</span>
                  </div>
                  
                  <div className="flex justify-between">
                    <span className="text-gray-500">Impuestos:</span>
                    <span className="text-blue-800">{formatCurrency(selectedQuote.tax)}</span>
                  </div>
                  
                  <div className="flex justify-between pt-3 border-t border-gray-200">
                    <span className="text-blue-800 font-medium">Total:</span>
                    <span className="text-blue-800 font-bold">{formatCurrency(selectedQuote.total)}</span>
                  </div>
                </div>
              </div>
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Imprimir
                  </button>
                  
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Enviar por Email
                  </button>
                </div>
                
                {selectedQuote.status === 'pending' && (
                  <div className="flex space-x-3">
                    <button 
                      onClick={() => handleStatusChange(selectedQuote.id, 'approved')}
                      className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
                    >
                      Aprobar
                    </button>
                    
                    <button 
                      onClick={() => handleStatusChange(selectedQuote.id, 'rejected')}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Rechazar
                    </button>
                  </div>
                )}
                
                {selectedQuote.status === 'approved' && (
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Crear Pedido
                  </button>
                )}
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add Quote Modal */}
      <QuotesAddModal 
        isOpen={isAddQuoteModalOpen}
        onClose={handleCloseAddModal}
        onSave={handleSaveNewQuote}
        preSelectedClient={preSelectedClient}
      />

      {/* Edit Quote Modal */}
      {isEditModalOpen && editingQuote && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Editar Cotización {getQuoteNumber(editingQuote.id)}</h3>
                <button 
                  onClick={() => setIsEditModalOpen(false)}
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
                {/* Status */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Estado</label>
                  <select
                    name="status"
                    value={editingQuote.status}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="pending">Pendiente</option>
                    <option value="approved">Aprobada</option>
                    <option value="rejected">Rechazada</option>
                    <option value="expired">Expirada</option>
                  </select>
                </div>

                {/* Valid Until */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Válida Hasta</label>
                  <input
                    type="date"
                    name="valid_until"
                    value={editingQuote.valid_until ? editingQuote.valid_until.split('T')[0] : ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {/* Notes */}
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notas</label>
                  <textarea
                    name="notes"
                    value={editingQuote.notes || ''}
                    onChange={handleEditInputChange}
                    rows={3}
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Notas adicionales..."
                  />
                </div>
              </div>
              
              <div className="flex justify-end space-x-3 mt-6">
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 text-gray-700 border border-gray-300 rounded-md hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                <button
                  onClick={handleSaveEditedQuote}
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

export default QuotesPage;
// DONE
