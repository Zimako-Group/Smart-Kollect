# Subdomain Setup Guide for Smart-Kollect

This guide explains how to properly configure subdomains like `mahikeng.smartkollect.co.za` to work with your Smart-Kollect application.

## Prerequisites

1. **Domain Ownership**: You must own `smartkollect.co.za` and have access to DNS management
2. **Deployment Platform**: Your app must be deployed to a platform that supports custom domains and subdomains
3. **SSL Certificates**: Wildcard SSL certificate for `*.smartkollect.co.za`

## DNS Configuration

### For Netlify Deployment

Add the following DNS records to your domain registrar:

```
Type: CNAME
Name: mahikeng
Value: your-netlify-site-name.netlify.app
TTL: 3600

Type: CNAME
Name: triplem
Value: your-netlify-site-name.netlify.app
TTL: 3600

Type: CNAME
Name: univen
Value: your-netlify-site-name.netlify.app
TTL: 3600

Type: CNAME
Name: www
Value: your-netlify-site-name.netlify.app
TTL: 3600

Type: A
Name: @
Value: 192.168.1.1 (replace with your actual IP)
TTL: 3600
```

### For Vercel Deployment

Add the following DNS records:

```
Type: CNAME
Name: mahikeng
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: triplem
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: univen
Value: cname.vercel-dns.com
TTL: 3600

Type: CNAME
Name: www
Value: cname.vercel-dns.com
TTL: 3600

Type: A
Name: @
Value: 76.76.21.21
TTL: 3600
```

## Deployment Platform Configuration

### Netlify Configuration

1. **Custom Domains**: In Netlify dashboard, add all subdomains:
   - `smartkollect.co.za`
   - `mahikeng.smartkollect.co.za`
   - `triplem.smartkollect.co.za`
   - `univen.smartkollect.co.za`
   - `www.smartkollect.co.za`

2. **Force HTTPS**: Enable HTTPS for all domains

3. **Netlify.toml**: The configuration has been updated with proper redirects

### Vercel Configuration

1. **Custom Domains**: In Vercel dashboard, add all subdomains:
   - `smartkollect.co.za`
   - `mahikeng.smartkollect.co.za`
   - `triplem.smartkollect.co.za`
   - `univen.smartkollect.co.za`
   - `www.smartkollect.co.za`

2. **Environment Variables**: Ensure all environment variables are properly set

3. **vercel.json**: The configuration has been updated with proper headers

## Application Configuration

### Middleware Updates

The middleware has been updated to handle forwarded host headers properly:

```typescript
// Get hostname from headers, checking for forwarded host first
let hostname = req.headers.get('host') || '';
const forwardedHost = req.headers.get('x-forwarded-host');

// Use forwarded host if available (for subdomain routing)
if (forwardedHost) {
  hostname = forwardedHost;
}
```

### Next.js Configuration

The `next.config.js` has been configured with proper allowed origins:

```javascript
experimental: {
  serverActions: {
    allowedOrigins: [
      'smartkollect.co.za',
      'mahikeng.smartkollect.co.za',
      'triplem.smartkollect.co.za',
      'univen.smartkollect.co.za',
      '*.smartkollect.co.za',
      'localhost:3000'
    ]
  }
}
```

## Testing Subdomains

After configuration, test each subdomain:

1. **Main Domain**: `https://smartkollect.co.za`
2. **Mahikeng**: `https://mahikeng.smartkollect.co.za`
3. **Triple M**: `https://triplem.smartkollect.co.za`
4. **Univen**: `https://univen.smartkollect.co.za`

### Troubleshooting

If subdomains are not working:

1. **Check DNS Propagation**: Use `dig` or `nslookup` to verify DNS records
   ```bash
   dig mahikeng.smartkollect.co.za
   ```

2. **Check SSL Certificates**: Ensure wildcard SSL is properly installed

3. **Check Deployment Platform Logs**: Look for any routing errors

4. **Check Browser Console**: Look for CORS or other errors

5. **Verify Middleware Logs**: Check console logs for subdomain extraction

## Common Issues

### 1. DNS Not Propagated
- **Solution**: Wait 24-48 hours for DNS propagation
- **Check**: Use online DNS lookup tools

### 2. SSL Certificate Issues
- **Solution**: Request wildcard SSL certificate
- **Check**: Verify certificate covers `*.smartkollect.co.za`

### 3. CORS Errors
- **Solution**: Ensure all subdomains are in `allowedOrigins`
- **Check**: Verify `next.config.js` configuration

### 4. Middleware Not Working
- **Solution**: Check forwarded host headers
- **Check**: Verify deployment platform supports custom headers

## Production Deployment Steps

1. **Update DNS Records**: Add all required DNS records
2. **Configure Deployment Platform**: Add all domains/subdomains
3. **Wait for Propagation**: Allow 24-48 hours for DNS propagation
4. **Test All Subdomains**: Verify each subdomain works correctly
5. **Monitor Logs**: Check for any routing or authentication issues

## Support

If you encounter any issues with subdomain configuration:

1. Check this guide first
2. Verify DNS records are correct
3. Check deployment platform configuration
4. Review application logs for errors
5. Contact your deployment platform support if needed
