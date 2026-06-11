// Chat assistant API utilities
// Assumes token is stored in localStorage under the key 'token'
// All endpoints are POST requests and share the same BASE_URL defined in api.js
import { BASE_URL, getAuthHeaders, handleResponse } from "./api.js";

/**
 * Creates a new chat for the authenticated user.
 * @param {string} token - Auth token (usually from localStorage).
 * @returns {Promise<Object>} The newly created chat object containing chat_id, user_id, and chat_title.
 */
export async function createNewChat(token) {
  // Ensure token is still valid before making the request via auth headers.
  const response = await fetch(`${BASE_URL}/new_chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    // No body required – backend only needs the auth header.
    body: JSON.stringify({}),
  });
  return handleResponse(response);
}

/**
 * Retrieves recent conversations for the authenticated user.
 * @param {string} token - Auth token.
 * @returns {Promise<Array>} List of chats with chat_id, chat_title, created_at.
 */
export async function fetchRecentChats(token) {
  const response = await fetch(`${BASE_URL}/show_chats`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({}),
  });
  return handleResponse(response);
}

/**
 * Fetches all messages for a specific chat.
 * @param {string} token - Auth token.
 * @param {string|number} chatId - Identifier of the chat to retrieve messages for.
 * @returns {Promise<Array>} List of messages sorted by timestamp.
 */
export async function fetchChatMessages(token, chatId) {
  const response = await fetch(`${BASE_URL}/show_message`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ chat_id: chatId }),
  });
  return handleResponse(response);
}

/**
 * Sends a user query to the AI for a given chat.
 * @param {string} token - Auth token.
 * @param {string|number} chatId - Chat identifier.
 * @param {string} query - The user's message.
 * @returns {Promise<Object>} The AI's response object.
 */
export async function sendChatMessage(token, chatId, query) {
  const response = await fetch(`${BASE_URL}/chat`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      ...getAuthHeaders(token),
    },
    body: JSON.stringify({ chat_id: chatId, query }),
  });
  return handleResponse(response);
}
