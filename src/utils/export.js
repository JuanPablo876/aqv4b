// Enhanced utility functions for exporting data with DataService integration
import dataService from '../services/dataService';

// Common download function
const downloadFile = (content, filename, mimeType) => {
  const blob = new Blob([content], { type: mimeType });
  const link = document.createElement('a');
  if (link.download !== undefined) {
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', filename);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url); // Clean up
  }
};

// Export data to CSV format
const exportToCsv = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const header = Object.keys(data[0]);
  const csv = [
    header.join(','), // Header row
    ...data.map(row => header.map(fieldName => {
      const value = row[fieldName];
      // Handle different data types properly
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // Escape commas and quotes in CSV
      const stringValue = String(value);
      if (stringValue.includes(',') || stringValue.includes('"') || stringValue.includes('\n')) {
        return `"${stringValue.replace(/"/g, '""')}"`;
      }
      return stringValue;
    }).join(',')) // Data rows
  ].join('\r\n');

  downloadFile(csv, `${filename}.csv`, 'text/csv;charset=utf-8;');
};

// Export data to Excel-compatible format
const exportToExcel = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  // Create Excel-compatible tab-separated values
  const header = Object.keys(data[0]);
  const tsv = [
    header.join('\t'), // Header row
    ...data.map(row => header.map(fieldName => {
      const value = row[fieldName];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      return String(value).replace(/\t/g, ' '); // Replace tabs with spaces
    }).join('\t'))
  ].join('\r\n');

  downloadFile(tsv, `${filename}.xls`, 'application/vnd.ms-excel');
};

// Export data to JSON format
const exportToJson = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const json = JSON.stringify(data, null, 2);
  downloadFile(json, `${filename}.json`, 'application/json');
};

// Export data to PDF format (basic text-based)
const exportToPdf = (data, filename, title = 'Report') => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  // Create a simple text-based PDF content
  let content = `${title}\n`;
  content += `Generated on: ${new Date().toLocaleDateString()}\n`;
  content += `Total records: ${data.length}\n\n`;

  if (data.length > 0) {
    const headers = Object.keys(data[0]);
    
    // Add headers
    content += headers.join(' | ') + '\n';
    content += headers.map(() => '---').join(' | ') + '\n';
    
    // Add data rows (limit to first 100 for performance)
    data.slice(0, 100).forEach(row => {
      content += headers.map(header => {
        const value = row[header];
        if (value === null || value === undefined) return '';
        if (typeof value === 'object') return JSON.stringify(value).substring(0, 20);
        return String(value).substring(0, 20);
      }).join(' | ') + '\n';
    });

    if (data.length > 100) {
      content += `\n... and ${data.length - 100} more records`;
    }
  }

  downloadFile(content, `${filename}.txt`, 'text/plain');
};

// DataService Integration Functions

// Export entire entity from DataService
const exportEntity = (entityName, format = 'csv', filters = {}) => {
  try {
    const data = dataService.query(entityName, filters);
    const timestamp = new Date().toISOString().split('T')[0];
    const filename = `${entityName}_${timestamp}`;

    switch (format.toLowerCase()) {
      case 'csv':
        exportToCsv(data, filename);
        break;
      case 'excel':
      case 'xls':
        exportToExcel(data, filename);
        break;
      case 'json':
        exportToJson(data, filename);
        break;
      case 'pdf':
        exportToPdf(data, filename, `${entityName.charAt(0).toUpperCase() + entityName.slice(1)} Report`);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return true;
  } catch (error) {
    console.error('Export failed:', error);
    return false;
  }
};

// Export multiple entities as a combined report
const exportCombinedReport = (entities, format = 'json') => {
  try {
    const combinedData = {};
    const timestamp = new Date().toISOString().split('T')[0];

    entities.forEach(entityName => {
      combinedData[entityName] = dataService.getAll(entityName);
    });

    const filename = `combined_report_${timestamp}`;

    if (format === 'json') {
      exportToJson(combinedData, filename);
    } else {
      // For other formats, create a summary
      const summary = Object.entries(combinedData).map(([entity, data]) => ({
        entity,
        count: data.length,
        lastUpdated: data.length > 0 ? Math.max(...data.map(item => 
          new Date(item.updatedAt || item.createdAt || 0).getTime()
        )) : null
      }));

      if (format === 'csv') {
        exportToCsv(summary, `${filename}_summary`);
      } else if (format === 'excel') {
        exportToExcel(summary, `${filename}_summary`);
      }
    }

    return true;
  } catch (error) {
    console.error('Combined export failed:', error);
    return false;
  }
};

// Export with custom data transformation
const exportWithTransform = (entityName, transformFn, format = 'csv', filename = null) => {
  try {
    const rawData = dataService.getAll(entityName);
    const transformedData = rawData.map(transformFn);
    
    const exportFilename = filename || `${entityName}_transformed_${new Date().toISOString().split('T')[0]}`;

    switch (format.toLowerCase()) {
      case 'csv':
        exportToCsv(transformedData, exportFilename);
        break;
      case 'excel':
      case 'xls':
        exportToExcel(transformedData, exportFilename);
        break;
      case 'json':
        exportToJson(transformedData, exportFilename);
        break;
      default:
        throw new Error(`Unsupported format: ${format}`);
    }

    return true;
  } catch (error) {
    console.error('Transform export failed:', error);
    return false;
  }
};

// Export data to a simple text format (can be pasted into Excel)
const exportToTextForExcel = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const headers = Object.keys(data[0]);
  
  // Create tab-separated values format
  const text = [
    headers.join('\t'), // Header row separated by tabs
    ...data.map(row => headers.map(header => {
      let value = row[header];
      if (value === null || value === undefined) return '';
      if (typeof value === 'object') return JSON.stringify(value);
      // Escape tabs and newlines in data
      return String(value).replace(/\t/g, ' ').replace(/\n/g, ' ');
    }).join('\t')) // Data rows separated by tabs
  ].join('\r\n'); // Rows separated by newline

  const blob = new Blob([text], { type: 'text/plain;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.txt`); // Use .txt extension for easy pasting
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

export {
  exportToCsv,
  exportToExcel,
  exportToJson,
  exportToPdf,
  exportEntity,
  exportCombinedReport,
  exportWithTransform,
  exportToTextForExcel,
  downloadFile
};