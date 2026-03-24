
import React, { useState, useEffect } from 'react';
import { Missionary, Transaction, Loan, DonationTerm, User } from '../../types';
import * as InventoryService from '../../services/inventoryService';
import { User as UserIcon, Clock, Share2, FileText, CheckCircle, AlertTriangle, Download } from 'lucide-react';
import TermSigner from './TermSigner';

interface Props {
  missionary: Missionary;
  onBack: () => void;
  currentUser: User;
}

const MissionaryProfile: React.FC<Props> = ({ missionary, onBack, currentUser }) => {
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'LOANS' | 'TERMS'>('TIMELINE');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [terms, setTerms] = useState<DonationTerm[]>([]);
  
  // Signer State
  const [isSignerOpen, setIsSignerOpen] = useState(false);
  const [termTypeToSign, setTermTypeToSign] = useState<'DONATION' | 'LOAN'>('DONATION');

  useEffect(() => {
    // Carregar dados
    const allTxs = InventoryService.getTransactions();
    const misTxs = allTxs.filter(t => t.recipients?.some(r => r.missionaryId === missionary.id))
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
    setHistory(misTxs);

    const allLoans = InventoryService.getLoans();
    const misLoans = allLoans.filter(l => l.missionaryId === missionary.id)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
    setLoans(misLoans);

    // MOCK: Terms are stored in localStorage for prototype
    const storedTerms = localStorage.getItem('nexus7_terms_v1');
    const allTerms: DonationTerm[] = storedTerms ? JSON.parse(storedTerms) : [];
    setTerms(allTerms.filter(t => t.missionaryId === missionary.id));
  }, [missionary.id, isSignerOpen]);

  const handleSaveTerm = (signature: string) => {
    // Collect items for term (last 30 days transactions for simplicity in this prototype)
    // In real app, you select which items.
    const recentItems = history.slice(0, 10).map(tx => ({ itemName: tx.itemName, quantity: tx.quantity, date: tx.timestamp }));
    
    const newTerm: DonationTerm = {
      id: `TERM-${Date.now()}`,
      missionaryId: missionary.id,
      missionaryName: missionary.name,
      generatedAt: new Date().toISOString(),
      periodStart: new Date().toISOString(), // Mock
      periodEnd: new Date().toISOString(),
      items: recentItems,
      status: 'SIGNED',
      signature: signature,
      signedAt: new Date().toISOString(),
      type: termTypeToSign
    };

    // Save to local
    const storedTerms = localStorage.getItem('nexus7_terms_v1');
    const allTerms = storedTerms ? JSON.parse(storedTerms) : [];
    allTerms.push(newTerm);
    localStorage.setItem('nexus7_terms_v1', JSON.stringify(allTerms));
    
    setIsSignerOpen(false);
  };

  const totalOverdue = loans.filter(l => l.status === 'OPEN' && new Date(l.dueAt) < new Date()).length;

  return (
    <div className="flex flex-col h-full bg-[#F0F5FA] animate-fade-in p-6">
      <button onClick={onBack} className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-800 w-fit">← Voltar</button>
      
      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex justify-between items-start mb-6">
         <div className="flex gap-4">
            <div className="w-16 h-16 bg-[#001B48] rounded-full flex items-center justify-center text-white text-2xl font-bold">
              {missionary.name.charAt(0)}
            </div>
            <div>
              <h1 className="text-2xl font-black text-[#001B48]">{missionary.name}</h1>
              <p className="text-sm text-gray-500 font-mono">ID: {missionary.id}</p>
              <div className="flex gap-2 mt-2">
                 <span className="px-3 py-1 bg-blue-50 text-blue-700 rounded-lg text-xs font-bold">
                   {history.length} Transações
                 </span>
                 {totalOverdue > 0 && (
                   <span className="px-3 py-1 bg-red-100 text-red-700 rounded-lg text-xs font-bold flex items-center gap-1">
                     <AlertTriangle size={12}/> {totalOverdue} Atrasados
                   </span>
                 )}
              </div>
            </div>
         </div>
         <button 
           onClick={() => { setTermTypeToSign('DONATION'); setIsSignerOpen(true); }}
           className="px-4 py-2 bg-[#018ABE] text-white rounded-xl font-bold hover:bg-[#001B48] transition-colors flex items-center gap-2 shadow-lg"
         >
           <FileText size={18} /> Novo Termo
         </button>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6">
         <button onClick={() => setActiveTab('TIMELINE')} className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'TIMELINE' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Timeline</button>
         <button onClick={() => setActiveTab('LOANS')} className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'LOANS' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Empréstimos</button>
         <button onClick={() => setActiveTab('TERMS')} className={`pb-2 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'TERMS' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Documentos</button>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto custom-scrollbar">
        
        {activeTab === 'TIMELINE' && (
          <div className="space-y-4">
             {history.map(tx => (
               <div key={tx.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex gap-4">
                  <div className={`p-2 rounded-full h-fit ${tx.type === 'OUT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
                    {tx.type === 'OUT' ? <Share2 size={20}/> : <CheckCircle size={20}/>}
                  </div>
                  <div className="flex-1">
                    <div className="flex justify-between">
                       <h4 className="font-bold text-slate-800">{tx.itemName} <span className="text-slate-400 font-normal">x{tx.quantity}</span></h4>
                       <span className="text-xs text-gray-400">{new Date(tx.timestamp).toLocaleDateString()}</span>
                    </div>
                    <p className="text-sm text-gray-500 mt-1">{tx.reason || 'Sem observações'}</p>
                    <div className="mt-2 text-xs font-bold text-slate-400 bg-slate-50 w-fit px-2 py-1 rounded">
                       {tx.reasonCategory || tx.type} • Por {tx.deliveredBy || tx.user}
                    </div>
                  </div>
               </div>
             ))}
             {history.length === 0 && <p className="text-center text-gray-400 py-10">Nenhuma atividade.</p>}
          </div>
        )}

        {activeTab === 'LOANS' && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
             {loans.map(loan => {
                const isOverdue = new Date(loan.dueAt) < new Date() && loan.status === 'OPEN';
                return (
                  <div key={loan.id} className={`bg-white p-5 rounded-xl border-l-4 shadow-sm ${loan.status === 'CLOSED' ? 'border-l-green-500' : isOverdue ? 'border-l-red-500' : 'border-l-blue-500'}`}>
                     <div className="flex justify-between items-start mb-3">
                        <span className="text-xs font-mono text-gray-400 font-bold">#{loan.id}</span>
                        <span className={`text-[10px] font-black px-2 py-1 rounded uppercase ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                          {loan.status === 'OPEN' && isOverdue ? 'ATRASADO' : loan.status}
                        </span>
                     </div>
                     <div className="space-y-2 mb-4">
                        {loan.items.map(i => (
                          <div key={i.itemId} className="flex justify-between text-sm">
                             <span className="text-slate-700 font-medium">{i.itemName}</span>
                             <span className="font-bold">{i.qtyReturned} / {i.qtyLoaned}</span>
                          </div>
                        ))}
                     </div>
                     <div className="text-xs text-gray-500 pt-3 border-t border-gray-100 flex justify-between">
                        <span>Empréstimo: {new Date(loan.createdAt).toLocaleDateString()}</span>
                        <span className={isOverdue ? 'text-red-600 font-bold' : ''}>Devolução: {new Date(loan.dueAt).toLocaleDateString()}</span>
                     </div>
                  </div>
                );
             })}
             {loans.length === 0 && <p className="text-center text-gray-400 py-10 col-span-full">Nenhum empréstimo.</p>}
          </div>
        )}

        {activeTab === 'TERMS' && (
          <div className="space-y-4">
             {terms.map(term => (
               <div key={term.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center hover:shadow-md transition-all">
                  <div className="flex items-center gap-4">
                     <div className="bg-slate-100 p-3 rounded-lg text-slate-500">
                        <FileText size={24} />
                     </div>
                     <div>
                        <h4 className="font-bold text-slate-800">Termo de {term.type === 'DONATION' ? 'Doação' : 'Empréstimo'}</h4>
                        <p className="text-xs text-gray-500">Gerado em: {new Date(term.generatedAt).toLocaleDateString()}</p>
                     </div>
                  </div>
                  <div className="flex items-center gap-4">
                     <span className="text-xs font-bold bg-green-100 text-green-700 px-2 py-1 rounded flex items-center gap-1">
                        <CheckCircle size={12} /> ASSINADO
                     </span>
                     <button className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Baixar PDF">
                        <Download size={20} />
                     </button>
                  </div>
               </div>
             ))}
             {terms.length === 0 && <p className="text-center text-gray-400 py-10">Nenhum termo assinado.</p>}
          </div>
        )}

      </div>

      {isSignerOpen && (
        <TermSigner 
          missionary={missionary} 
          type={termTypeToSign} 
          items={history.slice(0, 5).map(tx => ({ itemName: tx.itemName, quantity: tx.quantity }))} // Mock passing items
          onClose={() => setIsSignerOpen(false)} 
          onSave={handleSaveTerm}
        />
      )}
    </div>
  );
};

export default MissionaryProfile;
