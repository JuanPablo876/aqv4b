// Utility functions for exporting data

// Export data to CSV format
const exportToCsv = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const header = Object.keys(data[0]);
  const csv = [
    header.join(','), // Header row
    ...data.map(row => header.map(fieldName => JSON.stringify(row[fieldName])).join(',')) // Data rows
  ].join('\r\n');

  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  if (link.download !== undefined) { // Feature detection
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `${filename}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }
};

// Export data to a simple text format (can be pasted into Excel)
const exportToTextForExcel = (data, filename) => {
  if (!data || data.length === 0) {
    console.warn("No data to export.");
    return;
  }

  const header = Object.keys(data[0]);
  const text = [
    header.join('\t'), // Header row separated by tabs
    ...data.map(row => header.map(fieldName => {
      let value = row[fieldName];
      // Handle potential issues with commas or quotes in data
      if (typeof value === 'string') {
        value = value.replace(/"/g, '""'); // Escape double quotes
        if (value.includes('\t') || value.includes('\n') || value.includes('"')) {
           value = `"${value}"`; // Enclose in double quotes if needed
        }
      } else if (value === null || value === undefined) {
        value = ''; // Represent null/undefined as empty string
      }
      return value;
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


export { exportToCsv, exportToTextForExcel };