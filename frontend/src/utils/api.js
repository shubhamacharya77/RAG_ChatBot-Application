// API service for the authentication interface
const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to handle response and parse JSON error messages if available
 */
async function handleResponse(response) {
  const isJson = response.headers.get('content-type')?.includes('application/json');
  const data = isJson ? await response.json() : null;

  if (!response.ok) {
    const detail = data?.detail;
    const error =
      (typeof detail === 'object' && detail !== null && (detail.message || detail.error)) ||
      (typeof detail === 'string' && detail) ||
      data?.message ||
      data?.error ||
      response.statusText ||
      'An error occurred';
    throw new Error(error);
  }

  return data;
}
function getAuthHeaders(token) {
  return token ? { Authorization: `Bearer ${token}` } : {};
}

/**
 * Sends a registration request to the backend
 * @param {Object} credentials - The user registration data
 * @param {string} credentials.userName - Chosen username
 * @param {string} credentials.email - Chosen email
 * @param {string} credentials.password - Chosen password
 */
export async function registerUser(credentials) {
  const response = await fetch(`${BASE_URL}/register`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

/**
 * Sends a login request to the backend
 * @param {Object} credentials -The user login data
 * @param {string} credentials.email -User email or username
 * @param {string} credentials.password -User password
 */
export async function loginUser(credentials) {
  const response = await fetch(`${BASE_URL}/login`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}

/**
 * Uploads a document to the backend for RAG indexing
 * @param {File} file - The document file to upload
 */
export async function uploadDocument(file, token) {
  const formData = new FormData();
  // Backend expects the field name 'document'
  formData.append('document', file);

  const response = await fetch(`${BASE_URL}/upload_document`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
    },
    body: formData,
  });
  return handleResponse(response);
}

/**
 * Upload a document with progress callback using XHR (for UI progress bars)
 */
export async function uploadDocumentWithProgress(file, token, onProgress) {
  return new Promise((resolve, reject) => {
    const formData = new FormData();
    formData.append('document', file);
    const xhr = new XMLHttpRequest();
    xhr.open('POST', `${BASE_URL}/upload_document`);
    const authHeader = token ? `Bearer ${token}` : null;
    if (authHeader) xhr.setRequestHeader('Authorization', authHeader);
    xhr.upload.addEventListener('progress', (e) => {
      if (e.lengthComputable && typeof onProgress === 'function') {
        const percent = Math.round((e.loaded / e.total) * 100);
        onProgress(percent);
      }
    });
    xhr.onload = () => {
      if (xhr.status >= 200 && xhr.status < 300) {
        try {
          const data = JSON.parse(xhr.responseText);
          resolve(data);
        } catch {
          resolve(null);
        }
      } else {
        reject(new Error('Upload failed'));
      }
    };
    xhr.onerror = () => reject(new Error('Network error'));
    xhr.send(formData);
  });
}

/**
 * Fetches all documents for the current user
 * @param {string} token - Auth token
 */
export async function fetchDocuments(token) {
  const response = await fetch(`${BASE_URL}/show_documents`, {
    method: 'GET',
    headers: {
      ...getAuthHeaders(token),
    },
  });
  return handleResponse(response);
}

/**
 * Deletes a document by id
 * @param {string|number} documentId - Document identifier
 * @param {string} token - Auth token
 */
export async function deleteDocument(documentId, token) {
  const response = await fetch(`${BASE_URL}/delete_document?document_id=${documentId}`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
  });
  return handleResponse(response);
}

/**
 * Permanently deletes the user account
 * @param {Object} credentials
 * @param {string} credentials.email
 * @param {string} credentials.password
 * @param {string} token - Auth token
 */
export async function deleteUser(credentials, token) {
  const response = await fetch(`${BASE_URL}/delete_user`, {
    method: 'DELETE',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify(credentials),
  });
  return handleResponse(response);
}
