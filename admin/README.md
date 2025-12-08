# Admin Interface for SoulFrame Atlas Wiki Data

This directory contains the administrative interface for managing wiki data files in the repository.

## Overview

The admin interface provides a web-based UI for:
- Viewing all JSON data files in the `/data` directory
- Editing records within data files
- Adding new records
- Deleting records
- Creating new data categories
- Uploading JSON files via drag-and-drop
- Automatic backups before any modifications

## Files

- **wiki-data.html** - Main admin interface page
- **admin-wiki.js** - Client-side JavaScript for API interaction and UI logic

## Features

### File Management
- List all `.json` files in `/data` with record counts
- Select a file to view and edit its contents
- Create new category files
- Delete files (with automatic backup)

### Record Editing
- Visual list of all records in a file
- Add new records with JSON editor
- Edit existing records
- Delete records with confirmation
- View and edit raw JSON

### Upload
- Drag-and-drop JSON file upload
- Click to select file upload
- Automatic validation

### Safety Features
- Confirmation prompts for deletions
- Success/error toast notifications
- JSON validation before saving
- Automatic backups to `/data/backups/`
- All changes tracked via Git commits

## Usage

### Access the Interface

1. Open `admin/wiki-data.html` in a browser
2. If Cloudflare Access is configured, authenticate first
3. The interface will load and display available data files

### Edit a File

1. Click on a file name in the left panel
2. The file contents will load in the editor panel
3. Click "Edit" on any record to modify it
4. Edit the JSON in the modal
5. Click "Save" to commit changes

### Add a Record

1. Select a file from the list
2. Click "+ Add New Record"
3. Enter the record data as JSON
4. Click "Save"

### Delete a Record

1. Select a file from the list
2. Click "Delete" on the record you want to remove
3. Confirm the deletion
4. The record will be removed and changes saved

### Create a New Category

1. Click the drop zone at the top
2. Choose "Create new category" in the prompt
3. Enter a category name (e.g., "weapons", "items")
4. Optionally edit the initial data structure
5. Click "Create"

### Upload a File

1. Drag a JSON file onto the drop zone
2. Or click the drop zone and choose "Upload file"
3. Select a JSON file from your computer
4. The file will be uploaded and created in `/data/`

## API Configuration

The interface connects to a Cloudflare Worker API. There are two ways to configure the API URL:

### Option 1: Set via JavaScript (Recommended)

Add this before loading `admin-wiki.js` in the HTML:

```html
<script>
  window.WIKI_ADMIN_API_URL = 'https://your-worker.workers.dev/api/admin';
</script>
<script src="admin-wiki.js"></script>
```

### Option 2: Edit the JavaScript file

Edit `admin-wiki.js` and change the default:

```javascript
const API_BASE_URL = '/api/admin';
```

### Common API URLs:

- **Development**: `http://localhost:8787/api/admin`
- **Production (custom domain)**: `https://yourdomain.com/api/admin`
- **Worker subdomain**: `https://your-worker.workers.dev/api/admin`
- **Relative (same domain)**: `/api/admin`

## Security

### Authentication

The interface supports Cloudflare Access authentication:
- All write operations (save, upload, delete) check for authentication
- Read operations (list, read) are currently open but can be protected
- See [docs/CLOUDFLARE_ACCESS.md](../docs/CLOUDFLARE_ACCESS.md) for setup

### Validation

- Filename validation prevents path traversal attacks
- JSON validation ensures data integrity
- All operations create backups before modifications

### Best Practices

1. **Enable Cloudflare Access** - Don't leave admin interface public
2. **Use HTTPS** - Never access over plain HTTP
3. **Monitor backups** - Regularly check `/data/backups/` directory
4. **Audit commits** - Review Git history for unauthorized changes
5. **Rotate tokens** - Change GitHub token periodically

## Styling

The interface uses the existing SoulFrame Atlas design system:
- Matches `assets/css/styles.css` color scheme
- Uses CSS variables: `--accent`, `--bg`, `--surface`, etc.
- Responsive design for mobile and desktop
- Dark theme consistent with the main site

## Browser Support

- Chrome/Edge 90+
- Firefox 88+
- Safari 14+
- Mobile browsers (iOS Safari, Chrome Mobile)

## Troubleshooting

### Can't see files

1. Check that API_BASE_URL is correct
2. Verify worker is deployed and accessible
3. Check browser console for errors
4. Ensure CORS is enabled on worker

### Save fails

1. Verify Cloudflare Access authentication (if enabled)
2. Check that GITHUB_TOKEN is set in worker
3. Ensure token has `repo` permissions
4. Check worker logs for errors

### JSON validation errors

1. Verify JSON syntax at jsonlint.com
2. Ensure data is an object or array
3. Check for trailing commas
4. Verify quotes are properly escaped

### Upload doesn't work

1. Ensure file is valid JSON
2. Check file size (should be reasonable)
3. Verify filename doesn't have special characters
4. Check browser console for errors

## Development

### Local Testing

Serve the admin interface locally:

```bash
# Using Python
python -m http.server 8000

# Using Node.js
npx serve .

# Access at http://localhost:8000/admin/wiki-data.html
```

For local worker development:

```bash
cd /path/to/SoulFrameAtlas
wrangler dev

# Access worker at http://localhost:8787
```

### Making Changes

1. Edit HTML/CSS in `wiki-data.html`
2. Edit JavaScript in `admin-wiki.js`
3. Test changes locally
4. Deploy updated files

## Documentation

- [API Documentation](../docs/admin-data-api.md) - Complete API reference
- [Cloudflare Access Setup](../docs/CLOUDFLARE_ACCESS.md) - Security configuration
- [Deployment Guide](../docs/DEPLOYMENT.md) - Deployment instructions

## License

Part of the SoulFrame Atlas project. See main repository for license information.
