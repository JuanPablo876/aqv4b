import React, { useState } from 'react';
import VenetianTile from './VenetianTile';
import AIQueryInterface from '../utils/aiQueryInterface';

const AIQueryTestPage = () => {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [selectedTable, setSelectedTable] = useState('');
  const [tableSchema, setTableSchema] = useState(null);

  // Example queries for user guidance
  const exampleQueries = [
    'sales from last 7 days',
    'low stock below 10',
    'top 5 products',
    'all clients',
    'inventory movements from last month'
  ];

  const handleNaturalLanguageQuery = async () => {
    if (!query.trim()) return;
    
    setLoading(true);
    try {
      const result = await AIQueryInterface.executeNaturalLanguageQuery(query);
      setResults(result);
    } catch (error) {
      setResults({
        type: 'error',
        message: error.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const handleTableSchemaQuery = async () => {
    if (!selectedTable) return;
    
    setLoading(true);
    try {
      const schema = await AIQueryInterface.getTableSchema(selectedTable);
      setTableSchema(schema);
    } catch (error) {
      setTableSchema({
        error: error.message
      });
    } finally {
      setLoading(false);
    }
  };

  const handleDirectQuery = async (table, options = {}) => {
    setLoading(true);
    try {
      const result = await AIQueryInterface.executeQuery(table, options);
      const formatted = AIQueryInterface.formatResults(result);
      setResults(formatted);
    } catch (error) {
      setResults({
        type: 'error',
        message: error.message,
        data: null
      });
    } finally {
      setLoading(false);
    }
  };

  const renderResults = () => {
    if (!results) return null;

    switch (results.type) {
      case 'error':
        return (
          <VenetianTile className="p-4 bg-red-50 border border-red-200">
            <h3 className="text-red-800 font-medium mb-2">Error</h3>
            <p className="text-red-600">{results.message}</p>
          </VenetianTile>
        );

      case 'empty':
        return (
          <VenetianTile className="p-4 bg-yellow-50 border border-yellow-200">
            <h3 className="text-yellow-800 font-medium mb-2">No Results</h3>
            <p className="text-yellow-600">{results.message}</p>
          </VenetianTile>
        );

      case 'table':
        return (
          <VenetianTile className="overflow-hidden">
            <div className="p-4 border-b border-blue-100">
              <h3 className="text-blue-800 font-medium">{results.title}</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-blue-50">
                  <tr>
                    {results.headers.map((header, index) => (
                      <th key={index} className="px-6 py-3 text-left text-xs font-medium text-blue-800 uppercase tracking-wider">
                        {header.replace(/_/g, ' ')}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {results.rows.map((row, rowIndex) => (
                    <tr key={rowIndex} className="hover:bg-blue-50">
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                          {cell !== null && cell !== undefined ? String(cell) : '-'}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </VenetianTile>
        );

      default:
        return null;
    }
  };

  return (
    <div className="p-6 space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-blue-500 mb-1">AI Database Query Interface</h1>
        <p className="text-sm text-gray-600 dark:text-gray-400">
          Test the AI database query system with natural language or direct queries
        </p>
      </div>

      {/* Natural Language Query */}
      <VenetianTile className="p-6">
        <h2 className="text-lg font-medium text-blue-800 mb-4">Natural Language Query</h2>
        
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">
              Ask a question about your data:
            </label>
            <div className="flex space-x-3">
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && handleNaturalLanguageQuery()}
                placeholder="e.g., show me sales from last 7 days"
                className="flex-1 px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              />
              <button
                onClick={handleNaturalLanguageQuery}
                disabled={loading || !query.trim()}
                className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 disabled:bg-blue-300"
              >
                {loading ? 'Querying...' : 'Query'}
              </button>
            </div>
          </div>

          <div>
            <p className="text-sm text-gray-600 mb-2">Example queries:</p>
            <div className="flex flex-wrap gap-2">
              {exampleQueries.map((example, index) => (
                <button
                  key={index}
                  onClick={() => setQuery(example)}
                  className="px-3 py-1 bg-gray-100 text-gray-700 rounded-full text-sm hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
                >
                  {example}
                </button>
              ))}
            </div>
          </div>
        </div>
      </VenetianTile>

      {/* Direct Table Query */}
      <VenetianTile className="p-6">
        <h2 className="text-lg font-medium text-blue-800 mb-4">Direct Table Query</h2>
        
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {AIQueryInterface.ALLOWED_TABLES.map((table) => (
            <button
              key={table}
              onClick={() => handleDirectQuery(table, { limit: 10 })}
              disabled={loading}
              className="p-3 text-left bg-gray-50 hover:bg-blue-50 border border-gray-200 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2"
            >
              <div className="font-medium text-gray-900">{table}</div>
              <div className="text-sm text-gray-500">View recent records</div>
            </button>
          ))}
        </div>
      </VenetianTile>

      {/* Table Schema Explorer */}
      <VenetianTile className="p-6">
        <h2 className="text-lg font-medium text-blue-800 mb-4">Table Schema Explorer</h2>
        
        <div className="space-y-4">
          <div className="flex space-x-3">
            <select
              value={selectedTable}
              onChange={(e) => setSelectedTable(e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select a table...</option>
              {AIQueryInterface.ALLOWED_TABLES.map((table) => (
                <option key={table} value={table}>{table}</option>
              ))}
            </select>
            <button
              onClick={handleTableSchemaQuery}
              disabled={loading || !selectedTable}
              className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:bg-green-300"
            >
              Get Schema
            </button>
          </div>

          {tableSchema && (
            <div className="bg-gray-50 rounded-md p-4">
              {tableSchema.error ? (
                <p className="text-red-600">{tableSchema.error}</p>
              ) : (
                <div>
                  <h3 className="font-medium text-gray-900 mb-2">{tableSchema.table}</h3>
                  <p className="text-sm text-gray-600 mb-3">{tableSchema.schema.description}</p>
                  <div>
                    <h4 className="text-sm font-medium text-gray-700 mb-1">Columns:</h4>
                    <div className="flex flex-wrap gap-2">
                      {tableSchema.schema.columns.map((column) => (
                        <span key={column} className="px-2 py-1 bg-blue-100 text-blue-800 text-xs rounded">
                          {column}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </VenetianTile>

      {/* Results */}
      {renderResults()}
    </div>
  );
};

export default AIQueryTestPage;
