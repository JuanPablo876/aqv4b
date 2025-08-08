// @ts-nocheck
import { serve } from 'https://deno.land/std@0.168.0/http/server.ts'
import { createClient } from 'https://esm.sh/@supabase/supabase-js@2'

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Credentials': 'true',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Max-Age': '86400',
}

type DateRange = { startDate?: string; endDate?: string }

type SummaryRequest = {
  // which summaries to compute; if omitted, compute all
  metrics?: Array<'sales' | 'orders' | 'top_products' | 'top_clients' | 'inventory_alerts'>,
  dateRange?: DateRange,
  limits?: { top_products?: number; top_clients?: number },
}

type SummaryResponse = {
  success: boolean
  sales?: { today: number; yesterday: number; month: number; year: number }
  orders?: { count_today: number; count_month: number; count_year: number }
  top_products?: Array<{ product_id: string; name?: string | null; revenue: number; quantity: number }>
  top_clients?: Array<{ client_id: string; name?: string | null; total_value: number; order_count: number }>
  inventory_alerts?: Array<{ product_id: string; name?: string | null; stock: number; min_stock: number; status: 'warning' | 'critical' }>
  error?: string
}

serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response(null, { status: 200, headers: corsHeaders })
  }

  try {
    const { SUPABASE_URL, SUPABASE_ANON_KEY } = Deno.env.toObject()
    if (!SUPABASE_URL || !SUPABASE_ANON_KEY) {
      return new Response(JSON.stringify({ success: false, error: 'Missing Supabase env vars' }), {
        status: 500,
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      })
    }

    const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
      global: { headers: { Authorization: req.headers.get('Authorization') || '' } },
    })

    const body: SummaryRequest = req.method === 'POST' ? await req.json() : {}
    const metrics = body.metrics && body.metrics.length > 0 ? body.metrics : ['sales', 'orders', 'top_products', 'top_clients', 'inventory_alerts']

    // Date helpers
    const now = new Date()
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate())
    const startOfYesterday = new Date(startOfToday)
    startOfYesterday.setDate(startOfYesterday.getDate() - 1)
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1)
    const startOfYear = new Date(now.getFullYear(), 0, 1)

    // Preloads
    // Fetch products and clients minimal data for name mapping to avoid per-row lookups
    const [productsRes, clientsRes] = await Promise.all([
      supabase.from('products').select('id,name,min_stock').limit(1000),
      supabase.from('clients').select('id,name').limit(1000),
    ])
    const products = new Map<string, { name: string | null; min_stock?: number | null }>()
    for (const p of productsRes.data || []) products.set(p.id, { name: p.name ?? null, min_stock: p.min_stock ?? null })
    const clients = new Map<string, { name: string | null }>()
    for (const c of clientsRes.data || []) clients.set(c.id, { name: c.name ?? null })

    const resp: SummaryResponse = { success: true }

    if (metrics.includes('sales') || metrics.includes('orders')) {
      // Compute sales totals via orders table (capped for safety)
      const { data: ordersAll, error } = await supabase
        .from('orders')
        .select('total, created_at', { head: false })
        .limit(10000)
      if (error) throw error

      const todayTotal = ordersAll
        .filter(o => new Date(o.created_at) >= startOfToday)
        .reduce((s, o) => s + (o.total || 0), 0)
      const yesterdayTotal = ordersAll
        .filter(o => {
          const d = new Date(o.created_at)
          return d >= startOfYesterday && d < startOfToday
        })
        .reduce((s, o) => s + (o.total || 0), 0)
      const monthTotal = ordersAll
        .filter(o => new Date(o.created_at) >= startOfMonth)
        .reduce((s, o) => s + (o.total || 0), 0)
      const yearTotal = ordersAll
        .filter(o => new Date(o.created_at) >= startOfYear)
        .reduce((s, o) => s + (o.total || 0), 0)
      if (metrics.includes('sales')) resp.sales = { today: todayTotal, yesterday: yesterdayTotal, month: monthTotal, year: yearTotal }

      if (metrics.includes('orders')) {
        resp.orders = {
          count_today: ordersAll.filter(o => new Date(o.created_at) >= startOfToday).length,
          count_month: ordersAll.filter(o => new Date(o.created_at) >= startOfMonth).length,
          count_year: ordersAll.filter(o => new Date(o.created_at) >= startOfYear).length,
        }
      }
    }

    if (metrics.includes('top_products')) {
      // Aggregate from order_items joined with orders for date filter
      const itemsRes = await supabase
        .from('order_items')
        .select('product_id, quantity, price, order:orders(created_at)', { head: false })
        .limit(20000)
      if (itemsRes.error) throw itemsRes.error

      const byProduct: Record<string, { quantity: number; revenue: number }> = {}
      for (const it of itemsRes.data || []) {
        const createdAt = it.order?.created_at ? new Date(it.order.created_at) : null
        if (body.dateRange?.startDate && createdAt && createdAt < new Date(body.dateRange.startDate)) continue
        if (body.dateRange?.endDate && createdAt && createdAt > new Date(body.dateRange.endDate)) continue
        const key = it.product_id
        if (!key) continue
        if (!byProduct[key]) byProduct[key] = { quantity: 0, revenue: 0 }
        byProduct[key].quantity += it.quantity || 0
        byProduct[key].revenue += (it.quantity || 0) * (it.price || 0)
      }
      const limit = body.limits?.top_products ?? 5
      resp.top_products = Object.entries(byProduct)
        .map(([product_id, v]) => ({ product_id, ...v, name: products.get(product_id)?.name ?? null }))
        .sort((a, b) => b.revenue - a.revenue)
        .slice(0, limit)
    }

    if (metrics.includes('top_clients')) {
      // Aggregate orders by client
      const { data: ordersAll, error } = await supabase
        .from('orders')
        .select('client_id,total,created_at')
        .limit(10000)
      if (error) throw error
      const byClient: Record<string, { total_value: number; order_count: number }> = {}
      for (const o of ordersAll || []) {
        const createdAt = new Date(o.created_at)
        if (body.dateRange?.startDate && createdAt < new Date(body.dateRange.startDate)) continue
        if (body.dateRange?.endDate && createdAt > new Date(body.dateRange.endDate)) continue
        const key = o.client_id
        if (!key) continue
        if (!byClient[key]) byClient[key] = { total_value: 0, order_count: 0 }
        byClient[key].total_value += o.total || 0
        byClient[key].order_count += 1
      }
      const limit = body.limits?.top_clients ?? 5
      resp.top_clients = Object.entries(byClient)
        .map(([client_id, v]) => ({ client_id, ...v, name: clients.get(client_id)?.name ?? null }))
        .sort((a, b) => b.total_value - a.total_value)
        .slice(0, limit)
    }

    if (metrics.includes('inventory_alerts')) {
      // Join inventory with product min_stock to compute alerts
      const { data: inv, error } = await supabase.from('inventory').select('id,product_id,quantity').limit(5000)
      if (error) throw error
      const alerts: SummaryResponse['inventory_alerts'] = []
      for (const item of inv || []) {
        const meta = products.get(item.product_id)
        const minStock = (meta?.min_stock ?? 5) as number
        if (item.quantity <= minStock) {
          alerts.push({
            product_id: item.product_id,
            name: meta?.name ?? null,
            stock: item.quantity,
            min_stock: minStock,
            status: item.quantity === 0 ? 'critical' : 'warning',
          })
        }
      }
      resp.inventory_alerts = alerts
    }

    return new Response(JSON.stringify(resp), {
      status: 200,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  } catch (e) {
    console.error('reports-summary error', e)
    return new Response(JSON.stringify({ success: false, error: e?.message || 'Unknown error' }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    })
  }
})
