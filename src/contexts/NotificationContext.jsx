import React, { createContext, useContext, useReducer, useCallback } from 'react';

// Notification types
export const NOTIFICATION_TYPES = {
  SUCCESS: 'success',
  ERROR: 'error',
  WARNING: 'warning',
  INFO: 'info',
  SYSTEM: 'system'
};

// Get persisted notifications from localStorage
const getPersistedNotifications = () => {
  try {
    const stored = localStorage.getItem('notifications');
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.warn('Error loading notifications from localStorage:', error);
    return [];
  }
};

// Save notifications to localStorage
const saveNotificationsToStorage = (notifications) => {
  try {
    localStorage.setItem('notifications', JSON.stringify(notifications));
  } catch (error) {
    console.warn('Error saving notifications to localStorage:', error);
  }
};

// Initial state
const initialState = {
  notifications: getPersistedNotifications(),
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
      
      const newStateAdd = {
        ...state,
        notifications: updatedNotifications
      };
      
      saveNotificationsToStorage(newStateAdd.notifications);
      return newStateAdd;
      
    case ACTIONS.REMOVE_NOTIFICATION:
      const newStateRemove = {
        ...state,
        notifications: state.notifications.filter(n => n.id !== action.payload)
      };
      
      saveNotificationsToStorage(newStateRemove.notifications);
      return newStateRemove;
      
    case ACTIONS.CLEAR_ALL:
      const newStateClear = {
        ...state,
        notifications: []
      };
      
      saveNotificationsToStorage(newStateClear.notifications);
      return newStateClear;
      
    case ACTIONS.MARK_AS_READ:
      const newStateRead = {
        ...state,
        notifications: state.notifications.map(n =>
          n.id === action.payload ? { ...n, read: true } : n
        )
      };
      
      saveNotificationsToStorage(newStateRead.notifications);
      return newStateRead;
      
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
