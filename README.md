# Encore

A small event ticketing platform — think Eventbrite for gigs, workshops and
pickup games. People host events with tiered tickets, other people book them,
and the backend makes sure nobody ever sells the same seat twice.

Built with React, Node and PostgreSQL.

## Stack

- **Frontend** — React 19 + TypeScript, Vite, React Router. Plain CSS, no UI
  framework.
- **Backend** — Node + Express 5 (TypeScript), `node-postgres` with hand-written
  SQL. No ORM on purpose: the interesting parts of this project are the queries.
- **Database** — PostgreSQL. Auth uses bcrypt password hashing and a JWT in an
  httpOnly cookie.

## Running it

```
npm install
npm run dev
```

That's it. `npm run dev` starts three processes:

- an embedded PostgreSQL instance on port 5433 (real Postgres, runs as your
  user, data lives in `backend/.pgdata` — no Docker or system install needed)
- the API on port 4000
- Vite on port 5173, proxying `/api` to the API

The database is created, migrated and seeded with demo events on first boot.
There's a demo account if you want data in the dashboards:
`maya@example.com` / `letmein123`.

If you'd rather point it at your own Postgres (there's a `docker-compose.yml`
for that), set `DATABASE_URL` in `backend/.env` and run `npm run db:setup` once.

## How double-booking is prevented

The one genuinely tricky part of a ticketing system: two people buying the
last seat at the same time. Checking availability and then inserting the order
as separate steps is a race condition — both requests read "1 left" and both
succeed.

Bookings here run in a single transaction that starts by locking the relevant
ticket rows:

```sql
select id, price_cents, quantity, sold
  from ticket_types
 where event_id = $1 and id = any($2::int[])
   for update
```

`for update` makes the second transaction wait until the first commits, so it
re-reads the updated `sold` count and gets a clean `409 Sold out` instead of
overselling. A `check (sold <= quantity)` constraint on the table backs this up
at the schema level in case application code ever regresses.

There's a test for exactly this race: `npm run smoke` (with the dev
stack running) fires simultaneous orders from two users for overlapping seats —
one gets a 201, the other a 409.

## Project layout

```
backend/
  db/schema.sql        tables, constraints, indexes
  db/bootstrap.ts      idempotent migrate + seed
  src/routes/          auth, events, orders, host dashboards
  src/db.ts            pool + transaction helper
  scripts/devdb.ts     embedded Postgres for local dev
frontend/
  src/pages/           browse, event detail, auth, tickets, host
  src/components/      cards, covers, navbar
```

## API

| Method | Path                 | What                                      |
| ------ | -------------------- | ----------------------------------------- |
| POST   | `/api/auth/register` | create account, sets session cookie       |
| POST   | `/api/auth/login`    | sign in                                   |
| POST   | `/api/auth/logout`   | sign out                                  |
| GET    | `/api/auth/me`       | current user                              |
| GET    | `/api/events`        | upcoming events, `?search=` & `?category=`|
| GET    | `/api/events/:slug`  | event detail with live availability       |
| POST   | `/api/events`        | create event with ticket tiers (auth)     |
| POST   | `/api/orders`        | book tickets, transactional (auth)        |
| GET    | `/api/orders/mine`   | my tickets (auth)                         |
| GET    | `/api/host/events`   | my hosted events with sales (auth)        |

Validation is zod on every write endpoint; errors come back as
`{ "error": "message" }` with a sensible status code.

## Things I'd add next

- Stripe test-mode checkout in place of the instant booking
- Seat holds with expiry (reserve rows with a `held_until` column)
- Email confirmations through a job queue
- Full-text search (`tsvector`) once ILIKE stops being enough
