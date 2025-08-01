import React from 'react';
import { useNotifications, NOTIFICATION_TYPES } from '../contexts/NotificationContext';

const NotificationTestButton = () => {
  const { addNotification } = useNotifications();

  const addTestNotifications = () => {
    addNotification('Prueba de notificación de éxito', NOTIFICATION_TYPES.SUCCESS, {
      title: 'Sistema',
      persistent: false
    });
    
    setTimeout(() => {
      addNotification('Prueba de notificación de advertencia', NOTIFICATION_TYPES.WARNING, {
        title: 'Inventario',
        persistent: false
      });
    }, 1000);
    
    setTimeout(() => {
      addNotification('Prueba de notificación de error', NOTIFICATION_TYPES.ERROR, {
        title: 'Error',
        persistent: true
      });
    }, 2000);
  };

  return (
    <button
      onClick={addTestNotifications}
      className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
    >
      Probar Notificaciones
    </button>
  );
};

export default NotificationTestButton;
