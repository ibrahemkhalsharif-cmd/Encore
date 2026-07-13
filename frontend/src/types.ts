export type User = {
  id: number;
  name: string;
  email: string;
};

export type EventSummary = {
  id: number;
  slug: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  starts_at: string;
  organizer: string;
  min_price_cents: number;
  remaining: number;
};

export type TicketType = {
  id: number;
  name: string;
  priceCents: number;
  remaining: number;
};

export type EventDetail = {
  id: number;
  slug: string;
  title: string;
  description: string;
  category: string;
  venue: string;
  city: string;
  starts_at: string;
  organizer: string;
  tickets: TicketType[];
};

export type Order = {
  id: number;
  total_cents: number;
  created_at: string;
  title: string;
  slug: string;
  venue: string;
  city: string;
  starts_at: string;
  category: string;
  items: { name: string; quantity: number; unitPriceCents: number }[];
};

export type HostEvent = {
  id: number;
  slug: string;
  title: string;
  category: string;
  venue: string;
  city: string;
  starts_at: string;
  sold: number;
  capacity: number;
  revenue_cents: number;
};

export const CATEGORIES = [
  { key: 'music', label: 'Music' },
  { key: 'comedy', label: 'Comedy' },
  { key: 'arts', label: 'Arts' },
  { key: 'food', label: 'Food & Drink' },
  { key: 'tech', label: 'Tech' },
  { key: 'sports', label: 'Sports' },
] as const;

export const categoryLabel = (key: string) =>
  CATEGORIES.find((c) => c.key === key)?.label ?? key;
