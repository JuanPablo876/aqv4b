import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { useData } from '../hooks/useData';
import { DEFAULT_PRODUCT_IMAGE } from '../utils/placeholders';
import { ValidatedForm, ToastContainer } from './forms/ValidatedForm';
import { productSchema } from '../schemas/validationSchemas';
import { useToast } from '../hooks/useToast';

const ProductsAddModal = ({ isOpen, onClose, onSave }) => {
  const { data: productsList, loading: productsLoading } = useData('products');
  const { data: suppliersList, loading: suppliersLoading } = useData('suppliers');
  const { toasts, removeToast } = useToast();
  
  const loading = productsLoading || suppliersLoading;
  
  // Get unique categories for filter
  const categories = productsList ? [...new Set(productsList.map(product => product.category))] : [];
  
  // Get supplier options
  const supplierOptions = suppliersList ? suppliersList.map(supplier => ({
    value: supplier.id.toString(),
    label: supplier.name
  })) : [];
  
  // Get category options
  const categoryOptions = categories.map(category => ({
    value: category,
    label: category
  }));
  
  // Handle form submission
  const handleFormSubmit = async (data) => {
    // Simulate API delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    const formattedProduct = {
      ...data,
      id: productsList.length + 1,
      imageUrl: data.imageUrl || DEFAULT_PRODUCT_IMAGE
    };
    
    onSave(formattedProduct);
    onClose();
  };
  
  // Default form values
  const defaultValues = {
    name: '',
    category: '',
    description: '',
    price: '',
    cost: '',
    stock: '',
    minStock: '',
    sku: '',
    supplier: '',
    imageUrl: '',
    status: 'active'
  };
  
  if (!isOpen) return null;

  return (
    <>
      <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
        <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
          <div className="p-6 border-b border-blue-100">
            <div className="flex justify-between items-center">
              <h3 className="text-xl font-semibold text-blue-800">Nuevo Producto</h3>
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
            <ValidatedForm
              schema={productSchema}
              onSubmit={handleFormSubmit}
              defaultValues={defaultValues}
              className="space-y-4"
            >
              {({ register, errors, isSubmitting, isValid, FormField, SubmitButton }) => (
                <>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div className="md:col-span-2">
                      <FormField
                        label="Nombre del Producto"
                        name="name"


                        placeholder="Ingrese el nombre del producto"
                        required
                      />
                    </div>
                    
                    <FormField
                      label="Categoría"
                      name="category"
                      type="select"


                      options={categoryOptions}
                      placeholder="Seleccionar categoría..."
                      required
                    />
                    
                    <FormField
                      label="SKU"
                      name="sku"


                      placeholder="Código único del producto"
                      required
                    />
                    
                    <div className="md:col-span-2">
                      <FormField
                        label="Descripción"
                        name="description"
                        type="textarea"


                        placeholder="Descripción detallada del producto"
                        rows={3}
                      />
                    </div>
                    
                    <FormField
                      label="Precio de Venta"
                      name="price"
                      type="number"


                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    
                    <FormField
                      label="Costo"
                      name="cost"
                      type="number"


                      placeholder="0.00"
                      step="0.01"
                      min="0"
                      required
                    />
                    
                    <FormField
                      label="Stock Inicial"
                      name="stock"
                      type="number"


                      placeholder="0"
                      min="0"
                      required
                    />
                    
                    <FormField
                      label="Stock Mínimo"
                      name="minStock"
                      type="number"


                      placeholder="0"
                      min="0"
                      required
                    />
                    
                    <FormField
                      label="Proveedor"
                      name="supplier"
                      type="select"


                      options={supplierOptions}
                      placeholder="Seleccionar proveedor..."
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
                  </div>
                  
                  <div className="mt-6 flex justify-end space-x-3">
                    <button
                      type="button"
                      onClick={onClose}
                      className="px-4 py-2 rounded-md text-gray-700 bg-gray-100 hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
                    >
                      Cancelar
                    </button>
                    
                    <SubmitButton>
                      Guardar Producto
                    </SubmitButton>
                  </div>
                </>
              )}
            </ValidatedForm>
          </div>
          )}
        </VenetianTile>
      </div>
      
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </>
  );
};

export default ProductsAddModal;
