/**
 * AuditLogsPage - Administrative interface for viewing user activity and audit trails
 */

import React, { useState, useEffect } from 'react';
import { useAudit } from '../hooks/useAudit';
import { formatDate } from '../utils/storage';
import { formatDateTime } from '../utils/dateFormat';
import { handleError } from '../utils/errorHandling';
import VenetianTile from './VenetianTile';
import HistoryModal from './HistoryModal';

const AuditLogsPage = () => {
  const { getAuditLogs, getRecentActivity, getUserActivity } = useAudit();
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    tableName: '',
    action: '',
    userId: '',
    module: '',
    dateFrom: '',
    dateTo: '',
    limit: 50
  });
  const [selectedLog, setSelectedLog] = useState(null);
  const [isDetailModalOpen, setIsDetailModalOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');

  // Load audit logs
  const loadAuditLogs = async () => {
    try {
      setLoading(true);
      const data = await getAuditLogs(filters);
      setAuditLogs(data);
    } catch (error) {
      console.error('Error loading audit logs:', error);
      handleError(error, 'Error al cargar logs de auditoría');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadAuditLogs();
  }, [filters]);

  // Filter logs by search term
  const filteredLogs = auditLogs.filter(log => {
    if (!searchTerm) return true;
    const searchLower = searchTerm.toLowerCase();
    return (
      log.description?.toLowerCase().includes(searchLower) ||
      log.user_name?.toLowerCase().includes(searchLower) ||
      log.user_email?.toLowerCase().includes(searchLower) ||
      log.table_name?.toLowerCase().includes(searchLower) ||
      log.action?.toLowerCase().includes(searchLower) ||
      log.module?.toLowerCase().includes(searchLower)
    );
  });

  // Get action badge color
  const getActionBadgeColor = (action) => {
    const colors = {
      CREATE: 'bg-green-100 text-green-800',
      UPDATE: 'bg-blue-100 text-blue-800',
      DELETE: 'bg-red-100 text-red-800',
      LOGIN: 'bg-purple-100 text-purple-800',
      LOGOUT: 'bg-gray-100 text-gray-800'
    };
    return colors[action] || 'bg-gray-100 text-gray-800';
  };

  // Handle filter change
  const handleFilterChange = (field, value) => {
    setFilters(prev => ({
      ...prev,
      [field]: value
    }));
  };

  // Clear filters
  const clearFilters = () => {
    setFilters({
      tableName: '',
      action: '',
      userId: '',
      module: '',
      dateFrom: '',
      dateTo: '',
      limit: 50
    });
    setSearchTerm('');
  };

  // View log details
  const viewLogDetails = (log) => {
    setSelectedLog(log);
    setIsDetailModalOpen(true);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-blue-800 mb-2">Logs de Auditoría</h2>
          <p className="text-gray-600">Registro completo de actividades del sistema</p>
        </div>
      </div>

      {/* Filters */}
      <VenetianTile className="p-6">
        <h3 className="text-lg font-medium text-blue-800 mb-4">Filtros</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Buscar
            </label>
            <input
              type="text"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              placeholder="Buscar en logs..."
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Table Name */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Tabla
            </label>
            <select
              value={filters.tableName}
              onChange={(e) => handleFilterChange('tableName', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las tablas</option>
              <option value="clients">Clientes</option>
              <option value="products">Productos</option>
              <option value="orders">Pedidos</option>
              <option value="quotes">Cotizaciones</option>
              <option value="inventory">Inventario</option>
              <option value="employees">Empleados</option>
              <option value="suppliers">Proveedores</option>
              <option value="maintenances">Mantenimientos</option>
              <option value="invoices">Facturas</option>
            </select>
          </div>

          {/* Action */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Acción
            </label>
            <select
              value={filters.action}
              onChange={(e) => handleFilterChange('action', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todas las acciones</option>
              <option value="CREATE">Crear</option>
              <option value="UPDATE">Actualizar</option>
              <option value="DELETE">Eliminar</option>
              <option value="LOGIN">Iniciar Sesión</option>
              <option value="LOGOUT">Cerrar Sesión</option>
            </select>
          </div>

          {/* Module */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Módulo
            </label>
            <select
              value={filters.module}
              onChange={(e) => handleFilterChange('module', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="">Todos los módulos</option>
              <option value="clients">Clientes</option>
              <option value="products">Productos</option>
              <option value="orders">Pedidos</option>
              <option value="inventory">Inventario</option>
              <option value="authentication">Autenticación</option>
              <option value="reports">Reportes</option>
              <option value="finance">Finanzas</option>
            </select>
          </div>

          {/* Date From */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Desde
            </label>
            <input
              type="date"
              value={filters.dateFrom}
              onChange={(e) => handleFilterChange('dateFrom', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Date To */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Fecha Hasta
            </label>
            <input
              type="date"
              value={filters.dateTo}
              onChange={(e) => handleFilterChange('dateTo', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>

          {/* Limit */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Límite de Resultados
            </label>
            <select
              value={filters.limit}
              onChange={(e) => handleFilterChange('limit', parseInt(e.target.value))}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value={25}>25 registros</option>
              <option value={50}>50 registros</option>
              <option value={100}>100 registros</option>
              <option value={200}>200 registros</option>
            </select>
          </div>

          {/* Clear Filters Button */}
          <div className="flex items-end">
            <button
              onClick={clearFilters}
              className="w-full px-4 py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 transition-colors"
            >
              Limpiar Filtros
            </button>
          </div>
        </div>
      </VenetianTile>

      {/* Results Summary */}
      <div className="flex items-center justify-between">
        <p className="text-sm text-gray-600">
          Mostrando {filteredLogs.length} de {auditLogs.length} registros
        </p>
        <button
          onClick={loadAuditLogs}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
        >
          Actualizar
        </button>
      </div>

      {/* Audit Logs Table */}
      <VenetianTile className="overflow-hidden">
        {loading ? (
          <div className="flex justify-center items-center h-64">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
          </div>
        ) : filteredLogs.length === 0 ? (
          <div className="text-center py-12">
            <div className="text-gray-400 text-lg mb-2">📊</div>
            <p className="text-gray-600 mb-2">No se encontraron logs de auditoría</p>
            <p className="text-sm text-gray-500">Ajusta los filtros para ver más resultados</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-blue-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Fecha/Hora
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Usuario
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Acción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Tabla/Módulo
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Descripción
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                    Acciones
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredLogs.map((log) => (
                  <tr key={log.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      {formatDateTime(log.created_at)}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {log.user_name || 'Sistema'}
                        </div>
                        <div className="text-sm text-gray-500">
                          {log.user_email}
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(log.action)}`}>
                        {log.action}
                      </span>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                      <div>
                        <div className="font-medium">{log.table_name}</div>
                        {log.module && (
                          <div className="text-gray-500 text-xs">{log.module}</div>
                        )}
                      </div>
                    </td>
                    <td className="px-6 py-4 text-sm text-gray-900 max-w-xs truncate">
                      {log.description}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      <button
                        onClick={() => viewLogDetails(log)}
                        className="text-blue-600 hover:text-blue-900"
                      >
                        Ver Detalles
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </VenetianTile>

      {/* Log Details Modal */}
      {isDetailModalOpen && selectedLog && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-blue-800">
                  Detalles del Log de Auditoría
                </h3>
                <button
                  onClick={() => setIsDetailModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Basic Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Información Básica</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID:</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedLog.id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Fecha/Hora:</dt>
                      <dd className="text-sm text-gray-900">{formatDateTime(selectedLog.created_at)}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Usuario:</dt>
                      <dd className="text-sm text-gray-900">
                        {selectedLog.user_name || 'Sistema'} ({selectedLog.user_email})
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Sesión:</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedLog.session_id}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">IP Address:</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.ip_address || 'No disponible'}</dd>
                    </div>
                  </dl>
                </div>

                {/* Action Information */}
                <div>
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Información de la Acción</h4>
                  <dl className="space-y-2">
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Acción:</dt>
                      <dd>
                        <span className={`px-2 py-1 text-xs font-semibold rounded-full ${getActionBadgeColor(selectedLog.action)}`}>
                          {selectedLog.action}
                        </span>
                      </dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Tabla:</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.table_name}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">ID del Registro:</dt>
                      <dd className="text-sm text-gray-900 font-mono">{selectedLog.record_id || 'N/A'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Módulo:</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.module || 'No especificado'}</dd>
                    </div>
                    <div>
                      <dt className="text-sm font-medium text-gray-500">Descripción:</dt>
                      <dd className="text-sm text-gray-900">{selectedLog.description}</dd>
                    </div>
                  </dl>
                </div>
              </div>

              {/* Changed Fields */}
              {selectedLog.changed_fields && selectedLog.changed_fields.length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Campos Modificados</h4>
                  <div className="bg-gray-50 p-4 rounded-md">
                    <div className="flex flex-wrap gap-2">
                      {selectedLog.changed_fields.map((field, index) => (
                        <span
                          key={index}
                          className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded-md"
                        >
                          {field}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}

              {/* Data Changes */}
              {(selectedLog.old_values || selectedLog.new_values) && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Cambios de Datos</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {selectedLog.old_values && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Valores Anteriores:</h5>
                        <pre className="bg-red-50 p-3 rounded-md text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.old_values, null, 2)}
                        </pre>
                      </div>
                    )}
                    {selectedLog.new_values && (
                      <div>
                        <h5 className="text-sm font-medium text-gray-500 mb-2">Valores Nuevos:</h5>
                        <pre className="bg-green-50 p-3 rounded-md text-xs overflow-x-auto">
                          {JSON.stringify(selectedLog.new_values, null, 2)}
                        </pre>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Metadata */}
              {selectedLog.metadata && Object.keys(selectedLog.metadata).length > 0 && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Metadatos</h4>
                  <pre className="bg-gray-50 p-3 rounded-md text-xs overflow-x-auto">
                    {JSON.stringify(selectedLog.metadata, null, 2)}
                  </pre>
                </div>
              )}

              {/* User Agent */}
              {selectedLog.user_agent && (
                <div className="mt-6">
                  <h4 className="text-lg font-medium text-gray-900 mb-4">Información del Cliente</h4>
                  <p className="text-xs text-gray-600 bg-gray-50 p-3 rounded-md break-all">
                    {selectedLog.user_agent}
                  </p>
                </div>
              )}
            </div>
          </VenetianTile>
        </div>
      )}
    </div>
  );
};

export default AuditLogsPage;
