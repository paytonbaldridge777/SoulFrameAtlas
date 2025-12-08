const express = require('express');
const cors = require('cors');
const fs = require('fs');
const path = require('path');
const multer = require('multer');

const app = express();
const PORT = process.env.PORT || 3000;

// Configuration
const DATA_DIR = path.join(__dirname, 'data');
const BACKUP_DIR = path.join(DATA_DIR, 'backups');
const ENABLE_CF_ACCESS_CHECK = process.env.ENABLE_CLOUDFLARE_ACCESS_CHECK === 'true';
const CF_ACCESS_HEADER = process.env.CLOUDFLARE_ACCESS_HEADER_NAME || 'CF-Access-Jwt-Assertion';

// Ensure backup directory exists
if (!fs.existsSync(BACKUP_DIR)) {
  fs.mkdirSync(BACKUP_DIR, { recursive: true });
}

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.static(__dirname));

// Configure multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ 
  storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB limit
});

// Security: Cloudflare Access header validation middleware
function validateCloudflareAccess(req, res, next) {
  if (!ENABLE_CF_ACCESS_CHECK) {
    return next();
  }
  
  const cfHeader = req.headers[CF_ACCESS_HEADER.toLowerCase()] || 
                   req.headers['cf-access-authenticated-user'];
  
  if (!cfHeader) {
    return res.status(403).json({ 
      error: 'Unauthorized: Cloudflare Access header missing',
      message: 'This endpoint requires authentication through Cloudflare Access'
    });
  }
  
  next();
}

// Security: Filename sanitization
function sanitizeFilename(filename) {
  // Only allow alphanumeric, underscore, hyphen, and .json extension
  const match = filename.match(/^([a-zA-Z0-9_\-]+)(\.json)?$/);
  if (!match) {
    throw new Error('Invalid filename. Only alphanumeric characters, underscores, and hyphens are allowed.');
  }
  return match[1] + '.json';
}

// Helper: Create timestamped backup
function createBackup(filename) {
  const filePath = path.join(DATA_DIR, filename);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupName = `${filename}.bak-${timestamp}`;
  const backupPath = path.join(BACKUP_DIR, backupName);
  
  fs.copyFileSync(filePath, backupPath);
  return backupName;
}

// Helper: Atomic write using temp file
function atomicWrite(filePath, content) {
  const tempPath = filePath + '.tmp';
  fs.writeFileSync(tempPath, content, 'utf8');
  fs.renameSync(tempPath, filePath);
}

// Helper: Validate JSON content
function validateJSON(content, filename) {
  try {
    const parsed = JSON.parse(content);
    
    // Check if it's an array or object
    if (typeof parsed !== 'object' || parsed === null) {
      throw new Error('JSON content must be an object or array');
    }
    
    return parsed;
  } catch (err) {
    throw new Error(`Invalid JSON: ${err.message}`);
  }
}

// API ENDPOINTS

// GET /api/admin/data/list - List all JSON files
app.get('/api/admin/data/list', (req, res) => {
  try {
    const files = fs.readdirSync(DATA_DIR)
      .filter(f => f.endsWith('.json') && f !== 'backups');
    
    const fileList = files.map(filename => {
      const filePath = path.join(DATA_DIR, filename);
      const stats = fs.statSync(filePath);
      
      let recordCount = 0;
      try {
        const content = fs.readFileSync(filePath, 'utf8');
        const parsed = JSON.parse(content);
        
        // Count records based on structure
        if (Array.isArray(parsed)) {
          recordCount = parsed.length;
        } else if (typeof parsed === 'object') {
          // For objects like {"weapons": [...]}
          const keys = Object.keys(parsed);
          if (keys.length === 1 && Array.isArray(parsed[keys[0]])) {
            recordCount = parsed[keys[0]].length;
          } else {
            recordCount = keys.length;
          }
        }
      } catch (err) {
        // If can't parse, recordCount stays 0
      }
      
      return {
        name: filename,
        size: stats.size,
        recordCount,
        modified: stats.mtime
      };
    });
    
    res.json({ files: fileList });
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
});

// GET /api/admin/data/read - Read a specific JSON file
app.get('/api/admin/data/read', (req, res) => {
  try {
    const filename = sanitizeFilename(req.query.name);
    const filePath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    const content = fs.readFileSync(filePath, 'utf8');
    const parsed = validateJSON(content, filename);
    
    res.json({ 
      name: filename,
      content: parsed 
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/data/save - Save JSON data
app.post('/api/admin/data/save', validateCloudflareAccess, (req, res) => {
  try {
    const { name, content } = req.body;
    
    if (!name || !content) {
      return res.status(400).json({ error: 'Missing name or content' });
    }
    
    const filename = sanitizeFilename(name);
    const filePath = path.join(DATA_DIR, filename);
    
    // Validate JSON
    const jsonContent = typeof content === 'string' ? content : JSON.stringify(content, null, 2);
    validateJSON(jsonContent, filename);
    
    // Create backup if file exists
    let backupName = null;
    if (fs.existsSync(filePath)) {
      backupName = createBackup(filename);
    }
    
    // Atomic write
    atomicWrite(filePath, jsonContent);
    
    res.json({ 
      success: true,
      message: `File ${filename} saved successfully`,
      backup: backupName
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// POST /api/admin/data/upload - Upload new JSON file
app.post('/api/admin/data/upload', validateCloudflareAccess, upload.single('file'), (req, res) => {
  try {
    let filename, content;
    
    // Handle multipart/form-data (file upload)
    if (req.file) {
      filename = sanitizeFilename(req.file.originalname);
      content = req.file.buffer.toString('utf8');
    } 
    // Handle application/json
    else if (req.body.name && req.body.content) {
      filename = sanitizeFilename(req.body.name);
      content = typeof req.body.content === 'string' 
        ? req.body.content 
        : JSON.stringify(req.body.content, null, 2);
    } else {
      return res.status(400).json({ error: 'Missing file or JSON data' });
    }
    
    const filePath = path.join(DATA_DIR, filename);
    
    // Check if file already exists
    if (fs.existsSync(filePath)) {
      return res.status(409).json({ 
        error: 'File already exists',
        message: `A file named ${filename} already exists. Use the save endpoint to update it.`
      });
    }
    
    // Validate JSON
    validateJSON(content, filename);
    
    // Atomic write
    atomicWrite(filePath, content);
    
    res.json({ 
      success: true,
      message: `File ${filename} uploaded successfully`,
      name: filename
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// DELETE /api/admin/data/delete - Delete a JSON file
app.delete('/api/admin/data/delete', validateCloudflareAccess, (req, res) => {
  try {
    const filename = sanitizeFilename(req.query.name || req.body.name);
    const filePath = path.join(DATA_DIR, filename);
    
    if (!fs.existsSync(filePath)) {
      return res.status(404).json({ error: 'File not found' });
    }
    
    // Create backup before deleting
    const backupName = createBackup(filename);
    
    // Delete file
    fs.unlinkSync(filePath);
    
    res.json({ 
      success: true,
      message: `File ${filename} deleted successfully`,
      backup: backupName
    });
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

// Start server
app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`Cloudflare Access check: ${ENABLE_CF_ACCESS_CHECK ? 'ENABLED' : 'DISABLED'}`);
  if (ENABLE_CF_ACCESS_CHECK) {
    console.log(`Cloudflare Access header: ${CF_ACCESS_HEADER}`);
  }
});

module.exports = app;
