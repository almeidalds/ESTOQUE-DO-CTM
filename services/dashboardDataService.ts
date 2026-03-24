
import { InventoryItem, Warehouse, Transaction, Loan, DashboardFiltersState } from '../types';

// Interfaces de Dados para Gráficos
export interface OccupancyData { name: string; qty: number; itemsCount: number; fill: string; id: string; }
export interface CriticalityData { name: string; low: number; ok: number; high: number; id: string; }
export interface DailyOutData { date: string; qty: number; count: number; }
export interface LoansStatusData { name: string; value: number; color: string; }
export interface TopItemData { name: string; value: number; id: string; }

// Cache Simples em Memória
const cache = new Map<string, any>();

// Helper para gerar chave de cache
const getCacheKey = (prefix: string, filters: DashboardFiltersState, dataLength: number) => {
  return `${prefix}_${filters.range}_${filters.warehouseId}_${filters.category}_${dataLength}`;
};

// --- HELPERS ---
const getDateRangeFilter = (range: string, customStart?: string, customEnd?: string) => {
  const end = customEnd ? new Date(customEnd) : new Date();
  const start = customStart ? new Date(customStart) : new Date();
  
  if (range === 'today') start.setHours(0,0,0,0);
  else if (range === '7d') start.setDate(end.getDate() - 7);
  else if (range === '30d') start.setDate(end.getDate() - 30);
  else if (range === '90d') start.setDate(end.getDate() - 90);
  
  end.setHours(23,59,59,999);
  return { start, end };
};

// --- DATA FETCHERS ---

export const getStockOccupancy = (warehouses: Warehouse[], items: InventoryItem[], filterStockId: string): OccupancyData[] => {
  // Chave de cache simples baseada no length (invalidado se itens mudarem)
  const cacheKey = `OCCUPANCY_${filterStockId}_${items.length}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const relevantItems = filterStockId === 'ALL' 
    ? items 
    : items.filter(i => i.warehouseId === filterStockId);

  let result: OccupancyData[] = [];

  if (filterStockId === 'ALL') {
    result = warehouses.filter(w => !w.isArchived).map(wh => {
      const whItems = relevantItems.filter(i => i.warehouseId === wh.id);
      return {
        id: wh.id,
        name: wh.name,
        qty: whItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsCount: whItems.filter(i => i.quantity > 0).length,
        fill: wh.color
      };
    }).sort((a, b) => b.qty - a.qty);
  } else {
    // Se filtro Específico: Agrupa por Categoria
    const categories = Array.from(new Set(relevantItems.map(i => i.category)));
    result = categories.map(cat => {
      const catItems = relevantItems.filter(i => i.category === cat);
      return {
        id: cat, // Categoria como ID
        name: cat,
        qty: catItems.reduce((acc, i) => acc + i.quantity, 0),
        itemsCount: catItems.length,
        fill: '#324F85'
      };
    }).sort((a, b) => b.qty - a.qty);
  }

  cache.set(cacheKey, result);
  return result;
};

export const getStockCriticality = (warehouses: Warehouse[], items: InventoryItem[], filterStockId: string): CriticalityData[] => {
  const cacheKey = `CRITICALITY_${filterStockId}_${items.length}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const targetWarehouses = filterStockId === 'ALL' 
    ? warehouses.filter(w => !w.isArchived) 
    : warehouses.filter(w => w.id === filterStockId);

  const result = targetWarehouses.map(wh => {
    const whItems = items.filter(i => i.warehouseId === wh.id);
    return {
      id: wh.id,
      name: wh.name,
      low: whItems.filter(i => i.quantity < i.minLevel).length,
      ok: whItems.filter(i => i.quantity >= i.minLevel && i.quantity <= i.maxLevel).length,
      high: whItems.filter(i => i.quantity > i.maxLevel).length
    };
  });

  cache.set(cacheKey, result);
  return result;
};

export const getHelpdeskDailyOut = (transactions: Transaction[], filters: DashboardFiltersState): DailyOutData[] => {
  const cacheKey = getCacheKey('HD_DAILY', filters, transactions.length);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const { start, end } = getDateRangeFilter(filters.range, filters.startDate, filters.endDate);
  
  const hdTxs = transactions.filter(tx => 
    tx.type === 'OUT' && 
    tx.fromWarehouseId === 'STOCK-HELPDESK' &&
    new Date(tx.timestamp) >= start && 
    new Date(tx.timestamp) <= end
  );

  const grouped: Record<string, { qty: number, count: number }> = {};
  
  hdTxs.forEach(tx => {
    // Usar YYYY-MM-DD para sort correto
    const dateObj = new Date(tx.timestamp);
    const dayKey = dateObj.toISOString().split('T')[0]; 
    
    if (!grouped[dayKey]) grouped[dayKey] = { qty: 0, count: 0 };
    grouped[dayKey].qty += tx.quantity;
    grouped[dayKey].count += 1;
  });

  const result = Object.entries(grouped)
    .map(([date, data]) => ({ date, ...data }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  cache.set(cacheKey, result);
  return result;
};

export const getLoansOpenVsOverdue = (loans: Loan[], filters: DashboardFiltersState): LoansStatusData[] => {
  // Empréstimos são snapshot atual, cache curto baseado no length
  const cacheKey = `LOANS_${filters.warehouseId}_${loans.length}`;
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const relevantLoans = filters.warehouseId === 'ALL' 
    ? loans 
    : loans.filter(l => l.originStockId === filters.warehouseId);

  const activeLoans = relevantLoans.filter(l => l.status === 'OPEN' || l.status === 'OVERDUE');
  
  const now = new Date();
  let openCount = 0;
  let overdueCount = 0;

  activeLoans.forEach(l => {
    // Recalcula status real vs status salvo
    if (new Date(l.dueAt) < now) overdueCount++;
    else openCount++;
  });

  if (openCount === 0 && overdueCount === 0) return [];

  const result = [
    { name: 'No Prazo', value: openCount, color: '#10B981' }, // Emerald-500
    { name: 'Vencidos', value: overdueCount, color: '#EF4444' } // Red-500
  ];

  cache.set(cacheKey, result);
  return result;
};

export const getTopItemsOut = (transactions: Transaction[], filters: DashboardFiltersState): TopItemData[] => {
  const cacheKey = getCacheKey('TOP_ITEMS', filters, transactions.length);
  if (cache.has(cacheKey)) return cache.get(cacheKey);

  const { start, end } = getDateRangeFilter(filters.range, filters.startDate, filters.endDate);

  const relevantTxs = transactions.filter(tx => 
    (tx.type === 'OUT' || tx.type === 'LOAN_OUT') &&
    new Date(tx.timestamp) >= start && 
    new Date(tx.timestamp) <= end &&
    (filters.warehouseId === 'ALL' || tx.fromWarehouseId === filters.warehouseId)
  );

  const grouped: Record<string, { value: number, id: string }> = {};
  relevantTxs.forEach(tx => {
    if (!grouped[tx.itemName]) grouped[tx.itemName] = { value: 0, id: tx.itemId };
    grouped[tx.itemName].value += tx.quantity;
  });

  const result = Object.entries(grouped)
    .map(([name, data]) => ({ name, value: data.value, id: data.id }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 10);

  cache.set(cacheKey, result);
  return result;
};
