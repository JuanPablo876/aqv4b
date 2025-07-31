# TODO: Deployment and Production Checklist

## UI/UX Polish & Code Organization
- [x] **Consolidate Duplicated UI Components:**
  - [x] Create reusable `StatusBadge` component to replace scattered status styling
  - [x] Create reusable `ActivityIcon` component for different activity types
  - [x] Create reusable `StatsCard` component to reduce dashboard code duplication
  - [x] Create reusable `ChartTooltip` component for consistent chart interactions
  - [x] Create reusable `DataTable` component with sorting and filtering
  - [x] Consolidate modal components into a base `Modal` component with variants
  - [x] Create reusable `LoadingSpinner` component to replace inline spinners
  - [x] Create reusable `EmptyState` component for consistent empty data displays
  - [x] Create reusable `AddButton` component for standardized "Add New" buttons
  - [x] Create reusable `SortIcon` component for table sorting indicators
  - [x] Create reusable `ModalBase` component to eliminate duplicate modal code

- [x] **Quote Creation Auto-Fill and UX Improvements:**
  - [x] Auto-fill client info when creating quotes from ClientsPage "Nueva Cotización" button
  - [x] Display pre-selected client information prominently in quote modal
  - [x] Disable client selector when client is pre-selected to avoid confusion
  - [x] Auto-open quote modal when navigating from client details
  - [x] Clear pre-selected client after quote creation or modal close

- [x] **Dark Theme Color Fixes:**
  - [x] Replace bright green "Agregar Producto" button with blue to work better with dark theme
  - [x] Update "Nuevo Pedido" button from bright green to emerald for better dark theme compatibility
  - [x] Add proper dark theme support for form elements (inputs, selects, textareas)
  - [x] Improve label colors and contrast for dark/light theme consistency

## Dashboard Issues
- [ ] **Fix Chart Dark Theme Support:**
  - [ ] Update DashboardChartCard to use CSS variables for colors instead of hardcoded hex values
  - [ ] Add proper dark theme colors for chart axes, labels, and gridlines
  - [ ] Ensure chart legend text adapts to dark/light theme automatically
  - [ ] Test chart readability and contrast in both theme modes
  - [ ] Fix chart tooltips and hover states for dark theme compatibility

- [ ] **Localize Activity Section (Fix English Words in "Actividad Reciente"):**
  - [ ] Replace English status words with Spanish equivalents in `getStatusColorClass`
  - [ ] Update status labels: "pending" → "pendiente", "completed" → "completado", "cancelled" → "cancelado"
  - [ ] Ensure all activity descriptions use consistent Spanish text
  - [ ] Fix mixed language in activity timestamps and descriptions
  - [ ] Update activity icons and labels to match Spanish terminology

- [ ] **Fix Sales Data Calculations (Remove Hardcoded Values):**
  - [ ] Replace hardcoded "+12.5%" in "Ventas Diarias" with actual calculated percentage change
  - [ ] Implement real period comparison logic (today vs yesterday, this month vs last month)
  - [ ] Add configurable date ranges for sales comparison calculations
  - [ ] Calculate actual growth percentage from real sales/invoice data
  - [ ] Connect sales metrics to actual database records instead of mock data

- [ ] **Improve Dashboard Data Sorting and Friendly Date Display:**
  - [ ] Add friendly date sorting for activity section (newest first by default)
  - [ ] Implement period-based text changes ("Hoy", "Esta semana", "Este mes") instead of raw dates
  - [ ] Add intuitive date filters for activity period selection
  - [ ] Sort top items and clients by actual relevance/value from database
  - [ ] Add relative time display ("hace 2 horas", "ayer", "la semana pasada")

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
- [x] Remove `connectionMonitor.js` utility (development debugging tool)
- [x] Remove `SupabaseDiagnostic.jsx` and `SupabaseDiagnosticNew.jsx` components
- [x] Remove diagnostics routes from App.jsx
- [x] Clean up console.log statements in DatabaseService
- [x] Remove enhanced error handling debug info from ClientsPage (keep user-friendly version)
- [x] Remove exported diagnostics functionality from production build
- [x] Remove connection monitoring integrations from DatabaseService

## Notifications Fix
 
-- Fix the notifications always apperaing after logging in
---

*This file tracks deployment and production tasks to ensure a smooth transition from local development to live system.*
