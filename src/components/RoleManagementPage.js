/**
 * RoleManagementPage - Administrative interface for managing  const getRoleColor      <div className="venetian-bg p-6 rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary">Detalles del Rol: {selectedRole?.display_name}</h3>
          <button
            onClick={() => setShowRoleModal(false)}
            className="text-muted-foreground hover:text-primary"leName) => {
    const colors = {
      admin: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
      manager: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
      staff: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
      viewer: 'bg-secondary text-secondary-foreground'
    };
    return colors[roleName] || 'bg-secondary text-secondary-foreground';
  };es and permissions
 */

import React, { useState, useEffect } from 'react';
import { useRBAC } from '../hooks/useRBAC';
import rbacService from '../services/rbacService';
import ProtectedRoute from './ProtectedRoute';
import VenetianTile from './VenetianTile';

const RoleManagementPage = () => {
  const { isAdmin, refreshUserInfo } = useRBAC();
  const [roles, setRoles] = useState([]);
  const [usersWithRoles, setUsersWithRoles] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedRole, setSelectedRole] = useState(null);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAssignModal, setShowAssignModal] = useState(false);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [rolesData, usersData] = await Promise.all([
        rbacService.getAllRoles(),
        rbacService.getUsersWithRoles()
      ]);

      setRoles(rolesData);
      setUsersWithRoles(usersData);
    } catch (err) {
      setError('Error al cargar datos de roles');
      console.error('Error loading role data:', err);
    } finally {
      setLoading(false);
    }
  };

  const handleAssignRole = async (userId, roleId) => {
    try {
      await rbacService.assignRole(userId, roleId);
      await loadData();
      await refreshUserInfo();
      setShowAssignModal(false);
    } catch (error) {
      console.error('Error assigning role:', error);
      alert('Error al asignar rol: ' + error.message);
    }
  };

  const handleRemoveRole = async (userId, roleId) => {
    try {
      await rbacService.removeRole(userId, roleId);
      await loadData();
      await refreshUserInfo();
    } catch (error) {
      console.error('Error removing role:', error);
      alert('Error al remover rol: ' + error.message);
    }
  };

  const getRoleBadgeColor = (roleName) => {
    const colors = {
      admin: 'bg-red-100 text-red-800',
      manager: 'bg-blue-100 text-blue-800',
      staff: 'bg-green-100 text-green-800',
      viewer: 'bg-gray-100 text-gray-800'
    };
    return colors[roleName] || 'bg-gray-100 text-gray-800';
  };

  const RoleModal = () => (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white p-6 rounded-lg max-w-4xl w-full max-h-96 overflow-y-auto">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-medium text-primary">Detalles del Rol: {selectedRole?.display_name}</h3>
          <button
            onClick={() => setShowRoleModal(false)}
            className="text-muted-foreground hover:text-primary"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
        
        {selectedRole && (
          <div>
            <div className="mb-4">
              <h4 className="font-medium text-primary mb-2">Información General</h4>
              <p className="text-muted-foreground"><strong>Nombre:</strong> {selectedRole.name}</p>
              <p className="text-muted-foreground"><strong>Descripción:</strong> {selectedRole.description}</p>
              <p className="text-muted-foreground"><strong>Estado:</strong> {selectedRole.is_active ? 'Activo' : 'Inactivo'}</p>
            </div>

            <div>
              <h4 className="font-medium text-primary mb-2">Permisos</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {selectedRole.permissions && Object.entries(selectedRole.permissions).map(([module, actions]) => (
                  <div key={module} className="border p-3 rounded">
                    <h5 className="font-medium capitalize mb-2">{module}</h5>
                    <div className="flex flex-wrap gap-1">
                      {actions.map((action) => (
                        <span
                          key={action}
                          className="inline-flex px-2 py-1 text-xs font-medium bg-blue-100 text-blue-800 rounded"
                        >
                          {action}
                        </span>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );

  return (
    <ProtectedRoute requiredRole="admin">
      <div className="p-6">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-primary">Gestión de Roles</h1>
          <p className="text-muted-foreground">Administra roles de usuario y permisos del sistema</p>
        </div>

        {loading ? (
          <div className="text-center py-8">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Cargando datos de roles...</p>
          </div>
        ) : error ? (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded">
            {error}
          </div>
        ) : (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Roles Section */}
            <VenetianTile>
              <div className="px-6 py-4 venetian-border-b">
                <h2 className="text-lg font-medium text-primary">Roles del Sistema</h2>
              </div>
              <div className="p-6">
                <div className="space-y-4">
                  {roles.map((role) => (
                    <div
                      key={role.id}
                      className="venetian-border rounded-lg p-4 hover:bg-secondary cursor-pointer"
                      onClick={() => {
                        setSelectedRole(role);
                        setShowRoleModal(true);
                      }}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-primary">{role.display_name}</h3>
                          <p className="text-sm text-muted-foreground">{role.description}</p>
                        </div>
                        <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(role.name)}`}>
                          {role.name}
                        </span>
                      </div>
                      <div className="mt-2 text-sm text-muted-foreground">
                        {role.permissions && Object.keys(role.permissions).length} módulos con permisos
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </VenetianTile>

            {/* Users with Roles Section */}
            <VenetianTile>
              <div className="px-6 py-4 venetian-border-b">
                <h2 className="text-lg font-medium text-primary">Usuarios y Roles</h2>
              </div>
              <div className="p-6">
                {usersWithRoles.length === 0 ? (
                  <p className="text-muted-foreground text-center py-4">No hay usuarios con roles asignados</p>
                ) : (
                  <div className="space-y-4">
                    {usersWithRoles.map((userWithRole) => (
                      <div key={userWithRole.user_id} className="border border-gray-200 rounded-lg p-4">
                        <div className="flex items-center justify-between mb-2">
                          <div>
                            <h4 className="font-medium text-gray-900">Usuario ID: {userWithRole.user_id.slice(0, 8)}...</h4>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {userWithRole.roles.map((userRole) => (
                            <div key={userRole.role.id} className="flex items-center">
                              <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getRoleBadgeColor(userRole.role.name)}`}>
                                {userRole.role.display_name}
                              </span>
                              {isAdmin() && (
                                <button
                                  onClick={() => handleRemoveRole(userWithRole.user_id, userRole.role.id)}
                                  className="ml-1 text-red-500 hover:text-red-700"
                                  title="Remover rol"
                                >
                                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                                  </svg>
                                </button>
                              )}
                            </div>
                          ))}
                        </div>
                        <div className="text-xs text-muted-foreground mt-2">
                          Asignado el: {new Date(userWithRole.roles[0]?.assigned_at).toLocaleDateString()}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </VenetianTile>
          </div>
        )}

        {/* Role Details Modal */}
        {showRoleModal && selectedRole && <RoleModal />}

        {/* Quick Stats */}
        <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-blue-600">{roles.length}</div>
            <div className="text-sm text-gray-600">Roles Totales</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-green-600">{usersWithRoles.length}</div>
            <div className="text-sm text-gray-600">Usuarios con Roles</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-purple-600">
              {roles.filter(r => r.name === 'admin').length}
            </div>
            <div className="text-sm text-gray-600">Administradores</div>
          </div>
          <div className="bg-white p-4 rounded-lg shadow">
            <div className="text-2xl font-bold text-orange-600">
              {roles.filter(r => r.is_active).length}
            </div>
            <div className="text-sm text-gray-600">Roles Activos</div>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default RoleManagementPage;
