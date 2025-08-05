// General helper functions

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Generate short display ID from UUID (for better UX)
const generateShortId = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return '0000';
  
  // Extract last 8 characters and convert to a shorter number
  const shortPart = uuid.slice(-8);
  // Convert to base-36 and then to a 4-6 digit number
  const num = parseInt(shortPart, 16);
  return (num % 999999 + 100000).toString(); // Ensures 6-digit number
};

// Generate order number from UUID
const getOrderNumber = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return '001';
  return generateShortId(uuid).slice(-3); // Last 3 digits for order
};

// Generate quote number from UUID
const getQuoteNumber = (uuid) => {
  if (!uuid || typeof uuid !== 'string') return '1001';
  const shortId = generateShortId(uuid);
  return (parseInt(shortId.slice(-4)) + 1000).toString(); // 4 digits starting from 1000
};

// Calculate total from items array
const calculateTotal = (items) => {
  const total = items.reduce((total, item) => {
    const itemTotal = (item.price * item.quantity) - (item.discount || 0);
    return total + itemTotal;
  }, 0);
  return total;
};

// Calculate subtotal from items array
const calculateSubtotal = (items) => {
  const subtotal = items.reduce((subtotal, item) => {
    const itemSubtotal = item.price * item.quantity;
    return subtotal + itemSubtotal;
  }, 0);
  return subtotal;
};

// Calculate total discount from items array
const calculateDiscount = (items) => {
  const discount = items.reduce((total, item) => {
    const itemDiscount = item.discount || 0;
    return total + itemDiscount;
  }, 0);
  return discount;
};

// Calculate tax amount based on subtotal and discount
const calculateTax = (subtotal, discount, taxRate = 0.16) => {
  return (subtotal - discount) * taxRate;
};

// Filter array by search term across multiple fields
const filterBySearchTerm = (array, searchTerm, fields) => {
  if (!searchTerm) return array;
  
  const term = searchTerm.toLowerCase();
  return array.filter(item => {
    return fields.some(field => {
      const value = item[field];
      if (value === null || value === undefined) return false;
      return value.toString().toLowerCase().includes(term);
    });
  });
};

// Sort array by field
const sortByField = (array, field, direction = 'asc') => {
  return [...array].sort((a, b) => {
    // Handle null or undefined values
    if (a[field] === null || a[field] === undefined) return direction === 'asc' ? -1 : 1;
    if (b[field] === null || b[field] === undefined) return direction === 'asc' ? 1 : -1;
    
    // Handle different types
    if (typeof a[field] === 'string') {
      return direction === 'asc' 
        ? a[field].localeCompare(b[field])
        : b[field].localeCompare(a[field]);
    }
    
    return direction === 'asc' 
      ? a[field] - b[field]
      : b[field] - a[field];
  });
};

// Get status color class based on status
const getStatusColorClass = (status) => {
  const statusMap = {
    active: 'bg-green-100 text-green-800',
    inactive: 'bg-gray-100 text-gray-800',
    pending: 'bg-yellow-100 text-yellow-800',
    approved: 'bg-green-100 text-green-800',
    rejected: 'bg-red-100 text-red-800',
    processing: 'bg-blue-100 text-blue-800',
    shipped: 'bg-teal-100 text-teal-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    warning: 'bg-yellow-100 text-yellow-800',
    alert: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    ok: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800', // Added low stock status
    // Spanish status mappings
    pendiente: 'bg-yellow-100 text-yellow-800',
    aprobado: 'bg-green-100 text-green-800',
    rechazado: 'bg-red-100 text-red-800',
    procesando: 'bg-blue-100 text-blue-800',
    enviado: 'bg-teal-100 text-teal-800',
    completado: 'bg-green-100 text-green-800',
    cancelado: 'bg-red-100 text-red-800',
    pagado: 'bg-green-100 text-green-800',
    parcial: 'bg-yellow-100 text-yellow-800',
    activo: 'bg-green-100 text-green-800',
    inactivo: 'bg-gray-100 text-gray-800'
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
};

// Get localized status text
const getLocalizedStatus = (status) => {
  const statusTranslations = {
    pending: 'pendiente',
    approved: 'aprobado',
    rejected: 'rechazado',
    processing: 'procesando',
    shipped: 'enviado',
    delivered: 'entregado',
    completed: 'completado',
    cancelled: 'cancelado',
    paid: 'pagado',
    partial: 'parcial',
    active: 'activo',
    inactive: 'inactivo',
    warning: 'advertencia',
    alert: 'alerta',
    info: 'información',
    ok: 'bien',
    low: 'bajo'
  };
  
  return statusTranslations[status] || status;
};

// Truncate text with ellipsis
const truncateText = (text, maxLength) => {
  if (!text || text.length <= maxLength) return text;
  return text.slice(0, maxLength) + '...';
};

// Get relative time from date
const getRelativeTime = (dateString) => {
  const date = new Date(dateString);
  const now = new Date();
  const diffInSeconds = Math.floor((now - date) / 1000);
  
  if (diffInSeconds < 60) return 'hace unos segundos';
  if (diffInSeconds < 3600) return `hace ${Math.floor(diffInSeconds / 60)} minutos`;
  if (diffInSeconds < 86400) return `hace ${Math.floor(diffInSeconds / 3600)} horas`;
  if (diffInSeconds < 604800) return `hace ${Math.floor(diffInSeconds / 86400)} días`;
  
  return new Date(dateString).toLocaleDateString('es-MX', { 
    year: 'numeric', 
    month: 'short', 
    day: 'numeric' 
  });
};

export {
  generateId,
  generateShortId,
  getOrderNumber,
  getQuoteNumber,
  calculateTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  filterBySearchTerm,
  sortByField,
  getStatusColorClass,
  getLocalizedStatus,
  truncateText,
  getRelativeTime
};
