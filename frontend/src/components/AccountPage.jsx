import React, { useState } from 'react';
import { deleteUser } from '../utils/api';
import './AccountPage.css';

export default function AccountPage({ user, token, onBack, onLogout, onAccountDeleted }) {
  const [password, setPassword] = useState('');
  const [confirmed, setConfirmed] = useState(false);
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState(null);
  const [showDeleteForm, setShowDeleteForm] = useState(false);

  const handleDeleteAccount = async (e) => {
    e.preventDefault();

    if (!password) {
      setError('Please enter your password to confirm deletion.');
      return;
    }

    if (!confirmed) {
      setError('Please confirm that you understand this action is permanent.');
      return;
    }

    setDeleting(true);
    setError(null);

    try {
      await deleteUser({ email: user.email, password }, token);
      onAccountDeleted?.();
    } catch (err) {
      setError(err.message || 'Failed to delete account. Please try again.');
    } finally {
      setDeleting(false);
    }
  };

  return (
    <div className="account-page">
      <header className="account-header">
        <button type="button" className="account-back-btn" onClick={onBack}>
          <svg viewBox="0 0 24 24" fill="none" aria-hidden="true">
            <path d="M15 18l-6-6 6-6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
          Back to Chat
        </button>
        <div className="account-header-info">
          <h1>Account Settings</h1>
          <p>Manage your profile and account preferences</p>
        </div>
      </header>

      <div className="account-body">
        <section className="account-profile-card">
          <div className="account-avatar">
            {user.username.charAt(0).toUpperCase()}
          </div>
          <div className="account-profile-details">
            <h2>{user.username}</h2>
            <p>{user.email}</p>
          </div>
        </section>

        <section className="account-section">
          <h3>Account Information</h3>
          <div className="account-info-grid">
            <div className="account-info-item">
              <span className="account-info-label">Username</span>
              <span className="account-info-value">{user.username}</span>
            </div>
            <div className="account-info-item">
              <span className="account-info-label">Email</span>
              <span className="account-info-value">{user.email}</span>
            </div>
          </div>
        </section>

        <section className="account-section">
          <h3>Session</h3>
          <p className="account-section-desc">Sign out of your account on this device.</p>
          <button type="button" className="account-logout-btn" onClick={onLogout}>
            Log Out
          </button>
        </section>

        <section className="account-section account-danger-zone">
          <h3>Danger Zone</h3>
          <p className="account-section-desc">
            Permanently delete your account and all associated data. This action cannot be undone.
          </p>

          {!showDeleteForm ? (
            <button
              type="button"
              className="account-delete-trigger"
              onClick={() => setShowDeleteForm(true)}
            >
              Delete Account
            </button>
          ) : (
            <form className="account-delete-form" onSubmit={handleDeleteAccount}>
              <label className="account-field-label" htmlFor="delete-password">
                Confirm your password
              </label>
              <input
                id="delete-password"
                type="password"
                className="account-field-input"
                placeholder="Enter your password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                disabled={deleting}
                autoComplete="current-password"
              />

              <label className="account-checkbox-label">
                <input
                  type="checkbox"
                  checked={confirmed}
                  onChange={(e) => setConfirmed(e.target.checked)}
                  disabled={deleting}
                />
                I understand this will permanently delete my account
              </label>

              {error && (
                <div className="account-error" role="alert">
                  <span>!</span>
                  <p>{error}</p>
                </div>
              )}

              <div className="account-delete-actions">
                <button
                  type="button"
                  className="account-cancel-btn"
                  onClick={() => {
                    setShowDeleteForm(false);
                    setPassword('');
                    setConfirmed(false);
                    setError(null);
                  }}
                  disabled={deleting}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="account-delete-btn"
                  disabled={deleting || !password || !confirmed}
                >
                  {deleting ? 'Deleting…' : 'Delete My Account'}
                </button>
              </div>
            </form>
          )}
        </section>
      </div>
    </div>
  );
}
