import React, { useState, useEffect } from 'react';
import { supabase } from '../supabaseClient';
import { DatabaseService } from '../services/databaseService';
import { connectionMonitor } from '../utils/connectionMonitor';

const SupabaseDiagnostic = () => {
  const [diagnostics, setDiagnostics] = useState({
    loading: true,
    connection: null,
    auth: null,
    tables: [],
    environment: null,
    connectionLog: [],
    realTimeTests: []
  });

  const [isRunningRealTimeTest, setIsRunningRealTimeTest] = useState(false);

  useEffect(() => {
    runDiagnostics();
  }, []);

  const runDiagnostics = async () => {
    setDiagnostics(prev => ({ ...prev, loading: true }));
    
    const results = {
      loading: false,
      connection: null,
      auth: null,
      tables: [],
      environment: null,
      connectionLog: connectionMonitor.getConnectionReport(),
      realTimeTests: diagnostics.realTimeTests
    };

    try {
      // Test basic connection
      const connectionStart = Date.now();
      const connectionTest = await connectionMonitor.testSupabaseConnection();
      results.connection = {
        ...connectionTest,
        timestamp: new Date().toISOString()
      };

      // Test auth
      try {
        const { data: authData, error: authError } = await supabase.auth.getSession();
        results.auth = {
          success: !authError,
          session: !!authData?.session,
          user: authData?.session?.user?.id || null,
          error: authError?.message
        };
      } catch (error) {
        results.auth = {
          success: false,
          error: error.message
        };
      }

      // Test database tables
      const tableTests = [
        'clients', 'products', 'suppliers', 'orders', 'quotes',
        'invoices', 'inventory', 'inventory_movements', 'maintenances',
        'employees', 'user_profiles', 'invitations', 'reports',
        'settings', 'dashboard_stats'
      ];

      for (const table of tableTests) {
        try {
          const testStart = Date.now();
          const { data, error } = await supabase
            .from(table)
            .select('id')
            .limit(1);
          
          results.tables.push({
            name: table,
            success: !error,
            recordCount: data?.length || 0,
            duration: Date.now() - testStart,
            error: error?.message
          });
        } catch (error) {
          results.tables.push({
            name: table,
            success: false,
            error: error.message,
            duration: Date.now() - testStart
          });
        }
      }

      // Environment info
      results.environment = {
        userAgent: navigator.userAgent,
        online: navigator.onLine,
        connection: navigator.connection ? {
          effectiveType: navigator.connection.effectiveType,
          downlink: navigator.connection.downlink,
          rtt: navigator.connection.rtt
        } : null,
        supabaseUrl: process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing',
        supabaseKey: process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing',
        timestamp: new Date().toISOString()
      };

    } catch (error) {
      results.connection = {
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      };
    }

    setDiagnostics(results);
  };

  const runRealTimeTest = async () => {
    setIsRunningRealTimeTest(true);
    const testResults = [];
    const dbService = new DatabaseService();

    try {
      await dbService.initialize();
      
      for (let i = 0; i < 5; i++) {
        const testStart = Date.now();
        try {
          const clients = await dbService.getAll('clients');
          testResults.push({
            attempt: i + 1,
            success: true,
            duration: Date.now() - testStart,
            recordCount: clients.length,
            timestamp: new Date().toISOString()
          });
        } catch (error) {
          testResults.push({
            attempt: i + 1,
            success: false,
            duration: Date.now() - testStart,
            error: error.message,
            timestamp: new Date().toISOString()
          });
        }
        
        // Wait 1 second between tests
        if (i < 4) {
          await new Promise(resolve => setTimeout(resolve, 1000));
        }
      }
    } catch (error) {
      testResults.push({
        attempt: 'init',
        success: false,
        error: error.message,
        timestamp: new Date().toISOString()
      });
    }

    setDiagnostics(prev => ({
      ...prev,
      realTimeTests: testResults
    }));
    setIsRunningRealTimeTest(false);
  };

  const exportDiagnostics = () => {
    const exportData = {
      ...diagnostics,
      connectionMonitorLog: connectionMonitor.exportLog(),
      exportTime: new Date().toISOString()
    };
    
    const blob = new Blob([JSON.stringify(exportData, null, 2)], {
      type: 'application/json'
    });
    
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `supabase-diagnostics-${Date.now()}.json`;
    a.click();
    URL.revokeObjectURL(url);
  };

  if (diagnostics.loading) {
    return (
      <div className="p-6">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
          <p className="mt-2 text-gray-600">Ejecutando diagnósticos...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 max-w-6xl mx-auto">
      <div className="mb-6 flex justify-between items-center">
        <h1 className="text-3xl font-bold text-gray-900">Diagnósticos de Supabase</h1>
        <div className="space-x-2">
          <button
            onClick={runDiagnostics}
            className="bg-blue-600 text-white px-4 py-2 rounded hover:bg-blue-700"
          >
            🔄 Reejecutar
          </button>
          <button
            onClick={runRealTimeTest}
            disabled={isRunningRealTimeTest}
            className="bg-green-600 text-white px-4 py-2 rounded hover:bg-green-700 disabled:bg-gray-400"
          >
            {isRunningRealTimeTest ? '⏳ Probando...' : '🔄 Test en Tiempo Real'}
          </button>
          <button
            onClick={exportDiagnostics}
            className="bg-teal-600 text-white px-4 py-2 rounded hover:bg-teal-700"
          >
            📊 Exportar Datos
          </button>
        </div>
      </div>

      {/* Connection Status */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-6">
        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Estado de Conexión</h2>
          {diagnostics.connection ? (
            <div className={`p-3 rounded ${diagnostics.connection.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center mb-2">
                <span className={`text-lg ${diagnostics.connection.success ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.connection.success ? '✅' : '❌'}
                </span>
                <span className="ml-2 font-medium">
                  {diagnostics.connection.success ? 'Conectado' : 'Error de conexión'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Duración: {diagnostics.connection.duration}ms</p>
                {diagnostics.connection.recordCount !== undefined && (
                  <p>Registros de prueba: {diagnostics.connection.recordCount}</p>
                )}
                {diagnostics.connection.error && (
                  <p className="text-red-600 mt-1">Error: {diagnostics.connection.error}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">No se pudo probar la conexión</p>
            </div>
          )}
        </div>

        <div className="bg-white border rounded-lg p-4">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Estado de Autenticación</h2>
          {diagnostics.auth ? (
            <div className={`p-3 rounded ${diagnostics.auth.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'}`}>
              <div className="flex items-center mb-2">
                <span className={`text-lg ${diagnostics.auth.success ? 'text-green-600' : 'text-red-600'}`}>
                  {diagnostics.auth.success ? '✅' : '❌'}
                </span>
                <span className="ml-2 font-medium">
                  {diagnostics.auth.success ? 'Auth OK' : 'Error de Auth'}
                </span>
              </div>
              <div className="text-sm text-gray-600">
                <p>Sesión activa: {diagnostics.auth.session ? 'Sí' : 'No'}</p>
                {diagnostics.auth.user && <p>Usuario ID: {diagnostics.auth.user}</p>}
                {diagnostics.auth.error && (
                  <p className="text-red-600 mt-1">Error: {diagnostics.auth.error}</p>
                )}
              </div>
            </div>
          ) : (
            <div className="bg-gray-50 p-3 rounded">
              <p className="text-gray-600">No se pudo verificar la autenticación</p>
            </div>
          )}
        </div>
      </div>

      {/* Tables Test */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Pruebas de Tablas</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
          {diagnostics.tables.map((table) => (
            <div
              key={table.name}
              className={`p-3 rounded border ${
                table.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
              }`}
            >
              <div className="flex items-center justify-between">
                <span className="font-medium">{table.name}</span>
                <span className={table.success ? 'text-green-600' : 'text-red-600'}>
                  {table.success ? '✅' : '❌'}
                </span>
              </div>
              <div className="text-xs text-gray-600 mt-1">
                {table.duration}ms
                {table.success && table.recordCount !== undefined && ` • ${table.recordCount} registros`}
                {table.error && <div className="text-red-600 mt-1">{table.error}</div>}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Real-time Tests */}
      {diagnostics.realTimeTests.length > 0 && (
        <div className="bg-white border rounded-lg p-4 mb-6">
          <h2 className="text-xl font-semibold mb-3 text-gray-800">Tests en Tiempo Real</h2>
          <div className="space-y-2">
            {diagnostics.realTimeTests.map((test, index) => (
              <div
                key={index}
                className={`p-3 rounded border ${
                  test.success ? 'bg-green-50 border-green-200' : 'bg-red-50 border-red-200'
                }`}
              >
                <div className="flex items-center justify-between">
                  <span>Intento {test.attempt}</span>
                  <span className={`text-sm ${test.success ? 'text-green-600' : 'text-red-600'}`}>
                    {test.success ? `✅ ${test.duration}ms` : `❌ ${test.error}`}
                  </span>
                </div>
                {test.success && test.recordCount !== undefined && (
                  <div className="text-xs text-gray-600">
                    {test.recordCount} registros encontrados
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Connection Monitor Log */}
      <div className="bg-white border rounded-lg p-4 mb-6">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Monitor de Conexión</h2>
        <div className="bg-gray-50 p-3 rounded mb-3">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
            <div>
              <span className="font-medium">Estado:</span>
              <span className={`ml-1 ${diagnostics.connectionLog.isOnline ? 'text-green-600' : 'text-red-600'}`}>
                {diagnostics.connectionLog.isOnline ? 'Online' : 'Offline'}
              </span>
            </div>
            <div>
              <span className="font-medium">Uptime:</span>
              <span className="ml-1">{Math.round(diagnostics.connectionLog.uptime / 1000)}s</span>
            </div>
            <div>
              <span className="font-medium">Eventos:</span>
              <span className="ml-1">{diagnostics.connectionLog.logEntries}</span>
            </div>
            {diagnostics.connectionLog.connection && (
              <div>
                <span className="font-medium">Tipo:</span>
                <span className="ml-1">{diagnostics.connectionLog.connection.effectiveType}</span>
              </div>
            )}
          </div>
        </div>
        
        <div className="max-h-40 overflow-y-auto">
          {diagnostics.connectionLog.recentEvents.map((event, index) => (
            <div key={index} className="text-xs border-b border-gray-200 py-1">
              <span className="text-gray-500">
                {new Date(event.timestamp).toLocaleTimeString()}
              </span>
              <span className="ml-2">{event.message}</span>
              {event.details && (
                <span className="ml-1 text-gray-600">
                  ({typeof event.details === 'string' ? event.details : JSON.stringify(event.details)})
                </span>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* Environment Info */}
      <div className="bg-white border rounded-lg p-4">
        <h2 className="text-xl font-semibold mb-3 text-gray-800">Información del Entorno</h2>
        {diagnostics.environment && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Configuración</h3>
              <div className="space-y-1">
                <div>
                  <span className="font-medium">URL Supabase:</span>
                  <span className={`ml-1 ${diagnostics.environment.supabaseUrl === 'Set' ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.environment.supabaseUrl}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Clave Anónima:</span>
                  <span className={`ml-1 ${diagnostics.environment.supabaseKey === 'Set' ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.environment.supabaseKey}
                  </span>
                </div>
                <div>
                  <span className="font-medium">Estado Online:</span>
                  <span className={`ml-1 ${diagnostics.environment.online ? 'text-green-600' : 'text-red-600'}`}>
                    {diagnostics.environment.online ? 'Conectado' : 'Desconectado'}
                  </span>
                </div>
              </div>
            </div>
            
            <div>
              <h3 className="font-medium text-gray-700 mb-2">Conexión de Red</h3>
              {diagnostics.environment.connection ? (
                <div className="space-y-1">
                  <div>
                    <span className="font-medium">Tipo:</span>
                    <span className="ml-1">{diagnostics.environment.connection.effectiveType}</span>
                  </div>
                  <div>
                    <span className="font-medium">Velocidad:</span>
                    <span className="ml-1">{diagnostics.environment.connection.downlink} Mbps</span>
                  </div>
                  <div>
                    <span className="font-medium">Latencia:</span>
                    <span className="ml-1">{diagnostics.environment.connection.rtt}ms</span>
                  </div>
                </div>
              ) : (
                <p className="text-gray-600">Información de conexión no disponible</p>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseDiagnostic;
