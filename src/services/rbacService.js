/**
 * RBAC Service - Role-Based Access Control
 * Handles user roles, permissions, and access control throughout the application
 */

import { supabase } from '../supabaseClient';
import authManager from './authManager';

class RBACService {
  constructor() {
    this.currentUser = null;
    this.userRoles = [];
    this.userPermissions = {};
    this.initialized = false;
    this.initializationPromise = null;

    // Subscribe to auth changes to auto-reinitialize
    authManager.subscribe((user, session) => {
      if (user && user.id !== this.currentUser?.id) {
        // User changed, reinitialize
        this.resetRBAC();
        this.initialize();
      } else if (!user) {
        // User logged out
        this.resetRBAC();
      }
    });
  }

  // Initialize RBAC for current user
  async initialize() {
    // Prevent multiple simultaneous initializations
    if (this.initializationPromise) {
      return this.initializationPromise;
    }

    this.initializationPromise = this._performInitialization();
    
    try {
      return await this.initializationPromise;
    } finally {
      this.initializationPromise = null;
    }
  }

  async _performInitialization() {
    try {
      if (!supabase || !supabase.auth) {
        console.error('Supabase client not available for RBAC - check environment variables');
        console.error('SUPABASE_URL:', process.env.REACT_APP_SUPABASE_URL ? 'Set' : 'Missing');
        console.error('SUPABASE_ANON_KEY:', process.env.REACT_APP_SUPABASE_ANON_KEY ? 'Set' : 'Missing');
        return false;
      }

      // Use AuthManager instead of direct supabase.auth.getUser()
      const user = await authManager.getCurrentUser();
      
      if (!user) {
        // User not logged in - this is normal, don't log as warning
        this.resetRBAC();
        return false;
      }

      console.log('RBAC initializing for user:', user.email);
      this.currentUser = user;
      await this.loadUserRoles();
      this.initialized = true;
      console.log('RBAC initialized successfully');
      return true;
    } catch (error) {
      // Only log error if it's not a session missing error
      if (error.name !== 'AuthSessionMissingError') {
        console.error('Error initializing RBAC:', error);
      }
      this.resetRBAC();
      return false;
    }
  }

  // Reset RBAC state
  resetRBAC() {
    this.currentUser = null;
    this.userRoles = [];
    this.userPermissions = {};
    this.initialized = false;
  }

  // Load user roles and permissions
  async loadUserRoles() {
    try {
      if (!this.currentUser) {
        console.warn('No current user in loadUserRoles');
        return;
      }

      console.log('Loading roles for user:', this.currentUser.email);

      // Load user roles with role information
      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', this.currentUser.id)
        .eq('is_active', true);

      if (rolesError) {
        console.error('Error loading user roles:', rolesError);
        console.error('Database tables might not exist or RLS policies blocking access');
        
        // Try alternative approach - look up by email in employees table
        if (rolesError.code === 'PGRST116' || rolesError.message?.includes('does not exist')) {
          console.log('🔄 RBAC: Trying alternative user lookup by email...');
          return await this.tryAlternativeRoleLookup();
        }
        
        this.userRoles = [];
        this.userPermissions = {};
        return;
      }

      this.userRoles = userRoles || [];
      console.log('Loaded user roles:', this.userRoles.map(r => r.role?.name));

      // If no roles found, try alternative lookup
      if (this.userRoles.length === 0) {
        console.log('🔄 RBAC: No roles found by user ID, trying alternative lookup...');
        await this.tryAlternativeRoleLookup();
      }

      // Load permissions for the user's roles
      if (this.userRoles.length > 0) {
        const roleIds = this.userRoles.map(ur => ur.role_id);
        
        const { data: permissions, error: permissionsError } = await supabase
          .from('role_permissions')
          .select(`
            permission:permissions(name, resource, action)
          `)
          .in('role_id', roleIds);

        if (permissionsError) {
          console.error('Error loading permissions:', permissionsError);
          this.userPermissions = {};
        } else {
          this.userPermissions = this.aggregatePermissions(permissions || []);
          console.log('Loaded permissions:', this.userPermissions);
        }
      } else {
        console.warn('No roles found for user');
        this.userPermissions = {};
      }
    } catch (error) {
      console.error('Error in loadUserRoles:', error);
      this.userRoles = [];
      this.userPermissions = {};
    }
  }

  /**
   * Try alternative role lookup when primary method fails
   */
  async tryAlternativeRoleLookup() {
    try {
      if (!this.currentUser?.email) return;

      console.log('🔍 RBAC: Attempting alternative role lookup for:', this.currentUser.email);

      // Look up user in employees table
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('id, email, role')
        .eq('email', this.currentUser.email)
        .single();

      if (empError) {
        console.log('No employee record found for user');
        return;
      }

      if (employee) {
        console.log('📋 RBAC: Found employee record:', employee);
        
        // If employee has a role field, try to find matching role
        if (employee.role) {
          const { data: role, error: roleError } = await supabase
            .from('roles')
            .select('*')
            .eq('name', employee.role)
            .single();

          if (!roleError && role) {
            console.log('✅ RBAC: Found role from employee record:', role.name);
            
            // Create a pseudo user-role entry
            this.userRoles = [{
              role_id: role.id,
              role: role,
              user_id: this.currentUser.id,
              is_active: true,
              source: 'employee_table'
            }];
          }
        }
      }
    } catch (error) {
      console.error('Alternative role lookup failed:', error);
    }
  }

  // Aggregate permissions from all user roles
  aggregatePermissions(permissionsData = []) {
    const permissions = {};

    permissionsData.forEach(rolePermission => {
      if (rolePermission.permission) {
        const perm = rolePermission.permission;
        const module = perm.resource || 'general';
        
        if (!permissions[module]) {
          permissions[module] = new Set();
        }
        
        // Add both the permission name and action
        permissions[module].add(perm.action);
        permissions[module].add(perm.name);
      }
    });

    // Convert Sets to Arrays for easier usage
    Object.keys(permissions).forEach(module => {
      permissions[module] = Array.from(permissions[module]);
    });

    return permissions;
  }

  // Check if user has a specific permission
  hasPermission(moduleOrPermission, action = null) {
    if (!this.initialized) {
      console.warn('RBAC not initialized, allowing access (fallback for development)');
      // In production, we might want to be more restrictive
      return process.env.NODE_ENV === 'development';
    }

    // If action is null, treat moduleOrPermission as a permission name
    if (action === null) {
      // Search through all modules for the permission name
      for (const module in this.userPermissions) {
        if (this.userPermissions[module].includes(moduleOrPermission)) {
          console.log(`Permission check: ${moduleOrPermission} - GRANTED`);
          return true;
        }
      }
      console.log(`Permission check: ${moduleOrPermission} - DENIED`);
      console.log('Available permissions:', this.userPermissions);
      return false;
    }

    // Traditional module/action check
    if (!this.userPermissions[moduleOrPermission]) {
      console.log(`Module permission check: ${moduleOrPermission}/${action} - DENIED (module not found)`);
      return false;
    }

    const hasAccess = this.userPermissions[moduleOrPermission].includes(action);
    console.log(`Module permission check: ${moduleOrPermission}/${action} - ${hasAccess ? 'GRANTED' : 'DENIED'}`);
    return hasAccess;
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
