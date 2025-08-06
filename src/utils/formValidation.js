// Standardized form validation utilities
import { z } from 'zod';

// Common validation rules
export const validationRules = {
  email: z.union([z.string().email('Email inválido'), z.literal(''), z.null()]).optional(),
  phone: z.union([z.string(), z.literal(''), z.null()]).optional().refine(
    (val) => {
      if (!val || val === '' || val === null) return true; // Allow empty values
      return val.length >= 10; // Minimum 10 digits when provided
    },
    { message: 'Teléfono debe tener al menos 10 dígitos' }
  ),
  required: (fieldName) => z.string().min(1, `${fieldName} es requerido`),
  optionalString: z.union([z.string(), z.literal(''), z.null()]).optional(),
  optionalStringOrNumber: z.union([z.string(), z.number(), z.literal(''), z.null()]).optional().transform((val) => {
    // Convert numbers to strings for consistency
    if (typeof val === 'number') return val.toString();
    return val;
  }),
  positiveNumber: z.number().positive('Debe ser un número positivo'),
  nonNegativeNumber: z.number().min(0, 'No puede ser negativo'),
  date: z.string().min(1, 'Fecha es requerida'),
  url: z.union([
    z.string().url('URL inválida'),
    z.literal(''),
    z.null()
  ]).optional()
};

// Standard field validation schemas
export const fieldSchemas = {
  // Client fields
  clientName: validationRules.required('Nombre del cliente'),
  clientEmail: validationRules.email,
  clientPhone: validationRules.phone,
  clientAddress: validationRules.optionalString,
  
  // Product fields
  productName: validationRules.required('Nombre del producto'),
  productPrice: z.number().positive('Precio debe ser mayor a 0'),
  productStock: z.number().min(0, 'Stock no puede ser negativo'),
  productCategory: validationRules.required('Categoría'),
  
  // Employee fields
  employeeName: validationRules.required('Nombre del empleado'),
  employeeEmail: validationRules.email,
  employeeRole: validationRules.required('Rol'),
  
  // Order fields
  orderClientId: validationRules.required('Cliente'),
  orderStatus: z.enum(['pending', 'confirmed', 'in_progress', 'completed', 'delivered', 'cancelled']),
  orderPaymentStatus: z.enum(['pending', 'partial', 'paid', 'overdue']),
  
  // Maintenance fields
  maintenanceClientId: validationRules.required('Cliente'),
  maintenanceServiceType: validationRules.required('Tipo de servicio'),
  maintenanceFrequency: validationRules.required('Frecuencia'),
  
  // Quote fields
  quoteClientId: validationRules.required('Cliente'),
  quoteStatus: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired']),
  
  // Financial fields
  transactionAmount: z.number().positive('Monto debe ser mayor a 0'),
  transactionType: z.enum(['income', 'expense']),
  transactionCategory: validationRules.required('Categoría'),
  
  // Common fields
  status: z.enum(['active', 'inactive']),
  notes: validationRules.optionalString,
  date: validationRules.date
};

// Form validation schemas
export const formSchemas = {
  client: z.object({
    name: fieldSchemas.clientName,
    contact: validationRules.optionalString,
    email: fieldSchemas.clientEmail,
    phone: fieldSchemas.clientPhone,
    address: fieldSchemas.clientAddress,
    google_maps_link: validationRules.url,
    type: validationRules.optionalString,
    status: fieldSchemas.status.default('active'),
    rfc: validationRules.optionalString
  }),
  
  product: z.object({
    name: fieldSchemas.productName,
    description: validationRules.optionalString,
    price: fieldSchemas.productPrice,
    cost: z.number().min(0, 'Costo no puede ser negativo').optional(),
    stock: fieldSchemas.productStock,
    min_stock: z.number().min(0, 'Stock mínimo no puede ser negativo').optional(),
    category: fieldSchemas.productCategory,
    supplier_id: validationRules.optionalString,
    status: fieldSchemas.status.default('active')
  }),
  
  employee: z.object({
    name: fieldSchemas.employeeName,
    email: fieldSchemas.employeeEmail,
    phone: fieldSchemas.clientPhone,
    role: fieldSchemas.employeeRole,
    hire_date: fieldSchemas.date,
    address: fieldSchemas.clientAddress,
    google_maps_link: validationRules.url,
    status: fieldSchemas.status.default('active')
  }),
  
  order: z.object({
    client_id: fieldSchemas.orderClientId,
    status: fieldSchemas.orderStatus.default('pending'),
    payment_status: fieldSchemas.orderPaymentStatus.default('pending'),
    total: z.number().min(0, 'Total no puede ser negativo'),
    delivery_date: fieldSchemas.date.optional(),
    delivery_address: validationRules.optionalString,
    notes: fieldSchemas.notes
  }),
  
  maintenance: z.object({
    client_id: fieldSchemas.maintenanceClientId,
    service_type: fieldSchemas.maintenanceServiceType,
    frequency: fieldSchemas.maintenanceFrequency,
    last_service_date: fieldSchemas.date.optional(),
    next_service_date: fieldSchemas.date,
    last_service_employee_id: validationRules.optionalString,
    address: fieldSchemas.clientAddress,
    google_maps_link: validationRules.url,
    notes: fieldSchemas.notes,
    status: fieldSchemas.status.default('active')
  }),
  
  quote: z.object({
    client_id: fieldSchemas.quoteClientId,
    status: fieldSchemas.quoteStatus.default('draft'),
    total: z.number().min(0, 'Total no puede ser negativo'),
    valid_until: fieldSchemas.date,
    notes: fieldSchemas.notes
  }),
  
  transaction: z.object({
    date: fieldSchemas.date,
    transaction_type: fieldSchemas.transactionType,
    category: fieldSchemas.transactionCategory,
    description: validationRules.required('Descripción'),
    amount: fieldSchemas.transactionAmount,
    account_type: z.enum(['bank', 'cash']).default('bank'),
    account_id: validationRules.optionalString,
    reference_document: validationRules.optionalString,
    notes: fieldSchemas.notes
  }),
  
  supplier: z.object({
    name: validationRules.required('Nombre del proveedor'),
    contact: validationRules.optionalString,
    email: fieldSchemas.clientEmail,
    phone: fieldSchemas.clientPhone,
    address: fieldSchemas.clientAddress,
    lead_time: validationRules.optionalStringOrNumber,
    payment_terms: validationRules.optionalString,
    notes: fieldSchemas.notes
    // Removed status field - it doesn't exist in suppliers table schema
  })
};

/**
 * Validate form data against schema
 * @param {Object} data - Form data to validate
 * @param {Object} schema - Zod schema to validate against
 * @returns {Object} - { isValid: boolean, errors: Object, data: Object }
 */
export const validateFormData = (data, schema) => {
  try {
    // Check if data and schema are provided
    if (!data) {
      return {
        isValid: false,
        errors: { general: 'No data provided for validation' },
        data: null
      };
    }
    
    if (!schema) {
      return {
        isValid: false,
        errors: { general: 'No schema provided for validation' },
        data: null
      };
    }

    const validatedData = schema.parse(data);
    return {
      isValid: true,
      errors: {},
      data: validatedData
    };
  } catch (error) {
    console.error('Validation error:', error);
    
    if (error instanceof z.ZodError) {
      const errors = {};
      // Check if error.errors exists and is an array
      if (error.errors && Array.isArray(error.errors)) {
        error.errors.forEach(err => {
          const path = err.path ? err.path.join('.') : 'unknown';
          errors[path] = err.message;
        });
      } else {
        errors.general = 'Validation error occurred';
      }
      
      return {
        isValid: false,
        errors,
        data: null
      };
    }
    
    return {
      isValid: false,
      errors: { general: 'Error de validación desconocido' },
      data: null
    };
  }
};

/**
 * Validate individual field
 * @param {any} value - Field value
 * @param {Object} fieldSchema - Zod schema for the field
 * @returns {Object} - { isValid: boolean, error: string }
 */
export const validateField = (value, fieldSchema) => {
  try {
    fieldSchema.parse(value);
    return { isValid: true, error: null };
  } catch (error) {
    if (error instanceof z.ZodError) {
      return { isValid: false, error: error.errors[0]?.message || 'Error de validación' };
    }
    return { isValid: false, error: 'Error de validación desconocido' };
  }
};

/**
 * Get form schema by entity type
 * @param {string} entityType - Type of entity (client, product, etc.)
 * @returns {Object} - Zod schema
 */
export const getFormSchema = (entityType) => {
  return formSchemas[entityType] || z.object({});
};

/**
 * Clean form data by removing empty strings and null values
 * @param {Object} data - Form data to clean
 * @returns {Object} - Cleaned data
 */
export const cleanFormData = (data) => {
  const cleaned = {};
  
  Object.entries(data).forEach(([key, value]) => {
    // Convert empty strings to null for optional fields
    if (value === '') {
      cleaned[key] = null;
    } else if (value !== null && value !== undefined) {
      cleaned[key] = value;
    }
  });
  
  return cleaned;
};

/**
 * Standard form validation hook (to be implemented in components that use React hooks)
 * This is a template - copy this function into your component file to use it
 * 
 * @param {string} entityType - Entity type for schema selection
 * @param {Object} initialData - Initial form data
 * @returns {Object} - Validation utilities
 */
export const createFormValidationHook = (entityType, initialData = {}) => {
  // This should be used within a React component with useState
  return `
  const [errors, setErrors] = useState({});
  const [isValid, setIsValid] = useState(false);
  
  const schema = getFormSchema('${entityType}');
  
  const validateForm = (data) => {
    const result = validateFormData(data, schema);
    setErrors(result.errors);
    setIsValid(result.isValid);
    return result;
  };
  
  const validateSingleField = (fieldName, value) => {
    const fieldSchema = schema.shape[fieldName];
    if (!fieldSchema) return { isValid: true, error: null };
    
    const result = validateField(value, fieldSchema);
    setErrors(prev => ({
      ...prev,
      [fieldName]: result.error
    }));
    
    return result;
  };
  
  const clearErrors = () => {
    setErrors({});
    setIsValid(false);
  };
  
  return {
    errors,
    isValid,
    validateForm,
    validateSingleField,
    clearErrors,
    schema
  };
  `;
};
