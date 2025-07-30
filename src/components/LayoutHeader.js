import React, { useState, useEffect, useRef } from 'react';
import VenetianTile from './VenetianTile';
import ThemeToggle from './ThemeToggle';

const LayoutHeader = ({ title }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  
  const notifications = [
    { id: 1, text: "Nuevo pedido recibido", time: "Hace 5 minutos", unread: true },
    { id: 2, text: "Stock bajo de Cloro granulado", time: "Hace 2 horas", unread: true },
    { id: 3, text: "Cotización #1082 aprobada", time: "Hace 5 horas", unread: false },
    { id: 4, text: "Recordatorio: Llamar a Hotel Acapulco", time: "Hace 1 día", unread: false }
  ];

  const toggleNotifications = () => {
    setShowNotifications(!showNotifications);
    if (showUserMenu) setShowUserMenu(false);
  };

  const toggleUserMenu = () => {
    setShowUserMenu(!showUserMenu);
    if (showNotifications) setShowNotifications(false);
  };
  
  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (notificationsRef.current && !notificationsRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
      if (userMenuRef.current && !userMenuRef.current.contains(event.target)) {
        setShowUserMenu(false);
      }
    };
    
    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  return (
    <header className="h-16 fixed top-0 right-0 left-64 z-10 header-bg venetian-shadow transition-colors" style={{
      borderBottom: '1px solid var(--venetian-border)'
    }}>
      <div className="h-full px-6 flex items-center justify-between">
        <h1 className="text-2xl font-semibold text-primary">{title}</h1>
        
        <div className="flex items-center space-x-4">
          <ThemeToggle />
          
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={toggleNotifications}
              className="p-2 rounded-full text-primary hover:bg-accent focus:outline-none transition-colors"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {notifications.some(n => n.unread) && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            {showNotifications && (
              <VenetianTile className="absolute right-0 mt-2 w-80 py-2 z-20">
                <div className="px-4 py-2 border-b venetian-border">
                  <div className="flex justify-between items-center">
                    <h3 className="font-medium text-primary">Notificaciones</h3>
                    <span className="text-xs text-muted-foreground font-medium cursor-pointer hover:text-primary">
                      Marcar todas como leídas
                    </span>
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {notifications.map(notification => (
                    <div 
                      key={notification.id} 
                      className={`px-4 py-3 hover:bg-accent cursor-pointer ${notification.unread ? 'bg-accent' : ''}`}
                    >
                      <div className="flex justify-between">
                        <p className={`text-sm ${notification.unread ? 'font-medium text-primary' : 'text-muted-foreground'}`}>
                          {notification.text}
                        </p>
                        {notification.unread && (
                          <span className="w-2 h-2 bg-primary rounded-full"></span>
                        )}
                      </div>
                      <p className="text-xs text-muted-foreground mt-1">{notification.time}</p>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t venetian-border">
                  <button className="text-sm text-center w-full text-primary hover:text-accent-foreground">
                    Ver todas las notificaciones
                  </button>
                </div>
              </VenetianTile>
            )}
          </div>
          
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={toggleUserMenu}
              className="flex items-center space-x-2 focus:outline-none"
            >
              <div className="w-8 h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium">
                A
              </div>
              <span className="text-primary">Admin</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showUserMenu && (
              <VenetianTile className="absolute right-0 mt-2 w-48 py-2 z-20">
                <a href="#profile" className="block px-4 py-2 text-primary hover:bg-accent">
                  Mi Perfil
                </a>
                <a href="#settings" className="block px-4 py-2 text-primary hover:bg-accent">
                  Configuración
                </a>
                <div className="border-t venetian-border my-1"></div>
                <a href="#logout" className="block px-4 py-2 text-primary hover:bg-accent">
                  Cerrar Sesión
                </a>
              </VenetianTile>
            )}
          </div>
        </div>
      </div>
    </header>
  );
};

export default LayoutHeader;
// DONE