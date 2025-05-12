import React, { Fragment } from 'react';

const LayoutSidebar = ({ activePage, setActivePage, modules, onAddModule }) => {
  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M3 4a1 1 0 011-1h12a1 1 0 011 1v2a1 1 0 01-1 1H4a1 1 0 01-1-1V4zM3 10a1 1 0 011-1h6a1 1 0 011 1v6a1 1 0 01-1 1H4a1 1 0 01-1-1v-6zM14 9a1 1 0 00-1 1v6a1 1 0 001 1h2a1 1 0 001-1v-6a1 1 0 00-1-1h-2z" />
      </svg>
    ) },
    { id: 'clients', label: 'Clientes', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M13 6a3 3 0 11-6 0 3 3 0 016 0zM18 8a2 2 0 11-4 0 2 2 0 014 0zM14 15a4 4 0 00-8 0v1h8v-1zM6 8a2 2 0 11-4 0 2 2 0 014 0zM16 18v-1a5.972 5.972 0 00-.75-2.906A3.005 3.005 0 0119 15v1h-3zM4.75 12.094A5.973 5.973 0 004 15v1H1v-1a3 3 0 013.75-2.906z" />
      </svg>
    ) },
    { id: 'products', label: 'Productos', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path fillRule="evenodd" d="M10 2a4 4 0 00-4 4v1H5a1 1 0 00-.994.89l-1 9A1 1 0 004 18h12a1 1 0 00.994-1.11l-1-9A1 1 0 0015 7h-1V6a4 4 0 00-4-4zm2 5V6a2 2 0 10-4 0v1h4zm-6 3a1 1 0 112 0 1 1 0 01-2 0zm7-1a1 1 0 100 2 1 1 0 000-2z" clipRule="evenodd" />
      </svg>
    ) },
    { id: 'inventory', label: 'Inventario', icon: (
      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
        <path d="M4 3a2 2 0 100 4h12a2 2 0 100-4H4z" />
        <path fillRule="evenodd" d="M3 8h14v7a2 2 0 01-2 2H5a2 2 0 01-2-2V8zm5 3a1 1 0 011-1h2a1 1 0 110 2H9a1 1 0 01-1-1z" clipRule="evenodd" />
      </svg>
    ) }
  ];

  return (
    <div className="fixed left-0 top-0 h-full w-64 bg-white shadow-lg overflow-y-auto"
      style={{
        background: 'linear-gradient(135deg, #e6f7ff 0%, #ffffff 100%)',
        borderRight: '1px solid rgba(0, 150, 255, 0.1)'
      }}
    >
      <div className="p-4 border-b border-blue-100 flex items-center space-x-2">
        <div className="w-10 h-10 rounded-lg overflow-hidden">
          <img
            src="https://4tsix0yujj.ufs.sh/f/2vMRHqOYUHc0c2ZYzyxLlIki8fCRNnvUyWdBhcZQKOVp6M0G"
            alt="Logo"
            className="w-full h-full object-cover"
          />
        </div>
        <h1 className="text-xl font-bold text-blue-800">Aqualiquim</h1>
      </div>

      <ul>
        {menuItems.map((item) => (
          <li key={item.id} className="mb-1">
            <button
              onClick={() => setActivePage(item.id)}
              className={`flex items-center w-full px-4 py-3 text-left transition-colors ${
                activePage === item.id
                  ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span className="mr-3">{item.icon}</span>
              {item.label}
            </button>
          </li>
        ))}

        {/* Módulos personalizados */}
        {modules.map((mod) => (
          <li key={mod.name} className="mb-1">
            <button
              onClick={() => setActivePage(mod.name.toLowerCase())}
              className={`flex items-center w-full px-4 py-3 text-left transition-colors ${
                activePage === mod.name.toLowerCase()
                  ? 'bg-blue-100 text-blue-600 border-r-4 border-blue-600'
                  : 'text-blue-800 hover:bg-blue-50'
              }`}
            >
              <span className="mr-3">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M4 3a1 1 0 000 2h12a1 1 0 100-2H4zM3 7a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3zm0 4a1 1 0 000 2h14a1 1 0 100-2H3z" />
                </svg>
              </span>
              {mod.name}
            </button>
          </li>
        ))}

        {/* Agregar Módulo */}
        <li className="mb-1">
          <button
            onClick={() => onAddModule && onAddModule()}
            className="flex items-center w-full px-4 py-3 text-left text-blue-800 hover:bg-blue-50"
          >
            <span className="mr-3">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z" clipRule="evenodd" />
              </svg>
            </span>
            Agregar Módulo
          </button>
        </li>
      </ul>

      <div className="absolute bottom-0 w-full border-t border-blue-100 p-4 flex items-center space-x-3">
        <div className="bg-blue-100 text-blue-600 p-2 rounded-full">
          <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
            <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-6-3a2 2 0 11-4 0 2 2 0 014 0zm-2 4a5 5 0 00-4.546 2.916A5.986 5.986 0 0010 16a5.986 5.986 0 004.546-2.084A5 5 0 0010 11z" clipRule="evenodd" />
          </svg>
        </div>
        <div>
          <p className="text-sm font-medium text-blue-800">Admin</p>
          <p className="text-xs text-blue-600">admin@aquapool.com</p>
        </div>
      </div>
    </div>
  );
};

export default LayoutSidebar;
