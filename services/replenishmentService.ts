
import { InventoryItem, Transaction, ReplenishmentSuggestion, Warehouse } from '../types';
import * as InventoryService from './inventoryService';

const DEFAULT_LEAD_TIME = 7; // Dias para chegar
const DEFAULT_SAFETY_DAYS = 5; // Margem de segurança
const ANALYSIS_PERIOD = 30; // Dias para média

export const calculateReplenishment = (
  items: InventoryItem[], 
  warehouses: Warehouse[]
): ReplenishmentSuggestion[] => {
  const transactions = InventoryService.getTransactions();
  const now = new Date();
  const startDate = new Date();
  startDate.setDate(now.getDate() - ANALYSIS_PERIOD);

  // Filtra saídas relevantes (OUT e LOAN_OUT)
  const consumptions = transactions.filter(t => 
    (t.type === 'OUT' || t.type === 'LOAN_OUT') &&
    new Date(t.timestamp) >= startDate
  );

  // Agrupa consumo por Item e Estoque
  const consumptionMap: Record<string, number> = {}; 
  consumptions.forEach(t => {
    // Chave única por item+estoque
    const key = `${t.itemId}_${t.fromWarehouseId}`;
    consumptionMap[key] = (consumptionMap[key] || 0) + t.quantity;
  });

  const suggestions: ReplenishmentSuggestion[] = [];

  items.forEach(item => {
    if (item.isArchived) return;

    const key = `${item.id}_${item.warehouseId}`;
    const totalOut = consumptionMap[key] || 0;
    const avgDaily = totalOut / ANALYSIS_PERIOD;
    
    // Fórmula: (MédiaDiária * (LeadTime + Safety)) - EstoqueAtual
    const targetStock = avgDaily * (DEFAULT_LEAD_TIME + DEFAULT_SAFETY_DAYS);
    // Sugerir compra apenas se estiver abaixo do mínimo OU projeção indicar falta
    // Lógica simplificada: Se target > atual, sugere a diferença
    let suggested = Math.ceil(targetStock - item.quantity);
    
    // Se estiver abaixo do mínimo hard-coded, garante pelo menos voltar ao mínimo
    if (item.quantity < item.minLevel) {
       const gapToMin = item.minLevel - item.quantity;
       if (suggested < gapToMin) suggested = gapToMin;
    }

    if (suggested < 0) suggested = 0;
    
    let status: 'OK' | 'WARNING' | 'CRITICAL' = 'OK';
    if (item.quantity === 0 && avgDaily > 0) status = 'CRITICAL';
    else if (item.quantity < item.minLevel) status = 'WARNING';
    else if (suggested > 0) status = 'WARNING';

    if (avgDaily > 0 || item.quantity < item.minLevel) {
       suggestions.push({
         itemId: item.id,
         itemName: item.name,
         warehouseId: item.warehouseId,
         warehouseName: warehouses.find(w => w.id === item.warehouseId)?.name || item.warehouseId,
         currentQty: item.quantity,
         avgDailyConsumption: avgDaily,
         leadTimeDays: DEFAULT_LEAD_TIME,
         safetyStockDays: DEFAULT_SAFETY_DAYS,
         suggestedQty: suggested,
         status
       });
    }
  });

  return suggestions.sort((a, b) => {
    // Prioridade: Críticos -> Warning -> Maior sugestão
    if (a.status === 'CRITICAL' && b.status !== 'CRITICAL') return -1;
    if (b.status === 'CRITICAL' && a.status !== 'CRITICAL') return 1;
    return b.suggestedQty - a.suggestedQty;
  });
};
