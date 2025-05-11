import React from 'react';
import { formatCurrency } from '../utils/storage';
import VenetianTile from './VenetianTile';

const DashboardTopItems = ({ title, items, type }) => {
  return (
    <VenetianTile className="p-6">
      <div className="flex justify-between items-center mb-4">
        <h3 className="text-blue-800 font-medium">{title}</h3>
        <button className="text-sm text-blue-600 hover:text-blue-800">
          Ver todo
        </button>
      </div>
      
      <div className="space-y-4">
        {items.map((item) => (
          <div key={item.id} className="flex items-center">
            <div className="w-10 h-10 rounded-lg bg-blue-100 flex items-center justify-center text-blue-600 mr-3">
              {type === 'products' ? (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
                </svg>
              ) : (
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
                </svg>
              )}
            </div>
            
            <div className="flex-1">
              <p className="text-sm font-medium text-blue-800">{item.name}</p>
              <div className="flex items-center mt-1">
                <div className="flex-1 bg-blue-100 rounded-full h-1.5">
                  <div 
                    className="bg-blue-600 h-1.5 rounded-full" 
                    style={{ 
                      width: type === 'products' 
                        ? `${(item.sales / items[0].sales) * 100}%` 
                        : `${(item.purchases / items[0].purchases) * 100}%` 
                    }}
                  ></div>
                </div>
              </div>
            </div>
            
            <div className="ml-4 text-right">
              <p className="text-blue-800 font-medium">
                {formatCurrency(type === 'products' ? item.sales : item.purchases)}
              </p>
              <p className="text-xs text-blue-500 mt-1">
                {type === 'products' ? `${item.units} unidades` : `${item.orders} pedidos`}
              </p>
            </div>
          </div>
        ))}
      </div>
    </VenetianTile>
  );
};

export default DashboardTopItems;