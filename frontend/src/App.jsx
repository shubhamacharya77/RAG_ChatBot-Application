import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import ChatLayout from './components/ChatLayout';
import { isTokenExpired } from './utils/api';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check persisted session
    const storedUser = localStorage.getItem('aura_chat_user');
    if (storedUser) {
      try {
        const parsed = JSON.parse(storedUser);
        // If token exists and is expired, clear it
        if (parsed?.token && isTokenExpired(parsed.token)) {
          localStorage.removeItem('aura_chat_user');
        } else {
          setUser(parsed);
        }
      } catch (e) {
        localStorage.removeItem('aura_chat_user');
      }
    }
    setLoading(false);
  }, []);

  // Auto-logout when token expires during session
  useEffect(() => {
    if (user?.token && isTokenExpired(user.token)) {
      handleLogout();
    }
  }, [user]);

  const handleLoginSuccess = (userData) => {
    setUser(userData);
    localStorage.setItem('aura_chat_user', JSON.stringify(userData));
  };

  const handleLogout = () => {
    if (user?.email) {
      localStorage.removeItem(`aura_docs_${user.email}`);
    }
    setUser(null);
    localStorage.removeItem('aura_chat_user');
  };

  if (loading) {
    return (
      <div style={{
        height: '100vh',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        background: '#0a0a16',
        color: '#fff',
        fontFamily: 'system-ui, sans-serif'
      }}>
        <div className="spinner">Loading...</div>
      </div>
    );
  }

  return (
    <main style={{ height: '100vh', overflow: 'hidden' }}>
      {user ? (
        <ChatLayout user={user} onLogout={handleLogout} />
      ) : (
        <AuthPage onLoginSuccess={handleLoginSuccess} />
      )}
    </main>
  );
}

export default App;
