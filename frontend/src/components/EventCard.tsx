import { Link } from 'react-router-dom';
import { money, shortDate, time } from '../format';
import type { EventSummary } from '../types';
import { Cover } from './Cover';

export function EventCard({ event }: { event: EventSummary }) {
  return (
    <Link to={`/events/${event.slug}`} className="event-card">
      <Cover slug={event.slug} category={event.category}>
        <span className="cover-date">
          {shortDate(event.starts_at)} · {time(event.starts_at)}
        </span>
      </Cover>
      <div className="event-card-body">
        <h3>{event.title}</h3>
        <p className="muted">
          {event.venue} · {event.city}
        </p>
        <div className="event-card-foot">
          <span className="price">
            {event.min_price_cents === 0
              ? 'Free'
              : `From ${money(event.min_price_cents)}`}
          </span>
          {event.remaining > 0 && event.remaining <= 25 && (
            <span className="low-stock">Only {event.remaining} left</span>
          )}
          {event.remaining === 0 && <span className="low-stock">Sold out</span>}
        </div>
      </div>
    </Link>
  );
}
