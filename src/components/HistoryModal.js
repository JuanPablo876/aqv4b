import React from 'react';
import VenetianTile from './VenetianTile';
import { formatCurrency, formatDate } from '../utils/storage';

const HistoryModal = ({ 
  isOpen, 
  onClose, 
  title, 
  data = [], 
  columns = [], 
  emptyMessage = "No hay registros para mostrar",
  loading = false 
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <VenetianTile className="max-w-6xl w-full max-h-[90vh] overflow-hidden">
        <div className="p-6 border-b border-blue-100 dark:border-gray-600">
          <div className="flex justify-between items-center">
            <h3 className="text-xl font-semibold text-blue-800 dark:text-blue-200">{title}</h3>
            <button 
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
        
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading ? (
            <div className="flex justify-center items-center h-32">
              <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
            </div>
          ) : data.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-gray-400 dark:text-gray-500 text-lg mb-2">📊</div>
              <p className="text-gray-600 dark:text-gray-400">{emptyMessage}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
                <thead className="bg-blue-50 dark:bg-gray-700">
                  <tr>
                    {columns.map((column, index) => (
                      <th
                        key={index}
                        scope="col"
                        className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider"
                      >
                        {column.header}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
                  {data.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-gray-50 dark:hover:bg-gray-700">
                      {columns.map((column, colIndex) => (
                        <td key={colIndex} className="px-6 py-4 whitespace-nowrap">
                          {column.render ? 
                            column.render(row, rowIndex) : 
                            <span className="text-sm text-gray-900 dark:text-gray-100">
                              {row[column.field] || '-'}
                            </span>
                          }
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
        
        <div className="p-6 border-t border-gray-200 dark:border-gray-600 bg-gray-50 dark:bg-gray-700">
          <div className="flex justify-between items-center">
            <div className="text-sm text-gray-600 dark:text-gray-400">
              {data.length > 0 && `${data.length} registro${data.length !== 1 ? 's' : ''} encontrado${data.length !== 1 ? 's' : ''}`}
            </div>
            <button
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
            >
              Cerrar
            </button>
          </div>
        </div>
      </VenetianTile>
    </div>
  );
};

// Predefined column configurations for common history types
export const historyColumns = {
  orders: [
    {
      field: 'order_number',
      header: 'Número',
      render: (row) => (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {row.order_number || `#${row.id?.slice(-6)}`}
        </span>
      )
    },
    {
      field: 'date',
      header: 'Fecha',
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(row.date || row.created_at)}
        </span>
      )
    },
    {
      field: 'total',
      header: 'Total',
      render: (row) => (
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(row.total)}
        </span>
      )
    },
    {
      field: 'status',
      header: 'Estado',
      render: (row) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          processing: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
          shipped: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
          delivered: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          completed: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          cancelled: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200'
        };
        const statusLabels = {
          pending: 'Pendiente',
          processing: 'En Proceso',
          shipped: 'Enviado',
          delivered: 'Entregado',
          completed: 'Completado',
          cancelled: 'Cancelado'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[row.status] || row.status}
          </span>
        );
      }
    },
    {
      field: 'payment_status',
      header: 'Pago',
      render: (row) => {
        const paymentColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          partial: 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200',
          paid: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200'
        };
        const paymentLabels = {
          pending: 'Pendiente',
          partial: 'Parcial',
          paid: 'Pagado'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${paymentColors[row.payment_status] || 'bg-gray-100 text-gray-800'}`}>
            {paymentLabels[row.payment_status] || row.payment_status}
          </span>
        );
      }
    }
  ],
  
  quotes: [
    {
      field: 'quote_number',
      header: 'Número',
      render: (row) => (
        <span className="text-sm font-medium text-blue-600 dark:text-blue-400">
          {row.quote_number || `#${row.id?.slice(-6)}`}
        </span>
      )
    },
    {
      field: 'date',
      header: 'Fecha',
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {formatDate(row.date || row.created_at)}
        </span>
      )
    },
    {
      field: 'valid_until',
      header: 'Válida Hasta',
      render: (row) => (
        <span className="text-sm text-gray-900 dark:text-gray-100">
          {row.valid_until ? formatDate(row.valid_until) : '-'}
        </span>
      )
    },
    {
      field: 'total',
      header: 'Total',
      render: (row) => (
        <span className="text-sm font-semibold text-green-600 dark:text-green-400">
          {formatCurrency(row.total)}
        </span>
      )
    },
    {
      field: 'status',
      header: 'Estado',
      render: (row) => {
        const statusColors = {
          pending: 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200',
          approved: 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200',
          rejected: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
          expired: 'bg-gray-100 text-gray-800 dark:bg-gray-900 dark:text-gray-200'
        };
        const statusLabels = {
          pending: 'Pendiente',
          approved: 'Aprobada',
          rejected: 'Rechazada',
          expired: 'Expirada'
        };
        return (
          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${statusColors[row.status] || 'bg-gray-100 text-gray-800'}`}>
            {statusLabels[row.status] || row.status}
          </span>
        );
      }
    }
  ]
};

export default HistoryModal;
