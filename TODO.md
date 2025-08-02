# TODO: Deployment and Production Checklist

## Critical Bug Fixes

- [ ] **Data Type Consistency & Logic Review (August 2025) - CRITICAL:**
  - [ ] **Fix ID parsing inconsistencies across the application:**
    - [ ] Product IDs are stored as strings but parsed as integers causing lookup failures
    - [ ] Client IDs have similar string/integer conversion issues
    - [ ] Standardize ID handling throughout the application (use consistent data types)
    - [ ] Review all getProductDetails, getClientDetails, and similar functions for proper ID matching
  - [ ] **Comprehensive logic review needed:**
    - [ ] Multiple components have logic inconsistencies and data type mismatches
    - [ ] Form validation logic needs standardization across modals
    - [ ] State management patterns need consistency review
    - [ ] Error handling needs improvement throughout the application
  - [ ] **Common ID/data issues to fix:**
    - [ ] QuotesAddModal: ✅ FIXED - Product ID string/integer mismatch
    - [ ] OrdersEditModal: Has parseInt(productId) issues - needs robust ID matching like OrdersAddModal
    - [ ] MaintenancesAddModal: Has parseInt(clientId) issues - needs robust ID matching
    - [ ] FinanceAddInvoiceModal: Has parseInt(clientId) issues - needs robust ID matching
    - [ ] OrdersPage: Has parseInt(item.productId) issues in multiple places
    - [ ] All modals: Review and standardize getProductDetails/getClientDetails functions
    - [ ] Database query results may return different ID types than expected
    - [ ] Frontend state management not handling ID types consistently

- [ ] **Button Handler Audit & Fixes (August 2025) - CRITICAL:**
  - [ ] **Complete application-wide audit for missing/invalid button handlers**
  - [ ] **Systematic check of all interactive elements requiring the following fixes:**
    - [ ] Add `e.preventDefault()` to all event handlers that should prevent form submission
    - [ ] Add `type="button"` attribute to all non-submit buttons
    - [ ] Ensure all buttons have proper onClick handlers (no undefined/missing handlers)
    - [ ] Verify all form submissions use proper validation before processing
  
  - [ ] **Pages requiring button handler audit (check ALL buttons/forms):**
    - [ ] **AcceptInvitationPage.jsx** - Check form submissions and button handlers
    - [ ] **ClientsPage.js** - Audit add/edit/save client buttons and inline forms
    - [ ] **EmployeesPage.js** - Check employee management buttons and modal forms
    - [ ] **FinancePage.js** - Audit transaction buttons, invoice forms, export functions
    - [ ] **InventoryPage.js** - Check movement buttons, adjustment forms, ordering systems
    - [ ] **MaintenancesPage.js** - Audit maintenance forms, scheduling buttons, service actions
    - [ ] **OrdersPage.js** - Check order creation, editing, status update buttons
    - [ ] **ProductsPage.js** - Audit product management forms and action buttons
    - [ ] **QuotesPage.js** - Check quote creation, editing, conversion buttons
    - [ ] **ReportsPage.js** - Audit export buttons, filter forms, report generation
    - [ ] **SuppliersPage.js** - Check supplier management and purchasing buttons
    - [ ] **UserProfilePage.js** - Audit profile editing and password change forms
    - [ ] **DashboardPage.js** - Check any interactive dashboard elements
    - [ ] **SettingsPage.js** - Audit all settings form submissions and save buttons
    - [ ] **PWATestPage.jsx** - Check PWA testing buttons and forms
    - [ ] **NotFoundPage.jsx** - Check navigation buttons
  
  - [ ] **Modal Components requiring audit:**
    - [ ] **ClientAddModal.js** - Already uses ValidatedForm (likely OK)
    - [ ] **FinanceAddInvoiceModal.js** - ✅ FIXED: Added preventDefault and type="button"
    - [ ] **InventoryMovementModal.js** - ✅ FIXED: Added preventDefault and type="button"
    - [ ] **MaintenancesAddModal.js** - ✅ FIXED: Added preventDefault and type="button"
    - [ ] **OrdersAddModal.js** - Check against working OrdersAddModal pattern
    - [ ] **OrdersEditModal.js** - ✅ FIXED: Added preventDefault and type="button"
    - [ ] **ProductsAddModal.js** - Already uses ValidatedForm (likely OK)
    - [ ] **QuotesAddModal.js** - ✅ FIXED: Added preventDefault and type="button"
    - [ ] **HistoryModal.js** - Check any action buttons within history views
  
  - [ ] **Utility Components requiring audit:**
    - [ ] **NotificationCenter.jsx** - Check notification action buttons
    - [ ] **NotificationDropdown.jsx** - Check notification management buttons
    - [ ] **InvitationManagement.jsx** - Check invitation sending/management buttons
    - [ ] **PWAStatus.jsx** - Check PWA-related action buttons
    - [ ] **DatabaseTest.js** - Check database testing buttons
    - [ ] **ScrollableTable.jsx** - Check any table action buttons
  
  - [ ] **Common button issues to look for:**
    - [ ] Buttons inside forms without `type="button"` (defaults to submit)
    - [ ] Event handlers missing `e.preventDefault()` for non-form-submission actions
    - [ ] Missing onClick handlers (buttons that do nothing when clicked)
    - [ ] Form submission buttons that should validate before submitting
    - [ ] Delete/destructive actions without confirmation dialogs
    - [ ] Disabled buttons that should show loading states
    - [ ] Save/submit buttons without proper error handling

## Dashboard Issues
- [ ] **Dashboard Dynamic Data Integration (August 2025):**
  - [ ] Replace all hardcoded dashboard metrics with real database calculations
  - [ ] Implement dynamic data loading for all dashboard components (stats cards, charts, activity feed)
  - [ ] Connect dashboard graphs to actual sales, inventory, and financial data from database
  - [ ] Add real-time data refresh capabilities for dashboard metrics
  - [ ] Implement proper loading states and error handling for dashboard data fetching
  - [ ] Add data caching and optimization for dashboard performance

- [ ] **Notifications System Data Integration (August 2025):**
  - [ ] Replace mock notification data with actual system events and alerts
  - [ ] Implement real-time notifications for order status changes, low inventory, payment reminders
  - [ ] Connect notification system to actual business events (new orders, maintenance due, client interactions)
  - [ ] Add notification preferences and filtering options for users
  - [ ] Implement notification history and mark-as-read functionality with database persistence
  - [ ] Add email/SMS notification delivery options for critical alerts

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
- [ ] Clean up any remaining console.log statements in production code
- [ ] Remove any test/debug routes or components for production build

## Settings Page Issues
- [ ] **Fix Non-Functional Settings Features:**
  - [ ] Add save functionality to Company Information tab - "Guardar Cambios" button has no onClick handler
  - [ ] Implement backend persistence for company data (currently only updates local state)
  - [ ] Add save functionality to System Settings tab - currency, timezone, backup settings just update local state
  - [ ] Implement actual Two-Factor Authentication setup (currently UI only)
  - [ ] Add company logo upload functionality (currently shows placeholder only)
  - [ ] Implement export/import features (buttons exist but no logic)

## Dashboard Data Filtering & User Experience
- [ ] **Complete Date Range Filter Integration:**
  - [ ] Complete integration with dashboard data calculation logic
  - [ ] Persist user's preferred date range filter across sessions
  - [ ] Update all dashboard components to respect selected date range

## Navigation & Menu Issues
- [ ] Consider adding tabs/submenus to MaintenancesPage similar to SettingsPage pattern for better organization

## Critical Bugs
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

- [ ] **Missing Historial Functions (August 2025):**
  - [ ] **InventoryPage "Ver Historial"** - Currently shows mock data, needs real database integration
  - [ ] **ProductsPage "Historial de Precios"** - Currently shows mock data, needs real database integration  
  - [ ] **SuppliersPage "Historial de Compras"** - Currently shows mock data, needs real database integration
  - [ ] **ClientsPage "Historial de Pedidos"** - Currently shows alert: "Funcionalidad en desarrollo"
  - [ ] **MaintenancesPage "Historial de Servicios"** - UI exists but no data/functionality
  - [ ] Connect all historial functions to actual database records with proper date filtering
  - [ ] Design and implement proper data models for historical tracking across all modules

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

- [ ] **Additional Hardcoded Data Replacements (August 2025):**
  - [ ] **FinancePage (Finanzas) Real Data Integration:**
    - [ ] Replace mock financial transaction data with actual database records
    - [ ] Connect invoice payments, expenses, and revenue to real financial data
    - [ ] Implement actual cash flow calculations and financial summaries
    - [ ] Add real bank account balances and transaction history
    - [ ] Connect payment status updates to actual payment processing
  
  - [ ] **ReportsPage (Reportes) Complete Data Integration:**
    - [ ] Replace all mock sales reports with real invoice/order data calculations
    - [ ] Implement actual profit/loss calculations from real financial data
    - [ ] Connect inventory reports to real stock levels and movements
    - [ ] Add real client performance metrics and purchase history analysis
    - [ ] Implement actual expense tracking and cost analysis reports
    - [ ] Add real maintenance cost reporting and equipment performance metrics
  
  - [ ] **Client Performance Metrics:**
    - [ ] Replace hardcoded client statistics in ClientsPage with real purchase data
    - [ ] Implement actual client lifetime value calculations
    - [ ] Add real client payment history and credit status
    - [ ] Connect client activity timeline to actual business interactions
  
  - [ ] **Supplier Performance Data:**
    - [ ] Replace mock supplier statistics with real purchase order data
    - [ ] Implement actual supplier performance metrics (delivery times, quality, pricing)
    - [ ] Add real supplier payment history and credit terms tracking
    - [ ] Connect supplier evaluations to actual business performance data
  
  - [ ] **Employee Performance Tracking:**
    - [ ] Replace hardcoded employee metrics with real work assignment data
    - [ ] Implement actual employee productivity tracking and performance analytics
    - [ ] Add real employee work history, maintenance assignments, and client interactions
    - [ ] Connect employee scheduling and time tracking to actual business operations

## Essential Features for Production
- [ ] **Role-Based Access Control (RBAC) - Critical for Security:**
  - [ ] Create roles table in database (admin, manager, staff, viewer)
  - [ ] Implement user role assignment and permission checking
  - [ ] Add role-based UI restrictions and route protection
  - [ ] Create admin interface for managing user roles and permissions

- [ ] **Audit Logs - Essential for Business Compliance:**
  - [ ] Implement audit logging system for all CRUD operations
  - [ ] Track user actions with timestamps and change details
  - [ ] Create audit log viewer for administrators
  - [ ] Add soft delete functionality with audit trail

- [ ] **Email Notifications - Critical for Business Operations:**
  - [ ] Implement automated email alerts for low inventory levels
  - [ ] Add order status change notifications to clients and staff
  - [ ] Set up payment reminder emails for overdue invoices
  - [ ] Create system alerts for failed logins and security events

- [ ] **Search Across Modules - Essential for Productivity:**
  - [ ] Implement global search functionality across all modules
  - [ ] Add search filters for inventory, orders, clients, and invoices
  - [ ] Create quick search with autocomplete functionality
  - [ ] Add advanced search with multiple criteria filtering

- [ ] **Responsive Design Fixes - Critical for Usability:**
  - [ ] Optimize layouts for tablet devices (768px-1024px)
  - [ ] Improve mobile responsiveness for all forms and modals
  - [ ] Fix table scrolling and column visibility on smaller screens
  - [ ] Test and optimize touch interactions for mobile devices
  - [ ] Re-test responsive design after recent table infrastructure changes

- [ ] **Pagination & Lazy Loading - Essential for Performance:**
  - [ ] Implement pagination for large datasets in all tables
  - [ ] Add lazy loading for improved performance with large client lists
  - [ ] Optimize product and inventory loading for better user experience
  - [ ] Add virtual scrolling for very large datasets

## Optional Enhancement Features
- [ ] **Custom Reports Generator:**
  - [ ] Create drag-and-drop report builder interface
  - [ ] Add customizable report templates for common business needs
  - [ ] Implement report scheduling and automated email delivery
  - [ ] Add export options (PDF, Excel, CSV) for generated reports

- [ ] **Data Archiving System:**
  - [ ] Implement archive functionality for old clients, orders, and inventory
  - [ ] Create archive management interface with restore capabilities
  - [ ] Add configurable auto-archiving rules based on date/activity
  - [ ] Maintain archived data access for reporting and compliance

- [ ] **Client & Supplier Tags:**
  - [ ] Add tagging system for clients (VIP, Regular, High-Risk, etc.)
  - [ ] Implement supplier tags (Preferred, Backup, Low-Stock, etc.)
  - [ ] Create filterable views based on tags
  - [ ] Add bulk tagging operations for efficient management

- [ ] **Bulk Import/Export (CSV/Excel):**
  - [ ] Create bulk import functionality for clients, products, and inventory
  - [ ] Add data validation and error reporting for bulk operations
  - [ ] Implement export functionality for all major data types
  - [ ] Add import templates and data mapping tools

- [ ] **Draggable Lists & Reordering UI:**
  - [ ] Implement drag-and-drop for order item reordering
  - [ ] Add draggable priority sorting for maintenance tasks
  - [ ] Create reorderable supplier preference lists
  - [ ] Add drag-and-drop file uploads for documents

- [ ] **Custom Themes:**
  - [ ] Create 2-3 additional theme options (Light, Dark, High Contrast)
  - [ ] Add user preference storage for theme selection
  - [ ] Implement theme switcher in user settings
  - [ ] Ensure all custom themes maintain accessibility standards

- [ ] **Data Previews & Tooltips:**
  - [ ] Add hover previews for order summaries in lists
  - [ ] Implement tooltip previews for client and supplier details
  - [ ] Create inventory item quick-view on hover
  - [ ] Add contextual help tooltips for form fields and actions

- [ ] **Contextual Help System:**
  - [ ] Create interactive onboarding tour for new users
  - [ ] Add help tooltips and hints throughout the application
  - [ ] Implement context-sensitive help panels
  - [ ] Create help documentation integration within the app

---

*This file tracks deployment and production tasks to ensure a smooth transition from local development to live system.*
