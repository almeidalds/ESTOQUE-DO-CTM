
import React, { useState, useEffect } from 'react';
import { Missionary, Transaction, StockRequest, Loan } from '../../types';
import * as InventoryService from '../../services/inventoryService';
import * as HelpdeskService from '../../services/helpdeskService';
import { User, History, Clock, Ticket, Search, RefreshCw, ChevronRight, AlertCircle, Share2, Package, Calendar } from 'lucide-react';
import Modal from '../Modal';

interface Props {
  missionary: Missionary | null;
  setMissionary: (m: Missionary | null) => void;
  inputRef: React.RefObject<HTMLInputElement>;
  onRepeatItem: (itemId: string) => void;
  onSelectTicket: (ticket: StockRequest) => void;
  activeTab: 'SEARCH' | 'QUEUE';
  setActiveTab: (tab: 'SEARCH' | 'QUEUE') => void;
}

const MissionaryPanel: React.FC<Props> = ({ 
  missionary, setMissionary, inputRef, onRepeatItem, onSelectTicket, activeTab, setActiveTab 
}) => {
  const [inputValue, setInputValue] = useState('');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [suggestions, setSuggestions] = useState<Missionary[]>([]);
  const [tickets, setTickets] = useState<StockRequest[]>([]);
  
  // Profile Tabs
  const [profileTab, setProfileTab] = useState<'DONATIONS' | 'LOANS'>('DONATIONS');
  
  // Creation Modal State
  const [isCreationModalOpen, setIsCreationModalOpen] = useState(false);
  const [newMissionaryName, setNewMissionaryName] = useState('');
  const [pendingId, setPendingId] = useState('');

  useEffect(() => {
    if (missionary) {
      setInputValue(missionary.id);
      setHistory(HelpdeskService.getMissionaryHistory(missionary.id));
      setLoans(HelpdeskService.getMissionaryLoans(missionary.id));
      setProfileTab('DONATIONS'); // Reset to default
    } else {
      setInputValue('');
      setHistory([]);
      setLoans([]);
    }
  }, [missionary]);

  useEffect(() => {
    if (activeTab === 'QUEUE') refreshQueue();
  }, [activeTab]);

  const refreshQueue = () => setTickets(HelpdeskService.getOpenTickets());

  const handleSearch = (val: string) => {
    setInputValue(val);
    if (val.length > 1) {
      const all = InventoryService.getMissionaries();
      const matches = all.filter(m => 
        m.id.toLowerCase().includes(val.toLowerCase()) || 
        m.name.toLowerCase().includes(val.toLowerCase())
      ).slice(0, 5);
      setSuggestions(matches);
    } else {
      setSuggestions([]);
    }
  };

  const selectMissionary = (m: Missionary) => {
    setMissionary(m);
    setSuggestions([]);
  };

  const verifyAndLoad = () => {
    const cleanId = inputValue.trim();
    if (!cleanId) return;
    if (cleanId.length < 3) return;

    try {
      const result = HelpdeskService.ensureMissionary(cleanId);
      if (result.exists && result.missionary) {
        setMissionary(result.missionary);
        setSuggestions([]);
      } else if (result.requiresName) {
        setPendingId(cleanId);
        setNewMissionaryName('');
        setIsCreationModalOpen(true);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      verifyAndLoad();
    }
  };

  const handleCreateProfile = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newMissionaryName.trim()) {
      alert("Nome é obrigatório para criar o perfil.");
      return;
    }
    try {
      const result = HelpdeskService.ensureMissionary(pendingId, newMissionaryName);
      if (result.exists && result.missionary) {
        setMissionary(result.missionary);
        setIsCreationModalOpen(false);
        setSuggestions([]);
      }
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50 relative">
      
      {/* Creation Modal */}
      <Modal 
        isOpen={isCreationModalOpen} 
        onClose={() => setIsCreationModalOpen(false)} 
        title="Criar Perfil do Missionário"
      >
        <form onSubmit={handleCreateProfile} className="space-y-4">
           <div className="bg-yellow-50 p-4 rounded-xl border border-yellow-100 flex gap-3">
              <AlertCircle className="text-yellow-600 shrink-0" size={20} />
              <div>
                <h4 className="font-bold text-yellow-800 text-sm">Perfil Não Encontrado</h4>
                <p className="text-xs text-yellow-700 mt-1">O ID informado não existe. Crie o perfil para continuar.</p>
              </div>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Doc ID)</label>
             <input disabled value={pendingId} className="w-full p-3 bg-slate-100 border border-slate-200 rounded-xl font-mono text-slate-500 font-bold" />
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo <span className="text-red-500">*</span></label>
             <input autoFocus required value={newMissionaryName} onChange={e => setNewMissionaryName(e.target.value)} placeholder="Digite o nome..." className="w-full p-3 bg-white border-2 border-slate-300 rounded-xl font-bold text-slate-800 focus:border-blue-500 outline-none" />
           </div>
           <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setIsCreationModalOpen(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-100 rounded-lg">Cancelar</button>
              <button type="submit" className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md">Criar e Atender</button>
           </div>
        </form>
      </Modal>

      {/* Segmented Controls (Search vs Queue) */}
      <div className="p-4 pb-0">
        <div className="bg-slate-200/60 p-1 rounded-xl flex font-bold text-xs">
           <button 
             onClick={() => { setActiveTab('SEARCH'); setTimeout(() => inputRef.current?.focus(), 100); }}
             className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'SEARCH' ? 'bg-white text-blue-800 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Search size={14} /> BUSCAR (F2)
           </button>
           <button 
             onClick={() => setActiveTab('QUEUE')}
             className={`flex-1 py-2.5 rounded-lg flex items-center justify-center gap-2 transition-all ${activeTab === 'QUEUE' ? 'bg-white text-orange-600 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}
           >
             <Ticket size={14} /> FILA ({tickets.length})
           </button>
        </div>
      </div>

      <div className="p-4 border-b border-slate-200 bg-white shadow-sm mt-3 relative z-10 rounded-b-2xl">
        {/* SEARCH & PROFILE HEADER */}
        {activeTab === 'SEARCH' && (
          !missionary ? (
            <div className="relative">
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500" size={20} />
                <input 
                  ref={inputRef}
                  className="w-full pl-12 pr-4 py-4 border-2 border-slate-200 rounded-xl text-lg font-bold bg-slate-50 focus:bg-white focus:outline-none focus:border-blue-500 text-slate-800 transition-all placeholder:text-slate-300"
                  placeholder="Digite ID ou Nome..."
                  value={inputValue}
                  onChange={e => handleSearch(e.target.value)}
                  onKeyDown={handleKeyDown}
                  onBlur={() => setTimeout(() => verifyAndLoad(), 200)}
                  autoComplete="off"
                />
              </div>
              {suggestions.length > 0 && (
                <div className="absolute top-full left-0 w-full bg-white border border-slate-100 shadow-xl rounded-xl mt-2 z-20 overflow-hidden">
                  {suggestions.map(s => (
                    <button key={s.id} onClick={() => selectMissionary(s)} className="w-full text-left p-3 hover:bg-blue-50 border-b border-slate-50 last:border-0 flex justify-between items-center group">
                      <div><div className="font-bold text-slate-700 group-hover:text-blue-700">{s.name}</div><div className="text-xs text-slate-400 font-mono group-hover:text-blue-400">{s.id}</div></div>
                      <ChevronRight size={16} className="text-slate-300 group-hover:text-blue-400" />
                    </button>
                  ))}
                </div>
              )}
            </div>
          ) : (
            <div className="animate-fade-in">
               <div className="bg-[#001B48] rounded-2xl p-5 text-white shadow-lg shadow-blue-900/20 relative overflow-hidden group mb-4">
                  <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 rounded-full -mr-10 -mt-10 blur-2xl"></div>
                  <button onClick={() => setMissionary(null)} className="absolute top-3 right-3 text-blue-200 hover:text-white text-[10px] font-bold bg-white/10 px-2 py-1 rounded hover:bg-white/20 transition-colors">TROCAR</button>
                  <div className="flex items-center gap-4">
                    <div className="w-14 h-14 bg-gradient-to-br from-blue-400 to-blue-600 rounded-full flex items-center justify-center text-xl font-bold border-4 border-white/10 shadow-inner">
                      {missionary.name.charAt(0)}
                    </div>
                    <div>
                      <h2 className="font-bold text-lg leading-tight">{missionary.name}</h2>
                      <p className="text-blue-200 font-mono text-xs tracking-wider opacity-80">{missionary.id}</p>
                    </div>
                  </div>
               </div>

               {/* Profile Sub-Tabs */}
               <div className="flex border-b border-slate-100">
                  <button 
                    onClick={() => setProfileTab('DONATIONS')}
                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${profileTab === 'DONATIONS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Doações
                  </button>
                  <button 
                    onClick={() => setProfileTab('LOANS')}
                    className={`flex-1 pb-2 text-xs font-bold uppercase tracking-wide border-b-2 transition-colors ${profileTab === 'LOANS' ? 'border-blue-600 text-blue-700' : 'border-transparent text-slate-400 hover:text-slate-600'}`}
                  >
                    Empréstimos
                  </button>
               </div>
            </div>
          )
        )}

        {/* QUEUE HEADER */}
        {activeTab === 'QUEUE' && (
           <div className="flex justify-between items-center py-2">
              <span className="text-xs font-bold text-slate-500 uppercase tracking-wide">Pedidos Pendentes</span>
              <button onClick={refreshQueue} className="text-slate-400 hover:text-blue-600 p-1 rounded-full hover:bg-slate-100"><RefreshCw size={14}/></button>
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar bg-slate-50">
        
        {/* === TAB: SEARCH / PROFILE === */}
        {activeTab === 'SEARCH' && missionary && (
          <div className="animate-fade-in">
            
            {/* --- ABA DE DOAÇÕES --- */}
            {profileTab === 'DONATIONS' && (
              <div className="space-y-4">
                <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Package size={14}/> Histórico Recente</h4>
                   <span className="text-[10px] font-bold bg-slate-200 text-slate-600 px-2 py-0.5 rounded-full">{history.length}</span>
                </div>

                {/* Quick Actions (Suggestion based on history) */}
                {history.length > 0 && (
                  <div className="flex flex-wrap gap-2 mb-4">
                    {Array.from(new Set(history.map(h => h.itemId))).slice(0, 3).map(itemId => {
                       const item = history.find(h => h.itemId === itemId);
                       return (
                         <button key={itemId} onClick={() => onRepeatItem(itemId)} className="px-3 py-1.5 bg-white hover:bg-blue-50 text-slate-600 hover:text-blue-700 rounded-lg text-[10px] font-bold border border-slate-200 shadow-sm transition-all truncate max-w-full flex items-center gap-1">
                           <RefreshCw size={10}/> Repetir {item?.itemName.split(' ')[0]}
                         </button>
                       )
                    })}
                  </div>
                )}

                <div className="space-y-3">
                  {history.map(tx => (
                    <div key={tx.id} className="bg-white p-3 rounded-xl border border-slate-100 shadow-sm flex items-start gap-3 group hover:border-blue-200 transition-colors">
                      <div className="mt-1 p-1.5 bg-green-50 text-green-600 rounded-lg">
                         <Package size={16} />
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-start">
                           <span className="text-sm font-bold text-slate-700 truncate">{tx.itemName}</span>
                           <span className="text-xs font-black text-slate-800 bg-slate-100 px-1.5 rounded">x{tx.quantity}</span>
                        </div>
                        <div className="flex justify-between items-center mt-1">
                           <span className="text-[10px] text-slate-400 font-medium bg-slate-50 px-1 rounded">{tx.reasonCategory === 'DONATION_TO_MISSIONARY' ? 'Doação' : tx.type}</span>
                           <span className="text-[10px] text-slate-400 flex items-center gap-1"><Clock size={10}/> {new Date(tx.timestamp).toLocaleDateString()}</span>
                        </div>
                      </div>
                    </div>
                  ))}
                  {history.length === 0 && <p className="text-center py-8 text-xs text-slate-400 italic">Sem histórico de doações.</p>}
                </div>
              </div>
            )}

            {/* --- ABA DE EMPRÉSTIMOS --- */}
            {profileTab === 'LOANS' && (
              <div className="space-y-4">
                 <div className="flex justify-between items-center mb-2">
                   <h4 className="text-xs font-bold text-slate-400 uppercase flex items-center gap-2"><Share2 size={14}/> Itens Emprestados</h4>
                   <span className="text-[10px] font-bold bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full">{loans.filter(l => l.status !== 'CLOSED').length} Ativos</span>
                </div>

                <div className="space-y-3">
                  {loans.map(loan => {
                    const isOverdue = loan.status === 'OPEN' && new Date(loan.dueAt) < new Date();
                    const isOpen = loan.status === 'OPEN' || loan.status === 'OVERDUE';
                    
                    return (
                      <div key={loan.id} className={`bg-white p-3 rounded-xl border-l-4 shadow-sm relative overflow-hidden ${isOpen ? (isOverdue ? 'border-l-red-500' : 'border-l-blue-500') : 'border-l-gray-300 opacity-70'}`}>
                         <div className="flex justify-between items-start mb-2">
                            <span className="text-[10px] font-mono text-slate-400 font-bold">#{loan.id}</span>
                            <span className={`text-[9px] font-black px-1.5 py-0.5 rounded uppercase ${isOverdue ? 'bg-red-100 text-red-700' : isOpen ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-500'}`}>
                              {isOverdue ? 'Atrasado' : loan.status === 'OPEN' ? 'Aberto' : 'Devolvido'}
                            </span>
                         </div>
                         
                         {loan.items.map(item => (
                           <div key={item.itemId} className="flex justify-between text-xs mb-1">
                              <span className="font-medium text-slate-700">{item.itemName}</span>
                              <span className="font-bold text-slate-900">{item.qtyReturned}/{item.qtyLoaned}</span>
                           </div>
                         ))}

                         <div className="mt-2 pt-2 border-t border-slate-50 flex justify-between items-center">
                            <div className="flex items-center gap-1 text-[10px] text-slate-500">
                               <Calendar size={10} />
                               <span>Devolução: <strong className={isOverdue ? 'text-red-600' : ''}>{new Date(loan.dueAt).toLocaleDateString()}</strong></span>
                            </div>
                         </div>
                      </div>
                    );
                  })}
                  {loans.length === 0 && <p className="text-center py-8 text-xs text-slate-400 italic">Nenhum empréstimo registrado.</p>}
                </div>
              </div>
            )}

          </div>
        )}

        {activeTab === 'SEARCH' && !missionary && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
            <User size={48} className="mb-4 text-slate-200" strokeWidth={1.5} />
            <p className="text-sm font-medium text-center">Identifique o missionário<br/>para ver o histórico.</p>
          </div>
        )}

        {/* === TAB: QUEUE === */}
        {activeTab === 'QUEUE' && (
           <div className="space-y-3">
             {tickets.map(ticket => (
               <div key={ticket.id} onClick={() => onSelectTicket(ticket)} className="bg-white border border-slate-200 p-4 rounded-xl shadow-sm hover:shadow-md hover:border-orange-300 cursor-pointer group transition-all relative overflow-hidden">
                 <div className="absolute left-0 top-0 bottom-0 w-1 bg-orange-400 group-hover:bg-orange-500 transition-colors"></div>
                 <div className="flex justify-between items-start mb-2">
                    <span className="font-bold text-slate-800 text-sm group-hover:text-orange-700">{ticket.requesterName}</span>
                    <span className="text-[10px] font-mono bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded border border-slate-200">#{ticket.id}</span>
                 </div>
                 <div className="text-sm text-slate-600 mb-2">
                   {ticket.itemName} <strong className="text-orange-600 ml-1">x{ticket.quantity}</strong>
                 </div>
                 {ticket.notes && <div className="text-xs text-slate-500 italic bg-slate-50 p-2 rounded">"{ticket.notes}"</div>}
                 <div className="mt-2 text-[10px] text-slate-400 text-right">
                   {new Date(ticket.createdAt).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})} • {new Date(ticket.createdAt).toLocaleDateString()}
                 </div>
               </div>
             ))}
             {tickets.length === 0 && (
               <div className="text-center py-12 text-slate-400">
                 <Ticket size={48} className="mx-auto mb-3 opacity-30"/>
                 <p className="text-sm">Fila vazia.</p>
               </div>
             )}
           </div>
        )}

      </div>
    </div>
  );
};

export default MissionaryPanel;
