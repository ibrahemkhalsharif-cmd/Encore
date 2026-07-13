import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { query, withTransaction } from '../db';
import { fail } from '../errors';

export const eventsRouter = Router();

export const CATEGORIES = [
  'music',
  'comedy',
  'arts',
  'food',
  'tech',
  'sports',
] as const;

eventsRouter.get('/', async (req, res) => {
  const search = typeof req.query.search === 'string' ? req.query.search.trim() : '';
  const category = typeof req.query.category === 'string' ? req.query.category : '';

  const { rows } = await query(
    `select e.id, e.slug, e.title, e.category, e.venue, e.city, e.starts_at,
            u.name as organizer,
            min(t.price_cents)::int as min_price_cents,
            sum(t.quantity - t.sold)::int as remaining
       from events e
       join users u on u.id = e.organizer_id
       join ticket_types t on t.event_id = e.id
      where e.starts_at > now()
        and ($1 = '' or e.category = $1)
        and ($2 = '' or e.title ilike '%' || $2 || '%'
                     or e.city ilike '%' || $2 || '%'
                     or e.venue ilike '%' || $2 || '%')
      group by e.id, u.name
      order by e.starts_at asc`,
    [category, search]
  );

  res.json({ events: rows });
});

eventsRouter.get('/:slug', async (req, res) => {
  const { rows } = await query(
    `select e.id, e.slug, e.title, e.description, e.category, e.venue, e.city,
            e.starts_at, u.name as organizer,
            coalesce(json_agg(json_build_object(
              'id', t.id,
              'name', t.name,
              'priceCents', t.price_cents,
              'remaining', t.quantity - t.sold
            ) order by t.price_cents) filter (where t.id is not null), '[]') as tickets
       from events e
       join users u on u.id = e.organizer_id
       left join ticket_types t on t.event_id = e.id
      where e.slug = $1
      group by e.id, u.name`,
    [req.params.slug]
  );

  if (!rows[0]) fail(404, 'Event not found');
  res.json({ event: rows[0] });
});

const newEvent = z.object({
  title: z.string().trim().min(3).max(120),
  description: z.string().trim().min(10).max(4000),
  category: z.enum(CATEGORIES),
  venue: z.string().trim().min(2).max(120),
  city: z.string().trim().min(2).max(80),
  startsAt: z.coerce.date().refine((d) => d.getTime() > Date.now(), {
    message: 'Event must be in the future',
  }),
  tickets: z
    .array(
      z.object({
        name: z.string().trim().min(1).max(60),
        priceCents: z.number().int().min(0).max(1_000_000),
        quantity: z.number().int().min(1).max(100_000),
      })
    )
    .min(1, 'Add at least one ticket type')
    .max(6),
});

const slugify = (title: string) =>
  title
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 60);

eventsRouter.post('/', requireAuth, async (req, res) => {
  const data = newEvent.parse(req.body);

  const event = await withTransaction(async (tx) => {
    let slug = slugify(data.title) || 'event';
    const clash = await tx.query('select 1 from events where slug = $1', [slug]);
    if (clash.rowCount) {
      slug = `${slug}-${Math.random().toString(36).slice(2, 6)}`;
    }

    const { rows } = await tx.query(
      `insert into events (organizer_id, slug, title, description, category, venue, city, starts_at)
       values ($1, $2, $3, $4, $5, $6, $7, $8)
       returning id, slug`,
      [
        req.userId,
        slug,
        data.title,
        data.description,
        data.category,
        data.venue,
        data.city,
        data.startsAt,
      ]
    );

    for (const t of data.tickets) {
      await tx.query(
        `insert into ticket_types (event_id, name, price_cents, quantity)
         values ($1, $2, $3, $4)`,
        [rows[0].id, t.name, t.priceCents, t.quantity]
      );
    }

    return rows[0];
  });

  res.status(201).json({ event });
});
