# Deployment Guide for Wiki Data Admin API

This guide walks through deploying the Cloudflare Worker API and admin interface.

## Prerequisites

- Node.js 16+ and npm installed
- A Cloudflare account
- A GitHub account with repository access
- Wrangler CLI installed: `npm install -g wrangler`

## Step 1: Install Dependencies

```bash
cd /path/to/SoulFrameAtlas
npm install
```

This installs Wrangler and other development dependencies.

## Step 2: Authenticate with Cloudflare

```bash
wrangler login
```

This opens a browser window to authenticate with Cloudflare. Grant the necessary permissions.

## Step 3: Configure wrangler.toml

The `wrangler.toml` file is already configured. Review and update if needed:

```toml
name = "soulframe-atlas-admin-api"
main = "workers/wiki-data/worker.js"
compatibility_date = "2024-12-01"

[env.production]
vars = { 
  ENABLE_CLOUDFLARE_ACCESS_CHECK = "false",
  CLOUDFLARE_ACCESS_HEADER_NAME = "CF-Access-Jwt-Assertion"
}
```

**Important Configuration:**
- `name`: Worker name (appears in Cloudflare dashboard)
- `main`: Path to worker entry point
- `compatibility_date`: Cloudflare Workers API version

## Step 4: Set Environment Variables

### Option A: Using Wrangler CLI

Set non-sensitive variables in `wrangler.toml`:
```toml
[env.production.vars]
ENABLE_CLOUDFLARE_ACCESS_CHECK = "false"
CLOUDFLARE_ACCESS_HEADER_NAME = "CF-Access-Jwt-Assertion"
```

Set secrets via CLI:
```bash
wrangler secret put GITHUB_TOKEN
# Paste your GitHub personal access token when prompted
```

### Option B: Using Cloudflare Dashboard

1. Deploy the worker first (see Step 5)
2. Go to [Cloudflare Dashboard](https://dash.cloudflare.com)
3. Navigate to **Workers & Pages** → Your worker → **Settings** → **Variables**
4. Add environment variables and secrets

### Generate GitHub Token

1. Go to [GitHub Settings → Developer settings → Personal access tokens](https://github.com/settings/tokens)
2. Click **Generate new token (classic)**
3. Name: `SoulFrame Atlas Admin API`
4. Expiration: Choose appropriate duration
5. Scopes:
   - ✅ `repo` (Full control of private repositories)
6. Click **Generate token**
7. Copy the token (you won't see it again!)
8. Save it as `GITHUB_TOKEN` secret

## Step 5: Deploy to Cloudflare

Deploy to production:

```bash
wrangler deploy
```

Or deploy to a specific environment:

```bash
wrangler deploy --env production
```

**Expected Output:**
```
⛅️ wrangler 3.x.x
------------------
Your worker has been deployed!
🌎 https://soulframe-atlas-admin-api.your-subdomain.workers.dev
```

## Step 6: Test the Deployment

Test the health endpoint:

```bash
curl https://soulframe-atlas-admin-api.your-subdomain.workers.dev/api/admin/health
```

Expected response:
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

Test listing files:

```bash
curl https://soulframe-atlas-admin-api.your-subdomain.workers.dev/api/admin/data/list
```

## Step 7: Configure Custom Domain (Optional)

### Add a Route

1. Go to Cloudflare Dashboard → Your domain → **Workers Routes**
2. Click **Add route**
3. Route: `yourdomain.com/api/admin/*`
4. Worker: Select `soulframe-atlas-admin-api`
5. Click **Save**

### Test Custom Domain

```bash
curl https://yourdomain.com/api/admin/health
```

## Step 8: Deploy Admin Interface

The admin interface is a static HTML page. Deploy it using:

### Option A: Cloudflare Pages

1. Push your repository to GitHub
2. Go to Cloudflare Dashboard → **Pages**
3. Click **Create a project** → **Connect to Git**
4. Select your repository
5. Build settings:
   - Build command: (leave empty for static site)
   - Build output directory: `/`
6. Click **Save and Deploy**

### Option B: Manual Upload

Upload `admin/wiki-data.html` and `admin/admin-wiki.js` to your web server or hosting provider.

### Option C: GitHub Pages

1. Enable GitHub Pages for your repository
2. Set source to main branch, root directory
3. Access at: `https://yourusername.github.io/SoulFrameAtlas/admin/wiki-data.html`

## Step 9: Update API URL in Admin Interface

Edit `admin/admin-wiki.js` and update the API base URL:

```javascript
const API_BASE_URL = 'https://yourdomain.com/api/admin';
// Or: 'https://soulframe-atlas-admin-api.your-subdomain.workers.dev/api/admin'
```

## Step 10: Set Up Cloudflare Access (Recommended)

Protect your admin interface with authentication. See [CLOUDFLARE_ACCESS.md](./CLOUDFLARE_ACCESS.md) for detailed instructions.

**Quick steps:**
1. Cloudflare Dashboard → **Zero Trust** → **Access** → **Applications**
2. Create application for `/admin/wiki-data.html`
3. Set up identity provider (email, Google, etc.)
4. Create access policy (allow specific users/emails)
5. Update worker environment variable: `ENABLE_CLOUDFLARE_ACCESS_CHECK = "true"`
6. Redeploy worker: `wrangler deploy`

## Step 11: Verify Everything Works

1. **Visit admin page**: `https://yourdomain.com/admin/wiki-data.html`
2. **Test authentication** (if Cloudflare Access enabled)
3. **List files**: Should show all JSON files in `/data/`
4. **Select a file**: Should load and display records
5. **Edit a record**: Make a change and save
6. **Check GitHub**: Verify commit was created
7. **Check backup**: Verify backup was created in `/data/backups/`

## Development Workflow

### Local Development

```bash
# Start local dev server
wrangler dev

# Test locally
curl http://localhost:8787/api/admin/health
```

**Note:** Local development with GitHub API requires:
- Setting environment variables in `.dev.vars` file
- Or passing them via command line

Create `.dev.vars`:
```
GITHUB_TOKEN=ghp_your_token_here
ENABLE_CLOUDFLARE_ACCESS_CHECK=false
CLOUDFLARE_ACCESS_HEADER_NAME=CF-Access-Jwt-Assertion
```

### Testing Changes

1. Make changes to worker code
2. Test locally: `wrangler dev`
3. Deploy to production: `wrangler deploy`
4. Test in browser

### Running Unit Tests

```bash
npm test
```

This runs the validation helper tests.

## Monitoring and Logs

### View Worker Logs

Using Wrangler:
```bash
wrangler tail
```

Using Cloudflare Dashboard:
1. Go to **Workers & Pages** → Your worker
2. Click **Logs** → **Begin log stream**

### Monitor Usage

1. Go to **Workers & Pages** → Your worker → **Metrics**
2. View:
   - Requests per day
   - CPU time
   - Errors
   - Bandwidth

## Troubleshooting

### Worker Won't Deploy

**Error: "Failed to publish"**
- Check `wrangler.toml` syntax
- Verify you're authenticated: `wrangler whoami`
- Try: `wrangler deploy --compatibility-date=2024-12-01`

**Error: "Module not found"**
- Verify file paths in `wrangler.toml`
- Check worker file exists: `ls workers/wiki-data/worker.js`

### API Returns Errors

**500 Internal Server Error**
- Check worker logs: `wrangler tail`
- Verify `GITHUB_TOKEN` is set
- Test GitHub API directly with token

**403 Forbidden on Write Operations**
- Check `ENABLE_CLOUDFLARE_ACCESS_CHECK` setting
- Verify Cloudflare Access is configured (if enabled)
- Test with Access disabled first

**404 Not Found**
- Verify route is configured correctly
- Check worker is deployed
- Test worker URL directly

### GitHub API Issues

**"Bad credentials" Error**
- Verify `GITHUB_TOKEN` is set correctly
- Check token hasn't expired
- Ensure token has `repo` scope

**"Not Found" for File**
- Verify repository owner and name in worker code
- Check branch name (default: `main`)
- Ensure file exists in repository

### Admin Interface Issues

**CORS Errors**
- Worker should include CORS headers (already configured)
- Check browser console for specific error
- Verify API URL in `admin-wiki.js`

**Authentication Errors**
- Verify Cloudflare Access is configured
- Check session hasn't expired
- Test accessing admin page directly

## Updating the Worker

When you make changes:

```bash
# 1. Edit worker files
vim workers/wiki-data/worker.js

# 2. Test locally (optional)
wrangler dev

# 3. Deploy to production
wrangler deploy

# 4. Verify deployment
curl https://your-worker-url/api/admin/health
```

## Rollback

If a deployment breaks something:

```bash
# View previous deployments
wrangler deployments list

# Rollback to specific deployment
wrangler rollback [deployment-id]
```

## Cost Estimates

**Cloudflare Workers (Free Tier):**
- 100,000 requests/day
- 10ms CPU time/request
- Plenty for admin use

**Cloudflare Pages (Free Tier):**
- 500 builds/month
- Unlimited requests
- 1 build at a time

**GitHub:**
- Free for public repositories
- API rate limit: 5,000 requests/hour with token

## Security Checklist

- [ ] GitHub token has minimal permissions (`repo` only)
- [ ] Cloudflare Access is configured for admin page
- [ ] `ENABLE_CLOUDFLARE_ACCESS_CHECK` is enabled in production
- [ ] Admin page is not publicly accessible
- [ ] Environment variables are set as secrets
- [ ] Worker logs don't expose sensitive data
- [ ] Backup directory exists and is monitored

## Next Steps

1. Set up monitoring alerts for worker errors
2. Configure automatic backups rotation
3. Add custom logging/analytics
4. Implement additional validation rules
5. Add user audit logging

## Support

- **Cloudflare Workers Docs**: https://developers.cloudflare.com/workers/
- **Wrangler Docs**: https://developers.cloudflare.com/workers/wrangler/
- **GitHub API Docs**: https://docs.github.com/en/rest
- **Cloudflare Access Docs**: https://developers.cloudflare.com/cloudflare-one/

## Useful Commands Reference

```bash
# Authentication
wrangler login
wrangler whoami

# Deployment
wrangler deploy
wrangler deploy --env production
wrangler deploy --dry-run

# Secrets
wrangler secret put SECRET_NAME
wrangler secret list
wrangler secret delete SECRET_NAME

# Development
wrangler dev
wrangler dev --port 8787
wrangler dev --local

# Monitoring
wrangler tail
wrangler tail --format json

# Management
wrangler deployments list
wrangler rollback [deployment-id]
wrangler delete

# Testing
npm test
node workers/helpers/tests/validateFilename.test.js
```
