// General helper functions

// Generate a unique ID
const generateId = () => {
  return Date.now().toString(36) + Math.random().toString(36).substr(2, 5);
};

// Calculate total from items array
const calculateTotal = (items) => {
  return items.reduce((total, item) => {
    const itemTotal = (item.price * item.quantity) - (item.discount || 0);
    return total + itemTotal;
  }, 0);
};

// Calculate subtotal from items array
const calculateSubtotal = (items) => {
  return items.reduce((subtotal, item) => {
    return subtotal + (item.price * item.quantity);
  }, 0);
};

// Calculate total discount from items array
const calculateDiscount = (items) => {
  return items.reduce((total, item) => {
    return total + (item.discount || 0);
  }, 0);
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
    shipped: 'bg-purple-100 text-purple-800',
    completed: 'bg-green-100 text-green-800',
    cancelled: 'bg-red-100 text-red-800',
    paid: 'bg-green-100 text-green-800',
    partial: 'bg-yellow-100 text-yellow-800',
    warning: 'bg-yellow-100 text-yellow-800',
    alert: 'bg-red-100 text-red-800',
    info: 'bg-blue-100 text-blue-800',
    ok: 'bg-green-100 text-green-800',
    low: 'bg-yellow-100 text-yellow-800' // Added low stock status
  };
  
  return statusMap[status] || 'bg-gray-100 text-gray-800';
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
  calculateTotal,
  calculateSubtotal,
  calculateDiscount,
  calculateTax,
  filterBySearchTerm,
  sortByField,
  getStatusColorClass,
  truncateText,
  getRelativeTime
};