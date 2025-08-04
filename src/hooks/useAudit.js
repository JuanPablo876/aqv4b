/**
 * Audit Hook - Integration with useData for automatic audit logging
 * Wraps CRUD operations with audit logging capabilities
 */

import { useCallback } from 'react';
import auditService from '../services/auditService';

export const useAudit = () => {
  // Wrap create operation with audit logging
  const auditCreate = useCallback(async (tableName, data, originalCreate, module = null) => {
    try {
      // Execute the original create operation
      const result = await originalCreate(data);
      
      // Log the creation
      if (result && result.id) {
        await auditService.logCreate(
          tableName,
          result.id,
          result,
          module,
          { operation: 'create', success: true }
        );
      }
      
      return result;
    } catch (error) {
      // Log failed creation attempt
      await auditService.log({
        tableName,
        action: 'CREATE',
        module,
        description: `Intento fallido de crear ${tableName}`,
        metadata: { 
          operation: 'create', 
          success: false, 
          error: error.message,
          attempted_data: data
        }
      });
      
      throw error;
    }
  }, []);

  // Wrap update operation with audit logging
  const auditUpdate = useCallback(async (tableName, id, data, originalUpdate, module = null, oldValues = null) => {
    try {
      // Execute the original update operation
      const result = await originalUpdate(id, data);
      
      // Log the update
      if (result) {
        await auditService.logUpdate(
          tableName,
          id,
          oldValues,
          { ...oldValues, ...data },
          module,
          { operation: 'update', success: true }
        );
      }
      
      return result;
    } catch (error) {
      // Log failed update attempt
      await auditService.log({
        tableName,
        recordId: id,
        action: 'UPDATE',
        module,
        description: `Intento fallido de actualizar ${tableName}`,
        metadata: { 
          operation: 'update', 
          success: false, 
          error: error.message,
          attempted_data: data
        }
      });
      
      throw error;
    }
  }, []);

  // Wrap delete operation with audit logging
  const auditDelete = useCallback(async (tableName, id, originalDelete, module = null, oldValues = null) => {
    try {
      // Execute the original delete operation
      const result = await originalDelete(id);
      
      // Log the deletion
      await auditService.logDelete(
        tableName,
        id,
        oldValues,
        module,
        { operation: 'delete', success: true }
      );
      
      return result;
    } catch (error) {
      // Log failed deletion attempt
      await auditService.log({
        tableName,
        recordId: id,
        action: 'DELETE',
        module,
        description: `Intento fallido de eliminar ${tableName}`,
        metadata: { 
          operation: 'delete', 
          success: false, 
          error: error.message
        }
      });
      
      throw error;
    }
  }, []);

  // Get audit logs for a specific record
  const getRecordAuditLogs = useCallback(async (tableName, recordId) => {
    try {
      return await auditService.getRecordAuditLogs(tableName, recordId);
    } catch (error) {
      console.error('Error fetching record audit logs:', error);
      return [];
    }
  }, []);

  // Get recent activity
  const getRecentActivity = useCallback(async (limit = 20) => {
    try {
      return await auditService.getRecentActivity(limit);
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      return [];
    }
  }, []);

  // Get user activity
  const getUserActivity = useCallback(async (userId, limit = 50) => {
    try {
      return await auditService.getUserActivity(userId, limit);
    } catch (error) {
      console.error('Error fetching user activity:', error);
      return [];
    }
  }, []);

  // Get filtered audit logs
  const getAuditLogs = useCallback(async (filters = {}) => {
    try {
      return await auditService.getAuditLogs(filters);
    } catch (error) {
      console.error('Error fetching audit logs:', error);
      return [];
    }
  }, []);

  return {
    auditCreate,
    auditUpdate,
    auditDelete,
    getRecordAuditLogs,
    getRecentActivity,
    getUserActivity,
    getAuditLogs,
    auditService
  };
};

export default useAudit;
