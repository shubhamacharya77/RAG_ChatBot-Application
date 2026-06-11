// API service for the authentication interface
// Token handling utilities

/**
 * Decode a base64url-encoded string.
 */
function base64UrlDecode(str) {
  // Replace URL-safe characters and pad with '='
  let base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  while (base64.length % 4) base64 += '=';
  try {
    return atob(base64);
  } catch (e) {
    return null;
  }
}

/**
 * Parse a JWT and return its payload as an object.
 * Returns null if the token is not a valid JWT.
 */
function parseJwt(token) {
  if (!token) return null;
  const parts = token.split('.');
  if (parts.length !== 3) return null;
  const payload = base64UrlDecode(parts[1]);
  if (!payload) return null;
  try {
    return JSON.parse(payload);
  } catch (e) {
    return null;
  }
}

/**
 * Determine whether a JWT token is expired.
 * If the token does not contain an `exp` claim, we assume it does not expire.
 */
export function isTokenExpired(token) {
  const payload = parseJwt(token);
  if (!payload) return false; // Non‑JWT or malformed token – treat as non‑expiring
  if (typeof payload.exp !== 'number') return false;
  // `exp` is expressed in seconds since epoch
  const nowSec = Math.floor(Date.now() / 1000);
  return nowSec >= payload.exp;
}

/**
 * Ensure the provided token is still valid.
 * Throws an explicit error that can be caught by callers.
 */
function ensureValidToken(token) {
  if (!token) return; // No token means unauthenticated request – callers handle it.
  if (isTokenExpired(token)) {
    throw new Error('TokenExpired');
  }
}

export const BASE_URL = import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000/api';

/**
 * Helper to handle response and parse JSON error messages if available
 */
export async function handleResponse(response) {
  let data = null;
  const text = await response.text();
  if (text) {
    try {
      data = JSON.parse(text);
    } catch (err) {
      data = { message: text }; // fallback if it's not valid JSON
    }
  }

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
export function getAuthHeaders(token) {
  // Validate token before attaching it to the request.
  try {
    ensureValidToken(token);
    return { Authorization: `Bearer ${token}` };
  } catch (err) {
    // Token is expired – return empty headers so the backend will reject.
    if (err.message === 'TokenExpired') {
      console.warn('Auth token expired; user needs to re‑login');
    }
    return {};
  }
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
  // Ensure token has not expired before proceeding.
  ensureValidToken(token);
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
  // Verify token validity first.
  ensureValidToken(token);
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
  // Validate token before fetching documents.
  ensureValidToken(token);
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
  // Ensure token is still valid.
  ensureValidToken(token);
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
  // Verify token before attempting account deletion.
  ensureValidToken(token);
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

/* ----------------------------------------------------------------
   Chat‑assistant endpoints
   ---------------------------------------------------------------- */

/** Create a new chat for the authenticated user.
 *  @param {string} token - JWT token
 *  @returns {Promise<Object>} chat metadata (chat_id, user_id, chat_title)
 */
export async function createNewChat(token, title) {
  // `title` is optional; if omitted the backend will use its default value.
  ensureValidToken(token);
  const body = title ? { chat_title: title } : undefined;
  const response = await fetch(`${BASE_URL}/new_chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  return handleResponse(response);
}

/** Fetch all recent conversations for the user.
 *  @param {string} token - JWT token
 *  @returns {Promise<Array>} list of chats [{chat_id, chat_title, created_at}, …]
 */
export async function fetchRecentChats(token) {
  ensureValidToken(token);
  const response = await fetch(`${BASE_URL}/show_chats`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
    },
  });
  return handleResponse(response);
}

/** Get all messages for a specific chat.
 *  @param {string} token - JWT token
 *  @param {string|number} chatId - ID returned from fetchRecentChats
 *  @returns {Promise<Array>} list of messages [{role, content, …}, …] sorted by time
 */
export async function fetchChatMessages(token, chatId) {
  ensureValidToken(token);
  // Send the chat_id as a query parameter, but use POST as the method
  const response = await fetch(`${BASE_URL}/show_message?chat_id=${encodeURIComponent(chatId)}`, {
    method: 'POST',
    headers: {
      ...getAuthHeaders(token),
    },
  });
  return handleResponse(response);
}

/** Send a user query to the AI for a given chat.
 *  @param {string} token - JWT token
 *  @param {string|number} chatId - Target chat ID
 *  @param {string} query - User message
 *  @returns {Promise<Object>} AI response JSON
 */
export async function sendChatMessage(token, chatId, query) {
  ensureValidToken(token);
  const response = await fetch(`${BASE_URL}/chat`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ chat_id: chatId, query }),
  });
  return handleResponse(response);
}

