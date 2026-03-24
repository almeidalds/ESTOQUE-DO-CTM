
// ... Imports existentes ...
import { InventoryItem, Transaction, TransactionType, User, Warehouse, TransactionRecipient, TransactionReasonCategory, Missionary, DonationTerm, StockRequest, CycleCountTask, Loan, LoanItem, ImportRow, ImportResult } from '../types';
import { INITIAL_ITEMS, WAREHOUSES as INITIAL_WAREHOUSES } from '../constants';

// --- CLOUD FUNCTION SIMULATIONS (LOGIC DE SEGURANÇA) ---

// NOVO: Import Items Batch (Simulation)
export const importItemsBatch = async (rows: ImportRow[], mode: 'CREATE_ONLY' | 'UPDATE_EXISTING', user: User): Promise<ImportResult> => {
  if (!['admin', 'manager'].includes(user.role)) throw new Error("Permissão negada para importação.");

  const currentItems = getItems();
  let created = 0;
  let updated = 0;
  let errors = 0;
  let skipped = 0;

  // Clone to avoid direct mutation during iteration
  const newItemsList = [...currentItems];

  rows.forEach(row => {
    if (row.status === 'ERROR') {
      errors++;
      return;
    }

    // Normalization for matching
    const nameNorm = row.name.toLowerCase().trim();
    
    // Find existing by Name AND Warehouse (since local storage model is flat per warehouse item)
    // If stockId is provided in row, check against that. If not, maybe skip or default? 
    // Logic: If stockId is provided, look for item in that stock.
    // If not provided, we can't create it in a specific place, assume STOCK-01 or error.
    const targetWarehouse = row.stockId || 'STOCK-01'; // Default backup

    const existingIndex = newItemsList.findIndex(i => 
      i.name.toLowerCase().trim() === nameNorm && 
      i.warehouseId === targetWarehouse
    );

    if (existingIndex >= 0) {
      if (mode === 'UPDATE_EXISTING') {
        const existing = newItemsList[existingIndex];
        newItemsList[existingIndex] = {
          ...existing,
          category: row.category,
          unit: row.unit,
          minLevel: row.minQty,
          maxLevel: row.maxQty,
          locationPath: row.locationPath || existing.locationPath,
          // Update quantity if explicitly provided, else keep existing
          quantity: row.initialQty !== undefined ? row.initialQty : existing.quantity,
          lastUpdated: new Date().toISOString()
        };
        updated++;
      } else {
        skipped++;
      }
    } else {
      // Create New
      const newItem: InventoryItem = {
        id: `ITEM-IMP-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
        name: row.name,
        nameNormalized: nameNorm,
        sku: `SKU-${Date.now().toString().slice(-6)}`, // Auto-gen SKU if not provided
        category: row.category,
        unit: row.unit,
        minLevel: row.minQty,
        maxLevel: row.maxQty,
        quantity: row.initialQty || 0,
        warehouseId: targetWarehouse,
        locationPath: row.locationPath || '',
        unitPrice: 0,
        lastUpdated: new Date().toISOString()
      };
      newItemsList.push(newItem);
      created++;
    }
  });

  saveItems(newItemsList);
  
  // Log Audit
  // In real app, write to audit_logs
  console.log(`Import Batch: Created ${created}, Updated ${updated}, Skipped ${skipped}, Errors ${errors}`);

  return { created, updated, errors, skipped };
};

// ... Existing functions (helpdeskDeliver, getWarehouses, getItems, processTransaction, etc.) ...

export const helpdeskDeliver = async (data: { missionaryId: string, missionaryName: string, items: {itemId: string, qty: number}[], location: string, shift: string, reasonNote?: string }, user: User) => {
  if (!['admin', 'manager', 'helpdesk'].includes(user.role)) throw new Error("Acesso negado.");
  
  for (const item of data.items) {
    const invItem = getItems().find(i => i.id === item.itemId);
    if (!invItem) throw new Error(`Item ${item.itemId} inválido.`);
    
    if (invItem.warehouseId !== 'STOCK-HELPDESK') throw new Error(`Item ${invItem.name} não pertence ao estoque Helpdesk.`);
    
    processTransaction(
      'OUT',
      item.itemId,
      item.qty,
      'STOCK-HELPDESK',
      user,
      undefined,
      data.reasonNote || 'Entrega Rápida Helpdesk',
      undefined,
      'DONATION_TO_MISSIONARY',
      [{ missionaryId: data.missionaryId, missionaryName: data.missionaryName, quantity: item.qty }],
      user.name,
      data.location,
      data.shift
    );
  }

  const missionaries = getMissionaries();
  if (!missionaries.some(m => m.id === data.missionaryId)) {
    createMissionary(data.missionaryName, data.missionaryId);
  }
};

export const getWarehouses = (): Warehouse[] => {
  const data = localStorage.getItem('nexus7_warehouses_v1');
  if (!data) {
    localStorage.setItem('nexus7_warehouses_v1', JSON.stringify(INITIAL_WAREHOUSES));
    return INITIAL_WAREHOUSES;
  }
  return JSON.parse(data);
};

export const getItems = (): InventoryItem[] => {
  const data = localStorage.getItem('nexus7_items_v2');
  if (!data) {
    // Add initial locationPaths to seed data if missing
    const seed = INITIAL_ITEMS.map(i => ({ ...i, locationPath: i.locationPath || 'Corredor A > Prateleira 1' }));
    localStorage.setItem('nexus7_items_v2', JSON.stringify(seed));
    return seed;
  }
  return JSON.parse(data);
};

const saveItems = (items: InventoryItem[]) => localStorage.setItem('nexus7_items_v2', JSON.stringify(items));
const saveTransactions = (txs: Transaction[]) => localStorage.setItem('nexus7_transactions_v2', JSON.stringify(txs));

export const getTransactions = (): Transaction[] => {
  const data = localStorage.getItem('nexus7_transactions_v2');
  return data ? JSON.parse(data) : [];
};

export const processTransaction = (
  type: TransactionType | 'LOAN_OUT' | 'LOAN_RETURN',
  itemId: string,
  quantity: number,
  warehouseId: string,
  user: User,
  targetWarehouseId?: string,
  reason?: string,
  notes?: string,
  reasonCategory?: TransactionReasonCategory,
  recipients?: TransactionRecipient[],
  deliveredBy?: string,
  deliveryLocation?: string,
  deliveryShift?: string,
  dueAt?: string
) => {
  const items = getItems();
  const txs = getTransactions();
  const timestamp = new Date().toISOString();
  
  if (user.role === 'helpdesk') {
    if (warehouseId !== 'STOCK-HELPDESK') throw new Error("Acesso Negado: Estoque inválido.");
    if (type !== 'OUT' && type !== 'LOAN_OUT' && type !== 'LOAN_RETURN') throw new Error("Acesso Negado: Tipo inválido.");
  }

  const itemIndex = items.findIndex(i => i.id === itemId && i.warehouseId === warehouseId);
  let item = items[itemIndex];
  
  if (!item) throw new Error("Item não encontrado.");
  
  if ((type === 'OUT' || type === 'LOAN_OUT' || type === 'TRANSFER') && item.quantity < quantity) {
    throw new Error("Saldo insuficiente.");
  }

  if (type === 'OUT' || type === 'LOAN_OUT') {
    item.quantity -= quantity;
  } else if (type === 'IN' || type === 'LOAN_RETURN') {
    item.quantity += quantity;
  } else if (type === 'TRANSFER' && targetWarehouseId) {
    item.quantity -= quantity;
    
    // Transfer logic considering LocationPath
    const targetItemIndex = items.findIndex(i => i.name === item.name && i.warehouseId === targetWarehouseId); // Match by name usually or SKU
    if (targetItemIndex >= 0) {
      items[targetItemIndex].quantity += quantity;
      items[targetItemIndex].lastUpdated = timestamp;
      // If deliveryLocation provided in params (not standard, but simulated), update path? 
      // Usually only on explicit update.
    } else {
      items.push({
        ...item,
        id: `ITEM-${Date.now()}`, // New ID for new location instance
        warehouseId: targetWarehouseId,
        quantity: quantity,
        lastUpdated: timestamp,
        locationPath: deliveryLocation || 'Recepção (Aguardando Alocação)' // Use param as new location if transfer
      });
    }
  }

  item.lastUpdated = timestamp;
  items[itemIndex] = item;
  saveItems(items);

  let loanId: string | undefined;
  if (type === 'LOAN_OUT' && recipients && recipients.length === 1 && dueAt) {
    const loans = getLoans();
    const newLoan: Loan = {
      id: `LOAN-${Date.now().toString().slice(-6)}`,
      missionaryId: recipients[0].missionaryId,
      missionaryName: recipients[0].missionaryName,
      originStockId: warehouseId,
      createdAt: timestamp,
      createdByUserId: user.uid,
      createdByName: user.name,
      deliveredAt: timestamp,
      deliveryLocation: deliveryLocation || '',
      deliveryShift: deliveryShift || '',
      dueAt: dueAt,
      status: 'OPEN',
      notes: reason,
      items: [{
        itemId: item.id,
        itemName: item.name,
        qtyLoaned: quantity,
        qtyReturned: 0
      }]
    };
    localStorage.setItem('nexus7_loans_v1', JSON.stringify([...loans, newLoan]));
    loanId = newLoan.id;
  }

  const newTx: Transaction = {
    id: crypto.randomUUID(),
    itemId,
    itemName: item.name,
    type: type as TransactionType,
    quantity,
    fromWarehouseId: warehouseId,
    toWarehouseId: targetWarehouseId,
    reason,
    reasonCategory,
    recipients,
    user: user.name,
    userId: user.uid,
    timestamp,
    deliveredBy,
    deliveryLocation,
    deliveryShift,
    loanId
  };

  saveTransactions([newTx, ...txs]);
  
  if ((type === 'OUT' || type === 'LOAN_OUT') && recipients) {
     const missionaries = getMissionaries();
     let changed = false;
     recipients.forEach(r => {
        if (!r.missionaryId || !r.missionaryName) return; 

        const mIdx = missionaries.findIndex(m => m.id === r.missionaryId);
        if (mIdx >= 0) {
           missionaries[mIdx].totalItemsReceived += r.quantity;
           changed = true;
        } else {
           if (r.missionaryId.trim() && r.missionaryName.trim()) {
             missionaries.push({
               id: r.missionaryId,
               name: r.missionaryName,
               createdAt: timestamp,
               totalItemsReceived: r.quantity
             });
             changed = true;
           }
        }
     });
     if (changed) saveMissionaries(missionaries);
  }

  return newTx;
};

// ... Rest of existing exports (getLoans, createMissionary, etc.) ...
export const getLoans = (): Loan[] => {
    const data = localStorage.getItem('nexus7_loans_v1');
    return data ? JSON.parse(data) : [];
};
export const getMissionaries = (): Missionary[] => {
  const data = localStorage.getItem('nexus7_missionaries_v1');
  return data ? JSON.parse(data) : [];
};
export const saveMissionaries = (m: Missionary[]) => localStorage.setItem('nexus7_missionaries_v1', JSON.stringify(m));

export const createMissionary = (name: string, id: string) => {
    if (!id || !id.trim()) throw new Error("O ID do missionário é obrigatório.");
    if (!name || !name.trim()) throw new Error("O Nome do missionário é obrigatório.");

    const ms = getMissionaries();
    if (ms.some(m => m.id === id)) throw new Error("ID já cadastrado");
    
    const newM = { id: id.trim(), name: name.trim(), createdAt: new Date().toISOString(), totalItemsReceived: 0 };
    saveMissionaries([...ms, newM]);
    return newM;
};

export const getRequests = (): StockRequest[] => {
    const data = localStorage.getItem('nexus7_requests_v1');
    return data ? JSON.parse(data) : [];
};
export const getCycleCounts = (): CycleCountTask[] => {
    const data = localStorage.getItem('nexus7_cyclecounts_v1');
    return data ? JSON.parse(data) : [];
};

export const saveAllWarehouses = (w: Warehouse[]) => localStorage.setItem('nexus7_warehouses_v1', JSON.stringify(w));
export const resetWarehousesToDefault = () => localStorage.setItem('nexus7_warehouses_v1', JSON.stringify(INITIAL_WAREHOUSES));
export const resetFullSystem = () => localStorage.clear();
export const exportTransactionsToCSV = () => {
  const txs = getTransactions();
  if (txs.length === 0) return "";
  const header = Object.keys(txs[0]).join(',') + '\n';
  const rows = txs.map(t => Object.values(t).map(v => typeof v === 'string' ? `"${v}"` : v).join(',')).join('\n');
  return header + rows;
};

export const archiveItem = async (id: string, user: User) => {
  const items = getItems();
  const index = items.findIndex(i => i.id === id);
  if (index >= 0) {
    if (items[index].quantity > 0) throw new Error("Não é possível arquivar item com saldo.");
    items[index].isArchived = true;
    items[index].archivedBy = { uid: user.uid, name: user.name, role: user.role };
    items[index].archivedAt = new Date().toISOString();
    saveItems(items);
  }
};

export const unarchiveItem = async (id: string, user: User) => {
  const items = getItems();
  const index = items.findIndex(i => i.id === id);
  if (index >= 0) {
    items[index].isArchived = false;
    delete items[index].archivedBy;
    delete items[index].archivedAt;
    saveItems(items);
  }
};

export const archiveStock = async (id: string, user: User) => {
  const warehouses = getWarehouses();
  const index = warehouses.findIndex(w => w.id === id);
  if (index >= 0) {
    warehouses[index].isArchived = true;
    warehouses[index].archivedAt = new Date().toISOString();
    warehouses[index].archivedBy = { uid: user.uid, name: user.name, role: user.role };
    saveAllWarehouses(warehouses);
  }
};

export const unarchiveStock = async (id: string, user: User) => {
  const warehouses = getWarehouses();
  const index = warehouses.findIndex(w => w.id === id);
  if (index >= 0) {
    warehouses[index].isArchived = false;
    delete warehouses[index].archivedBy;
    delete warehouses[index].archivedAt;
    saveAllWarehouses(warehouses);
  }
};

export const createStock = async (data: any, user: User) => {
  const warehouses = getWarehouses();
  if (warehouses.some(w => w.id === data.id)) throw new Error("ID de estoque já existe");
  warehouses.push({ ...data, isArchived: false });
  saveAllWarehouses(warehouses);
};

export const removeItemFromStock = async (itemId: string, warehouseId: string, user: User) => {
  const items = getItems();
  const index = items.findIndex(i => i.id === itemId && i.warehouseId === warehouseId);
  if (index >= 0) {
    const qty = items[index].quantity;
    if (qty > 0) {
       processTransaction('OUT', itemId, qty, warehouseId, user, undefined, 'Remoção Manual de Estoque (Auditado)');
    }
  }
};

export const deleteItem = (id: string) => {
  const items = getItems();
  const newItems = items.filter(i => i.id !== id);
  saveItems(newItems);
};

export const addItem = (item: any) => {
  const items = getItems();
  items.push({ ...item, lastUpdated: new Date().toISOString() });
  saveItems(items);
};

export const updateItem = (item: InventoryItem) => {
  const items = getItems();
  const index = items.findIndex(i => i.id === item.id && i.warehouseId === item.warehouseId);
  if (index >= 0) {
    items[index] = { ...items[index], ...item, lastUpdated: new Date().toISOString() };
    saveItems(items);
  }
};

export const createDonationTerm = (missionaryId: string, start: string, end: string) => {
   const txs = getTransactions().filter(t => 
     t.reasonCategory === 'DONATION_TO_MISSIONARY' &&
     t.recipients?.some(r => r.missionaryId === missionaryId) &&
     t.timestamp >= start && t.timestamp <= end
   );
   
   const termItems = txs.map(t => ({
     itemName: t.itemName,
     quantity: t.recipients?.find(r => r.missionaryId === missionaryId)?.quantity || 0,
     date: t.timestamp
   }));

   const term: DonationTerm = {
     id: `TERM-${Date.now()}`,
     missionaryId,
     missionaryName: txs[0]?.recipients?.find(r => r.missionaryId === missionaryId)?.missionaryName || 'Unknown',
     generatedAt: new Date().toISOString(),
     periodStart: start,
     periodEnd: end,
     items: termItems,
     status: 'GENERATED'
   };
   return term;
};

export const signDonationTerm = (termId: string, signature: string) => {
  console.log("Term Signed:", termId);
};

export const createRequest = (user: User, itemId: string, itemName: string, quantity: number, notes?: string) => {
  const reqs = getRequests();
  const newReq: StockRequest = {
    id: `REQ-${Date.now()}`,
    requesterId: user.uid,
    requesterName: user.name,
    itemId,
    itemName,
    quantity,
    warehouseId: 'STOCK-HELPDESK',
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    notes
  };
  localStorage.setItem('nexus7_requests_v1', JSON.stringify([...reqs, newReq]));
  return newReq;
};

export const processRequest = (requestId: string, action: 'APPROVE' | 'REJECT', user: User) => {
  const reqs = getRequests();
  const idx = reqs.findIndex(r => r.id === requestId);
  if (idx >= 0) {
    reqs[idx].status = action === 'APPROVE' ? 'APPROVED' : 'REJECTED';
    reqs[idx].approvedBy = user.name;
    localStorage.setItem('nexus7_requests_v1', JSON.stringify(reqs));
    
    if (action === 'APPROVE') {
      processTransaction('OUT', reqs[idx].itemId, reqs[idx].quantity, reqs[idx].warehouseId, user, undefined, `Ticket #${requestId} Aprovado`);
    }
  }
};

export const generateCycleCountTask = (warehouseId: string, user: User, type: string) => {
  const items = getItems().filter(i => i.warehouseId === warehouseId);
  const task: CycleCountTask = {
    id: `CC-${Date.now()}`,
    warehouseId,
    status: 'OPEN',
    createdAt: new Date().toISOString(),
    createdBy: user.name,
    items: items.map(i => ({ itemId: i.id, itemName: i.name, currentQty: i.quantity, abcClass: 'A' })) 
  };
  const tasks = getCycleCounts();
  localStorage.setItem('nexus7_cyclecounts_v1', JSON.stringify([...tasks, task]));
};

export const submitCycleCount = (taskId: string, items: {itemId: string, countedQty: number}[]) => {
  const tasks = getCycleCounts();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    tasks[idx].status = 'COUNTED';
    tasks[idx].items = tasks[idx].items.map(i => {
      const sub = items.find(x => x.itemId === i.itemId);
      return sub ? { ...i, countedQty: sub.countedQty } : i;
    });
    localStorage.setItem('nexus7_cyclecounts_v1', JSON.stringify(tasks));
  }
};

export const approveCycleCount = (taskId: string, user: User) => {
  const tasks = getCycleCounts();
  const idx = tasks.findIndex(t => t.id === taskId);
  if (idx >= 0) {
    tasks[idx].status = 'APPROVED';
    tasks[idx].approvedBy = user.name;
    tasks[idx].approvedAt = new Date().toISOString();
    
    const inventory = getItems();
    tasks[idx].items.forEach(taskItem => {
       if (taskItem.countedQty !== undefined && taskItem.countedQty !== taskItem.currentQty) {
          const invIdx = inventory.findIndex(i => i.id === taskItem.itemId);
          if (invIdx >= 0) {
             const diff = taskItem.countedQty - inventory[invIdx].quantity;
             processTransaction(
               diff > 0 ? 'IN' : 'OUT',
               taskItem.itemId,
               Math.abs(diff),
               tasks[idx].warehouseId,
               user,
               undefined,
               `Ajuste de Inventário Cíclico #${taskId}`
             );
          }
       }
    });
    localStorage.setItem('nexus7_cyclecounts_v1', JSON.stringify(tasks));
  }
};

export const returnLoanItems = (loanId: string, user: User, items: {itemId: string, quantity: number}[]) => {
   const loans = getLoans();
   const idx = loans.findIndex(l => l.id === loanId);
   if (idx >= 0) {
     const loan = loans[idx];
     items.forEach(retItem => {
       const lItemIdx = loan.items.findIndex(i => i.itemId === retItem.itemId);
       if (lItemIdx >= 0) {
         loan.items[lItemIdx].qtyReturned += retItem.quantity;
         processTransaction('LOAN_RETURN', retItem.itemId, retItem.quantity, loan.originStockId, user, undefined, `Devolução Loan #${loanId}`);
       }
     });
     
     if (loan.items.every(i => i.qtyReturned >= i.qtyLoaned)) {
       loan.status = 'CLOSED';
     }
     localStorage.setItem('nexus7_loans_v1', JSON.stringify(loans));
   }
};
