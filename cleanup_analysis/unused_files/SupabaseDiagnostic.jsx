// Supabase Connection Diagnostic Tool
import React, { useState } from 'react';
import { supabase } from '../supabaseClient';

const SupabaseDiagnostic = () => {
  const [results, setResults] = useState({});
  const [loading, setLoading] = useState(false);

  const runDiagnostics = async () => {
    setLoading(true);
    const diagnostics = {};

    try {
      // Test 1: Check environment variables
      diagnostics.envVars = {
        url: process.env.REACT_APP_SUPABASE_URL ? '✅ Present' : '❌ Missing',
        key: process.env.REACT_APP_SUPABASE_ANON_KEY ? '✅ Present' : '❌ Missing',
        urlValue: process.env.REACT_APP_SUPABASE_URL,
        keyValue: process.env.REACT_APP_SUPABASE_ANON_KEY?.substring(0, 20) + '...'
      };

      // Test 2: Basic connection test
      try {
        const startTime = Date.now();
        const { data, error } = await supabase.from('clients').select('count').limit(1);
        const endTime = Date.now();
        
        if (error) {
          diagnostics.connection = `❌ Error: ${error.message}`;
        } else {
          diagnostics.connection = `✅ Success (${endTime - startTime}ms)`;
        }
      } catch (err) {
        diagnostics.connection = `❌ Network Error: ${err.message}`;
      }

      // Test 3: Check all tables
      const tables = ['clients', 'products', 'suppliers', 'employees', 'orders', 'quotes', 'invoices', 'inventory', 'maintenances'];
      diagnostics.tables = {};
      
      for (const table of tables) {
        try {
          const { data, error, count } = await supabase
            .from(table)
            .select('*', { count: 'exact', head: true });
          
          if (error) {
            diagnostics.tables[table] = `❌ ${error.message}`;
          } else {
            diagnostics.tables[table] = `✅ ${count || 0} records`;
          }
        } catch (err) {
          diagnostics.tables[table] = `❌ ${err.message}`;
        }
      }

      // Test 4: Check RLS policies
      try {
        const { data, error } = await supabase.from('clients').select('*').limit(1);
        if (error && error.message.includes('RLS')) {
          diagnostics.rls = '⚠️ RLS may be blocking access';
        } else {
          diagnostics.rls = '✅ RLS configured correctly';
        }
      } catch (err) {
        diagnostics.rls = `❌ RLS Error: ${err.message}`;
      }

    } catch (error) {
      diagnostics.error = error.message;
    }

    setResults(diagnostics);
    setLoading(false);
  };

  return (
    <div className="p-6 max-w-4xl mx-auto">
      <div className="bg-white rounded-lg shadow-lg p-6">
        <h2 className="text-2xl font-bold text-gray-800 mb-4">🔍 Supabase Connection Diagnostics</h2>
        
        <button
          onClick={runDiagnostics}
          disabled={loading}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 mb-6"
        >
          {loading ? '🔄 Running Tests...' : '🚀 Run Diagnostics'}
        </button>

        {Object.keys(results).length > 0 && (
          <div className="space-y-6">
            {/* Environment Variables */}
            {results.envVars && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">📋 Environment Variables</h3>
                <div className="space-y-1 text-sm">
                  <div>SUPABASE_URL: {results.envVars.url}</div>
                  <div>SUPABASE_KEY: {results.envVars.key}</div>
                  <div className="text-xs text-gray-600 mt-2">
                    URL: {results.envVars.urlValue}<br/>
                    Key: {results.envVars.keyValue}
                  </div>
                </div>
              </div>
            )}

            {/* Connection Test */}
            {results.connection && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🌐 Connection Test</h3>
                <div className="text-sm">{results.connection}</div>
              </div>
            )}

            {/* RLS Check */}
            {results.rls && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">🔒 Row Level Security</h3>
                <div className="text-sm">{results.rls}</div>
              </div>
            )}

            {/* Tables */}
            {results.tables && (
              <div className="bg-gray-50 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2">📊 Database Tables</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2 text-sm">
                  {Object.entries(results.tables).map(([table, status]) => (
                    <div key={table} className="flex justify-between">
                      <span className="font-medium">{table}:</span>
                      <span>{status}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Error */}
            {results.error && (
              <div className="bg-red-50 border border-red-200 p-4 rounded-lg">
                <h3 className="text-lg font-semibold mb-2 text-red-800">❌ Error</h3>
                <div className="text-sm text-red-600">{results.error}</div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default SupabaseDiagnostic;
