import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { financialService } from '../services/financialService';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass, getOrderNumber } from '../utils/helpers';
import { exportToTextForExcel } from '../utils/export'; // Import export utility
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData } from '../utils/formValidation';
import VenetianTile from './VenetianTile';
import FinanceAddInvoiceModal from './FinanceAddInvoiceModal'; // Import the new modal
import FinancialDashboard from './FinancialDashboard'; // Import the new dashboard

const FinancePage = () => {
  const { data: bankAccountsList, loading: bankAccountsLoading } = useData('bankAccounts');
  const { data: cashBoxesList, loading: cashBoxesLoading } = useData('cashBoxes');
  const { data: transactionsList, loading: transactionsLoading, create: createTransaction } = useData('transactions');
  const { data: invoicesList, loading: invoicesLoading, create: createInvoice } = useData('invoices');
  
  // Enhanced state for real financial data
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'date', direction: 'desc' });
  const [typeFilter, setTypeFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [dateRange, setDateRange] = useState({
    start: '',
    end: ''
  });
  
  // Modal states
  const [isAddTransactionModalOpen, setIsAddTransactionModalOpen] = useState(false);
  const [isAddInvoiceModalOpen, setIsAddInvoiceModalOpen] = useState(false);
  const [isViewTransactionModalOpen, setIsViewTransactionModalOpen] = useState(false);
  const [selectedTransaction, setSelectedTransaction] = useState(null);
  
  // Enhanced transaction state with more fields
  const [newTransaction, setNewTransaction] = useState({
    date: new Date().toISOString().split('T')[0],
    transaction_type: 'income',
    category: '',
    description: '',
    amount: '',
    currency: 'MXN',
    account_type: 'bank',
    account_id: '',
    reference_document: '',
    notes: ''
  });

  // Financial summary state
  const [financialSummary, setFinancialSummary] = useState(null);
  const [summaryLoading, setSummaryLoading] = useState(true);

  // Load financial summary on component mount
  useEffect(() => {
    loadFinancialSummary();
  }, []);

  const loadFinancialSummary = async () => {
    try {
      setSummaryLoading(true);
      const summary = await financialService.getFinancialSummary('month');
      setFinancialSummary(summary);
    } catch (error) {
      console.error('Error loading financial summary:', error);
      handleError(error, 'load financial summary', 'Error al cargar el resumen financiero');
    } finally {
      setSummaryLoading(false);
    }
  };
  
  // Filter and sort transactions
  const filteredTransactions = sortByField(
    filterBySearchTerm(
      typeFilter 
        ? (transactionsList || []).filter(transaction => transaction.transaction_type === typeFilter)
        : (transactionsList || []), 
      searchTerm, 
      ['category', 'description', 'notes']
    ),
    sortConfig.field,
    sortConfig.direction
  );
  
  // Filter and sort invoices
  const filteredInvoices = sortByField(
    filterBySearchTerm(invoicesList, searchTerm, ['rfc', 'razonSocial', 'invoiceNumber', 'notes']),
    sortConfig.field,
    sortConfig.direction
  );
  
  // Handle sort
  const handleSort = (field) => {
    setSortConfig({
      field,
      direction: 
        sortConfig.field === field && sortConfig.direction === 'asc' 
          ? 'desc' 
          : 'asc'
    });
  };
  
  // Handle add new transaction
  const handleAddTransaction = () => {
    setIsAddTransactionModalOpen(true);
  };
  
  // Handle add new invoice
  const handleAddInvoice = () => {
    setIsAddInvoiceModalOpen(true);
  };
  
  // Handle input change for new transaction
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: value
    });
  };
  
  // Handle save new transaction
  const handleSaveTransaction = async (transactionData) => {
    await handleFormSubmission(async () => {
      const cleanedData = cleanFormData({
        ...transactionData,
        amount: parseFloat(transactionData.amount) || 0,
        account_id: transactionData.account_type === 'bank' ? transactionData.account_id : null,
        status: 'completed'
      });
      
      await createTransaction(cleanedData);
      setIsAddTransactionModalOpen(false);
      
      // Reset form
      setNewTransaction({
        date: new Date().toISOString().split('T')[0],
        transaction_type: 'income',
        category: '',
        description: '',
        amount: '',
        currency: 'MXN',
        account_type: 'bank',
        account_id: '',
        reference_document: '',
        notes: ''
      });
      
      // Refresh financial summary
      await loadFinancialSummary();
      
      handleSuccess('Transacción guardada exitosamente');
    }, 'Error al guardar transacción');
  };
  
  // Handle save new invoice from modal
  const handleSaveInvoice = async (invoiceData) => {
    await handleFormSubmission(async () => {
      const cleanedData = cleanFormData({
        ...invoiceData,
        total: parseFloat(invoiceData.total) || 0,
        order_id: invoiceData.orderId ? parseInt(invoiceData.orderId) : null
      });
      
      await createInvoice(cleanedData);
      setIsAddInvoiceModalOpen(false);
      
      // Refresh financial summary
      await loadFinancialSummary();
      
      handleSuccess('Factura guardada exitosamente');
    }, 'Error al guardar factura');
  };
  
  // Get source name (bank account or cash box)
  const getSourceName = (transaction) => {
    if (transaction.account_type === 'bank' && transaction.account_id) {
      const account = bankAccountsList.find(acc => acc.id === transaction.account_id);
      return account ? account.name : 'Cuenta Desconocida';
    }
    if (transaction.account_type === 'cash' && transaction.account_id) {
      const cashBox = cashBoxesList.find(box => box.id === transaction.account_id);
      return cashBox ? cashBox.name : 'Caja Desconocida';
    }
    return transaction.account_type === 'bank' ? 'Cuenta Bancaria' : 'Caja';
  };
  
  // Handle export transactions
  const handleExportTransactions = () => {
    const dataToExport = filteredTransactions.map(t => ({
      Fecha: formatDate(t.date),
      Tipo: t.transaction_type === 'income' ? 'Ingreso' : 'Gasto',
      Categoría: t.category,
      Descripción: t.description,
      Origen_Destino: getSourceName(t),
      Monto: t.amount,
      Moneda: t.currency,
      Referencia: t.reference_document || '',
      Notas: t.notes || ''
    }));
    exportToTextForExcel(dataToExport, 'transacciones');
  };
  
  // Handle export invoices
  const handleExportInvoices = () => {
    const dataToExport = filteredInvoices.map(i => ({
      Fecha: formatDate(i.date),
      Numero_Factura: i.invoice_number,
      RFC: i.rfc,
      Razon_Social: i.razon_social,
      Total: i.total,
      Estado: i.status === 'paid' ? 'Pagada' : 'Pendiente',
      Metodo_Pago: i.payment_method,
      Pedido: i.order_id || '',
      Notas: i.notes || ''
    }));
    exportToTextForExcel(dataToExport, 'facturas_notas');
  };

  // Handle view transaction
  const handleViewTransaction = (transaction) => {
    setSelectedTransaction(transaction);
    setIsViewTransactionModalOpen(true);
  };

  // Handle delete transaction
  const handleDeleteTransaction = async (transactionId) => {
    if (window.confirm('¿Estás seguro de que quieres eliminar esta transacción?')) {
      await handleFormSubmission(async () => {
        // In a real app, you would call a delete API here
        // await deleteTransaction(transactionId);
        handleError(new Error('Funcionalidad pendiente de implementar'), 'delete transaction', 'Funcionalidad "Eliminar Transacción" pendiente de implementar en la API');
        console.log('Deleting transaction:', transactionId);
      }, 'Error al eliminar la transacción');
    }
  };
  
  return (
    <div className="p-6">
      {/* Loading state */}
      {(bankAccountsLoading || cashBoxesLoading || transactionsLoading || invoicesLoading) && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando datos financieros...</span>
        </div>
      )}

      {/* Content - only show when data is loaded */}
      {!(bankAccountsLoading || cashBoxesLoading || transactionsLoading || invoicesLoading) && (
        <>
          {/* Header with search, filter and add button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Finanzas</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar transacciones..."
              className="w-full md:w-64 px-4 py-2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
            <svg
              className="absolute right-3 top-2.5 h-5 w-5 text-gray-400"
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M8 4a4 4 0 100 8 4 4 0 000-8zM2 8a6 6 0 1110.89 3.476l4.817 4.817a1 1 0 01-1.414 1.414l-4.816-4.816A6 6 0 012 8z"
                clipRule="evenodd"
              />
            </svg>
          </div>
          
          <select
            className="w-full md:w-48 px-4 py-2 rounded-lg  focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={typeFilter}
            onChange={(e) => setTypeFilter(e.target.value)}
          >
            <option value="">Todos los tipos</option>
            <option value="income">Ingresos</option>
            <option value="expense">Gastos</option>
          </select>
          
          <button
            onClick={handleAddTransaction}
            className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Nueva Transacción
            </div>
          </button>
           <button
            onClick={handleAddInvoice}
            className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
          >
            <div className="flex items-center">
              <svg
                xmlns="http://www.w3.org/2000/svg"
                className="h-5 w-5 mr-1.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              Nueva Factura/Nota
            </div>
          </button>
        </div>
      </div>

      {/* Financial Dashboard */}
      <div className="mb-8">
        <FinancialDashboard onSummaryUpdate={setFinancialSummary} />
      </div>
      
      {/* Account and Cash Box Balances */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 mb-6">
        {bankAccountsList.map(account => (
          <VenetianTile key={account.id} className="p-6">
            <div className="flex items-center">
              <div className="bg-blue-100 text-blue-600 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 10h18M3 14h18m-9-4v8m-7 0h14a2 2 0 002-2V8a2 2 0 00-2-2H5a2 2 0 00-2 2v8a2 2 0 002 2z" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{account.name}</p>
                <h3 className="text-xl font-bold text-blue-800">{formatCurrency(account.balance)}</h3>
                <p className="text-xs text-gray-500">{account.bank}</p>
              </div>
            </div>
          </VenetianTile>
        ))}
        
        {cashBoxesList.map(box => (
          <VenetianTile key={box.id} className="p-6">
            <div className="flex items-center">
              <div className="bg-green-100 text-green-600 p-3 rounded-lg mr-4">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h6a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm8-10V7a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2h6a2 2 0 002-2v-2" />
                </svg>
              </div>
              <div>
                <p className="text-gray-500 text-sm">{box.name}</p>
                <h3 className="text-xl font-bold text-blue-800">{formatCurrency(box.balance)}</h3>
                <p className="text-xs text-gray-500">Responsable: {box.responsible}</p>
              </div>
            </div>
          </VenetianTile>
        ))}
      </div>
      
      {/* Transactions table */}
      <VenetianTile className="overflow-hidden mb-6">
        <div className="p-6 border-b border-blue-100 flex justify-between items-center">
           <h3 className="text-lg font-medium text-blue-800">Transacciones</h3>
           <button 
             onClick={handleExportTransactions}
             className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
           >
             Exportar a Excel
           </button>
        </div>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortConfig.field === 'date' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('type')}
                >
                  <div className="flex items-center">
                    Tipo
                    {sortConfig.field === 'type' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('category')}
                >
                  <div className="flex items-center">
                    Categoría
                    {sortConfig.field === 'category' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                >
                  Descripción
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider"
                >
                  Origen/Destino
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('amount')}
                >
                  <div className="flex items-center">
                    Monto
                    {sortConfig.field === 'amount' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredTransactions.map((transaction) => (
                <tr key={transaction.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(transaction.date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${
                      transaction.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {transaction.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{transaction.category}</div>
                  </td>
                  <td className="px-6 py-4">
                    <div className="text-sm text-gray-900">{transaction.description}</div>
                    {transaction.notes && (
                      <div className="text-xs text-gray-500 mt-1">{transaction.notes}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{getSourceName(transaction)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className={`text-sm font-medium ${
                      transaction.transaction_type === 'income' ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {transaction.transaction_type === 'income' ? '+' : '-'}{formatCurrency(transaction.amount)}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={() => handleViewTransaction(transaction)}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-red-600 hover:text-red-900"
                      onClick={() => handleDeleteTransaction(transaction.id)}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Invoices and Notes table */}
      <VenetianTile className="overflow-hidden">
        <div className="p-6 border-b border-blue-100 flex justify-between items-center">
           <h3 className="text-lg font-medium text-blue-800">Facturas y Notas</h3>
           <button 
             onClick={handleExportInvoices}
             className="px-3 py-1.5 bg-green-600 text-white text-sm rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2"
           >
             Exportar a Excel
           </button>
        </div>
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('date')}
                >
                  <div className="flex items-center">
                    Fecha
                    {sortConfig.field === 'date' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                 <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('invoiceNumber')}
                >
                  <div className="flex items-center">
                    N° Factura/Nota
                    {sortConfig.field === 'invoiceNumber' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('rfc')}
                >
                  <div className="flex items-center">
                    RFC
                    {sortConfig.field === 'rfc' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('razonSocial')}
                >
                  <div className="flex items-center">
                    Razón Social
                    {sortConfig.field === 'razonSocial' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('total')}
                >
                  <div className="flex items-center">
                    Total
                    {sortConfig.field === 'total' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Estado
                    {sortConfig.field === 'status' && (
                      <svg 
                        xmlns="http://www.w3.org/2000/svg" 
                        className={`ml-1 h-4 w-4 ${sortConfig.direction === 'asc' ? 'transform rotate-180' : ''}`} 
                        viewBox="0 0 20 20" 
                        fill="currentColor"
                      >
                        <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
                      </svg>
                    )}
                  </div>
                </th>
                 <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredInvoices.map((invoice) => (
                <tr key={invoice.id} className="hover:bg-blue-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{formatDate(invoice.date)}</div>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{invoice.invoice_number}</div>
                    {invoice.order_id && (
                       <div className="text-xs text-gray-500">Pedido: {getOrderNumber(invoice.order_id)}</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.rfc}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{invoice.razon_social}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right">
                    <div className="text-sm font-medium text-gray-900">{formatCurrency(invoice.total)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(invoice.status)}`}>
                      {invoice.status === 'paid' ? 'Pagada' : 'Pendiente'}
                    </span>
                  </td>
                   <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      type="button"
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.preventDefault();
                        handleError(new Error('Funcionalidad pendiente'), 'view invoice', 'Ver factura funcionalidad pendiente');
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      type="button"
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.preventDefault();
                        if (confirm('¿Está seguro de que desea eliminar esta factura?')) {
                          handleError(new Error('Funcionalidad pendiente'), 'delete invoice', 'Eliminar factura funcionalidad pendiente');
                        }
                      }}
                    >
                      Eliminar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Add transaction modal */}
      {isAddTransactionModalOpen && (
<div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 overflow-auto overscroll-contain scrollbar-thin scrollbar-thumb-gray-400 scrollbar-track-gray-100">
          <VenetianTile className="max-w-md w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Nueva Transacción</h3>
                <button 
                  onClick={() => setIsAddTransactionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha
                  </label>
                  <input
                    type="date"
                    name="date"
                    value={newTransaction.date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Tipo
                  </label>
                  <select
                    name="type"
                    value={newTransaction.type}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="income">Ingreso</option>
                    <option value="expense">Gasto</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Categoría
                  </label>
                  <input
                    type="text"
                    name="category"
                    value={newTransaction.category}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Descripción
                  </label>
                  <textarea
                    name="description"
                    value={newTransaction.description}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Monto
                  </label>
                  <input
                    type="number"
                    name="amount"
                    value={newTransaction.amount}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Moneda
                  </label>
                  <select
                    name="currency"
                    value={newTransaction.currency}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="MXN">MXN</option>
                    <option value="USD">USD</option>
                  </select>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Origen/Destino
                  </label>
                  <select
                    name="source"
                    value={newTransaction.source}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="bank">Cuenta Bancaria</option>
                    <option value="cash">Caja Chica</option>
                  </select>
                </div>
                
                {newTransaction.source === 'bank' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Cuenta Bancaria
                    </label>
                    <select
                      name="accountId"
                      value={newTransaction.accountId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {bankAccountsList.map(account => (
                        <option key={account.id} value={account.id}>
                          {account.name} ({account.accountNumber.slice(-4)})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                {newTransaction.source === 'cash' && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Caja Chica
                    </label>
                    <select
                      name="cashBoxId"
                      value={newTransaction.cashBoxId}
                      onChange={handleInputChange}
                      className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    >
                      <option value="">Seleccionar...</option>
                      {cashBoxesList.map(box => (
                        <option key={box.id} value={box.id}>
                          {box.name} ({box.responsible})
                        </option>
                      ))}
                    </select>
                  </div>
                )}
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    N° Pedido (Opcional)
                  </label>
                  <input
                    type="text"
                    name="orderId"
                    value={newTransaction.orderId}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Notas (Opcional)
                  </label>
                  <textarea
                    name="notes"
                    value={newTransaction.notes}
                    onChange={handleInputChange}
                    rows="2"
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  ></textarea>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddTransactionModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveTransaction();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Transacción
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add Invoice Modal */}
      <FinanceAddInvoiceModal 
        isOpen={isAddInvoiceModalOpen}
        onClose={() => setIsAddInvoiceModalOpen(false)}
        onSave={handleSaveInvoice}
      />

      {/* View Transaction Modal */}
      {isViewTransactionModalOpen && selectedTransaction && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">
                  Detalles de Transacción
                </h3>
                <button 
                  onClick={() => setIsViewTransactionModalOpen(false)}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-600 mb-1">Fecha</p>
                  <p className="font-medium text-gray-900">{formatDate(selectedTransaction.date)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo</p>
                  <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                    selectedTransaction.transaction_type === 'income' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {selectedTransaction.transaction_type === 'income' ? 'Ingreso' : 'Gasto'}
                  </span>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Categoría</p>
                  <p className="font-medium text-gray-900">{selectedTransaction.category}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Monto</p>
                  <p className="font-medium text-gray-900">{formatCurrency(selectedTransaction.amount)}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Moneda</p>
                  <p className="font-medium text-gray-900">{selectedTransaction.currency}</p>
                </div>
                
                <div>
                  <p className="text-sm text-gray-600 mb-1">Tipo de Cuenta</p>
                  <p className="font-medium text-gray-900">
                    {selectedTransaction.account_type === 'bank' ? 'Cuenta Bancaria' : 'Caja'}
                  </p>
                </div>
                
                {selectedTransaction.reference_document && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Documento de Referencia</p>
                    <p className="font-medium text-gray-900">{selectedTransaction.reference_document}</p>
                  </div>
                )}
                
                <div className="md:col-span-2">
                  <p className="text-sm text-gray-600 mb-1">Descripción</p>
                  <p className="font-medium text-gray-900">{selectedTransaction.description}</p>
                </div>
                
                {selectedTransaction.notes && (
                  <div className="md:col-span-2">
                    <p className="text-sm text-gray-600 mb-1">Notas</p>
                    <p className="font-medium text-gray-900">{selectedTransaction.notes}</p>
                  </div>
                )}
              </div>

              <div className="mt-6 flex justify-end space-x-3">
                <button
                  onClick={() => setIsViewTransactionModalOpen(false)}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cerrar
                </button>
                <button
                  onClick={() => handleDeleteTransaction(selectedTransaction.id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                >
                  Eliminar Transacción
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
        </>
      )}
    </div>
  );
};

export default FinancePage;
