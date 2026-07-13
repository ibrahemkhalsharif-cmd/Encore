import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { money, shortDate } from '../format';
import { categoryLabel, type HostEvent } from '../types';

export function HostDashboard() {
  const [events, setEvents] = useState<HostEvent[] | null>(null);

  useEffect(() => {
    api
      .get<{ events: HostEvent[] }>('/api/host/events')
      .then((data) => setEvents(data.events))
      .catch(() => setEvents([]));
  }, []);

  if (events === null) {
    return <p className="muted center">Loading your events…</p>;
  }

  const totalSold = events.reduce((n, e) => n + e.sold, 0);
  const totalRevenue = events.reduce((n, e) => n + e.revenue_cents, 0);

  return (
    <div className="container">
      <div className="page-head">
        <h1 className="page-title">Your events</h1>
        <Link className="btn" to="/host/new">
          New event
        </Link>
      </div>

      {events.length === 0 ? (
        <div className="empty">
          <h3>You haven't hosted anything yet</h3>
          <p className="muted">
            Put something on — a gig, a workshop, a five-a-side cup. It takes
            about a minute.
          </p>
          <Link className="btn" to="/host/new">
            Create your first event
          </Link>
        </div>
      ) : (
        <>
          <div className="stats-row">
            <div className="stat">
              <span className="stat-value">{events.length}</span>
              <span className="muted">events</span>
            </div>
            <div className="stat">
              <span className="stat-value">{totalSold}</span>
              <span className="muted">tickets sold</span>
            </div>
            <div className="stat">
              <span className="stat-value">{money(totalRevenue) === 'Free' ? '$0' : money(totalRevenue)}</span>
              <span className="muted">revenue</span>
            </div>
          </div>

          <div className="host-list">
            {events.map((ev) => {
              const pct = ev.capacity ? Math.round((ev.sold / ev.capacity) * 100) : 0;
              return (
                <article className="host-row" key={ev.id}>
                  <div className="host-row-info">
                    <h3>
                      <Link to={`/events/${ev.slug}`}>{ev.title}</Link>
                    </h3>
                    <p className="muted">
                      {shortDate(ev.starts_at)} · {ev.venue}, {ev.city} ·{' '}
                      {categoryLabel(ev.category)}
                    </p>
                  </div>
                  <div className="host-row-sales">
                    <div className="progress">
                      <div className="progress-fill" style={{ width: `${pct}%` }} />
                    </div>
                    <span className="muted">
                      {ev.sold} / {ev.capacity} sold ·{' '}
                      {ev.revenue_cents === 0 ? '$0' : money(ev.revenue_cents)}
                    </span>
                  </div>
                </article>
              );
            })}
          </div>
        </>
      )}
    </div>
  );
}
