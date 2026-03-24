
import React, { useState } from 'react';
import { StockRequest } from '../../types';
import { Ticket, CheckCircle, Clock, ArrowRight, RefreshCw, Search } from 'lucide-react';

interface QueuePanelProps {
  tickets: StockRequest[];
  onSelectTicket: (ticket: StockRequest) => void;
  onRefresh: () => void;
}

const QueuePanel: React.FC<QueuePanelProps> = ({ tickets, onSelectTicket, onRefresh }) => {
  const [filter, setFilter] = useState('');

  const filtered = tickets.filter(t => 
    t.requesterName.toLowerCase().includes(filter.toLowerCase()) ||
    t.itemName.toLowerCase().includes(filter.toLowerCase()) ||
    t.id.toLowerCase().includes(filter.toLowerCase())
  );

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      {/* Header */}
      <div className="p-3 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
        <h3 className="font-bold text-slate-700 flex items-center gap-2">
          <Ticket size={18} /> Fila de Pedidos
          <span className="bg-slate-200 text-slate-600 text-xs px-2 py-0.5 rounded-full">{tickets.length}</span>
        </h3>
        <button onClick={onRefresh} className="p-1 hover:bg-slate-200 rounded text-slate-500"><RefreshCw size={16}/></button>
      </div>

      {/* Search */}
      <div className="p-2 border-b border-gray-100">
        <div className="relative">
           <Search size={14} className="absolute left-3 top-2.5 text-gray-400"/>
           <input 
             className="w-full pl-9 pr-3 py-2 text-sm bg-slate-50 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 outline-none"
             placeholder="Filtrar pedidos..."
             value={filter}
             onChange={e => setFilter(e.target.value)}
           />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-2">
        {filtered.length === 0 ? (
          <div className="text-center py-10 text-gray-400 text-sm">Nenhum pedido na fila.</div>
        ) : (
          filtered.map(ticket => (
            <div 
              key={ticket.id}
              className="group p-3 rounded-lg border border-gray-100 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer bg-white"
              onClick={() => onSelectTicket(ticket)}
            >
              <div className="flex justify-between items-start mb-1">
                <span className="font-mono text-xs text-gray-400 font-bold">{ticket.id}</span>
                {ticket.status === 'APPROVED' ? (
                  <span className="text-[10px] font-bold bg-green-100 text-green-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <CheckCircle size={10} /> APROVADO
                  </span>
                ) : (
                  <span className="text-[10px] font-bold bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded flex items-center gap-1">
                    <Clock size={10} /> ABERTO
                  </span>
                )}
              </div>
              
              <div className="font-bold text-slate-800 text-sm mb-0.5">{ticket.requesterName}</div>
              <div className="text-xs text-slate-500 mb-2 truncate">{ticket.itemName} (x{ticket.quantity})</div>
              
              <div className="flex justify-end opacity-0 group-hover:opacity-100 transition-opacity">
                 <span className="text-xs text-blue-600 font-bold flex items-center gap-1">
                   Carregar <ArrowRight size={12} />
                 </span>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
};

export default QueuePanel;
