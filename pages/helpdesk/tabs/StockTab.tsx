
import React, { useState, useMemo } from 'react';
import * as HelpdeskProfileService from '../../../services/helpdeskProfileService';
import EmptyState from '../../../components/ui/EmptyState';
import Badge from '../../../components/ui/Badge';
import { Search, Filter, Package, AlertOctagon } from 'lucide-react';
import { CATEGORIES } from '../../../constants';

const StockTab: React.FC = () => {
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState('ALL');
  const [filterType, setFilterType] = useState<'ALL' | 'CRITICAL' | 'EXCESS'>('ALL');

  const items = useMemo(() => {
    return HelpdeskProfileService.getHelpdeskStock(search, category, filterType);
  }, [search, category, filterType]);

  return (
    <div className="space-y-6 animate-fade-in">
      
      {/* Filters */}
      <div className="flex flex-col xl:flex-row gap-4 bg-white p-4 rounded-2xl border border-slate-100 shadow-sm justify-between items-center">
         <div className="flex flex-wrap gap-2 w-full xl:w-auto">
            <div className="relative flex-1 min-w-[200px]">
                <Search size={16} className="absolute left-3 top-3 text-slate-400"/>
                <input 
                  value={search}
                  onChange={e => setSearch(e.target.value)}
                  placeholder="Buscar no estoque..."
                  className="w-full pl-10 pr-4 py-2 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500"
                />
            </div>
            <div className="flex items-center gap-2 bg-slate-50 px-3 py-2 rounded-xl border border-slate-200">
               <Filter size={16} className="text-slate-400"/>
               <select value={category} onChange={e => setCategory(e.target.value)} className="bg-transparent text-sm font-bold text-slate-700 outline-none max-w-[150px]">
                 <option value="ALL">Todas Categorias</option>
                 {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
               </select>
            </div>
         </div>

         <div className="flex bg-slate-50 p-1 rounded-xl border border-slate-200 w-full xl:w-auto">
            <button onClick={() => setFilterType('ALL')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterType === 'ALL' ? 'bg-white text-slate-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Todos</button>
            <button onClick={() => setFilterType('CRITICAL')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterType === 'CRITICAL' ? 'bg-red-50 text-red-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Críticos</button>
            <button onClick={() => setFilterType('EXCESS')} className={`flex-1 px-4 py-2 text-xs font-bold rounded-lg transition-all ${filterType === 'EXCESS' ? 'bg-orange-50 text-orange-700 shadow-sm' : 'text-slate-500 hover:text-slate-700'}`}>Excesso</button>
         </div>
      </div>

      {/* Table */}
      {items.length === 0 ? (
        <EmptyState title="Estoque vazio" description="Nenhum item corresponde aos filtros." icon={Package} />
      ) : (
        <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
          <table className="w-full text-left text-sm">
            <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 uppercase font-bold text-xs">
              <tr>
                <th className="px-6 py-4">Item</th>
                <th className="px-6 py-4">Categoria</th>
                <th className="px-6 py-4 text-right">Saldo</th>
                <th className="px-6 py-4 text-center">Status</th>
                <th className="px-6 py-4">Localização</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-50">
              {items.map(item => {
                const isCritical = item.quantity < item.minLevel;
                const isExcess = item.quantity > item.maxLevel;
                return (
                  <tr key={item.id} className="hover:bg-slate-50 transition-colors">
                    <td className="px-6 py-4">
                      <div className="font-bold text-slate-800">{item.name}</div>
                      <div className="text-xs text-slate-400 font-mono">{item.sku || item.id}</div>
                    </td>
                    <td className="px-6 py-4 text-slate-600">
                      {item.category}
                    </td>
                    <td className="px-6 py-4 text-right">
                      <span className="text-lg font-black text-slate-800">{item.quantity}</span>
                      <span className="text-xs text-slate-400 ml-1">{item.unit}</span>
                    </td>
                    <td className="px-6 py-4 text-center">
                      {isCritical && <Badge variant="danger">Crítico</Badge>}
                      {isExcess && <Badge variant="warning">Excesso</Badge>}
                      {!isCritical && !isExcess && <Badge variant="success">Normal</Badge>}
                    </td>
                    <td className="px-6 py-4 text-slate-500 text-xs">
                      {item.locationPath || '-'}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
};

export default StockTab;
