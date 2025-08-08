import React, { useState, useEffect } from 'react';
import VenetianTile from './VenetianTile';
import { customReportsService } from '../services/customReportsService';
import { exportToCsv, exportToExcel, exportToJson } from '../utils/export';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const ExportButtons = ({ rows, columns, filename, cfg }) => {
  if (!rows || rows.length === 0) return null;
  const data = rows.map(r => { const obj = {}; columns.forEach(c => { obj[c] = r[c]; }); return obj; });
  const exportPdf = () => {
    const doc = new jsPDF({ orientation: 'landscape' });
    doc.text(filename, 14, 10);
    autoTable(doc, {
      head: [columns.map(c => cfg.columns[c]?.label || c)],
      body: rows.slice(0, 500).map(r => columns.map(c => String(r[c] ?? ''))),
      styles: { fontSize: 7 },
      headStyles: { fillColor: [59,130,246] }
    });
    if (rows.length > 500) {
      doc.text(`Mostrando 500 de ${rows.length} filas`, 14, doc.lastAutoTable.finalY + 10);
    }
    doc.save(`${filename}.pdf`);
  };
  return (
    <div className="flex flex-wrap gap-2 mt-3">
      <button onClick={() => exportToCsv(data, filename)} className="px-3 py-1 bg-primary text-white rounded text-sm">CSV</button>
      <button onClick={() => exportToExcel(data, filename)} className="px-3 py-1 bg-primary text-white rounded text-sm">Excel</button>
      <button onClick={() => exportToJson(data, filename)} className="px-3 py-1 bg-primary text-white rounded text-sm">JSON</button>
      <button onClick={exportPdf} className="px-3 py-1 bg-primary text-white rounded text-sm">PDF</button>
    </div>
  );
};

const ADVANCED_OP_LABEL = { gt: '>', gte: '>=', lt: '<', lte: '<=', between: 'Entre', contains: 'Contiene', eq: '=', neq: '!=', in: 'Lista' };

const CustomReportBuilder = () => {
  const [entity, setEntity] = useState('orders');
  const [availableCols, setAvailableCols] = useState([]);
  const [selectedCols, setSelectedCols] = useState([]);
  const [filters, setFilters] = useState({});
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [savedReports, setSavedReports] = useState([]);
  const [reportName, setReportName] = useState('');
  const [limit, setLimit] = useState(200);
  const [error, setError] = useState(null);
  const [advancedFilters, setAdvancedFilters] = useState({});

  useEffect(() => {
    const cfg = customReportsService.getEntityConfig(entity);
    if (cfg) {
      setAvailableCols(Object.keys(cfg.columns));
      setSelectedCols(cfg.defaultColumns);
      setFilters({});
      setResults(null);
    }
  }, [entity]);

  useEffect(() => {
    setSavedReports(customReportsService.listDefinitions());
  }, []);

  const toggleColumn = (col) => {
    setSelectedCols(prev => prev.includes(col) ? prev.filter(c => c !== col) : [...prev, col]);
  };

  const handleFilterChange = (field, value) => {
    setFilters(prev => ({ ...prev, [field]: value }));
  };

  const buildFilters = () => {
    // merge simple filters and advanced filters
    return { ...filters, ...advancedFilters };
  };

  const run = async () => {
    setLoading(true); setError(null);
    try {
      const { rows, columns } = await customReportsService.runReport({ entity, columns: selectedCols, filters: buildFilters(), limit });
      setResults({ rows, columns });
    } catch (e) {
      console.error(e);
      setError(e.message || 'Error ejecutando reporte');
    } finally { setLoading(false); }
  };

  const save = () => {
    if (!reportName.trim()) return;
    const saved = customReportsService.saveDefinition({ name: reportName.trim(), entity, columns: selectedCols, filters, limit });
    setSavedReports(customReportsService.listDefinitions());
    setReportName('');
  };

  const loadSaved = (def) => {
    setEntity(def.entity);
    setSelectedCols(def.columns);
    setFilters(def.filters || {});
    setLimit(def.limit || 200);
    setTimeout(() => run(), 50);
  };

  const delSaved = (id) => {
    customReportsService.deleteDefinition(id);
    setSavedReports(customReportsService.listDefinitions());
  };

  const cfg = customReportsService.getEntityConfig(entity);

  return (
    <div className="space-y-6">
      <VenetianTile className="p-4">
        <h3 className="text-lg font-semibold mb-4 text-primary">Generador de Reportes Personalizados</h3>
        <div className="grid md:grid-cols-4 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1">Entidad</label>
            <select value={entity} onChange={e => setEntity(e.target.value)} className="w-full border rounded px-2 py-1">
              {customReportsService.listEntities().map(ent => (
                <option key={ent.key} value={ent.key}>{ent.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Límite</label>
            <input type="number" value={limit} onChange={e => setLimit(Number(e.target.value) || 0)} className="w-full border rounded px-2 py-1" min={10} max={5000} />
          </div>
          <div className="md:col-span-2">
            <label className="block text-sm font-medium mb-1">Guardar como</label>
            <div className="flex gap-2">
              <input value={reportName} onChange={e => setReportName(e.target.value)} placeholder="Nombre del reporte" className="flex-1 border rounded px-2 py-1" />
              <button onClick={save} className="px-3 py-1 bg-secondary text-primary rounded border border-border">Guardar</button>
              <button onClick={run} disabled={loading} className="px-3 py-1 bg-primary text-white rounded">
                {loading ? 'Ejecutando...' : 'Ejecutar'}
              </button>
            </div>
          </div>
        </div>

        {cfg && (
          <div className="mt-6 grid md:grid-cols-2 gap-6">
            <div>
              <h4 className="font-medium mb-2 text-primary">Columnas</h4>
              <div className="flex flex-wrap gap-2">
                {availableCols.map(col => (
                  <button key={col} onClick={() => toggleColumn(col)} className={`px-2 py-1 text-xs rounded border ${selectedCols.includes(col) ? 'bg-primary text-white' : 'bg-secondary text-primary'}`}>
                    {cfg.columns[col].label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <h4 className="font-medium mb-2 text-primary">Filtros Básicos</h4>
              <div className="space-y-2">
                {cfg.filterable.map(f => (
                  <div key={f} className="flex items-center gap-2">
                    <label className="w-32 text-sm">{cfg.columns[f]?.label || f}</label>
                    <input value={filters[f] || ''} onChange={e => handleFilterChange(f, e.target.value)} placeholder="Valor" className="flex-1 border rounded px-2 py-1" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </VenetianTile>

      <VenetianTile className="p-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="font-medium text-primary">Resultados</h4>
          {results && <span className="text-xs text-muted-foreground">{results.rows.length} filas</span>}
        </div>
        {error && <div className="mb-2 text-red-600 text-sm">{error}</div>}
        {!results && <div className="text-sm text-muted-foreground">Ejecuta un reporte para ver resultados.</div>}
        {results && results.rows.length === 0 && <div className="text-sm text-muted-foreground">Sin datos.</div>}
        {results && results.rows.length > 0 && (
          <div className="overflow-auto border rounded">
            <table className="min-w-full text-sm">
              <thead className="bg-secondary">
                <tr>
                  {results.columns.map(col => <th key={col} className="px-3 py-2 text-left whitespace-nowrap">{cfg.columns[col]?.label || col}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.rows.slice(0, 500).map((row, idx) => (
                  <tr key={idx} className="border-t">
                    {results.columns.map(col => <td key={col} className="px-3 py-1 whitespace-nowrap max-w-[240px] overflow-hidden text-ellipsis">{String(row[col] ?? '')}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
        {results && <ExportButtons rows={results.rows} columns={results.columns} filename={`reporte_${entity}_${new Date().toISOString().split('T')[0]}`} cfg={cfg} />}
      </VenetianTile>

      {cfg && cfg.advancedFilters && (
        <VenetianTile className="p-4">
          <h4 className="font-medium mb-2 text-primary">Filtros Avanzados</h4>
          <div className="space-y-3">
            {Object.entries(cfg.advancedFilters).map(([field, ops]) => (
              <div key={field} className="border rounded p-3">
                <div className="text-xs font-semibold mb-2 text-muted-foreground">{cfg.columns[field]?.label || field}</div>
                <div className="flex flex-wrap gap-2">
                  {ops.map(op => (
                    <div key={op} className="flex items-center gap-1">
                      {op === 'between' ? (
                        <>
                          <span className="text-xs">{ADVANCED_OP_LABEL[op]}</span>
                          <input type="text" placeholder="Desde" className="w-20 border rounded px-1 py-0.5 text-xs" onChange={e => setAdvancedFilters(prev => ({ ...prev, [field]: { op, val: [e.target.value, (prev[field]?.val?.[1] || '')] } }))} />
                          <input type="text" placeholder="Hasta" className="w-20 border rounded px-1 py-0.5 text-xs" onChange={e => setAdvancedFilters(prev => ({ ...prev, [field]: { op, val: [(prev[field]?.val?.[0] || ''), e.target.value] } }))} />
                        </>
                      ) : op === 'in' ? (
                        <>
                          <span className="text-xs">Lista</span>
                          <input type="text" placeholder="a,b,c" className="w-36 border rounded px-1 py-0.5 text-xs" onChange={e => setAdvancedFilters(prev => ({ ...prev, [field]: { op, val: e.target.value.split(',').map(s => s.trim()).filter(Boolean) } }))} />
                        </>
                      ) : (
                        <>
                          <span className="text-xs">{ADVANCED_OP_LABEL[op] || op}</span>
                          <input type="text" className="w-24 border rounded px-1 py-0.5 text-xs" onChange={e => setAdvancedFilters(prev => ({ ...prev, [field]: { op, val: e.target.value } }))} />
                        </>
                      )}
                      {advancedFilters[field] && advancedFilters[field].op === op && (
                        <button onClick={() => setAdvancedFilters(prev => { const cp = { ...prev }; delete cp[field]; return cp; })} className="text-xs text-red-600">✕</button>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </VenetianTile>
      )}

      <VenetianTile className="p-4">
        <h4 className="font-medium mb-3 text-primary">Reportes Guardados</h4>
        {savedReports.length === 0 && <div className="text-sm text-muted-foreground">No hay reportes guardados.</div>}
        {savedReports.length > 0 && (
          <div className="space-y-2">
            {savedReports.map(r => (
              <div key={r.id} className="flex items-center justify-between border rounded px-3 py-2">
                <div>
                  <div className="font-medium text-sm">{r.name}</div>
                  <div className="text-xs text-muted-foreground">{r.entity} • {r.columns.length} columnas</div>
                </div>
                <div className="flex gap-2">
                  <button onClick={() => loadSaved(r)} className="text-xs px-2 py-1 rounded bg-secondary text-primary">Cargar</button>
                  <button onClick={() => delSaved(r.id)} className="text-xs px-2 py-1 rounded bg-red-100 text-red-700">Eliminar</button>
                </div>
              </div>
            ))}
          </div>
        )}
      </VenetianTile>
    </div>
  );
};

export default CustomReportBuilder;
