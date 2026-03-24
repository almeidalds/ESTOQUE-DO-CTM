
import React, { useState, useEffect } from 'react';
import { User, Ticket, TicketStatus } from '../../types';
import * as TicketsService from '../../services/ticketsService';
import { Ticket as TicketIcon, Search, Filter, CheckCircle, Clock, XCircle, MoreVertical } from 'lucide-react';
import Badge from '../../components/ui/Badge';

interface Props {
  currentUser: User;
}

const TicketsList: React.FC<Props> = ({ currentUser }) => {
  const [tickets, setTickets] = useState<Ticket[]>([]);
  const [statusFilter, setStatusFilter] = useState<TicketStatus | 'ALL'>('ALL');
  
  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    // Mock fetch all
    const all = TicketsService.getTickets();
    setTickets(all);
  };

  const handleStatusChange = async (id: string, status: TicketStatus) => {
    await TicketsService.updateTicketStatus(id, status, currentUser);
    refresh();
  };

  const filtered = tickets.filter(t => statusFilter === 'ALL' || t.status === statusFilter);

  const getStatusBadge = (status: string) => {
    switch(status) {
      case 'OPEN': return <Badge variant="warning">Aberto</Badge>;
      case 'IN_PROGRESS': return <Badge variant="info">Em Andamento</Badge>;
      case 'RESOLVED': return <Badge variant="success">Resolvido</Badge>;
      default: return <Badge variant="neutral">{status}</Badge>;
    }
  };

  return (
    <div className="space-y-6 animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-2">
            <div className="p-2 bg-indigo-50 text-indigo-600 rounded-lg"><TicketIcon size={20}/></div>
            <h2 className="font-bold text-slate-800">Todos os Tickets</h2>
         </div>
         
         <div className="flex gap-2 bg-slate-50 p-1 rounded-lg border border-slate-200">
            <button onClick={() => setStatusFilter('ALL')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'ALL' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Todos</button>
            <button onClick={() => setStatusFilter('OPEN')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'OPEN' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Abertos</button>
            <button onClick={() => setStatusFilter('RESOLVED')} className={`px-4 py-1.5 text-xs font-bold rounded-md transition-all ${statusFilter === 'RESOLVED' ? 'bg-white shadow text-indigo-600' : 'text-slate-500'}`}>Resolvidos</button>
         </div>
      </div>

      <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
         <table className="w-full text-left text-sm">
           <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
             <tr>
               <th className="px-6 py-4">Assunto</th>
               <th className="px-6 py-4">Categoria</th>
               <th className="px-6 py-4">Solicitante</th>
               <th className="px-6 py-4">Prioridade</th>
               <th className="px-6 py-4">Status</th>
               <th className="px-6 py-4 text-right">Ações</th>
             </tr>
           </thead>
           <tbody className="divide-y divide-slate-50">
             {filtered.map(t => (
               <tr key={t.id} className="hover:bg-slate-50 transition-colors">
                 <td className="px-6 py-4">
                   <div className="font-bold text-slate-800">{t.title}</div>
                   <div className="text-xs text-slate-400 font-mono">#{t.id} • {new Date(t.createdAt).toLocaleDateString()}</div>
                 </td>
                 <td className="px-6 py-4 text-slate-600">{t.category}</td>
                 <td className="px-6 py-4">
                   <div className="text-slate-800 font-medium">{t.missionaryName || 'Helpdesk Interno'}</div>
                   <div className="text-xs text-slate-400">{t.missionaryId}</div>
                 </td>
                 <td className="px-6 py-4">
                   <span className={`text-[10px] font-bold px-2 py-1 rounded ${t.priority === 'HIGH' ? 'bg-red-100 text-red-700' : 'bg-slate-100 text-slate-600'}`}>
                     {t.priority}
                   </span>
                 </td>
                 <td className="px-6 py-4">{getStatusBadge(t.status)}</td>
                 <td className="px-6 py-4 text-right">
                   {t.status !== 'RESOLVED' && (
                     <button onClick={() => handleStatusChange(t.id, 'RESOLVED')} className="text-green-600 hover:bg-green-50 p-2 rounded-full" title="Marcar Resolvido">
                       <CheckCircle size={18}/>
                     </button>
                   )}
                 </td>
               </tr>
             ))}
             {filtered.length === 0 && <tr><td colSpan={6} className="p-8 text-center text-gray-400">Nenhum ticket encontrado.</td></tr>}
           </tbody>
         </table>
      </div>
    </div>
  );
};

export default TicketsList;
