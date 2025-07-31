import { z } from 'zod';

// Common validation patterns
const requiredString = (message) => z.string().min(1, message);
const positiveNumber = (message) => z.coerce.number().positive(message);
const nonNegativeNumber = (message) => z.coerce.number().min(0, message);
const email = z.string().email('Ingrese un email válido');
const phone = z.string().regex(/^[\d\s\-\+\(\)]{10,}$/, 'Ingrese un teléfono válido');

// Product schema
export const productSchema = z.object({
  name: requiredString('El nombre del producto es requerido'),
  category: requiredString('La categoría es requerida'),
  description: z.string().optional(),
  price: positiveNumber('El precio debe ser mayor a 0'),
  cost: nonNegativeNumber('El costo no puede ser negativo'),
  stock: nonNegativeNumber('El stock no puede ser negativo'),
  minStock: nonNegativeNumber('El stock mínimo no puede ser negativo'),
  sku: requiredString('El SKU es requerido'),
  supplier: requiredString('El proveedor es requerido'),
  imageUrl: z.string().optional(),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
}).refine((data) => data.price > data.cost, {
  message: 'El precio debe ser mayor al costo',
  path: ['price']
}).refine((data) => data.minStock <= data.stock, {
  message: 'El stock mínimo debe ser menor o igual al stock inicial',
  path: ['minStock']
});

// Client schema
export const clientSchema = z.object({
  name: requiredString('El nombre es requerido'),
  email: email,
  phone: phone,
  address: requiredString('La dirección es requerida'),
  city: requiredString('La ciudad es requerida'),
  state: requiredString('El estado es requerido'),
  zipCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  company: z.string().optional(),
  contactPerson: z.string().optional(),
  notes: z.string().optional(),
  type: z.enum(['individual', 'business'], {
    errorMap: () => ({ message: 'Tipo de cliente inválido' })
  }),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Supplier schema
export const supplierSchema = z.object({
  name: requiredString('El nombre del proveedor es requerido'),
  email: email,
  phone: phone,
  address: requiredString('La dirección es requerida'),
  city: requiredString('La ciudad es requerida'),
  state: requiredString('El estado es requerido'),
  zipCode: z.string().regex(/^\d{5}$/, 'El código postal debe tener 5 dígitos'),
  contactPerson: requiredString('La persona de contacto es requerida'),
  website: z.string().url('URL inválida').optional(),
  taxId: z.string().min(1, 'El RFC/ID fiscal es requerido'),
  paymentTerms: z.string().optional(),
  notes: z.string().optional(),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Order schema
export const orderSchema = z.object({
  clientId: requiredString('El cliente es requerido'),
  products: z.array(z.object({
    productId: requiredString('El producto es requerido'),
    quantity: positiveNumber('La cantidad debe ser mayor a 0'),
    price: positiveNumber('El precio debe ser mayor a 0'),
    discount: z.coerce.number().min(0).max(100, 'El descuento debe estar entre 0 y 100%').optional()
  })).min(1, 'Debe agregar al menos un producto'),
  deliveryDate: z.string().min(1, 'La fecha de entrega es requerida'),
  notes: z.string().optional(),
  shippingAddress: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit', 'transfer', 'check'], {
    errorMap: () => ({ message: 'Método de pago inválido' })
  }),
  status: z.enum(['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Quote schema
export const quoteSchema = z.object({
  clientId: requiredString('El cliente es requerido'),
  products: z.array(z.object({
    productId: requiredString('El producto es requerido'),
    quantity: positiveNumber('La cantidad debe ser mayor a 0'),
    price: positiveNumber('El precio debe ser mayor a 0'),
    discount: z.coerce.number().min(0).max(100, 'El descuento debe estar entre 0 y 100%').optional()
  })).min(1, 'Debe agregar al menos un producto'),
  validUntil: z.string().min(1, 'La fecha de vencimiento es requerida'),
  notes: z.string().optional(),
  terms: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit', 'transfer', 'check'], {
    errorMap: () => ({ message: 'Método de pago inválido' })
  }),
  status: z.enum(['draft', 'sent', 'accepted', 'rejected', 'expired'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Employee schema
export const employeeSchema = z.object({
  name: requiredString('El nombre es requerido'),
  email: email,
  phone: phone,
  position: requiredString('El puesto es requerido'),
  department: requiredString('El departamento es requerido'),
  salary: positiveNumber('El salario debe ser mayor a 0'),
  hireDate: z.string().min(1, 'La fecha de contratación es requerida'),
  address: requiredString('La dirección es requerida'),
  emergencyContact: z.object({
    name: requiredString('El nombre del contacto de emergencia es requerido'),
    phone: phone,
    relationship: requiredString('La relación es requerida')
  }),
  status: z.enum(['active', 'inactive'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Invoice schema
export const invoiceSchema = z.object({
  clientId: requiredString('El cliente es requerido'),
  products: z.array(z.object({
    productId: requiredString('El producto es requerido'),
    quantity: positiveNumber('La cantidad debe ser mayor a 0'),
    price: positiveNumber('El precio debe ser mayor a 0'),
    discount: z.coerce.number().min(0).max(100, 'El descuento debe estar entre 0 y 100%').optional()
  })).min(1, 'Debe agregar al menos un producto'),
  dueDate: z.string().min(1, 'La fecha de vencimiento es requerida'),
  notes: z.string().optional(),
  paymentMethod: z.enum(['cash', 'credit', 'transfer', 'check'], {
    errorMap: () => ({ message: 'Método de pago inválido' })
  }),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Maintenance schema
export const maintenanceSchema = z.object({
  clientId: requiredString('El cliente es requerido'),
  type: z.enum(['preventive', 'corrective', 'installation'], {
    errorMap: () => ({ message: 'Tipo de mantenimiento inválido' })
  }),
  description: requiredString('La descripción es requerida'),
  scheduledDate: z.string().min(1, 'La fecha programada es requerida'),
  estimatedHours: positiveNumber('Las horas estimadas deben ser mayor a 0'),
  assignedTechnician: requiredString('El técnico asignado es requerido'),
  equipment: z.string().optional(),
  priority: z.enum(['low', 'medium', 'high', 'urgent'], {
    errorMap: () => ({ message: 'Prioridad inválida' })
  }),
  cost: nonNegativeNumber('El costo no puede ser negativo'),
  notes: z.string().optional(),
  status: z.enum(['scheduled', 'in-progress', 'completed', 'cancelled'], {
    errorMap: () => ({ message: 'Estado inválido' })
  })
});

// Inventory movement schema
export const inventoryMovementSchema = z.object({
  productId: requiredString('El producto es requerido'),
  type: z.enum(['in', 'out', 'adjustment'], {
    errorMap: () => ({ message: 'Tipo de movimiento inválido' })
  }),
  quantity: positiveNumber('La cantidad debe ser mayor a 0'),
  reason: requiredString('La razón del movimiento es requerida'),
  reference: z.string().optional(),
  notes: z.string().optional()
});

// Login schema
export const loginSchema = z.object({
  email: email,
  password: z.string().min(6, 'La contraseña debe tener al menos 6 caracteres')
});

// Register schema
export const registerSchema = z.object({
  name: requiredString('El nombre es requerido'),
  email: email,
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Settings schemas
export const userSettingsSchema = z.object({
  name: requiredString('El nombre es requerido'),
  email: email,
  phone: phone,
  company: z.string().optional(),
  position: z.string().optional(),
  notifications: z.object({
    email: z.boolean(),
    push: z.boolean(),
    sms: z.boolean()
  }),
  preferences: z.object({
    language: z.enum(['es', 'en'], {
      errorMap: () => ({ message: 'Idioma inválido' })
    }),
    timezone: z.string(),
    dateFormat: z.enum(['DD/MM/YYYY', 'MM/DD/YYYY', 'YYYY-MM-DD'], {
      errorMap: () => ({ message: 'Formato de fecha inválido' })
    }),
    currency: z.enum(['MXN', 'USD'], {
      errorMap: () => ({ message: 'Moneda inválida' })
    })
  })
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'La contraseña actual es requerida'),
  newPassword: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.newPassword === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});

// Invitation schemas
export const createInvitationSchema = z.object({
  email: email,
  role: z.enum(['admin', 'manager', 'employee'], {
    errorMap: () => ({ message: 'Rol inválido' })
  }),
  message: z.string().optional()
});

export const acceptInvitationSchema = z.object({
  fullName: requiredString('El nombre completo es requerido'),
  password: z.string()
    .min(8, 'La contraseña debe tener al menos 8 caracteres')
    .regex(/^(?=.*[a-z])(?=.*[A-Z])(?=.*\d)/, 'La contraseña debe contener al menos una minúscula, una mayúscula y un número'),
  confirmPassword: z.string()
}).refine((data) => data.password === data.confirmPassword, {
  message: 'Las contraseñas no coinciden',
  path: ['confirmPassword']
});
