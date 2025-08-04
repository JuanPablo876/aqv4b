/**
 * Audit Service - Comprehensive user activity tracking
 * Logs all user actions across the application for accountability and compliance
 */

import { supabase } from '../lib/supabase';

class AuditService {
  constructor() {
    this.sessionId = this.generateSessionId();
    this.currentUser = null;
    this.initializeUser();
  }

  // Generate a unique session ID
  generateSessionId() {
    return `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  // Initialize current user information
  async initializeUser() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        this.currentUser = {
          id: user.id,
          email: user.email,
          name: user.user_metadata?.name || user.email
        };
      }
    } catch (error) {
      console.error('Error initializing audit user:', error);
    }
  }

  // Get client information for logging
  getClientInfo() {
    return {
      ip_address: null, // Will be populated by server-side functions
      user_agent: navigator.userAgent,
      timestamp: new Date().toISOString()
    };
  }

  // Main audit logging method
  async log(params) {
    try {
      const {
        tableName,
        recordId,
        action,
        oldValues = null,
        newValues = null,
        module = null,
        description = null,
        metadata = {}
      } = params;

      // Ensure user is initialized
      if (!this.currentUser) {
        await this.initializeUser();
      }

      const clientInfo = this.getClientInfo();
      const changedFields = this.getChangedFields(oldValues, newValues);

      const auditLog = {
        table_name: tableName,
        record_id: recordId,
        action: action.toUpperCase(),
        user_id: this.currentUser?.id,
        user_email: this.currentUser?.email,
        user_name: this.currentUser?.name,
        old_values: oldValues,
        new_values: newValues,
        changed_fields: changedFields,
        user_agent: clientInfo.user_agent,
        session_id: this.sessionId,
        module: module,
        description: description || this.generateDescription(action, tableName, changedFields),
        metadata: {
          ...metadata,
          client_timestamp: clientInfo.timestamp
        }
      };

      const { error } = await supabase
        .from('audit_logs')
        .insert([auditLog]);

      if (error) {
        console.error('Error creating audit log:', error);
        // Don't throw error to avoid breaking the main operation
      }

      return auditLog;
    } catch (error) {
      console.error('Audit logging failed:', error);
      // Audit failures should not break the main application flow
    }
  }

  // Determine which fields changed between old and new values
  getChangedFields(oldValues, newValues) {
    if (!oldValues || !newValues) return [];

    const changedFields = [];
    const allKeys = new Set([...Object.keys(oldValues), ...Object.keys(newValues)]);

    for (const key of allKeys) {
      if (JSON.stringify(oldValues[key]) !== JSON.stringify(newValues[key])) {
        changedFields.push(key);
      }
    }

    return changedFields;
  }

  // Generate a human-readable description of the action
  generateDescription(action, tableName, changedFields = []) {
    const actionMap = {
      CREATE: 'creó',
      UPDATE: 'actualizó',
      DELETE: 'eliminó',
      LOGIN: 'inició sesión',
      LOGOUT: 'cerró sesión'
    };

    const tableMap = {
      clients: 'cliente',
      products: 'producto',
      orders: 'pedido',
      quotes: 'cotización',
      inventory: 'inventario',
      employees: 'empleado',
      suppliers: 'proveedor',
      maintenances: 'mantenimiento',
      invoices: 'factura'
    };

    const actionText = actionMap[action.toUpperCase()] || action.toLowerCase();
    const tableText = tableMap[tableName] || tableName;

    if (action.toUpperCase() === 'UPDATE' && changedFields.length > 0) {
      return `${actionText} ${tableText} (campos: ${changedFields.join(', ')})`;
    }

    return `${actionText} ${tableText}`;
  }

  // Convenience methods for common actions
  async logCreate(tableName, recordId, newValues, module = null, metadata = {}) {
    return this.log({
      tableName,
      recordId,
      action: 'CREATE',
      newValues,
      module,
      metadata
    });
  }

  async logUpdate(tableName, recordId, oldValues, newValues, module = null, metadata = {}) {
    return this.log({
      tableName,
      recordId,
      action: 'UPDATE',
      oldValues,
      newValues,
      module,
      metadata
    });
  }

  async logDelete(tableName, recordId, oldValues, module = null, metadata = {}) {
    return this.log({
      tableName,
      recordId,
      action: 'DELETE',
      oldValues,
      module,
      metadata
    });
  }

  async logLogin(userId, metadata = {}) {
    return this.log({
      tableName: 'auth',
      recordId: userId,
      action: 'LOGIN',
      module: 'authentication',
      description: 'Usuario inició sesión',
      metadata
    });
  }

  async logLogout(userId, metadata = {}) {
    return this.log({
      tableName: 'auth',
      recordId: userId,
      action: 'LOGOUT',
      module: 'authentication',
      description: 'Usuario cerró sesión',
      metadata
    });
  }

  // Get audit logs with filtering and pagination
  async getAuditLogs(filters = {}) {
    try {
      let query = supabase
        .from('audit_logs')
        .select('*')
        .order('created_at', { ascending: false });

      // Apply filters
      if (filters.tableName) {
        query = query.eq('table_name', filters.tableName);
      }
      if (filters.action) {
        query = query.eq('action', filters.action);
      }
      if (filters.userId) {
        query = query.eq('user_id', filters.userId);
      }
      if (filters.module) {
        query = query.eq('module', filters.module);
      }
      if (filters.recordId) {
        query = query.eq('record_id', filters.recordId);
      }
      if (filters.dateFrom) {
        query = query.gte('created_at', filters.dateFrom);
      }
      if (filters.dateTo) {
        query = query.lte('created_at', filters.dateTo);
      }

      // Apply pagination
      if (filters.limit) {
        query = query.limit(filters.limit);
      }
      if (filters.offset) {
        query = query.range(filters.offset, filters.offset + (filters.limit || 50) - 1);
      }

      const { data, error } = await query;

      if (error) {
        console.error('Error fetching audit logs:', error);
        throw error;
      }

      return data || [];
    } catch (error) {
      console.error('Error in getAuditLogs:', error);
      throw error;
    }
  }

  // Get audit logs for a specific record
  async getRecordAuditLogs(tableName, recordId) {
    return this.getAuditLogs({
      tableName,
      recordId,
      limit: 100
    });
  }

  // Get recent activity for dashboard
  async getRecentActivity(limit = 20) {
    return this.getAuditLogs({
      limit,
      dateFrom: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString() // Last 7 days
    });
  }

  // Get user activity
  async getUserActivity(userId, limit = 50) {
    return this.getAuditLogs({
      userId,
      limit
    });
  }
}

// Create singleton instance
const auditService = new AuditService();

export default auditService;
