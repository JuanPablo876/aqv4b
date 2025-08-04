// Financial calculation service for real data integration
import { supabase } from '../supabaseClient';

class FinancialService {
  constructor() {
    this.cache = new Map();
    this.cacheExpiry = 5 * 60 * 1000; // 5 minutes
  }

  /**
   * Clear cache for specific key or all cache
   */
  clearCache(key = null) {
    if (key) {
      this.cache.delete(key);
    } else {
      this.cache.clear();
    }
  }

  /**
   * Get cached data if valid, otherwise return null
   */
  getCachedData(key) {
    const cached = this.cache.get(key);
    if (cached && Date.now() - cached.timestamp < this.cacheExpiry) {
      return cached.data;
    }
    return null;
  }

  /**
   * Set cached data with timestamp
   */
  setCachedData(key, data) {
    this.cache.set(key, {
      data,
      timestamp: Date.now()
    });
  }

  /**
   * Calculate revenue from orders and invoices
   */
  async calculateRevenue(startDate = null, endDate = null) {
    const cacheKey = `revenue_${startDate}_${endDate}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let ordersQuery = supabase
        .from('orders')
        .select('total, status, date')
        .in('status', ['completed', 'delivered', 'paid']);

      let invoicesQuery = supabase
        .from('invoices')
        .select('total, status, date')
        .eq('status', 'paid');

      if (startDate) {
        ordersQuery = ordersQuery.gte('date', startDate);
        invoicesQuery = invoicesQuery.gte('date', startDate);
      }

      if (endDate) {
        ordersQuery = ordersQuery.lte('date', endDate);
        invoicesQuery = invoicesQuery.lte('date', endDate);
      }

      const [ordersResult, invoicesResult] = await Promise.all([
        ordersQuery,
        invoicesQuery
      ]);

      if (ordersResult.error) throw ordersResult.error;
      if (invoicesResult.error) throw invoicesResult.error;

      const orderRevenue = (ordersResult.data || []).reduce((sum, order) => sum + (order.total || 0), 0);
      const invoiceRevenue = (invoicesResult.data || []).reduce((sum, invoice) => sum + (invoice.total || 0), 0);

      const revenue = {
        orders: orderRevenue,
        invoices: invoiceRevenue,
        total: orderRevenue + invoiceRevenue,
        orderCount: ordersResult.data?.length || 0,
        invoiceCount: invoicesResult.data?.length || 0
      };

      this.setCachedData(cacheKey, revenue);
      return revenue;
    } catch (error) {
      console.error('Error calculating revenue:', error);
      throw error;
    }
  }

  /**
   * Calculate expenses from transactions
   */
  async calculateExpenses(startDate = null, endDate = null) {
    const cacheKey = `expenses_${startDate}_${endDate}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      let query = supabase
        .from('transactions')
        .select('amount, category, status, date')
        .eq('transaction_type', 'expense')
        .eq('status', 'completed');

      if (startDate) {
        query = query.gte('date', startDate);
      }

      if (endDate) {
        query = query.lte('date', endDate);
      }

      const { data, error } = await query;

      if (error) throw error;

      const totalExpenses = (data || []).reduce((sum, transaction) => sum + (transaction.amount || 0), 0);
      
      // Group by category
      const expensesByCategory = (data || []).reduce((acc, transaction) => {
        const category = transaction.category || 'Sin categoría';
        acc[category] = (acc[category] || 0) + (transaction.amount || 0);
        return acc;
      }, {});

      const expenses = {
        total: totalExpenses,
        count: data?.length || 0,
        byCategory: expensesByCategory
      };

      this.setCachedData(cacheKey, expenses);
      return expenses;
    } catch (error) {
      console.error('Error calculating expenses:', error);
      throw error;
    }
  }

  /**
   * Calculate cash flow (income - expenses)
   */
  async calculateCashFlow(startDate = null, endDate = null) {
    const cacheKey = `cashflow_${startDate}_${endDate}`;
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [revenue, expenses] = await Promise.all([
        this.calculateRevenue(startDate, endDate),
        this.calculateExpenses(startDate, endDate)
      ]);

      const cashFlow = {
        income: revenue.total,
        expenses: expenses.total,
        netFlow: revenue.total - expenses.total,
        profitMargin: revenue.total > 0 ? ((revenue.total - expenses.total) / revenue.total) * 100 : 0
      };

      this.setCachedData(cacheKey, cashFlow);
      return cashFlow;
    } catch (error) {
      console.error('Error calculating cash flow:', error);
      throw error;
    }
  }

  /**
   * Get account balances from bank accounts and cash boxes
   */
  async getAccountBalances() {
    const cacheKey = 'account_balances';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const [bankAccountsResult, cashBoxesResult] = await Promise.all([
        supabase.from('bank_accounts').select('*').eq('status', 'active'),
        supabase.from('cash_boxes').select('*')
      ]);

      if (bankAccountsResult.error) throw bankAccountsResult.error;
      if (cashBoxesResult.error) throw cashBoxesResult.error;

      const bankAccounts = bankAccountsResult.data || [];
      const cashBoxes = cashBoxesResult.data || [];

      const totalBankBalance = bankAccounts.reduce((sum, account) => sum + (account.balance || 0), 0);
      const totalCashBalance = cashBoxes.reduce((sum, box) => sum + (box.balance || 0), 0);

      const balances = {
        bankAccounts,
        cashBoxes,
        totalBank: totalBankBalance,
        totalCash: totalCashBalance,
        totalBalance: totalBankBalance + totalCashBalance
      };

      this.setCachedData(cacheKey, balances);
      return balances;
    } catch (error) {
      console.error('Error getting account balances:', error);
      throw error;
    }
  }

  /**
   * Get financial transactions with relations
   */
  async getTransactionsWithDetails(filters = {}) {
    try {
      let query = supabase
        .from('transactions')
        .select(`
          *,
          employee:created_by(id, name, email)
        `)
        .order('date', { ascending: false });

      // Apply filters
      if (filters.startDate) {
        query = query.gte('date', filters.startDate);
      }
      if (filters.endDate) {
        query = query.lte('date', filters.endDate);
      }
      if (filters.type) {
        query = query.eq('transaction_type', filters.type);
      }
      if (filters.status) {
        query = query.eq('status', filters.status);
      }
      if (filters.category) {
        query = query.eq('category', filters.category);
      }

      const { data, error } = await query;

      if (error) throw error;

      return data || [];
    } catch (error) {
      console.error('Error getting transactions with details:', error);
      throw error;
    }
  }

  /**
   * Get pending invoices (accounts receivable)
   */
  async getPendingInvoices() {
    const cacheKey = 'pending_invoices';
    const cached = this.getCachedData(cacheKey);
    if (cached) return cached;

    try {
      const { data, error } = await supabase
        .from('invoices')
        .select(`
          *,
          client:client_id(id, name, email),
          order:order_id(order_number)
        `)
        .in('status', ['pending', 'sent', 'overdue'])
        .order('date', { ascending: true });

      if (error) throw error;

      const totalPending = (data || []).reduce((sum, invoice) => sum + (invoice.total || 0), 0);

      const result = {
        invoices: data || [],
        totalAmount: totalPending,
        count: data?.length || 0
      };

      this.setCachedData(cacheKey, result);
      return result;
    } catch (error) {
      console.error('Error getting pending invoices:', error);
      throw error;
    }
  }

  /**
   * Get financial summary for dashboard
   */
  async getFinancialSummary(period = 'month') {
    try {
      const now = new Date();
      let startDate;

      switch (period) {
        case 'week':
          startDate = new Date(now.getFullYear(), now.getMonth(), now.getDate() - 7);
          break;
        case 'month':
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
          break;
        case 'quarter':
          startDate = new Date(now.getFullYear(), Math.floor(now.getMonth() / 3) * 3, 1);
          break;
        case 'year':
          startDate = new Date(now.getFullYear(), 0, 1);
          break;
        default:
          startDate = new Date(now.getFullYear(), now.getMonth(), 1);
      }

      const startDateStr = startDate.toISOString().split('T')[0];
      const endDateStr = now.toISOString().split('T')[0];

      const [revenue, expenses, cashFlow, balances, pendingInvoices] = await Promise.all([
        this.calculateRevenue(startDateStr, endDateStr),
        this.calculateExpenses(startDateStr, endDateStr),
        this.calculateCashFlow(startDateStr, endDateStr),
        this.getAccountBalances(),
        this.getPendingInvoices()
      ]);

      return {
        period,
        startDate: startDateStr,
        endDate: endDateStr,
        revenue,
        expenses,
        cashFlow,
        balances,
        pendingInvoices,
        generatedAt: new Date().toISOString()
      };
    } catch (error) {
      console.error('Error getting financial summary:', error);
      throw error;
    }
  }

  /**
   * Create a new transaction
   */
  async createTransaction(transactionData) {
    try {
      const { data, error } = await supabase
        .from('transactions')
        .insert([{
          ...transactionData,
          created_at: new Date().toISOString()
        }])
        .select()
        .single();

      if (error) throw error;

      // Clear relevant cache
      this.clearCache();

      return data;
    } catch (error) {
      console.error('Error creating transaction:', error);
      throw error;
    }
  }

  /**
   * Update account balance after transaction
   */
  async updateAccountBalance(accountId, accountType, amount, operation = 'add') {
    try {
      const table = accountType === 'bank' ? 'bank_accounts' : 'cash_boxes';
      
      // Get current balance
      const { data: account, error: fetchError } = await supabase
        .from(table)
        .select('balance')
        .eq('id', accountId)
        .single();

      if (fetchError) throw fetchError;

      const currentBalance = account.balance || 0;
      const newBalance = operation === 'add' 
        ? currentBalance + amount 
        : currentBalance - amount;

      // Update balance
      const { data, error } = await supabase
        .from(table)
        .update({ balance: newBalance })
        .eq('id', accountId)
        .select()
        .single();

      if (error) throw error;

      // Clear cache
      this.clearCache();

      return data;
    } catch (error) {
      console.error('Error updating account balance:', error);
      throw error;
    }
  }
}

// Export singleton instance
export const financialService = new FinancialService();
export default financialService;
