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
import InvitationManagement from './components/InvitationManagement';
import VenetianBackground from './components/VenetianBackground';
import ModuleSidebar from './components/ModuleSidebar';
import NotificationTestPanel from './components/NotificationTestPanel';
import { isStorageAvailable } from './utils/storage';
import { useDatabaseInit } from './hooks/useDatabaseInit';

export default function Dashboard() {
  const navigate = useNavigate();
  const { session } = useAuth();
  const [activePage, setActivePage] = useState('dashboard');
  const [sidebarCollapsed, setSidebarCollapsed] = useState(false);
  
  // Initialize database when dashboard loads
  const { isInitialized, isLoading, error } = useDatabaseInit();
  
  // Initialize modules with dev modules if in development
  const initializeModules = () => {
    const baseModules = []; // No hardcoded modules - only dev modules make sense here
    
    // Load persistent dev modules in development
    if (process.env.NODE_ENV === 'development') {
      try {
        const devModules = JSON.parse(localStorage.getItem('devModules') || '[]');
        console.log('🔧 DevTool: Loaded persistent dev modules:', devModules);
        return [...baseModules, ...devModules];
      } catch (error) {
        console.warn('⚠️ DevTool: Error loading dev modules:', error);
      }
    }
    
    return baseModules;
  };
  
  const [modules, setModules] = useState(initializeModules);
  
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
    if (process.env.NODE_ENV !== 'development') {
      alert('Esta función solo está disponible en modo desarrollo');
      return;
    }

    const newName = prompt('Nombre del nuevo módulo:');
    if (newName) {
      const newModule = { 
        name: newName, 
        description: 'Módulo de desarrollo personalizado',
        id: `dev-${newName.toLowerCase().replace(/\s+/g, '-')}`,
        isDevModule: true,
        createdAt: new Date().toISOString()
      };
      
      const updatedModules = [...modules, newModule];
      setModules(updatedModules);
      
      // Persist development modules in localStorage
      const devModules = updatedModules.filter(m => m.isDevModule);
      localStorage.setItem('devModules', JSON.stringify(devModules));
      
      console.log('🚀 DevTool: Módulo agregado:', newModule);
      alert(`✅ Módulo "${newName}" agregado exitosamente!\n\n🔧 Este módulo se mantendrá en localhost durante el desarrollo.`);
    }
  };

  const handleSidebarToggle = (collapsed) => {
    setSidebarCollapsed(collapsed);
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
    profile: 'Mi Perfil',
    invitations: 'Gestión de Invitaciones',
    diagnostics: 'Diagnósticos DB'
  };

  // Development utilities - available in browser console
  React.useEffect(() => {
    if (process.env.NODE_ENV === 'development') {
      window.devTools = {
        modules: {
          list: () => {
            console.log('📋 Current modules:', modules);
            return modules;
          },
          clearDev: () => {
            localStorage.removeItem('devModules');
            const baseModules = modules.filter(m => !m.isDevModule);
            setModules(baseModules);
            console.log('🧹 DevTool: All development modules cleared');
            alert('🧹 Todos los módulos de desarrollo fueron eliminados');
          },
          add: (name, description) => {
            if (!name) {
              console.warn('❌ Usage: devTools.modules.add("ModuleName", "Description")');
              return;
            }
            const newModule = { 
              name, 
              description: description || 'Módulo creado desde console',
              id: `dev-${name.toLowerCase().replace(/\s+/g, '-')}`,
              isDevModule: true,
              createdAt: new Date().toISOString()
            };
            const updatedModules = [...modules, newModule];
            setModules(updatedModules);
            const devModules = updatedModules.filter(m => m.isDevModule);
            localStorage.setItem('devModules', JSON.stringify(devModules));
            console.log('✅ DevTool: Module added via console:', newModule);
          }
        }
      };
      
      console.log(`
🔧 =================================
   DEVELOPMENT TOOLS AVAILABLE
=================================

📋 List modules:          devTools.modules.list()
➕ Add module:            devTools.modules.add("Name", "Description")  
🧹 Clear dev modules:     devTools.modules.clearDev()

Current dev modules: ${modules.filter(m => m.isDevModule).length}
      `);
    }
  }, [modules]);

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
        return <ClientsPage setActivePage={setActivePage} />;
      case 'products':
        return (
          <ProductsPage 
            showModal={showProductModal}
            setShowModal={setShowProductModal}
          />
        );
      case 'inventory':
        return (
          <InventoryPage 
            showModal={showInventoryModal}
            setShowModal={setShowInventoryModal}
          />
        );
      case 'quotes':
        return (
          <QuotesPage 
            showModal={showQuoteModal}
            setShowModal={setShowQuoteModal}
          />
        );
      case 'orders':
        return (
          <OrdersPage 
            selectedOrder={selectedOrder}
            setSelectedOrder={setSelectedOrder}
            showModal={showOrderModal}
            setShowModal={setShowOrderModal}
          />
        );
      case 'maintenances':
        return (
          <MaintenancesPage 
            selectedMaintenance={selectedMaintenance}
            setSelectedMaintenance={setSelectedMaintenance}
            showModal={showMaintenanceModal}
            setShowModal={setShowMaintenanceModal}
          />
        );
      case 'suppliers':
        return <SuppliersPage />;
      case 'employees':
        return <EmployeesPage />;
      case 'finance':
        return (
          <FinancePage 
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
      case 'invitations':
        return <InvitationManagement />;
      case 'diagnostics':
        return (
          <div className="p-6 max-w-4xl mx-auto">
            <div className="bg-green-50 border border-green-200 rounded-lg p-4 mb-4">
              <h2 className="text-green-800 font-bold">✅ Base de Datos Funcionando</h2>
              <p className="text-green-600">La conexión a la base de datos es exitosa.</p>
              <p className="text-sm text-green-600 mt-2">Puedes navegar a cualquier página para probar.</p>
            </div>
            
            {/* Notification Test Panel */}
            <NotificationTestPanel className="mt-4" />
          </div>
        );
      default:
        return (
          <div>
            <DashboardPage 
              setActivePage={setActivePage}
              setSelectedOrder={setSelectedOrder}
              setSelectedMaintenance={setSelectedMaintenance}
            />
            
            {/* Temporary Notification Test Panel - Only in Development */}
            {process.env.NODE_ENV === 'development' && (
              <div className="fixed bottom-4 left-4 z-40">
                <NotificationTestPanel />
              </div>
            )}
          </div>
        );
    }
  };

  return (
    <div className="h-screen overflow-hidden bg-background transition-colors">
      <VenetianBackground />
      
      {/* Show loading screen while database initializes */}
      {isLoading && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-4"></div>
            <h2 className="text-xl font-semibold text-gray-700">Inicializando base de datos...</h2>
            <p className="text-gray-500">Por favor espera un momento</p>
          </div>
        </div>
      )}
      
      {/* Show error screen if database initialization fails */}
      {error && (
        <div className="fixed inset-0 bg-background/80 backdrop-blur-sm z-50 flex items-center justify-center">
          <div className="text-center max-w-md mx-auto p-6">
            <div className="text-red-500 text-6xl mb-4">⚠️</div>
            <h2 className="text-xl font-semibold text-gray-700 mb-2">Error de conexión</h2>
            <p className="text-gray-600 mb-4">No se pudo conectar con la base de datos:</p>
            <p className="text-red-600 text-sm bg-red-50 p-3 rounded border">{error}</p>
            <button 
              onClick={() => window.location.reload()} 
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Reintentar
            </button>
          </div>
        </div>
      )}
      
      {/* Sidebar */}
      <LayoutSidebar 
        activePage={activePage} 
        setActivePage={setActivePage}
        onAddModule={handleAddModule}
        session={session}
        onSidebarToggle={handleSidebarToggle}
      />
      
      {/* Header */}
      <LayoutHeader 
        title={pageTitles[activePage]} 
        session={session} 
        setActivePage={setActivePage}
      />
      
      {/* Main Content */}
      <div className={`fixed top-16 right-0 bottom-0 overflow-auto transition-all duration-300 ${sidebarCollapsed ? 'left-16' : 'left-64'}`}>
        <div className="p-6 max-w-full content-wrapper">
          <div className="max-w-7xl mx-auto">
            {renderPageContent()}
          </div>
        </div>
      </div>
      
      {/* Module Sidebar (if needed) */}
      <ModuleSidebar modules={modules} onAddModule={handleAddModule} />
    </div>
  );
}