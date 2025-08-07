# 🛠️ Admin Access Troubleshooting Guide

## 🚨 **Common Admin Access Issues & Solutions**

### **Problem**: "I sometimes have restricted access as admin"

This issue typically occurs due to one or more of the following:

## 🔍 **Immediate Diagnostics**

### **Step 1: Open Browser Console**
Press `F12` → Console tab, then run:

```javascript
// Quick diagnostic check
window.rbacDebugger.runDiagnostics();
```

### **Step 2: Try Quick Fix**
```javascript
// Attempt automatic recovery
window.rbacDebugger.quickFix();
```

## 🎯 **Common Root Causes**

### **1. Authentication Session Issues**
- **Symptoms**: User is logged in but permissions don't load
- **Cause**: Stale or corrupted auth tokens
- **Solution**: 
```javascript
// Force auth refresh
authManager.refresh();
// Or manual refresh
window.location.reload();
```

### **2. User Not in Database Tables**
- **Symptoms**: User can login but has no roles/permissions
- **Cause**: User exists in Supabase Auth but not in your users/employees table
- **Solution**: Check if user exists in database:
```javascript
// Check user existence
window.rbacDebugger.runDiagnostics().then(r => console.log(r.checks.userExists));
```

### **3. No Role Assignments**
- **Symptoms**: User exists but has no admin role
- **Cause**: Admin role not assigned to user
- **Solution**: 
```javascript
// Check role assignments
window.rbacDebugger.runDiagnostics().then(r => console.log(r.checks.roleAssignments));
```

### **4. RLS (Row Level Security) Blocking Access**
- **Symptoms**: Database queries fail or return empty results
- **Cause**: Supabase RLS policies are too restrictive
- **Solution**: Check RLS policies in Supabase dashboard

### **5. Cache Issues with New AuthManager**
- **Symptoms**: Permissions work sometimes but not others
- **Cause**: Auth cache not updating properly
- **Solution**: Clear auth cache:
```javascript
authManager.resetCache();
authManager.refresh();
```

## 🔧 **Step-by-Step Troubleshooting**

### **Level 1: Quick Fixes**

#### **1. Refresh Everything**
```javascript
// Clear all caches and refresh
localStorage.clear();
sessionStorage.clear();
window.location.reload();
```

#### **2. Force RBAC Re-initialization**
```javascript
// Re-initialize RBAC system
import rbacService from './src/services/rbacService.js';
rbacService.resetRBAC();
rbacService.initialize();
```

### **Level 2: Detailed Diagnosis**

#### **1. Check Current Auth State**
```javascript
// Check authentication status
console.log('Auth State:', {
  isAuthenticated: authManager.isAuthenticated(),
  currentUser: authManager.getCurrentUser(),
  cacheValid: authManager.isCacheValid(),
  session: authManager.getCurrentSession()
});
```

#### **2. Check RBAC State**
```javascript
// Check RBAC status
console.log('RBAC State:', {
  initialized: rbacService.initialized,
  userRoles: rbacService.userRoles,
  permissions: rbacService.userPermissions,
  hasAdminAccess: rbacService.hasPermission('admin')
});
```

### **Level 3: Database Verification**

#### **1. Verify User in Database**
```javascript
// Check if user exists in database
supabase.from('users').select('*').eq('email', 'your-email@domain.com').then(console.log);
```

#### **2. Check Role Assignments**
```javascript
// Check user roles (replace USER_ID with actual ID)
supabase.from('user_roles').select('*, role:roles(*)').eq('user_id', 'USER_ID').then(console.log);
```

#### **3. Verify Admin Role Exists**
```javascript
// Check if admin role exists
supabase.from('roles').select('*').eq('name', 'admin').then(console.log);
```

## 🚨 **Emergency Recovery**

### **If All Else Fails**

#### **1. Emergency Admin Assignment**
```javascript
// ⚠️ Use carefully - assigns admin role to current user
window.rbacDebugger.emergencyAdminAssignment('your-email@domain.com');
```

#### **2. Bypass RBAC (Development Only)**
```javascript
// ⚠️ DEVELOPMENT ONLY - Temporarily bypass RBAC
localStorage.setItem('RBAC_BYPASS_DEV', 'true');
window.location.reload();
```

#### **3. Database Direct Fix**
Go to Supabase Dashboard → SQL Editor:

```sql
-- Find your user ID
SELECT id, email FROM auth.users WHERE email = 'your-email@domain.com';

-- Check if admin role exists
SELECT * FROM roles WHERE name = 'admin';

-- Assign admin role (replace USER_ID and ROLE_ID)
INSERT INTO user_roles (user_id, role_id, is_active) 
VALUES ('USER_ID', 'ROLE_ID', true);
```

## 📊 **Performance Monitoring**

### **Check Auth Performance**
```javascript
// View auth performance metrics
window.authPerformanceMonitor.generateReport();
```

### **Monitor RBAC Calls**
```javascript
// Enable detailed RBAC logging
localStorage.setItem('RBAC_DEBUG', 'true');
window.location.reload();
```

## 🔍 **Prevention Tips**

### **1. Regular Diagnostics**
Run diagnostics weekly:
```javascript
// Add to bookmarks for quick access
javascript:window.rbacDebugger.runDiagnostics();
```

### **2. Monitor Console Logs**
Watch for these warning signs:
- "No roles found for user"
- "RBAC not initialized"
- "Error loading user roles"
- "Database tables might not exist"

### **3. Test After Deployments**
Always test admin functions after:
- Database schema changes
- RLS policy updates
- Authentication changes
- Role/permission modifications

## 🆘 **When to Seek Help**

Contact support if:
- Emergency recovery doesn't work
- Database appears corrupted
- Multiple users affected
- Diagnostics show database connectivity issues

## 📋 **Common Console Commands Reference**

```javascript
// Quick diagnostic
window.rbacDebugger.runDiagnostics();

// Quick fix attempt
window.rbacDebugger.quickFix();

// Check auth state
authManager.getCurrentUser();

// Force refresh everything
authManager.refresh();

// Check RBAC permissions
rbacService.hasPermission('admin');

// View performance stats
window.authPerformanceMonitor.getMetrics();

// Emergency admin assignment
window.rbacDebugger.emergencyAdminAssignment('your-email@domain.com');
```

---

**Remember**: Most admin access issues are resolved by refreshing authentication and RBAC state. The new AuthManager system should prevent most caching-related issues.
