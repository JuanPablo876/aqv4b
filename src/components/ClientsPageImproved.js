// Example refactored ClientsPage with standardized error handling and validation
// This demonstrates the improved patterns - copy these patterns to other pages

import React, { useState, useEffect } from 'react';
import { useClients, useOrders } from '../hooks';
import { VenetianTile } from './VenetianBackground';
import { HistoryModal } from './HistoryModal';
import { validateFormData, formSchemas, cleanFormData } from '../utils/formValidation';
import { handleError, handleSuccess, handleFormSubmission, handleDatabaseError } from '../utils/errorHandling';
import { clientsAPI } from '../utils/apiUtils';

export default function ClientsPageImproved() {
  // Data hooks
  const { data: clientsList, loading: clientsLoading, error: clientsError, create, update } = useClients();
  const { data: ordersList, loading: ordersLoading, error: ordersError } = useOrders();

  // UI state
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClient, setSelectedClient] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingClient, setEditingClient] = useState(null);
  const [isHistoryModalOpen, setIsHistoryModalOpen] = useState(false);
  const [historyData, setHistoryData] = useState([]);
  const [historyTitle, setHistoryTitle] = useState('');

  // Form state with validation
  const [newClient, setNewClient] = useState({
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
  const [formErrors, setFormErrors] = useState({});
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Handle form validation
  const validateClientForm = (data) => {
    const result = validateFormData(data, formSchemas.client);
    setFormErrors(result.errors);
    return result;
  };

  // Handle input changes with validation
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewClient(prev => ({ ...prev, [name]: value }));
    
    // Clear field error when user starts typing
    if (formErrors[name]) {
      setFormErrors(prev => ({ ...prev, [name]: null }));
    }
  };

  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingClient(prev => ({ ...prev, [name]: value }));
  };

  // Standardized form submission handlers
  const handleSaveClient = async (e) => {
    e.preventDefault();
    
    // Validate form
    const validation = validateClientForm(newClient);
    if (!validation.isValid) {
      handleError(
        new Error('Datos de formulario inválidos'), 
        'Client form validation', 
        'Por favor corrige los errores en el formulario',
        true
      );
      return;
    }

    // Clean and submit data
    const cleanedData = cleanFormData(validation.data);
    
    await handleFormSubmission(
      (data) => create(data),
      cleanedData,
      'crear cliente',
      'Cliente creado exitosamente',
      () => {
        // Success callback
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
        setFormErrors({});
      },
      (error) => {
        // Error callback - already handled by handleFormSubmission
        console.error('Additional error handling if needed:', error);
      }
    );
  };

  const handleSaveEditedClient = async (e) => {
    e.preventDefault();
    
    // Validate edited client data
    const validation = validateClientForm(editingClient);
    if (!validation.isValid) {
      setFormErrors(validation.errors);
      handleError(
        new Error('Datos de formulario inválidos'), 
        'Client edit validation', 
        'Por favor corrige los errores en el formulario'
      );
      return;
    }

    const cleanedData = cleanFormData(validation.data);
    
    await handleFormSubmission(
      (data) => update(editingClient.id, data),
      cleanedData,
      'actualizar cliente',
      'Cliente actualizado exitosamente',
      () => {
        setIsEditModalOpen(false);
        setEditingClient(null);
        setFormErrors({});
      }
    );
  };

  // Enhanced history handler with error handling
  const handleViewOrderHistory = async (client) => {
    if (!client) {
      handleError(new Error('Cliente no válido'), 'View order history', 'Cliente no encontrado');
      return;
    }
    
    try {
      // Filter orders for this specific client
      const clientOrders = (ordersList || []).filter(order => order.client_id === client.id);
      
      console.log(`📊 Loading order history for ${client.name}:`, {
        clientId: client.id,
        totalOrders: ordersList?.length || 0,
        clientOrders: clientOrders.length,
      });

      const formattedHistory = clientOrders.map(order => ({
        id: order.id,
        date: order.created_at,
        description: `Pedido #${order.id} - ${order.status}`,
        amount: order.total,
        status: order.status,
        type: 'order'
      }));

      setHistoryData(formattedHistory);
      setHistoryTitle(`Historial de Pedidos - ${client.name}`);
      setIsHistoryModalOpen(true);
      
      handleSuccess(
        `Historial cargado: ${formattedHistory.length} pedidos encontrados`,
        'load order history'
      );
    } catch (error) {
      handleError(error, 'load order history', 'Error al cargar el historial de pedidos');
    }
  };

  // Loading and error states with consistent styling
  if (clientsLoading) {
    return (
      <div className="flex items-center justify-center min-h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
        <span className="ml-2 text-gray-600">Cargando clientes...</span>
      </div>
    );
  }

  if (clientsError) {
    return (
      <VenetianTile className="p-6">
        <div className="text-red-600">
          <h3 className="font-semibold mb-2">Error al cargar clientes</h3>
          <p className="text-sm">{clientsError}</p>
          <button 
            onClick={() => window.location.reload()} 
            className="mt-3 px-4 py-2 bg-red-600 text-white rounded hover:bg-red-700"
          >
            Reintentar
          </button>
        </div>
      </VenetianTile>
    );
  }

  // Render form field with error styling
  const renderFormField = (name, label, type = 'text', required = false, options = null) => (
    <div className="space-y-1">
      <label className="block text-sm font-medium text-gray-700">
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </label>
      {type === 'select' ? (
        <select
          name={name}
          value={editingClient ? editingClient[name] || '' : newClient[name] || ''}
          onChange={editingClient ? handleEditInputChange : handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            formErrors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          required={required}
        >
          <option value="">Seleccionar...</option>
          {options?.map(option => (
            <option key={option.value} value={option.value}>{option.label}</option>
          ))}
        </select>
      ) : (
        <input
          type={type}
          name={name}
          value={editingClient ? editingClient[name] || '' : newClient[name] || ''}
          onChange={editingClient ? handleEditInputChange : handleInputChange}
          className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
            formErrors[name] ? 'border-red-500 bg-red-50' : 'border-gray-300'
          }`}
          required={required}
        />
      )}
      {formErrors[name] && (
        <p className="text-sm text-red-600 flex items-center">
          <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7 4a1 1 0 11-2 0 1 1 0 012 0zm-1-9a1 1 0 00-1 1v4a1 1 0 102 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
          {formErrors[name]}
        </p>
      )}
    </div>
  );

  return (
    <div className="p-6 space-y-6">
      {/* Header - same as before */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 mb-4 md:mb-0">
          Clientes
        </h2>
        <button
          onClick={() => setIsAddModalOpen(true)}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors"
        >
          + Agregar Cliente
        </button>
      </div>

      {/* Rest of the component would continue with the same improved patterns... */}
      
      {/* Add Client Modal with improved error handling */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md">
            <h3 className="text-lg font-semibold mb-4">Agregar Nuevo Cliente</h3>
            
            <form onSubmit={handleSaveClient} className="space-y-4">
              {renderFormField('name', 'Nombre', 'text', true)}
              {renderFormField('email', 'Email', 'email')}
              {renderFormField('phone', 'Teléfono', 'tel')}
              {renderFormField('address', 'Dirección', 'text')}
              {renderFormField('google_maps_link', 'Enlace Google Maps', 'url')}
              {renderFormField('type', 'Tipo', 'select', false, [
                { value: 'individual', label: 'Individual' },
                { value: 'empresa', label: 'Empresa' }
              ])}
              {renderFormField('rfc', 'RFC', 'text')}
              
              <div className="flex space-x-3 pt-4">
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50"
                >
                  {isSubmitting ? 'Guardando...' : 'Guardar'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    setIsAddModalOpen(false);
                    setFormErrors({});
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
                  }}
                  className="flex-1 bg-gray-300 text-gray-700 py-2 px-4 rounded-md hover:bg-gray-400"
                >
                  Cancelar
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* History Modal */}
      {isHistoryModalOpen && (
        <HistoryModal
          isOpen={isHistoryModalOpen}
          onClose={() => setIsHistoryModalOpen(false)}
          title={historyTitle}
          data={historyData}
        />
      )}
    </div>
  );
}

// Usage instructions for other components:
/*
1. Import the utilities:
   import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
   import { validateFormData, formSchemas, cleanFormData } from '../utils/formValidation';
   import { clientsAPI } from '../utils/apiUtils';

2. Replace alert() calls with handleError():
   // OLD:
   } catch (error) {
     console.error('Error saving client:', error);
     alert('Error al crear cliente: ' + error.message);
   }

   // NEW:
   } catch (error) {
     handleError(error, 'create client', 'Error al crear cliente');
   }

3. Replace direct API calls with handleFormSubmission():
   // OLD:
   const handleSaveClient = async () => {
     try {
       await create(newClient);
       setIsAddModalOpen(false);
       // reset form
     } catch (error) {
       console.error('Error saving client:', error);
       alert('Error al crear cliente: ' + error.message);
     }
   };

   // NEW:
   const handleSaveClient = async (e) => {
     e.preventDefault();
     
     const validation = validateFormData(newClient, formSchemas.client);
     if (!validation.isValid) {
       setFormErrors(validation.errors);
       return;
     }

     await handleFormSubmission(
       (data) => create(data),
       cleanFormData(validation.data),
       'crear cliente',
       'Cliente creado exitosamente',
       () => {
         setIsAddModalOpen(false);
         // reset form
       }
     );
   };

4. Add form validation:
   - Use formSchemas for validation
   - Show field-level errors in UI
   - Clean form data before submission

5. Consistent error display:
   - Use handleError for all error scenarios
   - Include context and user-friendly messages
   - Log errors for debugging
*/
