const maintenances = [
  {
    id: 1,
    clientId: 1, // Hotel Acapulco Resort
    address: "Av. Costera 234, Acapulco",
    googleMapsLink: "https://maps.google.com/?q=Av.+Costera+234,+Acapulco",
    serviceType: "Mantenimiento Semanal",
    frequency: "Semanal",
    lastServiceDate: "2023-11-15",
    lastServiceEmployeeId: 2, // María García
    status: "active",
    notes: "Incluye limpieza de fondo, paredes y revisión de químicos."
  },
  {
    id: 2,
    clientId: 4, // Spa Wellness Center
    address: "Av. Reforma 567, CDMX",
    googleMapsLink: "https://maps.google.com/?q=Av.+Reforma+567,+CDMX",
    serviceType: "Mantenimiento Quincenal",
    frequency: "Quincenal",
    lastServiceDate: "2023-11-10",
    lastServiceEmployeeId: 1, // Juan Pérez
    status: "active",
    notes: "Servicio completo de spa, incluyendo jacuzzi."
  },
  {
    id: 3,
    clientId: 8, // Condominio Vista Hermosa
    address: "Paseo de las Palmas 67, Querétaro",
    googleMapsLink: "https://maps.google.com/?q=Paseo+de+las+Palmas+67,+Quer%C3%A9taro",
    serviceType: "Mantenimiento Mensual",
    frequency: "Mensual",
    lastServiceDate: "2023-11-01",
    lastServiceEmployeeId: 2, // María García
    status: "active",
    notes: "Revisión de equipos y limpieza general."
  },
  {
    id: 4,
    clientId: 2, // Club Deportivo Azteca
    address: "Blvd. de los Deportes 45, CDMX",
    googleMapsLink: "https://maps.google.com/?q=Blvd.+de+los+Deportes+45,+CDMX",
    serviceType: "Mantenimiento Correctivo",
    frequency: "Bajo Demanda",
    lastServiceDate: "2023-10-28",
    lastServiceEmployeeId: 1, // Juan Pérez
    status: "completed",
    notes: "Reparación de fuga en tubería."
  },
  {
    id: 5,
    clientId: 1, // Hotel Acapulco Resort
    address: "Av. Costera 234, Acapulco",
    googleMapsLink: "https://maps.google.com/?q=Av.+Costera+234,+Acapulco",
    serviceType: "Mantenimiento Semanal",
    frequency: "Semanal",
    lastServiceDate: "2023-11-08",
    lastServiceEmployeeId: 2, // María García
    status: "completed",
    notes: "Mantenimiento de rutina."
  }
];

const maintenanceHistory = [
  {
    id: 1,
    maintenanceId: 1,
    date: "2023-11-15",
    employeeId: 2,
    serviceDetails: "Limpieza completa, químicos ajustados.",
    paymentStatus: "paid",
    amount: 1500.00,
    notes: "Todo en orden."
  },
  {
    id: 2,
    maintenanceId: 1,
    date: "2023-11-08",
    employeeId: 2,
    serviceDetails: "Limpieza de rutina.",
    paymentStatus: "paid",
    amount: 1500.00,
    notes: "Sin novedades."
  },
  {
    id: 3,
    maintenanceId: 2,
    date: "2023-11-10",
    employeeId: 1,
    serviceDetails: "Revisión de filtros y químicos.",
    paymentStatus: "pending",
    amount: 1200.00,
    notes: "Pendiente de pago."
  },
  {
    id: 4,
    maintenanceId: 3,
    date: "2023-11-01",
    employeeId: 2,
    serviceDetails: "Mantenimiento mensual estándar.",
    paymentStatus: "paid",
    amount: 2000.00,
    notes: "Cliente satisfecho."
  },
  {
    id: 5,
    maintenanceId: 4,
    date: "2023-10-28",
    employeeId: 1,
    serviceDetails: "Reparación de fuga en tubería principal.",
    paymentStatus: "paid",
    amount: 5500.00,
    notes: "Fuga reparada con éxito."
  }
];

export { maintenances, maintenanceHistory };
