
import React, { useState, useEffect } from 'react';
import { User, ViewState, Ticket } from '../../types';
import TabNav from '../../components/ui/TabNav';
import OverviewTab from './tabs/OverviewTab';
import DonationsTab from './tabs/DonationsTab';
import LoansTab from './tabs/LoansTab';
import StockTab from './tabs/StockTab';
import ReportsTab from './tabs/ReportsTab';
import * as HelpdeskProfileService from '../../services/helpdeskProfileService';
import * as TicketsService from '../../services/ticketsService';
import { ExternalLink, LogOut, Ticket as TicketIcon, ArrowRight } from 'lucide-react';
import HelpdeskActionBar from '../../components/Helpdesk/HelpdeskActionBar';
import TicketQuickCreateModal from '../../components/Helpdesk/tickets/TicketQuickCreateModal';
import TicketsList from '../Tickets/TicketsList'; // Listagem completa

interface HelpdeskProfileProps {
  currentUser: User;
  onNavigate: (view: ViewState) => void;
  onLogout: () => void;
}

const HelpdeskProfile: React.FC<HelpdeskProfileProps> = ({ currentUser, onNavigate, onLogout }) => {
  const [activeTab, setActiveTab] = useState('OVERVIEW');
  const [stats, setStats] = useState(HelpdeskProfileService.getHelpdeskOverviewStats());
  const [recentTickets, setRecentTickets] = useState<Ticket[]>([]);
  
  // Actions
  const [isTicketModalOpen, setIsTicketModalOpen] = useState(false);

  // Re-fetch on mount
  useEffect(() => {
    handleRefresh();
  }, []);

  const handleRefresh = () => {
    setStats(HelpdeskProfileService.getHelpdeskOverviewStats());
    setRecentTickets(TicketsService.getTickets({ status: 'OPEN' }).slice(0, 5));
  };

  const tabs = [
    { id: 'OVERVIEW', label: 'Visão Geral' },
    { id: 'TICKETS', label: 'Tickets' },
    { id: 'DONATIONS', label: 'Doações' },
    { id: 'LOANS', label: 'Empréstimos' },
    { id: 'STOCK', label: 'Estoque' },
    { id: 'REPORTS', label: 'Relatórios' },
  ];

  // Action Handlers
  const handleDonate = () => onNavigate('console'); // Mudar para wizard futuramente
  const handleLoan = () => onNavigate('console'); // Mudar para wizard futuramente

  return (
    <div className="flex flex-col h-screen bg-[#F0F5FA] font-sans text-slate-900">
      
      {/* 1. Action Bar Principal */}
      <HelpdeskActionBar 
        onDonate={handleDonate}
        onLoan={handleLoan}
        onOpenConsole={() => onNavigate('console')}
        onCreateTicket={() => setIsTicketModalOpen(true)}
      />

      <div className="px-8 pt-4 pb-0 bg-white">
         <div className="flex justify-between items-center mb-4">
            <div>
              <h1 className="text-xl font-black text-slate-800 tracking-tight">Perfil Helpdesk</h1>
              <p className="text-xs text-slate-500">Gestão de Atendimento</p>
            </div>
            <button onClick={onLogout} className="text-slate-400 hover:text-red-500 text-xs font-bold flex items-center gap-1">
               <LogOut size={14} /> Sair
            </button>
         </div>
         <TabNav tabs={tabs} activeTab={activeTab} onTabChange={setActiveTab} />
      </div>

      <main className="flex-1 overflow-y-auto p-8 custom-scrollbar">
        <div className="max-w-7xl mx-auto">
          
          {activeTab === 'OVERVIEW' && (
            <div className="space-y-8">
               {/* Ticket Highlight Block (REQ 4) */}
               <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-100 relative overflow-hidden group">
                  <div className="absolute top-0 right-0 w-64 h-64 bg-indigo-50 rounded-full -mr-16 -mt-16 group-hover:scale-110 transition-transform duration-700"></div>
                  
                  <div className="relative z-10 flex flex-col md:flex-row justify-between gap-8">
                     {/* Summary */}
                     <div className="flex-1">
                        <div className="flex items-center gap-3 mb-4">
                           <div className="w-12 h-12 bg-indigo-600 text-white rounded-xl flex items-center justify-center shadow-lg shadow-indigo-200">
                              <TicketIcon size={24} />
                           </div>
                           <div>
                              <h2 className="text-2xl font-black text-slate-800">{recentTickets.length}</h2>
                              <p className="text-sm font-bold text-slate-500 uppercase tracking-wide">Tickets Abertos</p>
                           </div>
                        </div>
                        <button onClick={() => setActiveTab('TICKETS')} className="text-indigo-600 font-bold text-sm flex items-center gap-2 hover:underline">
                           Gerenciar fila de atendimento <ArrowRight size={16}/>
                        </button>
                     </div>

                     {/* Recent List */}
                     <div className="flex-[2] space-y-2">
                        <h3 className="text-xs font-bold text-slate-400 uppercase mb-2">Recentes</h3>
                        {recentTickets.length === 0 && <p className="text-sm text-slate-400 italic">Nenhum ticket pendente.</p>}
                        {recentTickets.map(t => (
                           <div key={t.id} className="flex items-center justify-between bg-slate-50 p-3 rounded-lg border border-slate-100 hover:border-indigo-200 transition-colors">
                              <div>
                                 <span className="font-bold text-slate-700 text-sm">{t.title}</span>
                                 <div className="text-xs text-slate-500 flex gap-2">
                                    <span className="font-mono">{t.id}</span>
                                    <span>• {t.missionaryName || 'Geral'}</span>
                                 </div>
                              </div>
                              <span className={`text-[10px] font-bold px-2 py-1 rounded ${t.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-white text-slate-600'}`}>
                                 {t.priority}
                              </span>
                           </div>
                        ))}
                     </div>
                  </div>
               </div>

               <OverviewTab stats={stats} onNavigate={(tab) => {
                  if (tab === 'CONSOLE') onNavigate('console');
                  else setActiveTab(tab);
               }} />
            </div>
          )}

          {activeTab === 'TICKETS' && <TicketsList currentUser={currentUser} />}
          {activeTab === 'DONATIONS' && <DonationsTab />}
          {activeTab === 'LOANS' && <LoansTab currentUser={currentUser} onRefresh={handleRefresh} />}
          {activeTab === 'STOCK' && <StockTab />}
          {activeTab === 'REPORTS' && <ReportsTab />}
        </div>
      </main>

      <TicketQuickCreateModal 
        isOpen={isTicketModalOpen} 
        onClose={() => { setIsTicketModalOpen(false); handleRefresh(); }} 
        currentUser={currentUser}
      />
    </div>
  );
};

export default HelpdeskProfile;
