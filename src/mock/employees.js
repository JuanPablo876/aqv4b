const employees = [
  {
    id: '1',
    name: "Juan Pérez",
    role: "Vendedor",
    email: "juan.perez@aquapool.com",
    phone: "555-111-2222",
    hireDate: "2020-01-15",
    status: "active",
    address: "Calle Falsa 123, Col. Centro, CDMX",
    googleMapsLink: "https://maps.google.com/?q=Calle+Falsa+123,+Col.+Centro,+CDMX",
    // Enhanced fields
    employeeNumber: "EMP-001",
    department: "Ventas",
    supervisor: "Carlos Mendoza",
    salary: 25000,
    commissionRate: 0.05,
    birthDate: "1985-03-12",
    emergencyContact: {
      name: "Rosa Pérez",
      relationship: "Esposa",
      phone: "555-111-3333"
    },
    skills: ["Ventas", "Atención al cliente", "Productos químicos"],
    territory: "CDMX Norte",
    salesTarget: 150000,
    performanceRating: 4.2,
    lastReview: "2024-01-15",
    nextReview: "2025-01-15",
    vacation: {
      totalDays: 15,
      usedDays: 8,
      remainingDays: 7
    },
    createdAt: "2020-01-15T00:00:00.000Z",
    updatedAt: "2024-07-01T10:30:00.000Z"
  },
  {
    id: '2',
    name: "María García",
    role: "Técnico de Instalación",
    email: "maria.garcia@aquapool.com",
    phone: "555-333-4444",
    hireDate: "2019-05-20",
    status: "active",
    address: "Av. Siempre Viva 45, Col. Jardines, Guadalajara",
    googleMapsLink: "https://maps.google.com/?q=Av.+Siempre+Viva+45,+Col.+Jardines,+Guadalajara",
    // Enhanced fields
    employeeNumber: "EMP-002",
    department: "Servicios Técnicos",
    supervisor: "Pedro Rodríguez",
    salary: 22000,
    commissionRate: 0.02,
    birthDate: "1992-08-15",
    emergencyContact: {
      name: "Carlos García",
      relationship: "Hermano",
      phone: "555-333-5555"
    },
    skills: ["Instalación", "Mantenimiento", "Sistemas de filtración", "Electricidad básica"],
    territory: "Guadalajara y zona metropolitana",
    certifications: ["Técnico en piscinas", "Primeros auxilios"],
    toolsAssigned: ["Kit instalación", "Multímetro", "Herramientas básicas"],
    performanceRating: 4.5,
    lastReview: "2024-05-20",
    nextReview: "2025-05-20",
    vacation: {
      totalDays: 12,
      usedDays: 5,
      remainingDays: 7
    },
    createdAt: "2019-05-20T00:00:00.000Z",
    updatedAt: "2024-06-15T14:20:00.000Z"
  },
  {
    id: '3',
    name: "Pedro Rodríguez",
    role: "Almacenista",
    email: "pedro.rodriguez@aquapool.com",
    phone: "555-555-6666",
    hireDate: "2021-11-10",
    status: "active",
    address: "Blvd. del Almacén 789, Zona Industrial, Monterrey",
    googleMapsLink: "https://maps.google.com/?q=Blvd.+del+Almacén+789,+Zona+Industrial,+Monterrey",
    // Enhanced fields
    employeeNumber: "EMP-003",
    department: "Almacén y Logística",
    supervisor: "Ana López",
    salary: 18000,
    commissionRate: 0,
    birthDate: "1988-11-25",
    emergencyContact: {
      name: "Lucia Rodríguez",
      relationship: "Madre",
      phone: "555-555-7777"
    },
    skills: ["Inventarios", "Logística", "Manejo de montacargas", "Sistemas WMS"],
    territory: "Almacén Monterrey",
    certifications: ["Operador montacargas", "Manejo materiales peligrosos"],
    shiftSchedule: "Lunes a Viernes 7:00-15:00",
    performanceRating: 4.0,
    lastReview: "2023-11-10",
    nextReview: "2024-11-10",
    vacation: {
      totalDays: 8,
      usedDays: 3,
      remainingDays: 5
    },
    createdAt: "2021-11-10T00:00:00.000Z",
    updatedAt: "2024-05-20T09:15:00.000Z"
  },
  {
    id: 4,
    name: "Ana López",
    role: "Administración",
    email: "ana.lopez@aquapool.com",
    phone: "555-777-8888",
    hireDate: "2018-08-01",
    status: "active",
    address: "Calle de la Oficina 10, Col. Centro, CDMX",
    googleMapsLink: "https://maps.google.com/?q=Calle+de+la+Oficina+10,+Col.+Centro,+CDMX"
  },
  {
    id: 5,
    name: "Luis Hernández",
    role: "Vendedor",
    email: "luis.hernandez@aquapool.com",
    phone: "555-999-0000",
    hireDate: "2022-03-15",
    status: "inactive",
    address: "Av. Comercial 567, Plaza del Sol, Guadalajara",
    googleMapsLink: "https://maps.google.com/?q=Av.+Comercial+567,+Plaza+del+Sol,+Guadalajara"
  }
];

export { employees };