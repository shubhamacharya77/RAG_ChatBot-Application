import React, { useState, useEffect, useCallback } from 'react';
import ChatInterface from './ChatInterface';
import DocumentsPage from './DocumentsPage';
import AccountPage from './AccountPage';
import './ChatLayout.css';

export default function ChatLayout({ user, onLogout }) {
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeChatId, setActiveChatId] = useState(null);
  const [conversations, setConversations] = useState([]);
  const [currentView, setCurrentView] = useState('chat');
  const [documents, setDocuments] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

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

  const handleNewChat = () => {
    const newChat = {
      id: Date.now().toString(),
      title: 'New Conversation',
      date: 'Just now',
      messages: [],
    };
    setCurrentView('chat');
    setConversations([newChat, ...conversations]);
    setActiveChatId(newChat.id);
  };

  const handleSelectChat = (id) => {
    setCurrentView('chat');
    setActiveChatId(id);
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

    // Placeholder response until chat API is connected
    await new Promise((resolve) => setTimeout(resolve, 800));

    const assistantMessage = {
      id: `${Date.now()}-assistant`,
      role: 'assistant',
      content:
        'Thanks for your message! I\'m ready to help you with your documents. Connect the chat API to get real RAG-powered responses.',
      timestamp: new Date().toISOString(),
    };

    setConversations((prev) =>
      prev.map((chat) =>
        chat.id === activeChatId
          ? { ...chat, messages: [...chat.messages, assistantMessage] }
          : chat
      )
    );

    setIsLoading(false);
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
