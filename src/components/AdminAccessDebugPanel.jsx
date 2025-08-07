import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import rbacService from '../services/rbacService';
import rbacDebugger from '../services/rbacDebugger';

const AdminAccessDebugPanel = () => {
  const { session, authManager } = useAuth();
  const [isVisible, setIsVisible] = useState(false);
  const [diagnostics, setDiagnostics] = useState(null);
  const [loading, setLoading] = useState(false);

  // Only show in development or if user has debug access
  useEffect(() => {
    const isDev = process.env.NODE_ENV === 'development';
    const hasDebugAccess = localStorage.getItem('SHOW_DEBUG_PANEL') === 'true';
    setIsVisible(isDev || hasDebugAccess);
  }, []);

  const runDiagnostics = async () => {
    setLoading(true);
    try {
      const results = await rbacDebugger.runDiagnostics();
      setDiagnostics(results);
    } catch (error) {
      console.error('Diagnostics failed:', error);
    } finally {
      setLoading(false);
    }
  };

  const quickFix = async () => {
    setLoading(true);
    try {
      const result = await rbacDebugger.quickFix();
      if (result.success) {
        alert('Quick fix successful! Admin access should be restored.');
        window.location.reload();
      } else {
        alert('Quick fix failed. Check console for details.');
      }
    } catch (error) {
      alert('Quick fix error: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  const refreshAuth = async () => {
    setLoading(true);
    try {
      await authManager.refresh();
      await rbacService.initialize();
      alert('Authentication refreshed successfully!');
    } catch (error) {
      alert('Refresh failed: ' + error.message);
    } finally {
      setLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 right-4 z-50">
      <div className="bg-gray-900 text-white p-4 rounded-lg shadow-lg max-w-md">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-bold">🛠️ Admin Debug Panel</h3>
          <button 
            onClick={() => setIsVisible(false)}
            className="text-gray-400 hover:text-white"
          >
            ✕
          </button>
        </div>

        <div className="space-y-2">
          <div className="text-xs">
            <strong>User:</strong> {session?.user?.email || 'Not logged in'}
          </div>
          <div className="text-xs">
            <strong>RBAC:</strong> {rbacService.initialized ? '✅ Ready' : '❌ Not initialized'}
          </div>
          <div className="text-xs">
            <strong>Roles:</strong> {rbacService.userRoles?.length || 0}
          </div>
          <div className="text-xs">
            <strong>Admin Access:</strong> {
              rbacService.hasPermission('admin') || 
              rbacService.hasPermission('manage_users') ||
              rbacService.hasPermission('manage_roles') ? '✅ Yes' : '❌ No'
            }
          </div>
        </div>

        <div className="flex gap-2 mt-3">
          <button 
            onClick={runDiagnostics}
            disabled={loading}
            className="px-2 py-1 bg-blue-600 hover:bg-blue-700 rounded text-xs disabled:opacity-50"
          >
            {loading ? '...' : '🔍 Diagnose'}
          </button>
          <button 
            onClick={quickFix}
            disabled={loading}
            className="px-2 py-1 bg-green-600 hover:bg-green-700 rounded text-xs disabled:opacity-50"
          >
            {loading ? '...' : '🔧 Quick Fix'}
          </button>
          <button 
            onClick={refreshAuth}
            disabled={loading}
            className="px-2 py-1 bg-yellow-600 hover:bg-yellow-700 rounded text-xs disabled:opacity-50"
          >
            {loading ? '...' : '🔄 Refresh'}
          </button>
        </div>

        {diagnostics && (
          <div className="mt-3 text-xs bg-gray-800 p-2 rounded max-h-32 overflow-y-auto">
            <strong>Last Diagnostic Results:</strong>
            <pre className="text-xs whitespace-pre-wrap">
              {JSON.stringify(diagnostics.checks, null, 2)}
            </pre>
          </div>
        )}

        <div className="mt-2 text-xs text-gray-400">
          Press F12 → Console for detailed logs
        </div>
      </div>
    </div>
  );
};

export default AdminAccessDebugPanel;
