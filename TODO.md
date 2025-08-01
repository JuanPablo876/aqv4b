# TODO: Deployment and Production Checklist

## Recent UI/UX Issues (August 2025)
- [x] **Fixed Horizontal Scroll Issues:**
  - [x] Remove `overflow-x: hidden` from root CSS that prevented table scrolling
  - [x] Add `.table-container` class for proper horizontal scroll on tables
  - [x] Allow tables to scroll horizontally when zoomed in or on mobile devices

- [x] **Table Infrastructure Rebuild Complete:**
  - [x] Rebuilt MaintenancesPage table with proper responsive structure and dark mode support
  - [x] Rebuilt SuppliersPage table with consistent styling and theme compatibility
  - [x] Rebuilt EmployeesPage table with standardized layout and dark mode classes
  - [x] Enhanced QuotesPage table with dark mode support and consistent structure
  - [x] All tables now use consistent `table-container` wrapper and proper CSS classes
  - [x] Implemented responsive dark/light mode themes across all table components
  - [x] Standardized table headers with `bg-blue-50 dark:bg-gray-700` classes
  - [x] Enhanced table bodies with proper hover states and dark mode support

- [x] **Fixed ToastContainer Error:**
  - [x] Add null safety checks to ToastContainer component
  - [x] Prevent "Cannot read properties of undefined (reading 'map')" error
  - [x] Add default empty array for toasts prop

- [x] **Dashboard Button Functionality:**
  - [x] Implement "Ver todo" button in DashboardRecentActivity component
  - [x] Implement "Ver todo" button in DashboardTopItems component
  - [x] Implement "Ver inventario" button in DashboardInventoryAlerts component
  - [x] Add proper navigation handlers for all dashboard buttons

- [x] **Employee Table Dark Mode Support:**
  - [x] Add dark mode classes to employee table headers
  - [x] Replace inline backgroundColor with responsive dark/light theme classes
  - [x] Ensure text contrast works in both themes

- [x] **Suppliers Table Fixes:**
  - [x] Apply consistent table header styling to SuppliersPage
  - [x] Add dark mode support to suppliers table headers
  - [x] Reduce table width and improve horizontal scroll

- [x] **Employee Button Functionality:**
  - [x] Implement "Editar" button functionality with edit modal
  - [x] Implement "Ver Actividad" button functionality with activity modal
  - [x] Add proper state management for employee modals

- [x] **Product Dropdown Null Safety:**
  - [x] Fix OrdersAddModal product dropdown with null safety checks
  - [x] Fix QuotesAddModal product dropdown with null safety checks  
  - [x] Fix MaintenancesAddModal client dropdown with null safety checks
  - [x] Add proper handling for empty data arrays

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
- [x] **Fix Chart Dark Theme Support:**
  - [x] Update DashboardChartCard to use CSS variables for colors instead of hardcoded hex values
  - [x] Add proper dark theme colors for chart axes, labels, and gridlines
  - [x] Ensure chart legend text adapts to dark/light theme automatically
  - [x] Test chart readability and contrast in both theme modes
  - [x] Fix chart tooltips and hover states for dark theme compatibility

- [x] **Localize Activity Section (Fix English Words in "Actividad Reciente"):**
  - [x] Replace English status words with Spanish equivalents in `getStatusColorClass`
  - [x] Update status labels: "pending" → "pendiente", "completed" → "completado", "cancelled" → "cancelado"
  - [x] Ensure all activity descriptions use consistent Spanish text
  - [x] Fix mixed language in activity timestamps and descriptions
  - [x] Update activity icons and labels to match Spanish terminology

- [x] **Fix Sales Data Calculations (Remove Hardcoded Values):**
  - [x] Replace hardcoded "+12.5%" in "Ventas Diarias" with actual calculated percentage change
  - [x] Implement real period comparison logic (today vs yesterday, this month vs last month)
  - [x] Add configurable date ranges for sales comparison calculations
  - [x] Calculate actual growth percentage from real sales/invoice data
  - [x] Connect sales metrics to actual database records instead of mock data

- [x] **Improve Dashboard Data Sorting and Friendly Date Display:**
  - [x] Add friendly date sorting for activity section (newest first by default)
  - [x] Implement period-based text changes ("Hoy", "Esta semana", "Este mes") instead of raw dates
  - [x] Add intuitive date filters for activity period selection
  - [x] Sort top items and clients by actual relevance/value from database
  - [x] Add relative time display ("hace 2 horas", "ayer", "la semana pasada")

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
 
-- [x] Fix the notifications always re-appearing after logging in

## Settings Page Issues
- [ ] **Fix Non-Functional Settings Features:**
  - [ ] Add save functionality to Company Information tab - "Guardar Cambios" button has no onClick handler
  - [ ] Implement backend persistence for company data (currently only updates local state)
  - [ ] Add save functionality to System Settings tab - currency, timezone, backup settings just update local state
  - [ ] Implement actual Two-Factor Authentication setup (currently UI only)
  - [ ] Add company logo upload functionality (currently shows placeholder only)
  - [ ] Implement export/import features (buttons exist but no logic)

## Dashboard Data Filtering & User Experience
- [x] **Add Date Range Filter for Dashboard:**
  - [x] Created DashboardDateFilter component with user-friendly date range picker
  - [x] Added presets (Today, Yesterday, Last 7 days, Last 30 days, This month, Last month, etc.)
  - [x] Added custom date range selection functionality
  - [ ] Complete integration with dashboard data calculation logic
  - [ ] Persist user's preferred date range filter across sessions
  - [ ] Update all dashboard components to respect selected date range

## Navigation & Menu Issues
- [x] **Fix Maintenance Tab Submenus:**
  - [x] Fixed MaintenancePage horizontal space issues - added min-width to table columns and overflow-x-auto
  - [x] Fixed SuppliersPage horizontal space issues - added overflow-x-auto and minimum table width
  - [x] Fixed EmployeesPage horizontal space issues - added overflow-x-auto and minimum table width
  - [x] Fixed non-functional "Alertar Empleado" button - now shows proper user feedback and alerts
  - [x] Verified "Ver" and "Editar" buttons are functional - they open maintenance details and edit modals
  - [ ] Consider adding tabs/submenus to MaintenancesPage similar to SettingsPage pattern for better organization

## Critical Bugs
- [x] **Fix OrdersPage.js Error:**
  - [x] Fix "Cannot read properties of undefined (reading 'map')" error at OrdersPage.js:134
  - [x] Added proper null/undefined checks for order.items in handleSelectOrder function
  - [x] Fixed additional map error on line 695 with selectedOrder.items
  - [x] Fixed potential error on line 89 with ordersList.map
  - [x] All map operations now use (array || []).map() pattern for safety

- [x] **Fix "delivered" Status Localization:**
  - [x] Added missing "delivered: 'entregado'" translation to getLocalizedStatus function in helpers.js
  - [x] Fixed "Actividad Reciente" section showing "delivered" instead of "entregado"

- [x] **OrdersAddModal Calculation Issues (August 2025):**
  - [x] Fix total calculation displaying 0 despite having products in order
  - [x] Verify calculateSubtotal, calculateDiscount, calculateTax, and calculateTotal functions are working correctly
  - [x] Debug order items structure and calculation logic in order creation workflow
  - [x] Test order total calculation with different product combinations

- [x] **Button Interaction Issues (August 2025):**
  - [x] Fix Email, Print, and Save buttons in OrdersAddModal - buttons cannot be selected/clicked
  - [x] Investigate potential CSS z-index or event handler conflicts
  - [x] Verify button disabled states and loading states are not preventing interaction
  - [x] Test button functionality across different browsers and screen sizes

- [ ] **Dynamic Inventory Updates for Orders (August 2025):**
  - [ ] Implement automatic inventory quantity reduction when orders are created
  - [ ] Add real-time inventory count updates in InventoryPage when order products are saved
  - [ ] Connect order creation to inventory management system for automatic stock deduction
  - [ ] Add validation to prevent orders when insufficient inventory stock available
  - [ ] Implement inventory alerts when stock levels fall below minimum thresholds due to orders

- [ ] **Employee Activity Hardcoded Data (August 2025):**
  - [ ] Replace hardcoded employee activity data in EmployeesPage.js with dynamic data
  - [ ] Implement real employee activity tracking system
  - [ ] Connect employee activity modal to actual database records
  - [ ] Add proper employee work history, maintenance assignments, and performance metrics

## Missing Features
- [ ] **Email Integration (August 2025):**
  - [ ] Implement real email service integration for order and quote notifications
  - [ ] Replace placeholder sendEmail function in src/utils/emailPrint.js with actual service
  - [ ] Options for email service integration:
    - [ ] EmailJS (client-side email service)
    - [ ] SendGrid API integration
    - [ ] AWS SES (Amazon Simple Email Service)
    - [ ] Custom backend email API endpoint
  - [ ] Add email configuration settings (SMTP settings, API keys, etc.)
  - [ ] Add email templates management system
  - [ ] Add email delivery status tracking and error handling

- [x] **Missing Historial Functions (August 2025):**
  - [x] Implement "Ver Historial" in InventoryPage (now shows mock inventory movement history with proper modal)
  - [x] Implement "Historial de Precios" in ProductsPage (now shows mock price change history with proper modal)
  - [x] Implement "Historial de Compras" in SuppliersPage (now shows mock purchase history with proper modal)
  - [ ] Connect all historial functions to actual database records with proper date filtering

- [x] **Missing QuotesPage Email/Print Functions (August 2025):**
  - [x] Implement "Enviar por Email" button functionality in QuotesPage quote detail view
  - [x] Implement "Imprimir" button functionality in QuotesPage quote detail view
  - [x] Connect to existing sendQuoteEmail and printQuote functions from emailPrint utils
  - [x] Add proper error handling and user feedback for quote email/print operations

- [x] **Missing FinancePage Functions (August 2025):**
  - [x] Implement "Ver" button functionality in FinancePage transactions table
  - [x] Implement "Eliminar" button functionality in FinancePage transactions table
  - [x] Add transaction detail modal for viewing complete transaction information
  - [x] Add confirmation dialog for transaction deletion with proper database operations

- [ ] **Hardcoded Dashboard Charts (August 2025):**
  - [ ] Replace hardcoded salesData in DashboardChartCard with real invoice/order aggregations
  - [ ] Connect chart data to actual database records instead of mock values
  - [ ] Implement dynamic data calculation based on selected date ranges
  - [ ] Add real-time data updates for dashboard metrics and charts

- [ ] **Hardcoded Reports Data (August 2025):**
  - [ ] Replace hardcoded salesData array in ReportsPage with real invoice calculations
  - [ ] Replace hardcoded categoryData with actual product category sales aggregations
  - [ ] Replace mock topProducts calculations with real sales data from database
  - [ ] Replace mock topClients calculations with real purchase data from invoices
  - [ ] Implement dynamic date range filtering for all report calculations
  - [ ] Connect all report metrics to actual database records instead of mock data

- [ ] **Implement "Historial" Feature:**
  - [ ] Design and implement the missing "Historial" functionality across multiple pages
  - [ ] Fix "Historial de Pedidos" in ClientsPage (currently shows alert: "Funcionalidad en desarrollo")
  - [ ] Fix "Historial de Precios" in ProductsPage (currently shows alert: "Funcionalidad pendiente de implementar")  
  - [ ] Fix "Historial de Compras" in SuppliersPage (currently shows alert: "Funcionalidad pendiente de implementar")
  - [ ] Fix "Ver Historial" in InventoryPage (currently shows alert: "Funcionalidad pendiente de implementar")
  - [ ] Implement "Historial de Servicios" in MaintenancesPage (UI exists but no data/functionality)

---

*This file tracks deployment and production tasks to ensure a smooth transition from local development to live system.*
