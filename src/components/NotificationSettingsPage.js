import React, { useState, useEffect } from 'react';
import { emailNotificationService } from '../services/emailNotificationService';
import VenetianTile from './VenetianTile';

const NotificationSettingsPage = () => {
  const [settings, setSettings] = useState({
    recipients: [],
    enabled: true,
    checkInterval: 6 * 60 * 60 * 1000, // 6 hours in milliseconds
    isRunning: false,
    lastCheck: null
  });
  
  const [newRecipient, setNewRecipient] = useState('');
  const [loading, setLoading] = useState(false);
  const [testing, setTesting] = useState(false);
  const [message, setMessage] = useState({ type: '', text: '' });

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = () => {
    const currentSettings = emailNotificationService.getSettings();
    setSettings(currentSettings);
  };

  const handleSaveSettings = async () => {
    setLoading(true);
    setMessage({ type: '', text: '' });

    try {
      emailNotificationService.updateSettings(settings);
      setMessage({ type: 'success', text: 'Configuración guardada exitosamente' });
      loadSettings(); // Reload to get updated state
    } catch (error) {
      console.error('Error saving settings:', error);
      setMessage({ type: 'error', text: 'Error al guardar configuración: ' + error.message });
    } finally {
      setLoading(false);
    }
  };

  const handleAddRecipient = () => {
    if (newRecipient && newRecipient.includes('@')) {
      const updatedRecipients = [...settings.recipients, newRecipient];
      setSettings({ ...settings, recipients: updatedRecipients });
      setNewRecipient('');
    } else {
      setMessage({ type: 'error', text: 'Por favor ingresa un email válido' });
    }
  };

  const handleRemoveRecipient = (index) => {
    const updatedRecipients = settings.recipients.filter((_, i) => i !== index);
    setSettings({ ...settings, recipients: updatedRecipients });
  };

  const handleTestNotification = async () => {
    setTesting(true);
    setMessage({ type: '', text: '' });

    try {
      const result = await emailNotificationService.testNotification();
      
      if (result.success) {
        setMessage({ type: 'success', text: 'Notificación de prueba enviada exitosamente' });
      } else {
        setMessage({ type: 'error', text: 'Error al enviar notificación de prueba: ' + (result.error?.message || 'Error desconocido') });
      }
    } catch (error) {
      console.error('Error testing notification:', error);
      setMessage({ type: 'error', text: 'Error al enviar notificación de prueba: ' + error.message });
    } finally {
      setTesting(false);
    }
  };

  const formatInterval = (milliseconds) => {
    const hours = milliseconds / (1000 * 60 * 60);
    if (hours >= 24) {
      return `${hours / 24} día(s)`;
    }
    return `${hours} hora(s)`;
  };

  const intervalOptions = [
    { value: 1 * 60 * 60 * 1000, label: '1 hora' },
    { value: 3 * 60 * 60 * 1000, label: '3 horas' },
    { value: 6 * 60 * 60 * 1000, label: '6 horas' },
    { value: 12 * 60 * 60 * 1000, label: '12 horas' },
    { value: 24 * 60 * 60 * 1000, label: '24 horas' }
  ];

  return (
    <div className="p-6 bg-background dark:bg-gray-900 min-h-screen">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 dark:text-white mb-2">
          📧 Configuración de Notificaciones
        </h1>
        <p className="text-gray-600 dark:text-gray-400">
          Configurar alertas automáticas por email para productos con stock bajo
        </p>
      </div>

      {message.text && (
        <div className={`mb-6 p-4 rounded-lg border ${
          message.type === 'success' 
            ? 'bg-green-50 dark:bg-green-900/20 text-green-800 dark:text-green-200 border-green-200 dark:border-green-700' 
            : 'bg-red-50 dark:bg-red-900/20 text-red-800 dark:text-red-200 border-red-200 dark:border-red-700'
        }`}>
          <div className="flex items-center">
            <span className="mr-2">
              {message.type === 'success' ? '✅' : '❌'}
            </span>
            {message.text}
          </div>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Service Status */}
        <VenetianTile>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">📊</span>
              Estado del Servicio
            </h3>
            
            <div className="space-y-4">
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Estado:</span>
                <span className={`px-3 py-1.5 rounded-full text-sm font-semibold flex items-center ${
                  settings.isRunning 
                    ? 'bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-200 border border-green-200 dark:border-green-700' 
                    : 'bg-red-100 dark:bg-red-900/30 text-red-800 dark:text-red-200 border border-red-200 dark:border-red-700'
                }`}>
                  <span className={`w-2 h-2 rounded-full mr-2 ${
                    settings.isRunning ? 'bg-green-500' : 'bg-red-500'
                  }`}></span>
                  {settings.isRunning ? 'Activo' : 'Inactivo'}
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Última verificación:</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm">
                  {settings.lastCheck 
                    ? new Date(settings.lastCheck).toLocaleString()
                    : 'Nunca'
                  }
                </span>
              </div>
              
              <div className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                <span className="text-gray-700 dark:text-gray-300 font-medium">Intervalo:</span>
                <span className="text-gray-600 dark:text-gray-400 text-sm font-medium">
                  {formatInterval(settings.checkInterval)}
                </span>
              </div>
            </div>
          </div>
        </VenetianTile>

        {/* Service Settings */}
        <VenetianTile>
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">⚙️</span>
              Configuración
            </h3>
            
            <div className="space-y-6">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <label className="flex items-center space-x-3 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={settings.enabled}
                    onChange={(e) => setSettings({ ...settings, enabled: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <div>
                    <span className="text-gray-700 dark:text-gray-300 font-medium">
                      Habilitar notificaciones automáticas
                    </span>
                    <p className="text-sm text-gray-500 dark:text-gray-400 mt-1">
                      Enviar alertas cuando el stock esté bajo
                    </p>
                  </div>
                </label>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                  Frecuencia de verificación
                </label>
                <select
                  value={settings.checkInterval}
                  onChange={(e) => setSettings({ ...settings, checkInterval: parseInt(e.target.value) })}
                  className="w-full p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500 transition-colors"
                >
                  {intervalOptions.map(option => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
                  Con qué frecuencia verificar los niveles de stock
                </p>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={handleSaveSettings}
                  disabled={loading}
                  className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {loading ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Guardando...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">💾</span>
                      Guardar Configuración
                    </>
                  )}
                </button>
                
                <button
                  onClick={handleTestNotification}
                  disabled={testing}
                  className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-3 rounded-lg font-medium disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {testing ? (
                    <>
                      <svg className="animate-spin -ml-1 mr-3 h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                      </svg>
                      Enviando...
                    </>
                  ) : (
                    <>
                      <span className="mr-2">🧪</span>
                      Probar Notificación
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </VenetianTile>

        {/* Recipients Management */}
        <VenetianTile className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">👥</span>
              Destinatarios de Notificaciones
            </h3>
            
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                Agregar nuevo destinatario
              </label>
              <div className="flex space-x-3">
                <input
                  type="email"
                  value={newRecipient}
                  onChange={(e) => setNewRecipient(e.target.value)}
                  placeholder="ejemplo@aqualiquim.com"
                  className="flex-1 p-3 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white placeholder-gray-500 dark:placeholder-gray-400 focus:ring-blue-500 focus:border-blue-500 transition-colors"
                  onKeyPress={(e) => e.key === 'Enter' && handleAddRecipient()}
                />
                <button
                  onClick={handleAddRecipient}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center"
                >
                  <span className="mr-2">➕</span>
                  Agregar
                </button>
              </div>
            </div>

            <div className="space-y-3">
              {settings.recipients.length === 0 ? (
                <div className="text-center py-8 border-2 border-dashed border-gray-300 dark:border-gray-600 rounded-lg">
                  <div className="w-12 h-12 mx-auto mb-4 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center">
                    <span className="text-2xl">📧</span>
                  </div>
                  <p className="text-gray-500 dark:text-gray-400 font-medium">No hay destinatarios configurados</p>
                  <p className="text-gray-400 dark:text-gray-500 text-sm mt-1">
                    Agrega al menos un email para recibir notificaciones
                  </p>
                </div>
              ) : (
                settings.recipients.map((email, index) => (
                  <div key={index} className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-lg border border-gray-200 dark:border-gray-700 hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center">
                        <span className="text-blue-600 dark:text-blue-400">📧</span>
                      </div>
                      <div>
                        <p className="text-gray-900 dark:text-white font-medium">{email}</p>
                        <p className="text-sm text-gray-500 dark:text-gray-400">Destinatario activo</p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleRemoveRecipient(index)}
                      className="text-red-600 hover:text-red-800 dark:text-red-400 dark:hover:text-red-300 p-2 rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                    >
                      <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor">
                        <path fillRule="evenodd" d="M9 2a1 1 0 000 2h2a1 1 0 100-2H9z" clipRule="evenodd" />
                        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                      </svg>
                    </button>
                  </div>
                ))
              )}
            </div>
          </div>
        </VenetianTile>

        {/* Help & Info */}
        <VenetianTile className="lg:col-span-2">
          <div className="p-6">
            <h3 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white flex items-center">
              <span className="mr-2">💡</span>
              Información y Ayuda
            </h3>
            
            <div className="space-y-6 text-sm">
              <div className="p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg border border-blue-200 dark:border-blue-700">
                <h4 className="font-semibold text-blue-800 dark:text-blue-200 mb-3 flex items-center">
                  <span className="mr-2">🔄</span>
                  ¿Cómo funciona el sistema?
                </h4>
                <ul className="list-disc list-inside space-y-2 text-blue-700 dark:text-blue-300">
                  <li>El sistema verifica automáticamente los niveles de inventario según el intervalo configurado</li>
                  <li>Cuando un producto tiene stock igual o menor al mínimo, se envía una alerta por email</li>
                  <li>Las notificaciones se envían máximo una vez por día para evitar spam</li>
                  <li>Los emails incluyen detalles completos con recomendaciones de acción</li>
                </ul>
              </div>
              
              <div className="p-4 bg-green-50 dark:bg-green-900/20 rounded-lg border border-green-200 dark:border-green-700">
                <h4 className="font-semibold text-green-800 dark:text-green-200 mb-3 flex items-center">
                  <span className="mr-2">⚙️</span>
                  Configuración recomendada
                </h4>
                <ul className="list-disc list-inside space-y-2 text-green-700 dark:text-green-300">
                  <li><strong>Verificación cada 6 horas</strong> para monitoreo efectivo sin saturar</li>
                  <li><strong>Múltiples destinatarios:</strong> incluir emails de compras, administración y gerencia</li>
                  <li><strong>Stocks mínimos apropiados</strong> para cada producto según su rotación</li>
                  <li><strong>Pruebas periódicas</strong> para verificar que el sistema funciona correctamente</li>
                </ul>
              </div>

              <div className="p-4 bg-amber-50 dark:bg-amber-900/20 rounded-lg border border-amber-200 dark:border-amber-700">
                <h4 className="font-semibold text-amber-800 dark:text-amber-200 mb-3 flex items-center">
                  <span className="mr-2">⚠️</span>
                  Consideraciones importantes
                </h4>
                <ul className="list-disc list-inside space-y-2 text-amber-700 dark:text-amber-300">
                  <li><strong>Configuración del servidor:</strong> Las notificaciones requieren configuración del servicio de email</li>
                  <li><strong>Conectividad:</strong> Verificar conexión a internet para el envío de emails</li>
                  <li><strong>Destinatarios válidos:</strong> Asegurarse de que todos los emails sean correctos y activos</li>
                  <li><strong>Monitoreo regular:</strong> Revisar el estado del servicio periódicamente</li>
                </ul>
                
                <div className="mt-3 p-3 bg-amber-100 dark:bg-amber-800/30 rounded border border-amber-300 dark:border-amber-600">
                  <p className="text-amber-800 dark:text-amber-200 text-xs font-medium">
                    <strong>Nota técnica:</strong> Si experimentas problemas con el envío de emails, 
                    contacta al administrador del sistema para verificar la configuración de Resend API 
                    y las variables de entorno en Supabase.
                  </p>
                </div>
              </div>
            </div>
          </div>
        </VenetianTile>
      </div>
    </div>
  );
};

export default NotificationSettingsPage;
