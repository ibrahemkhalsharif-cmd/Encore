import { useState, type FormEvent } from 'react';
import { useNavigate } from 'react-router-dom';
import { api, ApiError } from '../api';
import { CATEGORIES } from '../types';

type TierDraft = { name: string; price: string; quantity: string };

const emptyTier: TierDraft = { name: '', price: '', quantity: '' };

export function NewEvent() {
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [category, setCategory] = useState('music');
  const [description, setDescription] = useState('');
  const [venue, setVenue] = useState('');
  const [city, setCity] = useState('');
  const [startsAt, setStartsAt] = useState('');
  const [tiers, setTiers] = useState<TierDraft[]>([
    { name: 'General admission', price: '', quantity: '' },
  ]);
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const updateTier = (i: number, patch: Partial<TierDraft>) => {
    setTiers((ts) => ts.map((t, j) => (j === i ? { ...t, ...patch } : t)));
  };

  const submit = async (e: FormEvent) => {
    e.preventDefault();
    setBusy(true);
    setError('');
    try {
      const { event } = await api.post<{ event: { slug: string } }>(
        '/api/events',
        {
          title,
          category,
          description,
          venue,
          city,
          startsAt: new Date(startsAt).toISOString(),
          tickets: tiers.map((t) => ({
            name: t.name,
            priceCents: Math.round(parseFloat(t.price || '0') * 100),
            quantity: parseInt(t.quantity, 10),
          })),
        }
      );
      navigate(`/events/${event.slug}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : 'Could not create event');
      setBusy(false);
    }
  };

  return (
    <div className="container narrow">
      <h1 className="page-title">Host an event</h1>
      <form className="event-form" onSubmit={submit}>
        <label>
          Title
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="Warehouse Sessions Vol. 3"
            required
            minLength={3}
          />
        </label>

        <div className="form-row">
          <label>
            Category
            <select value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c.key} value={c.key}>
                  {c.label}
                </option>
              ))}
            </select>
          </label>
          <label>
            Date &amp; time
            <input
              type="datetime-local"
              value={startsAt}
              onChange={(e) => setStartsAt(e.target.value)}
              required
            />
          </label>
        </div>

        <div className="form-row">
          <label>
            Venue
            <input
              value={venue}
              onChange={(e) => setVenue(e.target.value)}
              placeholder="The Old Print Works"
              required
            />
          </label>
          <label>
            City
            <input
              value={city}
              onChange={(e) => setCity(e.target.value)}
              placeholder="Austin"
              required
            />
          </label>
        </div>

        <label>
          Description
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="What should people expect? Doors, lineup, what to bring…"
            required
            minLength={10}
          />
        </label>

        <fieldset className="tiers-editor">
          <legend>Ticket types</legend>
          {tiers.map((tier, i) => (
            <div className="tier-row" key={i}>
              <input
                value={tier.name}
                onChange={(e) => updateTier(i, { name: e.target.value })}
                placeholder="General admission"
                aria-label="Ticket name"
                required
              />
              <input
                type="number"
                value={tier.price}
                onChange={(e) => updateTier(i, { price: e.target.value })}
                placeholder="Price ($)"
                aria-label="Price in dollars"
                min={0}
                step="0.01"
                required
              />
              <input
                type="number"
                value={tier.quantity}
                onChange={(e) => updateTier(i, { quantity: e.target.value })}
                placeholder="Qty"
                aria-label="Quantity"
                min={1}
                required
              />
              {tiers.length > 1 && (
                <button
                  type="button"
                  className="tier-remove"
                  onClick={() => setTiers((ts) => ts.filter((_, j) => j !== i))}
                  aria-label="Remove ticket type"
                >
                  ×
                </button>
              )}
            </div>
          ))}
          {tiers.length < 6 && (
            <button
              type="button"
              className="btn ghost"
              onClick={() => setTiers((ts) => [...ts, { ...emptyTier }])}
            >
              Add another type
            </button>
          )}
        </fieldset>

        {error && <p className="form-error">{error}</p>}
        <button className="btn wide" disabled={busy}>
          {busy ? 'Publishing…' : 'Publish event'}
        </button>
      </form>
    </div>
  );
}
