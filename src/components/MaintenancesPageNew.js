import React, { useState } from 'react';
import { useData } from '../hooks/useData';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import VenetianTile from './VenetianTile';
import MaintenancesAddModal from './MaintenancesAddModal';

const MaintenancesPage = () => {
  const { data: maintenancesList = [], loading: maintenancesLoading, error: maintenancesError, update: updateMaintenance, create: createMaintenance } = useData('maintenances');
  const { data: clientsList = [], loading: clientsLoading } = useData('clients');
  const { data: employeesList = [], loading: employeesLoading } = useData('employees');
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'last_service_date', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [editingMaintenance, setEditingMaintenance] = useState(null);

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

  // Combine maintenances with client and employee details
  const maintenancesWithDetails = (maintenancesList || []).map(maintenance => {
    const client = (clientsList || []).find(c => c.id === maintenance.client_id) || {};
    const lastServiceEmployee = (employeesList || []).find(e => e.id === maintenance.last_service_employee_id) || {};
      
    return {
      ...maintenance,
      clientName: client.name || 'Cliente Desconocido',
      clientContact: client.contact || 'N/A',
      clientPhone: client.phone || 'N/A',
      lastServiceDateFormatted: maintenance.last_service_date ? formatDate(maintenance.last_service_date) : 'N/A',
      lastServiceEmployeeName: lastServiceEmployee.name || 'N/A'
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
    try {
      await createMaintenance(newMaintenanceData);
      setIsAddMaintenanceModalOpen(false);
    } catch (error) {
      console.error('Error creating maintenance:', error);
      alert('Error al crear mantenimiento: ' + error.message);
    }
  };

  // Handle edit maintenance
  const handleEditMaintenance = (maintenance) => {
    setEditingMaintenance({ ...maintenance });
    setIsEditModalOpen(true);
  };

  // Handle save edited maintenance
  const handleSaveEditedMaintenance = async () => {
    try {
      await updateMaintenance(editingMaintenance.id, editingMaintenance);
      setIsEditModalOpen(false);
      setEditingMaintenance(null);
    } catch (error) {
      console.error('Error updating maintenance:', error);
      alert('Error al actualizar mantenimiento: ' + error.message);
    }
  };

  // Handle input change for editing maintenance
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditingMaintenance(prev => ({
      ...prev,
      [name]: value
    }));
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
                <tr key={maintenance.id} className="hover:bg-gray-50 dark:hover:bg-gray-700">
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
                    <div className="text-sm text-gray-900 dark:text-gray-100">
                      {maintenance.next_service_date ? formatDate(maintenance.next_service_date) : 'No programada'}
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
                    onClick={() => setIsEditModalOpen(false)}
                    className="px-4 py-2 text-gray-700 dark:text-gray-300 bg-gray-100 dark:bg-gray-600 rounded-md hover:bg-gray-200 dark:hover:bg-gray-500 transition-colors duration-200"
                  >
                    Cancelar
                  </button>
                  <button
                    onClick={handleSaveEditedMaintenance}
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
    </div>
  );
};

export default MaintenancesPage;
