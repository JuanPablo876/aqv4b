import { supabase } from '../supabaseClient'

/**
 * Fetch consolidated dashboard/report summaries from the Edge Function
 * @param {Object} params
 * @param {Array<'sales'|'orders'|'top_products'|'top_clients'|'inventory_alerts'>} [params.metrics]
 * @param {{ startDate?: string, endDate?: string }} [params.dateRange]
 * @param {{ top_products?: number, top_clients?: number }} [params.limits]
 */
export async function getReportsSummary(params = {}) {
  const { data, error } = await supabase.functions.invoke('reports-summary', {
    body: params,
  })
  if (error) throw error
  return data
}
