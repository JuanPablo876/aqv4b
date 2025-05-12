import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const ModuleSidebar = ({ modules = [], onAddModule }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <div className={`fixed right-0 top-0 h-full w-64 bg-white border-l shadow-xl z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
      <div className="p-4 border-b flex justify-between items-center">
        <h3 className="text-lg font-semibold text-blue-800">Módulos</h3>
        <button 
          onClick={() => setIsOpen(!isOpen)} 
          className="text-gray-400 hover:text-gray-600 focus:outline-none"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            {isOpen ? (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            ) : (
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            )}
          </svg>
        </button>
      </div>

      <div className="p-4 overflow-y-auto flex flex-col space-y-3">
        {modules.length === 0 && (
          <p className="text-sm text-gray-500">No hay módulos agregados.</p>
        )}

        {modules.map((mod, index) => (
          <VenetianTile key={index} className="p-3">
            <div className="text-sm font-medium text-blue-800">{mod.name}</div>
            <div className="text-xs text-gray-500 mt-1">{mod.description}</div>
          </VenetianTile>
        ))}

        <button 
          onClick={onAddModule} 
          className="mt-4 w-full bg-blue-600 text-white py-2 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Agregar Nuevo
        </button>
      </div>
    </div>
  );
};

export default ModuleSidebar;
