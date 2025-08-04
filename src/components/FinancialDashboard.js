import React, { useState, useEffect } from 'react';
import { financialService } from '../services/financialService';
import { formatCurrency, formatDate } from '../utils/storage';
import VenetianTile from './VenetianTile';

const FinancialDashboard = ({ period = 'month' }) => {
  const [summary, setSummary] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPeriod, setSelectedPeriod] = useState(period);

  useEffect(() => {
    loadFinancialSummary();
  }, [selectedPeriod]);

  const loadFinancialSummary = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await financialService.getFinancialSummary(selectedPeriod);
      setSummary(data);
    } catch (err) {
      console.error('Error loading financial summary:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const getPeriodLabel = (period) => {
    switch (period) {
      case 'week': return 'Esta Semana';
      case 'month': return 'Este Mes';
      case 'quarter': return 'Este Trimestre';
      case 'year': return 'Este Año';
      default: return 'Este Mes';
    }
  };

  const formatPercentage = (value) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  if (loading) {
    return (
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        {[...Array(4)].map((_, i) => (
          <VenetianTile key={i} className="p-6">
            <div className="animate-pulse">
              <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-2"></div>
              <div className="h-8 bg-gray-200 dark:bg-gray-700 rounded w-1/2"></div>
            </div>
          </VenetianTile>
        ))}
      </div>
    );
  }

  if (error) {
    return (
      <VenetianTile className="p-6 mb-8">
        <div className="text-center">
          <div className="w-12 h-12 mx-auto mb-4 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center">
            <span className="text-red-600 dark:text-red-400 text-xl">⚠️</span>
          </div>
          <p className="text-red-600 dark:text-red-400 font-medium">Error al cargar datos financieros</p>
          <p className="text-gray-500 dark:text-gray-400 text-sm mt-1">{error}</p>
          <button 
            onClick={loadFinancialSummary}
            className="mt-3 px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
          >
            Reintentar
          </button>
        </div>
      </VenetianTile>
    );
  }

  if (!summary) return null;

  return (
    <div className="mb-8">
      {/* Period Selector */}
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 dark:text-white">
            Resumen Financiero - {getPeriodLabel(selectedPeriod)}
          </h3>
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {formatDate(summary.startDate)} - {formatDate(summary.endDate)}
          </p>
        </div>
        <select
          value={selectedPeriod}
          onChange={(e) => setSelectedPeriod(e.target.value)}
          className="px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-800 text-gray-900 dark:text-white focus:ring-blue-500 focus:border-blue-500"
        >
          <option value="week">Esta Semana</option>
          <option value="month">Este Mes</option>
          <option value="quarter">Este Trimestre</option>
          <option value="year">Este Año</option>
        </select>
      </div>

      {/* Financial Metrics Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-6">
        {/* Total Revenue */}
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Ingresos Totales</p>
              <h3 className="text-2xl font-bold text-green-600 dark:text-green-400">
                {formatCurrency(summary.revenue.total)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.revenue.orderCount + summary.revenue.invoiceCount} transacciones
              </p>
            </div>
          </div>
        </VenetianTile>

        {/* Total Expenses */}
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-red-100 dark:bg-red-900/30 text-red-600 dark:text-red-400 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 17h8m0 0V9m0 8l-8-8-4 4-6-6" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Gastos Totales</p>
              <h3 className="text-2xl font-bold text-red-600 dark:text-red-400">
                {formatCurrency(summary.expenses.total)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                {summary.expenses.count} gastos registrados
              </p>
            </div>
          </div>
        </VenetianTile>

        {/* Net Cash Flow */}
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className={`p-3 rounded-lg mr-4 ${
              summary.cashFlow.netFlow >= 0 
                ? 'bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400' 
                : 'bg-orange-100 dark:bg-orange-900/30 text-orange-600 dark:text-orange-400'
            }`}>
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Flujo de Caja Neto</p>
              <h3 className={`text-2xl font-bold ${
                summary.cashFlow.netFlow >= 0 
                  ? 'text-blue-600 dark:text-blue-400' 
                  : 'text-orange-600 dark:text-orange-400'
              }`}>
                {formatCurrency(summary.cashFlow.netFlow)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Margen: {formatPercentage(summary.cashFlow.profitMargin)}
              </p>
            </div>
          </div>
        </VenetianTile>

        {/* Total Balance */}
        <VenetianTile className="p-6">
          <div className="flex items-center">
            <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 p-3 rounded-lg mr-4">
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
              </svg>
            </div>
            <div>
              <p className="text-gray-500 dark:text-gray-400 text-sm">Saldo Total</p>
              <h3 className="text-2xl font-bold text-purple-600 dark:text-purple-400">
                {formatCurrency(summary.balances.totalBalance)}
              </h3>
              <p className="text-xs text-gray-500 dark:text-gray-400">
                Banco: {formatCurrency(summary.balances.totalBank)} | 
                Caja: {formatCurrency(summary.balances.totalCash)}
              </p>
            </div>
          </div>
        </VenetianTile>
      </div>

      {/* Additional Metrics */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Accounts Overview */}
        <VenetianTile>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">🏦</span>
              Cuentas y Cajas
            </h4>
            <div className="space-y-3">
              {summary.balances.bankAccounts.map((account) => (
                <div key={account.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{account.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{account.bank}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-blue-600 dark:text-blue-400">
                      {formatCurrency(account.balance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{account.currency}</p>
                  </div>
                </div>
              ))}
              {summary.balances.cashBoxes.map((box) => (
                <div key={box.id} className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-800 rounded-lg">
                  <div>
                    <p className="font-medium text-gray-900 dark:text-white">{box.name}</p>
                    <p className="text-sm text-gray-500 dark:text-gray-400">{box.responsible}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-green-600 dark:text-green-400">
                      {formatCurrency(box.balance)}
                    </p>
                    <p className="text-xs text-gray-500 dark:text-gray-400">{box.currency}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </VenetianTile>

        {/* Pending Invoices */}
        <VenetianTile>
          <div className="p-6">
            <h4 className="text-lg font-semibold text-gray-900 dark:text-white mb-4 flex items-center">
              <span className="mr-2">📄</span>
              Facturas Pendientes
            </h4>
            {summary.pendingInvoices.count > 0 ? (
              <div>
                <div className="mb-4 p-4 bg-yellow-50 dark:bg-yellow-900/20 rounded-lg border border-yellow-200 dark:border-yellow-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="font-medium text-yellow-800 dark:text-yellow-200">
                        {summary.pendingInvoices.count} facturas pendientes
                      </p>
                      <p className="text-sm text-yellow-600 dark:text-yellow-300">
                        Requieren atención
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-bold text-yellow-800 dark:text-yellow-200">
                        {formatCurrency(summary.pendingInvoices.totalAmount)}
                      </p>
                    </div>
                  </div>
                </div>
                <div className="space-y-2 max-h-40 overflow-y-auto">
                  {summary.pendingInvoices.invoices.slice(0, 5).map((invoice) => (
                    <div key={invoice.id} className="flex items-center justify-between p-2 bg-gray-50 dark:bg-gray-800 rounded text-sm">
                      <div>
                        <p className="font-medium text-gray-900 dark:text-white">
                          {invoice.invoice_number || `#${invoice.id.slice(-6)}`}
                        </p>
                        <p className="text-gray-500 dark:text-gray-400">
                          {invoice.client?.name || 'Cliente desconocido'}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-medium text-gray-900 dark:text-white">
                          {formatCurrency(invoice.total)}
                        </p>
                        <p className="text-xs text-gray-500 dark:text-gray-400">
                          {formatDate(invoice.date)}
                        </p>
                      </div>
                    </div>
                  ))}
                  {summary.pendingInvoices.count > 5 && (
                    <p className="text-center text-sm text-gray-500 dark:text-gray-400 py-2">
                      Y {summary.pendingInvoices.count - 5} facturas más...
                    </p>
                  )}
                </div>
              </div>
            ) : (
              <div className="text-center py-8">
                <div className="w-12 h-12 mx-auto mb-4 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center">
                  <span className="text-green-600 dark:text-green-400 text-xl">✅</span>
                </div>
                <p className="text-gray-500 dark:text-gray-400">No hay facturas pendientes</p>
                <p className="text-sm text-gray-400 dark:text-gray-500 mt-1">Todas las facturas están al día</p>
              </div>
            )}
          </div>
        </VenetianTile>
      </div>
    </div>
  );
};

export default FinancialDashboard;
