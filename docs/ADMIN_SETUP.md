# Admin Setup Guide: Wiki Data Management

This document describes how to set up and use the administrative interface for managing JSON wiki data in the Soulframe Atlas repository.

## Overview

The admin interface provides a web-based UI for authorized users to:
- Browse all JSON data files in the `/data/` folder
- View and edit JSON content inline
- Create new data categories
- Upload JSON files via drag-and-drop
- Delete data files (with automatic backups)

## Security: Cloudflare Access Protection

The admin page (`/admin/wiki-data.html`) is designed to be protected by **Cloudflare Access**, which provides password-based authentication without requiring custom password UI in the application.

### Setting Up Cloudflare Access

1. **Enable Cloudflare Access for your domain**
   - Log in to your Cloudflare Dashboard
   - Navigate to **Zero Trust** → **Access** → **Applications**
   - Click **Add an application**

2. **Create an Access Application**
   - Choose **Self-hosted** application type
   - Application name: `Soulframe Atlas Admin`
   - Session Duration: Configure as needed (e.g., 24 hours)
   - Application domain: Your domain (e.g., `soulframeatlas.com`)
   - Path: `/admin/*` (to protect all admin pages)

3. **Configure Access Policies**
   - Create a policy to define who can access the admin area
   - Example policy: Allow specific email addresses or email domains
   - Example: `Email: admin@yourdomain.com`

4. **Add Authentication Methods**
   - Enable authentication methods (e.g., One-time PIN, Google, GitHub, etc.)
   - Users will authenticate through Cloudflare before reaching your admin page

## Environment Variables

The server supports optional Cloudflare Access header validation to ensure requests come through Cloudflare Access.

### Required Environment Variables (for production)

```bash
# Enable Cloudflare Access header validation (default: false)
ENABLE_CLOUDFLARE_ACCESS_CHECK=true

# Optional: Custom header name (default: CF-Access-Jwt-Assertion)
CLOUDFLARE_ACCESS_HEADER_NAME=CF-Access-Jwt-Assertion
```

### Setting Environment Variables

#### For Vercel Deployment:
1. Go to your project settings in Vercel
2. Navigate to **Environment Variables**
3. Add the following variables:
   - `ENABLE_CLOUDFLARE_ACCESS_CHECK`: `true`
   - `CLOUDFLARE_ACCESS_HEADER_NAME`: `CF-Access-Jwt-Assertion` (optional)

#### For Local Development:
Create a `.env` file in the project root:
```bash
ENABLE_CLOUDFLARE_ACCESS_CHECK=false
CLOUDFLARE_ACCESS_HEADER_NAME=CF-Access-Jwt-Assertion
```

**Note:** For local development, keep `ENABLE_CLOUDFLARE_ACCESS_CHECK=false` to bypass Cloudflare header checks.

## API Endpoints

The server provides the following REST API endpoints for data management:

### GET `/api/admin/data/list`
List all JSON files in the `/data/` directory with metadata.

**Response:**
```json
{
  "files": [
    {
      "name": "weapons.json",
      "size": 262144,
      "recordCount": 42,
      "modified": "2025-12-08T00:00:00.000Z"
    }
  ]
}
```

### GET `/api/admin/data/read?name={filename}`
Read the contents of a specific JSON file.

**Query Parameters:**
- `name` (required): Filename to read (e.g., `weapons.json`)

**Response:**
```json
{
  "name": "weapons.json",
  "content": { ... }
}
```

### POST `/api/admin/data/save`
Save (create or update) a JSON file with validation and automatic backup.

**Request Body:**
```json
{
  "name": "weapons.json",
  "content": { ... }
}
```

**Response:**
```json
{
  "success": true,
  "message": "File weapons.json saved successfully",
  "backup": "weapons.json.bak-2025-12-08T12-34-56-789Z"
}
```

**Security:**
- Requires Cloudflare Access header (if `ENABLE_CLOUDFLARE_ACCESS_CHECK=true`)
- Validates JSON syntax
- Creates timestamped backup in `/data/backups/` before overwriting
- Uses atomic file writes (temp file → rename)

### POST `/api/admin/data/upload`
Upload a new JSON file.

**Request Body (JSON):**
```json
{
  "name": "newcategory.json",
  "content": []
}
```

**Request Body (Multipart form-data):**
```
file: [File object]
```

**Response:**
```json
{
  "success": true,
  "message": "File newcategory.json uploaded successfully",
  "name": "newcategory.json"
}
```

**Security:**
- Requires Cloudflare Access header (if enabled)
- Rejects if file already exists (use `/save` to update)
- Validates JSON syntax
- File size limit: 10MB

### DELETE `/api/admin/data/delete?name={filename}`
Delete a JSON file (creates backup before deletion).

**Query Parameters:**
- `name` (required): Filename to delete

**Response:**
```json
{
  "success": true,
  "message": "File weapons.json deleted successfully",
  "backup": "weapons.json.bak-2025-12-08T12-34-56-789Z"
}
```

**Security:**
- Requires Cloudflare Access header (if enabled)
- Creates backup in `/data/backups/` before deletion

## File Safety Features

### Filename Sanitization
All filenames are sanitized to prevent path traversal attacks:
- Only allows: `[a-zA-Z0-9_-]` characters
- Automatically appends `.json` extension
- Rejects any paths or special characters

Examples:
- ✅ `weapons.json` → `weapons.json`
- ✅ `new_category` → `new_category.json`
- ✅ `armor-grouped` → `armor-grouped.json`
- ❌ `../etc/passwd` → Error
- ❌ `data/weapons` → Error

### JSON Validation
All JSON content is validated before saving:
- Must be valid JSON syntax
- Must be an object or array
- Returns helpful error messages on validation failure

### Automatic Backups
Before any destructive operation (save, delete), the system:
1. Creates a timestamped backup in `/data/backups/`
2. Format: `{filename}.bak-{ISO8601-timestamp}`
3. Example: `weapons.json.bak-2025-12-08T12-34-56-789Z`

### Atomic Writes
All file writes use atomic operations:
1. Write to temporary file (`.tmp` extension)
2. Rename temp file to target (atomic operation)
3. Prevents partial writes or corruption

## Deployment

### Deploying to Vercel

1. **Install Vercel CLI** (if not already installed):
   ```bash
   npm install -g vercel
   ```

2. **Deploy the project**:
   ```bash
   vercel
   ```

3. **Set environment variables** in Vercel dashboard:
   - `ENABLE_CLOUDFLARE_ACCESS_CHECK=true`
   - `CLOUDFLARE_ACCESS_HEADER_NAME=CF-Access-Jwt-Assertion` (optional)

4. **Configure Cloudflare**:
   - Point your domain to Vercel
   - Set up Cloudflare Access for `/admin/*` path

### Running Locally

1. **Install dependencies**:
   ```bash
   npm install
   ```

2. **Start the server**:
   ```bash
   npm start
   ```

3. **Access the admin page**:
   - Navigate to: `http://localhost:3000/admin/wiki-data.html`

## Usage Guide

### Editing Existing Files

1. Navigate to `/admin/wiki-data.html`
2. Click on a file from the left sidebar
3. Edit the JSON in the textarea editor
4. Click **💾 Save** to save changes
5. A backup is automatically created before saving

### Creating New Categories

1. Click **✨ Create New Category** button
2. Enter a category name (e.g., `consumables`)
3. Choose:
   - **Start with empty array**: Creates `[]`
   - **Upload JSON file**: Drag-and-drop or browse for a JSON file
4. Click **Create**

### Deleting Files

1. Select a file to edit
2. Click **🗑️ Delete File** button
3. Confirm deletion in the modal
4. A backup is automatically created before deletion

### Drag-and-Drop Upload

When creating a new category:
1. Select **Upload JSON file** option
2. Drag a `.json` file into the upload area, or click to browse
3. The file will be validated before upload

## Troubleshooting

### "Unauthorized: Cloudflare Access header missing"
- Ensure Cloudflare Access is properly configured for your domain
- Verify the correct header name is set in environment variables
- For local development, set `ENABLE_CLOUDFLARE_ACCESS_CHECK=false`

### "Invalid filename" error
- Use only alphanumeric characters, underscores, and hyphens
- Don't include path separators or special characters

### "Invalid JSON" error
- Check JSON syntax in the editor
- Ensure proper formatting (commas, brackets, quotes)
- Use a JSON validator to identify the issue

### "File already exists" error (on upload)
- Use the **Save** button on the editor instead
- Upload is only for creating new files, not updating existing ones

## Best Practices

1. **Always test locally first**: Make changes in a local/staging environment before production
2. **Review backups**: Backups are stored in `/data/backups/` - review them periodically
3. **Use version control**: Commit data changes to git for additional safety
4. **Validate JSON**: Test JSON syntax before saving
5. **Limit access**: Only grant Cloudflare Access to trusted administrators

## Support

For issues or questions, please create an issue in the GitHub repository.
