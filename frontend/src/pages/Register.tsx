import { useState, type FormEvent } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { ApiError } from '../api';
import { useAuth } from '../auth';

export function Register() {
  const { signUp } = useAuth();
  const navigate = useNavigate();
  const [params] = useSearchParams();

  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      await signUp(name, email, password);
      navigate(params.get('next') ?? '/');
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Sign up failed');
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <form className="auth-card" onSubmit={submit}>
        <h1>Create your account</h1>
        <label>
          Name
          <input
            value={name}
            onChange={(e) => setName(e.target.value)}
            autoComplete="name"
            required
          />
        </label>
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
            autoComplete="new-password"
            minLength={8}
            required
          />
        </label>
        {error && <p className="form-error">{error}</p>}
        <button className="btn wide" disabled={busy}>
          {busy ? 'Creating…' : 'Create account'}
        </button>
        <p className="muted">
          Already have one?{' '}
          <Link to={`/login${params.get('next') ? `?next=${encodeURIComponent(params.get('next')!)}` : ''}`}>
            Sign in
          </Link>
        </p>
      </form>
    </div>
  );
}
