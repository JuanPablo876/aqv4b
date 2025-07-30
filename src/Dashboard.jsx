import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from './AuthContext';
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
import UserProfilePage from './components/UserProfilePage';
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

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [modules, setModules] = useState([
    { name: 'Finanzas', description: 'Control financiero' },
    { name: 'Inventario', description: 'Gestión de inventario' },
    { name: 'Clientes', description: 'Gestión de clientes' }
  ]);
  
  // State for different pages
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [showMaintenanceModal, setShowMaintenanceModal] = useState(false);
  const [showQuoteModal, setShowQuoteModal] = useState(false);
  const [showProductModal, setShowProductModal] = useState(false);
  const [showInventoryModal, setShowInventoryModal] = useState(false);
  const [showFinanceModal, setShowFinanceModal] = useState(false);

  const handleAddModule = () => {
    const newName = prompt('Nombre del nuevo módulo:');
    if (newName) {
      setModules(prev => [...prev, { name: newName, description: 'Módulo personalizado' }]);
    }
  };

  // Page title mapping
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
    profile: 'Mi Perfil'
  };

  // Render page content based on active page
  const renderPageContent = () => {
    switch (activePage) {
      case 'dashboard':
        return (
          <DashboardPage 
            setActivePage={setActivePage}
            setSelectedOrder={setSelectedOrder}
            setSelectedMaintenance={setSelectedMaintenance}
          />
        );
      case 'clients':
        return <ClientsPage clients={clients} />;
      case 'products':
        return (
          <ProductsPage 
            products={products} 
            showModal={showProductModal}
            setShowModal={setShowProductModal}
          />
        );
      case 'inventory':
        return (
          <InventoryPage 
            inventory={inventory}
            showModal={showInventoryModal}
            setShowModal={setShowInventoryModal}
          />
        );
      case 'quotes':
        return (
          <QuotesPage 
            quotes={quotes}
            showModal={showQuoteModal}
            setShowModal={setShowQuoteModal}
          />
        );
      case 'orders':
        return (
          <OrdersPage 
            orders={orders}
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            showModal={showOrderModal}
            setShowModal={setShowOrderModal}
          />
        );
      case 'maintenances':
        return (
          <MaintenancesPage 
            maintenances={maintenances}
            maintenanceHistory={maintenanceHistory}
            selectedMaintenance={selectedMaintenance}
            setSelectedMaintenance={setSelectedMaintenance}
            showModal={showMaintenanceModal}
            setShowModal={setShowMaintenanceModal}
          />
        );
      case 'suppliers':
        return <SuppliersPage suppliers={suppliers} />;
      case 'employees':
        return <EmployeesPage employees={employees} />;
      case 'finance':
        return (
          <FinancePage 
            bankAccounts={bankAccounts}
            cashBoxes={cashBoxes}
            transactions={transactions}
            showModal={showFinanceModal}
            setShowModal={setShowFinanceModal}
          />
        );
      case 'reports':
        return <ReportsPage />;
      case 'settings':
        return <SettingsPage session={session} />;
      case 'profile':
        return <UserProfilePage session={session} />;
      default:
        return (
          <DashboardPage 
            setActivePage={setActivePage}
            setSelectedOrder={setSelectedOrder}
            setSelectedMaintenance={setSelectedMaintenance}
          />
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <VenetianBackground />
      
      {/* Sidebar */}
      <LayoutSidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        onAddModule={handleAddModule}
        session={session}
      />
      
      {/* Header */}
      <LayoutHeader 
        title={pageTitles[activePage]} 
        session={session} 
        setActivePage={setActivePage}
      />
      
      {/* Main Content */}
      <div className="fixed top-16 left-64 right-0 bottom-0 overflow-auto">
        <div className="p-6">
          {renderPageContent()}
        </div>
      </div>
      
      {/* Module Sidebar (if needed) */}
      <ModuleSidebar modules={modules} onAddModule={handleAddModule} />
    </div>
  );
}