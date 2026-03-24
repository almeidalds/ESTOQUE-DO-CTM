
import { InventoryItem, Transaction, Loan, HelpdeskStats } from '../types';
import * as InventoryService from './inventoryService';

const HELPDESK_STOCK_ID = 'STOCK-HELPDESK';

export const getHelpdeskOverviewStats = (): HelpdeskStats => {
  const transactions = InventoryService.getTransactions();
  const items = InventoryService.getItems();
  const loans = InventoryService.getLoans();

  const now = new Date();
  const startOfDay = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
  const startOfWeek = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

  // Transactions Filter: Helpdesk & OUT
  const helpdeskOut = transactions.filter(t => 
    t.fromWarehouseId === HELPDESK_STOCK_ID && 
    (t.type === 'OUT' || t.type === 'LOAN_OUT')
  );

  const todayTxs = helpdeskOut.filter(t => t.timestamp >= startOfDay);
  const weekTxs = helpdeskOut.filter(t => t.timestamp >= startOfWeek);

  // Stock Filter
  const helpdeskItems = items.filter(i => i.warehouseId === HELPDESK_STOCK_ID && !i.isArchived);
  const criticalItems = helpdeskItems.filter(i => i.quantity < i.minLevel).length;

  // Loans Filter
  const helpdeskLoans = loans.filter(l => l.originStockId === HELPDESK_STOCK_ID);
  const openLoans = helpdeskLoans.filter(l => l.status === 'OPEN' || l.status === 'OVERDUE');
  const overdueLoans = openLoans.filter(l => new Date(l.dueAt) < now && l.status === 'OPEN').length;

  return {
    todayOutputQty: todayTxs.reduce((acc, t) => acc + t.quantity, 0),
    todayTxCount: todayTxs.length,
    weekOutputQty: weekTxs.reduce((acc, t) => acc + t.quantity, 0),
    criticalItemsCount: criticalItems,
    openLoansCount: openLoans.length,
    overdueLoansCount: overdueLoans
  };
};

export const getHelpdeskStock = (search?: string, category?: string, filterType?: 'ALL'|'CRITICAL'|'EXCESS'): InventoryItem[] => {
  let items = InventoryService.getItems().filter(i => i.warehouseId === HELPDESK_STOCK_ID && !i.isArchived);

  if (search) {
    const s = search.toLowerCase();
    items = items.filter(i => i.name.toLowerCase().includes(s) || i.sku.toLowerCase().includes(s));
  }

  if (category && category !== 'ALL') {
    items = items.filter(i => i.category === category);
  }

  if (filterType === 'CRITICAL') {
    items = items.filter(i => i.quantity < i.minLevel);
  } else if (filterType === 'EXCESS') {
    items = items.filter(i => i.quantity > i.maxLevel);
  }

  return items.sort((a,b) => a.name.localeCompare(b.name));
};

export const getHelpdeskDonations = (range: string, search?: string) => {
  let txs = InventoryService.getTransactions().filter(t => 
    t.fromWarehouseId === HELPDESK_STOCK_ID && 
    (t.type === 'OUT' || t.type === 'LOAN_OUT')
  );

  // Date Filter
  const now = new Date();
  let start = new Date();
  start.setHours(0,0,0,0); // Default Today

  if (range === '7d') start.setDate(now.getDate() - 7);
  if (range === '30d') start.setDate(now.getDate() - 30);
  
  txs = txs.filter(t => t.timestamp >= start.toISOString());

  // Search Filter
  if (search) {
    const s = search.toLowerCase();
    txs = txs.filter(t => 
      t.itemName.toLowerCase().includes(s) || 
      t.recipients?.some(r => r.missionaryName.toLowerCase().includes(s) || r.missionaryId.toLowerCase().includes(s))
    );
  }

  return txs.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
};

export const getHelpdeskLoans = (statusFilter: 'ALL'|'OPEN'|'OVERDUE'|'CLOSED') => {
  let loans = InventoryService.getLoans().filter(l => l.originStockId === HELPDESK_STOCK_ID);
  const now = new Date();

  if (statusFilter === 'OPEN') {
    loans = loans.filter(l => l.status === 'OPEN' || l.status === 'OVERDUE');
  } else if (statusFilter === 'OVERDUE') {
    loans = loans.filter(l => l.status === 'OPEN' && new Date(l.dueAt) < now);
  } else if (statusFilter === 'CLOSED') {
    loans = loans.filter(l => l.status === 'CLOSED');
  }

  return loans.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
};
