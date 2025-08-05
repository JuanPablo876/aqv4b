# Vercel Deployment Configuration for RBAC System

## Environment Variables Required for Vercel

Add these environment variables in your Vercel project settings:

### Required Supabase Variables
```
REACT_APP_SUPABASE_URL=your_supabase_project_url
REACT_APP_SUPABASE_ANON_KEY=your_supabase_anon_key
```

### Optional but Recommended
```
NODE_ENV=production
REACT_APP_APP_URL=https://your-vercel-app.vercel.app
```

## Vercel Deployment Steps

1. **Set Environment Variables**
   - Go to your Vercel project dashboard
   - Navigate to Settings > Environment Variables
   - Add the required variables above

2. **Database Setup**
   - Ensure your Supabase database has the RBAC tables created
   - Run the SQL scripts in the `database/` folder
   - Verify test@example.com has admin role assigned

3. **Build Configuration**
   - Vercel should auto-detect React and configure correctly
   - If needed, set build command: `npm run build`
   - Set output directory: `build`

## Troubleshooting Common Issues

### Issue 1: RBAC Not Working on Vercel
**Symptoms:** Reports page shows "Access Restricted" message
**Solution:** 
- Check environment variables are set correctly
- Verify Supabase connection in production
- Check browser console for RBAC errors

### Issue 2: Database Connection Issues
**Symptoms:** Console shows "Supabase client not available"
**Solution:**
- Verify REACT_APP_SUPABASE_URL and REACT_APP_SUPABASE_ANON_KEY
- Check if your Supabase project is active
- Ensure RLS policies allow the operations

### Issue 3: User Roles Not Loading
**Symptoms:** User shows as having no roles
**Solution:**
- Verify RBAC tables exist in Supabase
- Check that test@example.com is assigned to admin role
- Review RLS policies for user_roles table

## Debug Commands for Supabase SQL Editor

```sql
-- Check if tables exist
SELECT tablename FROM pg_tables WHERE schemaname = 'public' AND tablename LIKE '%role%';

-- Check admin user assignment
SELECT u.email, r.name as role, ur.is_active
FROM auth.users u
JOIN user_roles ur ON u.id = ur.user_id
JOIN roles r ON ur.role_id = r.id
WHERE u.email = 'test@example.com';

-- Check admin permissions
SELECT p.name, p.resource, p.action
FROM roles r
JOIN role_permissions rp ON r.id = rp.role_id
JOIN permissions p ON rp.permission_id = p.id
WHERE r.name = 'admin' AND p.name = 'view_reports';
```

## Production Checklist

- [ ] Environment variables set in Vercel
- [ ] RBAC tables created in Supabase
- [ ] Admin user assigned to admin role
- [ ] RLS policies configured correctly
- [ ] Test deployment with debug page
- [ ] Verify reports access works

## Debug URL for Production

After deployment, you can access the debug page at:
`https://your-app.vercel.app/?page=rbacdebug`

This will show you exactly what's happening with RBAC in production.
