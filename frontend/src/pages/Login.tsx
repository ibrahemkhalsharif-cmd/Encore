import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth';

export function Login() {
  const { signIn } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signIn(email, password);
      navigate(params.get('next') ?? '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign in failed');
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <form className="auth-card" onSubmit={submit}>
        <h1>Welcome back</h1>
        <label>
          Email
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            autoComplete="email"
            required
          />
        </label>
        <label>
          Password
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="current-password"
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn wide" disabled={busy}>
          {busy ? 'Signing in…' : 'Sign in'}
        </button>
        <p className="muted">
          New here?{' '}
          <Link to={`/register${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`}>
            Create an account
          </Link>
        </p>
        <p className="muted demo-hint">
          Just looking? Try the demo account — maya@example.com / letmein123
        </p>
      </form>
    </div>
  );
}
