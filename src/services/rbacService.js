/**
 * RBAC Service - Role-Based Access Control
 * Handles user roles, permissions, and access control throughout the application
 */

import { supabase } from '../supabaseClient';

class RBACService {
  constructor() {
    this.currentUser = null;
    this.userRoles = [];
    this.userPermissions = {};
    this.initialized = false;
  }

  // Initialize RBAC for current user
  async initialize() {
    try {
      if (!supabase || !supabase.auth) {
        console.warn('Supabase client not available for RBAC');
        return false;
      }

      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        this.currentUser = null;
        this.userRoles = [];
        this.userPermissions = {};
        this.initialized = false;
        return false;
      }

      this.currentUser = user;
      await this.loadUserRoles();
      this.initialized = true;
      return true;
    } catch (error) {
      console.error('Error initializing RBAC:', error);
      this.initialized = false;
      return false;
    }
  }

  // Load user roles and permissions
  async loadUserRoles() {
    try {
      if (!this.currentUser) return;

      const { data: userRoles, error } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', this.currentUser.id)
        .eq('is_active', true);

      if (error) {
        console.error('Error loading user roles:', error);
        return;
      }

      this.userRoles = userRoles || [];
      this.userPermissions = this.aggregatePermissions();
    } catch (error) {
      console.error('Error in loadUserRoles:', error);
    }
  }

  // Aggregate permissions from all user roles
  aggregatePermissions() {
    const permissions = {};

    this.userRoles.forEach(userRole => {
      if (userRole.role && userRole.role.permissions) {
        const rolePermissions = userRole.role.permissions;
        
        Object.keys(rolePermissions).forEach(module => {
          if (!permissions[module]) {
            permissions[module] = new Set();
          }
          
          const modulePermissions = rolePermissions[module];
          if (Array.isArray(modulePermissions)) {
            modulePermissions.forEach(permission => {
              permissions[module].add(permission);
            });
          }
        });
      }
    });

    // Convert Sets to Arrays for easier usage
    Object.keys(permissions).forEach(module => {
      permissions[module] = Array.from(permissions[module]);
    });

    return permissions;
  }

  // Check if user has a specific permission
  hasPermission(module, action) {
    if (!this.initialized) {
      console.warn('RBAC not initialized, allowing access');
      return true; // Allow access if RBAC is not initialized (fallback)
    }

    if (!this.userPermissions[module]) {
      return false;
    }

    return this.userPermissions[module].includes(action);
  }

  // Check if user has any of the specified roles
  hasRole(roleNames) {
    if (!this.initialized) {
      return true; // Allow access if RBAC is not initialized
    }

    if (typeof roleNames === 'string') {
      roleNames = [roleNames];
    }

    return this.userRoles.some(userRole => 
      userRole.role && roleNames.includes(userRole.role.name)
    );
  }

  // Check if user has admin role
  isAdmin() {
    return this.hasRole('admin');
  }

  // Check if user has manager or admin role
  isManager() {
    return this.hasRole(['admin', 'manager']);
  }

  // Get user's highest role priority
  getHighestRole() {
    const rolePriority = {
      'admin': 4,
      'manager': 3,
      'staff': 2,
      'viewer': 1
    };

    let highestRole = null;
    let highestPriority = 0;

    this.userRoles.forEach(userRole => {
      if (userRole.role && userRole.role.name) {
        const priority = rolePriority[userRole.role.name] || 0;
        if (priority > highestPriority) {
          highestPriority = priority;
          highestRole = userRole.role;
        }
      }
    });

    return highestRole;
  }

  // Get all available roles
  async getAllRoles() {
    try {
      const { data, error } = await supabase
        .from('roles')
        .select('*')
        .eq('is_active', true)
        .order('name');

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching roles:', error);
      return [];
    }
  }

  // Assign role to user
  async assignRole(userId, roleId, assignedBy = null) {
    try {
      if (!this.hasPermission('users', 'update')) {
        throw new Error('No tienes permisos para asignar roles');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .insert([{
          user_id: userId,
          role_id: roleId,
          assigned_by: assignedBy || this.currentUser?.id,
          is_active: true
        }])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error assigning role:', error);
      throw error;
    }
  }

  // Remove role from user
  async removeRole(userId, roleId) {
    try {
      if (!this.hasPermission('users', 'update')) {
        throw new Error('No tienes permisos para remover roles');
      }

      const { error } = await supabase
        .from('user_roles')
        .update({ is_active: false })
        .eq('user_id', userId)
        .eq('role_id', roleId);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error removing role:', error);
      throw error;
    }
  }

  // Get users with their roles
  async getUsersWithRoles() {
    try {
      if (!this.hasPermission('users', 'read')) {
        throw new Error('No tienes permisos para ver usuarios');
      }

      const { data, error } = await supabase
        .from('user_roles')
        .select(`
          user_id,
          is_active,
          assigned_at,
          role:roles(*)
        `)
        .eq('is_active', true);

      if (error) throw error;

      // Group by user_id
      const usersMap = {};
      data?.forEach(userRole => {
        if (!usersMap[userRole.user_id]) {
          usersMap[userRole.user_id] = {
            user_id: userRole.user_id,
            roles: []
          };
        }
        usersMap[userRole.user_id].roles.push(userRole);
      });

      return Object.values(usersMap);
    } catch (error) {
      console.error('Error fetching users with roles:', error);
      return [];
    }
  }

  // Create new role
  async createRole(roleData) {
    try {
      if (!this.hasPermission('users', 'create')) {
        throw new Error('No tienes permisos para crear roles');
      }

      const { data, error } = await supabase
        .from('roles')
        .insert([roleData])
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating role:', error);
      throw error;
    }
  }

  // Update role
  async updateRole(roleId, roleData) {
    try {
      if (!this.hasPermission('users', 'update')) {
        throw new Error('No tienes permisos para actualizar roles');
      }

      const { data, error } = await supabase
        .from('roles')
        .update({
          ...roleData,
          updated_at: new Date().toISOString()
        })
        .eq('id', roleId)
        .select();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating role:', error);
      throw error;
    }
  }

  // Check module access for UI rendering
  canAccessModule(module) {
    return this.hasPermission(module, 'read');
  }

  // Check if user can perform action on module
  canPerformAction(module, action) {
    return this.hasPermission(module, action);
  }

  // Get user info with roles
  getCurrentUserInfo() {
    return {
      user: this.currentUser,
      roles: this.userRoles,
      permissions: this.userPermissions,
      highestRole: this.getHighestRole(),
      isAdmin: this.isAdmin(),
      isManager: this.isManager()
    };
  }
}

// Create singleton instance
const rbacService = new RBACService();

export default rbacService;
