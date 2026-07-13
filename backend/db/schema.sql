create table users (
  id            serial primary key,
  name          text not null,
  email         text not null unique,
  password_hash text not null,
  created_at    timestamptz not null default now()
);

create table events (
  id           serial primary key,
  organizer_id int not null references users(id),
  slug         text not null unique,
  title        text not null,
  description  text not null,
  category     text not null,
  venue        text not null,
  city         text not null,
  starts_at    timestamptz not null,
  created_at   timestamptz not null default now()
);

create table ticket_types (
  id          serial primary key,
  event_id    int not null references events(id) on delete cascade,
  name        text not null,
  price_cents int not null check (price_cents >= 0),
  quantity    int not null check (quantity > 0),
  sold        int not null default 0 check (sold >= 0 and sold <= quantity)
);

create table orders (
  id          serial primary key,
  user_id     int not null references users(id),
  event_id    int not null references events(id),
  total_cents int not null,
  created_at  timestamptz not null default now()
);

create table order_items (
  id              serial primary key,
  order_id        int not null references orders(id) on delete cascade,
  ticket_type_id  int not null references ticket_types(id),
  quantity        int not null check (quantity > 0),
  unit_price_cents int not null
);

create index events_starts_at_idx on events (starts_at);
create index events_category_idx on events (category);
create index ticket_types_event_idx on ticket_types (event_id);
create index orders_user_idx on orders (user_id);
create index order_items_order_idx on order_items (order_id);
