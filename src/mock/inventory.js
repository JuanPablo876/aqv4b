const inventory = [
  {
    id: '1',
    productId: '1',
    location: "Almacén Principal",
    quantity: 15,
    lastUpdated: "2024-07-18",
    notes: "Stock completo",
    // Enhanced fields
    warehouseCode: "ALM-PRIN-01",
    zone: "A",
    shelf: "A-15",
    minStock: 5,
    maxStock: 25,
    reorderPoint: 8,
    lastMovement: {
      type: "entrada",
      quantity: 5,
      date: "2024-07-15",
      reason: "Reposición regular",
      employeeId: '3'
    },
    movements: [
      { date: "2024-07-15", type: "entrada", quantity: 5, reason: "Reposición", balance: 15 },
      { date: "2024-07-10", type: "salida", quantity: 2, reason: "Venta", balance: 10 },
      { date: "2024-07-08", type: "entrada", quantity: 3, reason: "Ajuste inventario", balance: 12 }
    ],
    supplierLeadTime: 7,
    averageUsage: 2.5,
    seasonalFactor: 1.2,
    abc_classification: "A",
    createdAt: "2024-01-15T00:00:00.000Z",
    updatedAt: "2024-07-18T11:30:00.000Z"
  },
  {
    id: '2',
    productId: '2',
    location: "Almacén Principal",
    quantity: 8,
    lastUpdated: "2024-07-16",
    notes: "Pedido pendiente con proveedor",
    // Enhanced fields
    warehouseCode: "ALM-PRIN-01",
    zone: "B",
    shelf: "B-22",
    minStock: 3,
    maxStock: 15,
    reorderPoint: 5,
    lastMovement: {
      type: "salida",
      quantity: 2,
      date: "2024-07-16",
      reason: "Venta - Orden AQV-2024-002",
      employeeId: '3'
    },
    movements: [
      { date: "2024-07-16", type: "salida", quantity: 2, reason: "Venta", balance: 8 },
      { date: "2024-07-12", type: "entrada", quantity: 4, reason: "Recepción proveedor", balance: 10 },
      { date: "2024-07-09", type: "salida", quantity: 1, reason: "Muestra cliente", balance: 6 }
    ],
    supplierLeadTime: 5,
    averageUsage: 1.8,
    seasonalFactor: 1.0,
    abc_classification: "B",
    createdAt: "2024-01-20T00:00:00.000Z",
    updatedAt: "2024-07-16T16:45:00.000Z"
  },
  {
    id: '3',
    productId: '3',
    location: "Almacén Químicos",
    quantity: 25,
    lastUpdated: "2024-07-18",
    notes: "Almacenado en área segura - Control COFEPRIS",
    // Enhanced fields
    warehouseCode: "ALM-QUIM-01",
    zone: "QUIM-A",
    shelf: "QA-05",
    minStock: 10,
    maxStock: 50,
    reorderPoint: 15,
    lastMovement: {
      type: "entrada",
      quantity: 10,
      date: "2024-07-18",
      reason: "Reposición mensual",
      employeeId: '3'
    },
    movements: [
      { date: "2024-07-18", type: "entrada", quantity: 10, reason: "Reposición", balance: 25 },
      { date: "2024-07-14", type: "salida", quantity: 6, reason: "Venta masiva", balance: 15 },
      { date: "2024-07-10", type: "salida", quantity: 4, reason: "Distribución", balance: 21 }
    ],
    supplierLeadTime: 3,
    averageUsage: 8.2,
    seasonalFactor: 1.5,
    abc_classification: "A",
    specialHandling: "Material peligroso",
    expirationDate: "2027-07-18",
    batchNumber: "CHM-2024-078",
    createdAt: "2024-01-10T00:00:00.000Z",
    updatedAt: "2024-07-18T09:15:00.000Z"
  },
  {
    id: 4,
    productId: 4,
    location: "Showroom",
    quantity: 2,
    lastUpdated: "2023-11-05",
    notes: "3 unidades en almacén principal"
  },
  {
    id: 5,
    productId: 4,
    location: "Almacén Principal",
    quantity: 3,
    lastUpdated: "2023-11-05",
    notes: "Stock bajo, programar pedido"
  },
  {
    id: 6,
    productId: 5,
    location: "Almacén Químicos",
    quantity: 30,
    lastUpdated: "2023-11-15",
    notes: "Stock completo"
  },
  {
    id: 7,
    productId: 6,
    location: "Almacén Principal",
    quantity: 3,
    lastUpdated: "2023-11-02",
    notes: "Producto voluminoso, espacio limitado"
  },
  {
    id: 8,
    productId: 7,
    location: "Almacén Principal",
    quantity: 12,
    lastUpdated: "2023-11-10",
    notes: "Stock completo"
  },
  {
    id: 9,
    productId: 8,
    location: "Almacén Principal",
    quantity: 7,
    lastUpdated: "2023-11-07",
    notes: "Stock adecuado"
  },
  {
    id: 10,
    productId: 9,
    location: "Almacén Principal",
    quantity: 10,
    lastUpdated: "2023-11-09",
    notes: "Stock completo"
  },
  {
    id: 11,
    productId: 10,
    location: "Showroom",
    quantity: 2,
    lastUpdated: "2023-11-08",
    notes: "Muestra para demostración"
  },
  {
    id: 12,
    productId: 10,
    location: "Almacén Principal",
    quantity: 6,
    lastUpdated: "2023-11-08",
    notes: "Stock adecuado"
  }
];

export { inventory };
