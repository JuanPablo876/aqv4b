import React from 'react';
import { useNotifications } from '../contexts/NotificationContext';

const NotificationTestPanel = ({ className = "" }) => {
  const { notify } = useNotifications();

  const testNotifications = () => {
    // Test different types of notifications
    notify.success("¡Operación completada exitosamente!", {
      title: "Éxito",
      autoRemoveDelay: 5000
    });

    setTimeout(() => {
      notify.warning("El stock está bajo para algunos productos", {
        title: "Alerta de Inventario",
        persistent: true,
        actions: [
          {
            label: "Ver Inventario",
            primary: true,
            handler: () => console.log("Navigating to inventory...")
          },
          {
            label: "Más tarde",
            handler: () => console.log("Dismissed warning")
          }
        ]
      });
    }, 1000);

    setTimeout(() => {
      notify.error("Error al procesar el pedido #1234", {
        title: "Error del Sistema",
        persistent: true,
        actions: [
          {
            label: "Reintentar",
            primary: true,
            handler: () => console.log("Retrying operation...")
          }
        ]
      });
    }, 2000);

    setTimeout(() => {
      notify.info("Nueva actualización disponible", {
        title: "Información",
        actions: [
          {
            label: "Actualizar",
            primary: true,
            handler: () => console.log("Updating app...")
          }
        ]
      });
    }, 3000);

    setTimeout(() => {
      notify.system("Mantenimiento programado para mañana a las 2:00 AM", {
        title: "Mantenimiento del Sistema",
        persistent: true
      });
    }, 4000);
  };

  return (
    <div className={`bg-white rounded-lg shadow p-4 ${className}`}>
      <h3 className="text-lg font-medium text-gray-900 mb-4">Test de Notificaciones</h3>
      <div className="space-y-3">
        <button
          onClick={testNotifications}
          className="w-full bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700 transition-colors"
        >
          Probar Notificaciones
        </button>
        
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => notify.success("Producto guardado")}
            className="bg-green-600 text-white px-3 py-1 rounded text-sm hover:bg-green-700"
          >
            Éxito
          </button>
          
          <button
            onClick={() => notify.error("Error de conexión")}
            className="bg-red-600 text-white px-3 py-1 rounded text-sm hover:bg-red-700"
          >
            Error
          </button>
          
          <button
            onClick={() => notify.warning("Stock bajo")}
            className="bg-yellow-600 text-white px-3 py-1 rounded text-sm hover:bg-yellow-700"
          >
            Advertencia
          </button>
          
          <button
            onClick={() => notify.info("Nueva función disponible")}
            className="bg-blue-600 text-white px-3 py-1 rounded text-sm hover:bg-blue-700"
          >
            Info
          </button>
        </div>
        
        <div className="text-xs text-gray-500 mt-2">
          • Las notificaciones muestran botones de "Leída" y "Eliminar"<br/>
          • El header tiene controles para "Marcar todas como leídas" y "Eliminar todas"<br/>
          • Se muestran máximo 3 notificaciones inicialmente con opción "Ver más"<br/>
          • Las notificaciones leídas aparecen con menor opacidad
        </div>
      </div>
    </div>
  );
};

export default NotificationTestPanel;
