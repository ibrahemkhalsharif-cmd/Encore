import bcrypt from 'bcryptjs';
import { readFileSync } from 'node:fs';
import pg from 'pg';

const schemaPath = new URL('./schema.sql', import.meta.url);

const daysFromNow = (days: number, hour: number) => {
  const d = new Date();
  d.setDate(d.getDate() + days);
  d.setHours(hour, 0, 0, 0);
  return d;
};

type SeedEvent = {
  title: string;
  slug: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  startsAt: Date;
  tickets: { name: string; priceCents: number; quantity: number }[];
};

const seedEvents: SeedEvent[] = [
  {
    title: 'Golden Hour: Rooftop Sessions',
    slug: 'golden-hour-rooftop-sessions',
    description:
      'An open-air evening of live indie sets as the sun goes down over the city. Three acts, one rooftop, plus a pop-up bar from the folks at Marlowe. Doors at 6, first set at 7. Bring a light jacket — it gets breezy up there.',
    category: 'music',
    venue: 'The Marlowe Rooftop',
    city: 'Austin',
    startsAt: daysFromNow(9, 19),
    tickets: [
      { name: 'General admission', priceCents: 2800, quantity: 180 },
      { name: 'VIP couch (seats 4)', priceCents: 6500, quantity: 12 },
    ],
  },
  {
    title: 'Laugh Track: Open Mic Finals',
    slug: 'laugh-track-open-mic-finals',
    description:
      'Twelve weeks of open mics come down to this. Eight comics, five minutes each, one very opinionated audience. The winner takes home the golden mic and a paid weekend spot. Expect crowd work — sit in the front row at your own risk.',
    category: 'comedy',
    venue: 'The Basement Club',
    city: 'Chicago',
    startsAt: daysFromNow(5, 20),
    tickets: [
      { name: 'General admission', priceCents: 1500, quantity: 90 },
      { name: 'Front row', priceCents: 2200, quantity: 10 },
    ],
  },
  {
    title: 'Small Plates, Big City',
    slug: 'small-plates-big-city',
    description:
      'A walking tasting through Fulton Market — six kitchens, one ticket. Each stop pairs a signature small plate with something to drink, alcoholic or not, your call. Comes with a stamped tasting passport. Vegetarian route available at check-in.',
    category: 'food',
    venue: 'Fulton Market Hall',
    city: 'Chicago',
    startsAt: daysFromNow(13, 17),
    tickets: [{ name: 'Tasting pass', priceCents: 4500, quantity: 120 }],
  },
  {
    title: 'Synthwave Nights: Neon Drive',
    slug: 'synthwave-nights-neon-drive',
    description:
      'Retro-futures and analog synths all night long. Two live acts and a DJ set to close, with visuals projected wall to wall. The dress code is not enforced but it is strongly encouraged: the more chrome the better.',
    category: 'music',
    venue: 'Echoplex',
    city: 'Los Angeles',
    startsAt: daysFromNow(16, 21),
    tickets: [
      { name: 'General admission', priceCents: 3000, quantity: 250 },
      { name: 'Balcony', priceCents: 4800, quantity: 40 },
    ],
  },
  {
    title: 'Ship It: Side Project Demo Night',
    slug: 'ship-it-side-project-demo-night',
    description:
      'Ten builders, five minutes each, demoing whatever they hacked together this quarter. No slides allowed — live product only. Pizza before, questions after. Free to attend; the supporter ticket covers pizza for everyone else.',
    category: 'tech',
    venue: 'Founders Hall',
    city: 'San Francisco',
    startsAt: daysFromNow(7, 18),
    tickets: [
      { name: 'Free seat', priceCents: 0, quantity: 100 },
      { name: 'Supporter', priceCents: 1000, quantity: 30 },
    ],
  },
  {
    title: 'Brushes & Bubbles',
    slug: 'brushes-and-bubbles',
    description:
      'A guided painting evening in a working artist studio. All materials included, no experience needed, and your canvas goes home with you. The bubbles are optional but historically very popular. Ages 21+.',
    category: 'arts',
    venue: 'Atelier Nine',
    city: 'Portland',
    startsAt: daysFromNow(11, 18),
    tickets: [{ name: 'Easel + materials', priceCents: 3800, quantity: 24 }],
  },
  {
    title: 'Sunday League Five-a-Side Cup',
    slug: 'sunday-league-five-a-side-cup',
    description:
      'One-day knockout tournament on the riverside pitches. Squads of up to eight, group stage guaranteed, winners get the trophy and a year of bragging rights. Spectators welcome — there will be a grill going.',
    category: 'sports',
    venue: 'Riverside Pitches',
    city: 'Denver',
    startsAt: daysFromNow(20, 10),
    tickets: [
      { name: 'Player pass', priceCents: 1200, quantity: 64 },
      { name: 'Spectator', priceCents: 500, quantity: 150 },
    ],
  },
  {
    title: 'Vinyl Swap & Listening Party',
    slug: 'vinyl-swap-and-listening-party',
    description:
      'Bring crates, leave with different crates. Local collectors and a couple of shops set up tables, and the house system plays whatever gets pulled from the stacks. Cash and trades both welcome on the floor.',
    category: 'music',
    venue: 'Dusty Groove Annex',
    city: 'Nashville',
    startsAt: daysFromNow(15, 12),
    tickets: [{ name: 'Entry', priceCents: 800, quantity: 200 }],
  },
  {
    title: 'Improv for Absolutely No Reason',
    slug: 'improv-for-absolutely-no-reason',
    description:
      'Long-form improv from a cast that has never once planned anything. Every show is made up on the spot from a single audience suggestion, so technically you are the writer. Two acts with an intermission.',
    category: 'comedy',
    venue: 'The Attic Theatre',
    city: 'Seattle',
    startsAt: daysFromNow(8, 19),
    tickets: [{ name: 'General admission', priceCents: 1800, quantity: 70 }],
  },
  {
    title: 'Print & Process: Screen Printing Workshop',
    slug: 'print-and-process-screen-printing',
    description:
      'A hands-on afternoon covering the full screen printing process, from burning a screen to pulling your first prints. You leave with two finished posters and the know-how to keep going at home. Small group, lots of ink.',
    category: 'arts',
    venue: 'Press Club Studio',
    city: 'Minneapolis',
    startsAt: daysFromNow(18, 13),
    tickets: [{ name: 'Workshop seat', priceCents: 5500, quantity: 16 }],
  },
];

export async function bootstrap(databaseUrl: string) {
  const pool = new pg.Pool({ connectionString: databaseUrl, max: 2 });
  try {
    const check = await pool.query(
      "select to_regclass('public.users') as t"
    );
    if (!check.rows[0].t) {
      console.log('applying schema...');
      await pool.query(readFileSync(schemaPath, 'utf8'));
    }

    const count = await pool.query('select count(*)::int as n from events');
    if (count.rows[0].n === 0) {
      console.log('seeding demo data...');
      const hash = await bcrypt.hash('letmein123', 10);
      const organizer = await pool.query<{ id: number }>(
        `insert into users (name, email, password_hash)
         values ('Maya Chen', 'maya@example.com', $1)
         returning id`,
        [hash]
      );

      for (const ev of seedEvents) {
        const { rows } = await pool.query<{ id: number }>(
          `insert into events (organizer_id, slug, title, description, category, venue, city, starts_at)
           values ($1, $2, $3, $4, $5, $6, $7, $8)
           returning id`,
          [
            organizer.rows[0].id,
            ev.slug,
            ev.title,
            ev.description,
            ev.category,
            ev.venue,
            ev.city,
            ev.startsAt,
          ]
        );
        for (const t of ev.tickets) {
          await pool.query(
            `insert into ticket_types (event_id, name, price_cents, quantity)
             values ($1, $2, $3, $4)`,
            [rows[0].id, t.name, t.priceCents, t.quantity]
          );
        }
      }
      console.log(`seeded ${seedEvents.length} events`);
    }
  } finally {
    await pool.end();
  }
}
