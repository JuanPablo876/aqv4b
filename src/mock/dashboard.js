const dashboardData = {
  salesSummary: {
    daily: 18450.75,
    weekly: 125680.50,
    monthly: 489650.25, // July 2025 sales
    annual: 2935342.50, // Year to date (Jan-Jul 2025)
    comparedToPrevious: {
      daily: 8.5,
      weekly: 4.2,
      monthly: -6.9, // Down from June's high
      annual: 12.8
    }
  },
  topProducts: [
    { id: 4, name: "Limpiafondos automático Voyager", sales: 42500.00, units: 3 },
    { id: 1, name: "Bomba de filtración ProFlow 1.5HP", sales: 36799.92, units: 8 },
    { id: 6, name: "Calentador solar para alberca 4x10m", sales: 26999.97, units: 3 },
    { id: 10, name: "Iluminación LED RGB para alberca", sales: 22399.92, units: 8 },
    { id: 3, name: "Cloro granulado 50kg", sales: 19600.00, units: 8 }
  ],
  topClients: [
    { id: 5, name: "Parque Acuático Splash", purchases: 67890.50, orders: 3 },
    { id: 1, name: "Hotel Acapulco Resort", purchases: 45780.50, orders: 5 },
    { id: 2, name: "Club Deportivo Azteca", purchases: 32450.75, orders: 4 },
    { id: 4, name: "Spa Wellness Center", purchases: 27650.00, orders: 6 },
    { id: 8, name: "Condominio Vista Hermosa", purchases: 23450.00, orders: 2 }
  ],
  inventoryAlerts: [
    { id: 4, name: "Limpiafondos automático Voyager", stock: 5, minStock: 2, status: "warning" },
    { id: 6, name: "Calentador solar para alberca 4x10m", stock: 3, minStock: 2, status: "warning" },
    { id: 2, name: "Filtro de arena SandMaster 24\"", stock: 8, minStock: 3, status: "ok" }
  ],
  recentActivity: [
    { id: 1, type: "order", description: "Nuevo pedido #5 de Condominio Vista Hermosa", date: "2025-07-29T14:30:00", status: "pending" },
    { id: 2, type: "quote", description: "Cotización #4 aprobada por Spa Wellness Center", date: "2025-07-29T11:15:00", status: "approved" },
    { id: 3, type: "inventory", description: "Stock bajo de Limpiafondos automático Voyager", date: "2025-07-29T09:45:00", status: "alert" },
    { id: 4, type: "client", description: "Nuevo cliente registrado: Gimnasio Total Fitness", date: "2025-07-28T16:20:00", status: "info" },
    { id: 5, type: "payment", description: "Pago recibido de Hotel Acapulco Resort", date: "2025-07-28T14:10:00", status: "completed" }
  ],
  salesByMonth: [
    { month: "Ene", sales: 315250.75 },
    { month: "Feb", sales: 298450.50 },
    { month: "Mar", sales: 385780.25 },
    { month: "Abr", sales: 442150.00 },
    { month: "May", sales: 478320.50 },
    { month: "Jun", sales: 525890.75 },
    { month: "Jul", sales: 489650.25 },
  ],
  salesByCategory: [
    { category: "Bombas", percentage: 22 },
    { category: "Filtros", percentage: 18 },
    { category: "Químicos", percentage: 15 },
    { category: "Limpieza", percentage: 20 },
    { category: "Calentadores", percentage: 12 },
    { category: "Accesorios", percentage: 8 },
    { category: "Iluminación", percentage: 5 }
  ],
  pendingQuotes: 8,
  pendingOrders: 3,
  lowStockItems: 2
};

export { dashboardData };
