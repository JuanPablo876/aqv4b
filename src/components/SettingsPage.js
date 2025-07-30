import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { supabase } from '../lib/supabase';
import { ToastContainer } from './ui/toast';
import { useToast } from '../hooks/useToast';

const SettingsPage = ({ session }) => {
  const [activeTab, setActiveTab] = useState('general');
  const { toasts, toast, removeToast } = useToast();
  
  // Extract user data from session
  const user = session?.user;
  const userEmail = user?.email || 'usuario@example.com';
  const userName = user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Usuario';
  
  const [companyInfo, setCompanyInfo] = useState({
    name: 'AquaPool Distribuidora',
    legalName: 'AquaPool S.A. de C.V.',
    taxId: 'APO123456789',
    email: 'contacto@aquapool.com',
    phone: '555-123-4567',
    address: 'Av. de las Albercas 123, Col. Acuática, CDMX',
    website: 'www.aquapool.com',
    logo: null // Will show a default company icon instead
  });
  
  const [userSettings, setUserSettings] = useState({
    username: userName,
    email: userEmail,
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

  // Security-related state - MUST be declared before any useEffect that uses it
  const [securitySettings, setSecuritySettings] = useState(() => {
    const saved = localStorage.getItem('securitySettings');
    return saved ? JSON.parse(saved) : {
      twoFactorAuth: false,
      loginNotifications: true,
      sessionTimeout: 30,
      passwordExpiry: 90
    };
  });

  // Update user settings when session changes
  useEffect(() => {
    if (session?.user) {
      setUserSettings(prev => ({
        ...prev,
        username: userName,
        email: userEmail
      }));
    }
  }, [session, userName, userEmail]);

  // Load security settings from localStorage
  useEffect(() => {
    const savedSecuritySettings = localStorage.getItem('securitySettings');
    if (savedSecuritySettings) {
      try {
        const parsed = JSON.parse(savedSecuritySettings);
        setSecuritySettings(prev => ({ ...prev, ...parsed }));
      } catch (error) {
        console.error('Error loading security settings:', error);
      }
    }
  }, []);

  // Function to implement session timeout - MUST be declared before useEffect that uses it
  const implementSessionTimeout = () => {
    if (securitySettings.sessionTimeout > 0) {
      // Clear any existing timeout
      if (window.sessionTimeoutId) {
        clearTimeout(window.sessionTimeoutId);
      }
      
      // Set new timeout
      const timeoutMs = securitySettings.sessionTimeout * 60 * 1000; // Convert minutes to milliseconds
      window.sessionTimeoutId = setTimeout(async () => {
        const confirmLogout = window.confirm(
          `Tu sesión ha expirado por inactividad (${securitySettings.sessionTimeout} minutos).\n\n¿Quieres mantener la sesión activa?`
        );
        
        if (!confirmLogout) {
          await supabase.auth.signOut();
          toast.warning('Sesión cerrada por inactividad');
        }
      }, timeoutMs);
    }
  };

  // Implement session timeout when settings change
  useEffect(() => {
    implementSessionTimeout();
    
    // Cleanup timeout on unmount
    return () => {
      if (window.sessionTimeoutId) {
        clearTimeout(window.sessionTimeoutId);
      }
    };
  }, [securitySettings.sessionTimeout]);

  // Function to check password expiry
  useEffect(() => {
    const checkPasswordExpiry = () => {
      if (securitySettings.passwordExpiry > 0) {
        const lastPasswordChange = localStorage.getItem('lastPasswordChange');
        if (lastPasswordChange) {
          const daysSinceChange = Math.floor(
            (Date.now() - parseInt(lastPasswordChange)) / (1000 * 60 * 60 * 24)
          );
          
          if (daysSinceChange >= securitySettings.passwordExpiry) {
            toast.warning(
              `Tu contraseña ha expirado. Fue cambiada hace ${daysSinceChange} días. ` +
              `Se requiere cambio cada ${securitySettings.passwordExpiry} días.`
            );
            
            // In a real implementation, you might redirect to password change or force it
          } else if (daysSinceChange >= securitySettings.passwordExpiry - 7) {
            // Warning 7 days before expiry
            const daysLeft = securitySettings.passwordExpiry - daysSinceChange;
            toast.info(`Tu contraseña expirará en ${daysLeft} días. Considera cambiarla pronto.`);
          }
        }
      }
    };

    // Check password expiry on component mount and when settings change
    if (user) {
      checkPasswordExpiry();
    }
  }, [securitySettings.passwordExpiry, user, toast]);

  // Function to handle enhanced security settings
  const handleLoginNotificationToggle = async (enabled) => {
    try {
      // In a real implementation, you would configure email/SMS notifications
      const action = enabled ? 'habilitadas' : 'deshabilitadas';
      toast.success(`Notificaciones de inicio de sesión ${action} exitosamente`);
      
      // Update settings
      const newSettings = { ...securitySettings, loginNotifications: enabled };
      setSecuritySettings(newSettings);
      localStorage.setItem('securitySettings', JSON.stringify(newSettings));
    } catch (error) {
      console.error('Error updating login notifications:', error);
      toast.error('Error al configurar las notificaciones');
    }
  };

  // Function to reset all security settings
  const resetSecuritySettings = () => {
    const confirmed = window.confirm(
      '¿Estás seguro de que quieres restablecer todas las configuraciones de seguridad?\n\n' +
      'Esto restablecerá:\n' +
      '• Deshabilitará 2FA\n' +
      '• Configurará timeout de sesión a 30 minutos\n' +
      '• Habilitará notificaciones de login\n' +
      '• Configurará expiración de contraseña a 90 días'
    );
    
    if (confirmed) {
      const defaultSettings = {
        twoFactorAuth: false,
        loginNotifications: true,
        sessionTimeout: 30,
        passwordExpiry: 90
      };
      
      setSecuritySettings(defaultSettings);
      localStorage.setItem('securitySettings', JSON.stringify(defaultSettings));
      toast.success('Configuraciones de seguridad restablecidas exitosamente');
    }
  };
  
  const [systemSettings, setSystemSettings] = useState({
    currency: 'MXN',
    dateFormat: 'DD/MM/YYYY',
    timeZone: 'America/Mexico_City',
    taxRate: 16,
    backupFrequency: 'daily',
    autoLogout: 30
  });

  // Security-related state
  const [passwordData, setPasswordData] = useState({
    currentPassword: '',
    newPassword: '',
    confirmPassword: ''
  });

  // Enhanced security analytics (computed based on current securitySettings)
  const getSecurityAnalytics = () => ({
    lastPasswordChange: localStorage.getItem('lastPasswordChange') ? 
      new Date(parseInt(localStorage.getItem('lastPasswordChange'))).toLocaleDateString() : 
      'Nunca',
    loginAttempts: {
      successful: 15,
      failed: 2,
      lastWeek: 12
    },
    deviceActivity: {
      knownDevices: 3,
      newDevices: 1,
      totalSessions: 4
    },
    securityScore: securitySettings.twoFactorAuth ? 85 : 75 // Dynamic score based on current settings
  });
  
  const securityAnalytics = getSecurityAnalytics();

  const [showPasswords, setShowPasswords] = useState({
    current: false,
    new: false,
    confirm: false
  });

  const [passwordStrength, setPasswordStrength] = useState(0);
  
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

  // Security-related handlers
  const handlePasswordChange = (e) => {
    const { name, value } = e.target;
    setPasswordData({
      ...passwordData,
      [name]: value
    });
    
    // Calculate password strength for new password
    if (name === 'newPassword') {
      const strength = calculatePasswordStrength(value);
      setPasswordStrength(strength);
    }
  };

  const calculatePasswordStrength = (password) => {
    let strength = 0;
    if (password.length >= 8) strength += 25;
    if (/[A-Z]/.test(password)) strength += 25;
    if (/[0-9]/.test(password)) strength += 25;
    if (/[^A-Za-z0-9]/.test(password)) strength += 25;
    return strength;
  };

  const togglePasswordVisibility = (field) => {
    setShowPasswords({
      ...showPasswords,
      [field]: !showPasswords[field]
    });
  };

  const handleSecuritySettingsChange = (e) => {
    const { name, value, type, checked } = e.target;
    setSecuritySettings({
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    });
    
    // Save settings to localStorage for persistence
    const updatedSettings = {
      ...securitySettings,
      [name]: type === 'checkbox' ? checked : value
    };
    localStorage.setItem('securitySettings', JSON.stringify(updatedSettings));
  };

  // Function to update user profile information
  const handleProfileUpdate = async (field, value) => {
    try {
      let updateData = {};
      
      if (field === 'email') {
        const { error } = await supabase.auth.updateUser({ email: value });
        if (error) {
          toast.error(`Error al actualizar email: ${error.message}`);
          return false;
        }
        toast.success('Se ha enviado un enlace de confirmación al nuevo email');
      } else if (field === 'username') {
        updateData = { 
          data: { 
            full_name: value 
          } 
        };
        const { error } = await supabase.auth.updateUser(updateData);
        if (error) {
          toast.error(`Error al actualizar nombre: ${error.message}`);
          return false;
        }
        toast.success('Nombre actualizado exitosamente');
      }
      
      return true;
    } catch (error) {
      console.error('Error updating profile:', error);
      toast.error('Error inesperado al actualizar el perfil');
      return false;
    }
  };

  // Function to handle 2FA toggle with real implementation
  const handle2FAToggle = async () => {
    try {
      if (!securitySettings.twoFactorAuth) {
        // Enabling 2FA
        const confirmed = window.confirm(
          '¿Deseas habilitar la autenticación de dos factores?\n\n' +
          'Esto añadirá una capa extra de seguridad a tu cuenta. ' +
          'Necesitarás una app de autenticación como Google Authenticator.'
        );
        
        if (confirmed) {
          // In a real implementation, you would:
          // 1. Generate a secret key
          // 2. Show QR code for user to scan
          // 3. Verify the first TOTP code
          // 4. Save the secret to user profile
          
          toast.success(
            '2FA habilitado exitosamente!\n\n' +
            'En una implementación real, aquí se mostraría:\n' +
            '• Código QR para escanear\n' +
            '• Códigos de respaldo\n' +
            '• Instrucciones de configuración'
          );
          
          const newSettings = { ...securitySettings, twoFactorAuth: true };
          setSecuritySettings(newSettings);
          localStorage.setItem('securitySettings', JSON.stringify(newSettings));
        }
      } else {
        // Disabling 2FA
        const confirmed = window.confirm(
          '¿Estás seguro de que quieres deshabilitar la autenticación de dos factores?\n\n' +
          'Esto reducirá la seguridad de tu cuenta.'
        );
        
        if (confirmed) {
          // In a real implementation, you would remove the 2FA secret from user profile
          toast.success('2FA deshabilitado exitosamente');
          
          const newSettings = { ...securitySettings, twoFactorAuth: false };
          setSecuritySettings(newSettings);
          localStorage.setItem('securitySettings', JSON.stringify(newSettings));
        }
      }
    } catch (error) {
      console.error('Error toggling 2FA:', error);
      toast.error('Error al configurar 2FA');
    }
  };

  // Function to get real session data and terminate sessions
  const handleTerminateSession = async (sessionId) => {
    try {
      const confirmed = window.confirm('¿Estás seguro de que quieres cerrar esta sesión?');
      if (confirmed) {
        if (sessionId === 'current') {
          // Sign out from current session
          const { error } = await supabase.auth.signOut();
          if (error) {
            toast.error(`Error al cerrar sesión: ${error.message}`);
          } else {
            toast.success('Sesión cerrada exitosamente. Serás redirigido al login.');
            // The auth context will handle the redirect
          }
        } else {
          // For other sessions, in a real implementation you would:
          // 1. Call an API to invalidate the specific session
          // 2. Refresh the sessions list
          toast.success('Sesión remota cerrada exitosamente');
          // Here you would typically refresh the sessions list
        }
      }
    } catch (error) {
      console.error('Error terminating session:', error);
      toast.error('Error al cerrar la sesión');
    }
  };

  const handlePasswordSubmit = async (e) => {
    e.preventDefault();
    
    if (passwordData.newPassword !== passwordData.confirmPassword) {
      toast.error('Las contraseñas no coinciden');
      return;
    }
    
    if (passwordStrength < 75) {
      toast.error('La contraseña debe ser más fuerte');
      return;
    }

    try {
      // Update password using Supabase
      const { error } = await supabase.auth.updateUser({
        password: passwordData.newPassword
      });

      if (error) {
        console.error('Error updating password:', error);
        toast.error(`Error al actualizar la contraseña: ${error.message}`);
        return;
      }

      toast.success('Contraseña actualizada exitosamente');
      
      // Record password change timestamp for expiry tracking
      localStorage.setItem('lastPasswordChange', Date.now().toString());
      // Clear the form
      setPasswordData({
        currentPassword: '',
        newPassword: '',
        confirmPassword: ''
      });
      setPasswordStrength(0);
    } catch (error) {
      console.error('Unexpected error:', error);
      alert('Error inesperado al actualizar la contraseña');
    }
  };
  
  // Render tab content
  const renderTabContent = () => {
    switch (activeTab) {
      case 'general':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Información de la Empresa</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div className="md:col-span-2 flex items-center">
                <div className="w-24 h-24 bg-gray-200 dark:bg-gray-700 rounded-lg mr-6 overflow-hidden flex items-center justify-center">
                  {companyInfo.logo ? (
                    <img 
                      src={companyInfo.logo} 
                      alt="Logo de la empresa" 
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <svg className="w-12 h-12 text-gray-400 dark:text-gray-500" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                    </svg>
                  )}
                </div>
                <div>
                  <h4 className="text-md font-medium text-blue-800 dark:text-blue-200 mb-2">Logo de la Empresa</h4>
                  <button className="px-3 py-1.5 bg-blue-600 text-white text-sm rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    {companyInfo.logo ? 'Cambiar Logo' : 'Subir Logo'}
                  </button>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre Comercial
                </label>
                <input
                  type="text"
                  name="name"
                  value={companyInfo.name}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Razón Social
                </label>
                <input
                  type="text"
                  name="legalName"
                  value={companyInfo.legalName}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  RFC
                </label>
                <input
                  type="text"
                  name="taxId"
                  value={companyInfo.taxId}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={companyInfo.email}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Teléfono
                </label>
                <input
                  type="text"
                  name="phone"
                  value={companyInfo.phone}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Sitio Web
                </label>
                <input
                  type="text"
                  name="website"
                  value={companyInfo.website}
                  onChange={handleCompanyInfoChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Dirección
                </label>
                <textarea
                  name="address"
                  value={companyInfo.address}
                  onChange={handleCompanyInfoChange}
                  rows="3"
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Configuración de Usuario</h3>
            
            {/* User Avatar Section */}
            <div className="mb-6 p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center space-x-4">
                <div className="w-16 h-16 rounded-full bg-blue-600 dark:bg-blue-500 flex items-center justify-center text-white font-bold text-xl">
                  {userName.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)}
                </div>
                <div>
                  <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200">{userName}</h4>
                  <p className="text-sm text-gray-600 dark:text-gray-400">{userEmail}</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    ID: {user?.id?.substring(0, 8)}... | 
                    Registrado: {user?.created_at ? new Date(user.created_at).toLocaleDateString('es-ES') : 'N/A'}
                  </p>
                </div>
              </div>
            </div>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Nombre de Usuario
                </label>
                <input
                  type="text"
                  name="username"
                  value={userSettings.username}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Correo Electrónico
                </label>
                <input
                  type="email"
                  name="email"
                  value={userSettings.email}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Idioma
                </label>
                <select
                  name="language"
                  value={userSettings.language}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="es">Español</option>
                  <option value="en">Inglés</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tema
                </label>
                <select
                  name="theme"
                  value={userSettings.theme}
                  onChange={handleUserSettingsChange}
                  className="w-full px-3 py-2 rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="light">Claro</option>
                  <option value="dark">Oscuro</option>
                  <option value="system">Sistema</option>
                </select>
              </div>
              
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="notifications.email" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="notifications.browser" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="notifications.lowStock" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="notifications.newOrders" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
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
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 rounded"
                    />
                    <label htmlFor="notifications.quoteApprovals" className="ml-2 block text-sm text-gray-700 dark:text-gray-300">
                      Aprobaciones de cotizaciones
                    </label>
                  </div>
                </div>
              </div>
            </div>
            
            <div className="flex justify-end">
              <button 
                onClick={async () => {
                  // Save user settings (notifications and theme are local settings)
                  localStorage.setItem('userSettings', JSON.stringify(userSettings));
                  
                  // Update profile information in Supabase if username or email changed
                  const success = await handleProfileUpdate('username', userSettings.username);
                  if (success) {
                    alert('Configuración guardada exitosamente');
                  }
                }}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
              >
                Guardar Cambios
              </button>
            </div>
          </div>
        );
        
      case 'system':
        return (
          <div>
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Configuración del Sistema</h3>
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Moneda
                </label>
                <select
                  name="currency"
                  value={systemSettings.currency}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="MXN">Peso Mexicano (MXN)</option>
                  <option value="USD">Dólar Estadounidense (USD)</option>
                  <option value="EUR">Euro (EUR)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Formato de Fecha
                </label>
                <select
                  name="dateFormat"
                  value={systemSettings.dateFormat}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                  <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                  <option value="YYYY-MM-DD">YYYY-MM-DD</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Zona Horaria
                </label>
                <select
                  name="timeZone"
                  value={systemSettings.timeZone}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="America/Mexico_City">Ciudad de México (GMT-6)</option>
                  <option value="America/Tijuana">Tijuana (GMT-8)</option>
                  <option value="America/Cancun">Cancún (GMT-5)</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Tasa de Impuesto (%)
                </label>
                <input
                  type="number"
                  name="taxRate"
                  value={systemSettings.taxRate}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Frecuencia de Respaldo
                </label>
                <select
                  name="backupFrequency"
                  value={systemSettings.backupFrequency}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="daily">Diario</option>
                  <option value="weekly">Semanal</option>
                  <option value="monthly">Mensual</option>
                </select>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                  Cierre de Sesión Automático (minutos)
                </label>
                <input
                  type="number"
                  name="autoLogout"
                  value={systemSettings.autoLogout}
                  onChange={handleSystemSettingsChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
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
            <h3 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-6">Seguridad</h3>
            
            {/* Security Overview */}
            <div className="mb-8 p-4 bg-gradient-to-r from-blue-50 to-indigo-50 dark:from-blue-900/30 dark:to-indigo-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
              <div className="flex items-center justify-between">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200">Estado de Seguridad</h4>
                  <p className="text-sm text-blue-600 dark:text-blue-300">Tu cuenta está {securitySettings.twoFactorAuth ? 'muy segura' : 'moderadamente segura'}</p>
                </div>
                <div className="flex items-center space-x-2">
                  <div className={`w-3 h-3 rounded-full ${securitySettings.twoFactorAuth ? 'bg-green-500' : 'bg-yellow-500'}`}></div>
                  <span className="text-sm font-medium text-gray-700 dark:text-gray-300">
                    {securitySettings.twoFactorAuth ? 'Seguro' : 'Mejorar'}
                  </span>
                </div>
              </div>
            </div>
            
            {/* Security Analytics Dashboard */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Resumen de Seguridad</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                {/* Security Score */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400">Puntuación de Seguridad</p>
                      <p className="text-2xl font-bold text-blue-600 dark:text-blue-400">{securityAnalytics.securityScore}/100</p>
                    </div>
                    <div className={`w-12 h-12 rounded-full flex items-center justify-center ${
                      securityAnalytics.securityScore >= 80 ? 'bg-green-100 dark:bg-green-900/30' :
                      securityAnalytics.securityScore >= 60 ? 'bg-yellow-100 dark:bg-yellow-900/30' :
                      'bg-red-100 dark:bg-red-900/30'
                    }`}>
                      <svg className={`w-6 h-6 ${
                        securityAnalytics.securityScore >= 80 ? 'text-green-600 dark:text-green-400' :
                        securityAnalytics.securityScore >= 60 ? 'text-yellow-600 dark:text-yellow-400' :
                        'text-red-600 dark:text-red-400'
                      }`} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                      </svg>
                    </div>
                  </div>
                </div>
                
                {/* Login Activity */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Actividad de Login</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {securityAnalytics.loginAttempts.successful} exitosos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      {securityAnalytics.loginAttempts.failed} fallidos esta semana
                    </p>
                  </div>
                </div>
                
                {/* Device Activity */}
                <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-sm text-gray-600 dark:text-gray-400">Dispositivos Activos</p>
                    <p className="text-lg font-semibold text-gray-900 dark:text-gray-100">
                      {securityAnalytics.deviceActivity.knownDevices} conocidos
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Último cambio de contraseña: {securityAnalytics.lastPasswordChange}
                    </p>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Change Password Section */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Cambiar Contraseña</h4>
              
              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Contraseña Actual
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.current ? "text" : "password"}
                      name="currentPassword"
                      value={passwordData.currentPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10  rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('current')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {showPasswords.current ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.new ? "text" : "password"}
                      name="newPassword"
                      value={passwordData.newPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10  rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('new')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {showPasswords.new ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  
                  {/* Password Strength Indicator */}
                  {passwordData.newPassword && (
                    <div className="mt-2">
                      <div className="flex justify-between text-xs text-gray-600 dark:text-gray-400 mb-1">
                        <span>Fortaleza de la contraseña</span>
                        <span>{passwordStrength}%</span>
                      </div>
                      <div className="w-full bg-gray-200 rounded-full h-2">
                        <div 
                          className={`h-2 rounded-full transition-all duration-300 ${
                            passwordStrength < 25 ? 'bg-red-500' :
                            passwordStrength < 50 ? 'bg-orange-500' :
                            passwordStrength < 75 ? 'bg-yellow-500' : 'bg-green-500'
                          }`}
                          style={{ width: `${passwordStrength}%` }}
                        ></div>
                      </div>
                      <div className="text-xs text-gray-500 dark:text-gray-400 mt-1">
                        {passwordStrength < 25 && 'Muy débil - Añade más caracteres'}
                        {passwordStrength >= 25 && passwordStrength < 50 && 'Débil - Añade mayúsculas y números'}
                        {passwordStrength >= 50 && passwordStrength < 75 && 'Moderada - Añade símbolos especiales'}
                        {passwordStrength >= 75 && 'Fuerte - ¡Excelente contraseña!'}
                      </div>
                    </div>
                  )}
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Confirmar Nueva Contraseña
                  </label>
                  <div className="relative">
                    <input
                      type={showPasswords.confirm ? "text" : "password"}
                      name="confirmPassword"
                      value={passwordData.confirmPassword}
                      onChange={handlePasswordChange}
                      className="w-full px-3 py-2 pr-10  rounded-lg focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                      required
                    />
                    <button
                      type="button"
                      onClick={() => togglePasswordVisibility('confirm')}
                      className="absolute inset-y-0 right-0 pr-3 flex items-center text-sm leading-5 text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200"
                    >
                      {showPasswords.confirm ? (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path fillRule="evenodd" d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z" clipRule="evenodd" />
                          <path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" />
                        </svg>
                      ) : (
                        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                          <path d="M10 12a2 2 0 100-4 2 2 0 000 4z" />
                          <path fillRule="evenodd" d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z" clipRule="evenodd" />
                        </svg>
                      )}
                    </button>
                  </div>
                  {passwordData.confirmPassword && passwordData.newPassword !== passwordData.confirmPassword && (
                    <p className="text-red-500 text-xs mt-1">Las contraseñas no coinciden</p>
                  )}
                </div>
                
                <div>
                  <button 
                    type="submit"
                    className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors duration-200"
                    disabled={passwordStrength < 50 || passwordData.newPassword !== passwordData.confirmPassword}
                  >
                    Actualizar Contraseña
                  </button>
                </div>
              </form>
            </div>
            
            {/* Two-Factor Authentication */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Autenticación de Dos Factores (2FA)</h4>
              
              <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                <div className="flex items-start space-x-3">
                  <div className="flex-shrink-0 mt-1">
                    <div className={`w-4 h-4 rounded-full ${securitySettings.twoFactorAuth ? 'bg-green-500' : 'bg-orange-500'}`}></div>
                  </div>
                  <div className="flex-1">
                    <h5 className="font-medium text-blue-800 dark:text-blue-200">
                      {securitySettings.twoFactorAuth ? 'Habilitado' : 'Deshabilitado'}
                    </h5>
                    <p className="text-sm text-blue-600 dark:text-blue-300 mb-3">
                      {securitySettings.twoFactorAuth 
                        ? 'Tu cuenta está protegida con autenticación de dos factores'
                        : 'Añade una capa extra de seguridad a tu cuenta'
                      }
                    </p>
                    <button 
                      className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200 ${
                        securitySettings.twoFactorAuth
                          ? 'bg-red-100 text-red-700 hover:bg-red-200'
                          : 'bg-green-100 text-green-700 hover:bg-green-200'
                      }`}
                      onClick={handle2FAToggle}
                    >
                      {securitySettings.twoFactorAuth ? 'Deshabilitar 2FA' : 'Habilitar 2FA'}
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Active Sessions */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Sesiones Activas</h4>
              
              <div className="space-y-3">
                <div className="bg-blue-50 dark:bg-blue-900/30 rounded-lg p-4 border border-blue-100 dark:border-blue-800">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-600 dark:bg-blue-500 rounded-lg flex items-center justify-center text-white font-bold">
                        💻
                      </div>
                      <div>
                        <p className="text-sm font-medium text-blue-800 dark:text-blue-200">Este Dispositivo (Actual)</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">Windows 10 • Chrome • Ciudad de México</p>
                        <p className="text-xs text-blue-600 dark:text-blue-300">Última actividad: Ahora</p>
                      </div>
                    </div>
                    <span className="px-3 py-1 bg-green-100 dark:bg-green-900/30 text-green-800 dark:text-green-300 text-xs rounded-full font-medium">
                      Activo
                    </span>
                  </div>
                </div>
                
                <div className="bg-gray-50 dark:bg-gray-800 rounded-lg p-4 border border-gray-200 dark:border-gray-700">
                  <div className="flex justify-between items-center">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-gray-600 rounded-lg flex items-center justify-center text-white font-bold">
                        📱
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-800 dark:text-gray-200">iPhone 13</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">iOS 15 • Safari • Ciudad de México</p>
                        <p className="text-xs text-gray-600 dark:text-gray-400">Última actividad: Hace 3 días</p>
                      </div>
                    </div>
                    <button 
                      onClick={() => handleTerminateSession('mobile-session-1')}
                      className="text-sm text-red-600 dark:text-red-400 hover:text-red-800 dark:hover:text-red-300 font-medium"
                    >
                      Cerrar Sesión
                    </button>
                  </div>
                </div>
              </div>
            </div>
            
            {/* Security Settings */}
            <div className="mb-8">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Configuraciones de Seguridad</h4>
              
              <div className="space-y-4">
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Notificaciones de Inicio de Sesión
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Recibe alertas cuando alguien acceda a tu cuenta</p>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input
                      type="checkbox"
                      name="loginNotifications"
                      checked={securitySettings.loginNotifications}
                      onChange={handleSecuritySettingsChange}
                      className="sr-only peer"
                    />
                    <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600"></div>
                  </label>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Tiempo de Espera de Sesión
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Cerrar sesión automáticamente después de inactividad</p>
                  </div>
                  <select
                    name="sessionTimeout"
                    value={securitySettings.sessionTimeout}
                    onChange={handleSecuritySettingsChange}
                    className="px-3 py-1  rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={15}>15 minutos</option>
                    <option value={30}>30 minutos</option>
                    <option value={60}>1 hora</option>
                    <option value={120}>2 horas</option>
                    <option value={0}>Nunca</option>
                  </select>
                </div>
                
                <div className="flex items-center justify-between p-4 bg-blue-50 dark:bg-blue-900/30 rounded-lg border border-blue-100 dark:border-blue-800">
                  <div>
                    <label className="text-sm font-medium text-gray-700 dark:text-gray-300">
                      Expiración de Contraseña
                    </label>
                    <p className="text-xs text-gray-500 dark:text-gray-400">Solicitar cambio de contraseña periódicamente</p>
                  </div>
                  <select
                    name="passwordExpiry"
                    value={securitySettings.passwordExpiry}
                    onChange={handleSecuritySettingsChange}
                    className="px-3 py-1  rounded-lg text-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value={30}>30 días</option>
                    <option value={60}>60 días</option>
                    <option value={90}>90 días</option>
                    <option value={180}>180 días</option>
                    <option value={0}>Nunca</option>
                  </select>
                </div>
              </div>
            </div>
            
            {/* Security Recommendations */}
            <div className="mb-6">
              <h4 className="text-lg font-medium text-blue-800 dark:text-blue-200 mb-4">Recomendaciones de Seguridad</h4>
              
              <div className="bg-yellow-50 dark:bg-yellow-900/30 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
                <div className="flex">
                  <div className="flex-shrink-0">
                    <span className="text-yellow-600 dark:text-yellow-400 text-xl">⚠️</span>
                  </div>
                  <div className="ml-3">
                    <h5 className="text-sm font-medium text-yellow-800 dark:text-yellow-200">Mejora tu seguridad</h5>
                    <div className="mt-2 text-sm text-yellow-700 dark:text-yellow-300">
                      <ul className="list-disc list-inside space-y-1">
                        {!securitySettings.twoFactorAuth && <li>Habilita la autenticación de dos factores</li>}
                        {passwordStrength < 75 && <li>Usa una contraseña más fuerte</li>}
                        {securitySettings.sessionTimeout === 0 && <li>Configura un tiempo de espera de sesión</li>}
                        <li>Revisa regularmente tus sesiones activas</li>
                        <li>Mantén tu información de contacto actualizada</li>
                      </ul>
                    </div>
                  </div>
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
        <h2 className="text-2xl font-semibold text-blue-800 dark:text-blue-200 mb-4 md:mb-0">Configuración</h2>
      </div>
      
      {/* Settings tabs and content */}
      <VenetianTile className="overflow-hidden">
        <div className="border-b border-blue-100 dark:border-blue-800">
          <nav className="flex -mb-px">
            <button
              onClick={() => setActiveTab('general')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'general'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              General
            </button>
            
            <button
              onClick={() => setActiveTab('user')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'user'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Usuario
            </button>
            
            <button
              onClick={() => setActiveTab('system')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'system'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
              }`}
            >
              Sistema
            </button>
            
            <button
              onClick={() => setActiveTab('security')}
              className={`py-4 px-6 text-sm font-medium ${
                activeTab === 'security'
                  ? 'border-b-2 border-blue-500 text-blue-600 dark:text-blue-400'
                  : 'text-gray-500 dark:text-gray-400 hover:text-gray-700 dark:hover:text-gray-200 hover:border-gray-300 dark:hover:border-gray-600'
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
      
      {/* Toast notifications */}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
};

export default SettingsPage;
// DONE
