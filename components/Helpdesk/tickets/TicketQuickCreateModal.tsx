
import React, { useState } from 'react';
import { User, TicketPriority } from '../../../types';
import * as TicketsService from '../../../services/ticketsService';
import Modal from '../../Modal';
import { AlertCircle, Check } from 'lucide-react';

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUser: User;
  prefillMissionary?: { id: string; name: string };
  prefillItem?: { id: string; name: string };
}

const TicketQuickCreateModal: React.FC<Props> = ({ isOpen, onClose, currentUser, prefillMissionary, prefillItem }) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [priority, setPriority] = useState<TicketPriority>('NORMAL');
  const [category, setCategory] = useState('Suporte Técnico');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      await TicketsService.createTicket({
        title,
        description,
        priority,
        category,
        missionaryId: prefillMissionary?.id,
        missionaryName: prefillMissionary?.name,
        itemId: prefillItem?.id,
        itemName: prefillItem?.name
      }, currentUser);
      
      onClose();
      setTitle('');
      setDescription('');
    } catch (e: any) {
      alert(e.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <Modal isOpen={isOpen} onClose={onClose} title="Novo Ticket de Suporte">
      <form onSubmit={handleSubmit} className="space-y-4">
        
        {/* Context Info */}
        {(prefillMissionary || prefillItem) && (
          <div className="bg-blue-50 p-3 rounded-lg border border-blue-100 text-xs text-blue-800 flex gap-4">
             {prefillMissionary && <div><strong>Missionário:</strong> {prefillMissionary.name}</div>}
             {prefillItem && <div><strong>Item:</strong> {prefillItem.name}</div>}
          </div>
        )}

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Título / Assunto</label>
          <input required autoFocus className="w-full border rounded-lg p-3 font-bold text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none" value={title} onChange={e => setTitle(e.target.value)} placeholder="Ex: Notebook não liga..." />
        </div>

        <div className="grid grid-cols-2 gap-4">
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Categoria</label>
             <select className="w-full border rounded-lg p-2 text-sm" value={category} onChange={e => setCategory(e.target.value)}>
               <option>Suporte Técnico</option>
               <option>Reposição</option>
               <option>Acessório</option>
               <option>Manutenção</option>
               <option>Outro</option>
             </select>
           </div>
           <div>
             <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Prioridade</label>
             <select className="w-full border rounded-lg p-2 text-sm" value={priority} onChange={e => setPriority(e.target.value as any)}>
               <option value="LOW">Baixa</option>
               <option value="NORMAL">Normal</option>
               <option value="HIGH">Alta</option>
             </select>
           </div>
        </div>

        <div>
          <label className="block text-xs font-bold text-slate-500 uppercase mb-1">Descrição</label>
          <textarea className="w-full border rounded-lg p-3 text-sm h-24 focus:ring-2 focus:ring-blue-500 outline-none" value={description} onChange={e => setDescription(e.target.value)} placeholder="Detalhes do problema..." />
        </div>

        <div className="flex justify-end gap-2 pt-4 border-t border-slate-100">
           <button type="button" onClick={onClose} className="px-4 py-2 text-slate-500 font-bold hover:bg-slate-50 rounded-lg">Cancelar</button>
           <button type="submit" disabled={loading} className="px-6 py-2 bg-[#001B48] text-white rounded-lg font-bold hover:bg-[#02457A] flex items-center gap-2">
             {loading ? 'Salvando...' : <><Check size={16} /> Criar Ticket</>}
           </button>
        </div>
      </form>
    </Modal>
  );
};

export default TicketQuickCreateModal;
