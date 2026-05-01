import { useState, type FormEvent } from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';

interface LocationState {
  from?: { pathname: string };
}

export function LoginPage() {
  const { isAuthenticated, login } = useAuth();
  const location = useLocation();
  const from = (location.state as LocationState | null)?.from?.pathname ?? '/';

  const [username, setUsername] = useState('admin');
  const [password, setPassword] = useState('');
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  if (isAuthenticated) return <Navigate to={from} replace />;

  const handleSubmit = (event: FormEvent) => {
    event.preventDefault();
    setError(null);
    if (!username.trim() || !password) {
      setError('Enter both username and password.');
      return;
    }
    setSubmitting(true);
    const ok = login(username, password);
    setSubmitting(false);
    if (!ok) setError('Invalid credentials. Please try again.');
  };

  return (
    <div className="login">
      <form className="login__card" onSubmit={handleSubmit} noValidate>
        <div className="login__brand-sup">SAMS Engineering · Document System</div>
        <h1 className="login__title">Sign in</h1>
        <p className="login__subtitle">Single-user access · no backend.</p>

        <div className="sw-field">
          <label className="sw-label" htmlFor="login-username">Username</label>
          <input
            id="login-username"
            type="text"
            className="sw-input"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            autoComplete="username"
            autoFocus
          />
        </div>

        <div className="sw-field" style={{ marginTop: 16 }}>
          <label className="sw-label" htmlFor="login-password">Password</label>
          <input
            id="login-password"
            type="password"
            className="sw-input"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
          />
        </div>

        {error && <div className="login__error">{error}</div>}

        <button type="submit" className="sw-btn-primary login__submit" disabled={submitting}>
          {submitting ? 'Signing in…' : 'Sign in'}
        </button>
      </form>
    </div>
  );
}
