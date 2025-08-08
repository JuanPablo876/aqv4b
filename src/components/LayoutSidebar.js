import React, { Fragment, useState } from 'react';
import PropTypes from 'prop-types';
import { useRBAC } from '../hooks/useRBAC';

const LayoutSidebar = ({ activePage, setActivePage, session, onSidebarToggle, mobileMenuOpen }) => {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { isAdmin } = useRBAC();
  
  const toggleSidebar = () => {
    const newState = !isCollapsed;
    setIsCollapsed(newState);
    if (onSidebarToggle) {
      onSidebarToggle(newState);
    }
  };
  
  // Extract user data from session
  const user = session?.user;
  const userEmail = user?.email || 'usuario@example.com';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
  const userRole = user?.user_metadata?.role;

  // Filter menu items based on user role
  const isRoleAllowed = (requiredRoles) => {
    if (!requiredRoles) return true; // No role restriction
    return requiredRoles.includes(userRole);
  };

  // Filter menu items based on admin permissions
  const isItemAllowed = (item) => {
    // Check if item is admin-only
    if (item.adminOnly && !isAdmin()) {
      return false;
    }
    // Check role-based permissions
    return isRoleAllowed(item.roleRequired);
  };

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ) },
    { id: 'clients', label: 'Clientes', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
      </svg>
    ) },
    { id: 'products', label: 'Productos', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'inventory', label: 'Inventario', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'quotes', label: 'Cotizaciones', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4zm2 6a1 1 0 011-1h6a1 1 0 110 2H7a1 1 0 01-1-1zm1 3a1 1 0 100 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'orders', label: 'Pedidos', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M11 17a1 1 0 001.447.894l4-2A1 1 0 0017 15V9.236a1 1 0 00-1.447-.894l-4 2a1 1 0 00-.553.894V17zM15.211 6.276a1 1 0 000-1.788l-4.764-2.382a1 1 0 00-.894 0L4.789 4.488a1 1 0 000 1.788l4.764 2.382a1 1 0 00.894 0l4.764-2.382zM4.447 8.342A1 1 0 003 9.236V15a1 1 0 00.553.894l4 2A1 1 0 009 17v-5.764a1 1 0 00-.553-.894l-4-2z" />
      </svg>
    ) },  { id: 'maintenances', label: 'Mantenimientos', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.49 3.17c-.38-1.56-2.6-1.56-2.98 0a1.532 1.532 0 01-2.286.948c-1.372-.836-2.942.734-2.106 2.106.54.886.061 2.042-.947 2.287-1.561.379-1.561 2.6 0 2.978a1.532 1.532 0 01.947 2.287c-.836 1.372.734 2.942 2.106 2.106a1.532 1.532 0 012.287.947c.379 1.561 2.6 1.561 2.978 0a1.533 1.533 0 012.287-.947c1.372.836 2.942-.734 2.106-2.106a1.533 1.533 0 01.947-2.287c1.561-.379 1.561-2.6 0-2.978a1.532 1.532 0 01-.947-2.287c.836-1.372-.734-2.942-2.106-2.106a1.532 1.532 0 01-2.287-.947zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'suppliers', label: 'Proveedores', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
      </svg>
    ) },
    { id: 'employees', label: 'Empleados', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
      </svg>
    ) },
    { id: 'invitations', label: 'Invitaciones', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8 9a3 3 0 100-6 3 3 0 000 6zM8 11a6 6 0 016 6H2a6 6 0 016-6zM16 7a1 1 0 10-2 0v1h-1a1 1 0 100 2h1v1a1 1 0 102 0v-1h1a1 1 0 100-2h-1V7z" />
      </svg>
    ), roleRequired: ['admin', 'manager'] },
    { id: 'finance', label: 'Finanzas', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M8.433 7.418c.155-.103.346-.196.567-.267v1.698a2.305 2.305 0 01-.567-.267C8.07 8.34 8 8.114 8 8c0-.114.07-.34.433-.582zM11 12.849v-1.698c.22.071.412.164.567.267.364.243.433.468.433.582 0 .114-.07.34-.433.582a2.305 2.305 0 01-.567.267z" />
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-13a1 1 0 10-2 0v.092a4.535 4.535 0 00-1.676.662C6.602 6.234 6 7.009 6 8c0 .99.602 1.765 1.324 2.246.48.32 1.054.545 1.676.662v1.941c-.391-.127-.68-.317-.843-.504a1 1 0 10-1.51 1.31c.562.649 1.413 1.076 2.353 1.253V15a1 1 0 102 0v-.092a4.535 4.535 0 001.676-.662C13.398 13.766 14 12.991 14 12c0-.99-.602-1.765-1.324-2.246A4.535 4.535 0 0011 9.092V7.151c.391.127.68.317.843.504a1 1 0 101.511-1.31c-.563-.649-1.413-1.076-2.354-1.253V5z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'reports', label: 'Reportes', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M3 3a1 1 0 000 2v8a2 2 0 002 2h2.586l-1.293 1.293a1 1 0 101.414 1.414L10 15.414l2.293 2.293a1 1 0 001.414-1.414L12.414 15H15a2 2 0 002-2V5a1 1 0 100-2H3zm11.707 4.707a1 1 0 00-1.414-1.414L10 9.586 8.707 8.293a1 1 0 00-1.414 0l-2 2a1 1 0 101.414 1.414L8 10.414l1.293 1.293a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'reviews', label: 'Reseñas', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M18 13V5a2 2 0 00-2-2H4a2 2 0 00-2 2v8a2 2 0 002 2h3l3 3 3-3h3a2 2 0 002-2zM5 7a1 1 0 011-1h8a1 1 0 110 2H6a1 1 0 01-1-1zm1 3a1 1 0 100 2h3a1 1 0 100-2H6z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'audit', label: 'Auditoría', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M4 4a2 2 0 012-2h8a2 2 0 012 2v12a1 1 0 110 2h-3a1 1 0 01-1-1v-6a1 1 0 00-1-1H7a1 1 0 00-1 1v6a1 1 0 01-1 1H2a1 1 0 110-2V4zm3 8V8h2v4H7z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'roles', label: 'Roles', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v3h8v-3zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-3a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v3h-3zM4.75 12.094A5.973 5.973 0 004 15v3H1v-3a3 3 0 013.75-2.906z" />
      </svg>
    ), adminOnly: true },
    { id: 'notifications', label: 'Notificaciones', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M10 2a6 6 0 00-6 6v3.586l-.707.707A1 1 0 004 14h12a1 1 0 00.707-1.707L16 11.586V8a6 6 0 00-6-6zM10 18a3 3 0 01-3-3h6a3 3 0 01-3 3z" />
      </svg>
    ) },
    { id: 'settings', label: 'Configuración', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M11.3 1.046a1 1 0 011.4 0l2.598 2.598a1 1 0 010 1.4l-1.292 1.292a8.027 8.027 0 011.19 4.664 8.027 8.027 0 01-1.19 4.664l1.292 1.292a1 1 0 010 1.4l-2.598 2.598a1 1 0 01-1.4 0l-1.292-1.292a8.027 8.027 0 01-4.664 1.19 8.027 8.027 0 01-4.664-1.19L2.302 18.954a1 1 0 01-1.4-1.4l1.292-1.292a8.027 8.027 0 01-1.19-4.664 8.027 8.027 0 011.19-4.664L.902 5.044a1 1 0 010-1.4L3.5 1.046a1 1 0 011.4 0l1.292 1.292a8.027 8.027 0 014.664-1.19 8.027 8.027 0 014.664 1.19L11.3 1.046zM10 13a3 3 0 100-6 3 3 0 000 6z" clipRule="evenodd" />
      </svg>
    )},
  ];
  
  return (
    <div
      className={`fixed left-0 top-0 h-full z-50 sm:z-auto venetian-bg shadow-lg transition-all duration-300 flex flex-col
        ${isCollapsed ? 'sm:w-16' : 'sm:w-64'}
        w-64 sm:translate-x-0
        ${mobileMenuOpen ? 'translate-x-0' : '-translate-x-full sm:translate-x-0'}
      `}
      style={{ borderRight: '1px solid var(--venetian-border)' }}
    >
      {/* Header */}
      <div className="p-4 border-b venetian-border flex items-center space-x-2 flex-shrink-0">
        {!isCollapsed && (
          <>
            <div className="w-10 h-10 rounded-lg overflow-hidden">
              <img
                src="https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0c2ZYzyxLlIki8fCRNnvUyWdBhcZQKOVp6M0G"
                alt="Logo"
                className="w-full h-full object-cover"
              />
            </div>
            <h1 className="text-xl font-bold text-primary">Aqualiquim</h1>
          </>
        )}
        {isCollapsed && (
          <div className="w-8 h-8 rounded-lg overflow-hidden mx-auto">
            <img
              src="https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0c2ZYzyxLlIki8fCRNnvUyWdBhcZQKOVp6M0G"
              alt="Logo"
              className="w-full h-full object-cover"
            />
          </div>
        )}
      </div>

      {/* Toggle Button */}
      <div className="px-2 py-2 border-b venetian-border">
        <button
          onClick={toggleSidebar}
          className="w-full flex items-center justify-center px-2 py-2 text-primary hover:bg-secondary rounded-lg transition-colors"
          title={isCollapsed ? 'Expandir sidebar' : 'Contraer sidebar'}
        >
          <svg 
            xmlns="http://www.w3.org/2000/svg" 
            className={`h-5 w-5 transition-transform duration-300 ${isCollapsed ? 'rotate-180' : ''}`} 
            fill="none" 
            viewBox="0 0 24 24" 
            stroke="currentColor"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 19l-7-7 7-7m8 14l-7-7 7-7" />
          </svg>
          {!isCollapsed && <span className="ml-2 text-sm">Contraer</span>}
        </button>
      </div>

      {/* Menu Items - Scrollable */}
      <div className="flex-1 overflow-y-auto">
        <ul className="py-2">
          {menuItems
            .filter(item => isItemAllowed(item))
            .map((item) => (
            <Fragment key={item.id}>
              {item.id === 'reports' && (
                <hr className="my-2 border-t venetian-border" />
              )}
              <li className="mb-1">
                <button
                  onClick={() => setActivePage && setActivePage(item.id)}
                  className={`flex items-center w-full ${isCollapsed ? 'px-2 py-3 justify-center' : 'px-4 py-3'} text-left transition-colors ${
                    activePage === item.id
                      ? 'bg-accent text-accent-foreground border-r-4 border-primary'
                      : 'text-primary hover:bg-secondary'
                  }`}
                  title={isCollapsed ? item.label : ''}
                >
                  <span className={isCollapsed ? '' : 'mr-3'}>{item.icon}</span>
                  {!isCollapsed && item.label}
                </button>
              </li>
            </Fragment>
          ))}
        </ul>
      </div>

      {/* Account Section - Fixed at bottom */}
      <div className="border-t venetian-border p-4 flex items-center space-x-3 flex-shrink-0">
        {!isCollapsed && (
          <>
            <div className="bg-secondary text-secondary-foreground p-2 rounded-full">
              <div className="h-5 w-5 flex items-center justify-center font-medium text-xs">
                {userInitials}
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-sm font-medium text-primary truncate">{userName}</p>
              <p className="text-xs text-muted-foreground truncate">{userEmail}</p>
            </div>
          </>
        )}
        {isCollapsed && (
          <div className="bg-secondary text-secondary-foreground p-2 rounded-full mx-auto" title={`${userName} (${userEmail})`}>
            <div className="h-5 w-5 flex items-center justify-center font-medium text-xs">
              {userInitials}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

LayoutSidebar.propTypes = {
  activePage: PropTypes.string,
  setActivePage: PropTypes.func,
  session: PropTypes.object,
  onSidebarToggle: PropTypes.func,
  mobileMenuOpen: PropTypes.bool
};

export default LayoutSidebar;
