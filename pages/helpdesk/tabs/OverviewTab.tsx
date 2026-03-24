
import React, { useMemo } from 'react';
import { HelpdeskStats } from '../../../types';
import StatCard from '../../../components/ui/StatCard';
import { Package, Truck, Share2, AlertTriangle, ArrowRight } from 'lucide-react';
import * as HelpdeskProfileService from '../../../services/helpdeskProfileService';

interface Props {
  stats: HelpdeskStats;
  onNavigate: (tab: string) => void;
}

const OverviewTab: React.FC<Props> = ({ stats, onNavigate }) => {
  // Mock trend logic (could be calculated real-time)
  const outputTrend = stats.todayOutputQty > 0 ? '+Hoje' : '-';

  return (
    <div className="space-y-6 animate-fade-in">
      {/* KPI Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard 
          title="Saídas Hoje" 
          value={stats.todayOutputQty} 
          icon={Truck} 
          colorClass="text-blue-600" 
          bgClass="bg-blue-50"
          trend={`${stats.todayTxCount} transações`}
          trendUp={true}
        />
        <StatCard 
          title="Saídas 7 Dias" 
          value={stats.weekOutputQty} 
          icon={Package} 
          colorClass="text-indigo-600" 
          bgClass="bg-indigo-50"
        />
        <StatCard 
          title="Itens Críticos" 
          value={stats.criticalItemsCount} 
          icon={AlertTriangle} 
          colorClass="text-orange-600" 
          bgClass="bg-orange-50"
        />
        <StatCard 
          title="Empréstimos Ativos" 
          value={stats.openLoansCount} 
          icon={Share2} 
          colorClass="text-emerald-600" 
          bgClass="bg-emerald-50"
          trend={stats.overdueLoansCount > 0 ? `${stats.overdueLoansCount} Vencidos` : 'Regular'}
          trendUp={stats.overdueLoansCount === 0}
        />
      </div>

      {/* Shortcuts & Alerts */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Shortcuts */}
        <div className="md:col-span-1 bg-white p-6 rounded-2xl border border-slate-100 shadow-sm">
          <h3 className="text-sm font-bold text-slate-800 uppercase tracking-wide mb-4">Acesso Rápido</h3>
          <div className="space-y-3">
            <button onClick={() => onNavigate('CONSOLE')} className="w-full text-left p-3 bg-blue-50 text-blue-700 rounded-xl font-bold text-sm hover:bg-blue-100 transition-colors flex justify-between items-center group">
              Abrir Console de Atendimento <ArrowRight size={16} className="transition-transform group-hover:translate-x-1" />
            </button>
            <button onClick={() => onNavigate('DONATIONS')} className="w-full text-left p-3 bg-slate-50 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors">
              Ver Histórico de Doações
            </button>
            <button onClick={() => onNavigate('LOANS')} className="w-full text-left p-3 bg-slate-50 text-slate-600 rounded-xl font-medium text-sm hover:bg-slate-100 transition-colors">
              Gerenciar Devoluções
            </button>
          </div>
        </div>

        {/* Alerts / Info */}
        <div className="md:col-span-2 bg-gradient-to-br from-slate-800 to-slate-900 p-6 rounded-2xl text-white shadow-lg relative overflow-hidden">
           <div className="relative z-10">
             <h3 className="text-lg font-bold mb-2">Bem-vindo ao Perfil Helpdesk</h3>
             <p className="text-slate-300 text-sm leading-relaxed max-w-md">
               Esta é sua área administrativa. Utilize o <strong>Console</strong> para realizar atendimentos rápidos, 
               e as abas acima para consultar histórico, gerenciar empréstimos e visualizar o saldo do estoque.
             </p>
             <div className="mt-6 flex gap-4">
               {stats.criticalItemsCount > 0 && (
                 <div className="flex items-center gap-2 text-orange-300 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">
                   <AlertTriangle size={14}/> {stats.criticalItemsCount} itens precisam de reposição
                 </div>
               )}
               {stats.overdueLoansCount > 0 && (
                 <div className="flex items-center gap-2 text-red-300 text-xs font-bold bg-white/10 px-3 py-1.5 rounded-full">
                   <Share2 size={14}/> {stats.overdueLoansCount} empréstimos vencidos
                 </div>
               )}
             </div>
           </div>
           {/* Decor */}
           <div className="absolute top-0 right-0 w-64 h-64 bg-white/5 rounded-full -mr-16 -mt-16 blur-3xl"></div>
        </div>

      </div>
    </div>
  );
};

export default OverviewTab;
