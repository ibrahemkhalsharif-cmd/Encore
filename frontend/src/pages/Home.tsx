import { useEffect, useState } from 'react';
import { api } from '../api';
import { EventCard } from '../components/EventCard';
import { CATEGORIES, type EventSummary } from '../types';

export function Home() {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('');
  const [events, setEvents] = useState<EventSummary[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    const timer = setTimeout(() => {
      const params = new URLSearchParams();
      if (search) params.set('search', search);
      if (category) params.set('category', category);
      api
        .get<{ events: EventSummary[] }>(`/api/events?${params}`)
        .then((data) => {
          if (!cancelled) setEvents(data.events);
        })
        .catch(() => {
          if (!cancelled) setEvents([]);
        });
    }, 200);
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [search, category]);

  return (
    <div className="container">
      <section className="hero">
        <p className="eyebrow">Live events, big and small</p>
        <h1>
          Find your next <em>night out</em>.
        </h1>
        <p className="hero-sub">
          Concerts, comedy, workshops and pickup games — hosted by people in
          your city, ticketed without the circus.
        </p>
        <input
          className="search"
          type="search"
          placeholder="Search events, venues, cities…"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
        />
        <div className="chips">
          <button
            className={category === '' ? 'chip active' : 'chip'}
            onClick={() => setCategory('')}
          >
            All
          </button>
          {CATEGORIES.map((c) => (
            <button
              key={c.key}
              className={category === c.key ? 'chip active' : 'chip'}
              onClick={() => setCategory(category === c.key ? '' : c.key)}
            >
              {c.label}
            </button>
          ))}
        </div>
      </section>

      {events === null ? (
        <p className="muted center">Loading events…</p>
      ) : events.length === 0 ? (
        <div className="empty">
          <h3>Nothing on that bill yet</h3>
          <p className="muted">
            Try a different search — or sign in and host it yourself.
          </p>
        </div>
      ) : (
        <div className="event-grid">
          {events.map((ev) => (
            <EventCard key={ev.id} event={ev} />
          ))}
        </div>
      )}
    </div>
  );
}
