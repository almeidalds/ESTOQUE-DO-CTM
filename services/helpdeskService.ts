
import { InventoryItem, StockRequest, User, Transaction, Missionary, Loan } from '../types';
import * as InventoryService from './inventoryService';

// --- CONSTANTS ---
const REPEATED_DONATION_DAYS = 30;
const DEFAULT_LOAN_DAYS = 7; // Padrão de 7 dias para empréstimos rápidos no console

// --- READ OPERATIONS ---

export const getHelpdeskStock = (): InventoryItem[] => {
  const allItems = InventoryService.getItems();
  return allItems.filter(i => i.warehouseId === 'STOCK-HELPDESK' && !i.isArchived);
};

export const getOpenTickets = (): StockRequest[] => {
  const reqs = InventoryService.getRequests();
  return reqs.filter(r => r.warehouseId === 'STOCK-HELPDESK' && r.status === 'OPEN');
};

export const getTopItemsToday = (): { item: InventoryItem; count: number }[] => {
  const stock = getHelpdeskStock();
  const transactions = InventoryService.getTransactions();
  const today = new Date().toISOString().split('T')[0];
  const todaysTxs = transactions.filter(t => 
    t.fromWarehouseId === 'STOCK-HELPDESK' && 
    t.type === 'OUT' &&
    t.timestamp.startsWith(today)
  );
  const counts: Record<string, number> = {};
  todaysTxs.forEach(t => {
    counts[t.itemId] = (counts[t.itemId] || 0) + t.quantity;
  });
  return Object.entries(counts)
    .map(([id, count]) => {
      const item = stock.find(i => i.id === id);
      return item ? { item, count } : null;
    })
    .filter((x): x is { item: InventoryItem; count: number } => x !== null)
    .sort((a, b) => b.count - a.count)
    .slice(0, 12);
};

export const checkRepeatedDonation = (missionaryId: string, itemId: string): Transaction | null => {
  const transactions = InventoryService.getTransactions();
  const cutoffDate = new Date();
  cutoffDate.setDate(cutoffDate.getDate() - REPEATED_DONATION_DAYS);

  const found = transactions.find(t => 
    t.type === 'OUT' &&
    t.reasonCategory === 'DONATION_TO_MISSIONARY' &&
    t.recipients?.some(r => r.missionaryId === missionaryId) &&
    t.itemId === itemId &&
    new Date(t.timestamp) >= cutoffDate
  );

  return found || null;
};

export const getMissionaryHistory = (missionaryId: string, limit = 10) => {
  const txs = InventoryService.getTransactions();
  return txs
    .filter(t => t.recipients?.some(r => r.missionaryId === missionaryId))
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, limit);
};

export const getMissionaryLoans = (missionaryId: string): Loan[] => {
  const loans = InventoryService.getLoans();
  return loans
    .filter(l => l.missionaryId === missionaryId)
    .sort((a, b) => {
      // Aberto primeiro, depois fechado
      if (a.status !== 'CLOSED' && b.status === 'CLOSED') return -1;
      if (a.status === 'CLOSED' && b.status !== 'CLOSED') return 1;
      // Depois por data
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });
};

// --- WRITE OPERATIONS (Simulating Cloud Functions) ---

// SIMULATION of helpdeskEnsureMissionary Cloud Function
export const ensureMissionary = (missionaryId: string, missionaryName?: string) => {
  const cleanId = missionaryId.trim();
  if (cleanId.length < 3) throw new Error("ID inválido (mínimo 3 caracteres).");

  const missionaries = InventoryService.getMissionaries();
  const existing = missionaries.find(m => m.id === cleanId);

  if (existing) {
    return { exists: true, missionary: existing };
  }

  // Not exists
  if (!missionaryName || missionaryName.trim().length < 3) {
    // Signal that name is required
    return { exists: false, requiresName: true };
  }

  // Create (if name provided)
  // This simulates the backend logic creating the doc
  const newMissionary: Missionary = {
    id: cleanId,
    name: missionaryName.trim(),
    createdAt: new Date().toISOString(),
    totalItemsReceived: 0,
    // source: 'helpdesk_manual'
  };
  
  InventoryService.saveMissionaries([...missionaries, newMissionary]);
  
  return { exists: true, missionary: newMissionary, createdNow: true };
};

export const helpdeskCreateMissionary = (id: string, name: string) => {
  // Legacy wrapper, redirect to ensure
  return ensureMissionary(id, name).missionary!;
};

export interface DeliveryPayload {
  missionaryId: string;
  missionaryName: string;
  operatorName: string;
  reason: string;
  location: string;
  shift: string;
  items: { item: InventoryItem; qty: number; isRepeated: boolean; type: 'DONATION' | 'LOAN' }[];
  linkedTicketId?: string;
}

export const helpdeskDeliver = (currentUser: User, payload: DeliveryPayload) => {
  if (currentUser.role !== 'helpdesk' && currentUser.role !== 'admin') throw new Error("Acesso negado.");
  if (!payload.missionaryId) throw new Error("Missionário não identificado.");
  if (!payload.operatorName) throw new Error("Nome do Operador é obrigatório.");
  if (payload.items.length === 0) throw new Error("Carrinho vazio.");

  // Verify Missionary Exists (Security Double Check)
  const misCheck = ensureMissionary(payload.missionaryId);
  if (!misCheck.exists) throw new Error("Perfil do missionário não encontrado. Crie o perfil antes de entregar.");

  // Process Items
  const stock = getHelpdeskStock();
  
  payload.items.forEach(line => {
    const currentItem = stock.find(i => i.id === line.item.id);
    if (!currentItem) throw new Error(`Item ${line.item.name} não encontrado.`);
    if (currentItem.quantity < line.qty) throw new Error(`Saldo insuficiente para ${line.item.name}.`);

    // Determine Transaction Type
    const txType = line.type === 'LOAN' ? 'LOAN_OUT' : 'OUT';
    
    // Calculate Due Date for Loans
    let dueAt: string | undefined = undefined;
    if (line.type === 'LOAN') {
      const date = new Date();
      date.setDate(date.getDate() + DEFAULT_LOAN_DAYS);
      dueAt = date.toISOString();
    }

    InventoryService.processTransaction(
      txType,
      line.item.id,
      line.qty,
      'STOCK-HELPDESK',
      { ...currentUser, name: payload.operatorName }, 
      undefined,
      payload.reason, 
      undefined,
      'DONATION_TO_MISSIONARY',
      [{ missionaryId: payload.missionaryId, missionaryName: payload.missionaryName, quantity: line.qty }],
      payload.operatorName,
      payload.location,
      payload.shift,
      dueAt
    );
  });

  if (payload.linkedTicketId) {
    InventoryService.processRequest(payload.linkedTicketId, 'APPROVE', { ...currentUser, name: payload.operatorName });
  }

  return true;
};
