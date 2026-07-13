import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../auth';

export function Navbar() {
  const { user, ready, signOut } = useAuth();
  const navigate = useNavigate();

  const handleSignOut = async () => {
    await signOut();
    navigate('/');
  };

  return (
    <header className="site-header">
      <div className="container nav-row">
        <Link to="/" className="wordmark">
          encore.
        </Link>
        <nav className="nav-links">
          <NavLink to="/" end>
            Browse
          </NavLink>
          {user && <NavLink to="/tickets">My tickets</NavLink>}
          {user && <NavLink to="/host">Host</NavLink>}
        </nav>
        <div className="nav-auth">
          {!ready ? null : user ? (
            <>
              <span className="nav-user">{user.name.split(' ')[0]}</span>
              <button className="btn ghost" onClick={handleSignOut}>
                Sign out
              </button>
            </>
          ) : (
            <>
              <Link className="btn ghost" to="/login">
                Sign in
              </Link>
              <Link className="btn" to="/register">
                Create account
              </Link>
            </>
          )}
        </div>
      </div>
    </header>
  );
}
