import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const ModuleSidebar = ({ modules = [], onAddModule }) => {
  const [isOpen, setIsOpen] = useState(true);
  
  // Only show in development and when there are dev modules
  const devModules = modules.filter(m => m.isDevModule);
  const shouldShow = process.env.NODE_ENV === 'development' && devModules.length > 0;
  
  if (!shouldShow) {
    return null; // Don't render anything in production or when no dev modules
  }

  return (
    <>
      {/* Floating toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-50 bg-blue-600 text-white p-3 rounded-full shadow-lg hover:bg-blue-700 transition-colors"
          title="Abrir módulos de desarrollo"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Module Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-64 venetian-bg venetian-shadow border-l venetian-border z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b venetian-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-blue-800">🔧 Módulos Dev</h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-gray-600 hover:text-gray-800 focus:outline-none transition-colors"
            title="Cerrar módulos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col space-y-3">
          {devModules.length === 0 && (
            <div className="text-center py-8">
              <p className="text-sm text-gray-600 mb-2">No hay módulos de desarrollo.</p>
              <p className="text-xs text-gray-500">
                💡 Usa el DevTool en el sidebar o la consola del navegador para agregar módulos
              </p>
            </div>
          )}

          {devModules.map((mod, index) => (
              <VenetianTile key={mod.id || index} className="p-3">
                <div className="text-sm font-medium text-blue-800">{mod.name}</div>
                <div className="text-xs text-gray-600 mt-1">{mod.description}</div>
                {mod.createdAt && (
                  <div className="text-xs text-gray-400 mt-1">
                    📅 {new Date(mod.createdAt).toLocaleDateString()}
                  </div>
                )}
              </VenetianTile>
            ))}
        </div>
      </div>
    </>
  );
};

export default ModuleSidebar;
