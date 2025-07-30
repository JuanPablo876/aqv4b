import React, { useState, useEffect } from 'react';
import { maintenances, maintenanceHistory } from '../mock/maintenances';
import { clients } from '../mock/clients';
import { employees } from '../mock/employees';
import { formatCurrency, formatDate } from '../utils/storage';
import { filterBySearchTerm, sortByField, getStatusColorClass } from '../utils/helpers';
import { alertUpcomingMaintenance } from '../utils/alerts'; // Import alert utility
import VenetianTile from './VenetianTile';
import MaintenancesAddModal from './MaintenancesAddModal'; // Import the new modal

const MaintenancesPage = () => {
  const [maintenancesList, setMaintenancesList] = useState([]);
  const [clientsList, setClientsList] = useState([]);
  const [employeesList, setEmployeesList] = useState([]);
  const [historyList, setHistoryList] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ field: 'lastServiceDate', direction: 'desc' });
  const [statusFilter, setStatusFilter] = useState('');
  const [selectedMaintenance, setSelectedMaintenance] = useState(null);
  const [isAddMaintenanceModalOpen, setIsAddMaintenanceModalOpen] = useState(false); // State for add modal
  
  useEffect(() => {
    // In a real app, this would be an API call or localStorage
    setMaintenancesList(maintenances);
    setClientsList(clients);
    setEmployeesList(employees);
    setHistoryList(maintenanceHistory);
  }, []);
  
  // Combine maintenances with client and employee details
  const maintenancesWithDetails = maintenancesList.map(maintenance => {
    const client = clientsList.find(c => c.id === maintenance.clientId) || {};
    const lastService = historyList
      .filter(h => h.maintenanceId === maintenance.id)
      .sort((a, b) => new Date(b.date) - new Date(a.date))[0];
      
    const lastServiceEmployee = lastService 
      ? employeesList.find(e => e.id === lastService.employeeId) || {}
      : {};
      
    return {
      ...maintenance,
      clientName: client.name || 'Cliente Desconocido',
      clientContact: client.contact || 'N/A',
      clientPhone: client.phone || 'N/A',
      lastServiceDateFormatted: lastService ? formatDate(lastService.date) : 'N/A',
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
      ['clientName', 'address', 'serviceType', 'notes']
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
  
  // Handle maintenance selection
  const handleSelectMaintenance = (maintenance) => {
    // Get history and payments for this maintenance
    const maintenanceHistoryDetails = historyList
      .filter(h => h.maintenanceId === maintenance.id)
      .map(h => {
        const employee = employeesList.find(e => e.id === h.employeeId) || {};
        return {
          ...h,
          employeeName: employee.name || 'Empleado Desconocido'
        };
      })
      .sort((a, b) => new Date(b.date) - new Date(a.date));
      
    setSelectedMaintenance({
      ...maintenance,
      history: maintenanceHistoryDetails
    });
  };
  
  // Handle close maintenance details
  const handleCloseDetails = () => {
    setSelectedMaintenance(null);
  };
  
  // Simulate alerting employee for upcoming maintenance (placeholder)
  const handleAlertEmployee = (maintenance) => {
     const employee = employeesList.find(emp => emp.id === maintenance.lastServiceEmployeeId); // Assuming lastServiceEmployeeId is the assigned employee for next service
     const client = clientsList.find(c => c.id === maintenance.clientId);
     
     if (employee && client) {
        alertUpcomingMaintenance(maintenance, client, employee);
     } else {
        console.log("No employee assigned or client not found for this maintenance.");
     }
  };
  
  // Handle add maintenance
  const handleAddMaintenance = () => {
    setIsAddMaintenanceModalOpen(true);
  };
  
  // Handle save new maintenance from modal
  const handleSaveNewMaintenance = (newMaintenanceData) => {
    const updatedMaintenances = [...maintenancesList, { ...newMaintenanceData, id: maintenancesList.length + 1 }];
    setMaintenancesList(updatedMaintenances);
    // Optionally trigger alert for the assigned employee here
    if (newMaintenanceData.lastServiceEmployeeId) {
       const client = clientsList.find(c => c.id === newMaintenanceData.clientId);
       const employee = employeesList.find(emp => emp.id === newMaintenanceData.lastServiceEmployeeId);
       if (client && employee) {
          alertUpcomingMaintenance({ ...newMaintenanceData, id: maintenancesList.length + 1 }, client, employee);
       }
    }
  };
  
  // Get status label
  const getStatusLabel = (status) => {
    switch (status) {
      case 'active': return 'Activo';
      case 'inactive': return 'Inactivo';
      case 'completed': return 'Completado';
      default: return status;
    }
  };
  
  // Get payment status label
  const getPaymentStatusLabel = (status) => {
    switch (status) {
      case 'pending': return 'Pendiente';
      case 'paid': return 'Pagado';
      default: return status;
    }
  };
  
  return (
    <div className="p-6">
      {/* Header with search, filter and add button */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between mb-6">
        <h2 className="text-2xl font-semibold text-blue-800 mb-4 md:mb-0">Mantenimientos</h2>
        
        <div className="flex flex-col md:flex-row space-y-3 md:space-y-0 md:space-x-3">
          <div className="relative">
            <input
              type="text"
              placeholder="Buscar mantenimientos..."
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
              Nuevo Mantenimiento
            </div>
          </button>
        </div>
      </div>
      
      {/* Maintenances table */}
      <VenetianTile className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-blue-50">
              <tr>
                <th 
                  scope="col" 
                  className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider cursor-pointer"
                  onClick={() => handleSort('clientName')}
                >
                  <div className="flex items-center">
                    Cliente
                    {sortConfig.field === 'clientName' && (
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
                  onClick={() => handleSort('serviceType')}
                >
                  <div className="flex items-center">
                    Tipo de Servicio
                    {sortConfig.field === 'serviceType' && (
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
                  onClick={() => handleSort('frequency')}
                >
                  <div className="flex items-center">
                    Frecuencia
                    {sortConfig.field === 'frequency' && (
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
                  onClick={() => handleSort('lastServiceDate')}
                >
                  <div className="flex items-center">
                    Último Servicio
                    {sortConfig.field === 'lastServiceDate' && (
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
                  Ejecutado Por
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
              {filteredMaintenances.map((maintenance) => (
                <tr 
                  key={maintenance.id} 
                  className="hover:bg-blue-50 cursor-pointer"
                  onClick={() => handleSelectMaintenance(maintenance)}
                >
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm font-medium text-gray-900">{maintenance.clientName}</div>
                    <div className="text-xs text-gray-500">{maintenance.address}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maintenance.serviceType}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maintenance.frequency}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maintenance.lastServiceDateFormatted}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{maintenance.lastServiceEmployeeName}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(maintenance.status)}`}>
                      {getStatusLabel(maintenance.status)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                     <button 
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleSelectMaintenance(maintenance);
                      }}
                    >
                      Ver
                    </button>
                    <button 
                      className="text-green-600 hover:text-green-900 mr-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleAlertEmployee(maintenance);
                      }}
                    >
                      Alertar Empleado
                    </button>
                    <button 
                      className="text-gray-600 hover:text-gray-900"
                      onClick={(e) => {
                        e.stopPropagation();
                        // Handle edit action
                      }}
                    >
                      Editar
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </VenetianTile>
      
      {/* Maintenance details modal */}
      {selectedMaintenance && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <VenetianTile className="max-w-4xl w-full max-h-[90vh] overflow-y-auto">
            <div className="p-6 border-b border-blue-100">
              <div className="flex justify-between items-center">
                <h3 className="text-xl font-semibold text-blue-800">Detalles del Mantenimiento</h3>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6">
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información General</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Cliente:</span>
                      <p className="text-blue-800 font-medium">{selectedMaintenance.clientName}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Tipo de Servicio:</span>
                      <p className="text-blue-800">{selectedMaintenance.serviceType}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Frecuencia:</span>
                      <p className="text-blue-800">{selectedMaintenance.frequency}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Estado:</span>
                      <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(selectedMaintenance.status)}`}>
                        {getStatusLabel(selectedMaintenance.status)}
                      </span>
                    </div>
                    
                    {selectedMaintenance.notes && (
                      <div>
                        <span className="text-gray-500">Notas:</span>
                        <p className="text-blue-800 mt-1">{selectedMaintenance.notes}</p>
                      </div>
                    )}
                  </div>
                </div>
                
                <div>
                  <h4 className="text-lg font-medium text-blue-800 mb-4">Información de Contacto y Ubicación</h4>
                  
                  <div className="space-y-3">
                    <div>
                      <span className="text-gray-500">Contacto:</span>
                      <p className="text-blue-800">{selectedMaintenance.clientContact}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Teléfono:</span>
                      <p className="text-blue-800">{selectedMaintenance.clientPhone}</p>
                    </div>
                    
                    <div>
                      <span className="text-gray-500">Dirección:</span>
                      <p className="text-blue-800">{selectedMaintenance.address}</p>
                      {selectedMaintenance.googleMapsLink && (
                        <a 
                          href={selectedMaintenance.googleMapsLink} 
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
              
              <h4 className="text-lg font-medium text-blue-800 mb-4">Historial de Servicios</h4>
              
              {selectedMaintenance.history && selectedMaintenance.history.length > 0 ? (
                <div className="bg-blue-50 rounded-lg overflow-hidden mb-6">
                  <table className="min-w-full divide-y divide-gray-200">
                    <thead className="bg-blue-100">
                      <tr>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Fecha
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Ejecutado Por
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Detalles del Servicio
                        </th>
                        <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Pago
                        </th>
                        <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-blue-800 uppercase tracking-wider">
                          Monto
                        </th>
                      </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                      {selectedMaintenance.history.map((service) => (
                        <tr key={service.id}>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{formatDate(service.date)}</div>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <div className="text-sm text-gray-900">{service.employeeName}</div>
                          </td>
                          <td className="px-6 py-4">
                            <div className="text-sm text-gray-900">{service.serviceDetails}</div>
                            {service.notes && (
                              <div className="text-xs text-gray-500 mt-1">{service.notes}</div>
                            )}
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap">
                            <span className={`px-2 inline-flex text-xs leading-5 font-semibold rounded-full ${getStatusColorClass(service.paymentStatus)}`}>
                              {getPaymentStatusLabel(service.paymentStatus)}
                            </span>
                          </td>
                          <td className="px-6 py-4 whitespace-nowrap text-right">
                            <div className="text-sm font-medium text-gray-900">{formatCurrency(service.amount)}</div>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <VenetianTile className="p-6 text-center mb-6">
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    className="h-12 w-12 mx-auto text-gray-400 mb-4"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                  <h3 className="text-lg font-medium text-blue-800 mb-1">No hay historial de servicios</h3>
                  <p className="text-gray-500">Este mantenimiento aún no tiene servicios registrados</p>
                </VenetianTile>
              )}
              
              <div className="flex justify-between items-center">
                <div className="flex space-x-3">
                  <button className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2">
                    Editar Mantenimiento
                  </button>
                  
                  <button className="px-4 py-2 bg-gray-600 text-white rounded-md hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2">
                    Programar Próximo Servicio
                  </button>
                </div>
                
                <button className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2">
                  Registrar Nuevo Servicio
                </button>
              </div>
            </div>
          </VenetianTile>
        </div>
      )}
      
      {/* Add Maintenance Modal */}
      <MaintenancesAddModal 
        isOpen={isAddMaintenanceModalOpen}
        onClose={() => setIsAddMaintenanceModalOpen(false)}
        onSave={handleSaveNewMaintenance}
      />
    </div>
  );
};

export default MaintenancesPage;
// DONE
