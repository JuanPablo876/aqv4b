# TODO: Deployment and Production Checklist

## UI/UX Polish & Code Organization
- [ ] **Consolidate Duplicated UI Components:**
  - [ ] Create reusable `StatusBadge` component to replace scattered status styling
  - [ ] Create reusable `ActivityIcon` component for different activity types
  - [ ] Create reusable `StatsCard` component to reduce dashboard code duplication
  - [ ] Create reusable `ChartTooltip` component for consistent chart interactions
  - [ ] Create reusable `DataTable` component with sorting and filtering
  - [ ] Consolidate modal components into a base `Modal` component with variants
  - [ ] Create reusable `LoadingSpinner` component to replace inline spinners
  - [ ] Create reusable `EmptyState` component for consistent empty data displays

## Dashboard Issues
- [ ] **Fix Chart Dark Theme Support:**
  - [ ] Update DashboardChartCard to use CSS variables for colors instead of hardcoded hex
  - [ ] Add proper dark theme colors for chart axes, labels, and gridlines
  - [ ] Ensure chart legend text adapts to dark/light theme
  - [ ] Test chart readability in both themes

- [ ] **Localize Activity Section:**
  - [ ] Replace English status words with Spanish equivalents in `getStatusColorClass`
  - [ ] Update status labels: "pending" → "pendiente", "completed" → "completado", etc.
  - [ ] Ensure all activity descriptions use Spanish text

- [ ] **Fix Sales Data Calculations:**
  - [ ] Replace hardcoded "+12.5%" with actual calculated percentage change
  - [ ] Implement period comparison logic (today vs yesterday, this month vs last month)
  - [ ] Add configurable date ranges for sales comparison
  - [ ] Calculate real growth percentage from actual sales data

- [ ] **Improve Dashboard Data Sorting:**
  - [ ] Add friendly date sorting for activity section (newest first by default)
  - [ ] Implement period-based text changes ("Hoy", "Esta semana", "Este mes")
  - [ ] Add filters for activity period selection
  - [ ] Sort top items and clients by relevance/value

## Deployment Tasks
- [ ] Update all references of `localhost:3000` to `aqualiquim.mx` in Supabase Edge Function environment variables and API URLs
- [ ] Verify custom domain (aqualiquim.mx) in Resend and update `from` address in Edge Function to use your domain
- [ ] Update `APP_URL` environment variable in Supabase to `https://aqualiquim.mx`
- [ ] Test email delivery to external addresses after domain verification
- [ ] Remove any test/fallback logic from invitationService and Edge Function for production
- [ ] Review and update CORS settings for production domain
- [ ] Add production secrets and API keys to Supabase environment variables
- [ ] Update documentation to reflect production URLs and settings

## Cleanup Tasks (Remove Dev Tools)
- [ ] Remove `connectionMonitor.js` utility (development debugging tool)
- [ ] Remove `SupabaseDiagnostic.jsx` and `SupabaseDiagnosticNew.jsx` components
- [ ] Remove diagnostics routes from App.jsx
- [ ] Clean up console.log statements in DatabaseService
- [ ] Remove enhanced error handling debug info from ClientsPage (keep user-friendly version)
- [ ] Remove exported diagnostics functionality from production build
- [ ] Remove connection monitoring integrations from DatabaseService

---

*This file tracks deployment and production tasks to ensure a smooth transition from local development to live system.*
