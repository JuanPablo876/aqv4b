// Enhanced Paginated Table Component with Virtual Scrolling
// Optimized for large datasets with performance monitoring
import React, { useState, useEffect, useCallback, useMemo, useRef } from 'react';
import VenetianTile from './VenetianTile';

const PaginatedTable = ({
  data = [],
  columns = [],
  loading = false,
  error = null,
  pageSize = 25,
  virtualScrolling = false,
  onRowClick = null,
  onSort = null,
  sortable = true,
  searchable = true,
  exportable = true,
  className = '',
  emptyMessage = 'No hay datos disponibles',
  loadingMessage = 'Cargando datos...',
  onRefresh = null,
  maxHeight = '600px',
  stickyHeader = true,
  zebra = true,
  compact = false,
  responsive = true
}) => {
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1);
  const [searchTerm, setSearchTerm] = useState('');
  const [sortConfig, setSortConfig] = useState({ key: null, direction: 'asc' });
  const [selectedRows, setSelectedRows] = useState(new Set());
  const [isPerformanceMode, setIsPerformanceMode] = useState(false);

  // Virtual scrolling state
  const [itemHeight] = useState(compact ? 40 : 56);
  const [containerHeight, setContainerHeight] = useState(600);
  const [scrollTop, setScrollTop] = useState(0);
  const [visibleStart, setVisibleStart] = useState(0);
  const [visibleEnd, setVisibleEnd] = useState(pageSize);

  const containerRef = useRef(null);
  const scrollContainerRef = useRef(null);

  // Performance monitoring
  const performanceRef = useRef({
    renderStart: 0,
    renderEnd: 0,
    filterStart: 0,
    filterEnd: 0,
    sortStart: 0,
    sortEnd: 0
  });

  // Auto-enable performance mode for large datasets
  useEffect(() => {
    if (data.length > 1000) {
      setIsPerformanceMode(true);
    }
  }, [data.length]);

  // Update container height for virtual scrolling
  useEffect(() => {
    if (virtualScrolling && containerRef.current) {
      const resizeObserver = new ResizeObserver(entries => {
        for (const entry of entries) {
          setContainerHeight(entry.contentRect.height);
        }
      });
      resizeObserver.observe(containerRef.current);
      return () => resizeObserver.disconnect();
    }
  }, [virtualScrolling]);

  // Filter and search data
  const filteredData = useMemo(() => {
    performanceRef.current.filterStart = performance.now();
    
    let filtered = data;
    
    if (searchTerm) {
      const searchLower = searchTerm.toLowerCase();
      filtered = data.filter(item => {
        return columns.some(column => {
          const value = item[column.key];
          if (value === null || value === undefined) return false;
          return String(value).toLowerCase().includes(searchLower);
        });
      });
    }

    performanceRef.current.filterEnd = performance.now();
    return filtered;
  }, [data, searchTerm, columns]);

  // Sort data
  const sortedData = useMemo(() => {
    performanceRef.current.sortStart = performance.now();
    
    let sorted = [...filteredData];
    
    if (sortConfig.key) {
      sorted.sort((a, b) => {
        const aVal = a[sortConfig.key];
        const bVal = b[sortConfig.key];
        
        if (aVal === null || aVal === undefined) return 1;
        if (bVal === null || bVal === undefined) return -1;
        
        if (typeof aVal === 'number' && typeof bVal === 'number') {
          return sortConfig.direction === 'asc' ? aVal - bVal : bVal - aVal;
        }
        
        const aStr = String(aVal).toLowerCase();
        const bStr = String(bVal).toLowerCase();
        
        if (sortConfig.direction === 'asc') {
          return aStr.localeCompare(bStr);
        } else {
          return bStr.localeCompare(aStr);
        }
      });
    }

    performanceRef.current.sortEnd = performance.now();
    return sorted;
  }, [filteredData, sortConfig]);

  // Calculate visible items for virtual scrolling
  const visibleItems = useMemo(() => {
    if (!virtualScrolling) {
      // Regular pagination
      const startIndex = (currentPage - 1) * pageSize;
      const endIndex = startIndex + pageSize;
      return sortedData.slice(startIndex, endIndex);
    } else {
      // Virtual scrolling
      const visibleCount = Math.ceil(containerHeight / itemHeight) + 5; // Add buffer
      const start = Math.max(0, Math.floor(scrollTop / itemHeight) - 2);
      const end = Math.min(sortedData.length, start + visibleCount);
      
      setVisibleStart(start);
      setVisibleEnd(end);
      
      return sortedData.slice(start, end);
    }
  }, [sortedData, currentPage, pageSize, virtualScrolling, containerHeight, itemHeight, scrollTop]);

  // Calculate pagination info
  const totalPages = Math.ceil(sortedData.length / pageSize);
  const startIndex = (currentPage - 1) * pageSize + 1;
  const endIndex = Math.min(currentPage * pageSize, sortedData.length);

  // Performance metrics
  const performanceMetrics = useMemo(() => {
    const filterTime = performanceRef.current.filterEnd - performanceRef.current.filterStart;
    const sortTime = performanceRef.current.sortEnd - performanceRef.current.sortStart;
    
    return {
      filterTime: filterTime ? filterTime.toFixed(2) : 0,
      sortTime: sortTime ? sortTime.toFixed(2) : 0,
      totalRows: data.length,
      filteredRows: filteredData.length,
      visibleRows: visibleItems.length,
      isLargeDataset: data.length > 1000
    };
  }, [data.length, filteredData.length, visibleItems.length]);

  // Handle sort
  const handleSort = useCallback((columnKey) => {
    if (!sortable) return;
    
    setSortConfig(prevConfig => ({
      key: columnKey,
      direction: prevConfig.key === columnKey && prevConfig.direction === 'asc' ? 'desc' : 'asc'
    }));
    
    if (onSort) {
      onSort(columnKey, sortConfig.direction === 'asc' ? 'desc' : 'asc');
    }
  }, [sortable, onSort, sortConfig.direction]);

  // Handle virtual scroll
  const handleScroll = useCallback((e) => {
    if (virtualScrolling) {
      setScrollTop(e.target.scrollTop);
    }
  }, [virtualScrolling]);

  // Handle row selection
  const handleRowSelect = useCallback((rowId, isSelected) => {
    setSelectedRows(prev => {
      const newSet = new Set(prev);
      if (isSelected) {
        newSet.add(rowId);
      } else {
        newSet.delete(rowId);
      }
      return newSet;
    });
  }, []);

  // Handle select all
  const handleSelectAll = useCallback((isSelected) => {
    if (isSelected) {
      setSelectedRows(new Set(visibleItems.map(item => item.id)));
    } else {
      setSelectedRows(new Set());
    }
  }, [visibleItems]);

  // Export data
  const handleExport = useCallback(() => {
    const exportData = selectedRows.size > 0 
      ? sortedData.filter(item => selectedRows.has(item.id))
      : sortedData;
    
    const csvContent = [
      columns.map(col => col.header).join(','),
      ...exportData.map(row => 
        columns.map(col => {
          const value = row[col.key];
          if (value === null || value === undefined) return '';
          return `"${String(value).replace(/"/g, '""')}"`;
        }).join(',')
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `export_${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }, [columns, sortedData, selectedRows]);

  // Render table header
  const renderHeader = () => (
    <thead className={`${stickyHeader ? 'sticky top-0 z-10' : ''} bg-gray-50 dark:bg-dark-700`}>
      <tr>
        {/* Select all checkbox */}
        <th className="px-3 py-3 text-left">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={visibleItems.length > 0 && visibleItems.every(item => selectedRows.has(item.id))}
            onChange={(e) => handleSelectAll(e.target.checked)}
          />
        </th>
        
        {columns.map((column) => (
          <th
            key={column.key}
            className={`px-3 py-3 text-left text-xs font-medium text-muted-foreground uppercase tracking-wider ${
              sortable && column.sortable !== false ? 'cursor-pointer hover:bg-gray-100 dark:hover:bg-dark-600' : ''
            }`}
            onClick={() => sortable && column.sortable !== false && handleSort(column.key)}
          >
            <div className="flex items-center space-x-1">
              <span>{column.header}</span>
              {sortable && column.sortable !== false && (
                <span className="text-gray-400">
                  {sortConfig.key === column.key ? (
                    sortConfig.direction === 'asc' ? '↑' : '↓'
                  ) : '↕'}
                </span>
              )}
            </div>
          </th>
        ))}
      </tr>
    </thead>
  );

  // Render table row
  const renderRow = (item, index) => {
    const isSelected = selectedRows.has(item.id);
    
    return (
      <tr
        key={item.id || index}
        className={`
          ${zebra && index % 2 === 0 ? 'bg-white dark:bg-dark-800' : 'bg-gray-50 dark:bg-dark-700'}
          ${onRowClick ? 'hover:bg-blue-50 dark:hover:bg-dark-600 cursor-pointer' : ''}
          ${isSelected ? 'bg-blue-100 dark:bg-blue-900/30' : ''}
          ${compact ? 'h-10' : 'h-14'}
          transition-colors duration-150
        `}
        onClick={() => onRowClick && onRowClick(item)}
        style={virtualScrolling ? {
          position: 'absolute',
          top: (visibleStart + index) * itemHeight,
          left: 0,
          right: 0,
          height: itemHeight
        } : undefined}
      >
        {/* Selection checkbox */}
        <td className="px-3 py-2">
          <input
            type="checkbox"
            className="rounded border-gray-300 text-primary focus:ring-primary"
            checked={isSelected}
            onChange={(e) => {
              e.stopPropagation();
              handleRowSelect(item.id, e.target.checked);
            }}
          />
        </td>
        
        {columns.map((column) => (
          <td
            key={column.key}
            className={`px-3 py-2 text-sm ${compact ? 'py-1' : 'py-2'} ${
              responsive ? 'truncate max-w-0' : ''
            }`}
          >
            {column.render ? column.render(item[column.key], item) : (
              <span className="text-foreground dark:text-dark-200">
                {item[column.key] !== null && item[column.key] !== undefined 
                  ? String(item[column.key]) 
                  : '-'
                }
              </span>
            )}
          </td>
        ))}
      </tr>
    );
  };

  // Render pagination controls
  const renderPagination = () => {
    if (virtualScrolling) return null;
    
    const showingText = totalPages > 0 
      ? `Mostrando ${startIndex} - ${endIndex} de ${sortedData.length} registros`
      : 'No hay registros';

    return (
      <div className="px-6 py-3 bg-gray-50 dark:bg-dark-700 border-t border-gray-200 dark:border-dark-600 flex items-center justify-between">
        <div className="flex-1 flex justify-between sm:hidden">
          <button
            onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
            disabled={currentPage === 1}
            className="relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Anterior
          </button>
          <button
            onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
            disabled={currentPage === totalPages}
            className="ml-3 relative inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Siguiente
          </button>
        </div>

        <div className="hidden sm:flex-1 sm:flex sm:items-center sm:justify-between">
          <div>
            <p className="text-sm text-muted-foreground">
              {showingText}
            </p>
          </div>
          <div>
            <nav className="relative z-0 inline-flex rounded-md shadow-sm -space-x-px">
              <button
                onClick={() => setCurrentPage(Math.max(1, currentPage - 1))}
                disabled={currentPage === 1}
                className="relative inline-flex items-center px-2 py-2 rounded-l-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Anterior
              </button>
              
              {/* Page numbers */}
              {[...Array(Math.min(5, totalPages))].map((_, index) => {
                let pageNum;
                if (totalPages <= 5) {
                  pageNum = index + 1;
                } else if (currentPage <= 3) {
                  pageNum = index + 1;
                } else if (currentPage >= totalPages - 2) {
                  pageNum = totalPages - 4 + index;
                } else {
                  pageNum = currentPage - 2 + index;
                }

                return (
                  <button
                    key={pageNum}
                    onClick={() => setCurrentPage(pageNum)}
                    className={`relative inline-flex items-center px-4 py-2 border text-sm font-medium ${
                      currentPage === pageNum
                        ? 'z-10 bg-primary border-primary text-white'
                        : 'bg-white border-gray-300 text-gray-500 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                );
              })}
              
              <button
                onClick={() => setCurrentPage(Math.min(totalPages, currentPage + 1))}
                disabled={currentPage === totalPages}
                className="relative inline-flex items-center px-2 py-2 rounded-r-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                Siguiente
              </button>
            </nav>
          </div>
        </div>
      </div>
    );
  };

  return (
    <VenetianTile className={`overflow-hidden ${className}`}>
      {/* Table controls */}
      <div className="px-6 py-4 border-b border-gray-200 dark:border-dark-600">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between space-y-3 sm:space-y-0">
          {/* Search */}
          {searchable && (
            <div className="flex-1 max-w-sm">
              <input
                type="text"
                placeholder="Buscar..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:ring-primary focus:border-primary dark:bg-dark-600 dark:border-dark-500 dark:text-dark-200"
              />
            </div>
          )}

          {/* Controls */}
          <div className="flex items-center space-x-3">
            {selectedRows.size > 0 && (
              <span className="text-sm text-muted-foreground">
                {selectedRows.size} seleccionado{selectedRows.size !== 1 ? 's' : ''}
              </span>
            )}
            
            {exportable && (
              <button
                onClick={handleExport}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 dark:bg-dark-600 dark:text-dark-200 dark:border-dark-500 dark:hover:bg-dark-500"
              >
                Exportar CSV
              </button>
            )}
            
            {onRefresh && (
              <button
                onClick={onRefresh}
                disabled={loading}
                className="px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:bg-dark-600 dark:text-dark-200 dark:border-dark-500 dark:hover:bg-dark-500"
              >
                {loading ? '⏳' : '🔄'} Actualizar
              </button>
            )}

            {/* Performance toggle */}
            {data.length > 500 && (
              <label className="flex items-center space-x-2 text-sm">
                <input
                  type="checkbox"
                  checked={isPerformanceMode}
                  onChange={(e) => setIsPerformanceMode(e.target.checked)}
                  className="rounded border-gray-300 text-primary focus:ring-primary"
                />
                <span className="text-muted-foreground">Modo rendimiento</span>
              </label>
            )}
          </div>
        </div>

        {/* Performance metrics */}
        {isPerformanceMode && (
          <div className="mt-3 p-2 bg-blue-50 dark:bg-blue-900/20 rounded text-xs">
            <div className="flex items-center space-x-4 text-blue-700 dark:text-blue-300">
              <span>Total: {performanceMetrics.totalRows}</span>
              <span>Filtrados: {performanceMetrics.filteredRows}</span>
              <span>Visibles: {performanceMetrics.visibleRows}</span>
              {performanceMetrics.filterTime > 0 && (
                <span>Filtro: {performanceMetrics.filterTime}ms</span>
              )}
              {performanceMetrics.sortTime > 0 && (
                <span>Orden: {performanceMetrics.sortTime}ms</span>
              )}
              {performanceMetrics.isLargeDataset && (
                <span className="text-orange-600 dark:text-orange-400">⚡ Dataset grande</span>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Table */}
      <div
        ref={containerRef}
        className="overflow-auto"
        style={{ maxHeight }}
        onScroll={handleScroll}
      >
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
            <span className="ml-3 text-muted-foreground">{loadingMessage}</span>
          </div>
        ) : error ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-red-500 text-lg mb-2">❌</div>
              <p className="text-red-600 dark:text-red-400">{error}</p>
              {onRefresh && (
                <button
                  onClick={onRefresh}
                  className="mt-3 px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700"
                >
                  Reintentar
                </button>
              )}
            </div>
          </div>
        ) : sortedData.length === 0 ? (
          <div className="flex items-center justify-center py-12">
            <div className="text-center">
              <div className="text-gray-400 text-lg mb-2">📋</div>
              <p className="text-muted-foreground">{emptyMessage}</p>
            </div>
          </div>
        ) : (
          <div ref={scrollContainerRef} style={virtualScrolling ? { position: 'relative', height: sortedData.length * itemHeight } : undefined}>
            <table className="min-w-full divide-y divide-gray-200 dark:divide-dark-600">
              {renderHeader()}
              <tbody className="bg-white dark:bg-dark-800 divide-y divide-gray-200 dark:divide-dark-600">
                {visibleItems.map((item, index) => renderRow(item, index))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Pagination */}
      {!loading && !error && sortedData.length > 0 && renderPagination()}
    </VenetianTile>
  );
};

export default PaginatedTable;
