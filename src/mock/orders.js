const orders = [
  {
    id: 1,
    clientId: 1,
    quoteId: 1,
    date: "2023-11-15",
    status: "processing",
    paymentStatus: "partial",
    paymentMethod: "transfer",
    items: [
      { productId: 1, quantity: 2, price: 4599.99, discount: 200 },
      { productId: 2, quantity: 2, price: 3899.99, discount: 150 },
      { productId: 5, quantity: 5, price: 450.00, discount: 0 }
    ],
    subtotal: 17799.96,
    discount: 350,
    tax: 2791.99,
    total: 20241.95,
    amountPaid: 10000.00,
    balance: 10241.95,
    notes: "Anticipo del 50% recibido. Entrega programada para el 20/11",
    delivery: {
      employeeId: 2, // Maria Garcia
      date: "2023-11-20",
      time: "10:00 - 12:00",
      address: "Av. Costera 234, Acapulco",
      googleMapsLink: "https://maps.google.com/?q=Av.+Costera+234,+Acapulco"
    }
  },
  {
    id: 2,
    clientId: 5,
    quoteId: 2,
    date: "2023-11-14",
    status: "shipped",
    paymentStatus: "paid",
    paymentMethod: "credit_card",
    items: [
      { productId: 4, quantity: 3, price: 12999.99, discount: 1000 },
      { productId: 10, quantity: 6, price: 2799.99, discount: 300 }
    ],
    subtotal: 55799.91,
    discount: 1300,
    tax: 8719.99,
    total: 63219.90,
    amountPaid: 63219.90,
    balance: 0,
    notes: "Entrega realizada el 16/11. Cliente confirmó recepción.",
    delivery: {
      employeeId: 2, // Maria Garcia
      date: "2023-11-16",
      time: "14:00 - 16:00",
      address: "Carretera Costera 890, Cancún",
      googleMapsLink: "https://maps.google.com/?q=Carretera+Costera+890,+Canc%C3%BAn"
    }
  },
  {
    id: 3,
    clientId: 8,
    quoteId: 5,
    date: "2023-11-16",
    status: "pending",
    paymentStatus: "pending",
    paymentMethod: "transfer",
    items: [
      { productId: 9, quantity: 4, price: 1299.99, discount: 100 },
      { productId: 10, quantity: 4, price: 2799.99, discount: 200 }
    ],
    subtotal: 16399.92,
    discount: 300,
    tax: 2575.99,
    total: 18675.91,
    amountPaid: 0,
    balance: 18675.91,
    notes: "Esperando confirmación de pago para procesar",
    delivery: {
      employeeId: 1, // Juan Perez
      date: "2023-11-20",
      time: "09:00 - 11:00",
      address: "Paseo de las Palmas 67, Querétaro",
      googleMapsLink: "https://maps.google.com/?q=Paseo+de+las+Palmas+67,+Quer%C3%A9taro"
    }
  },
  {
    id: 4,
    clientId: 4,
    quoteId: null,
    date: "2023-11-10",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "cash",
    items: [
      { productId: 3, quantity: 1, price: 2450.00, discount: 0 },
      { productId: 7, quantity: 2, price: 899.99, discount: 50 }
    ],
    subtotal: 4249.98,
    discount: 50,
    tax: 671.99,
    total: 4871.97,
    amountPaid: 4871.97,
    balance: 0,
    notes: "Venta directa en tienda",
    delivery: null // Mostrador
  },
  {
    id: 5,
    clientId: 2,
    quoteId: null,
    date: "2023-11-05",
    status: "completed",
    paymentStatus: "paid",
    paymentMethod: "transfer",
    items: [
      { productId: 5, quantity: 8, price: 450.00, discount: 100 },
      { productId: 3, quantity: 1, price: 2450.00, discount: 0 }
    ],
    subtotal: 6050.00,
    discount: 100,
    tax: 950.00,
    total: 6900.00,
    amountPaid: 6900.00,
    balance: 0,
    notes: "Pedido mensual de mantenimiento",
    delivery: {
      employeeId: 1, // Juan Perez
      date: "2023-11-06",
      time: "09:00 - 10:00",
      address: "Blvd. de los Deportes 45, CDMX",
      googleMapsLink: "https://maps.google.com/?q=Blvd.+de+los+Deportes+45,+CDMX"
    }
  }
];

export { orders };