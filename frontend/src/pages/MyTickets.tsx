import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../api';
import { longDate, money, time } from '../format';
import type { Order } from '../types';

export function MyTickets() {
  const [orders, setOrders] = useState<Order[] | null>(null);

  useEffect(() => {
    api
      .get<{ orders: Order[] }>('/api/orders/mine')
      .then((data) => setOrders(data.orders))
      .catch(() => setOrders([]));
  }, []);

  if (orders === null) {
    return <p className="muted center">Loading your tickets…</p>;
  }

  return (
    <div className="container narrow">
      <h1 className="page-title">My tickets</h1>
      {orders.length === 0 ? (
        <div className="empty">
          <h3>No tickets yet</h3>
          <p className="muted">
            <Link to="/">Browse events</Link> and your tickets will show up
            here.
          </p>
        </div>
      ) : (
        <div className="stub-list">
          {orders.map((order) => (
            <article className="stub" key={order.id}>
              <div className="stub-main">
                <h3>
                  <Link to={`/events/${order.slug}`}>{order.title}</Link>
                </h3>
                <p className="muted">
                  {longDate(order.starts_at)}, {time(order.starts_at)}
                </p>
                <p className="muted">
                  {order.venue} · {order.city}
                </p>
              </div>
              <div className="stub-tear" aria-hidden="true" />
              <div className="stub-side">
                <span className="stub-order">№ {order.id}</span>
                <ul>
                  {order.items.map((item, i) => (
                    <li key={i}>
                      {item.quantity} × {item.name}
                    </li>
                  ))}
                </ul>
                <strong>{money(order.total_cents)}</strong>
              </div>
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
