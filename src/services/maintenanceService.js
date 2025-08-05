import { supabase } from '../supabaseClient';

/**
 * Maintenance Service
 * Handles all maintenance-related database operations and business logic
 */
class MaintenanceService {
  /**
   * Get all maintenances with related data
   */
  async getMaintenances() {
    try {
      // Start with a simple query first, then add relations once we confirm the table exists
      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .order('next_service_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching maintenances:', error);
      throw error;
    }
  }

  /**
   * Get maintenance service history
   */
  async getServiceHistory(maintenanceId) {
    try {
      // Temporarily disabled until service_records table is created

      return [];
      
      /* 
      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          employees:employee_id (
            id,
            name,
            position
          )
        `)
        .eq('maintenance_id', maintenanceId)
        .order('service_date', { ascending: false });

      if (error) throw error;
      return data || [];
      */
    } catch (error) {
      console.error('Error fetching service history:', error);
      throw error;
    }
  }

  /**
   * Create a new maintenance record
   */
  async createMaintenance(maintenanceData) {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .insert([maintenanceData])
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error creating maintenance:', error);
      throw error;
    }
  }

  /**
   * Update a maintenance record
   */
  async updateMaintenance(id, maintenanceData) {
    try {
      const { data, error } = await supabase
        .from('maintenances')
        .update({
          ...maintenanceData,
          updated_at: new Date().toISOString()
        })
        .eq('id', id)
        .select()
        .single();

      if (error) throw error;
      return data;
    } catch (error) {
      console.error('Error updating maintenance:', error);
      throw error;
    }
  }

  /**
   * Delete a maintenance record
   */
  async deleteMaintenance(id) {
    try {
      const { error } = await supabase
        .from('maintenances')
        .delete()
        .eq('id', id);

      if (error) throw error;
      return true;
    } catch (error) {
      console.error('Error deleting maintenance:', error);
      throw error;
    }
  }

  /**
   * Create a new service record
   */
  async createServiceRecord(serviceData) {
    try {
      // Temporarily disabled until service_records table is created

      return null;
    } catch (error) {
      console.error('Error creating service record:', error);
      throw error;
    }
  }

  /**
   * Update maintenance last service information
   */
  async updateMaintenanceLastService(maintenanceId, serviceDate, employeeId) {
    try {
      // Calculate next service date based on frequency
      const { data: maintenance } = await supabase
        .from('maintenances')
        .select('frequency')
        .eq('id', maintenanceId)
        .single();

      let nextServiceDate = new Date(serviceDate);
      
      if (maintenance?.frequency) {
        switch (maintenance.frequency.toLowerCase()) {
          case 'weekly':
          case 'semanal':
            nextServiceDate.setDate(nextServiceDate.getDate() + 7);
            break;
          case 'biweekly':
          case 'quincenal':
            nextServiceDate.setDate(nextServiceDate.getDate() + 14);
            break;
          case 'monthly':
          case 'mensual':
            nextServiceDate.setMonth(nextServiceDate.getMonth() + 1);
            break;
          case 'quarterly':
          case 'trimestral':
            nextServiceDate.setMonth(nextServiceDate.getMonth() + 3);
            break;
          case 'biannual':
          case 'semestral':
            nextServiceDate.setMonth(nextServiceDate.getMonth() + 6);
            break;
          case 'annual':
          case 'anual':
            nextServiceDate.setFullYear(nextServiceDate.getFullYear() + 1);
            break;
          default:
            // Default to monthly if frequency is not recognized
            nextServiceDate.setMonth(nextServiceDate.getMonth() + 1);
        }
      }

      const { error } = await supabase
        .from('maintenances')
        .update({
          last_service_date: serviceDate,
          last_service_employee_id: employeeId,
          next_service_date: nextServiceDate.toISOString().split('T')[0],
          updated_at: new Date().toISOString()
        })
        .eq('id', maintenanceId);

      if (error) throw error;
    } catch (error) {
      console.error('Error updating maintenance last service:', error);
      throw error;
    }
  }

  /**
   * Get maintenance statistics
   */
  async getMaintenanceStats() {
    try {
      // Get total maintenances
      const { count: totalMaintenances } = await supabase
        .from('maintenances')
        .select('*', { count: 'exact', head: true });

      // Get active maintenances
      const { count: activeMaintenances } = await supabase
        .from('maintenances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active');

      // Get overdue maintenances (past next_service_date)
      const today = new Date().toISOString().split('T')[0];
      const { count: overdueMaintenances } = await supabase
        .from('maintenances')
        .select('*', { count: 'exact', head: true })
        .eq('status', 'active')
        .lt('next_service_date', today);

      // Get this month's services - temporarily disabled
      const thisMonthServices = 0; // Will be calculated from service_records when table is available

      return {
        totalMaintenances: totalMaintenances || 0,
        activeMaintenances: activeMaintenances || 0,
        overdueMaintenances: overdueMaintenances || 0,
        thisMonthServices: thisMonthServices || 0
      };
    } catch (error) {
      console.error('Error fetching maintenance stats:', error);
      return {
        totalMaintenances: 0,
        activeMaintenances: 0,
        overdueMaintenances: 0,
        thisMonthServices: 0
      };
    }
  }

  /**
   * Get upcoming maintenance schedule
   */
  async getUpcomingMaintenance(days = 30) {
    try {
      const today = new Date();
      const futureDate = new Date();
      futureDate.setDate(today.getDate() + days);

      const { data, error } = await supabase
        .from('maintenances')
        .select('*')
        .eq('status', 'active')
        .gte('next_service_date', today.toISOString().split('T')[0])
        .lte('next_service_date', futureDate.toISOString().split('T')[0])
        .order('next_service_date', { ascending: true });

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching upcoming maintenance:', error);
      throw error;
    }
  }

  /**
   * Get recent service activity
   */
  async getRecentActivity(days = 7) {
    try {
      const pastDate = new Date();
      pastDate.setDate(pastDate.getDate() - days);

      const { data, error } = await supabase
        .from('service_records')
        .select(`
          *,
          maintenances:maintenance_id (
            clients:client_id (name)
          ),
          employees:employee_id (name)
        `)
        .gte('service_date', pastDate.toISOString().split('T')[0])
        .order('service_date', { ascending: false })
        .limit(10);

      if (error) throw error;
      return data || [];
    } catch (error) {
      console.error('Error fetching recent activity:', error);
      throw error;
    }
  }

  /**
   * Generate sample service records for testing
   */
  async generateSampleServiceRecords(maintenanceId, count = 5) {
    try {
      // Temporarily disabled until service_records table is created

      return [];
    } catch (error) {
      console.error('Error generating sample service records:', error);
      throw error;
    }
  }
}

export default new MaintenanceService();
