import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const ModuleSidebar = ({ modules = [], onAddModule }) => {
  const [isOpen, setIsOpen] = useState(true);

  return (
    <>
      {/* Floating toggle button when sidebar is closed */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          className="fixed right-4 top-20 z-50 bg-primary text-primary-foreground p-3 rounded-full shadow-lg hover:bg-primary/90 transition-colors"
          title="Abrir módulos"
        >
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
          </svg>
        </button>
      )}

      {/* Module Sidebar */}
      <div className={`fixed right-0 top-0 h-full w-64 venetian-bg venetian-shadow border-l venetian-border z-40 transition-transform duration-300 ${isOpen ? 'translate-x-0' : 'translate-x-full'}`}>
        <div className="p-4 border-b venetian-border flex justify-between items-center">
          <h3 className="text-lg font-semibold text-primary">Módulos</h3>
          <button 
            onClick={() => setIsOpen(false)} 
            className="text-muted-foreground hover:text-foreground focus:outline-none transition-colors"
            title="Cerrar módulos"
          >
            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="p-4 overflow-y-auto flex flex-col space-y-3">
          {modules.length === 0 && (
            <p className="text-sm text-muted-foreground">No hay módulos agregados.</p>
          )}

          {modules.map((mod, index) => (
            <VenetianTile key={index} className="p-3">
              <div className="text-sm font-medium text-primary">{mod.name}</div>
              <div className="text-xs text-muted-foreground mt-1">{mod.description}</div>
            </VenetianTile>
          ))}

          <button 
            onClick={onAddModule} 
            className="mt-4 w-full bg-primary text-primary-foreground py-2 rounded-lg hover:bg-primary/90 focus:outline-none focus:ring-2 focus:ring-primary transition-colors"
          >
            Agregar Nuevo
          </button>
        </div>
      </div>
    </>
  );
};

export default ModuleSidebar;
