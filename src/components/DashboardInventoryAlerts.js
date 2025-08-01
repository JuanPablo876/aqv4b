import React from 'react';
import VenetianTile from './VenetianTile';
import InventoryOrderButton from './InventoryOrderButton'; // Import the button

const DashboardInventoryAlerts = ({ alerts, onOrderFromInventory, onViewInventory }) => {
  return (
    <VenetianTile className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-blue-800 font-medium">Alertas de Inventario</h3>
        <button 
          className="text-sm text-blue-600 hover:text-blue-800"
          onClick={onViewInventory}
        >
          Ver inventario
        </button>
      </div>
      
      <div className="space-y-3">
        {alerts.map((alert) => (
          <div key={alert.id} className="flex items-center p-3 rounded-lg bg-blue-50">
            <div className={`w-2 h-10 rounded-full mr-3 ${
              alert.status === 'warning' ? 'bg-yellow-500' : 
              alert.status === 'critical' ? 'bg-red-500' : 'bg-green-500'
            }`}></div>
            
            <div className="flex-1">
              <p className="text-blue-800 text-sm font-medium">{alert.name}</p>
              <div className="flex items-center mt-1">
                <span className="text-xs text-blue-600">Stock: {alert.stock}</span>
                <span className="mx-2 text-blue-300">|</span>
                <span className="text-xs text-blue-600">Mínimo: {alert.minStock}</span>
              </div>
            </div>
            
            {alert.status === 'low' && (
              <InventoryOrderButton product={alert} onOrder={onOrderFromInventory} />
            )}
            
            <button className="text-blue-600 hover:text-blue-800 ml-2">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                <path d="M5 3a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2V5a2 2 0 00-2-2H5zM5 11a2 2 0 00-2 2v2a2 2 0 002 2h2a2 2 0 002-2v-2a2 2 0 00-2-2H5zM11 5a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V5zM14 11a1 1 0 011 1v1h1a1 1 0 110 2h-1v1a1 1 0 11-2 0v-1h-1a1 1 0 110-2h1v-1a1 1 0 011-1z" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </VenetianTile>
  );
};

export default DashboardInventoryAlerts;
