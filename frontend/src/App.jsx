import React, { useState, useEffect } from 'react';
import AuthPage from './components/AuthPage';
import ChatLayout from './components/ChatLayout';

function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check if user session is persisted
    const storedUser = localStorage.getItem('aura_chat_user');
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        localStorage.removeItem('aura_chat_user');
      }
    }
    setLoading(false);
  }, []);

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
