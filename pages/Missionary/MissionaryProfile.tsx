
import React, { useState, useEffect } from 'react';
import { Missionary, Transaction, Loan, DonationTerm, User } from '../../types';
import * as InventoryService from '../../services/inventoryService';
import * as MissionaryService from '../../services/missionaryService';
import { User as UserIcon, Clock, Share2, FileText, CheckCircle, AlertTriangle, Download, Edit2, Save, X } from 'lucide-react';
import TermSigner from './TermSigner';
import Modal from '../../components/Modal';

interface Props {
  missionary: Missionary;
  onBack: () => void;
  currentUser: User;
}

const MissionaryProfile: React.FC<Props> = ({ missionary, onBack, currentUser }) => {
  const [currentMissionary, setCurrentMissionary] = useState(missionary);
  const [activeTab, setActiveTab] = useState<'TIMELINE' | 'LOANS' | 'TERMS'>('TIMELINE');
  const [history, setHistory] = useState<Transaction[]>([]);
  const [loans, setLoans] = useState<Loan[]>([]);
  const [terms, setTerms] = useState<DonationTerm[]>([]);
  
  // Edit Mode
  const [isEditing, setIsEditing] = useState(false);
  const [editForm, setEditForm] = useState<Partial<Missionary>>({});
  
  // Signer
  const [isSignerOpen, setIsSignerOpen] = useState(false);
  const [termTypeToSign, setTermTypeToSign] = useState<'DONATION' | 'LOAN'>('DONATION');

  useEffect(() => {
    refreshData();
  }, [currentMissionary.id]);

  const refreshData = () => {
    const allTxs = InventoryService.getTransactions();
    setHistory(allTxs.filter(t => t.recipients?.some(r => r.missionaryId === currentMissionary.id))
      .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime()));

    const allLoans = InventoryService.getLoans();
    setLoans(allLoans.filter(l => l.missionaryId === currentMissionary.id)
      .sort((a,b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()));

    const storedTerms = localStorage.getItem('nexus7_terms_v1');
    const allTerms: DonationTerm[] = storedTerms ? JSON.parse(storedTerms) : [];
    setTerms(allTerms.filter(t => t.missionaryId === currentMissionary.id));
  };

  const handleEditStart = () => {
    setEditForm({
      name: currentMissionary.name,
      language: currentMissionary.language || '',
      branch: currentMissionary.branch || '',
      district: currentMissionary.district || '',
      notes: currentMissionary.notes || '',
      email: currentMissionary.email || '',
      phone: currentMissionary.phone || ''
    });
    setIsEditing(true);
  };

  const handleEditSave = async () => {
    try {
      const updated = await MissionaryService.updateMissionaryProfile(currentMissionary.id, editForm, currentUser);
      setCurrentMissionary(updated);
      setIsEditing(false);
      alert("Perfil atualizado com sucesso!");
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleSaveTerm = (signature: string) => {
    const recentItems = history.slice(0, 10).map(tx => ({ itemName: tx.itemName, quantity: tx.quantity, date: tx.timestamp }));
    
    const newTerm: DonationTerm = {
      id: `TERM-${Date.now()}`,
      missionaryId: currentMissionary.id,
      missionaryName: currentMissionary.name,
      generatedAt: new Date().toISOString(),
      periodStart: new Date().toISOString(),
      periodEnd: new Date().toISOString(),
      items: recentItems,
      status: 'SIGNED',
      signature: signature,
      signedAt: new Date().toISOString(),
      type: termTypeToSign
    };

    const storedTerms = localStorage.getItem('nexus7_terms_v1');
    const allTerms = storedTerms ? JSON.parse(storedTerms) : [];
    allTerms.push(newTerm);
    localStorage.setItem('nexus7_terms_v1', JSON.stringify(allTerms));
    
    setIsSignerOpen(false);
    refreshData();
  };

  return (
    <div className="flex flex-col h-full bg-[#F0F5FA] animate-fade-in p-6">
      <button onClick={onBack} className="mb-4 text-sm font-bold text-slate-500 hover:text-slate-800 w-fit">← Voltar</button>
      
      {/* Header Profile */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 flex flex-col md:flex-row justify-between items-start mb-6 gap-6">
         <div className="flex gap-4 w-full">
            <div className="w-20 h-20 bg-[#001B48] rounded-full flex items-center justify-center text-white text-3xl font-bold shrink-0 shadow-lg shadow-blue-900/20">
              {currentMissionary.name.charAt(0)}
            </div>
            <div className="flex-1">
              <div className="flex justify-between items-start">
                 <div>
                   <h1 className="text-2xl font-black text-[#001B48]">{currentMissionary.name}</h1>
                   <p className="text-sm text-gray-500 font-mono">ID: {currentMissionary.id}</p>
                 </div>
                 <button onClick={handleEditStart} className="text-blue-600 bg-blue-50 p-2 rounded-lg hover:bg-blue-100 transition-colors">
                   <Edit2 size={18} />
                 </button>
              </div>
              
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                 <div><span className="text-gray-400 block text-xs uppercase font-bold">Idioma</span> {currentMissionary.language || '-'}</div>
                 <div><span className="text-gray-400 block text-xs uppercase font-bold">Ramo/Ala</span> {currentMissionary.branch || '-'}</div>
                 <div><span className="text-gray-400 block text-xs uppercase font-bold">Distrito/Estaca</span> {currentMissionary.district || '-'}</div>
                 <div><span className="text-gray-400 block text-xs uppercase font-bold">Contato</span> {currentMissionary.phone || '-'}</div>
              </div>
              
              {currentMissionary.notes && (
                <div className="mt-4 bg-yellow-50 p-3 rounded-lg border border-yellow-100 text-sm text-yellow-800">
                   <strong>Notas:</strong> {currentMissionary.notes}
                </div>
              )}
            </div>
         </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-4 border-b border-gray-200 mb-6 bg-white px-4 pt-2 rounded-t-xl">
         <button onClick={() => setActiveTab('TIMELINE')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'TIMELINE' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Timeline</button>
         <button onClick={() => setActiveTab('LOANS')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'LOANS' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Empréstimos</button>
         <button onClick={() => setActiveTab('TERMS')} className={`pb-3 px-4 font-bold text-sm border-b-2 transition-all ${activeTab === 'TERMS' ? 'border-[#001B48] text-[#001B48]' : 'border-transparent text-gray-400'}`}>Documentos</button>
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
                        <div>
                           <span className="text-xs font-mono text-gray-400 font-bold">#{loan.id}</span>
                           <span className={`ml-2 text-[10px] font-black px-2 py-1 rounded uppercase ${isOverdue ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                             {loan.status === 'OPEN' && isOverdue ? 'ATRASADO' : loan.status}
                           </span>
                        </div>
                        {/* Se não tiver termo assinado e estiver aberto, mostrar botão */}
                        {loan.status === 'OPEN' && (!loan.term || loan.term.status === 'PENDING_SIGNATURE') && (
                           <button onClick={() => { setTermTypeToSign('LOAN'); setIsSignerOpen(true); }} className="text-xs bg-yellow-100 text-yellow-700 px-2 py-1 rounded font-bold border border-yellow-200 hover:bg-yellow-200">
                             Assinar Termo
                           </button>
                        )}
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
             <div className="flex justify-end">
                <button 
                  onClick={() => { setTermTypeToSign('DONATION'); setIsSignerOpen(true); }}
                  className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg text-xs font-bold hover:bg-slate-300"
                >
                  + Termo Avulso
                </button>
             </div>
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
                     {term.pdfUrl && (
                       <a href={term.pdfUrl} target="_blank" rel="noreferrer" className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors" title="Baixar PDF">
                          <Download size={20} />
                       </a>
                     )}
                  </div>
               </div>
             ))}
             {terms.length === 0 && <p className="text-center text-gray-400 py-10">Nenhum termo assinado.</p>}
          </div>
        )}

      </div>

      {/* Edit Modal */}
      <Modal isOpen={isEditing} onClose={() => setIsEditing(false)} title="Editar Perfil do Missionário">
         <div className="space-y-4">
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">ID (Imutável)</label>
              <input disabled value={currentMissionary.id} className="w-full bg-slate-100 border border-slate-200 rounded-lg p-3 text-slate-500 font-mono" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Nome Completo</label>
              <input 
                value={editForm.name} 
                onChange={e => setEditForm({...editForm, name: e.target.value})} 
                className="w-full border rounded-lg p-3" 
                disabled={currentUser.role === 'helpdesk'}
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Idioma</label>
                 <input value={editForm.language} onChange={e => setEditForm({...editForm, language: e.target.value})} className="w-full border rounded-lg p-3" />
               </div>
               <div>
                 <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Telefone</label>
                 <input value={editForm.phone} onChange={e => setEditForm({...editForm, phone: e.target.value})} className="w-full border rounded-lg p-3" />
               </div>
            </div>
            {currentUser.role !== 'helpdesk' && (
              <div className="grid grid-cols-2 gap-4">
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Ramo/Ala</label>
                   <input value={editForm.branch} onChange={e => setEditForm({...editForm, branch: e.target.value})} className="w-full border rounded-lg p-3" />
                 </div>
                 <div>
                   <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Distrito/Estaca</label>
                   <input value={editForm.district} onChange={e => setEditForm({...editForm, district: e.target.value})} className="w-full border rounded-lg p-3" />
                 </div>
              </div>
            )}
            <div>
              <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Notas Internas</label>
              <textarea value={editForm.notes} onChange={e => setEditForm({...editForm, notes: e.target.value})} className="w-full border rounded-lg p-3 h-24" />
            </div>
            <div className="flex justify-end gap-2 pt-4">
               <button onClick={() => setIsEditing(false)} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
               <button onClick={handleEditSave} className="px-6 py-2 bg-blue-600 text-white font-bold rounded-lg hover:bg-blue-700 shadow-md flex items-center gap-2">
                 <Save size={16}/> Salvar Alterações
               </button>
            </div>
         </div>
      </Modal>

      {isSignerOpen && (
        <TermSigner 
          missionary={currentMissionary} 
          type={termTypeToSign} 
          items={history.slice(0, 5).map(tx => ({ itemName: tx.itemName, quantity: tx.quantity }))} 
          onClose={() => setIsSignerOpen(false)} 
          onSave={handleSaveTerm}
        />
      )}
    </div>
  );
};

export default MissionaryProfile;
