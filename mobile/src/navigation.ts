import type { Ticket } from './api';

export type RootStackParamList = {
  Tickets: undefined;
  Ticket: { ticket: Ticket };
  Scan: undefined;
};
