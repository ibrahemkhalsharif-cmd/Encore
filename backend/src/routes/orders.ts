import { randomBytes } from 'node:crypto';
import { Router } from 'express';
import { z } from 'zod';
import { requireAuth } from '../auth';
import { query, withTransaction } from '../db';
import { fail } from '../errors';

export const ordersRouter = Router();

const newOrder = z.object({
  eventId: z.number().int().positive(),
  items: z
    .array(
      z.object({
        ticketTypeId: z.number().int().positive(),
        quantity: z.number().int().min(1).max(8),
      })
    )
    .min(1, 'Pick at least one ticket'),
});

ordersRouter.post('/', requireAuth, async (req, res) => {
  const { eventId, items } = newOrder.parse(req.body);

  const order = await withTransaction(async (tx) => {
    const event = await tx.query(
      'select id, starts_at from events where id = $1',
      [eventId]
    );
    if (!event.rows[0]) fail(404, 'Event not found');
    if (new Date(event.rows[0].starts_at) < new Date()) {
      fail(400, 'This event has already happened');
    }

    // Lock the ticket rows so two people can't grab the same last seat.
    const ids = items.map((i) => i.ticketTypeId);
    const { rows: tiers } = await tx.query<{
      id: number;
      price_cents: number;
      quantity: number;
      sold: number;
    }>(
      `select id, price_cents, quantity, sold
         from ticket_types
        where event_id = $1 and id = any($2::int[])
          for update`,
      [eventId, ids]
    );

    const tierById = new Map(tiers.map((t) => [t.id, t]));
    let total = 0;

    for (const item of items) {
      const tier = tierById.get(item.ticketTypeId);
      if (!tier) fail(400, 'One of those ticket types does not exist');
      const remaining = tier.quantity - tier.sold;
      if (item.quantity > remaining) {
        fail(409, remaining === 0
          ? 'Sold out — someone beat you to it'
          : `Only ${remaining} left at that tier`);
      }
      total += tier.price_cents * item.quantity;
    }

    const { rows: created } = await tx.query<{ id: number }>(
      `insert into orders (user_id, event_id, total_cents)
       values ($1, $2, $3) returning id`,
      [req.userId, eventId, total]
    );

    for (const item of items) {
      const tier = tierById.get(item.ticketTypeId)!;
      const { rows: inserted } = await tx.query<{ id: number }>(
        `insert into order_items (order_id, ticket_type_id, quantity, unit_price_cents)
         values ($1, $2, $3, $4) returning id`,
        [created[0].id, item.ticketTypeId, item.quantity, tier.price_cents]
      );
      // one ticket row per admission — each gets its own QR code
      for (let n = 0; n < item.quantity; n++) {
        await tx.query(
          'insert into tickets (order_item_id, code) values ($1, $2)',
          [inserted[0].id, randomBytes(5).toString('hex').toUpperCase()]
        );
      }
      await tx.query('update ticket_types set sold = sold + $1 where id = $2', [
        item.quantity,
        item.ticketTypeId,
      ]);
    }

    return { id: created[0].id, totalCents: total };
  });

  res.status(201).json({ order });
});

ordersRouter.get('/mine', requireAuth, async (req, res) => {
  const { rows } = await query(
    `select o.id, o.total_cents, o.created_at,
            e.title, e.slug, e.venue, e.city, e.starts_at, e.category,
            json_agg(json_build_object(
              'name', t.name,
              'quantity', i.quantity,
              'unitPriceCents', i.unit_price_cents
            )) as items
       from orders o
       join events e on e.id = o.event_id
       join order_items i on i.order_id = o.id
       join ticket_types t on t.id = i.ticket_type_id
      where o.user_id = $1
      group by o.id, e.id
      order by o.created_at desc`,
    [req.userId]
  );

  res.json({ orders: rows });
});
