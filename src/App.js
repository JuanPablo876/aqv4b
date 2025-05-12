import React, { useState, useEffect } from 'react';
import LayoutSidebar from './components/LayoutSidebar';
import LayoutHeader from './components/LayoutHeader';
import VenetianBackground from './components/VenetianBackground';
import ModuleSidebar from './components/ModuleSidebar';

import DashboardPage from './components/DashboardPage';
import ClientsPage from './components/ClientsPage';
import ProductsPage from './components/ProductsPage';
import InventoryPage from './components/InventoryPage';
import QuotesPage from './components/QuotesPage';
import OrdersPage from './components/OrdersPage';
import MaintenancesPage from './components/MaintenancesPage';
import SuppliersPage from './components/SuppliersPage';
import EmployeesPage from './components/EmployeesPage';
import FinancePage from './components/FinancePage';
import ReportsPage from './components/ReportsPage';
import SettingsPage from './components/SettingsPage';

import { isStorageAvailable } from './utils/storage';
import { clients } from './mock/clients';
import { products } from './mock/products';
import { inventory } from './mock/inventory';
import { quotes } from './mock/quotes';
import { orders } from './mock/orders';
import { maintenances, maintenanceHistory } from './mock/maintenances';
import { suppliers } from './mock/suppliers';
import { employees } from './mock/employees';
import { bankAccounts, cashBoxes, transactions } from './mock/finance';

const App = () => {
  const [activePage, setActivePage] = useState('dashboard');
  const [modules, setModules] = useState([
    { name: 'Finanzas', description: 'Control financiero' },
    { name: 'Inventario', description: 'Gestión de inventario' },
    { name: 'Clientes', description: 'Gestión de clientes' },
  ]);

  const handleAddModule = () => {
    const newName = prompt('Nombre del nuevo módulo:');
    if (newName) {
      setModules(prev => [
        ...prev,
        { name: newName, description: 'Módulo personalizado' }
      ]);
    }
  };

  useEffect(() => {
    if (!isStorageAvailable()) return;

    const defaults = [
      { key: 'clients', value: clients },
      { key: 'products', value: products },
      { key: 'inventory', value: inventory },
      { key: 'quotes', value: quotes },
      { key: 'orders', value: orders },
      { key: 'maintenances', value: maintenances },
      { key: 'maintenanceHistory', value: maintenanceHistory },
      { key: 'suppliers', value: suppliers },
      { key: 'employees', value: employees },
      { key: 'bankAccounts', value: bankAccounts },
      { key: 'cashBoxes', value: cashBoxes },
      { key: 'transactions', value: transactions },
    ];

    defaults.forEach(({ key, value }) => {
      if (!localStorage.getItem(key)) {
        localStorage.setItem(key, JSON.stringify(value));
      }
    });
  }, []);

  const pageTitles = {
    dashboard: 'Dashboard',
    clients: 'Clientes',
    products: 'Productos',
    inventory: 'Inventario',
    quotes: 'Cotizaciones',
    orders: 'Pedidos',
    maintenances: 'Mantenimientos',
    suppliers: 'Proveedores',
    employees: 'Empleados',
    finance: 'Finanzas',
    reports: 'Reportes',
    settings: 'Configuración',
  };

  const getPageTitle = () => pageTitles[activePage] || 'Dashboard';

  const pageComponents = {
    dashboard: <DashboardPage setActivePage={setActivePage} />,
    clients: <ClientsPage />,
    products: <ProductsPage />,
    inventory: <InventoryPage />,
    quotes: <QuotesPage />,
    orders: <OrdersPage />,
    maintenances: <MaintenancesPage />,
    suppliers: <SuppliersPage />,
    employees: <EmployeesPage />,
    finance: <FinancePage />,
    reports: <ReportsPage />,
    settings: <SettingsPage />,
  };

  return (
    <VenetianBackground>
      <div className="flex h-screen">
        <LayoutSidebar 
          activePage={activePage} 
          setActivePage={setActivePage} 
          onAddModule={handleAddModule} 
        />

        <div className="flex flex-1 flex-col overflow-hidden">
          <LayoutHeader title={getPageTitle()} />
          <main className="flex-1 overflow-y-auto pt-16 pl-64 pr-64">
            {pageComponents[activePage] || <DashboardPage />}
          </main>
        </div>

        <ModuleSidebar modules={modules} onAddModule={handleAddModule} />
      </div>
    </VenetianBackground>
  );
};

export default App;
