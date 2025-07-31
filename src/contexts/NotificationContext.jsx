import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SYSTEM: 'system'
};

// Initial state
const initialState = {
  notifications: [
    {
      id: 1,
      type: NOTIFICATION_TYPES.SUCCESS,
      title: "Sistema",
      message: "Nuevo pedido recibido #1085",
      timestamp: new Date(Date.now() - 5 * 60 * 1000), // 5 minutes ago
      read: false,
      persistent: false
    },
    {
      id: 2,
      type: NOTIFICATION_TYPES.WARNING,
      title: "Inventario",
      message: "Stock bajo de Cloro granulado",
      timestamp: new Date(Date.now() - 2 * 60 * 60 * 1000), // 2 hours ago
      read: false,
      persistent: false
    },
    {
      id: 3,
      type: NOTIFICATION_TYPES.INFO,
      title: "Ventas",
      message: "Cotización #1082 aprobada",
      timestamp: new Date(Date.now() - 5 * 60 * 60 * 1000), // 5 hours ago
      read: true,
      persistent: false
    }
  ],
  maxNotifications: 5,
  autoRemoveDelay: 5000
};

// Actions
const ACTIONS = {
  ADD_NOTIFICATION: 'ADD_NOTIFICATION',
  REMOVE_NOTIFICATION: 'REMOVE_NOTIFICATION',
  CLEAR_ALL: 'CLEAR_ALL',
  MARK_AS_READ: 'MARK_AS_READ'
};

// Reducer
const notificationReducer = (state, action) => {
  switch (action.type) {
    case ACTIONS.ADD_NOTIFICATION:
      const newNotification = {
        id: Date.now() + Math.random(),
        timestamp: new Date(),
        read: false,
        persistent: false,
        ...action.payload
      };
      
      const updatedNotifications = [newNotification, ...state.notifications];
      
      // Keep only max notifications
      if (updatedNotifications.length > state.maxNotifications) {
        updatedNotifications.splice(state.maxNotifications);
      }
      
      return {
        ...state,
        notifications: updatedNotifications
      };
      
    case ACTIONS.REMOVE_NOTIFICATION:
      return {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
    case ACTIONS.CLEAR_ALL:
      return {
        ...state,
        notifications: []
      };
      
    case ACTIONS.MARK_AS_READ:
      return {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
      
    default:
      return state;
  }
};

// Context
const NotificationContext = createContext();

// Provider component
export const NotificationProvider = ({ children }) => {
  const [state, dispatch] = useReducer(notificationReducer, initialState);

  // Add notification
  const addNotification = useCallback((message, type = NOTIFICATION_TYPES.INFO, options = {}) => {
    const notificationId = Date.now() + Math.random();
    
    dispatch({
      type: ACTIONS.ADD_NOTIFICATION,
      payload: {
        id: notificationId,
        message,
        type,
        title: options.title,
        persistent: options.persistent || false,
        actions: options.actions || [],
        metadata: options.metadata || {}
      }
    });

    // Auto-remove non-persistent notifications
    if (!options.persistent) {
      setTimeout(() => {
        dispatch({
          type: ACTIONS.REMOVE_NOTIFICATION,
          payload: notificationId
        });
      }, options.autoRemoveDelay || state.autoRemoveDelay);
    }

    return notificationId;
  }, [state.autoRemoveDelay]);

  // Remove notification
  const removeNotification = useCallback((id) => {
    dispatch({
      type: ACTIONS.REMOVE_NOTIFICATION,
      payload: id
    });
  }, []);

  // Clear all notifications
  const clearAll = useCallback(() => {
    dispatch({ type: ACTIONS.CLEAR_ALL });
  }, []);

  // Mark as read
  const markAsRead = useCallback((id) => {
    dispatch({
      type: ACTIONS.MARK_AS_READ,
      payload: id
    });
  }, []);

  // Convenience methods
  const notify = {
    success: (message, options) => addNotification(message, NOTIFICATION_TYPES.SUCCESS, options),
    error: (message, options) => addNotification(message, NOTIFICATION_TYPES.ERROR, { persistent: true, ...options }),
    warning: (message, options) => addNotification(message, NOTIFICATION_TYPES.WARNING, options),
    info: (message, options) => addNotification(message, NOTIFICATION_TYPES.INFO, options),
    system: (message, options) => addNotification(message, NOTIFICATION_TYPES.SYSTEM, { persistent: true, ...options })
  };

  const value = {
    notifications: state.notifications,
    addNotification,
    removeNotification,
    clearAll,
    markAsRead,
    notify,
    unreadCount: state.notifications.filter(n => !n.read).length
  };

  return (
    <NotificationContext.Provider value={value}>
      {children}
    </NotificationContext.Provider>
  );
};

// Hook to use notifications
export const useNotifications = () => {
  const context = useContext(NotificationContext);
  if (!context) {
    throw new Error('useNotifications must be used within a NotificationProvider');
  }
  return context;
};

export default NotificationContext;
