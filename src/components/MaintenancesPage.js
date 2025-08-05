import React, { useState, useEffect } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData } from '../utils/formValidation';
import maintenanceService from '../services/maintenanceService';
import VenetianTile from './VenetianTile';
import MaintenancesAddModal from './MaintenancesAddModal';

const MaintenancesPage = () => {
  // Use custom maintenance service instead of generic useData hook
  const [maintenancesList, setMaintenancesList] = useState([]);
  const [maintenancesLoading, setMaintenancesLoading] = useState(true);
  const [maintenancesError, setMaintenancesError] = useState(null);
  
  const { data: clientsList = [], loading: clientsLoading } = useData('clients');
  const { data: employeesList = [], loading: employeesLoading } = useData('employees');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'next_service_date', direction: 'asc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);
  const [isServiceHistoryModalOpen, setIsServiceHistoryModalOpen] = useState(false);
  const [selectedMaintenanceForHistory, setSelectedMaintenanceForHistory] = useState(null);
  const [serviceHistory, setServiceHistory] = useState([]);
  const [serviceHistoryLoading, setServiceHistoryLoading] = useState(false);
  const [maintenanceStats, setMaintenanceStats] = useState({
    totalMaintenances: 0,
    activeMaintenances: 0,
    overdueMaintenances: 0,
    thisMonthServices: 0
  });

  // Load maintenances on component mount
  useEffect(() => {
    loadMaintenances();
    loadMaintenanceStats();
  }, []);

  const loadMaintenances = async () => {
    try {
      setMaintenancesLoading(true);
      const data = await maintenanceService.getMaintenances();
      setMaintenancesList(data);
      setMaintenancesError(null);
    } catch (error) {
      console.error('Error loading maintenances:', error);
      setMaintenancesError(error.message);
    } finally {
      setMaintenancesLoading(false);
    }
  };

  const loadMaintenanceStats = async () => {
    try {
      const stats = await maintenanceService.getMaintenanceStats();
      setMaintenanceStats(stats);
    } catch (error) {
      console.error('Error loading maintenance stats:', error);
    }
  };

  const loading = maintenancesLoading || clientsLoading || employeesLoading;

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500"></div>
      </div>
    );
  }

  if (maintenancesError) {
    return (
      <VenetianTile className="p-6">
        <div className="text-red-600 dark:text-red-400">Error: {maintenancesError}</div>
      </VenetianTile>
    );
  }

  // Combine maintenances with client and employee details - now from service response
  const maintenancesWithDetails = (maintenancesList || []).map(maintenance => {
    // Data comes pre-joined from the service
    const client = maintenance.clients || {};
    const lastServiceEmployee = maintenance.employees || {};
      
    return {
      ...maintenance,
      clientName: client.name || 'Cliente Desconocido',
      clientContact: client.contact || 'N/A',
      clientPhone: client.phone || 'N/A',
      clientEmail: client.email || 'N/A',
      lastServiceDateFormatted: maintenance.last_service_date ? formatDate(maintenance.last_service_date) : 'N/A',
      nextServiceDateFormatted: maintenance.next_service_date ? formatDate(maintenance.next_service_date) : 'N/A',
      lastServiceEmployeeName: lastServiceEmployee.name || 'N/A',
      isOverdue: maintenance.next_service_date && maintenance.status === 'active' 
        ? new Date(maintenance.next_service_date) < new Date() 
        : false
    };
  });
  
  // Filter and sort maintenances
  const filteredMaintenances = sortByField(
    filterBySearchTerm(
      statusFilter 
        ? maintenancesWithDetails.filter(m => m.status === statusFilter)
        : maintenancesWithDetails, 
      searchTerm, 
      ['clientName', 'address', 'service_type', 'notes']
    ),
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

  // Handle add maintenance
  const handleAddMaintenance = () => {
    setIsAddMaintenanceModalOpen(true);
  };

  // Handle save new maintenance from modal
  const handleSaveNewMaintenance = async (newMaintenanceData) => {
    await handleFormSubmission(async () => {
      const cleanedData = cleanFormData(newMaintenanceData);
      await maintenanceService.createMaintenance(cleanedData);
      await loadMaintenances(); // Reload data
      await loadMaintenanceStats(); // Update stats
      setIsAddMaintenanceModalOpen(false);
      return 'Mantenimiento creado exitosamente';
    });
  };

  // Handle edit maintenance
  const handleEditMaintenance = (maintenance) => {
    setEditingMaintenance({ ...maintenance });
    setIsEditModalOpen(true);
  };

  // Handle save edited maintenance
  const handleSaveEditedMaintenance = async () => {
    await handleFormSubmission(async () => {
      // Filter out virtual/computed fields that don't exist in database
      const { 
        clientName, 
        clientContact, 
        clientEmail, 
        clientPhone, 
        lastServiceEmployee, 
        lastServiceDateFormatted, 
        nextServiceDateFormatted,
        lastServiceEmployeeName, 
        isOverdue,
        clients,
        employees,
        ...maintenanceData 
      } = editingMaintenance;
      
      const cleanedData = cleanFormData(maintenanceData);
      await maintenanceService.updateMaintenance(editingMaintenance.id, cleanedData);
      await loadMaintenances(); // Reload data
      await loadMaintenanceStats(); // Update stats
      setIsEditModalOpen(false);
      setEditingMaintenance(null);
      return 'Mantenimiento actualizado exitosamente';
    });
  };

  // Handle input change for editing maintenance
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingMaintenance(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Fetch service history for maintenance - now using real service
  const fetchServiceHistory = async (maintenanceId) => {
    setServiceHistoryLoading(true);
    try {
      const history = await maintenanceService.getServiceHistory(maintenanceId);
      
      // If no history exists, generate some sample data for demonstration
      if (!history || history.length === 0) {

        await maintenanceService.generateSampleServiceRecords(maintenanceId, 3);
        // Fetch again after generating
        const newHistory = await maintenanceService.getServiceHistory(maintenanceId);
        setServiceHistory(newHistory);
      } else {
        setServiceHistory(history);
      }
    } catch (error) {
      console.error('Error fetching service history:', error);
      handleError(error, 'fetch service history', 'Error al cargar el historial de servicios');
      setServiceHistory([]);
    } finally {
      setServiceHistoryLoading(false);
    }
  };

  // Handle service history
  const handleServiceHistory = async (maintenance) => {
    setSelectedMaintenanceForHistory(maintenance);
    setIsServiceHistoryModalOpen(true);
    await fetchServiceHistory(maintenance.id);
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-gray-900 dark:text-gray-100 mb-4 md:mb-0">
          Mantenimientos
        </h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar mantenimientos..."
              className="w-full md:w-64 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
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
            className="w-full md:w-48 px-4 py-2 border border-gray-300 dark:border-gray-600 rounded-lg bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
          >
            <option value="">Todos los estados</option>
            <option value="active">Activos</option>
            <option value="inactive">Inactivos</option>
            <option value="completed">Completados</option>
          </select>
          
          <button
            onClick={handleAddMaintenance}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg transition-colors duration-200 flex items-center"
          >
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
            Nuevo Mantenimiento
          </button>
        </div>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <VenetianTile className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-blue-100 dark:bg-blue-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-blue-600 dark:text-blue-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Total Mantenimientos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{maintenanceStats.totalMaintenances}</p>
            </div>
          </div>
        </VenetianTile>
        
        <VenetianTile className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-green-100 dark:bg-green-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-green-600 dark:text-green-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Activos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{maintenanceStats.activeMaintenances}</p>
            </div>
          </div>
        </VenetianTile>
        
        <VenetianTile className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-red-100 dark:bg-red-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-red-600 dark:text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Vencidos</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{maintenanceStats.overdueMaintenances}</p>
            </div>
          </div>
        </VenetianTile>
        
        <VenetianTile className="p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="w-8 h-8 bg-purple-100 dark:bg-purple-900 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-purple-600 dark:text-purple-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-500 dark:text-gray-400">Este Mes</p>
              <p className="text-2xl font-semibold text-gray-900 dark:text-gray-100">{maintenanceStats.thisMonthServices}</p>
            </div>
          </div>
        </VenetianTile>
      </div>

      {/* Maintenances Table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200 dark:divide-gray-700">
            <thead className="bg-blue-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    Cliente
                    {sortConfig.field === 'clientName' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('service_type')}
                >
                  <div className="flex items-center">
                    Tipo de Servicio
                    {sortConfig.field === 'service_type' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('last_service_date')}
                >
                  <div className="flex items-center">
                    Última Fecha
                    {sortConfig.field === 'last_service_date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('next_service_date')}
                >
                  <div className="flex items-center">
                    Próxima Fecha
                    {sortConfig.field === 'next_service_date' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('status')}
                >
                  <div className="flex items-center">
                    Estado
                    {sortConfig.field === 'status' && (
                      <span className="ml-1">
                        {sortConfig.direction === 'asc' ? '↑' : '↓'}
                      </span>
                    )}
                  </div>
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider"
                >
                  Empleado
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-center text-xs font-medium text-blue-800 dark:text-gray-200 uppercase tracking-wider"
                >
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {(filteredMaintenances || []).map((maintenance) => (
                <tr 
                  key={maintenance.id} 
                  className={`hover:bg-gray-50 dark:hover:bg-gray-700 ${
                    maintenance.isOverdue ? 'bg-red-50 dark:bg-red-900/20 border-l-4 border-red-500' : ''
                  }`}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium text-gray-900 dark:text-gray-100">
                        {maintenance.clientName}
                      </div>
                      <div className="text-sm text-gray-500 dark:text-gray-400">
                        {maintenance.address || 'Sin dirección'}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {maintenance.service_type || 'N/A'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {maintenance.lastServiceDateFormatted}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className={`text-sm flex items-center ${
                      maintenance.isOverdue ? 'text-red-600 dark:text-red-400' : 'text-gray-900 dark:text-gray-100'
                    }`}>
                      {maintenance.isOverdue && (
                        <svg className="w-4 h-4 mr-1 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      )}
                      {maintenance.nextServiceDateFormatted || 'No programada'}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(maintenance.status)}`}>
                      {maintenance.status === 'active' ? 'Activo' : 
                       maintenance.status === 'inactive' ? 'Inactivo' : 
                       maintenance.status === 'completed' ? 'Completado' : 
                       maintenance.status || 'Sin estado'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {maintenance.lastServiceEmployeeName}
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button
                        className="text-blue-600 hover:text-blue-900 dark:text-blue-400 dark:hover:text-blue-200"
                        onClick={() => handleEditMaintenance(maintenance)}
                      >
                        Editar
                      </button>
                      <button
                        className="text-green-600 hover:text-green-900 dark:text-green-400 dark:hover:text-green-200"
                        onClick={() => handleServiceHistory(maintenance)}
                      >
                        Historial
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>

      {/* Add Maintenance Modal */}
      {isAddMaintenanceModalOpen && (
        <MaintenancesAddModal
          isOpen={isAddMaintenanceModalOpen}
          onClose={() => setIsAddMaintenanceModalOpen(false)}
          onSave={handleSaveNewMaintenance}
          clients={clientsList}
          employees={employeesList}
        />
      )}

      {/* Edit Maintenance Modal */}
      {isEditModalOpen && editingMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Editar Mantenimiento
                </h3>
                <button
                  onClick={() => setIsEditModalOpen(false)}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Cliente
                  </label>
                  <select
                    name="client_id"
                    value={editingMaintenance.client_id || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar cliente...</option>
                    {(clientsList || []).map(client => (
                      <option key={client.id} value={client.id}>
                        {client.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Tipo de Servicio
                  </label>
                  <input
                    type="text"
                    name="service_type"
                    value={editingMaintenance.service_type || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Tipo de servicio..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={editingMaintenance.status || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar estado...</option>
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                    <option value="completed">Completado</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Empleado Responsable
                  </label>
                  <select
                    name="last_service_employee_id"
                    value={editingMaintenance.last_service_employee_id || ''}
                    onChange={handleEditInputChange}
                    className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-gray-100 focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="">Seleccionar empleado...</option>
                    {(employeesList || []).map(employee => (
                      <option key={employee.id} value={employee.id}>
                        {employee.name}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      setIsEditModalOpen(false);
                    }}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleSaveEditedMaintenance();
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors duration-200"
                  >
                    Guardar Cambios
                  </button>
                </div>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Service History Modal */}
      {isServiceHistoryModalOpen && selectedMaintenanceForHistory && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-6xl w-full mx-4 max-h-[90vh] overflow-y-auto">
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h3 className="text-xl font-semibold text-gray-900 dark:text-gray-100">
                  Historial - {selectedMaintenanceForHistory.clientName}
                </h3>
                <button
                  onClick={() => {
                    setIsServiceHistoryModalOpen(false);
                    setSelectedMaintenanceForHistory(null);
                    setServiceHistory([]);
                  }}
                  className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="mb-4 p-4 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
                <h4 className="font-medium text-blue-800 dark:text-blue-200 mb-2">Información del Mantenimiento</h4>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Dirección:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-100">{selectedMaintenanceForHistory.address || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Tipo de Servicio:</span>
                    <span className="ml-2 text-gray-800 dark:text-gray-100">{selectedMaintenanceForHistory.service_type || 'N/A'}</span>
                  </div>
                  <div>
                    <span className="font-medium text-gray-600 dark:text-gray-300">Estado:</span>
                    <span className={`ml-2 px-2 py-1 text-xs font-semibold rounded-full ${getStatusColorClass(selectedMaintenanceForHistory.status)}`}>
                      {selectedMaintenanceForHistory.status === 'active' ? 'Activo' : 
                       selectedMaintenanceForHistory.status === 'inactive' ? 'Inactivo' : 
                       selectedMaintenanceForHistory.status === 'completed' ? 'Completado' : 
                       selectedMaintenanceForHistory.status || 'Sin estado'}
                    </span>
                  </div>
                </div>
              </div>

              {serviceHistoryLoading ? (
                <div className="flex justify-center items-center h-32">
                  <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
                  <span className="ml-3 text-gray-600 dark:text-gray-300">Cargando historial...</span>
                </div>
              ) : serviceHistory.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-gray-500 dark:text-gray-400 mb-2">
                    <svg className="mx-auto h-12 w-12 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    No hay historial disponible
                  </div>
                  <p className="text-sm text-gray-400 dark:text-gray-500">
                    Los servicios realizados aparecerán aquí cuando estén registrados
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <h4 className="text-lg font-medium text-gray-900 dark:text-gray-100">
                      Servicios Realizados ({serviceHistory.length})
                    </h4>
                    <div className="text-sm text-gray-500 dark:text-gray-400">
                      {serviceHistory.some(record => record.id?.toString().includes('mock')) ? 
                        '📝 Datos de demostración' : 
                        '✅ Datos de base de datos'
                      }
                    </div>
                  </div>

                  <div className="grid gap-4">
                    {serviceHistory.map((record, index) => (
                      <div key={record.id || index} className="border border-gray-200 dark:border-gray-600 rounded-lg p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors">
                        <div className="flex justify-between items-start mb-3">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <h5 className="font-medium text-gray-900 dark:text-gray-100">
                                {record.service_type || 'Servicio de Mantenimiento'}
                              </h5>
                              <span className={`px-2 py-1 text-xs font-semibold rounded-full ${
                                record.status === 'completed' ? 'bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-300' :
                                record.status === 'pending' ? 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-300' :
                                'bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-300'
                              }`}>
                                {record.status === 'completed' ? 'Completado' :
                                 record.status === 'pending' ? 'Pendiente' : 
                                 record.status || 'Sin estado'}
                              </span>
                            </div>
                            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 text-sm">
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Fecha:</span>
                                <span className="ml-2 text-gray-800 dark:text-gray-100">
                                  {record.service_date ? formatDate(record.service_date) : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Técnico:</span>
                                <span className="ml-2 text-gray-800 dark:text-gray-100">
                                  {record.employees?.name || record.employee_name || 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Duración:</span>
                                <span className="ml-2 text-gray-800 dark:text-gray-100">
                                  {record.duration_hours ? `${record.duration_hours}h` : 'N/A'}
                                </span>
                              </div>
                              <div>
                                <span className="font-medium text-gray-600 dark:text-gray-300">Costo:</span>
                                <span className="ml-2 text-gray-800 dark:text-gray-100">
                                  {record.cost ? formatCurrency(record.cost) : 'N/A'}
                                </span>
                              </div>
                            </div>
                          </div>
                        </div>
                        
                        {record.description && (
                          <div className="mb-3">
                            <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">Descripción:</span>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{record.description}</p>
                          </div>
                        )}

                        {record.notes && (
                          <div className="mb-3">
                            <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">Notas:</span>
                            <p className="mt-1 text-sm text-gray-700 dark:text-gray-300">{record.notes}</p>
                          </div>
                        )}

                        {record.products && record.products.length > 0 && (
                          <div>
                            <span className="font-medium text-gray-600 dark:text-gray-300 text-sm">Productos utilizados:</span>
                            <div className="mt-1 flex flex-wrap gap-2">
                              {record.products.map((product, idx) => (
                                <span key={idx} className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-800 dark:text-blue-300 text-xs rounded">
                                  {product.name} {product.price && `(${formatCurrency(product.price)})`}
                                </span>
                              ))}
                            </div>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>

                  {serviceHistory.length > 0 && (
                    <div className="mt-6 p-4 bg-gray-50 dark:bg-gray-800 rounded-lg">
                      <h5 className="font-medium text-gray-900 dark:text-gray-100 mb-2">Resumen de Servicios</h5>
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Total de servicios:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">{serviceHistory.length}</span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Servicios completados:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">
                            {serviceHistory.filter(r => r.status === 'completed').length}
                          </span>
                        </div>
                        <div>
                          <span className="font-medium text-gray-600 dark:text-gray-300">Costo total:</span>
                          <span className="ml-2 text-gray-800 dark:text-gray-100">
                            {formatCurrency(serviceHistory.reduce((sum, r) => sum + (r.cost || 0), 0))}
                          </span>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}
            </div>
          </VenetianTile>
        </div>
      )}
    </div>
  );
};

export default MaintenancesPage;
