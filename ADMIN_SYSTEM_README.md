# SoulFrame Atlas - Wiki Data Admin System

Complete administrative system for managing wiki data in the SoulFrame Atlas repository.

## 🎯 Overview

This system provides a web-based administrative interface backed by a Cloudflare Worker API to manage JSON data files in the repository. All changes are tracked via Git commits with automatic backups.

## 📦 Components

### 1. Admin UI (`/admin`)
- **wiki-data.html** - Web interface
- **admin-wiki.js** - Client-side logic
- **README.md** - Usage guide

### 2. Cloudflare Worker API (`/workers`)
- **wiki-data/worker.js** - Main API implementation
- **helpers/validateFilename.js** - Filename sanitization
- **helpers/jsonValidation.js** - JSON validation
- **helpers/tests/** - Unit tests (37 passing)

### 3. Documentation (`/docs`)
- **admin-data-api.md** - API reference
- **CLOUDFLARE_ACCESS.md** - Security setup
- **DEPLOYMENT.md** - Deployment guide

### 4. Configuration
- **wrangler.toml** - Worker config
- **package.json** - Dependencies
- **.gitignore** - Git ignore rules

## ✨ Features

- 📋 List all JSON data files with record counts
- 👀 View and edit individual records
- ➕ Add new records to existing files
- 🗑️ Delete records with confirmation
- 📁 Create new data categories
- 📤 Upload JSON files via drag-and-drop
- 💾 Automatic backups before modifications
- ✅ Confirmation prompts for destructive actions
- 🎨 Success/error toast notifications
- 🔍 JSON validation
- 🛡️ Filename sanitization
- 🔐 Cloudflare Access integration
- 🌐 CORS support
- 📱 Responsive design

## 🚀 Quick Start

### Prerequisites

- Node.js 16+
- Cloudflare account
- GitHub personal access token with `repo` scope
- Wrangler CLI: `npm install -g wrangler`

### Installation

```bash
# Clone repository
git clone https://github.com/paytonbaldridge777/SoulFrameAtlas.git
cd SoulFrameAtlas

# Install dependencies
npm install

# Run tests
npm test
```

### Deploy Worker

```bash
# Authenticate with Cloudflare
wrangler login

# Set GitHub token secret
wrangler secret put GITHUB_TOKEN
# Paste your token when prompted

# Deploy to Cloudflare
wrangler deploy
```

### Deploy Admin UI

Upload `admin/wiki-data.html` and `admin/admin-wiki.js` to your web hosting.

Or use Cloudflare Pages:
```bash
# Push to GitHub, then connect via Cloudflare Pages dashboard
```

### Configure API URL

In `admin/wiki-data.html`, add before loading the JS:
```html
<script>
  window.WIKI_ADMIN_API_URL = 'https://your-worker.workers.dev/api/admin';
</script>
```

## 📚 Documentation

- **[API Reference](docs/admin-data-api.md)** - Complete API documentation
- **[Security Setup](docs/CLOUDFLARE_ACCESS.md)** - Cloudflare Access configuration
- **[Deployment Guide](docs/DEPLOYMENT.md)** - Step-by-step deployment
- **[Admin UI Guide](admin/README.md)** - Using the admin interface

## 🔐 Security

### Required Setup

1. **Enable Cloudflare Access** - Protect the admin page
2. **Set GITHUB_TOKEN** - As a secret, not plain text
3. **Use HTTPS** - Never access over HTTP
4. **Configure ENABLE_CLOUDFLARE_ACCESS_CHECK** - Set to `true` in production

### Security Features

- ✅ Filename validation (prevents path traversal)
- ✅ JSON validation (ensures data integrity)
- ✅ Automatic backups (all changes preserved)
- ✅ Cloudflare Access authentication
- ✅ CORS properly configured
- ✅ GitHub token stored as secret

### ⚠️ Important Security Note

The default JWT validation only checks for token presence. **For production use**, implement proper JWT signature verification as described in `docs/CLOUDFLARE_ACCESS.md`.

## 🧪 Testing

```bash
# Run all unit tests
npm test

# Run individual test suites
node workers/helpers/tests/validateFilename.test.js
node workers/helpers/tests/jsonValidation.test.js

# Start local worker for testing
wrangler dev
```

**Test Results:**
- ✅ 20 filename validation tests passing
- ✅ 17 JSON validation tests passing
- ✅ 0 security vulnerabilities (CodeQL scan)

## 📊 API Endpoints

| Endpoint | Method | Description |
|----------|--------|-------------|
| `/api/admin/health` | GET | Health check |
| `/api/admin/data/list` | GET | List all JSON files |
| `/api/admin/data/read` | GET | Read file contents |
| `/api/admin/data/save` | POST | Save/update file |
| `/api/admin/data/upload` | POST | Upload new file |
| `/api/admin/data/delete` | DELETE | Delete file |

See [docs/admin-data-api.md](docs/admin-data-api.md) for detailed API documentation.

## 🛠️ Configuration

### Environment Variables

Set in Cloudflare Worker:

| Variable | Type | Required | Default | Description |
|----------|------|----------|---------|-------------|
| `GITHUB_TOKEN` | Secret | ✅ Yes | - | GitHub personal access token |
| `ENABLE_CLOUDFLARE_ACCESS_CHECK` | Var | No | `false` | Enable Access authentication |
| `CLOUDFLARE_ACCESS_HEADER_NAME` | Var | No | `CF-Access-Jwt-Assertion` | Access header name |

### Setting Secrets

```bash
# Via Wrangler CLI
wrangler secret put GITHUB_TOKEN

# Via Cloudflare Dashboard
Workers & Pages → Your Worker → Settings → Variables → Add variable
```

## 📁 File Structure

```
SoulFrameAtlas/
├── admin/
│   ├── wiki-data.html          # Admin UI
│   ├── admin-wiki.js           # Client logic
│   └── README.md               # Usage guide
├── workers/
│   ├── wiki-data/
│   │   └── worker.js           # Main API
│   └── helpers/
│       ├── validateFilename.js # Filename validation
│       ├── jsonValidation.js   # JSON validation
│       └── tests/              # Unit tests
├── docs/
│   ├── admin-data-api.md       # API docs
│   ├── CLOUDFLARE_ACCESS.md    # Security guide
│   └── DEPLOYMENT.md           # Deploy guide
├── data/
│   ├── *.json                  # Data files
│   └── backups/                # Auto backups
├── wrangler.toml               # Worker config
├── package.json                # Dependencies
└── .gitignore                  # Git ignore
```

## 🔄 Workflow

1. **User accesses admin UI** → Cloudflare Access authenticates
2. **User selects file** → API fetches from GitHub
3. **User edits record** → Client validates JSON
4. **User saves changes** → API creates backup → commits to GitHub
5. **Automatic backup** → Saved to `/data/backups/`

## 🐛 Troubleshooting

### Can't see files
- Verify API URL is correct
- Check worker is deployed
- Look at browser console

### Save fails
- Check GITHUB_TOKEN is set
- Verify token has `repo` scope
- Review worker logs: `wrangler tail`

### Authentication errors
- Ensure Cloudflare Access is configured
- Check session hasn't expired
- Verify `ENABLE_CLOUDFLARE_ACCESS_CHECK` setting

See [docs/DEPLOYMENT.md](docs/DEPLOYMENT.md) for detailed troubleshooting.

## 📈 Performance

**Cloudflare Workers Free Tier:**
- 100,000 requests/day
- 10ms CPU time/request
- Sufficient for admin use

**GitHub API:**
- 5,000 requests/hour with token
- Rate limiting handled automatically

## 🔧 Development

### Local Development

```bash
# Start worker locally
wrangler dev

# Test API
curl http://localhost:8787/api/admin/health

# Serve admin UI
npx serve .
# Open http://localhost:3000/admin/wiki-data.html
```

### Making Changes

1. Edit files in `admin/`, `workers/`, or `docs/`
2. Run tests: `npm test`
3. Test locally: `wrangler dev`
4. Deploy: `wrangler deploy`

## 🤝 Contributing

This is part of the SoulFrame Atlas project. When contributing:

1. Test all changes locally
2. Run `npm test` to verify unit tests
3. Update documentation for API changes
4. Follow existing code style

## 📝 License

Part of the SoulFrame Atlas project. See main repository for license.

## 🔗 Links

- [SoulFrame Atlas Repository](https://github.com/paytonbaldridge777/SoulFrameAtlas)
- [Cloudflare Workers Docs](https://developers.cloudflare.com/workers/)
- [Cloudflare Access Docs](https://developers.cloudflare.com/cloudflare-one/)
- [GitHub API Docs](https://docs.github.com/en/rest)

## 💡 Tips

- Always test changes in a development environment first
- Monitor the `/data/backups/` directory for backup accumulation
- Regularly review Git history for unauthorized changes
- Keep GitHub token permissions minimal (`repo` scope only)
- Set up monitoring for worker errors
- Use short Cloudflare Access session durations for sensitive operations

## 🆘 Support

For issues or questions:
1. Check the documentation in `/docs`
2. Review troubleshooting sections
3. Check Cloudflare Worker logs: `wrangler tail`
4. Review GitHub repository issues

---

**Built with ❤️ for the SoulFrame community**
