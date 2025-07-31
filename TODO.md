# TODO: Deployment and Production Checklist

- [ ] Update all references of `localhost:3000` to `aqualiquim.mx` in Supabase Edge Function environment variables and API URLs
- [ ] Verify custom domain (aqualiquim.mx) in Resend and update `from` address in Edge Function to use your domain
- [ ] Update `APP_URL` environment variable in Supabase to `https://aqualiquim.mx`
- [ ] Test email delivery to external addresses after domain verification
- [ ] Remove any test/fallback logic from invitationService and Edge Function for production
- [ ] Review and update CORS settings for production domain
- [ ] Add production secrets and API keys to Supabase environment variables
- [ ] Update documentation to reflect production URLs and settings

---

*This file tracks deployment and production tasks to ensure a smooth transition from local development to live system.*
