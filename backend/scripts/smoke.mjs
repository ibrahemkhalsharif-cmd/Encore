// End-to-end smoke test against a running dev stack (`npm run dev` first).
// Creates throwaway users and an event each run, so it's dev-database only.
// The interesting check is the booking race: two users fire simultaneous
// orders for overlapping seats and exactly one should win.
const base = 'http://localhost:4000';

async function call(path, { method = 'GET', body, cookie } = {}) {
  const res = await fetch(base + path, {
    method,
    headers: {
      ...(body ? { 'Content-Type': 'application/json' } : {}),
      ...(cookie ? { Cookie: cookie } : {}),
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  const setCookie = res.headers.get('set-cookie');
  const data = await res.json().catch(() => ({}));
  return { status: res.status, data, cookie: setCookie?.split(';')[0] };
}

const results = [];
const check = (name, ok, detail = '') =>
  results.push(`${ok ? 'PASS' : 'FAIL'}  ${name}${detail ? ' — ' + detail : ''}`);

// 1. login as seeded demo organizer
const login = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'maya@example.com', password: 'letmein123' },
});
check('login demo user', login.status === 200 && !!login.cookie);

// 2. wrong password rejected
const badLogin = await call('/api/auth/login', {
  method: 'POST',
  body: { email: 'maya@example.com', password: 'wrongwrong' },
});
check('bad password rejected', badLogin.status === 401);

// 3. create an event
const created = await call('/api/events', {
  method: 'POST',
  cookie: login.cookie,
  body: {
    title: 'Backyard Film Night: 90s Classics',
    category: 'arts',
    description:
      'An open-air double feature under the string lights. Popcorn is on the house, projector starts at sundown.',
    venue: 'The Back Lot',
    city: 'Austin',
    startsAt: new Date(Date.now() + 12 * 86400_000).toISOString(),
    tickets: [
      { name: 'Lawn spot', priceCents: 1200, quantity: 60 },
      { name: 'Deck chair', priceCents: 2000, quantity: 10 },
    ],
  },
});
check('create event', created.status === 201, `slug=${created.data.event?.slug}`);

// 4. event detail is public
const detail = await call(`/api/events/${created.data.event.slug}`);
check(
  'event detail',
  detail.status === 200 && detail.data.event.tickets.length === 2
);

// The race below uses the freshly created 10-seat tier so the test is
// repeatable — seeded events lose inventory across runs.
const raceTier = detail.data.event.tickets.find((t) => t.name === 'Deck chair');

// 5. unauthenticated booking rejected
const noAuth = await call('/api/orders', {
  method: 'POST',
  body: { eventId: detail.data.event.id, items: [{ ticketTypeId: detail.data.event.tickets[0].id, quantity: 1 }] },
});
check('anonymous booking rejected', noAuth.status === 401);

// 6. concurrency: two users race for the last seats of a small tier
check('race tier found', !!raceTier, `remaining=${raceTier?.remaining}`);

const [u1, u2] = await Promise.all(
  ['rc1', 'rc2'].map((n) =>
    call('/api/auth/register', {
      method: 'POST',
      body: { name: `Race ${n}`, email: `${n}-${Date.now()}@example.com`, password: 'password123' },
    })
  )
);

const attempt = (cookie) =>
  call('/api/orders', {
    method: 'POST',
    cookie,
    body: {
      eventId: detail.data.event.id,
      items: [{ ticketTypeId: raceTier.id, quantity: 8 }],
    },
  });

const [r1, r2] = await Promise.all([attempt(u1.cookie), attempt(u2.cookie)]);
const statuses = [r1.status, r2.status].sort();
check(
  'double-booking blocked (one 201, one 409)',
  statuses[0] === 201 && statuses[1] === 409,
  `got ${r1.status} & ${r2.status} (${r2.data.error ?? r1.data.error ?? ''})`
);

// 7. remaining count is consistent afterwards
const after = await call(`/api/events/${created.data.event.slug}`);
const afterRow = after.data.event.tickets.find((t) => t.name === 'Deck chair');
check('remaining updated correctly', afterRow.remaining === raceTier.remaining - 8, `remaining=${afterRow.remaining}`);

// 8. orders list
const mine = await call('/api/orders/mine', { cookie: r1.status === 201 ? u1.cookie : u2.cookie });
check('my orders lists the booking', mine.status === 200 && mine.data.orders.length === 1);

// 9. host dashboard shows the new event
const host = await call('/api/host/events', { cookie: login.cookie });
const hosted = host.data.events?.find((e) => e.slug === created.data.event.slug);
check('host dashboard shows event', !!hosted, `capacity=${hosted?.capacity}`);

console.log(results.join('\n'));
if (results.some((r) => r.startsWith('FAIL'))) process.exit(1);
