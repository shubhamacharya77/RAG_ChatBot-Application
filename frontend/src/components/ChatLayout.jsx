import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import DocumentsPage from './DocumentsPage';
import AccountPage from './AccountPage';
import './ChatLayout.css';
import { createNewChat, fetchRecentChats, fetchChatMessages, sendChatMessage } from '../utils/api';

export default function ChatLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentView, setCurrentView] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const loadChats = async () => {
      if (!user?.token) return;
      try {
        const response = await fetchRecentChats(user.token);
        console.log('Fetched chats raw response:', response);

        // Handle cases where the backend returns an array directly, or wraps it in an object (e.g., { chats: [...] } or { data: [...] })
        const chatsArray = Array.isArray(response)
          ? response
          : (response?.chats || response?.data || response?.chat_list || []);

        if (Array.isArray(chatsArray)) {
          const formattedChats = chatsArray.map(c => ({
            id: String(c.chat_id),
            title: c.chat_title || 'New Conversation',
            date: c.created_at,
            messages: [], // Messages will be loaded when the chat is selected
          })).sort((a, b) => new Date(b.date) - new Date(a.date));
          setConversations(formattedChats);
          if (formattedChats.length > 0) {
            const firstId = formattedChats[0].id;
            setActiveChatId(firstId);

            // Automatically fetch messages for the first conversation
            try {
              setIsLoading(true);
              const msgResponse = await fetchChatMessages(user.token, firstId);
              const msgsArray = Array.isArray(msgResponse)
                ? msgResponse
                : (msgResponse?.messages || msgResponse?.data || msgResponse?.chat_messages || []);

              const firstChatMessages = msgsArray.map((msg, index) => ({
                id: msg.message_id || msg.id || `${firstId}-msg-${index}`,
                role: (msg.role?.toLowerCase() === 'human') ? 'user' : (msg.role?.toLowerCase() === 'ai' ? 'assistant' : msg.role),
                content: msg.message_content || msg.content || '',
                timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
              }));

              setConversations(prev => prev.map(chat =>
                chat.id === firstId ? { ...chat, messages: firstChatMessages } : chat
              ));
            } catch (err) {
              console.error('Failed to fetch first chat messages:', err);
            } finally {
              setIsLoading(false);
            }
          }
        } else {
          console.error("Expected an array of chats but got:", typeof chatsArray);
        }
      } catch (err) {
        console.error('Failed to fetch recent chats:', err);
      }
    };
    loadChats();
  }, [user?.token]);

  useEffect(() => {
    const stored = localStorage.getItem(`aura_docs_${user.email}`);
    if (stored) {
      try {
        setDocuments(JSON.parse(stored));
      } catch {
        localStorage.removeItem(`aura_docs_${user.email}`);
      }
    }
  }, [user.email]);

  useEffect(() => {
    localStorage.setItem(`aura_docs_${user.email}`, JSON.stringify(documents));
  }, [documents, user.email]);

  const handleDocumentsChange = useCallback((updater) => {
    setDocuments(typeof updater === 'function' ? updater : updater);
  }, []);

  const activeChat = conversations.find((c) => c.id === activeChatId);

  const handleNewChat = async () => {
    // Prevent duplicate constraint by re-using any existing empty chat
    const existingEmptyChat = conversations.find(c => c.title === 'New Conversation');
    if (existingEmptyChat) {
      handleSelectChat(existingEmptyChat.id);
      return;
    }

    try {
      // 1. Ask backend to create the chat
      await createNewChat(user?.token);

      // 2. Fetch the entire chat list from the server to guarantee we get the newly created chat 
      // without worrying about the exact JSON structure returned by createNewChat.
      const chatsResponse = await fetchRecentChats(user?.token);
      const chatsList = Array.isArray(chatsResponse)
        ? chatsResponse
        : (chatsResponse?.chats || chatsResponse?.data || chatsResponse?.chat_list || []);

      if (Array.isArray(chatsList)) {
        const sorted = chatsList.map(serverChat => {
          const stringId = String(serverChat.chat_id);
          const existing = conversations.find(c => c.id === stringId);
          return {
            id: stringId,
            title: serverChat.chat_title || 'New Conversation',
            date: serverChat.created_at,
            messages: existing ? existing.messages : [],
          };
        }).sort((a, b) => new Date(b.date) - new Date(a.date));

        setConversations(sorted);

        // 3. Switch view and activate the newest chat (the one we just created)
        setCurrentView('chat');
        if (sorted.length > 0) {
          handleSelectChat(sorted[0].id);
        }
      }

    } catch (err) {
      console.error('Failed to create new chat:', err);
      alert('Failed to create a new chat on the server. Please try again.');
    }
  };



  const handleSelectChat = async (id) => {
    setCurrentView('chat');
    setActiveChatId(id);

    // Fetch messages for the selected chat
    try {
      setIsLoading(true);
      const response = await fetchChatMessages(user?.token, id);
      console.log('Fetched messages raw response:', response);

      const messagesArray = Array.isArray(response)
        ? response
        : (response?.messages || response?.data || response?.chat_messages || []);

      const formattedMessages = messagesArray.map((msg, index) => ({
        id: msg.message_id || msg.id || `${id}-msg-${index}`,
        // Map backend 'human' and 'ai' (or 'Human'/'AI') to the roles our UI expects
        role: (msg.role?.toLowerCase() === 'human') ? 'user' : (msg.role?.toLowerCase() === 'ai' ? 'assistant' : msg.role),
        content: msg.message_content || msg.content || '',
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
      }));

      setConversations(prev => prev.map(chat =>
        chat.id === id ? { ...chat, messages: formattedMessages } : chat
      ));
    } catch (err) {
      console.error('Failed to fetch messages:', err);
    } finally {
      setIsLoading(false);
    }
  };

  // UI‑only removal of a conversation from the list
  const handleRemoveChat = (id, e) => {
    // Prevent the click from also selecting the chat
    e.stopPropagation();
    setConversations(prev => prev.filter(chat => chat.id !== id));
    // If the removed chat was active, clear active selection
    if (activeChatId === id) {
      setActiveChatId(null);
    }
  };

  const handleSendMessage = async (content) => {
    if (!activeChatId) return;

    const userMessage = {
      id: `${Date.now()}-user`,
      role: 'user',
      content,
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((chat) => {
        if (chat.id !== activeChatId) return chat;
        const isFirstMessage = chat.messages.length === 0;
        return {
          ...chat,
          title: isFirstMessage ? content.slice(0, 40) + (content.length > 40 ? '…' : '') : chat.title,
          messages: [...chat.messages, userMessage],
        };
      })
    );

    setIsLoading(true);

    try {
      // Send message to the backend
      const response = await sendChatMessage(user?.token, activeChatId, content);
      console.log('AI response raw:', response);

      // Now that the backend has processed the message and created real DB IDs,
      // re-fetch the entire message history for this chat so we have the official IDs.
      const msgsResponse = await fetchChatMessages(user?.token, activeChatId);
      const msgsArray = Array.isArray(msgsResponse)
        ? msgsResponse
        : (msgsResponse?.messages || msgsResponse?.data || msgsResponse?.chat_messages || []);

      const formattedMessages = msgsArray.map((msg, index) => ({
        id: msg.message_id || msg.id || `${activeChatId}-msg-${index}`,
        role: (msg.role?.toLowerCase() === 'human') ? 'user' : (msg.role?.toLowerCase() === 'ai' ? 'assistant' : msg.role),
        content: msg.message_content || msg.content || '',
        timestamp: msg.created_at || msg.timestamp || new Date().toISOString(),
      }));

      // Overwrite the optimistic state with the true backend state
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: formattedMessages }
            : chat
        )
      );

      // Finally, sync the sidebar to ensure the chat title matches the backend's official renamed title
      try {
        const chatsResponse = await fetchRecentChats(user?.token);
        const chatsList = Array.isArray(chatsResponse)
          ? chatsResponse
          : (chatsResponse?.chats || chatsResponse?.data || chatsResponse?.chat_list || []);

        if (Array.isArray(chatsList)) {
          setConversations(currentPrev => {
            const mapped = chatsList.map(serverChat => {
              const stringId = String(serverChat.chat_id);
              const existing = currentPrev.find(c => c.id === stringId);
              return {
                id: stringId,
                title: serverChat.chat_title || 'New Conversation',
                date: serverChat.created_at,
                // Preserve the messages if we already loaded them
                messages: existing ? existing.messages : [],
              };
            });
            return mapped.sort((a, b) => new Date(b.date) - new Date(a.date));
          });
        }
      } catch (sidebarErr) {
        console.error('Failed to sync sidebar after message:', sidebarErr);
      }
    } catch (err) {
      console.error('Failed to send message:', err);
      const errorMessage = {
        id: `${Date.now()}-error`,
        role: 'assistant',
        content: "Sorry, I encountered an error while communicating with the server.",
        timestamp: new Date().toISOString(),
      };
      setConversations((prev) =>
        prev.map((chat) =>
          chat.id === activeChatId
            ? { ...chat, messages: [...chat.messages, errorMessage] }
            : chat
        )
      );
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="chat-layout">
      {/* Sidebar Placeholder */}
      <aside className={`sidebar-container ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="brand-logo">
            <span className="logo-icon">✦</span>
            <span className="logo-text">AuraChat</span>
          </div>
          <button
            className={`upload-document-btn ${currentView === 'documents' ? 'active' : ''}`}
            onClick={() => setCurrentView('documents')}
          >
            <span className="upload-icon" aria-hidden="true">
              <svg viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                <path
                  d="M12 4v10M12 4l-3.5 3.5M12 4l3.5 3.5"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
                <path
                  d="M5 18h14a2 2 0 0 0 2-2v-1.5a2 2 0 0 0-2-2H5a2 2 0 0 0-2 2V16a2 2 0 0 0 2 2z"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </span>
            My Documents
          </button>
          <button
            className={`new-chat-btn ${currentView === 'chat' ? 'active' : ''}`}
            onClick={handleNewChat}
          >
            <span className="plus-icon">+</span> New Chat
          </button>
        </div>

        <div className="conversations-list">
          <div className="section-label">Recent Conversations</div>
          {conversations.length === 0 ? (
            <div className="no-chats">No conversations yet</div>
          ) : (
            conversations.map((chat) => (
              <div
                key={chat.id}
                className={`conversation-item ${activeChatId === chat.id ? 'active' : ''}`}
                onClick={() => handleSelectChat(chat.id)}
              >
                <span className="chat-icon">💬</span>
                <span className="chat-title">{chat.title}</span>
                <button
                  className="remove-chat-btn"
                  onClick={(e) => handleRemoveChat(chat.id, e)}
                  title="Remove conversation"
                >✕</button>
              </div>
            ))
          )}
        </div>

        <div className="sidebar-footer">
          <button
            type="button"
            className={`user-profile ${currentView === 'account' ? 'active' : ''}`}
            onClick={() => setCurrentView('account')}
            title="Account settings"
          >
            <div className="user-avatar">
              {user.username.charAt(0).toUpperCase()}
            </div>
            <div className="user-details">
              <span className="user-name">{user.username}</span>
              <span className="user-email">{user.email}</span>
            </div>
          </button>
          <button className="logout-btn" onClick={onLogout} title="Log Out">
            🚪
          </button>
        </div>
      </aside>

      {/* Main Content */}
      <section className="main-chat-container">
        {currentView === 'documents' ? (
          <DocumentsPage
            documents={documents}
            onDocumentsChange={handleDocumentsChange}
            onBack={() => setCurrentView('chat')}
            token={user?.token}
          />
        ) : currentView === 'account' ? (
          <AccountPage
            user={user}
            onBack={() => setCurrentView('chat')}
            token={user?.token}
            onLogout={onLogout}
            onAccountDeleted={() => {
              localStorage.removeItem(`aura_docs_${user.email}`);
              onLogout();
            }}
          />
        ) : (
          <>
            <header className="chat-header">
              <button
                className="toggle-sidebar-btn"
                onClick={() => setSidebarOpen(!sidebarOpen)}
                aria-label="Toggle Sidebar"
              >
                ☰
              </button>
              <div className="current-chat-info">
                <h2>
                  {activeChatId
                    ? conversations.find(c => c.id === activeChatId)?.title
                    : 'Welcome to AuraChat'}
                </h2>
                <span className="chat-subtitle">RAG Assistant Active</span>
              </div>
            </header>

            {activeChatId ? (
              <ChatInterface
                messages={activeChat?.messages ?? []}
                onSendMessage={handleSendMessage}
                isLoading={isLoading}
                user={user}
              />
            ) : (
              <div className="chat-content-placeholder">
                <div className="glow-circle glow-1"></div>
                <div className="glow-circle glow-2"></div>

                <div className="welcome-banner">
                  <div className="welcome-icon">✦</div>
                  <h1>How can I help you today, {user.username}?</h1>
                  <p>Ask questions about your uploaded documents or start a general query.</p>
                  <button className="welcome-new-chat-btn" onClick={handleNewChat}>
                    <span className="plus-icon">+</span> Start New Chat
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </section>
    </div>
  );
}
