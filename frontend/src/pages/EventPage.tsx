import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { api, ApiError } from '../api';
import { useAuth } from '../auth';
import { Cover } from '../components/Cover';
import { longDate, money, time } from '../format';
import type { EventDetail } from '../types';

export function EventPage() {
  const { slug } = useParams();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [event, setEvent] = useState<EventDetail | null>(null);
  const [missing, setMissing] = useState(false);
  const [quantities, setQuantities] = useState<Record<number, number>>({});
  const [booking, setBooking] = useState(false);
  const [error, setError] = useState('');
  const [orderId, setOrderId] = useState<number | null>(null);

  useEffect(() => {
    api
      .get<{ event: EventDetail }>(`/api/events/${slug}`)
      .then((data) => setEvent(data.event))
      .catch(() => setMissing(true));
  }, [slug]);

  if (missing) {
    return (
      <div className="container narrow">
        <div className="empty">
          <h3>That event doesn't exist</h3>
          <Link to="/">Back to browsing</Link>
        </div>
      </div>
    );
  }

  if (!event) return null;

  const setQty = (id: number, delta: number, max: number) => {
    setQuantities((q) => {
      const next = Math.min(Math.max((q[id] ?? 0) + delta, 0), Math.min(max, 8));
      return { ...q, [id]: next };
    });
  };

  const items = event.tickets
    .map((t) => ({ ticketTypeId: t.id, quantity: quantities[t.id] ?? 0 }))
    .filter((i) => i.quantity > 0);

  const total = event.tickets.reduce(
    (sum, t) => sum + t.priceCents * (quantities[t.id] ?? 0),
    0
  );

  const book = async () => {
    if (!user) {
      navigate(`/login?next=${encodeURIComponent(`/events/${slug}`)}`);
      return;
    }
    setBooking(true);
    setError('');
    try {
      const data = await api.post<{ order: { id: number } }>('/api/orders', {
        eventId: event.id,
        items,
      });
      setOrderId(data.order.id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Booking failed');
      // Quantities may be stale after a conflict, refresh the numbers.
      const fresh = await api.get<{ event: EventDetail }>(`/api/events/${slug}`);
      setEvent(fresh.event);
    } finally {
      setBooking(false);
    }
  };

  return (
    <div className="container">
      <Cover slug={event.slug} category={event.category} tall />
      <div className="event-layout">
        <div className="event-info">
          <h1>{event.title}</h1>
          <p className="muted">
            Hosted by {event.organizer}
          </p>
          <dl className="event-facts">
            <div>
              <dt>When</dt>
              <dd>
                {longDate(event.starts_at)}, {time(event.starts_at)}
              </dd>
            </div>
            <div>
              <dt>Where</dt>
              <dd>
                {event.venue}, {event.city}
              </dd>
            </div>
          </dl>
          <p className="event-description">{event.description}</p>
        </div>

        <aside className="booking-card">
          {orderId ? (
            <div className="booking-done">
              <h3>You're in.</h3>
              <p>
                Order <strong>#{orderId}</strong> is confirmed. See you at{' '}
                {event.venue}.
              </p>
              <Link className="btn" to="/tickets">
                View my tickets
              </Link>
            </div>
          ) : (
            <>
              <h3>Tickets</h3>
              {event.tickets.map((t) => (
                <div className="tier" key={t.id}>
                  <div className="tier-info">
                    <span className="tier-name">{t.name}</span>
                    <span className="muted">
                      {money(t.priceCents)}
                      {t.remaining <= 15 &&
                        t.remaining > 0 &&
                        ` · ${t.remaining} left`}
                      {t.remaining === 0 && ' · sold out'}
                    </span>
                  </div>
                  <div className="stepper">
                    <button
                      onClick={() => setQty(t.id, -1, t.remaining)}
                      disabled={(quantities[t.id] ?? 0) === 0}
                      aria-label={`Fewer ${t.name}`}
                    >
                      −
                    </button>
                    <span>{quantities[t.id] ?? 0}</span>
                    <button
                      onClick={() => setQty(t.id, 1, t.remaining)}
                      disabled={(quantities[t.id] ?? 0) >= Math.min(t.remaining, 8)}
                      aria-label={`More ${t.name}`}
                    >
                      +
                    </button>
                  </div>
                </div>
              ))}
              <div className="booking-total">
                <span>Total</span>
                <strong>{total === 0 && items.length === 0 ? '—' : money(total)}</strong>
              </div>
              {error && <p className="form-error">{error}</p>}
              <button
                className="btn wide"
                disabled={items.length === 0 || booking}
                onClick={book}
              >
                {booking ? 'Booking…' : user ? 'Book tickets' : 'Sign in to book'}
              </button>
            </>
          )}
        </aside>
      </div>
    </div>
  );
}
