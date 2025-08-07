/**
 * RBAC Debug and Recovery Utility
 * Diagnoses and fixes common admin access issues
 */

import { supabase } from '../supabaseClient';
import authManager from './authManager';

class RBACDebugger {
  constructor() {
    this.diagnosticResults = {};
  }

  /**
   * Comprehensive RBAC diagnostic check
   */
  async runDiagnostics() {
    console.group('🔍 RBAC Diagnostics Started');
    
    const results = {
      timestamp: new Date().toISOString(),
      checks: {}
    };

    try {
      // 1. Check authentication state
      results.checks.authentication = await this.checkAuthentication();
      
      // 2. Check database connectivity
      results.checks.database = await this.checkDatabaseConnectivity();
      
      // 3. Check user existence in database
      results.checks.userExists = await this.checkUserInDatabase();
      
      // 4. Check role assignments
      results.checks.roleAssignments = await this.checkRoleAssignments();
      
      // 5. Check permissions
      results.checks.permissions = await this.checkPermissions();
      
      // 6. Check RLS policies
      results.checks.rlsPolicies = await this.checkRLSPolicies();
      
      // 7. Generate recommendations
      results.recommendations = this.generateRecommendations(results.checks);
      
      this.diagnosticResults = results;
      this.displayResults(results);
      
      return results;
    } catch (error) {
      console.error('❌ Diagnostic failed:', error);
      return { error: error.message, checks: results.checks };
    } finally {
      console.groupEnd();
    }
  }

  /**
   * Check authentication state
   */
  async checkAuthentication() {
    try {
      const user = await authManager.getCurrentUser();
      const session = authManager.getCurrentSession();
      
      return {
        status: user ? 'SUCCESS' : 'FAILED',
        hasUser: !!user,
        hasSession: !!session,
        userId: user?.id,
        userEmail: user?.email,
        cacheValid: authManager.isCacheValid(),
        details: user ? `Authenticated as ${user.email}` : 'No authenticated user'
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Failed to get authentication state'
      };
    }
  }

  /**
   * Check database connectivity
   */
  async checkDatabaseConnectivity() {
    try {
      const { data, error, count } = await supabase
        .from('users')
        .select('*', { count: 'exact', head: true });
      
      if (error) throw error;
      
      return {
        status: 'SUCCESS',
        details: `Database connected, found ${count} users`,
        tablesAccessible: true
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Cannot access database tables',
        tablesAccessible: false
      };
    }
  }

  /**
   * Check if current user exists in database
   */
  async checkUserInDatabase() {
    try {
      const authUser = await authManager.getCurrentUser();
      if (!authUser) {
        return {
          status: 'FAILED',
          details: 'No authenticated user to check'
        };
      }

      // Check in users table
      const { data: dbUser, error: userError } = await supabase
        .from('users')
        .select('*')
        .eq('id', authUser.id)
        .single();

      // Check in employees table (alternative lookup)
      const { data: employee, error: empError } = await supabase
        .from('employees')
        .select('*')
        .eq('email', authUser.email)
        .single();

      return {
        status: dbUser || employee ? 'SUCCESS' : 'WARNING',
        inUsersTable: !!dbUser,
        inEmployeesTable: !!employee,
        userRecord: dbUser,
        employeeRecord: employee,
        details: dbUser || employee 
          ? 'User found in database' 
          : 'User not found in users or employees table'
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Failed to check user in database'
      };
    }
  }

  /**
   * Check role assignments
   */
  async checkRoleAssignments() {
    try {
      const authUser = await authManager.getCurrentUser();
      if (!authUser) {
        return {
          status: 'FAILED',
          details: 'No authenticated user'
        };
      }

      const { data: userRoles, error: rolesError } = await supabase
        .from('user_roles')
        .select(`
          *,
          role:roles(*)
        `)
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      if (rolesError) throw rolesError;

      return {
        status: userRoles?.length > 0 ? 'SUCCESS' : 'WARNING',
        roleCount: userRoles?.length || 0,
        roles: userRoles?.map(ur => ({
          roleName: ur.role?.name,
          roleId: ur.role_id,
          assignedAt: ur.created_at,
          assignedBy: ur.assigned_by
        })) || [],
        details: userRoles?.length > 0 
          ? `Found ${userRoles.length} active roles` 
          : 'No active roles found for user'
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Failed to check role assignments'
      };
    }
  }

  /**
   * Check permissions
   */
  async checkPermissions() {
    try {
      const authUser = await authManager.getCurrentUser();
      if (!authUser) {
        return {
          status: 'FAILED',
          details: 'No authenticated user'
        };
      }

      // Get user's role IDs
      const { data: userRoles } = await supabase
        .from('user_roles')
        .select('role_id')
        .eq('user_id', authUser.id)
        .eq('is_active', true);

      if (!userRoles?.length) {
        return {
          status: 'WARNING',
          details: 'No roles found, cannot check permissions'
        };
      }

      const roleIds = userRoles.map(ur => ur.role_id);

      const { data: permissions, error: permError } = await supabase
        .from('role_permissions')
        .select(`
          permission:permissions(name, resource, action)
        `)
        .in('role_id', roleIds);

      if (permError) throw permError;

      const adminPermissions = permissions?.filter(p => 
        p.permission?.name?.includes('admin') || 
        p.permission?.action?.includes('admin') ||
        p.permission?.resource === 'admin'
      ) || [];

      return {
        status: permissions?.length > 0 ? 'SUCCESS' : 'WARNING',
        totalPermissions: permissions?.length || 0,
        adminPermissions: adminPermissions.length,
        permissionsList: permissions?.map(p => ({
          name: p.permission?.name,
          resource: p.permission?.resource,
          action: p.permission?.action
        })) || [],
        details: `Found ${permissions?.length || 0} permissions (${adminPermissions.length} admin-level)`
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Failed to check permissions'
      };
    }
  }

  /**
   * Check RLS policies
   */
  async checkRLSPolicies() {
    try {
      // Test access to key tables
      const testResults = {};
      
      const tables = ['users', 'user_roles', 'roles', 'permissions', 'role_permissions'];
      
      for (const table of tables) {
        try {
          const { data, error } = await supabase
            .from(table)
            .select('*')
            .limit(1);
          
          testResults[table] = {
            accessible: !error,
            error: error?.message,
            hasData: !!data?.length
          };
        } catch (err) {
          testResults[table] = {
            accessible: false,
            error: err.message
          };
        }
      }

      const accessibleTables = Object.keys(testResults).filter(
        table => testResults[table].accessible
      );

      return {
        status: accessibleTables.length === tables.length ? 'SUCCESS' : 'WARNING',
        accessibleTables: accessibleTables.length,
        totalTables: tables.length,
        tableAccess: testResults,
        details: `${accessibleTables.length}/${tables.length} RBAC tables accessible`
      };
    } catch (error) {
      return {
        status: 'ERROR',
        error: error.message,
        details: 'Failed to check RLS policies'
      };
    }
  }

  /**
   * Generate recommendations based on diagnostic results
   */
  generateRecommendations(checks) {
    const recommendations = [];

    // Auth issues
    if (checks.authentication?.status !== 'SUCCESS') {
      recommendations.push({
        priority: 'HIGH',
        issue: 'Authentication Failed',
        solution: 'Try logging out and logging back in. Clear browser cache if needed.',
        action: 'auth_refresh'
      });
    }

    // User not in database
    if (checks.userExists?.status === 'WARNING') {
      if (!checks.userExists.inUsersTable && !checks.userExists.inEmployeesTable) {
        recommendations.push({
          priority: 'HIGH',
          issue: 'User not found in database',
          solution: 'User needs to be added to the users table or employees table',
          action: 'create_user_record'
        });
      }
    }

    // No roles assigned
    if (checks.roleAssignments?.status === 'WARNING' || checks.roleAssignments?.roleCount === 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'No roles assigned',
        solution: 'Assign admin role to this user',
        action: 'assign_admin_role'
      });
    }

    // No permissions
    if (checks.permissions?.status === 'WARNING' || checks.permissions?.totalPermissions === 0) {
      recommendations.push({
        priority: 'HIGH',
        issue: 'No permissions found',
        solution: 'Check role permissions configuration',
        action: 'fix_permissions'
      });
    }

    // RLS blocking access
    if (checks.rlsPolicies?.status === 'WARNING') {
      recommendations.push({
        priority: 'MEDIUM',
        issue: 'Some RBAC tables not accessible',
        solution: 'Check RLS policies - may need to disable RLS for development',
        action: 'check_rls_policies'
      });
    }

    return recommendations;
  }

  /**
   * Display diagnostic results
   */
  displayResults(results) {
    console.group('📊 RBAC Diagnostic Results');
    
    Object.entries(results.checks).forEach(([checkName, result]) => {
      const statusEmoji = result.status === 'SUCCESS' ? '✅' : 
                         result.status === 'WARNING' ? '⚠️' : '❌';
      console.log(`${statusEmoji} ${checkName}: ${result.details}`);
      
      if (result.error) {
        console.error(`   Error: ${result.error}`);
      }
    });

    if (results.recommendations?.length > 0) {
      console.group('💡 Recommendations:');
      results.recommendations.forEach((rec, index) => {
        const priorityEmoji = rec.priority === 'HIGH' ? '🔥' : 
                             rec.priority === 'MEDIUM' ? '⚠️' : 'ℹ️';
        console.log(`${priorityEmoji} ${rec.issue}: ${rec.solution}`);
      });
      console.groupEnd();
    }
    
    console.groupEnd();
  }

  /**
   * Quick fix for common admin access issues
   */
  async quickFix() {
    console.log('🔧 Attempting quick fix for admin access...');
    
    try {
      // 1. Refresh authentication
      await authManager.refresh();
      console.log('✅ Auth refreshed');
      
      // 2. Re-initialize RBAC
      const rbacService = (await import('./rbacService')).default;
      await rbacService.initialize();
      console.log('✅ RBAC re-initialized');
      
      // 3. Check if fix worked
      const hasAdminAccess = rbacService.hasPermission('admin') || 
                            rbacService.hasPermission('manage_users') ||
                            rbacService.hasPermission('manage_roles');
      
      if (hasAdminAccess) {
        console.log('🎉 Quick fix successful - admin access restored');
        return { success: true, message: 'Admin access restored' };
      } else {
        console.warn('⚠️ Quick fix incomplete - running full diagnostics');
        await this.runDiagnostics();
        return { success: false, message: 'Quick fix failed, see diagnostics' };
      }
    } catch (error) {
      console.error('❌ Quick fix failed:', error);
      return { success: false, error: error.message };
    }
  }

  /**
   * Emergency admin role assignment (use carefully)
   */
  async emergencyAdminAssignment(userEmail) {
    console.warn('🚨 Emergency admin assignment requested for:', userEmail);
    
    try {
      // Find user by email
      const { data: user, error: userError } = await supabase
        .from('users')
        .select('id')
        .eq('email', userEmail)
        .single();

      if (userError || !user) {
        throw new Error(`User not found: ${userEmail}`);
      }

      // Find admin role
      const { data: adminRole, error: roleError } = await supabase
        .from('roles')
        .select('id')
        .eq('name', 'admin')
        .single();

      if (roleError || !adminRole) {
        throw new Error('Admin role not found in database');
      }

      // Assign admin role
      const { error: assignError } = await supabase
        .from('user_roles')
        .insert({
          user_id: user.id,
          role_id: adminRole.id,
          is_active: true,
          assigned_by: user.id // Self-assigned in emergency
        });

      if (assignError) throw assignError;

      console.log('✅ Emergency admin role assigned successfully');
      return { success: true, message: 'Admin role assigned' };
    } catch (error) {
      console.error('❌ Emergency admin assignment failed:', error);
      return { success: false, error: error.message };
    }
  }
}

// Create global instance for easy access
const rbacDebugger = new RBACDebugger();

// Add to window for console access
if (typeof window !== 'undefined') {
  window.rbacDebugger = rbacDebugger;
}

export default rbacDebugger;
