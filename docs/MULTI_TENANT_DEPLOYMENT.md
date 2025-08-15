# Smart-Kollect Multi-Tenant Deployment Guide

## Overview
This guide provides step-by-step instructions for deploying the multi-tenant Smart-Kollect system with subdomain-based tenant isolation.

## Current Tenants
- **Mahikeng Local Municipality**: `mahikeng.smartkollect.co.za`
- **Triple M Financial Services**: `triplem.smartkollect.co.za`

## Prerequisites
- Vercel account with project deployed
- Access to Absolute Hosting DNS management
- Supabase project with admin access
- Environment variables configured

## Step 1: Apply Database Migration

1. Connect to your Supabase project dashboard
2. Navigate to SQL Editor
3. Copy and run the migration script from `scripts/multi-tenant-migration.sql`
4. Verify the migration:
   ```sql
   -- Check tenants table
   SELECT * FROM tenants;
   
   -- Verify tenant_id columns exist
   SELECT column_name 
   FROM information_schema.columns 
   WHERE table_schema = 'public' 
   AND column_name = 'tenant_id';
   ```

## Step 2: Configure Environment Variables

Ensure these environment variables are set in Vercel:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

## Step 3: Configure DNS (Absolute Hosting)

1. Log into your Absolute Hosting control panel
2. Navigate to DNS Management for `smartkollect.co.za`
3. Add the following CNAME records:

```
mahikeng.smartkollect.co.za    CNAME    cname.vercel-dns.com.
triplem.smartkollect.co.za     CNAME    cname.vercel-dns.com.
*.smartkollect.co.za            CNAME    cname.vercel-dns.com.
```

**Note**: The wildcard record (`*.smartkollect.co.za`) allows for future tenants without DNS changes.

## Step 4: Configure Vercel Domains

1. Go to your Vercel project dashboard
2. Navigate to Settings → Domains
3. Add the following domains:
   - `smartkollect.co.za` (main domain)
   - `mahikeng.smartkollect.co.za`
   - `triplem.smartkollect.co.za`
   - `*.smartkollect.co.za` (wildcard for future tenants)

4. Vercel will automatically provision SSL certificates for each domain

## Step 5: Deploy the Application

1. Push your code to the repository:
   ```bash
   git add .
   git commit -m "Add multi-tenant support with Triple M tenant"
   git push origin main
   ```

2. Vercel will automatically deploy the changes

## Step 6: Create Users for Triple M Tenant

1. Access the Supabase dashboard
2. Navigate to Authentication → Users
3. Create 10 users for Triple M with the following SQL:

```sql
-- First, get the Triple M tenant ID
SELECT id FROM tenants WHERE subdomain = 'triplem';

-- Create users (replace tenant_id with actual ID from above)
-- Example for creating users via Supabase Auth Admin API or Dashboard
-- Each user needs:
-- 1. Email/password created in Auth
-- 2. Profile record with tenant_id

-- After creating auth users, link them to Triple M tenant:
INSERT INTO profiles (id, email, full_name, tenant_id, role)
VALUES 
  ('user_id_1', 'agent1@triplem.co.za', 'Agent One', 'triplem_tenant_id', 'agent'),
  ('user_id_2', 'agent2@triplem.co.za', 'Agent Two', 'triplem_tenant_id', 'agent'),
  -- ... add more users
  ('user_id_10', 'admin@triplem.co.za', 'Admin User', 'triplem_tenant_id', 'admin');
```

## Step 7: Test the Multi-Tenant Setup

### Test Tenant Isolation
1. Visit `https://mahikeng.smartkollect.co.za`
   - Login with a Mahikeng user
   - Verify you can only see Mahikeng data

2. Visit `https://triplem.smartkollect.co.za`
   - Login with a Triple M user
   - Verify you can only see Triple M data

3. Try cross-tenant access:
   - Login to Mahikeng subdomain with Triple M user
   - Should redirect to correct tenant subdomain

### Test Admin Functions
1. Access `/admin/tenants` as an admin user
2. Verify you can see both tenants
3. Test creating a new test tenant
4. Test editing tenant status

### Test Main Domain
1. Visit `https://smartkollect.co.za`
2. Verify the landing page loads
3. Check that both client cards are displayed
4. Test the "Visit Portal" links

## Step 8: Monitor and Troubleshoot

### Check Logs
```bash
# View Vercel function logs
vercel logs --follow

# Check Supabase logs for RLS violations
# Go to Supabase Dashboard → Logs → Postgres
```

### Common Issues and Solutions

1. **Subdomain not routing correctly**
   - Verify DNS records have propagated (can take up to 48 hours)
   - Check Vercel domain configuration
   - Test with `nslookup subdomain.smartkollect.co.za`

2. **User can't login to tenant**
   - Verify user's `tenant_id` in profiles table
   - Check middleware logs for tenant validation errors
   - Ensure RLS policies are enabled

3. **Data isolation not working**
   - Verify RLS policies are active: `SELECT * FROM pg_policies;`
   - Check that `tenant_id` is set on all records
   - Test `get_current_tenant_id()` function

4. **Performance issues**
   - Ensure indexes exist on `tenant_id` columns
   - Monitor query performance in Supabase dashboard
   - Consider connection pooling for high traffic

## Step 9: Production Checklist

- [ ] Database migration applied successfully
- [ ] All environment variables configured
- [ ] DNS records configured and propagated
- [ ] Vercel domains configured with SSL
- [ ] Triple M users created and tested
- [ ] Tenant isolation verified
- [ ] Admin panel accessible and functional
- [ ] Landing page shows both tenants
- [ ] Monitoring and logging configured
- [ ] Backup strategy in place

## Future Tenant Onboarding

To add a new tenant:

1. Use the Admin Panel (`/admin/tenants`) to create the tenant
2. Add DNS record: `newtenant.smartkollect.co.za CNAME cname.vercel-dns.com.`
3. Add domain in Vercel: `newtenant.smartkollect.co.za`
4. Create users for the new tenant
5. Test access and isolation

## Security Considerations

1. **RLS Policies**: Always active, enforcing tenant isolation at database level
2. **Middleware**: Validates tenant membership before allowing access
3. **Service Role Key**: Only used server-side, never exposed to client
4. **Tenant Context**: Set via secure RPC functions
5. **Cross-tenant Access**: Prevented by middleware redirects

## Support and Maintenance

- Monitor tenant usage and performance regularly
- Review RLS policy violations in logs
- Keep tenant status updated (active/inactive/suspended)
- Regular backups of tenant data
- Document any custom tenant configurations

## Contact Information

For issues or questions regarding the multi-tenant setup:
- Technical Support: [your-email]
- DNS/Hosting: Absolute Hosting Support
- Database: Supabase Support
- Deployment: Vercel Support

---

Last Updated: [Current Date]
Version: 1.0.0
