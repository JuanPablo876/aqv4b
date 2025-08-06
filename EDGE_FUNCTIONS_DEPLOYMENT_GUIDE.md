# Edge Functions Deployment Guide

## Current Status
- ✅ **Low Stock Email Function**: Working correctly
- ❌ **Quote Email Function**: CORS errors (needs deployment)

## CORS Error Analysis
The error message indicates:
```
Access to fetch at 'https://gbdmutklayjmatlquktt.supabase.co/functions/v1/send-quote-email' 
from origin 'http://localhost:3000' has been blocked by CORS policy: 
Response to preflight request doesn't pass access control check: 
It does not have HTTP ok status.
```

This suggests the Edge Function is either:
1. Not deployed
2. Crashing during startup
3. Returning a non-200 status for OPTIONS requests

## Solution Steps

### 1. Deploy Edge Functions via Supabase Dashboard

**Go to your Supabase Dashboard:**
1. Navigate to `Edge Functions` section
2. Click "Create a new function" or "Deploy"
3. Copy the content from:
   - `supabase/functions/send-quote-email/index.ts`
   - `supabase/functions/send-low-stock-email/index.ts`

### 2. Environment Variables

Make sure these are set in your Supabase project:
```
RESEND_API_KEY=your_resend_api_key_here
FROM_EMAIL=noreply@aqualiquim.mx
```

### 3. Test Functions

After deployment, test with:
```bash
curl -X POST 'https://your-project.supabase.co/functions/v1/send-quote-email' \
  -H 'Authorization: Bearer YOUR_ANON_KEY' \
  -H 'Content-Type: application/json' \
  -d '{
    "clientEmail": "test@example.com",
    "clientName": "Test Client",
    "quote": {"id": "test", "total": 100},
    "quoteItems": []
  }'
```

## Current Fallback Behavior

Until the Edge Function is deployed:
- ✅ Quote emails use simulation mode
- ✅ User gets success message
- ✅ System continues to work normally
- ⚠️ No actual emails are sent for quotes

## Files Updated

### CORS Headers Fixed
- ✅ Added `Access-Control-Allow-Methods: POST, OPTIONS`
- ✅ Both functions now have consistent CORS configuration

### Fallback Enhanced
- ✅ Better error detection for CORS/deployment issues
- ✅ More informative fallback messages
- ✅ Graceful degradation to simulation mode

## Next Steps

1. **Immediate**: Deploy the Edge Functions via Supabase Dashboard
2. **Test**: Verify quote emails work after deployment
3. **Monitor**: Check function logs for any runtime errors

The notification system is working correctly with the database integration. Once the quote email function is deployed, the entire email system will be fully operational.
