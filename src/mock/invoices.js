const invoices = [
  {
    id: 1,
    orderId: 1, // Pedido #1
    clientId: 1, // Hotel Acapulco Resort
    rfc: "HAR123456ABC",
    razonSocial: "Hotel Acapulco Resort S.A. de C.V.",
    invoiceNumber: "F-0001",
    date: "2023-11-17",
    total: 20241.95,
    status: "paid",
    paymentMethod: "transfer",
    notes: "Factura por anticipo de pedido."
  },
  {
    id: 2,
    orderId: 2, // Pedido #2
    clientId: 5, // Parque Acuático Splash
    rfc: "PAS987654XYZ",
    razonSocial: "Parque Acuático Splash S. de R.L.",
    invoiceNumber: "F-0002",
    date: "2023-11-14",
    total: 63219.90,
    status: "paid",
    paymentMethod: "credit_card",
    notes: "Factura por pago total de pedido."
  },
  {
    id: 3,
    orderId: null, // No asociado a un pedido específico
    clientId: 4, // Spa Wellness Center
    rfc: "SWC112233DEF",
    razonSocial: "Spa Wellness Center S.A.",
    invoiceNumber: "N-0001", // Ejemplo de Nota de Venta
    date: "2023-11-15",
    total: 4871.97,
    status: "paid",
    paymentMethod: "cash",
    notes: "Nota de venta por compra en mostrador."
  },
  {
    id: 4,
    orderId: 3, // Pedido #3
    clientId: 8, // Condominio Vista Hermosa
    rfc: "CVH445566GHI",
    razonSocial: "Condominio Vista Hermosa A.C.",
    invoiceNumber: "F-0003",
    date: "2023-11-16",
    total: 18675.91,
    status: "pending",
    paymentMethod: "transfer",
    notes: "Factura pendiente de pago."
  }
];

export { invoices };
