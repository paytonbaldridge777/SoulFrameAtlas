/**
 * Cloudflare Worker for Wiki Data Administration API
 * Provides endpoints to manage JSON data files in the repository via GitHub API
 */

import { validateFilename } from '../helpers/validateFilename.js';
import { validateJSON, safeStringify, getItemCount } from '../helpers/jsonValidation.js';

// GitHub API configuration
const GITHUB_OWNER = 'paytonbaldridge777';
const GITHUB_REPO = 'SoulFrameAtlas';
const GITHUB_BRANCH = 'main';
const DATA_PATH = 'data';
const BACKUP_PATH = 'data/backups';

/**
 * Modern base64 encoding for Cloudflare Workers
 */
function base64Encode(str) {
  // Use btoa for now as it's still supported in Cloudflare Workers
  // Future: migrate to TextEncoder when Cloudflare Workers fully deprecates btoa
  return btoa(str);
}

/**
 * Modern base64 decoding for Cloudflare Workers
 */
function base64Decode(str) {
  // Use atob for now as it's still supported in Cloudflare Workers
  // Future: migrate to TextDecoder when Cloudflare Workers fully deprecates atob
  return atob(str);
}

/**
 * Check Cloudflare Access authentication if enabled
 * 
 * SECURITY WARNING: This implementation only checks for token presence.
 * For production use, implement proper JWT signature verification.
 * See docs/CLOUDFLARE_ACCESS.md for enhanced security recommendations.
 */
function checkCloudflareAccess(request, env) {
  const enabled = env.ENABLE_CLOUDFLARE_ACCESS_CHECK === 'true';
  
  if (!enabled) {
    return { authorized: true };
  }

  const headerName = env.CLOUDFLARE_ACCESS_HEADER_NAME || 'CF-Access-Jwt-Assertion';
  const token = request.headers.get(headerName);

  if (!token) {
    return { 
      authorized: false, 
      error: 'Missing Cloudflare Access authentication' 
    };
  }

  // TODO: Implement JWT signature verification for production
  // Example: Use @cloudflare/workers-jwt or similar library
  // to verify the JWT token against Cloudflare's public keys
  
  return { authorized: true };
}

/**
 * Fetch file from GitHub
 */
async function getGitHubFile(path, env) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}?ref=${GITHUB_BRANCH}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SoulFrame-Atlas-Admin'
    }
  });

  if (!response.ok) {
    if (response.status === 404) {
      return null;
    }
    throw new Error(`GitHub API error: ${response.status} ${response.statusText}`);
  }

  return await response.json();
}

/**
 * List all JSON files in the data directory
 */
async function listDataFiles(env) {
  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${DATA_PATH}?ref=${GITHUB_BRANCH}`;
  
  const response = await fetch(url, {
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'User-Agent': 'SoulFrame-Atlas-Admin'
    }
  });

  if (!response.ok) {
    throw new Error(`Failed to list files: ${response.status}`);
  }

  const files = await response.json();
  
  // Filter to only .json files and fetch their content to get record counts
  const jsonFiles = files.filter(f => f.name.endsWith('.json') && f.type === 'file');
  
  const fileDetails = await Promise.all(
    jsonFiles.map(async (file) => {
      try {
        // Fetch file content to count items
        const contentResponse = await fetch(file.download_url);
        const content = await contentResponse.text();
        const validation = validateJSON(content);
        
        return {
          name: file.name,
          size: file.size,
          recordCount: validation.valid ? validation.itemCount : 0,
          isArray: validation.isArray,
          valid: validation.valid
        };
      } catch (e) {
        return {
          name: file.name,
          size: file.size,
          recordCount: 0,
          isArray: false,
          valid: false,
          error: e.message
        };
      }
    })
  );

  return fileDetails;
}

/**
 * Read a data file
 */
async function readDataFile(filename, env) {
  const validation = validateFilename(filename);
  if (!validation.valid) {
    return { 
      success: false, 
      error: validation.error 
    };
  }

  const path = `${DATA_PATH}/${validation.sanitized}`;
  
  try {
    const fileData = await getGitHubFile(path, env);
    
    if (!fileData) {
      return { 
        success: false, 
        error: 'File not found' 
      };
    }

    // Decode base64 content
    const content = base64Decode(fileData.content);
    const jsonValidation = validateJSON(content);

    if (!jsonValidation.valid) {
      return { 
        success: false, 
        error: jsonValidation.error 
      };
    }

    return {
      success: true,
      data: jsonValidation.parsed,
      meta: {
        isArray: jsonValidation.isArray,
        itemCount: jsonValidation.itemCount,
        sha: fileData.sha
      }
    };
  } catch (e) {
    return { 
      success: false, 
      error: `Failed to read file: ${e.message}` 
    };
  }
}

/**
 * Create a backup of a file
 */
async function createBackup(filename, content, env) {
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
  const backupFilename = `${filename}.bak-${timestamp}`;
  const path = `${BACKUP_PATH}/${backupFilename}`;

  const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
  
  const body = {
    message: `Backup: ${filename} at ${new Date().toISOString()}`,
    content: base64Encode(content),
    branch: GITHUB_BRANCH
  };

  const response = await fetch(url, {
    method: 'PUT',
    headers: {
      'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
      'Accept': 'application/vnd.github.v3+json',
      'Content-Type': 'application/json',
      'User-Agent': 'SoulFrame-Atlas-Admin'
    },
    body: JSON.stringify(body)
  });

  if (!response.ok) {
    const error = await response.text();
    throw new Error(`Backup failed: ${response.status} ${error}`);
  }

  return await response.json();
}

/**
 * Save (create or update) a data file
 */
async function saveDataFile(filename, content, env) {
  const validation = validateFilename(filename);
  if (!validation.valid) {
    return { 
      success: false, 
      error: validation.error 
    };
  }

  const jsonValidation = validateJSON(content);
  if (!jsonValidation.valid) {
    return { 
      success: false, 
      error: jsonValidation.error 
    };
  }

  const path = `${DATA_PATH}/${validation.sanitized}`;

  try {
    // Get current file to check if it exists and get SHA
    const existingFile = await getGitHubFile(path, env);
    const isUpdate = existingFile !== null;

    // Create backup if updating existing file
    if (isUpdate) {
      const currentContent = base64Decode(existingFile.content);
      await createBackup(validation.sanitized, currentContent, env);
    }

    // Save new content
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    
    const body = {
      message: isUpdate 
        ? `Update ${validation.sanitized} via admin API`
        : `Create ${validation.sanitized} via admin API`,
      content: base64Encode(content),
      branch: GITHUB_BRANCH
    };

    // Include SHA for updates
    if (isUpdate) {
      body.sha = existingFile.sha;
    }

    const response = await fetch(url, {
      method: 'PUT',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'SoulFrame-Atlas-Admin'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Save failed: ${response.status} ${error}`);
    }

    const result = await response.json();

    return {
      success: true,
      message: isUpdate ? 'File updated successfully' : 'File created successfully',
      commit: result.commit
    };
  } catch (e) {
    return { 
      success: false, 
      error: `Failed to save file: ${e.message}` 
    };
  }
}

/**
 * Delete a data file
 */
async function deleteDataFile(filename, env) {
  const validation = validateFilename(filename);
  if (!validation.valid) {
    return { 
      success: false, 
      error: validation.error 
    };
  }

  const path = `${DATA_PATH}/${validation.sanitized}`;

  try {
    // Get current file
    const existingFile = await getGitHubFile(path, env);
    
    if (!existingFile) {
      return { 
        success: false, 
        error: 'File not found' 
      };
    }

    // Create backup before deleting
    const currentContent = base64Decode(existingFile.content);
    await createBackup(validation.sanitized, currentContent, env);

    // Delete file
    const url = `https://api.github.com/repos/${GITHUB_OWNER}/${GITHUB_REPO}/contents/${path}`;
    
    const body = {
      message: `Delete ${validation.sanitized} via admin API`,
      sha: existingFile.sha,
      branch: GITHUB_BRANCH
    };

    const response = await fetch(url, {
      method: 'DELETE',
      headers: {
        'Authorization': `Bearer ${env.GITHUB_TOKEN}`,
        'Accept': 'application/vnd.github.v3+json',
        'Content-Type': 'application/json',
        'User-Agent': 'SoulFrame-Atlas-Admin'
      },
      body: JSON.stringify(body)
    });

    if (!response.ok) {
      const error = await response.text();
      throw new Error(`Delete failed: ${response.status} ${error}`);
    }

    return {
      success: true,
      message: 'File deleted successfully'
    };
  } catch (e) {
    return { 
      success: false, 
      error: `Failed to delete file: ${e.message}` 
    };
  }
}

/**
 * Handle CORS preflight
 */
function handleCORS() {
  return new Response(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, CF-Access-Jwt-Assertion',
      'Access-Control-Max-Age': '86400'
    }
  });
}

/**
 * Create JSON response with CORS headers
 */
function jsonResponse(data, status = 200) {
  return new Response(JSON.stringify(data, null, 2), {
    status,
    headers: {
      'Content-Type': 'application/json',
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, POST, DELETE, OPTIONS',
      'Access-Control-Allow-Headers': 'Content-Type, Authorization, CF-Access-Jwt-Assertion'
    }
  });
}

/**
 * Main request handler
 */
export default {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;

    // Handle CORS preflight
    if (request.method === 'OPTIONS') {
      return handleCORS();
    }

    // Health check
    if (path === '/api/admin/health') {
      return jsonResponse({ status: 'ok', timestamp: new Date().toISOString() });
    }

    // List data files - GET /api/admin/data/list
    if (path === '/api/admin/data/list' && request.method === 'GET') {
      try {
        const files = await listDataFiles(env);
        return jsonResponse({ success: true, files });
      } catch (e) {
        return jsonResponse({ success: false, error: e.message }, 500);
      }
    }

    // Read data file - GET /api/admin/data/read?name={filename}
    if (path === '/api/admin/data/read' && request.method === 'GET') {
      const filename = url.searchParams.get('name');
      
      if (!filename) {
        return jsonResponse({ success: false, error: 'Missing filename parameter' }, 400);
      }

      const result = await readDataFile(filename, env);
      return jsonResponse(result, result.success ? 200 : 400);
    }

    // Check authentication for write operations
    const writeOperations = ['/api/admin/data/save', '/api/admin/data/upload', '/api/admin/data/delete'];
    if (writeOperations.includes(path) && request.method !== 'GET') {
      const authCheck = checkCloudflareAccess(request, env);
      if (!authCheck.authorized) {
        return jsonResponse({ success: false, error: authCheck.error }, 403);
      }
    }

    // Save data file - POST /api/admin/data/save
    if (path === '/api/admin/data/save' && request.method === 'POST') {
      try {
        const body = await request.json();
        const { name, content } = body;

        if (!name || !content) {
          return jsonResponse({ success: false, error: 'Missing name or content' }, 400);
        }

        // Content should be a string (JSON)
        const contentStr = typeof content === 'string' ? content : safeStringify(content);
        const result = await saveDataFile(name, contentStr, env);
        
        return jsonResponse(result, result.success ? 200 : 400);
      } catch (e) {
        return jsonResponse({ success: false, error: e.message }, 400);
      }
    }

    // Upload data file - POST /api/admin/data/upload
    if (path === '/api/admin/data/upload' && request.method === 'POST') {
      try {
        const contentType = request.headers.get('content-type') || '';
        let name, content;

        if (contentType.includes('application/json')) {
          const body = await request.json();
          name = body.name;
          content = typeof body.content === 'string' ? body.content : safeStringify(body.content);
        } else if (contentType.includes('multipart/form-data')) {
          const formData = await request.formData();
          name = formData.get('name');
          const file = formData.get('file');
          
          if (file) {
            content = await file.text();
            if (!name) {
              name = file.name;
            }
          }
        } else {
          return jsonResponse({ success: false, error: 'Unsupported content type' }, 400);
        }

        if (!name || !content) {
          return jsonResponse({ success: false, error: 'Missing name or content' }, 400);
        }

        const result = await saveDataFile(name, content, env);
        return jsonResponse(result, result.success ? 200 : 400);
      } catch (e) {
        return jsonResponse({ success: false, error: e.message }, 400);
      }
    }

    // Delete data file - DELETE /api/admin/data/delete
    if (path === '/api/admin/data/delete' && request.method === 'DELETE') {
      try {
        const body = await request.json();
        const { name } = body;

        if (!name) {
          return jsonResponse({ success: false, error: 'Missing name' }, 400);
        }

        const result = await deleteDataFile(name, env);
        return jsonResponse(result, result.success ? 200 : 400);
      } catch (e) {
        return jsonResponse({ success: false, error: e.message }, 400);
      }
    }

    // Not found
    return jsonResponse({ success: false, error: 'Endpoint not found' }, 404);
  }
};
