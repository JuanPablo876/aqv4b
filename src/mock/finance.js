const bankAccounts = [
  {
    id: 1,
    name: "Cuenta Principal Banamex",
    bank: "Banamex",
    accountNumber: "XXXX-XXXX-XXXX-1234",
    balance: 150000.75,
    currency: "MXN",
    status: "active"
  },
  {
    id: 2,
    name: "Cuenta de Ahorro BBVA",
    bank: "BBVA",
    accountNumber: "XXXX-XXXX-XXXX-5678",
    balance: 50000.00,
    currency: "MXN",
    status: "active"
  },
  {
    id: 3,
    name: "Cuenta Dólares Santander",
    bank: "Santander",
    accountNumber: "XXXX-XXXX-XXXX-9012",
    balance: 10000.50,
    currency: "USD",
    status: "active"
  }
];

const cashBoxes = [
  {
    id: 1,
    name: "Caja Chica Principal",
    responsible: "Ana López",
    balance: 2500.00,
    currency: "MXN",
    lastUpdated: "2023-11-17"
  },
  {
    id: 2,
    name: "Caja Chica Sucursal Guadalajara",
    responsible: "Luis Hernández",
    balance: 1500.00,
    currency: "MXN",
    lastUpdated: "2023-11-16"
  }
];

const transactions = [
  {
    id: 1,
    date: "2023-11-17",
    type: "income",
    category: "Venta",
    description: "Pago pedido #1",
    amount: 10000.00,
    currency: "MXN",
    source: "transfer",
    accountId: 1,
    cashBoxId: null,
    orderId: 1,
    notes: "Anticipo 50%"
  },
  {
    id: 2,
    date: "2023-11-16",
    type: "expense",
    category: "Gastos Operativos",
    description: "Compra de papelería",
    amount: 350.00,
    currency: "MXN",
    source: "cash",
    accountId: null,
    cashBoxId: 1,
    orderId: null,
    notes: "Factura #12345"
  },
  {
    id: 3,
    date: "2023-11-15",
    type: "income",
    category: "Venta",
    description: "Pago pedido #4",
    amount: 4871.97,
    currency: "MXN",
    source: "cash",
    accountId: null,
    cashBoxId: 1,
    orderId: 4,
    notes: "Venta mostrador"
  },
  {
    id: 4,
    date: "2023-11-14",
    type: "income",
    category: "Venta",
    description: "Pago pedido #2",
    amount: 63219.90,
    currency: "MXN",
    source: "credit_card",
    accountId: 1,
    cashBoxId: null,
    orderId: 2,
    notes: "Pago total"
  },
  {
    id: 5,
    date: "2023-11-10",
    type: "expense",
    category: "Proveedores",
    description: "Pago factura AquaTech",
    amount: 15000.00,
    currency: "MXN",
    source: "transfer",
    accountId: 1,
    cashBoxId: null,
    orderId: null,
    notes: "Factura #PROV-AT-987"
  }
];

export { bankAccounts, cashBoxes, transactions };