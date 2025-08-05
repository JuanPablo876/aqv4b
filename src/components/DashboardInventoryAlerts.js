import React, { useState } from 'react';
import VenetianTile from './VenetianTile';
import InventoryOrderButton from './InventoryOrderButton'; // Import the button
import { useNotifications } from '../hooks/useNotifications';

const DashboardInventoryAlerts = ({ alerts, onOrderFromInventory, onViewInventory }) => {
  const { 
    settings: notificationSettings, 
    checkLowStockNow,
    loading: notificationLoading 
  } = useNotifications();

  const handleCheckNow = async () => {
    try {
      const result = await checkLowStockNow();
      if (result.success) {
        alert('✅ Verificación de stock completada');
      } else {
        alert('❌ Error en verificación: ' + (result.error || 'Error desconocido'));
      }
    } catch (error) {
      alert('❌ Error: ' + error.message);
    }
  };

  return (
    <VenetianTile className="p-6 dark:border-dark-600 dark:bg-dark-700">
      {/* Header Section */}
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center space-x-3">
            <h3 className="text-primary font-semibold text-lg dark:text-dark-100">Alertas de Inventario</h3>
            {notificationSettings.enabled && (
              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800 border border-green-200 dark:bg-green-900/30 dark:text-green-400 dark:border-green-800">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-1.5"></span>
                Email Activo
              </span>
            )}
          </div>
          <button 
            className="text-sm text-muted-foreground hover:text-primary font-medium transition-colors dark:text-dark-300 dark:hover:text-dark-100"
            onClick={onViewInventory}
          >
            Ver inventario completo →
          </button>
        </div>
        
        {/* Action Buttons */}
        {alerts.length > 0 && (
          <div className="flex items-center space-x-2">
            <button 
              onClick={handleCheckNow}
              disabled={notificationLoading}
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium rounded-md bg-blue-50 text-blue-700 border border-blue-200 hover:bg-blue-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors dark:bg-gray-700 dark:text-blue-300 dark:border-gray-600 dark:hover:bg-gray-600"
            >
              <span className="mr-1.5">{notificationLoading ? '⏳' : '🔄'}</span>
              {notificationLoading ? 'Verificando...' : 'Verificar Ahora'}
            </button>
          </div>
        )}
      </div>
      
      {/* Alerts List */}
      <div className="space-y-3">
        {alerts.length === 0 ? (
          <div className="text-center py-8">
            <div className="w-16 h-16 mx-auto mb-4 bg-green-100 rounded-full flex items-center justify-center dark:bg-green-900/30">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-600 dark:text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <p className="text-muted-foreground text-sm dark:text-dark-300">No hay alertas de inventario</p>
            <p className="text-muted-foreground/70 text-xs mt-1 dark:text-dark-400">Todos los productos tienen stock adecuado</p>
          </div>
        ) : (
          alerts.map((alert) => (
            <div key={alert.id} className="flex items-center p-4 rounded-lg bg-card border border-border hover:shadow-sm transition-all dark:bg-dark-600 dark:border-dark-500">
              {/* Status Indicator */}
              <div className={`w-1 h-12 rounded-full mr-4 flex-shrink-0 ${
                alert.status === 'warning' ? 'bg-yellow-400 dark:bg-yellow-500' : 
                alert.status === 'critical' ? 'bg-red-400 dark:bg-red-500' : 
                'bg-green-400 dark:bg-green-500'
              }`}></div>
              
              <div className="flex-1 min-w-0">
                <p className="text-foreground text-sm font-semibold truncate dark:text-dark-100">{alert.name}</p>
                <div className="flex items-center mt-1.5 space-x-4">
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground font-medium dark:text-dark-300">Stock actual:</span>
                    <span className={`ml-1.5 text-xs font-bold ${
                      alert.status === 'critical' ? 'text-red-600 dark:text-red-400' : 
                      alert.status === 'warning' ? 'text-yellow-600 dark:text-yellow-400' : 'text-green-600 dark:text-green-400'
                    }`}>
                      {alert.stock}
                    </span>
                  </div>
                  <div className="flex items-center">
                    <span className="text-xs text-muted-foreground font-medium dark:text-dark-300">Mínimo:</span>
                    <span className="ml-1.5 text-xs text-foreground font-bold dark:text-dark-200">{alert.minStock}</span>
                  </div>
                  {alert.status === 'critical' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800 dark:bg-red-900/30 dark:text-red-400">
                      Sin Stock
                    </span>
                  )}
                  {alert.status === 'warning' && (
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400">
                      Stock Bajo
                    </span>
                  )}
                </div>
              </div>
              
              <div className="flex items-center space-x-2 ml-4">
                {alert.status === 'low' && (
                  <InventoryOrderButton product={alert} onOrder={onOrderFromInventory} />
                )}
                
                <button className="p-2 text-muted-foreground hover:text-primary hover:bg-accent rounded-md transition-colors dark:text-dark-300 dark:hover:text-dark-100 dark:hover:bg-dark-500">
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
                  </svg>
                </button>
              </div>
            </div>
          ))
        )}
      </div>
    </VenetianTile>
  );
};

export default DashboardInventoryAlerts;
