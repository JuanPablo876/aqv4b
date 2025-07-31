import React, { useState, useEffect } from 'react';
import { useClients } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import VenetianTile from './VenetianTile';

const ClientsPage = ({ setActivePage, setSelectedClientForQuote }) => {
  const { data: clientsList, loading, error, create, update, delete: deleteClient } = useClients();
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [newClient, setNewClient] = useState({
    name: '',
    contact: '',
    email: '',
    phone: '',
    address: '',
    google_maps_link: '', // Updated to match database field name
    type: '',
    status: 'active',
    rfc: ''
  });

  // Show loading state
  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando clientes...</span>
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
              <p className="text-red-700 mb-4">No se pudo cargar la información de clientes:</p>
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
  
  // Filter and sort clients
  const filteredClients = sortByField(
    filterBySearchTerm(clientsList, searchTerm, ['name', 'contact', 'email', 'type', 'rfc']),
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
  
  // Handle client selection
  const handleSelectClient = (client) => {
    setSelectedClient(client);
  };
  
  // Handle add new client
  const handleAddClient = () => {
    setIsAddModalOpen(true);
  };
  
  // Handle input change for new client
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient({
      ...newClient,
      [name]: value
    });
  };
  
  // Handle save new client
  const handleSaveClient = async () => {
    try {
      const clientData = {
        ...newClient,
        last_purchase: new Date().toISOString().split('T')[0],
        total_spent: 0
      };
      
      await create(clientData);
      setIsAddModalOpen(false);
      setNewClient({
        name: '',
        contact: '',
        email: '',
        phone: '',
        address: '',
        google_maps_link: '',
        type: '',
        status: 'active',
        rfc: ''
      });
    } catch (error) {
      console.error('Error creating client:', error);
      alert('Error al crear cliente: ' + error.message);
    }
  };
  
  // Handle close client details
  const handleCloseDetails = () => {
    setSelectedClient(null);
  };

  // Handle edit client
  const handleEditClient = (client) => {
    setEditingClient({ ...client });
    setIsEditModalOpen(true);
  };

  // Handle save edited client
  const handleSaveEditedClient = async () => {
    try {
      await update(editingClient.id, editingClient);
      setIsEditModalOpen(false);
      setEditingClient(null);
    } catch (error) {
      console.error('Error updating client:', error);
      alert('Error al actualizar cliente: ' + error.message);
    }
  };

  // Handle input change for editing client
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingClient({
      ...editingClient,
      [name]: value
    });
  };
  
  return (
    <div className="p-6">
      {/* Header with search and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Clientes</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar clientes..."
              className="w-full md:w-64 px-4 py-2 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
          
          <button
            onClick={handleAddClient}
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
              Nuevo Cliente
            </div>
          </button>
        </div>
      </div>
      
      {/* Clients table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortConfig.field === 'name' && (
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
                  onClick={() => handleSort('contact')}
                >
                  <div className="flex items-center">
                    Contacto
                    {sortConfig.field === 'contact' && (
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
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Tipo
                    {sortConfig.field === 'type' && (
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
                  onClick={() => handleSort('rfc')}
                >
                  <div className="flex items-center">
                    RFC
                    {sortConfig.field === 'rfc' && (
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
                  onClick={() => handleSort('last_purchase')}
                >
                  <div className="flex items-center">
                    Última Compra
                    {sortConfig.field === 'last_purchase' && (
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
                  onClick={() => handleSort('total_spent')}
                >
                  <div className="flex items-center">
                    Total Gastado
                    {sortConfig.field === 'total_spent' && (
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
              {filteredClients.map((client) => (
                <tr 
                  key={client.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectClient(client)}
                >
                  <td className="px-6 py-4 col-wide">
                    <div className="text-sm font-medium text-gray-900">{client.name}</div>
                    <div className="text-sm text-gray-500">{client.email}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.contact}</div>
                    <div className="text-sm text-gray-500">{client.phone}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{client.type}</div>
                  </td>
                   <td className="px-6 py-4 col-narrow">
                    <div className="text-sm text-gray-900">{client.rfc || 'N/A'}</div>
                  </td>
                  <td className="px-6 py-4 col-narrow">
                    <div className="text-sm text-gray-900">{formatDate(client.last_purchase)}</div>
                  </td>
                  <td className="px-6 py-4 col-narrow">
                    <div className="text-sm text-gray-900">{formatCurrency(client.total_spent)}</div>
                  </td>
                  <td className="px-6 py-4 col-narrow">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(client.status)}`}>
                      {client.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 text-right text-sm font-medium col-narrow">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectClient(client);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditClient(client);
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
      
      {/* Client details modal */}
      {selectedClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Detalles del Cliente</h3>
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
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información General</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="text-blue-800">{selectedClient.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Tipo de Cliente</p>
                      <p className="text-blue-800">{selectedClient.type}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedClient.status)}`}>
                        {selectedClient.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                     <div>
                      <p className="text-sm text-gray-500">RFC</p>
                      <p className="text-blue-800">{selectedClient.rfc || 'N/A'}</p>
                    </div>
                  </div>
                  
                  <h4 className="text-lg font-medium text-blue-800 mt-6 mb-4">Información de Contacto</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Persona de Contacto</p>
                      <p className="text-blue-800">{selectedClient.contact}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-blue-800">{selectedClient.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-blue-800">{selectedClient.phone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-blue-800">{selectedClient.address}</p>
                      {selectedClient.google_maps_link && (
                        <a 
                          href={selectedClient.google_maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver en Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información de Compras</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Total Gastado</p>
                      <p className="text-xl font-semibold text-blue-800">{formatCurrency(selectedClient.total_spent)}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Última Compra</p>
                      <p className="text-blue-800">{formatDate(selectedClient.last_purchase)}</p>
                    </div>
                  </div>
                  
                  <div className="mt-6">
                    <h4 className="text-lg font-medium text-blue-800 mb-4">Acciones Rápidas</h4>
                    
                    <div className="grid grid-cols-2 gap-3">
                      <button 
                        className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                        onClick={() => {
                          // Set the selected client and navigate to quotes page
                          if (setSelectedClientForQuote) {
                            setSelectedClientForQuote(selectedClient);
                          }
                          if (setActivePage) {
                            setActivePage('quotes');
                          } else {
                            alert('Navegando a Cotizaciones para ' + selectedClient.name);
                          }
                        }}
                      >
                        Nueva Cotización
                      </button>
                      
                      <button 
                        className="bg-emerald-600 text-white px-4 py-2 rounded-lg hover:bg-emerald-700 focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:ring-offset-2"
                        onClick={() => {
                          // Navigate to orders page with client pre-selected
                          if (setActivePage) {
                            setActivePage('orders');
                          } else {
                            alert('Navegando a Pedidos para ' + selectedClient.name);
                          }
                        }}
                      >
                        Nuevo Pedido
                      </button>
                      
                      <button 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        onClick={() => {
                          // Show order history for this client
                          alert('Funcionalidad en desarrollo: Historial de Pedidos para ' + selectedClient.name);
                        }}
                      >
                        Historial de Pedidos
                      </button>
                      
                      <button 
                        className="border border-gray-300 text-gray-700 px-4 py-2 rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                        onClick={() => {
                          // Close details modal and open edit modal
                          setSelectedClient(null);
                          handleEditClient(selectedClient);
                        }}
                      >
                        Editar Cliente
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add client modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Nuevo Cliente</h3>
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
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre de la Empresa
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newClient.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Persona de Contacto
                  </label>
                  <input
                    type="text"
                    name="contact"
                    value={newClient.contact}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo de Cliente
                  </label>
                  <select
                    name="type"
                    value={newClient.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar...</option>
                    <option value="Hotel">Hotel</option>
                    <option value="Club Deportivo">Club Deportivo</option>
                    <option value="Residencial">Residencial</option>
                    <option value="Spa">Spa</option>
                    <option value="Parque Acuático">Parque Acuático</option>
                    <option value="Gimnasio">Gimnasio</option>
                    <option value="Otro">Otro</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newClient.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={newClient.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    RFC (Opcional)
                  </label>
                  <input
                    type="text"
                    name="rfc"
                    value={newClient.rfc}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newClient.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Enlace Google Maps (Opcional)
                  </label>
                  <input
                    type="text"
                    name="google_maps_link"
                    value={newClient.google_maps_link}
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
                    value={newClient.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
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
                  onClick={handleSaveClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Cliente
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Edit client modal */}
      {isEditModalOpen && editingClient && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="bg-white p-6 rounded-lg w-full max-w-2xl max-h-[90vh] overflow-y-auto">
            <div>
              <h3 className="text-lg font-medium text-gray-900 mb-4">Editar Cliente</h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Nombre</label>
                  <input
                    type="text"
                    name="name"
                    value={editingClient.name || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Contacto</label>
                  <input
                    type="text"
                    name="contact"
                    value={editingClient.contact || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={editingClient.email || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Teléfono</label>
                  <input
                    type="text"
                    name="phone"
                    value={editingClient.phone || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Dirección</label>
                  <textarea
                    name="address"
                    value={editingClient.address || ''}
                    onChange={handleEditInputChange}
                    rows="3"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 mb-1">Enlace Google Maps</label>
                  <input
                    type="url"
                    name="google_maps_link"
                    value={editingClient.google_maps_link || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Tipo</label>
                  <input
                    type="text"
                    name="type"
                    value={editingClient.type || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">RFC</label>
                  <input
                    type="text"
                    name="rfc"
                    value={editingClient.rfc || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Estado</label>
                  <select
                    name="status"
                    value={editingClient.status || 'active'}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsEditModalOpen(false);
                    setEditingClient(null);
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  onClick={handleSaveEditedClient}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Actualizar Cliente
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
    </div>
  );
};

export default ClientsPage;
