# Wiki Data Admin API Documentation

This document describes the API endpoints provided by the Cloudflare Worker for managing wiki data files.

## Base URL

```
https://your-worker-url.workers.dev
```

Or if using routes:
```
https://yourdomain.com/api/admin
```

## Authentication

Write operations (POST, DELETE) require Cloudflare Access authentication when `ENABLE_CLOUDFLARE_ACCESS_CHECK` is set to `true`.

The worker checks for the `CF-Access-Jwt-Assertion` header (or custom header name set in `CLOUDFLARE_ACCESS_HEADER_NAME`).

## Endpoints

### Health Check

Check if the API is running.

```http
GET /api/admin/health
```

**Response:**
```json
{
  "status": "ok",
  "timestamp": "2024-01-15T10:30:00.000Z"
}
```

---

### List Data Files

List all JSON files in the `/data` directory.

```http
GET /api/admin/data/list
```

**Response:**
```json
{
  "success": true,
  "files": [
    {
      "name": "items.json",
      "size": 45678,
      "recordCount": 123,
      "isArray": false,
      "valid": true
    },
    {
      "name": "weapons.json",
      "size": 23456,
      "recordCount": 45,
      "isArray": true,
      "valid": true
    }
  ]
}
```

**Fields:**
- `name`: Filename
- `size`: File size in bytes
- `recordCount`: Number of items (0 if not parseable)
- `isArray`: Whether the JSON is an array or object with items
- `valid`: Whether the JSON is valid

**Error Response:**
```json
{
  "success": false,
  "error": "Error message"
}
```

---

### Read Data File

Read and parse a specific data file.

```http
GET /api/admin/data/read?name={filename}
```

**Parameters:**
- `name` (required): Filename to read (e.g., `items.json`)

**Response:**
```json
{
  "success": true,
  "data": {
    "items": [
      {
        "id": "Agaric",
        "name": "Agaric",
        "rarity": "Rare",
        "ResourceType": "Organic"
      }
    ]
  },
  "meta": {
    "isArray": false,
    "itemCount": 123,
    "sha": "abc123..."
  }
}
```

**Fields:**
- `data`: Parsed JSON content
- `meta.isArray`: Whether content is an array
- `meta.itemCount`: Number of items
- `meta.sha`: Git SHA for the file

**Error Response:**
```json
{
  "success": false,
  "error": "File not found"
}
```

**Error Codes:**
- `400`: Invalid filename or file not found
- `500`: Server error

---

### Save Data File

Create or update a data file. Creates a backup before updating.

```http
POST /api/admin/data/save
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "items.json",
  "content": "{\"items\": [...]}"
}
```

Or with object:
```json
{
  "name": "items.json",
  "content": {
    "items": [...]
  }
}
```

**Fields:**
- `name` (required): Filename (must match pattern `^[a-zA-Z0-9_\-]+\.json$`)
- `content` (required): JSON content as string or object

**Response:**
```json
{
  "success": true,
  "message": "File updated successfully",
  "commit": {
    "sha": "abc123...",
    "url": "https://github.com/..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid filename pattern"
}
```

**Filename Validation:**
- Must end with `.json`
- Can only contain: `a-z`, `A-Z`, `0-9`, `_`, `-`
- No spaces, special characters, or path separators
- Examples: ✅ `items.json`, `my-data.json`, `test_file.json`
- Examples: ❌ `file.txt`, `../file.json`, `file with spaces.json`

**JSON Validation:**
- Must be valid JSON
- Must be an object or array
- Will be pretty-printed with 2-space indentation

**Backup Process:**
1. If file exists, create backup at `/data/backups/{filename}.bak-{timestamp}`
2. Commit backup to repository
3. Update original file with new content
4. Commit update to repository

**Authentication:**
- Requires Cloudflare Access token when `ENABLE_CLOUDFLARE_ACCESS_CHECK=true`

---

### Upload Data File

Upload a new data file via form data.

```http
POST /api/admin/data/upload
Content-Type: multipart/form-data
```

**Form Data:**
- `name`: Filename (optional if file has name)
- `file`: File to upload

**Alternative (JSON):**
```http
POST /api/admin/data/upload
Content-Type: application/json
```

```json
{
  "name": "newfile.json",
  "content": "{...}"
}
```

**Response:**
```json
{
  "success": true,
  "message": "File created successfully",
  "commit": {
    "sha": "abc123...",
    "url": "https://github.com/..."
  }
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "Invalid JSON content"
}
```

**Authentication:**
- Requires Cloudflare Access token when `ENABLE_CLOUDFLARE_ACCESS_CHECK=true`

---

### Delete Data File

Delete a data file. Creates a backup before deletion.

```http
DELETE /api/admin/data/delete
Content-Type: application/json
```

**Request Body:**
```json
{
  "name": "oldfile.json"
}
```

**Fields:**
- `name` (required): Filename to delete

**Response:**
```json
{
  "success": true,
  "message": "File deleted successfully"
}
```

**Error Response:**
```json
{
  "success": false,
  "error": "File not found"
}
```

**Backup Process:**
1. Create backup at `/data/backups/{filename}.bak-{timestamp}`
2. Commit backup to repository
3. Delete original file
4. Commit deletion to repository

**Authentication:**
- Requires Cloudflare Access token when `ENABLE_CLOUDFLARE_ACCESS_CHECK=true`

---

## Error Handling

All endpoints return consistent error responses:

```json
{
  "success": false,
  "error": "Descriptive error message"
}
```

**Common HTTP Status Codes:**
- `200`: Success
- `400`: Bad request (invalid input, validation error)
- `403`: Forbidden (authentication required/failed)
- `404`: Not found
- `500`: Internal server error

## CORS

All endpoints include CORS headers:
```
Access-Control-Allow-Origin: *
Access-Control-Allow-Methods: GET, POST, DELETE, OPTIONS
Access-Control-Allow-Headers: Content-Type, Authorization, CF-Access-Jwt-Assertion
```

## Rate Limiting

Cloudflare Workers Free tier limits:
- 100,000 requests per day
- 10ms CPU time per request

For production use, monitor usage and upgrade if needed.

## Example Usage

### JavaScript/Fetch

```javascript
// List files
const response = await fetch('https://yourdomain.com/api/admin/data/list');
const { files } = await response.json();

// Read file
const data = await fetch('https://yourdomain.com/api/admin/data/read?name=items.json');
const { data: items } = await data.json();

// Save file
await fetch('https://yourdomain.com/api/admin/data/save', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    name: 'items.json',
    content: JSON.stringify({ items: [...] }, null, 2)
  })
});

// Delete file
await fetch('https://yourdomain.com/api/admin/data/delete', {
  method: 'DELETE',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ name: 'oldfile.json' })
});
```

### cURL

```bash
# List files
curl https://yourdomain.com/api/admin/data/list

# Read file
curl "https://yourdomain.com/api/admin/data/read?name=items.json"

# Save file (with Access token)
curl -X POST https://yourdomain.com/api/admin/data/save \
  -H "Content-Type: application/json" \
  -H "CF-Access-Jwt-Assertion: YOUR_TOKEN" \
  -d '{"name":"items.json","content":"{\"items\":[]}"}'

# Delete file (with Access token)
curl -X DELETE https://yourdomain.com/api/admin/data/delete \
  -H "Content-Type: application/json" \
  -H "CF-Access-Jwt-Assertion: YOUR_TOKEN" \
  -d '{"name":"oldfile.json"}'
```

## Deployment

See [Deployment Guide](./DEPLOYMENT.md) for instructions on deploying the worker and setting up environment variables.

## Security

- All write operations create backups in `/data/backups/`
- Filename validation prevents path traversal attacks
- JSON validation prevents malformed data
- Cloudflare Access provides authentication
- GitHub token must have minimal required permissions (`repo` scope)
- All commits are attributed and traceable

## Repository Structure

```
/data/
  items.json          # Data files
  weapons.json
  enemies.json
  /backups/           # Automatic backups
    items.json.bak-2024-01-15T10-30-00-000Z
    weapons.json.bak-2024-01-15T11-00-00-000Z
```

## Troubleshooting

**"File not found" errors:**
- Ensure file exists in `/data/` directory
- Check filename spelling and case sensitivity

**"Invalid JSON" errors:**
- Validate JSON syntax at jsonlint.com
- Ensure content is an object or array, not a primitive

**403 Forbidden:**
- Check Cloudflare Access is configured
- Verify JWT token is being sent
- Ensure `ENABLE_CLOUDFLARE_ACCESS_CHECK` matches your setup

**GitHub API errors:**
- Verify `GITHUB_TOKEN` is set correctly
- Check token has `repo` permissions
- Ensure token hasn't expired

**Backup not created:**
- Check GitHub API connectivity
- Verify `/data/backups/` directory exists
- Review worker logs for errors
