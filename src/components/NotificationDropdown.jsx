import React, { useState, useEffect, useRef } from 'react';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';

const NotificationDropdown = ({ isVisible, onClose }) => {
  const { notifications, removeNotification, markAsRead, clearAll } = useNotifications();
  const [showAll, setShowAll] = useState(false);
  const dropdownRef = useRef(null);
  const maxVisible = 3;

  const unreadNotifications = notifications.filter(n => !n.read);
  const visibleNotifications = showAll ? notifications : notifications.slice(0, maxVisible);
  const hasMoreNotifications = notifications.length > maxVisible;

  // Close dropdown when pressing Escape key
  useEffect(() => {
    const handleEscape = (event) => {
      if (event.key === 'Escape' && isVisible) {
        onClose();
      }
    };

    document.addEventListener('keydown', handleEscape);
    return () => document.removeEventListener('keydown', handleEscape);
  }, [isVisible, onClose]);

  const markAllAsRead = () => {
    unreadNotifications.forEach(notification => {
      markAsRead(notification.id);
    });
  };

  const getIconForType = (type) => {
    switch (type) {
      case NOTIFICATION_TYPES.SUCCESS:
        return (
          <svg className="w-5 h-5 text-green-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
          </svg>
        );
      case NOTIFICATION_TYPES.ERROR:
        return (
          <svg className="w-5 h-5 text-red-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
          </svg>
        );
      case NOTIFICATION_TYPES.WARNING:
        return (
          <svg className="w-5 h-5 text-yellow-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
          </svg>
        );
      case NOTIFICATION_TYPES.SYSTEM:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
      default:
        return (
          <svg className="w-5 h-5 text-blue-600" fill="currentColor" viewBox="0 0 20 20">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
          </svg>
        );
    }
  };

  if (!isVisible) {
    return null;
  }

  return (
    <div 
      ref={dropdownRef}
      className="absolute right-0 top-full mt-2 w-72 sm:w-80 max-w-[calc(100vw-2rem)] bg-background shadow-xl rounded-lg pointer-events-auto ring-1 ring-border overflow-hidden z-50 dark:bg-gray-800 dark:ring-gray-600"
    >
      {/* Header */}
      <div className="px-4 py-3 bg-muted border-b border-border dark:bg-gray-700 dark:border-gray-600">
        <div className="space-y-2">
          <div className="flex items-center justify-center">
            <h3 className="text-sm font-medium text-foreground dark:text-gray-200">
              Notificaciones {unreadNotifications.length > 0 && (
                <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 ml-2 dark:bg-blue-900 dark:text-blue-200">
                  {unreadNotifications.length}
                </span>
              )}
            </h3>
          </div>
          
          <div className="flex justify-center items-center space-x-3">
            {unreadNotifications.length > 0 && (
              <button
                onClick={markAllAsRead}
                className="inline-flex items-center px-3 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900"
                title="Marcar todas las notificaciones como leídas"
              >
                <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Leer todas
              </button>
            )}
            
            <button
              onClick={clearAll}
              className="inline-flex items-center px-3 py-1 text-xs font-medium text-red-600 hover:text-red-800 hover:bg-red-50 rounded-md border border-red-200 transition-colors dark:text-red-400 dark:border-red-600 dark:hover:bg-red-900"
              title="Eliminar todas las notificaciones"
            >
              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8 7a1 1 0 012 0v4a1 1 0 11-2 0V7zM12 7a1 1 0 012 0v4a1 1 0 11-2 0V7z" clipRule="evenodd" />
              </svg>
              Limpiar
            </button>
          </div>
        </div>
        
        {/* Show More/Less Toggle */}
        {hasMoreNotifications && (
          <div className="mt-2 flex justify-center">
            <button
              onClick={() => setShowAll(!showAll)}
              className="text-sm text-blue-600 hover:text-blue-800 hover:underline font-medium dark:text-blue-400 dark:hover:text-blue-300"
            >
              {showAll ? (
                <>
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M14.707 12.707a1 1 0 01-1.414 0L10 9.414l-3.293 3.293a1 1 0 01-1.414-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 010 1.414z" clipRule="evenodd" />
                  </svg>
                  Mostrar menos
                </>
              ) : (
                <>
                  <svg className="w-4 h-4 inline mr-1" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                  </svg>
                  Mostrar más ({notifications.length - maxVisible})
                </>
              )}
            </button>
          </div>
        )}
      </div>

      {/* Notifications List */}
      <div className="max-h-80 overflow-y-auto">
        {visibleNotifications.map((notification) => (
          <div
            key={notification.id}
            className={`px-4 py-3 border-b border-border last:border-b-0 ${
              notification.read ? 'bg-muted opacity-75 dark:bg-gray-700' : 'bg-background dark:bg-gray-800'
            } hover:bg-muted transition-colors dark:border-gray-600 dark:hover:bg-gray-700`}
          >
            <div className="flex items-start">
              <div className="flex-shrink-0 mr-3">
                {getIconForType(notification.type)}
              </div>
              
              <div className="flex-1 min-w-0">
                {notification.title && (
                  <p className={`text-sm font-medium ${notification.read ? 'text-muted-foreground' : 'text-foreground'} mb-1 dark:text-gray-200`}>
                    {notification.title}
                  </p>
                )}
                <p className={`text-xs ${notification.read ? 'text-muted-foreground' : 'text-muted-foreground'} mb-2 dark:text-gray-300`}>
                  {notification.message}
                </p>
                <div className="flex items-center justify-between">
                  <p className="text-xs text-muted-foreground dark:text-gray-400">
                    {new Date(notification.timestamp).toLocaleTimeString()}
                  </p>
                  
                  {/* Notification Actions */}
                  <div className="flex items-center space-x-2">
                    {!notification.read && (
                      <button
                        onClick={() => markAsRead(notification.id)}
                        className="inline-flex items-center px-2 py-1 text-xs font-medium text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded-md border border-blue-200 transition-colors dark:text-blue-400 dark:border-blue-600 dark:hover:bg-blue-900"
                        title="Marcar como leída"
                      >
                        <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                        </svg>
                        Leer
                      </button>
                    )}
                    
                    {/* Delete button */}
                    <button
                      onClick={() => removeNotification(notification.id)}
                      className="p-1 text-muted-foreground hover:text-red-600 hover:bg-red-50 rounded-md transition-colors dark:text-gray-400 dark:hover:text-red-400 dark:hover:bg-red-900"
                      title="Eliminar notificación"
                    >
                      <svg className="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Empty State */}
      {notifications.length === 0 && (
        <div className="px-4 py-6 text-center">
          <svg className="w-10 h-10 mx-auto text-muted-foreground mb-3 dark:text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
          </svg>
          <p className="text-sm text-muted-foreground dark:text-gray-400">No hay notificaciones</p>
        </div>
      )}
    </div>
  );
};

export default NotificationDropdown;
