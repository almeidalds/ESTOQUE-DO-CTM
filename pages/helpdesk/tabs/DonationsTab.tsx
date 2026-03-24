
import React, { useState, useMemo } from 'react';
import * as HelpdeskProfileService from '../../../services/helpdeskProfileService';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { Search, Calendar, User, Package } from 'lucide-react';

const DonationsTab: React.FC = () => {
  const [range, setRange] = useState('30d');
  const [search, setSearch] = useState('');

  const donations = useMemo(() => {
    return HelpdeskProfileService.getHelpdeskDonations(range, search);
  }, [range, search]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters */}
      <div className="flex flex-col md:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
         <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
            <Calendar size={16} className="text-slate-400"/>
            <select 
              value={range} 
              onChange={e => setRange(e.target.value)}
              className="bg-transparent text-sm font-bold text-slate-700 outline-none"
            >
              <option value="today">Hoje</option>
              <option value="7d">7 Dias</option>
              <option value="30d">30 Dias</option>
            </select>
         </div>
         <div className="flex-1 relative">
            <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
            <input 
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Buscar por item ou missionário..."
              className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
            />
         </div>
      </div>

      {/* Table */}
      {donations.length === 0 ? (
        <EmptyState title="Nenhuma doação encontrada" />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
                <tr>
                  <th className="px-6 py-4">Data</th>
                  <th className="px-6 py-4">Missionário</th>
                  <th className="px-6 py-4">Item</th>
                  <th className="px-6 py-4 text-right">Qtd</th>
                  <th className="px-6 py-4">Operador</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-50">
                {donations.map(tx => (
                  <tr key={tx.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4 text-slate-600">
                      <div className="font-medium">{new Date(tx.timestamp).toLocaleDateString()}</div>
                      <div className="text-xs text-slate-400">{new Date(tx.timestamp).toLocaleTimeString([], {hour:'2-digit', minute:'2-digit'})}</div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="flex items-center gap-2">
                        <div className="bg-blue-50 p-1.5 rounded-full text-blue-600"><User size={14}/></div>
                        <div>
                          <div className="font-bold text-slate-800">{tx.recipients?.[0]?.missionaryName || 'Desconhecido'}</div>
                          <div className="text-xs text-slate-400 font-mono">{tx.recipients?.[0]?.missionaryId}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="font-medium text-slate-700">{tx.itemName}</div>
                      <div className="text-xs text-slate-400 flex items-center gap-1"><Package size={10}/> {tx.reasonCategory}</div>
                    </td>
                    <td className="px-6 py-4 text-right">
                      <Badge variant="neutral" className="text-sm px-3">-{tx.quantity}</Badge>
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {tx.deliveredBy || tx.user}
                      <div className="text-[10px] text-slate-400">{tx.deliveryLocation}</div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};

export default DonationsTab;
