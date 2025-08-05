# TODO: Development and Production Tasks
## 🔥 ACTIVE DEVELOPMENT TASKS

### Database Setup (Immediate Priority)
- [x] Fix RLS infinite recursion issues in user_roles policies ✅
- [x] Add missing is_active and assigned_at columns to RBAC tables ✅
- [x] Update rbacService.js to properly load permissions from database ✅
- [x] Ensure test@example.com has admin role and full permissions ✅
- [x] Fix pink color appearance in dark mode for primary elements ✅

## 🚀 MAJOR FEATURES FOR PRODUCTION

### Essential Security & Compliance
- [ ] **Security Hardening**
  - [ ] Add comprehensive audit logging for all user actions
  - [ ] Set up security monitoring and alerts
  - [ ] Add soft delete functionality with audit trail

### Critical Business Operations
  - [x] Implement automated email alerts for low inventory levels ✅
  - [x] Add order status change notifications to clients and staff ✅
  - [x] Set up payment reminder emails for overdue invoices ✅
  - [ ] Create system alerts for failed logins and security events

## 🌟 OPTIONAL ENHANCEMENT FEATURES

### Advanced Functionality
- [ ] **Custom Reports Generator**
  - [ ] Add export options (PDF, Excel, CSV) for generated reports

- [ ] **Data Archiving System**
  - [ ] Implement archive functionality for old clients, orders, and inventory
  - [ ] Create archive management interface with restore capabilities
  - [ ] Add configurable auto-archiving rules based on date/activity
  - [ ] Maintain archived data access for reporting and compliance

## 🚢 DEPLOYMENT TASKS

### Production Configuration
- [ ] Update all references of `localhost:3000` to `aqualiquim.mx` in Supabase Edge Function environment variables and API URLs
- [ ] Verify custom domain (aqualiquim.mx) in Resend and update `from` address in Edge Function to use your domain
- [ ] Update `APP_URL` environment variable in Supabase to `https://aqualiquim.mx`
- [ ] Test email delivery to external addresses after domain verification
- [ ] Review and update CORS settings for production domain
- [ ] Add production secrets and API keys to Supabase environment variables

### Code Cleanup
- [x] Clean up any remaining console.log statements in production code ✅
- [x] Remove any test/debug routes or components for production build ✅
- [ ] Remove any test/fallback logic from invitationService and Edge Function for production

## 📧 DEFERRED: EMAIL INTEGRATION

- [ ] Implement Resend email service integration for order and quote notifications
- [ ] Replace placeholder sendEmail function in src/utils/emailPrint.js with Resend service
- [ ] Install and configure Resend API client
- [ ] Set up Resend API keys in environment configuration  
- [ ] Implement Resend email templates for quotes and orders
- [ ] Add Resend email delivery status tracking and error handling

---

