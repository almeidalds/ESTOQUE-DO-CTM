import React, { useState, useEffect } from 'react';
import { StockRequest, User, InventoryItem } from '../types';
import * as InventoryService from '../services/inventoryService';
import { Ticket, CheckCircle, XCircle, Clock, Plus } from 'lucide-react';

interface TicketManagerProps {
  currentUser: User;
}

const TicketManager: React.FC<TicketManagerProps> = ({ currentUser }) => {
  const [requests, setRequests] = useState<StockRequest[]>([]);
  const [items, setItems] = useState<InventoryItem[]>([]);
  const [view, setView] = useState<'LIST' | 'CREATE'>('LIST');

  // Create Form State
  const [newItemId, setNewItemId] = useState('');
  const [newQty, setNewQty] = useState(1);
  const [newNotes, setNewNotes] = useState('');

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setRequests(InventoryService.getRequests());
    // Only fetch items from Helpdesk stock for creation context, or all if manager
    const allItems = InventoryService.getItems();
    setItems(allItems.filter(i => i.warehouseId === 'STOCK-HELPDESK'));
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    const item = items.find(i => i.id === newItemId);
    if (!item) return;

    InventoryService.createRequest(currentUser, item.id, item.name, newQty, newNotes);
    setView('LIST');
    refresh();
  };

  const handleProcess = (reqId: string, action: 'APPROVE' | 'REJECT') => {
    try {
      InventoryService.processRequest(reqId, action, currentUser);
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <div>
          <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
            <Ticket className="text-red-500" /> Central de Chamados (Help Desk)
          </h2>
          <p className="text-sm text-gray-500">Solicitação e aprovação de materiais de suporte.</p>
        </div>
        
        {view === 'LIST' && (
          <button 
            onClick={() => setView('CREATE')}
            className="px-4 py-2 bg-red-600 text-white rounded-lg font-bold flex items-center gap-2 hover:bg-red-700 transition-colors"
          >
            <Plus size={20} /> Novo Ticket
          </button>
        )}
      </div>

      {view === 'CREATE' ? (
        <div className="bg-white p-6 rounded-xl shadow-sm border border-gray-100 max-w-lg mx-auto w-full">
          <h3 className="text-lg font-bold mb-4">Nova Solicitação</h3>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Item (Estoque HelpDesk)</label>
              <select 
                required 
                className="w-full border rounded-lg p-2" 
                value={newItemId}
                onChange={e => setNewItemId(e.target.value)}
              >
                <option value="">Selecione...</option>
                {items.map(i => (
                  <option key={i.id} value={i.id}>{i.name} (Disp: {i.quantity})</option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Quantidade</label>
              <input 
                type="number" 
                min="1" 
                required 
                className="w-full border rounded-lg p-2" 
                value={newQty}
                onChange={e => setNewQty(parseInt(e.target.value))}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Justificativa</label>
              <textarea 
                className="w-full border rounded-lg p-2" 
                rows={3} 
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
              />
            </div>
            <div className="flex justify-end gap-2 pt-4">
              <button type="button" onClick={() => setView('LIST')} className="px-4 py-2 text-gray-600">Cancelar</button>
              <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded-lg">Criar Ticket</button>
            </div>
          </form>
        </div>
      ) : (
        <div className="flex-1 overflow-auto bg-white rounded-xl shadow-sm border border-gray-100">
           <table className="w-full text-left">
             <thead className="bg-gray-50 border-b border-gray-100">
               <tr>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">ID</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Solicitante</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Item</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase">Status</th>
                 <th className="p-4 text-xs font-bold text-gray-500 uppercase text-right">Ações</th>
               </tr>
             </thead>
             <tbody className="divide-y divide-gray-100">
               {requests.map(req => (
                 <tr key={req.id}>
                   <td className="p-4 text-sm font-mono text-gray-500">{req.id}</td>
                   <td className="p-4">
                     <div className="font-bold text-gray-800">{req.requesterName}</div>
                     <div className="text-xs text-gray-400">{new Date(req.createdAt).toLocaleDateString()}</div>
                   </td>
                   <td className="p-4">
                     <div className="text-sm font-medium">{req.itemName}</div>
                     <div className="text-xs text-gray-500">Qtd: {req.quantity}</div>
                     {req.notes && <div className="text-xs italic text-gray-400 mt-1">"{req.notes}"</div>}
                   </td>
                   <td className="p-4">
                     {req.status === 'OPEN' && <span className="px-2 py-1 bg-yellow-100 text-yellow-700 rounded text-xs font-bold flex items-center w-fit gap-1"><Clock size={12}/> ABERTO</span>}
                     {req.status === 'APPROVED' && <span className="px-2 py-1 bg-green-100 text-green-700 rounded text-xs font-bold flex items-center w-fit gap-1"><CheckCircle size={12}/> APROVADO</span>}
                     {req.status === 'REJECTED' && <span className="px-2 py-1 bg-red-100 text-red-700 rounded text-xs font-bold flex items-center w-fit gap-1"><XCircle size={12}/> REJEITADO</span>}
                   </td>
                   <td className="p-4 text-right">
                     {req.status === 'OPEN' && currentUser.role !== 'helpdesk' && (
                       <div className="flex justify-end gap-2">
                         <button onClick={() => handleProcess(req.id, 'APPROVE')} className="p-1 text-green-600 hover:bg-green-50 rounded" title="Aprovar"><CheckCircle size={20}/></button>
                         <button onClick={() => handleProcess(req.id, 'REJECT')} className="p-1 text-red-600 hover:bg-red-50 rounded" title="Rejeitar"><XCircle size={20}/></button>
                       </div>
                     )}
                     {req.status === 'APPROVED' && <div className="text-xs text-gray-400">por {req.approvedBy}</div>}
                   </td>
                 </tr>
               ))}
               {requests.length === 0 && (
                 <tr><td colSpan={5} className="p-8 text-center text-gray-400">Nenhum chamado encontrado.</td></tr>
               )}
             </tbody>
           </table>
        </div>
      )}
    </div>
  );
};

export default TicketManager;
