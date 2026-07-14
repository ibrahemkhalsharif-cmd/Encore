import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { query, withTransaction } from '../db';
import { fail } from '../errors';

export const ticketsRouter = Router();

ticketsRouter.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await query(
    `select t.id, t.code, t.checked_in_at,
            tt.name as tier,
            e.title, e.slug, e.venue, e.city, e.starts_at, e.category
       from tickets t
       join order_items oi on oi.id = t.order_item_id
       join orders o on o.id = oi.order_id
       join ticket_types tt on tt.id = oi.ticket_type_id
       join events e on e.id = tt.event_id
      where o.user_id = $1
      order by e.starts_at asc, t.id asc`,
    [req.userId]
  );

  res.json({ tickets: rows });
});

const checkinBody = z.object({
  code: z.string().trim().toUpperCase().min(4).max(32),
});

ticketsRouter.post('/checkin', requireAuth, async (req, res) => {
  const { code } = checkinBody.parse(req.body);

  const result = await withTransaction(async (tx) => {
    // Lock the ticket row so two door scanners can't both admit it.
    const { rows } = await tx.query(
      `select t.id, t.checked_in_at,
              e.organizer_id, e.title, e.starts_at,
              tt.name as tier, u.name as attendee
         from tickets t
         join order_items oi on oi.id = t.order_item_id
         join orders o on o.id = oi.order_id
         join users u on u.id = o.user_id
         join ticket_types tt on tt.id = oi.ticket_type_id
         join events e on e.id = tt.event_id
        where t.code = $1
          for update of t`,
      [code]
    );

    const ticket = rows[0];
    if (!ticket) fail(404, 'No ticket with that code');
    if (ticket.organizer_id !== req.userId) {
      fail(403, 'Only the event organizer can check tickets in');
    }
    if (ticket.checked_in_at) {
      fail(409, `Already checked in at ${new Date(ticket.checked_in_at).toLocaleTimeString('en-US')}`);
    }

    await tx.query('update tickets set checked_in_at = now() where id = $1', [
      ticket.id,
    ]);

    return {
      attendee: ticket.attendee,
      tier: ticket.tier,
      event: ticket.title,
    };
  });

  res.json({ checkedIn: result });
});
