import type { ReactNode } from 'react';
import { Navigate, Route, Routes, useLocation } from 'react-router-dom';
import { useAuth } from './auth';
import { Navbar } from './components/Navbar';
import { EventPage } from './pages/EventPage';
import { Home } from './pages/Home';
import { HostDashboard } from './pages/HostDashboard';
import { Login } from './pages/Login';
import { MyTickets } from './pages/MyTickets';
import { NewEvent } from './pages/NewEvent';
import { Register } from './pages/Register';

function RequireAuth({ children }: { children: ReactNode }) {
  const { user, ready } = useAuth();
  const location = useLocation();

  if (!ready) return null;
  if (!user) {
    const next = encodeURIComponent(location.pathname);
    return <Navigate to={`/login?next=${next}`} replace />;
  }
  return children;
}

export function App() {
  return (
    <>
      <Navbar />
      <main>
        <Routes>
          <Route path="/" element={<Home />} />
          <Route path="/events/:slug" element={<EventPage />} />
          <Route path="/login" element={<Login />} />
          <Route path="/register" element={<Register />} />
          <Route
            path="/tickets"
            element={
              <RequireAuth>
                <MyTickets />
              </RequireAuth>
            }
          />
          <Route
            path="/host"
            element={
              <RequireAuth>
                <HostDashboard />
              </RequireAuth>
            }
          />
          <Route
            path="/host/new"
            element={
              <RequireAuth>
                <NewEvent />
              </RequireAuth>
            }
          />
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </main>
      <footer className="site-footer">
        <div className="container">
          <span className="wordmark small">encore.</span>
          <span>Live events, sold the honest way. React, Node & Postgres.</span>
        </div>
      </footer>
    </>
  );
}
