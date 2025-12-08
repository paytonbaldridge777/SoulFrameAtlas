# Cloudflare Access Setup for Wiki Data Admin

This guide explains how to protect the admin interface using Cloudflare Access.

## Overview

Cloudflare Access provides zero-trust security for your admin interface, allowing you to control who can access the admin page without building your own authentication system.

## Prerequisites

- A Cloudflare account with your domain configured
- The admin interface deployed to your domain or Cloudflare Pages
- Cloudflare Access enabled on your account (available on Free tier)

## Step 1: Create a Cloudflare Access Application

1. Log in to the [Cloudflare Dashboard](https://dash.cloudflare.com)
2. Select your account and domain
3. Go to **Zero Trust** → **Access** → **Applications**
4. Click **Add an application**
5. Choose **Self-hosted**

### Application Configuration

- **Application name**: `SoulFrame Atlas Admin`
- **Session duration**: `24 hours` (or your preference)
- **Application domain**: 
  - Subdomain: `yourdomain.com`
  - Path: `/admin/wiki-data.html`

### Identity Providers

Choose how users will authenticate:

- **One-time PIN**: Send a code to email (easiest for small teams)
- **Google/GitHub/Microsoft**: OAuth provider
- **Azure AD**: For enterprise
- **SAML**: For enterprise SSO

### Access Policies

Create a policy to control access:

**Policy name**: `Admin Team`

**Action**: `Allow`

**Configure rules**:
- Emails: `admin@example.com, user@example.com`
- Or Email domain: `@yourcompany.com`
- Or Country: Select specific countries

Example allow rule:
```
Include:
  - Emails: admin@example.com
```

Click **Next** and **Add application**

## Step 2: Configure the Worker

The Cloudflare Worker needs to check for the Access token on write operations.

### Set Environment Variables

In your Cloudflare Worker settings:

1. Go to **Workers & Pages** → Your worker → **Settings** → **Variables**
2. Add these environment variables:

| Variable Name | Value | Type |
|--------------|-------|------|
| `ENABLE_CLOUDFLARE_ACCESS_CHECK` | `true` | Plain text |
| `CLOUDFLARE_ACCESS_HEADER_NAME` | `CF-Access-Jwt-Assertion` | Plain text |
| `GITHUB_TOKEN` | `ghp_xxxxxxxxxxxxx` | Secret |

### Generate GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Give it a name: `SoulFrame Atlas Admin`
4. Select scopes:
   - `repo` (full control of private repositories)
5. Click **Generate token**
6. Copy the token and save it as `GITHUB_TOKEN` secret in Cloudflare Worker

### Set the Secret

Using Wrangler CLI:

```bash
wrangler secret put GITHUB_TOKEN
# Paste your token when prompted
```

Or via Cloudflare Dashboard:
1. Go to your Worker → Settings → Variables
2. Under **Environment Variables**, click **Add variable**
3. Type: **Secret**
4. Name: `GITHUB_TOKEN`
5. Value: Your GitHub personal access token

## Step 3: Update Worker Routes

Ensure your worker is routed to handle API requests:

1. Go to **Workers & Pages** → Your worker → **Settings** → **Triggers**
2. Add a route:
   - Route: `yourdomain.com/api/admin/*`
   - Zone: Your domain

## Step 4: Test Access

1. Visit `https://yourdomain.com/admin/wiki-data.html`
2. You should be redirected to Cloudflare Access login
3. Authenticate using your configured method
4. After successful login, you'll be redirected to the admin interface

## Step 5: Verify API Protection

The worker will automatically check for the `CF-Access-Jwt-Assertion` header on:
- POST `/api/admin/data/save`
- POST `/api/admin/data/upload`
- DELETE `/api/admin/data/delete`

Read operations (GET) are not protected by default but can be configured separately.

## Advanced Configuration

### Custom JWT Validation

**IMPORTANT:** The default implementation only checks for token presence. For production use, implement proper JWT signature verification:

```javascript
import { verifyJwt } from '@cloudflare/workers-jwt';

async function validateAccessToken(request, env) {
  const token = request.headers.get('CF-Access-Jwt-Assertion');
  
  if (!token) {
    return { authorized: false, error: 'Missing access token' };
  }

  try {
    // Get your team domain from Cloudflare Zero Trust dashboard
    const teamDomain = 'yourteam.cloudflareaccess.com';
    const certsUrl = `https://${teamDomain}/cdn-cgi/access/certs`;
    
    // Fetch Cloudflare's public keys
    const response = await fetch(certsUrl);
    const keys = await response.json();
    
    // Verify JWT signature (requires @cloudflare/workers-jwt or similar)
    const decoded = await verifyJwt(token, keys);
    
    // Optionally validate claims
    if (decoded.exp < Date.now() / 1000) {
      return { authorized: false, error: 'Token expired' };
    }
    
    return { authorized: true, user: decoded };
  } catch (e) {
    return { authorized: false, error: 'Invalid token' };
  }
}
```

**Note:** Until JWT validation is implemented, ensure Cloudflare Access is your primary security layer and the admin page itself is protected.

### Service Tokens

For API access without user login (CI/CD, scripts):

1. In Cloudflare Dashboard: **Zero Trust** → **Access** → **Service Auth**
2. Create a service token
3. Use `CF-Access-Client-Id` and `CF-Access-Client-Secret` headers in API requests

### IP Restrictions

Add IP-based rules in your Access policy:

```
Include:
  - IP ranges: 203.0.113.0/24

Exclude:
  - IP ranges: 192.0.2.0/24
```

## Troubleshooting

### Access Denied Errors

1. Check that user email matches the policy
2. Verify the policy is set to "Allow"
3. Check session hasn't expired

### API Returns 403 Forbidden

1. Verify `ENABLE_CLOUDFLARE_ACCESS_CHECK` is set correctly
2. Check that the Access JWT header is being forwarded
3. Ensure the admin page is behind Access protection

### Worker Can't Access GitHub

1. Verify `GITHUB_TOKEN` secret is set correctly
2. Check token has `repo` scope
3. Test token using GitHub API directly

## Security Best Practices

1. **Use short session durations** (4-8 hours) for sensitive operations
2. **Enable MFA** on identity providers
3. **Regularly rotate** GitHub tokens
4. **Monitor access logs** in Cloudflare dashboard
5. **Use service tokens** for automation, not personal tokens
6. **Keep backups** of all data (automated by the worker)

## Cost Considerations

- Cloudflare Access: Free tier includes 50 users
- Cloudflare Workers: Free tier includes 100,000 requests/day
- Both are sufficient for small team admin use

## References

- [Cloudflare Access Documentation](https://developers.cloudflare.com/cloudflare-one/applications/)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [GitHub API Documentation](https://docs.github.com/en/rest)
