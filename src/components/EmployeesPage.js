import React, { useState, useEffect } from 'react';
import { useEmployees } from '../hooks/useData';
import { formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { handleError, handleSuccess, handleFormSubmission } from '../utils/errorHandling';
import { cleanFormData } from '../utils/formValidation';
import { useIsAdmin } from '../hooks/useRBAC';
import VenetianTile from './VenetianTile';
import ProtectedRoute from './ProtectedRoute';
import { employeeActivityService } from '../services/employeeActivityService';
import { 
  getRelativeTime, 
  getActivityIcon, 
  calculatePerformanceGrade,
  formatWorkHours,
  getActivityTrend
} from '../utils/employeeActivityUtils';

const EmployeesPageContent = () => {
  const { data: employeesList, loading: employeesLoading, create: createEmployee, update: updateEmployee, delete: deleteEmployee } = useEmployees();
  
  // RBAC for admin permissions
  const isAdmin = useIsAdmin();
  
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'name', direction: 'asc' });
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isActivityModalOpen, setIsActivityModalOpen] = useState(false);
  const [activityData, setActivityData] = useState(null);
  const [loadingActivity, setLoadingActivity] = useState(false);
  const [newEmployee, setNewEmployee] = useState({
    name: '',
    role: '',
    email: '',
    phone: '',
    hire_date: '',
    status: 'active',
    address: '',
    google_maps_link: ''
  });
  
  // Filter and sort employees
  const filteredEmployees = sortByField(
    filterBySearchTerm((employeesList || []), searchTerm, ['name', 'role', 'email', 'phone']),
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
  
  // Handle employee selection
  const handleSelectEmployee = (employee) => {
    setSelectedEmployee(employee);
  };
  
  // Handle add new employee
  const handleAddEmployee = () => {
    setIsAddModalOpen(true);
  };
  
  // Handle input change for new employee
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewEmployee({
      ...newEmployee,
      [name]: value
    });
  };
  
  // Handle save new employee
  const handleSaveEmployee = async () => {
    await handleFormSubmission(async () => {
      const newEmployeeData = {
        ...newEmployee,
        hire_date: newEmployee.hire_date || new Date().toISOString().split('T')[0]
      };
      
      const cleanedData = cleanFormData(newEmployeeData);
      await createEmployee(cleanedData);
      setIsAddModalOpen(false);
      setNewEmployee({
        name: '',
        role: '',
        email: '',
        phone: '',
        hire_date: '',
        status: 'active',
        address: '',
        google_maps_link: ''
      });
      return 'Empleado creado exitosamente';
    });
  };
  
  // Handle close employee details
  const handleCloseDetails = () => {
    setSelectedEmployee(null);
  };

  // Handle edit employee
  const handleEditEmployee = (employee) => {
    setSelectedEmployee(employee);
    setNewEmployee({ ...employee });
    setIsEditModalOpen(true);
  };

  // Handle close edit modal
  const handleCloseEditModal = () => {
    setIsEditModalOpen(false);
    setNewEmployee({
      name: '',
      role: '',
      email: '',
      phone: '',
      hire_date: '',
      status: 'active',
      address: '',
      google_maps_link: ''
    });
  };

  // Handle view activity
  const handleViewActivity = async (employee) => {
    setSelectedEmployee(employee);
    setIsActivityModalOpen(true);
    setLoadingActivity(true);
    
    try {
      // Fetch real employee activity data
      const activity = await employeeActivityService.getEmployeeActivity(employee.id, 30);
      setActivityData(activity);
    } catch (error) {
      console.error('Error loading employee activity:', error);
      handleError(error, 'Error al cargar la actividad del empleado');
      // Fallback to empty data structure
      setActivityData({
        activities: [],
        stats: {
          totalActivities: 0,
          completedTasks: 0,
          completionRate: 0,
          satisfactionRate: 0,
          workHours: 0,
          ordersCompleted: 0,
          maintenancesCompleted: 0
        },
        period: { days: 30 }
      });
    } finally {
      setLoadingActivity(false);
    }
  };

  // Handle close activity modal
  const handleCloseActivityModal = () => {
    setIsActivityModalOpen(false);
    setSelectedEmployee(null);
    setActivityData(null);
    setLoadingActivity(false);
  };

  // Handle delete employee (admin only)
  const handleDeleteEmployee = async (employeeId) => {
    if (!isAdmin) {
      handleError('No tienes permisos para eliminar empleados');
      return;
    }

    if (window.confirm('¿Estás seguro de que deseas eliminar este empleado? Esta acción no se puede deshacer.')) {
      await handleFormSubmission(async () => {
        await deleteEmployee(employeeId);
        return 'Empleado eliminado exitosamente';
      });
    }
  };
  
  return (
    <div className="p-6">
      {/* Loading state */}
      {employeesLoading && (
        <div className="flex justify-center items-center py-8">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
          <span className="ml-3 text-gray-600">Cargando empleados...</span>
        </div>
      )}

      {/* Content - only show when data is loaded */}
      {!employeesLoading && (
        <>
          {/* Header with search and add button */}
          <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
            <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Empleados</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar empleados..."
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
          
          <button
            onClick={handleAddEmployee}
            className="bg-blue-600 text-white px-4 py-2 rounded-xl hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
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
              Nuevo Empleado
            </div>
          </button>
        </div>
      </div>
      
      {/* Employees table */}
      <VenetianTile className="overflow-hidden">
        <div className="table-container">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50 dark:bg-gray-700">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('name')}
                >
                  <div className="flex items-center">
                    Nombre
                    {sortConfig.field === 'name' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('role')}
                >
                  <div className="flex items-center">
                    Rol
                    {sortConfig.field === 'role' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider"
                >
                  Contacto
                </th>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('hire_date')}
                >
                  <div className="flex items-center">
                    Contratación
                    {sortConfig.field === 'hire_date' && (
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
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider cursor-pointer"
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
                <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 dark:text-gray-300 uppercase tracking-wider">
                  Acciones
                </th>
              </tr>
            </thead>
            <tbody className="bg-white dark:bg-gray-800 divide-y divide-gray-200 dark:divide-gray-700">
              {filteredEmployees.map((employee) => (
                <tr 
                  key={employee.id} 
                  className="hover:bg-blue-50 dark:hover:bg-gray-700 cursor-pointer"
                  onClick={() => handleSelectEmployee(employee)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900 dark:text-gray-100">{employee.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{employee.role}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{employee.email}</div>
                    <div className="text-sm text-gray-500 dark:text-gray-400">{employee.phone}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900 dark:text-gray-100">{formatDate(employee.hire_date)}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(employee.status)}`}>
                      {employee.status === 'active' ? 'Activo' : 'Inactivo'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectEmployee(employee);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEditEmployee(employee);
                      }}
                    >
                      Editar
                    </button>
                    {isAdmin && (
                      <button 
                        className="text-red-600 hover:text-red-900"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleDeleteEmployee(employee.id);
                        }}
                      >
                        Eliminar
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Employee details modal */}
      {selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Detalles del Empleado</h3>
                <button 
                  onClick={handleCloseDetails}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información General</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Nombre</p>
                      <p className="text-blue-800">{selectedEmployee.name}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Rol</p>
                      <p className="text-blue-800">{selectedEmployee.role}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Estado</p>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedEmployee.status)}`}>
                        {selectedEmployee.status === 'active' ? 'Activo' : 'Inactivo'}
                      </span>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Fecha de Contratación</p>
                      <p className="text-blue-800">{formatDate(selectedEmployee.hire_date)}</p>
                    </div>
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mt-6 mb-4">Información de Contacto</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="text-blue-800">{selectedEmployee.email}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Teléfono</p>
                      <p className="text-blue-800">{selectedEmployee.phone}</p>
                    </div>
                    
                    <div>
                      <p className="text-sm text-gray-500">Dirección</p>
                      <p className="text-blue-800">{selectedEmployee.address}</p>
                      {selectedEmployee.google_maps_link && (
                        <a 
                          href={selectedEmployee.google_maps_link} 
                          target="_blank" 
                          rel="noopener noreferrer" 
                          className="text-blue-600 hover:underline text-sm"
                        >
                          Ver en Google Maps
                        </a>
                      )}
                    </div>
                  </div>
                </div>
              </div>
              
              <div className="mt-6">
                <h4 className="text-lg font-medium text-blue-800 mb-4">Acciones Rápidas</h4>
                
                <div className="grid grid-cols-2 gap-3">
                  <button 
                    className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                    onClick={() => handleEditEmployee(selectedEmployee)}
                  >
                    Editar Empleado
                  </button>
                  
                  <button 
                    className="bg-gray-600 text-white px-4 py-2 rounded-lg hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                    onClick={() => handleViewActivity(selectedEmployee)}
                  >
                    Ver Actividad
                  </button>
                </div>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add employee modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Nuevo Empleado</h3>
                <button 
                  onClick={() => setIsAddModalOpen(false)}
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
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newEmployee.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Rol
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={newEmployee.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="text"
                    name="phone"
                    value={newEmployee.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Fecha de Contratación
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={newEmployee.hire_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Dirección
                  </label>
                  <input
                    type="text"
                    name="address"
                    value={newEmployee.address}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div className="md:col-span-2">
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Enlace Google Maps (Opcional)
                  </label>
                  <input
                    type="text"
                    name="google_maps_link"
                    value={newEmployee.google_maps_link}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={newEmployee.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div className="mt-6 flex justify-end space-x-3">
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    setIsAddModalOpen(false);
                  }}
                  className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Cancelar
                </button>
                
                <button
                  type="button"
                  onClick={(e) => {
                    e.preventDefault();
                    handleSaveEmployee();
                  }}
                  className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  Guardar Empleado
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Edit employee modal */}
      {isEditModalOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-2xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Editar Empleado</h3>
                <button 
                  onClick={handleCloseEditModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Nombre Completo
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={newEmployee.name}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Nombre del empleado"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Cargo/Rol
                  </label>
                  <input
                    type="text"
                    name="role"
                    value={newEmployee.role}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="Ej: Técnico, Supervisor"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    type="email"
                    name="email"
                    value={newEmployee.email}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="empleado@empresa.com"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Teléfono
                  </label>
                  <input
                    type="tel"
                    name="phone"
                    value={newEmployee.phone}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    placeholder="+507 6000-0000"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Fecha de Contratación
                  </label>
                  <input
                    type="date"
                    name="hire_date"
                    value={newEmployee.hire_date}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Estado
                  </label>
                  <select
                    name="status"
                    value={newEmployee.status}
                    onChange={handleInputChange}
                    className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="active">Activo</option>
                    <option value="inactive">Inactivo</option>
                  </select>
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Dirección
                </label>
                <input
                  type="text"
                  name="address"
                  value={newEmployee.address}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Dirección completa"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Google Maps Link (Opcional)
                </label>
                <input
                  type="url"
                  name="google_maps_link"
                  value={newEmployee.google_maps_link}
                  onChange={handleInputChange}
                  className="w-full px-3 py-2 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  placeholder="https://maps.google.com/..."
                />
              </div>
              
              <div className="flex justify-between pt-4">
                <div>
                  {isAdmin && (
                    <button
                      type="button"
                      onClick={() => {
                        handleCloseEditModal();
                        handleDeleteEmployee(selectedEmployee.id);
                      }}
                      className="px-4 py-2 bg-red-600 text-white rounded-md hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-offset-2"
                    >
                      Eliminar
                    </button>
                  )}
                </div>
                <div className="flex space-x-3">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.preventDefault();
                      handleCloseEditModal();
                    }}
                    className="px-4 py-2 rounded-md text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Cancelar
                  </button>
                  
                  <button
                    type="button"
                    onClick={async (e) => {
                      e.preventDefault();
                      await handleFormSubmission(async () => {
                        const cleanedData = cleanFormData(newEmployee);
                        await updateEmployee(selectedEmployee.id, cleanedData);
                        setIsEditModalOpen(false);
                        setSelectedEmployee(null);
                        return 'Empleado actualizado exitosamente';
                      });
                    }}
                    className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                  >
                    Actualizar Empleado
                  </button>
                </div>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}

      {/* Employee activity modal */}
      {isActivityModalOpen && selectedEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">
                  Actividad de {selectedEmployee.name}
                </h3>
                <button 
                  onClick={handleCloseActivityModal}
                  className="text-gray-400 hover:text-gray-500"
                >
                  <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              {loadingActivity ? (
                <div className="flex items-center justify-center py-8">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                  <span className="ml-2 text-gray-600">Cargando actividad...</span>
                </div>
              ) : activityData ? (
                <>
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-blue-800">
                        Actividad Reciente ({activityData.period?.days} días)
                      </h4>
                      {activityData.activities.length > 0 && (
                        <div className="flex items-center text-sm text-gray-600">
                          {(() => {
                            const trend = getActivityTrend(activityData.activities, activityData.period?.days);
                            return (
                              <>
                                <span className="mr-1">{trend.icon}</span>
                                <span>{trend.message}</span>
                              </>
                            );
                          })()}
                        </div>
                      )}
                    </div>
                    {activityData.activities.length > 0 ? (
                      <div className="space-y-3">
                        {activityData.activities.map((activity, index) => (
                          <div 
                            key={activity.id} 
                            className={`p-4 rounded-lg border-l-4 ${
                              activity.type === 'order' ? 'bg-blue-50 border-blue-400' :
                              activity.type === 'maintenance' ? 'bg-green-50 border-green-400' :
                              'bg-gray-50 border-gray-400'
                            }`}
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-start space-x-3">
                                <span className="text-lg mt-0.5">
                                  {getActivityIcon(activity.type)}
                                </span>
                                <div>
                                  <p className={`font-medium ${
                                    activity.type === 'order' ? 'text-blue-800' :
                                    activity.type === 'maintenance' ? 'text-green-800' :
                                    'text-gray-800'
                                  }`}>
                                    {activity.title}
                                  </p>
                                  <p className={`text-sm ${
                                    activity.type === 'order' ? 'text-blue-600' :
                                    activity.type === 'maintenance' ? 'text-green-600' :
                                    'text-gray-600'
                                  }`}>
                                    {activity.description}
                                  </p>
                                  {activity.metadata && activity.status && (
                                    <div className="mt-1">
                                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                        activity.status === 'completed' || activity.status === 'delivered' ? 
                                        'bg-green-100 text-green-800' :
                                        activity.status === 'in_progress' ? 
                                        'bg-blue-100 text-blue-800' :
                                        'bg-yellow-100 text-yellow-800'
                                      }`}>
                                        {activity.status}
                                      </span>
                                    </div>
                                  )}
                                </div>
                              </div>
                              <span className={`text-xs font-medium ${
                                activity.type === 'order' ? 'text-blue-500' :
                                activity.type === 'maintenance' ? 'text-green-500' :
                                'text-gray-500'
                              }`}>
                                {getRelativeTime(activity.created_at)}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    ) : (
                      <div className="bg-gray-50 p-6 rounded-lg text-center">
                        <div className="text-gray-400 text-lg mb-2">📋</div>
                        <p className="text-gray-600">No hay actividad reciente registrada</p>
                        <p className="text-sm text-gray-500 mt-1">
                          Las actividades aparecerán cuando se asignen órdenes o mantenimientos
                        </p>
                      </div>
                    )}
                  </div>
                  
                  <div className="mb-6">
                    <div className="flex items-center justify-between mb-3">
                      <h4 className="text-lg font-medium text-blue-800">
                        Estadísticas del Período
                      </h4>
                      {(() => {
                        const performance = calculatePerformanceGrade(activityData.stats);
                        return (
                          <div className="flex items-center space-x-2">
                            <span className="text-sm text-gray-600">Calificación:</span>
                            <span className={`text-lg font-bold ${performance.color}`}>
                              {performance.grade}
                            </span>
                          </div>
                        );
                      })()}
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                      <div className="bg-blue-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-blue-600">
                          {activityData.stats.ordersCompleted}
                        </p>
                        <p className="text-sm text-blue-600">Órdenes Completadas</p>
                      </div>
                      <div className="bg-green-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-green-600">
                          {activityData.stats.maintenancesCompleted}
                        </p>
                        <p className="text-sm text-green-600">Mantenimientos</p>
                      </div>
                      <div className="bg-purple-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-purple-600">
                          {activityData.stats.satisfactionRate}%
                        </p>
                        <p className="text-sm text-purple-600">Satisfacción Cliente</p>
                      </div>
                      <div className="bg-orange-50 p-4 rounded-lg text-center">
                        <p className="text-2xl font-bold text-orange-600">
                          {formatWorkHours(activityData.stats.workHours)}
                        </p>
                        <p className="text-sm text-orange-600">Horas Estimadas</p>
                      </div>
                    </div>
                  </div>

                  <div className="mb-6">
                    <h4 className="text-lg font-medium text-blue-800 mb-3">Resumen de Rendimiento</h4>
                    {(() => {
                      const performance = calculatePerformanceGrade(activityData.stats);
                      return (
                        <div className="bg-gradient-to-r from-gray-50 to-blue-50 p-4 rounded-lg border">
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Actividades Totales:</span>
                                <span className="font-semibold">{activityData.stats.totalActivities}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tareas Completadas:</span>
                                <span className="font-semibold">{activityData.stats.completedTasks}</span>
                              </div>
                              <div className="flex justify-between text-sm">
                                <span className="text-gray-600">Tasa de Finalización:</span>
                                <span className="font-semibold">{activityData.stats.completionRate}%</span>
                              </div>
                            </div>
                            <div className="flex items-center justify-center md:justify-end">
                              <div className="text-center">
                                <div className={`text-3xl font-bold ${performance.color} mb-1`}>
                                  {performance.grade}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {performance.description}
                                </div>
                                <div className="text-xs text-gray-500 mt-1">
                                  Puntuación: {performance.score}/100
                                </div>
                              </div>
                            </div>
                          </div>
                        </div>
                      );
                    })()}
                  </div>
                </>
              ) : (
                <div className="bg-red-50 p-6 rounded-lg text-center">
                  <div className="text-red-400 text-lg mb-2">⚠️</div>
                  <p className="text-red-600">Error al cargar los datos de actividad</p>
                  <p className="text-sm text-red-500 mt-1">
                    Por favor, intenta de nuevo más tarde
                  </p>
                </div>
              )}
              
              <div className="flex justify-end">
                <button
                  onClick={handleCloseActivityModal}
                  className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2"
                >
                  Cerrar
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

const EmployeesPage = () => {
  return (
    <ProtectedRoute 
      requiredPermission="manage_employees"
      fallback={
        <div className="p-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 text-center">
            <h3 className="text-lg font-semibold text-yellow-800 mb-2">Access Restricted</h3>
            <p className="text-yellow-700">You don't have permission to manage employees.</p>
          </div>
        </div>
      }
    >
      <EmployeesPageContent />
    </ProtectedRoute>
  );
};

export default EmployeesPage;
