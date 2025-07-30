import React, { useState } from 'react';
import VenetianTile from './VenetianTile';
import { ValidatedForm, ToastContainer } from './forms/ValidatedForm';
import { clientSchema } from '../schemas/validationSchemas';
import { useToast } from '../hooks/useToast';

const ClientAddModal = ({ isOpen, onClose, onSave }) => {
  const { toasts, removeToast } = useToast();
  
  // Handle form submission
  const handleFormSubmit = async (data) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const formattedClient = {
      ...data,
      id: Date.now(), // Simple ID generation
      createdAt: new Date().toISOString(),
      orders: 0,
      totalPurchases: 0
    };
    
    onSave(formattedClient);
    onClose();
  };
  
  // Default form values
  const defaultValues = {
    name: '',
    email: '',
    phone: '',
    address: '',
    city: '',
    state: '',
    zipCode: '',
    company: '',
    contactPerson: '',
    notes: '',
    type: 'individual',
    status: 'active'
  };

  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <VenetianTile className="max-w-3xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-blue-800">Nuevo Cliente</h3>
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
            <ValidatedForm
              schema={clientSchema}
              onSubmit={handleFormSubmit}
              defaultValues={defaultValues}
              className="space-y-6"
            >
              {({ register, errors, isSubmitting, isValid, watch, FormField, SubmitButton }) => {
                const clientType = watch('type');
                
                return (
                  <>
                    {/* Basic Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Tipo de Cliente"
                          name="type"
                          type="select"


                          options={[
                            { value: 'individual', label: 'Persona Física' },
                            { value: 'business', label: 'Empresa' }
                          ]}
                          required
                        />
                        
                        <FormField
                          label="Estado"
                          name="status"
                          type="select"


                          options={[
                            { value: 'active', label: 'Activo' },
                            { value: 'inactive', label: 'Inactivo' }
                          ]}
                          required
                        />
                        
                        <FormField
                          label={clientType === 'business' ? 'Nombre de la Empresa' : 'Nombre Completo'}
                          name="name"


                          placeholder={clientType === 'business' ? 'Nombre de la empresa' : 'Nombre completo'}
                          required
                        />
                        
                        {clientType === 'business' && (
                          <FormField
                            label="Persona de Contacto"
                            name="contactPerson"


                            placeholder="Nombre del contacto principal"
                          />
                        )}
                        
                        {clientType === 'individual' && (
                          <FormField
                            label="Empresa (Opcional)"
                            name="company"


                            placeholder="Empresa donde trabaja"
                          />
                        )}
                      </div>
                    </div>

                    {/* Contact Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Información de Contacto</h4>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <FormField
                          label="Correo Electrónico"
                          name="email"
                          type="email"


                          placeholder="correo@ejemplo.com"
                          required
                        />
                        
                        <FormField
                          label="Teléfono"
                          name="phone"
                          type="tel"


                          placeholder="(555) 123-4567"
                          required
                        />
                      </div>
                    </div>

                    {/* Address Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Dirección</h4>
                      <div className="grid grid-cols-1 gap-4">
                        <FormField
                          label="Dirección"
                          name="address"


                          placeholder="Calle, número, colonia"
                          required
                        />
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <FormField
                            label="Ciudad"
                            name="city"


                            placeholder="Ciudad"
                            required
                          />
                          
                          <FormField
                            label="Estado"
                            name="state"


                            placeholder="Estado"
                            required
                          />
                          
                          <FormField
                            label="Código Postal"
                            name="zipCode"


                            placeholder="12345"
                            maxLength={5}
                            required
                          />
                        </div>
                      </div>
                    </div>

                    {/* Additional Information */}
                    <div>
                      <h4 className="text-lg font-medium text-gray-900 mb-4">Información Adicional</h4>
                      <FormField
                        label="Notas"
                        name="notes"
                        type="textarea"


                        placeholder="Información adicional sobre el cliente..."
                        rows={3}
                      />
                    </div>
                    
                    <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                      >
                        Cancelar
                      </button>
                      
                      <SubmitButton>
                        Guardar Cliente
                      </SubmitButton>
                    </div>
                  </>
                );
              }}
            </ValidatedForm>
          </div>
        </VenetianTile>
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ClientAddModal;
