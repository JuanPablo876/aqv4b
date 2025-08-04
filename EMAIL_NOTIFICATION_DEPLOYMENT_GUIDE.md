# Email Notification System Deployment Guide

## Overview
The email notification system for low stock alerts has been successfully implemented and includes:

- **EmailNotificationService**: Core service for monitoring inventory and sending alerts
- **NotificationSettingsPage**: Admin interface for configuring email notifications
- **useNotifications Hook**: React integration for notification management
- **Supabase Edge Function**: Server-side email sending functionality
- **Dashboard Integration**: Real-time alerts and notification controls

## Files Created/Modified

### Core Services
- `src/services/emailNotificationService.js` - Main notification service
- `src/hooks/useNotifications.js` - React hook for notification management
- `src/components/NotificationSettingsPage.js` - Admin configuration interface
- `src/components/DashboardInventoryAlerts.js` - Enhanced with notification controls

### Supabase Integration
- `supabase/functions/send-low-stock-email/index.ts` - Edge function for email sending

### Dashboard Integration
- `src/Dashboard.jsx` - Added notification page routing and service initialization
- `src/components/LayoutSidebar.js` - Added notifications menu item

## Deployment Steps

### 1. Deploy Supabase Edge Function

```bash
# Navigate to your Supabase project
cd supabase

# Deploy the low stock email function
supabase functions deploy send-low-stock-email

# Set environment variables (required)
supabase secrets set RESEND_API_KEY=your_resend_api_key_here
supabase secrets set FROM_EMAIL=noreply@aqualiquim.com
```

### 2. Configure Email Service

The system is configured to use Resend API for email delivery. You'll need:

1. **Resend API Account**: Sign up at https://resend.com
2. **API Key**: Get your API key from Resend dashboard
3. **Domain Configuration**: Set up your domain for email sending
4. **Environment Variables**: Set in Supabase dashboard

### 3. Configure Default Recipients

By default, the system includes:
- `compras@hotelacapulco.com`
- `admin@aqualiquim.com`

These can be modified in the notification settings page or by editing the service configuration.

## Features

### Automated Monitoring
- ✅ Checks inventory levels every 6 hours (configurable)
- ✅ Identifies products with stock <= minimum stock level
- ✅ Categorizes alerts as 'critical' (no stock) or 'warning' (low stock)
- ✅ Prevents duplicate notifications (max 1 per day per product set)

### Email Notifications
- ✅ Professional HTML email templates
- ✅ Detailed product information with current vs minimum stock
- ✅ Color-coded alerts (critical = red, warning = yellow)
- ✅ Actionable recommendations
- ✅ High priority email headers

### Admin Interface
- ✅ Enable/disable notification system
- ✅ Configure check intervals (1-24 hours)
- ✅ Manage recipient list
- ✅ Test notification functionality
- ✅ View service status and last check time

### Dashboard Integration
- ✅ Real-time low stock alerts display
- ✅ Quick test notification button
- ✅ Manual stock check trigger
- ✅ Service status indicator

## Configuration Options

### Check Intervals
- 1 hour (for critical environments)
- 3 hours (frequent monitoring)
- 6 hours (recommended default)
- 12 hours (standard monitoring)
- 24 hours (daily checks)

### Notification Settings
- **Recipients**: Configurable email list for alerts
- **Enabled**: Toggle to enable/disable the service
- **Check Interval**: How often to monitor inventory
- **Test Mode**: Send test notifications to verify configuration

## Usage Instructions

### For Administrators
1. Navigate to **Notificaciones** in the sidebar
2. Configure recipients by adding email addresses
3. Set appropriate check interval (6 hours recommended)
4. Enable the notification system
5. Test the system using the "Probar Notificación" button

### For Daily Users
1. Check dashboard alerts for current low stock items
2. Use "🔄 Verificar" button to manually check stock levels
3. Use "📧 Probar" button to send test notifications
4. View inventory directly via "Ver inventario" link

## Monitoring and Maintenance

### Service Status
- **Active**: Service is running and checking inventory
- **Inactive**: Service is stopped or disabled
- **Last Check**: Timestamp of most recent inventory verification

### Notification History
- Stored locally for 30 days
- Prevents duplicate notifications
- Tracks sent notifications with timestamps

### Error Handling
- Service continues running if individual checks fail
- Email failures are logged and can be retried
- Local storage fallback for configuration persistence

## Business Benefits

### Inventory Management
- **Prevent Stockouts**: Automated alerts before items run out
- **Reduce Manual Monitoring**: Eliminates need for constant inventory checks
- **Improve Response Time**: Immediate notifications enable faster restocking
- **Business Continuity**: Ensures critical products are always available

### Operational Efficiency
- **24/7 Monitoring**: Works around the clock without human intervention
- **Configurable Alerts**: Customize frequency and recipients based on business needs
- **Professional Communication**: Standardized, detailed email reports
- **Audit Trail**: Complete notification history for compliance

## Troubleshooting

### Common Issues

1. **Emails Not Sending**
   - Check Resend API key configuration
   - Verify FROM_EMAIL domain is verified
   - Check Supabase function logs

2. **No Stock Alerts**
   - Verify minimum stock levels are set on products
   - Check inventory data is up to date
   - Ensure service is enabled and running

3. **Service Not Starting**
   - Check browser console for JavaScript errors
   - Verify all imports are correctly resolved
   - Check localStorage permissions

### Support
- Check browser console for error messages
- Verify network connectivity to Supabase
- Review notification history for delivery confirmation
- Test with manual "Probar Notificación" function

## Next Steps

The email notification system is now fully functional and ready for production use. Consider:

1. **Setting up monitoring**: Add alerts for the notification service itself
2. **Custom templates**: Modify email templates for branding
3. **Integration expansion**: Add notifications for other business events
4. **Mobile notifications**: Consider push notifications for mobile devices
5. **Analytics**: Track notification effectiveness and response times

---

**Status**: ✅ COMPLETE - Email notification system fully implemented and ready for use.
