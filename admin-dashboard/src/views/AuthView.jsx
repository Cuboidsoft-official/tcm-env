import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export function AuthView() {
  const { login, signup, loading } = useAuth();
  const [isSignup, setIsSignup] = useState(false);
  
  const [name, setName] = useState('');
  const [email, setEmail] = useState('admin@tcm.com');
  const [password, setPassword] = useState('password123');
  const [adminSecret, setAdminSecret] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      if (isSignup) {
        await signup(name, email, password, adminSecret);
      } else {
        await login(email, password);
      }
    } catch (err) {
      setError(err.message || 'Authentication failed');
    }
  };

  return (
    <div className="auth-page">
      <div className="auth-card">
        <div className="auth-header">
          <div className="brand-icon" style={{ margin: '0 auto', width: '56px', height: '56px', fontSize: '1.5rem' }}>
            TCM One
          </div>
          <h2>{isSignup ? 'Create Admin Account' : 'Admin Portal Login'}</h2>
          <p>{isSignup ? 'Register a new administrator for TCM One' : 'Enter your admin credentials to manage mentors & users'}</p>
        </div>

        {error && <div className="error-banner">{error}</div>}

        <form onSubmit={handleSubmit}>
          {isSignup && (
            <div className="form-group">
              <label className="form-label">Full Name</label>
              <input
                type="text"
                className="form-input"
                placeholder="e.g. Admin Controller"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
              />
            </div>
          )}

          <div className="form-group">
            <label className="form-label">Admin Email Address</label>
            <input
              type="email"
              className="form-input"
              placeholder="admin@tcm.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-input"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              required
            />
          </div>

          {isSignup && (
            <div className="form-group">
              <label className="form-label">Admin Registration Key (Optional)</label>
              <input
                type="password"
                className="form-input"
                placeholder="Key for security authorization"
                value={adminSecret}
                onChange={(e) => setAdminSecret(e.target.value)}
              />
            </div>
          )}

          <button type="submit" className="form-submit-btn" disabled={loading}>
            {loading ? 'Processing...' : isSignup ? 'Create Admin Account' : 'Log In to Dashboard'}
          </button>
        </form>

        <div className="auth-switch">
          {isSignup ? (
            <>
              Already have an account?{' '}
              <span className="auth-link" onClick={() => setIsSignup(false)}>
                Log In
              </span>
            </>
          ) : (
            <>
              Need to register a new admin?{' '}
              <span className="auth-link" onClick={() => setIsSignup(true)}>
                Create Account
              </span>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
