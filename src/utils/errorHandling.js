// Error handling utilities for standardized error management

/**
 * Standard error handler that provides consistent error display and logging
 * @param {Error} error - The error object
 * @param {string} context - Context of where the error occurred
 * @param {string} userMessage - User-friendly message in Spanish
 * @param {boolean} showAlert - Whether to show alert notification (default: true)
 */
export const handleError = (error, context, userMessage, showAlert = true) => {
  // Log the error for debugging
  console.error(`❌ Error in ${context}:`, error);
  
  // Extract meaningful error message
  const errorMessage = error?.message || error?.error?.message || 'Error desconocido';
  
  // Show user-friendly notification
  if (showAlert) {
    alert(`${userMessage}: ${errorMessage}`);
  }
  
  // For development, also log stack trace
  if (process.env.NODE_ENV === 'development') {
    console.error('Stack trace:', error.stack);
  }
  
  return errorMessage;
};

/**
 * Success handler for consistent success feedback
 * @param {string} message - Success message to display
 * @param {string} context - Context of the successful operation
 * @param {boolean} showAlert - Whether to show alert (default: false)
 */
export const handleSuccess = (message, context, showAlert = false) => {

  if (showAlert) {
    alert(message);
  }
};

/**
 * Validation error handler for form validation
 * @param {Object} validationErrors - Validation errors object
 * @param {string} context - Context of validation
 */
export const handleValidationErrors = (validationErrors, context) => {
  console.warn(`⚠️ Validation errors in ${context}:`, validationErrors);
  
  // Show first validation error
  const firstError = Object.values(validationErrors)[0];
  if (firstError) {
    toast.error(firstError);
  }
};

/**
 * Database error handler for specific database errors
 * @param {Error} error - Database error
 * @param {string} operation - Database operation (create, update, delete, etc.)
 * @param {string} entity - Entity name (cliente, producto, etc.)
 */
export const handleDatabaseError = (error, operation, entity) => {
  const context = `Database ${operation}`;
  let userMessage = `Error al ${operation === 'create' ? 'crear' : 
                     operation === 'update' ? 'actualizar' : 
                     operation === 'delete' ? 'eliminar' : 'procesar'} ${entity}`;
  
  // Handle specific database errors
  if (error.message.includes('duplicate key')) {
    userMessage = `Ya existe un ${entity} con esos datos`;
  } else if (error.message.includes('foreign key')) {
    userMessage = `No se puede ${operation === 'delete' ? 'eliminar' : 'guardar'} ${entity} porque está siendo usado`;
  } else if (error.message.includes('not found')) {
    userMessage = `${entity} no encontrado`;
  }
  
  return handleError(error, context, userMessage);
};

/**
 * Network error handler for API calls
 * @param {Error} error - Network error
 * @param {string} endpoint - API endpoint
 */
export const handleNetworkError = (error, endpoint) => {
  const context = `Network request to ${endpoint}`;
  let userMessage = 'Error de conexión';
  
  if (error.code === 'NETWORK_ERROR') {
    userMessage = 'Sin conexión a internet';
  } else if (error.response?.status === 401) {
    userMessage = 'Sesión expirada, por favor inicia sesión nuevamente';
  } else if (error.response?.status === 403) {
    userMessage = 'No tienes permisos para realizar esta acción';
  } else if (error.response?.status === 404) {
    userMessage = 'Recurso no encontrado';
  } else if (error.response?.status >= 500) {
    userMessage = 'Error del servidor, intenta más tarde';
  }
  
  return handleError(error, context, userMessage);
};

/**
 * Async operation wrapper with error handling
 * @param {Function} operation - Async function to execute
 * @param {string} context - Context description
 * @param {string} successMessage - Success message
 * @param {string} errorMessage - Error message
 */
export const withErrorHandling = async (operation, context, successMessage, errorMessage) => {
  try {
    const result = await operation();
    if (successMessage) {
      handleSuccess(successMessage, context);
    }
    return result;
  } catch (error) {
    handleError(error, context, errorMessage);
    throw error; // Re-throw so calling code can handle if needed
  }
};

/**
 * Form submission wrapper with error handling
 * @param {Function} submitFn - Form submission function
 * @param {Object} formData - Form data
 * @param {string} context - Context description
 * @param {string} successMessage - Success message
 * @param {Function} onSuccess - Success callback
 * @param {Function} onError - Error callback
 */
export const handleFormSubmission = async (
  submitFn, 
  formData, 
  context, 
  successMessage, 
  onSuccess, 
  onError
) => {
  try {
    const result = await submitFn(formData);
    
    if (successMessage) {
      handleSuccess(successMessage, context);
    }
    
    if (onSuccess) {
      onSuccess(result);
    }
    
    return result;
  } catch (error) {
    const errorMessage = handleError(error, context, `Error en ${context}`, false);
    
    if (onError) {
      onError(error, errorMessage);
    }
    
    throw error;
  }
};
