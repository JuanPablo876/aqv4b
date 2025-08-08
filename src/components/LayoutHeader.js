import React, { useState, useEffect, useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import { supabase } from '../supabaseClient';
import VenetianTile from './VenetianTile';
import ThemeToggle from './ThemeToggle';
import { useNotifications } from '../contexts/NotificationContext';
import NotificationDropdown from './NotificationDropdown';

const LayoutHeader = ({ title, session, setActivePage, onMobileMenuToggle, sidebarCollapsed }) => {
  const [showNotifications, setShowNotifications] = useState(false);
  const [showUserMenu, setShowUserMenu] = useState(false);
  const navigate = useNavigate();
  
  // Use the notification context
  const { notifications, unreadCount, markAsRead, deleteNotification, markAllAsRead, deleteAllNotifications } = useNotifications();
  
  const notificationsRef = useRef(null);
  const userMenuRef = useRef(null);
  
  // Extract user data from session
  const user = session?.user;
  const userEmail = user?.email || 'usuario@example.com';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  const userInitials = userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);

  const handleLogout = async () => {
    try {
      await supabase.auth.signOut();
      navigate('/login');
    } catch (error) {
      console.error('Error logging out:', error);
    }
  };

  const handleProfileClick = () => {
    if (setActivePage) {
      setActivePage('profile');
    }
    setShowUserMenu(false);
  };

  const handleSettingsClick = () => {
    if (setActivePage) {
      setActivePage('settings');
    }
    setShowUserMenu(false);
  };

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
    <header
      className={`h-14 sm:h-16 fixed top-0 right-0 left-0 z-30 header-bg venetian-shadow transition-all
        ${sidebarCollapsed ? 'sm:left-16' : 'sm:left-64'}`}
      style={{ borderBottom: '1px solid var(--venetian-border)' }}
    >
      <div className="h-full px-3 sm:px-6 flex items-center justify-between">
        <div className="flex items-center space-x-3">
          {/* Mobile menu button - only show on mobile */}
          <button
            onClick={onMobileMenuToggle}
            className="sm:hidden p-2 rounded-lg text-primary hover:bg-accent touch-target"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
          <h1 className="text-lg sm:text-2xl font-semibold text-primary truncate max-w-[150px] sm:max-w-none">{title}</h1>
        </div>
        
        <div className="flex items-center space-x-2 sm:space-x-4">
          <ThemeToggle />
          
          <div className="relative" ref={notificationsRef}>
            <button 
              onClick={toggleNotifications}
              className="p-2 rounded-full text-primary hover:bg-accent focus:outline-none transition-colors touch-target"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 sm:h-6 sm:w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
              </svg>
              {unreadCount > 0 && (
                <span className="absolute top-1 right-1 w-2 h-2 bg-red-500 rounded-full"></span>
              )}
            </button>
            
            {showNotifications && (
              <NotificationDropdown 
                isVisible={showNotifications} 
                onClose={() => setShowNotifications(false)} 
              />
            )}
          </div>
          
          <div className="relative" ref={userMenuRef}>
            <button 
              onClick={toggleUserMenu}
              className="flex items-center space-x-1 sm:space-x-2 focus:outline-none touch-target"
            >
              <div className="w-7 h-7 sm:w-8 sm:h-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-medium text-xs sm:text-sm">
                {userInitials}
              </div>
              <span className="text-primary text-sm sm:text-base hidden sm:inline">{userName}</span>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4 sm:h-5 sm:w-5 text-muted-foreground" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            </button>
            
            {showUserMenu && (
              <VenetianTile className="dropdown-menu w-40 sm:w-48 py-2 right-0">
                <button 
                  onClick={handleProfileClick}
                  className="block w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-primary hover:bg-accent focus:outline-none touch-target"
                >
                  Mi Perfil
                </button>
                <button 
                  onClick={handleSettingsClick}
                  className="block w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-primary hover:bg-accent focus:outline-none touch-target"
                >
                  Configuración
                </button>
                <div className="border-t venetian-border my-1"></div>
                <button 
                  onClick={handleLogout}
                  className="block w-full text-left px-3 sm:px-4 py-2 text-sm sm:text-base text-primary hover:bg-accent focus:outline-none touch-target"
                >
                  Cerrar Sesión
                </button>
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
