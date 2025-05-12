import React, { useState, useEffect } from 'react';
import LayoutSidebar from './components/LayoutSidebar';
import LayoutHeader from './components/LayoutHeader';
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
import VenetianBackground from './components/VenetianBackground';
import ModuleSidebar from './components/ModuleSidebar';
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
      setModules([...modules, { name: newName, description: 'Módulo personalizado' }]);
    }
  };

  useEffect(() => {
    if (isStorageAvailable()) {
      if (!localStorage.getItem('clients')) localStorage.setItem('clients', JSON.stringify(clients));
      if (!localStorage.getItem('products')) localStorage.setItem('products', JSON.stringify(products));
      if (!localStorage.getItem('inventory')) localStorage.setItem('inventory', JSON.stringify(inventory));
      if (!localStorage.getItem('quotes')) localStorage.setItem('quotes', JSON.stringify(quotes));
      if (!localStorage.getItem('orders')) localStorage.setItem('orders', JSON.stringify(orders));
      if (!localStorage.getItem('maintenances')) localStorage.setItem('maintenances', JSON.stringify(maintenances));
      if (!localStorage.getItem('maintenanceHistory')) localStorage.setItem('maintenanceHistory', JSON.stringify(maintenanceHistory));
      if (!localStorage.getItem('suppliers')) localStorage.setItem('suppliers', JSON.stringify(suppliers));
      if (!localStorage.getItem('employees')) localStorage.setItem('employees', JSON.stringify(employees));
      if (!localStorage.getItem('bankAccounts')) localStorage.setItem('bankAccounts', JSON.stringify(bankAccounts));
      if (!localStorage.getItem('cashBoxes')) localStorage.setItem('cashBoxes', JSON.stringify(cashBoxes));
      if (!localStorage.getItem('transactions')) localStorage.setItem('transactions', JSON.stringify(transactions));
    }
  }, []);

  const getPageTitle = () => {
    switch (activePage) {
      case 'dashboard': return 'Dashboard';
      case 'clients': return 'Clientes';
      case 'products': return 'Productos';
      case 'inventory': return 'Inventario';
      case 'quotes': return 'Cotizaciones';
      case 'orders': return 'Pedidos';
      case 'maintenances': return 'Mantenimientos';
      case 'suppliers': return 'Proveedores';
      case 'employees': return 'Empleados';
      case 'finance': return 'Finanzas';
      case 'reports': return 'Reportes';
      case 'settings': return 'Configuración';
      default: return 'Dashboard';
    }
  };

  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard': return <DashboardPage setActivePage={setActivePage} />;
      case 'clients': return <ClientsPage />;
      case 'products': return <ProductsPage />;
      case 'inventory': return <InventoryPage />;
      case 'quotes': return <QuotesPage />;
      case 'orders': return <OrdersPage />;
      case 'maintenances': return <MaintenancesPage />;
      case 'suppliers': return <SuppliersPage />;
      case 'employees': return <EmployeesPage />;
      case 'finance': return <FinancePage />;
      case 'reports': return <ReportsPage />;
      case 'settings': return <SettingsPage />;
      default: return <DashboardPage />;
    }
  };

  return (
    <VenetianBackground>
      <div className="flex h-screen">
        {/* Lateral Sidebar */}
        <LayoutSidebar activePage={activePage} setActivePage={setActivePage} />

        {/* Contenido central */}
        <div className="flex flex-1 flex-col overflow-hidden">
          <LayoutHeader title={getPageTitle()} />
          <main className="flex-1 overflow-y-auto pt-16 pl-64 pr-60"> {/* 👈 le damos espacio al ModuleSidebar */}
            {renderPageContent()}
          </main>
        </div>

        {/* Module Sidebar */}
        <ModuleSidebar modules={modules} onAddModule={handleAddModule} />
      </div>
    </VenetianBackground>
  );
};

export default App;
