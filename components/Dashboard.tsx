
import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { InventoryItem, Warehouse, DashboardFiltersState, Transaction, User, ViewState } from '../types';
import { Package, AlertTriangle, Ticket, Share2, ArrowRight, TrendingUp, TrendingDown, LayoutDashboard } from 'lucide-react';
import DashboardFilters from './DashboardFilters';
import StockAlerts from './StockAlerts';
import * as InventoryService from '../services/inventoryService';
import * as DashboardDataService from '../services/dashboardDataService';

// Charts
import StockOccupancyChart from './Charts/StockOccupancyChart';
import StockCriticalityChart from './Charts/StockCriticalityChart';
import HelpdeskDailyOutChart from './Charts/HelpdeskDailyOutChart';
import LoansStatusChart from './Charts/LoansStatusChart';
import TopItemsOutChart from './Charts/TopItemsOutChart';

interface DashboardProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onTransaction: (type: 'IN' | 'OUT' | 'TRANSFER', item: InventoryItem) => void;
}

// Clean Modern KPI Card
const KPICard = ({ 
  title, 
  value, 
  subtext, 
  icon: Icon, 
  colorClass,
  iconBgClass,
  trend,
  onClick 
}: { 
  title: string, value: string | number, subtext?: string, icon: any, colorClass: string, iconBgClass: string, trend?: { val: string, up: boolean }, onClick?: () => void 
}) => (
  <div 
    onClick={onClick}
    className="bg-white p-6 rounded-[28px] cursor-pointer group flex flex-col justify-between relative overflow-hidden h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100"
  >
    <div className="flex justify-between items-start mb-4 relative z-10">
       <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${iconBgClass} ${colorClass} transition-transform group-hover:scale-110`}>
         <Icon size={24} strokeWidth={2.5} />
       </div>
       {trend && (
         <div className={`text-xs font-bold px-3 py-1.5 rounded-full flex items-center gap-1 ${trend.up ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
            {trend.up ? <TrendingUp size={12}/> : <TrendingDown size={12}/>}
            {trend.val}
         </div>
       )}
    </div>
    
    <div className="relative z-10">
       <h3 className="text-4xl font-black text-slate-800 tracking-tight leading-none mb-1">{value}</h3>
       <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">{title}</p>
       {subtext && <p className="text-xs text-slate-400 mt-2 font-medium">{subtext}</p>}
    </div>
    
    {/* Subtle Pattern */}
    <div className="absolute -bottom-4 -right-4 w-32 h-32 bg-gradient-to-br from-slate-50 to-transparent rounded-full opacity-50 group-hover:scale-150 transition-transform duration-700 pointer-events-none"></div>
  </div>
);

const Dashboard: React.FC<DashboardProps> = ({ items, warehouses, currentUser, onNavigate, onTransaction }) => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<any[]>([]);
  const [requests, setRequests] = useState<any[]>([]);

  const [filters, setFilters] = useState<DashboardFiltersState>({
    range: '30d',
    warehouseId: currentUser.role === 'helpdesk' ? 'STOCK-HELPDESK' : 'ALL',
    category: 'ALL',
    search: ''
  });

  const loadExtraData = useCallback(() => {
    setTransactions(InventoryService.getTransactions());
    setLoans(InventoryService.getLoans());
    setRequests(InventoryService.getRequests());
  }, []);

  useEffect(() => {
    loadExtraData();
  }, [loadExtraData]);

  const filteredItems = useMemo(() => {
    return items.filter(i => {
      const matchWarehouse = filters.warehouseId === 'ALL' || i.warehouseId === filters.warehouseId;
      const matchCategory = filters.category === 'ALL' || i.category === filters.category;
      const matchSearch = !filters.search || i.name.toLowerCase().includes(filters.search.toLowerCase()) || i.id.toLowerCase().includes(filters.search.toLowerCase());
      return matchWarehouse && matchCategory && matchSearch && !i.isArchived;
    });
  }, [items, filters]);

  const activeItemsCount = filteredItems.length;
  const criticalItems = filteredItems.filter(i => i.quantity < i.minLevel).length;
  
  const activeLoans = loans.filter(l => (l.status === 'OPEN' || l.status === 'OVERDUE') && (filters.warehouseId === 'ALL' || l.originStockId === filters.warehouseId)).length;
  const activeTickets = requests.filter(r => (r.status === 'OPEN' || r.status === 'APPROVED') && (filters.warehouseId === 'ALL' || r.warehouseId === filters.warehouseId)).length;

  const occupancyData = useMemo(() => DashboardDataService.getStockOccupancy(warehouses, items, filters.warehouseId), [warehouses, items, filters.warehouseId]);
  const criticalityData = useMemo(() => DashboardDataService.getStockCriticality(warehouses, items, filters.warehouseId), [warehouses, items, filters.warehouseId]);
  const helpdeskData = useMemo(() => DashboardDataService.getHelpdeskDailyOut(transactions, filters), [transactions, filters]);
  const loansStatusData = useMemo(() => DashboardDataService.getLoansOpenVsOverdue(loans, filters), [loans, filters]);
  const topItemsData = useMemo(() => DashboardDataService.getTopItemsOut(transactions, filters), [transactions, filters]);

  const handleOccupancyClick = useCallback((stockId: string) => { if (stockId && stockId !== 'ALL') setFilters(prev => ({ ...prev, warehouseId: stockId })); }, []);
  const handleCriticalityClick = useCallback((stockId: string, type: 'CRITICAL' | 'EXCESS') => { if (stockId) setFilters(prev => ({ ...prev, warehouseId: stockId })); onNavigate(type === 'CRITICAL' ? 'report-critical' : 'report-excess'); }, [onNavigate]);

  return (
    <div className="space-y-8 animate-fade-in max-w-[1600px] mx-auto">
      
      {/* Top Controls */}
      <DashboardFilters warehouses={warehouses} filters={filters} onFilterChange={setFilters} onRefresh={loadExtraData} onExport={() => alert("Exportar CSV...")} userRole={currentUser.role} />

      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <KPICard 
          title="Itens Ativos" 
          value={activeItemsCount} 
          icon={Package} 
          colorClass="text-blue-600"
          iconBgClass="bg-blue-50"
          onClick={() => onNavigate('inventory')} 
        />
        <KPICard 
          title="Nível Crítico" 
          value={criticalItems} 
          subtext="Abaixo do estoque mínimo"
          icon={AlertTriangle} 
          colorClass="text-orange-600"
          iconBgClass="bg-orange-50"
          onClick={() => onNavigate('report-critical')} 
        />
        
        {/* Quick Stats Links */}
        <div 
           onClick={() => onNavigate('tickets')}
           className="bg-white p-6 rounded-[28px] cursor-pointer group flex flex-col justify-center relative overflow-hidden h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:border-blue-200"
        >
           <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-indigo-50 text-indigo-600 flex items-center justify-center"><Ticket size={20}/></div>
              <h3 className="text-3xl font-black text-slate-800">{activeTickets}</h3>
           </div>
           <div className="flex items-center justify-between mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Chamados Abertos</p>
              <ArrowRight size={16} className="text-indigo-400 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>

        <div 
           onClick={() => onNavigate('missionaries')}
           className="bg-white p-6 rounded-[28px] cursor-pointer group flex flex-col justify-center relative overflow-hidden h-full shadow-sm hover:shadow-xl hover:-translate-y-1 transition-all duration-300 border border-slate-100 hover:border-emerald-200"
        >
           <div className="flex items-center gap-4 mb-2">
              <div className="w-12 h-12 rounded-xl bg-emerald-50 text-emerald-600 flex items-center justify-center"><Share2 size={20}/></div>
              <h3 className="text-3xl font-black text-slate-800">{activeLoans}</h3>
           </div>
           <div className="flex items-center justify-between mt-2">
              <p className="text-xs font-bold text-slate-400 uppercase tracking-wider">Empréstimos</p>
              <ArrowRight size={16} className="text-emerald-400 group-hover:translate-x-1 transition-transform" />
           </div>
        </div>
      </div>

      {/* Main Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 min-h-[400px]">
        <StockOccupancyChart data={occupancyData} onBarClick={handleOccupancyClick} />
        <StockCriticalityChart data={criticalityData} onBarClick={handleCriticalityClick} />
      </div>

      {/* Secondary Charts Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 h-[380px]">
        <div className="lg:col-span-2 h-full"><HelpdeskDailyOutChart data={helpdeskData} /></div>
        <div className="h-full"><LoansStatusChart data={loansStatusData} onSliceClick={() => onNavigate('missionaries')} /></div>
      </div>

      {/* Bottom Row */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
         <div className="lg:col-span-1 h-[450px]">
            <TopItemsOutChart data={topItemsData} onBarClick={(id) => { setFilters(prev => ({ ...prev, search: id })); onNavigate('inventory'); }} />
         </div>
         <div className="lg:col-span-2 h-[450px]">
            <div className="bg-white p-6 rounded-[32px] shadow-sm border border-slate-100 h-full flex flex-col">
               <h3 className="text-base font-bold text-slate-800 uppercase tracking-wide mb-4">Central de Alertas</h3>
               <div className="flex-1 overflow-y-auto custom-scrollbar -mr-4 pr-4">
                  <StockAlerts filteredItems={filteredItems} warehouses={warehouses} onNavigateToAll={(type) => onNavigate(type === 'CRITICAL' ? 'report-critical' : 'report-excess')} onAction={onTransaction} />
               </div>
            </div>
         </div>
      </div>
    </div>
  );
};

export default Dashboard;
