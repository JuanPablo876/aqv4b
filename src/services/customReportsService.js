// Custom Reports Generator Service (Initial Implementation)
// Provides dynamic report building for selectable entities with column selection, basic filters, and export capability.
// Persistence: LocalStorage (v1). Can be migrated to a database table later.

import { supabase } from '../supabaseClient';

const STORAGE_KEY = 'custom_reports_v1';

const allowedEntities = {
  orders: {
    table: 'orders',
    label: 'Pedidos',
    defaultColumns: ['id', 'client_name', 'status', 'total', 'created_at'],
    columns: {
      id: { label: 'ID', type: 'number' },
      client_id: { label: 'Cliente ID', type: 'number' },
      client_name: { label: 'Cliente', type: 'text', virtual: true },
      status: { label: 'Estado', type: 'text' },
      total: { label: 'Total', type: 'number' },
      created_at: { label: 'Fecha Creación', type: 'date' },
      updated_at: { label: 'Fecha Actualización', type: 'date' }
    },
    filterable: ['status', 'client_id', 'created_at', 'total'],
    advancedFilters: {
      total: ['gt', 'gte', 'lt', 'lte', 'between'],
      created_at: ['between', 'from', 'to'],
      status: ['eq', 'neq', 'in', 'contains']
    },
    joins: {
      clients: {
        relation: 'client_id', // foreign key
        select: 'name'
      }
    }
  },
  clients: {
    table: 'clients',
    label: 'Clientes',
    defaultColumns: ['id', 'name', 'email', 'phone', 'customer_type', 'created_at'],
    columns: {
      id: { label: 'ID', type: 'number' },
      name: { label: 'Nombre', type: 'text' },
      email: { label: 'Email', type: 'text' },
      phone: { label: 'Teléfono', type: 'text' },
      customer_type: { label: 'Tipo Cliente', type: 'text' },
      created_at: { label: 'Fecha Creación', type: 'date' }
    },
    filterable: ['customer_type', 'created_at']
  },
  products: {
    table: 'products',
    label: 'Productos',
    defaultColumns: ['id', 'name', 'category', 'price', 'created_at'],
    columns: {
      id: { label: 'ID', type: 'number' },
      name: { label: 'Nombre', type: 'text' },
      category: { label: 'Categoría', type: 'text' },
      price: { label: 'Precio', type: 'number' },
      cost: { label: 'Costo', type: 'number' },
      created_at: { label: 'Fecha Creación', type: 'date' }
    },
    filterable: ['category', 'created_at']
  },
  inventory: {
    table: 'inventory',
    label: 'Inventario',
    defaultColumns: ['id', 'product_name', 'quantity', 'min_stock', 'updated_at'],
    columns: {
      id: { label: 'ID', type: 'number' },
      product_id: { label: 'Producto ID', type: 'number' },
      product_name: { label: 'Producto', type: 'text', virtual: true },
      quantity: { label: 'Cantidad', type: 'number' },
      min_stock: { label: 'Stock Mínimo', type: 'number' },
      updated_at: { label: 'Actualizado', type: 'date' }
    },
    filterable: ['updated_at', 'quantity', 'min_stock'],
    advancedFilters: {
      quantity: ['gt', 'gte', 'lt', 'lte', 'between'],
      updated_at: ['between', 'from', 'to']
    },
    joins: {
      products: {
        relation: 'product_id',
        select: 'name'
      }
    }
  }
};

function loadSavedReports() {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch (e) {
    console.warn('Failed to parse saved reports');
    return [];
  }
}

function saveReports(list) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
}

const MAX_LIMIT = 5000;
const CACHE_TTL_MS = 2 * 60 * 1000; // 2 minutes lightweight cache
const _cache = new Map(); // key -> {ts, data}
const _inFlight = new Map(); // key -> promise

function makeCacheKey(parts) {
  return JSON.stringify(parts);
}
function getCached(key) {
  const entry = _cache.get(key);
  if (!entry) return null;
  if (Date.now() - entry.ts > CACHE_TTL_MS) { _cache.delete(key); return null; }
  return entry.data;
}
function setCached(key, data) { _cache.set(key, { ts: Date.now(), data }); }

export const customReportsService = {
  listEntities() {
    return Object.entries(allowedEntities).map(([key, cfg]) => ({ key, ...cfg }));
  },
  getEntityConfig(entity) {
    return allowedEntities[entity];
  },
  async runReport({ entity, columns, filters = {}, limit = 1000, offset = 0, orderBy, ascending = true, summaryOnly = false }) {
    const cfg = allowedEntities[entity];
    if (!cfg) throw new Error('Entidad no permitida');

    // Cap limit and normalize
    const safeLimit = Math.min(Math.max(1, limit || 1), MAX_LIMIT);
    const selectedCols = (columns && columns.length) ? columns : cfg.defaultColumns;

    const cacheKey = makeCacheKey({ entity, selectedCols, filters, safeLimit, offset, orderBy, ascending, summaryOnly });
    const cached = getCached(cacheKey);
    if (cached) return cached;
    if (_inFlight.has(cacheKey)) return _inFlight.get(cacheKey);

    const execPromise = (async () => {
      // SUMMARY MODE: only count + lightweight aggregates (no row payload)
      if (summaryOnly) {
        let countQuery = supabase.from(cfg.table).select('id', { count: 'exact', head: true });
        // apply same filters (basic only) for count
        Object.entries(filters).forEach(([field, value]) => {
          if (value === undefined || value === null || value === '' || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) return;
          if (typeof value === 'object' && value.op && value.val !== undefined) {
            switch (value.op) {
              case 'gt': countQuery = countQuery.gt(field, value.val); break;
              case 'gte': countQuery = countQuery.gte(field, value.val); break;
              case 'lt': countQuery = countQuery.lt(field, value.val); break;
              case 'lte': countQuery = countQuery.lte(field, value.val); break;
              case 'neq': countQuery = countQuery.neq(field, value.val); break;
              case 'contains': countQuery = countQuery.ilike(field, `%${value.val}%`); break;
              case 'in': if (Array.isArray(value.val)) countQuery = countQuery.in(field, value.val); break;
              case 'between': if (Array.isArray(value.val) && value.val.length === 2) countQuery = countQuery.gte(field, value.val[0]).lte(field, value.val[1]); break;
              default: countQuery = countQuery.eq(field, value.val);
            }
            return;
          }
          if (cfg.filterable.includes(field)) countQuery = countQuery.eq(field, value);
        });
        const { count, error: countError } = await countQuery;
        if (countError) throw countError;
        const summaryPayload = { rows: [], columns: selectedCols, totalCount: count || 0, summaryOnly: true };
        setCached(cacheKey, summaryPayload);
        return summaryPayload;
      }

      // Build base select with only necessary physical columns
      const physicalCols = selectedCols.filter(c => !cfg.columns[c]?.virtual);
      let baseSelect = physicalCols.length ? physicalCols.join(',') : 'id';

      // Determine which joins are actually needed based on requested virtual columns
      if (cfg.joins) {
        Object.entries(cfg.joins).forEach(([joinTable, meta]) => {
          const neededVirtual = selectedCols.some(col => cfg.columns[col]?.virtual && col.includes(joinTable.slice(0, -1)));
          if (neededVirtual) baseSelect += `,${joinTable}(${meta.select})`;
        });
      }

      let query = supabase.from(cfg.table).select(baseSelect, { count: 'exact' }).range(offset, offset + safeLimit - 1);

      // Apply filters (basic + advanced)
      Object.entries(filters).forEach(([field, value]) => {
        if (value === undefined || value === null || value === '' || (typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)) return;
        if (typeof value === 'object' && !Array.isArray(value) && (value.from || value.to)) {
          if (value.from) query = query.gte(field, value.from);
          if (value.to) query = query.lte(field, value.to);
          return;
        }
        if (typeof value === 'object' && value.op && value.val !== undefined) {
          switch (value.op) {
            case 'gt': query = query.gt(field, value.val); break;
            case 'gte': query = query.gte(field, value.val); break;
            case 'lt': query = query.lt(field, value.val); break;
            case 'lte': query = query.lte(field, value.val); break;
            case 'neq': query = query.neq(field, value.val); break;
            case 'contains': query = query.ilike(field, `%${value.val}%`); break;
            case 'in': if (Array.isArray(value.val)) query = query.in(field, value.val); break;
            case 'between': if (Array.isArray(value.val) && value.val.length === 2) query = query.gte(field, value.val[0]).lte(field, value.val[1]); break;
            default: query = query.eq(field, value.val);
          }
          return;
        }
        if (cfg.filterable.includes(field)) query = query.eq(field, value);
      });

      if (orderBy && selectedCols.includes(orderBy)) query = query.order(orderBy, { ascending });

      const { data, error, count } = await query;
      if (error) throw error;

      const rows = (data || []).map(row => {
        const newRow = { ...row };
        if (cfg.joins) {
          if (entity === 'orders' && row.clients) newRow.client_name = row.clients.name;
          if (entity === 'inventory' && row.products) newRow.product_name = row.products.name;
          // remove raw join objects to shrink payload
          delete newRow.clients; delete newRow.products;
        }
        return newRow;
      });

      const payload = {
        rows,
        columns: selectedCols,
        totalCount: count ?? rows.length,
        limit: safeLimit,
        offset,
        hasMore: count ? offset + rows.length < count : false
      };
      setCached(cacheKey, payload);
      return payload;
    })().finally(() => { _inFlight.delete(cacheKey); });

    _inFlight.set(cacheKey, execPromise);
    return execPromise;
  },
  saveDefinition(def) {
    const list = loadSavedReports();
    const id = def.id || crypto.randomUUID();
    const toSave = { ...def, id, saved_at: new Date().toISOString() };
    const existingIdx = list.findIndex(r => r.id === id);
    if (existingIdx >= 0) list[existingIdx] = toSave; else list.push(toSave);
    saveReports(list);
    return toSave;
  },
  listDefinitions() {
    return loadSavedReports();
  },
  deleteDefinition(id) {
    const list = loadSavedReports().filter(r => r.id !== id);
    saveReports(list);
  },
  clearCache() { _cache.clear(); }
};

export default customReportsService;
