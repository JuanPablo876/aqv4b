import React, { useState } from 'react';
import VenetianTile from './VenetianTile';

const SettingsPage = () => {
  const [activeTab, setActiveTab] = useState('general');
  const [companyInfo, setCompanyInfo] = useState({
    name: 'AquaPool Distribuidora',
    legalName: 'AquaPool S.A. de C.V.',
    taxId: 'APO123456789',
    email: 'contacto@aquapool.com',
    phone: '555-123-4567',
    address: 'Av. de las Albercas 123, Col. Acuática, CDMX',
    website: 'www.aquapool.com',
    logo: 'https://via.placeholder.com/150'
  });
  
  const [userSettings, setUserSettings] = useState({
    username: 'admin',
    email: 'admin@aquapool.com',
    language: 'es',
    notifications: {
      email: true,
      browser: true,
      lowStock: true,
      newOrders: true,
      quoteApprovals: true
    },
    theme: 'light'
  });
  
  const [systemSettings, setSystemSettings] = useState({
    currency: 'MXN',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'America/Mexico_City',
    taxRate: 16,
    backupFrequency: 'daily',
    autoLogout: 30
  });
  
  // Handle company info change
  const handleCompanyInfoChange = (e) => {
    const { name, value } = e.target;
    setCompanyInfo({
      ...companyInfo,
      [name]: value
    });
  };
  
  // Handle user settings change
  const handleUserSettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    
    if (type === 'checkbox') {
      if (name.includes('.')) {
        const [parent, child] = name.split('.');
        setUserSettings({
          ...userSettings,
          [parent]: {
            ...userSettings[parent],
            [child]: checked
          }
        });
      } else {
        setUserSettings({
          ...userSettings,
          [name]: checked
        });
      }
    } else {
      setUserSettings({
        ...userSettings,
        [name]: value
      });
    }
  };
  
  // Handle system settings change
  const handleSystemSettingsChange = (e) => {
    const { name, value } = e.target;
    setSystemSettings({
      ...systemSettings,
      [name]: value
    });
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Información de la Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2 flex items-center">
                <div className="w-24 h-24 bg-gray-200 rounded-lg mr-6 overflow-hidden">
                  <img 
                    src={companyInfo.logo} 
                    alt="Logo de la empresa" 
                    className="w-full h-full object-cover"
                  />
                </div>
                <div>
                  <h4 className="text-md font-medium text-blue-800 mb-2">Logo de la Empresa</h4>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Cambiar Logo
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="name"
                  value={companyInfo.name}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={companyInfo.legalName}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={companyInfo.taxId}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Sitio Web
                </label>
                <input
                  type="text"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <textarea
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                  rows="3"
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                ></textarea>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Guardar Cambios
              </button>
            </div>
          </div>
        );
        
      case 'user':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Configuración de Usuario</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={userSettings.username}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={userSettings.email}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Idioma
                </label>
                <select
                  name="language"
                  value={userSettings.language}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tema
                </label>
                <select
                  name="theme"
                  value={userSettings.theme}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Notificaciones
                </label>
                
                <div className="space-y-3">
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications.email"
                      name="notifications.email"
                      checked={userSettings.notifications.email}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-700">
                      Recibir notificaciones por correo electrónico
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications.browser"
                      name="notifications.browser"
                      checked={userSettings.notifications.browser}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications.browser" className="ml-2 block text-sm text-gray-700">
                      Recibir notificaciones en el navegador
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications.lowStock"
                      name="notifications.lowStock"
                      checked={userSettings.notifications.lowStock}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications.lowStock" className="ml-2 block text-sm text-gray-700">
                      Alertas de stock bajo
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications.newOrders"
                      name="notifications.newOrders"
                      checked={userSettings.notifications.newOrders}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications.newOrders" className="ml-2 block text-sm text-gray-700">
                      Nuevos pedidos
                    </label>
                  </div>
                  
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      id="notifications.quoteApprovals"
                      name="notifications.quoteApprovals"
                      checked={userSettings.notifications.quoteApprovals}
                      onChange={handleUserSettingsChange}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                    <label htmlFor="notifications.quoteApprovals" className="ml-2 block text-sm text-gray-700">
                      Aprobaciones de cotizaciones
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Guardar Cambios
              </button>
            </div>
          </div>
        );
        
      case 'system':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Configuración del Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Moneda
                </label>
                <select
                  name="currency"
                  value={systemSettings.currency}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Formato de Fecha
                </label>
                <select
                  name="dateFormat"
                  value={systemSettings.dateFormat}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Zona Horaria
                </label>
                <select
                  name="timeZone"
                  value={systemSettings.timeZone}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={systemSettings.taxRate}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Frecuencia de Respaldo
                </label>
                <select
                  name="backupFrequency"
                  value={systemSettings.backupFrequency}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Cierre de Sesión Automático (minutos)
                </label>
                <input
                  type="number"
                  name="autoLogout"
                  value={systemSettings.autoLogout}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            
            <div className="flex justify-end">
              <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                Guardar Cambios
              </button>
            </div>
          </div>
        );
        
      case 'security':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 mb-4">Seguridad</h3>
            
            <div className="mb-6">
              <h4 className="text-md font-medium text-blue-800 mb-3">Cambiar Contraseña</h4>
              
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Contraseña Actual
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <input
                    type="password"
                    className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Actualizar Contraseña
                  </button>
                </div>
              </div>
            </div>
            
            <div className="mb-6">
              <h4 className="text-md font-medium text-blue-800 mb-3">Sesiones Activas</h4>
              
              <div className="bg-blue-50 rounded-lg p-4 mb-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800">Este Dispositivo</p>
                    <p className="text-xs text-blue-600">Windows 10 • Chrome • Ciudad de México</p>
                    <p className="text-xs text-blue-600">Última actividad: Hace 2 minutos</p>
                  </div>
                  <span className="px-2 py-1 bg-green-100 text-green-800 text-xs rounded-full">
                    Activo
                  </span>
                </div>
              </div>
              
              <div className="bg-blue-50 rounded-lg p-4">
                <div className="flex justify-between items-center">
                  <div>
                    <p className="text-sm font-medium text-blue-800">iPhone 13</p>
                    <p className="text-xs text-blue-600">iOS 15 • Safari • Ciudad de México</p>
                    <p className="text-xs text-blue-600">Última actividad: Hace 3 días</p>
                  </div>
                  <button className="text-sm text-red-600 hover:text-red-800">
                    Cerrar Sesión
                  </button>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="text-md font-medium text-blue-800 mb-3">Opciones Avanzadas</h4>
              
              <div className="space-y-3">
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="twoFactorAuth"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="twoFactorAuth" className="ml-2 block text-sm text-gray-700">
                    Habilitar autenticación de dos factores
                  </label>
                </div>
                
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="loginNotifications"
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="loginNotifications" className="ml-2 block text-sm text-gray-700">
                    Recibir notificaciones de inicio de sesión
                  </label>
                </div>
              </div>
            </div>
          </div>
        );
        
      default:
        return null;
    }
  };
  
  return (
    <div className="p-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Configuración</h2>
      </div>
      
      {/* Settings tabs and content */}
      <VenetianTile className="overflow-hidden">
        <div className="border-b border-blue-100">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'general'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              General
            </button>
            
            <button
              onClick={() => setActiveTab('user')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'user'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Usuario
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'system'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Sistema
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-blue-500 text-blue-600'
                  : 'text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              Seguridad
            </button>
          </nav>
        </div>
        
        <div className="p-6">
          {renderTabContent()}
        </div>
      </VenetianTile>
    </div>
  );
};

export default SettingsPage;
// DONE