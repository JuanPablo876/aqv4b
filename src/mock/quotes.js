const quotes = [
  {
    id: 1,
    clientId: 1,
    date: "2023-11-10",
    validUntil: "2023-12-10",
    status: "pending",
    items: [
      { productId: 1, quantity: 2, price: 4599.99, discount: 200 },
      { productId: 2, quantity: 2, price: 3899.99, discount: 150 },
      { productId: 5, quantity: 5, price: 450.00, discount: 0 }
    ],
    subtotal: 17799.96,
    discount: 350,
    tax: 2791.99,
    total: 20241.95,
    notes: "Incluye instalación básica"
  },
  {
    id: 2,
    clientId: 5,
    date: "2023-11-12",
    validUntil: "2023-12-12",
    status: "approved",
    items: [
      { productId: 4, quantity: 3, price: 12999.99, discount: 1000 },
      { productId: 10, quantity: 6, price: 2799.99, discount: 300 }
    ],
    subtotal: 55799.91,
    discount: 1300,
    tax: 8719.99,
    total: 63219.90,
    notes: "Cliente requiere entrega urgente"
  },
  {
    id: 3,
    clientId: 2,
    date: "2023-11-08",
    validUntil: "2023-12-08",
    status: "rejected",
    items: [
      { productId: 6, quantity: 1, price: 8999.99, discount: 0 },
      { productId: 8, quantity: 2, price: 3299.99, discount: 100 }
    ],
    subtotal: 15599.97,
    discount: 100,
    tax: 2479.99,
    total: 17979.96,
    notes: "Cliente solicitó revisión de precios"
  },
  {
    id: 4,
    clientId: 4,
    date: "2023-11-15",
    validUntil: "2023-12-15",
    status: "pending",
    items: [
      { productId: 3, quantity: 2, price: 2450.00, discount: 0 },
      { productId: 5, quantity: 10, price: 450.00, discount: 200 },
      { productId: 7, quantity: 3, price: 899.99, discount: 0 }
    ],
    subtotal: 9599.97,
    discount: 200,
    tax: 1503.99,
    total: 10903.96,
    notes: "Cotización para mantenimiento trimestral"
  },
  {
    id: 5,
    clientId: 8,
    date: "2023-11-14",
    validUntil: "2023-12-14",
    status: "approved",
    items: [
      { productId: 9, quantity: 4, price: 1299.99, discount: 100 },
      { productId: 10, quantity: 4, price: 2799.99, discount: 200 }
    ],
    subtotal: 16399.92,
    discount: 300,
    tax: 2575.99,
    total: 18675.91,
    notes: "Incluye instalación programada para el 20/11"
  }
];

export { quotes };
