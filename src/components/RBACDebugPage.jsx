import React, { useState, useEffect } from 'react';
import { useAuth } from '../AuthContext';
import { usePermission } from '../hooks/useRBAC';
import { useAuthManager } from '../hooks/useAuthManager';
import rbacService from '../services/rbacService';

const RBACDebugPage = () => {
  const { session } = useAuth();
  const { user: authUser, loading: authLoading } = useAuthManager();
  const [debugInfo, setDebugInfo] = useState(null);
  const [loading, setLoading] = useState(true);
  
  // Test specific permissions
  const canViewReports = usePermission('view_reports');
  const canManageOrders = usePermission('manage_orders');
  const canViewInvitations = usePermission('manage_roles');

  useEffect(() => {
    const loadDebugInfo = async () => {
      if (!authUser || authLoading) {
        setLoading(false);
        return;
      }

      try {
        // RBAC will auto-initialize via AuthManager subscription
        // Just wait a moment for it to complete
        await new Promise(resolve => setTimeout(resolve, 100));
        
        const info = {
          user: {
            id: authUser.id,
            email: authUser.email,
          },
          rbacInitialized: rbacService.initialized,
          userRoles: rbacService.userRoles,
          userPermissions: rbacService.userPermissions,
          permissionChecks: {
            view_reports: rbacService.hasPermission('view_reports'),
            manage_orders: rbacService.hasPermission('manage_orders'),
            manage_roles: rbacService.hasPermission('manage_roles'),
          }
        };
        
        setDebugInfo(info);
      } catch (error) {
        console.error('Debug info error:', error);
        setDebugInfo({ error: error.message });
      } finally {
        setLoading(false);
      }
    };

    loadDebugInfo();
  }, [authUser, authLoading]);

  const refreshRBAC = async () => {
    setLoading(true);
    // Force refresh RBAC via AuthManager refresh
    await rbacService.initialize();
    window.location.reload(); // Force reload to refresh hooks
  };

  if (loading) {
    return (
      <div className="p-6">
        <h2 className="text-2xl font-bold mb-4">RBAC Debug - Loading...</h2>
      </div>
    );
  }

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h2 className="text-2xl font-bold text-gray-900 dark:text-gray-100">RBAC Debug Information</h2>
        <button 
          onClick={refreshRBAC}
          className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
        >
          Refresh RBAC
        </button>
      </div>

      {/* Current User Info */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Current User</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          <p><strong>ID:</strong> {debugInfo?.user?.id}</p>
          <p><strong>Email:</strong> {debugInfo?.user?.email}</p>
          <p><strong>RBAC Initialized:</strong> {debugInfo?.rbacInitialized ? '✅ Yes' : '❌ No'}</p>
        </div>
      </div>

      {/* User Roles */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">User Roles</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {debugInfo?.userRoles?.length > 0 ? (
            <ul className="space-y-1">
              {debugInfo.userRoles.map((role, index) => (
                <li key={index} className="flex items-center gap-2">
                  <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900 text-blue-800 dark:text-blue-200 rounded text-xs">
                    {role.role?.name || 'Unknown Role'}
                  </span>
                  <span className="text-xs text-gray-500">
                    Active: {role.is_active ? '✅' : '❌'}
                  </span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-red-600 dark:text-red-400">❌ No roles found</p>
          )}
        </div>
      </div>

      {/* User Permissions */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">User Permissions</h3>
        <div className="text-sm text-gray-700 dark:text-gray-300">
          {debugInfo?.userPermissions && Object.keys(debugInfo.userPermissions).length > 0 ? (
            <div className="space-y-2">
              {Object.entries(debugInfo.userPermissions).map(([module, permissions]) => (
                <div key={module}>
                  <strong className="text-blue-600 dark:text-blue-400">{module}:</strong>
                  <div className="ml-4 flex flex-wrap gap-1">
                    {permissions.map((perm, index) => (
                      <span key={index} className="px-2 py-1 bg-green-100 dark:bg-green-900 text-green-800 dark:text-green-200 rounded text-xs">
                        {perm}
                      </span>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-red-600 dark:text-red-400">❌ No permissions found</p>
          )}
        </div>
      </div>

      {/* Permission Tests */}
      <div className="bg-white dark:bg-gray-800 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Permission Tests</h3>
        <div className="space-y-2 text-sm">
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${canViewReports ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {canViewReports ? '✅' : '❌'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">view_reports (Hook)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${debugInfo?.permissionChecks?.view_reports ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {debugInfo?.permissionChecks?.view_reports ? '✅' : '❌'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">view_reports (Direct)</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${canManageOrders ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {canManageOrders ? '✅' : '❌'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">manage_orders</span>
          </div>
          <div className="flex items-center gap-2">
            <span className={`px-2 py-1 rounded text-xs ${canViewInvitations ? 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'}`}>
              {canViewInvitations ? '✅' : '❌'}
            </span>
            <span className="text-gray-700 dark:text-gray-300">manage_roles (Invitations)</span>
          </div>
        </div>
      </div>

      {/* Raw Debug Data */}
      <div className="bg-gray-50 dark:bg-gray-900 p-4 rounded-lg border">
        <h3 className="text-lg font-semibold mb-2 text-gray-900 dark:text-gray-100">Raw Debug Data</h3>
        <pre className="text-xs text-gray-700 dark:text-gray-300 overflow-auto">
          {JSON.stringify(debugInfo, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default RBACDebugPage;
