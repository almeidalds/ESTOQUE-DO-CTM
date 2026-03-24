
import { Transaction, InventoryItem, Loan, ReportFilters, Warehouse } from '../types';
import * as InventoryService from './inventoryService';
import jsPDF from 'jspdf';
import 'jspdf-autotable';
import { formatDateShort, formatNumber } from '../utils/formatters';

// --- HELPER FUNCTIONS ---

const isInDateRange = (dateStr: string, filters: ReportFilters): boolean => {
  const date = new Date(dateStr);
  const now = new Date();
  let start = new Date();
  let end = new Date();

  // Reset times
  start.setHours(0, 0, 0, 0);
  end.setHours(23, 59, 59, 999);

  if (filters.range === 'today') {
    // start is already today 00:00
  } else if (filters.range === '7d') {
    start.setDate(now.getDate() - 7);
  } else if (filters.range === '30d') {
    start.setDate(now.getDate() - 30);
  } else if (filters.range === '90d') {
    start.setDate(now.getDate() - 90);
  } else if (filters.range === 'custom' && filters.startDate && filters.endDate) {
    start = new Date(filters.startDate);
    end = new Date(filters.endDate);
    end.setHours(23, 59, 59, 999);
  }

  return date >= start && date <= end;
};

const filterTransaction = (tx: Transaction, filters: ReportFilters, items: InventoryItem[]): boolean => {
  if (!isInDateRange(tx.timestamp, filters)) return false;
  if (filters.warehouseId !== 'ALL' && tx.fromWarehouseId !== filters.warehouseId && tx.toWarehouseId !== filters.warehouseId) return false;
  
  if (filters.category !== 'ALL' || filters.search) {
    // Need item details to filter by category
    // In a real DB we would join, here we look up
    // Note: Transaction usually stores itemName, but not category. We need to lookup.
    const item = items.find(i => i.id === tx.itemId);
    if (filters.category !== 'ALL' && item?.category !== filters.category) return false;
  }

  if (filters.search) {
    const s = filters.search.toLowerCase();
    const matchItem = tx.itemName.toLowerCase().includes(s) || tx.itemId.toLowerCase().includes(s);
    const matchMis = tx.recipients?.some(r => r.missionaryName.toLowerCase().includes(s));
    if (!matchItem && !matchMis) return false;
  }

  return true;
};

// --- AGGREGATION SERVICES (Simulating Stats Collections) ---

export const getDonationsReport = (filters: ReportFilters) => {
  const transactions = InventoryService.getTransactions();
  const items = InventoryService.getItems();

  const filtered = transactions.filter(tx => 
    tx.type === 'OUT' && 
    tx.reasonCategory === 'DONATION_TO_MISSIONARY' && 
    filterTransaction(tx, filters, items)
  );

  // Aggregate by Item
  const stats: Record<string, { itemId: string, itemName: string, category: string, qty: number, count: number }> = {};

  filtered.forEach(tx => {
    if (!stats[tx.itemId]) {
      const item = items.find(i => i.id === tx.itemId);
      stats[tx.itemId] = {
        itemId: tx.itemId,
        itemName: tx.itemName,
        category: item?.category || 'N/A',
        qty: 0,
        count: 0
      };
    }
    stats[tx.itemId].qty += tx.quantity;
    stats[tx.itemId].count += 1;
  });

  return {
    summary: Object.values(stats).sort((a,b) => b.qty - a.qty),
    transactions: filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  };
};

export const getMovementsReport = (filters: ReportFilters) => {
  const transactions = InventoryService.getTransactions();
  const items = InventoryService.getItems();
  
  const filtered = transactions.filter(tx => filterTransaction(tx, filters, items));

  // Summaries
  const summary = {
    IN: 0,
    OUT: 0,
    TRANSFER: 0,
    ADJUST: 0,
    LOAN_OUT: 0,
    LOAN_RETURN: 0
  };

  filtered.forEach(tx => {
    if (summary[tx.type] !== undefined) {
      summary[tx.type] += tx.quantity;
    }
  });

  return {
    summary,
    transactions: filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  };
};

export const getLoansReport = (filters: ReportFilters) => {
  const loans = InventoryService.getLoans();
  // Filter Loans
  const filtered = loans.filter(l => {
    // Date filter on Loans usually applies to CreatedAt or DueAt. Let's use CreatedAt.
    if (!isInDateRange(l.createdAt, filters)) return false;
    if (filters.warehouseId !== 'ALL' && l.originStockId !== filters.warehouseId) return false;
    if (filters.search) {
       const s = filters.search.toLowerCase();
       if (!l.missionaryName.toLowerCase().includes(s) && !l.items.some(i => i.itemName.toLowerCase().includes(s))) return false;
    }
    return true;
  });

  const summary = {
    OPEN: 0,
    OVERDUE: 0,
    CLOSED: 0
  };

  const now = new Date();
  filtered.forEach(l => {
    if (l.status === 'CLOSED') summary.CLOSED++;
    else {
      if (new Date(l.dueAt) < now) {
         summary.OVERDUE++; 
         // Force status visualization override if needed
      } else {
         summary.OPEN++;
      }
    }
  });

  return {
    summary,
    loans: filtered.sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
  };
};

export const getItemLedger = (itemId: string, filters: ReportFilters) => {
  const transactions = InventoryService.getTransactions();
  // Filter by ID specifically
  const filtered = transactions.filter(tx => tx.itemId === itemId && filterTransaction(tx, filters, InventoryService.getItems()));

  const summary = {
    inQty: 0,
    outQty: 0,
    donationQty: 0,
    loanOutQty: 0,
    loanReturnQty: 0
  };

  filtered.forEach(tx => {
    if (tx.type === 'IN') summary.inQty += tx.quantity;
    if (tx.type === 'OUT') {
      summary.outQty += tx.quantity;
      if (tx.reasonCategory === 'DONATION_TO_MISSIONARY') summary.donationQty += tx.quantity;
    }
    if (tx.type === 'LOAN_OUT') summary.loanOutQty += tx.quantity;
    if (tx.type === 'LOAN_RETURN') summary.loanReturnQty += tx.quantity;
  });

  return {
    summary,
    transactions: filtered.sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
  };
};


// --- EXPORT FUNCTIONS ---

export const generatePDF = (title: string, columns: string[], rows: any[][], summaryText?: string) => {
  const doc = new jsPDF();
  
  // Header
  doc.setFillColor(50, 79, 133); // #324F85
  doc.rect(0, 0, 210, 20, 'F');
  doc.setTextColor(255, 255, 255);
  doc.setFontSize(14);
  doc.text("CTM Brasil - Relatório de Estoque", 14, 13);

  // Title & Info
  doc.setTextColor(0, 0, 0);
  doc.setFontSize(16);
  doc.text(title, 14, 35);
  doc.setFontSize(10);
  doc.setTextColor(100, 100, 100);
  doc.text(`Gerado em: ${new Date().toLocaleString()}`, 14, 42);
  
  if (summaryText) {
     doc.text(summaryText, 14, 48);
  }

  // Table
  (doc as any).autoTable({
    head: [columns],
    body: rows,
    startY: summaryText ? 55 : 48,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [50, 79, 133] },
    alternateRowStyles: { fillColor: [240, 245, 250] }
  });

  // Footer
  const pageCount = doc.getNumberOfPages();
  for(let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    doc.setFontSize(8);
    doc.text(`Página ${i} de ${pageCount}`, 190, 290, { align: 'right' });
  }

  doc.save(`${title.replace(/\s+/g, '_').toLowerCase()}.pdf`);
};

export const generateCSV = (filename: string, headers: string[], rows: any[][]) => {
  const csvContent = [
    headers.join(','),
    ...rows.map(e => e.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
  ].join('\n');

  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.setAttribute("href", url);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};
