
import { Ticket, TicketStatus, User } from '../types';

const TICKETS_KEY = 'nexus7_tickets_v1';

const getLocalTickets = (): Ticket[] => {
  const data = localStorage.getItem(TICKETS_KEY);
  return data ? JSON.parse(data) : [];
};

const saveLocalTickets = (tickets: Ticket[]) => {
  localStorage.setItem(TICKETS_KEY, JSON.stringify(tickets));
};

export const getTickets = (filters?: { status?: TicketStatus, missionaryId?: string }): Ticket[] => {
  let list = getLocalTickets();
  if (filters?.status) list = list.filter(t => t.status === filters.status);
  if (filters?.missionaryId) list = list.filter(t => t.missionaryId === filters.missionaryId);
  return list.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};

export const createTicket = async (payload: Partial<Ticket>, user: User) => {
  const newTicket: Ticket = {
    id: `TCK-${Date.now()}`,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    createdBy: { uid: user.uid, name: user.name, role: user.role },
    status: 'OPEN',
    priority: payload.priority || 'NORMAL',
    category: payload.category || 'Outro',
    title: payload.title || 'Novo Chamado',
    description: payload.description || '',
    missionaryId: payload.missionaryId,
    missionaryName: payload.missionaryName,
    itemId: payload.itemId,
    itemName: payload.itemName,
    stockId: 'STOCK-HELPDESK'
  };

  const list = getLocalTickets();
  saveLocalTickets([newTicket, ...list]);
  return newTicket;
};

export const updateTicketStatus = async (ticketId: string, status: TicketStatus, user: User) => {
  const list = getLocalTickets();
  const idx = list.findIndex(t => t.id === ticketId);
  if (idx === -1) throw new Error("Ticket não encontrado");

  list[idx].status = status;
  list[idx].updatedAt = new Date().toISOString();
  // list[idx].assignedTo = { uid: user.uid, name: user.name }; // Auto-assign on interaction optional

  saveLocalTickets(list);
  return list[idx];
};

export const getOpenTicketsCount = (): number => {
  return getLocalTickets().filter(t => t.status === 'OPEN' || t.status === 'IN_PROGRESS').length;
};
