/**
 * Admin Wiki Data Management Interface
 * Client-side JavaScript for managing wiki JSON files
 */

// Configuration
// You can override this by setting window.WIKI_ADMIN_API_URL before loading this script
// Example in HTML: <script>window.WIKI_ADMIN_API_URL = 'https://your-worker.workers.dev/api/admin';</script>
const API_BASE_URL = window.WIKI_ADMIN_API_URL || '/api/admin';

// State
let currentFile = null;
let currentData = null;
let files = [];

// Initialize on page load
document.addEventListener('DOMContentLoaded', () => {
  initializeUI();
  loadFileList();
});

/**
 * Initialize UI event listeners
 */
function initializeUI() {
  // Drop zone
  const dropZone = document.getElementById('dropZone');
  const fileInput = document.getElementById('fileInput');

  dropZone.addEventListener('click', () => {
    const action = confirm('Create new category (OK) or upload file (Cancel)?');
    if (action) {
      createNewCategory();
    } else {
      fileInput.click();
    }
  });

  dropZone.addEventListener('dragover', (e) => {
    e.preventDefault();
    dropZone.classList.add('drag-over');
  });

  dropZone.addEventListener('dragleave', () => {
    dropZone.classList.remove('drag-over');
  });

  dropZone.addEventListener('drop', (e) => {
    e.preventDefault();
    dropZone.classList.remove('drag-over');
    
    const files = e.dataTransfer.files;
    if (files.length > 0) {
      handleFileUpload(files[0]);
    }
  });

  fileInput.addEventListener('change', (e) => {
    if (e.target.files.length > 0) {
      handleFileUpload(e.target.files[0]);
    }
  });

  // Nav toggle for mobile
  const navToggle = document.getElementById('navToggle');
  const navLinks = document.getElementById('navLinks');
  
  if (navToggle) {
    navToggle.addEventListener('click', () => {
      navLinks.classList.toggle('active');
    });
  }
}

/**
 * Load list of files from API
 */
async function loadFileList() {
  const fileListEl = document.getElementById('fileList');
  fileListEl.innerHTML = '<div class="loading">Loading files...</div>';

  try {
    const response = await fetch(`${API_BASE_URL}/data/list`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load files');
    }

    files = result.files || [];
    renderFileList(files);
  } catch (error) {
    console.error('Error loading files:', error);
    fileListEl.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showToast('Failed to load file list', 'error');
  }
}

/**
 * Render file list
 */
function renderFileList(fileList) {
  const fileListEl = document.getElementById('fileList');
  
  if (fileList.length === 0) {
    fileListEl.innerHTML = '<div class="empty-state"><p>No files found</p></div>';
    return;
  }

  fileListEl.innerHTML = fileList.map(file => `
    <div class="file-item" data-filename="${file.name}" onclick="selectFile('${file.name}')">
      <div class="file-item-name">${file.name}</div>
      <div class="file-item-meta">
        ${file.recordCount || 0} records · ${formatBytes(file.size)}
      </div>
    </div>
  `).join('');
}

/**
 * Select and load a file
 */
async function selectFile(filename) {
  // Update UI
  document.querySelectorAll('.file-item').forEach(el => {
    el.classList.remove('active');
  });
  const selectedEl = document.querySelector(`[data-filename="${filename}"]`);
  if (selectedEl) {
    selectedEl.classList.add('active');
  }

  // Load file data
  const editorContent = document.getElementById('editorContent');
  editorContent.innerHTML = '<div class="loading">Loading data...</div>';

  try {
    const response = await fetch(`${API_BASE_URL}/data/read?name=${encodeURIComponent(filename)}`);
    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to load file');
    }

    currentFile = filename;
    currentData = result.data;
    
    renderEditor(filename, result.data, result.meta);
  } catch (error) {
    console.error('Error loading file:', error);
    editorContent.innerHTML = `<div class="error">Error: ${error.message}</div>`;
    showToast('Failed to load file', 'error');
  }
}

/**
 * Render the editor interface
 */
function renderEditor(filename, data, meta) {
  const editorContent = document.getElementById('editorContent');
  
  const isArray = Array.isArray(data);
  const items = isArray ? data : (data.items || []);
  
  editorContent.innerHTML = `
    <div class="editor-header">
      <div class="editor-title">${filename}</div>
      <div class="editor-actions">
        <button class="btn btn-secondary btn-sm" onclick="viewRawJSON()">View Raw</button>
        <button class="btn btn-danger btn-sm" onclick="confirmDeleteFile()">Delete File</button>
      </div>
    </div>

    <div class="form-group">
      <button class="btn btn-primary" onclick="addNewRecord()">+ Add New Record</button>
    </div>

    <div class="record-list" id="recordList">
      ${renderRecordList(items)}
    </div>
  `;
}

/**
 * Render list of records
 */
function renderRecordList(items) {
  if (!Array.isArray(items) || items.length === 0) {
    return '<div class="empty-state"><p>No records found</p></div>';
  }

  return items.map((item, index) => {
    const displayName = item.name || item.id || item.title || `Record ${index + 1}`;
    const details = [];
    
    if (item.id) details.push(`ID: ${item.id}`);
    if (item.rarity) details.push(item.rarity);
    if (item.type) details.push(item.type);
    
    return `
      <div class="record-item">
        <div class="record-info">
          <div class="record-name">${escapeHtml(displayName)}</div>
          <div class="record-details">${details.join(' · ')}</div>
        </div>
        <div class="record-actions">
          <button class="btn btn-secondary btn-sm" onclick="editRecord(${index})">Edit</button>
          <button class="btn btn-danger btn-sm" onclick="confirmDeleteRecord(${index})">Delete</button>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Add new record
 */
function addNewRecord() {
  const isArray = Array.isArray(currentData);
  const items = isArray ? currentData : (currentData.items || []);
  
  showEditModal(-1, {});
}

/**
 * Edit existing record
 */
function editRecord(index) {
  const isArray = Array.isArray(currentData);
  const items = isArray ? currentData : (currentData.items || []);
  const record = items[index];
  
  showEditModal(index, record);
}

/**
 * Show edit modal
 */
function showEditModal(index, record) {
  const isNew = index === -1;
  const jsonStr = JSON.stringify(record, null, 2);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-title">${isNew ? 'Add New Record' : 'Edit Record'}</div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Record Data (JSON)</label>
          <textarea class="json-editor" id="recordEditor" rows="15">${escapeHtml(jsonStr)}</textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveRecord(${index})">Save</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/**
 * Save record
 */
async function saveRecord(index) {
  const editor = document.getElementById('recordEditor');
  const jsonStr = editor.value;
  
  try {
    const record = JSON.parse(jsonStr);
    
    const isArray = Array.isArray(currentData);
    let items = isArray ? currentData : (currentData.items || []);
    
    if (index === -1) {
      items.push(record);
    } else {
      items[index] = record;
    }
    
    if (!isArray) {
      currentData.items = items;
    }
    
    await saveCurrentFile();
    closeModal();
    renderEditor(currentFile, currentData, { isArray, itemCount: items.length });
    showToast('Record saved successfully', 'success');
  } catch (error) {
    showToast(`Invalid JSON: ${error.message}`, 'error');
  }
}

/**
 * Confirm delete record
 */
function confirmDeleteRecord(index) {
  const isArray = Array.isArray(currentData);
  const items = isArray ? currentData : (currentData.items || []);
  const record = items[index];
  const name = record.name || record.id || `Record ${index + 1}`;
  
  if (confirm(`Delete "${name}"?`)) {
    deleteRecord(index);
  }
}

/**
 * Delete record
 */
async function deleteRecord(index) {
  const isArray = Array.isArray(currentData);
  let items = isArray ? currentData : (currentData.items || []);
  
  items.splice(index, 1);
  
  if (!isArray) {
    currentData.items = items;
  }
  
  await saveCurrentFile();
  renderEditor(currentFile, currentData, { isArray, itemCount: items.length });
  showToast('Record deleted successfully', 'success');
}

/**
 * View raw JSON
 */
function viewRawJSON() {
  const jsonStr = JSON.stringify(currentData, null, 2);
  
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content" style="max-width: 800px;">
      <div class="modal-title">Raw JSON - ${currentFile}</div>
      <div class="modal-body">
        <textarea class="json-editor" id="rawEditor" rows="20">${escapeHtml(jsonStr)}</textarea>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveRawJSON()">Save Changes</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/**
 * Save raw JSON
 */
async function saveRawJSON() {
  const editor = document.getElementById('rawEditor');
  const jsonStr = editor.value;
  
  try {
    const data = JSON.parse(jsonStr);
    currentData = data;
    
    await saveCurrentFile();
    closeModal();
    
    const isArray = Array.isArray(data);
    const itemCount = isArray ? data.length : (data.items ? data.items.length : 0);
    renderEditor(currentFile, currentData, { isArray, itemCount });
    showToast('File saved successfully', 'success');
  } catch (error) {
    showToast(`Invalid JSON: ${error.message}`, 'error');
  }
}

/**
 * Save current file to API
 */
async function saveCurrentFile() {
  if (!currentFile || !currentData) {
    throw new Error('No file loaded');
  }

  const jsonStr = JSON.stringify(currentData, null, 2);

  try {
    const response = await fetch(`${API_BASE_URL}/data/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: currentFile,
        content: jsonStr
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to save file');
    }

    // Reload file list to update counts
    await loadFileList();
    
    return result;
  } catch (error) {
    console.error('Error saving file:', error);
    throw error;
  }
}

/**
 * Confirm delete file
 */
function confirmDeleteFile() {
  if (confirm(`Delete "${currentFile}"?\n\nThis will create a backup before deleting.`)) {
    deleteFile();
  }
}

/**
 * Delete current file
 */
async function deleteFile() {
  if (!currentFile) {
    return;
  }

  try {
    const response = await fetch(`${API_BASE_URL}/data/delete`, {
      method: 'DELETE',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: currentFile
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to delete file');
    }

    showToast('File deleted successfully', 'success');
    currentFile = null;
    currentData = null;
    
    document.getElementById('editorContent').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">📄</div>
        <p>Select a file from the list to start editing</p>
      </div>
    `;
    
    await loadFileList();
  } catch (error) {
    console.error('Error deleting file:', error);
    showToast('Failed to delete file', 'error');
  }
}

/**
 * Create new category
 */
function createNewCategory() {
  const modal = document.createElement('div');
  modal.className = 'modal';
  modal.innerHTML = `
    <div class="modal-content">
      <div class="modal-title">Create New Category</div>
      <div class="modal-body">
        <div class="form-group">
          <label class="form-label">Category Name</label>
          <input type="text" class="form-input" id="categoryName" 
                 placeholder="e.g., weapons, armor, items" 
                 pattern="[a-zA-Z0-9_-]+" />
          <small style="color: var(--muted); font-size: 0.75rem;">
            Only letters, numbers, underscores, and hyphens allowed
          </small>
        </div>
        <div class="form-group">
          <label class="form-label">Initial Data Structure</label>
          <textarea class="json-editor" id="categoryData" rows="10">[]</textarea>
        </div>
      </div>
      <div class="modal-actions">
        <button class="btn btn-secondary" onclick="closeModal()">Cancel</button>
        <button class="btn btn-primary" onclick="saveNewCategory()">Create</button>
      </div>
    </div>
  `;
  
  document.body.appendChild(modal);
  modal.addEventListener('click', (e) => {
    if (e.target === modal) {
      closeModal();
    }
  });
}

/**
 * Save new category
 */
async function saveNewCategory() {
  const nameInput = document.getElementById('categoryName');
  const dataEditor = document.getElementById('categoryData');
  
  const name = nameInput.value.trim();
  const dataStr = dataEditor.value;
  
  if (!name) {
    showToast('Please enter a category name', 'error');
    return;
  }

  const filename = name.endsWith('.json') ? name : `${name}.json`;
  
  try {
    const data = JSON.parse(dataStr);
    
    const response = await fetch(`${API_BASE_URL}/data/save`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({
        name: filename,
        content: dataStr
      })
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to create category');
    }

    closeModal();
    showToast('Category created successfully', 'success');
    await loadFileList();
    selectFile(filename);
  } catch (error) {
    console.error('Error creating category:', error);
    showToast(`Failed to create category: ${error.message}`, 'error');
  }
}

/**
 * Handle file upload
 */
async function handleFileUpload(file) {
  if (!file.name.endsWith('.json')) {
    showToast('Please upload a JSON file', 'error');
    return;
  }

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    
    const formData = new FormData();
    formData.append('name', file.name);
    formData.append('file', file);

    const response = await fetch(`${API_BASE_URL}/data/upload`, {
      method: 'POST',
      body: formData
    });

    const result = await response.json();

    if (!result.success) {
      throw new Error(result.error || 'Failed to upload file');
    }

    showToast('File uploaded successfully', 'success');
    await loadFileList();
    selectFile(file.name);
  } catch (error) {
    console.error('Error uploading file:', error);
    showToast(`Failed to upload file: ${error.message}`, 'error');
  }
}

/**
 * Close modal
 */
function closeModal() {
  const modals = document.querySelectorAll('.modal');
  modals.forEach(modal => modal.remove());
}

/**
 * Show toast notification
 */
function showToast(message, type = 'success') {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.textContent = message;
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.remove();
  }, 4000);
}

/**
 * Format bytes to human readable
 */
function formatBytes(bytes) {
  if (bytes === 0) return '0 Bytes';
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i];
}

/**
 * Escape HTML
 */
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}
