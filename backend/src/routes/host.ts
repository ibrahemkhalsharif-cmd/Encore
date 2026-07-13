import { Router } from 'express';
import { requireAuth } from '../auth';
import { query } from '../db';

export const hostRouter = Router();

hostRouter.get('/events', requireAuth, async (req, res) => {
  const { rows } = await query(
    `select e.id, e.slug, e.title, e.category, e.venue, e.city, e.starts_at,
            coalesce(sum(t.sold), 0)::int as sold,
            coalesce(sum(t.quantity), 0)::int as capacity,
            coalesce(sum(t.sold * t.price_cents), 0)::int as revenue_cents
       from events e
       left join ticket_types t on t.event_id = e.id
      where e.organizer_id = $1
      group by e.id
      order by e.starts_at asc`,
    [req.userId]
  );

  res.json({ events: rows });
});
