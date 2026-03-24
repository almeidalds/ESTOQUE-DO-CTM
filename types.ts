
export interface User {
  uid: string;
  name: string;
  role: 'admin' | 'manager' | 'helpdesk' | 'mobile_add_only' | 'viewer';
}

export interface Warehouse {
  id: string;
  name: string;
  type: string;
  color: string;
  icon: string;
  isArchived?: boolean;
  archivedAt?: string;
  archivedBy?: { uid: string, name: string, role: string };
}

export interface InventoryItem {
  id: string;
  name: string;
  nameNormalized?: string;
  sku: string;
  category: string;
  unit: string;
  quantity: number;
  minLevel: number;
  maxLevel: number;
  warehouseId: string;
  unitPrice: number;
  lastUpdated: string;
  locationPath?: string;
  isArchived?: boolean;
  archivedBy?: { uid: string, name: string, role: string };
  archivedAt?: string;
  isRestricted?: boolean;
}

export type TransactionType = 'IN' | 'OUT' | 'TRANSFER' | 'ADJUST' | 'LOAN_OUT' | 'LOAN_RETURN';

export type TransactionReasonCategory = 'DONATION_TO_MISSIONARY' | 'INTERNAL_USE' | 'DAMAGED' | 'EXPIRED' | 'OTHER';

export interface TransactionRecipient {
  missionaryId: string;
  missionaryName: string;
  quantity: number;
}

export interface Transaction {
  id: string;
  itemId: string;
  itemName: string;
  type: TransactionType;
  quantity: number;
  fromWarehouseId?: string;
  toWarehouseId?: string;
  reason?: string;
  reasonCategory?: TransactionReasonCategory;
  recipients?: TransactionRecipient[];
  user: string;
  userId: string;
  timestamp: string;
  deliveredBy?: string;
  deliveryLocation?: string;
  deliveryShift?: string;
  loanId?: string;
}

export interface Missionary {
  id: string; // DocID imutável
  name: string;
  email?: string;
  phone?: string;
  language?: string;
  branch?: string; // Ramo
  district?: string; // Distrito
  notes?: string;
  createdAt: string;
  totalItemsReceived: number;
  isActive?: boolean;
  updatedAt?: string;
  updatedBy?: string;
}

export interface LoanItem {
  itemId: string;
  itemName: string;
  qtyLoaned: number;
  qtyReturned: number;
}

export interface Loan {
  id: string;
  missionaryId: string;
  missionaryName: string;
  originStockId: string;
  createdAt: string;
  createdByUserId: string;
  createdByName: string;
  deliveredAt: string;
  deliveryLocation: string;
  deliveryShift: string;
  dueAt: string;
  status: 'OPEN' | 'CLOSED' | 'OVERDUE';
  notes?: string;
  items: LoanItem[];
  term?: {
    status: 'PENDING_SIGNATURE' | 'SIGNED';
    termId?: string;
    pdfUrl?: string;
    signedAt?: string;
  };
}

export type TicketStatus = 'OPEN' | 'IN_PROGRESS' | 'WAITING' | 'RESOLVED' | 'CANCELLED';
export type TicketPriority = 'LOW' | 'NORMAL' | 'HIGH';

export interface Ticket {
  id: string;
  createdAt: string;
  updatedAt: string;
  createdBy: { uid: string, name: string, role: string };
  status: TicketStatus;
  priority: TicketPriority;
  category: string; 
  title: string;
  description?: string;
  missionaryId?: string;
  missionaryName?: string;
  itemId?: string;
  itemName?: string;
  stockId?: string;
  assignedTo?: { uid: string, name: string };
  comments?: {
    id: string;
    userId: string;
    userName: string;
    message: string;
    createdAt: string;
  }[];
}

export interface DonationTerm {
  id: string;
  missionaryId: string;
  missionaryName: string;
  generatedAt: string;
  periodStart: string;
  periodEnd: string;
  items: { itemName: string, quantity: number, date: string }[];
  status: 'GENERATED' | 'SIGNED' | 'PENDING_SIGNATURE';
  signature?: string;
  signedAt?: string;
  type?: 'DONATION' | 'LOAN';
  pdfUrl?: string;
  operatorName?: string;
  signatureDataUrl?: string;
  refId?: string;
}

export interface StockRequest {
  id: string;
  requesterId: string;
  requesterName: string;
  itemId: string;
  itemName: string;
  quantity: number;
  warehouseId: string;
  status: 'OPEN' | 'APPROVED' | 'REJECTED' | 'IN_PROGRESS';
  createdAt: string;
  notes?: string;
  approvedBy?: string;
}

export interface CycleCountTask {
  id: string;
  warehouseId: string;
  status: 'OPEN' | 'COUNTED' | 'APPROVED';
  createdAt: string;
  createdBy: string;
  approvedBy?: string;
  approvedAt?: string;
  items: { itemId: string, itemName: string, currentQty: number, countedQty?: number, abcClass?: string }[];
}

export interface ImportRow {
  rowId: number;
  name: string;
  category: string;
  unit: string;
  minQty: number;
  maxQty: number;
  stockId?: string;
  locationPath?: string;
  initialQty?: number;
  status: 'OK' | 'ERROR' | 'CREATE' | 'UPDATE' | 'DUPLICATE_SKIP';
  message?: string;
}

export interface ImportResult {
  created: number;
  updated: number;
  errors: number;
  skipped: number;
}

export interface DashboardFiltersState {
  range: string;
  startDate?: string;
  endDate?: string;
  warehouseId: string;
  category: string;
  search: string;
}

export type ViewState = 'dashboard' | 'inventory' | 'missionaries' | 'tickets' | 'cycle-count' | 'import-items' | 'replenishment' | 'locations' | 'reports' | 'settings' | 'console' | 'helpdesk-profile' | 'report-critical' | 'report-excess';

export interface AppSettings {
  helpdeskDefaults: {
    defaultReasonCategory: string;
    defaultLocation: string;
    shiftRules: { name: string, start: string, end: string }[];
    topUsedCount: number;
    favoritesItemIds: string[];
    repeatedDonationWindowDays: number;
  };
  security: {
    blockArchiveIfBalanceNonZero: boolean;
    blockArchiveIfOpenLoans: boolean;
    adjustRequiresReason: boolean;
    retainAuditLogsDays: number;
  };
  categories: string[];
  units: string[];
  locationsMap: Record<string, string[]>;
  importEnabled: boolean;
  lastUpdated: string;
  updatedBy: string;
}

export interface ReplenishmentSuggestion {
  itemId: string;
  itemName: string;
  warehouseId: string;
  warehouseName: string;
  currentQty: number;
  avgDailyConsumption: number;
  leadTimeDays: number;
  safetyStockDays: number;
  suggestedQty: number;
  status: 'OK' | 'WARNING' | 'CRITICAL';
}

export interface HelpdeskStats {
  todayOutputQty: number;
  todayTxCount: number;
  weekOutputQty: number;
  criticalItemsCount: number;
  openLoansCount: number;
  overdueLoansCount: number;
}

export type ReportRange = 'today' | '7d' | '30d' | '90d' | 'custom';

export interface ReportFilters {
  range: ReportRange;
  startDate?: string;
  endDate?: string;
  warehouseId: string;
  category: string;
  search: string;
}
