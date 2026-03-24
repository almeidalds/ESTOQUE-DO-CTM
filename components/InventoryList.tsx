
import React, { useState, useMemo } from 'react';
import { InventoryItem, Warehouse, User } from '../types';
import { Edit2, Search, PlusCircle, MinusCircle, History, Tag, Archive, Trash, RefreshCcw, Package, ArrowRightLeft } from 'lucide-react';
import * as InventoryService from '../services/inventoryService';

interface InventoryListProps {
  warehouse: Warehouse;
  items: InventoryItem[];
  currentUser: User; 
  onEdit: (item: InventoryItem) => void;
  onTransaction: (type: 'IN' | 'OUT' | 'TRANSFER', item: InventoryItem) => void;
  onHistory: () => void;
  onPrintLabel: (item: InventoryItem) => void;
  onRefresh: () => void; 
}

const InventoryList: React.FC<InventoryListProps> = ({ 
  warehouse, items, currentUser, onEdit, onTransaction, onHistory, onPrintLabel, onRefresh 
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [viewMode, setViewMode] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');

  const filteredItems = useMemo(() => {
    return items.filter(item => 
      item.warehouseId === warehouse.id &&
      (viewMode === 'ARCHIVED' ? item.isArchived : !item.isArchived) && 
      (item.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
       item.sku.toLowerCase().includes(searchTerm.toLowerCase()) ||
       item.category.toLowerCase().includes(searchTerm.toLowerCase()))
    );
  }, [items, warehouse.id, searchTerm, viewMode]);

  const getStatusBadge = (item: InventoryItem) => {
    if (item.isArchived) return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-slate-100 text-slate-500 border border-slate-200">ARQUIVADO</span>;
    if (item.quantity === 0) return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-red-50 text-red-500 border border-red-100">ZERADO</span>;
    if (item.quantity < item.minLevel) return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-orange-50 text-orange-600 border border-orange-100">BAIXO</span>;
    if (item.quantity > item.maxLevel) return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-yellow-50 text-yellow-600 border border-yellow-100">EXCESSO</span>;
    return <span className="inline-flex items-center px-2.5 py-1 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-600 border border-emerald-100">NORMAL</span>;
  };

  const handleArchive = async (item: InventoryItem) => {
    if (!confirm(`Arquivar "${item.name}"?`)) return;
    try { await InventoryService.archiveItem(item.id, currentUser); onRefresh(); } catch (e: any) { alert(e.message); }
  };
  const handleUnarchive = async (item: InventoryItem) => {
    if (!confirm(`Restaurar "${item.name}"?`)) return;
    try { await InventoryService.unarchiveItem(item.id, currentUser); onRefresh(); } catch (e: any) { alert(e.message); }
  };
  const handleRemoveFromStock = async (item: InventoryItem) => {
    if (item.quantity === 0) return;
    if (!confirm(`Zerar saldo de "${item.name}"?`)) return;
    try { await InventoryService.removeItemFromStock(item.id, warehouse.id, currentUser); onRefresh(); } catch (e: any) { alert(e.message); }
  };

  const isAdmin = currentUser.role === 'admin';
  const isHelpdesk = currentUser.role === 'helpdesk';
  const canEdit = !isHelpdesk && currentUser.role !== 'mobile_add_only';
  
  return (
    <div className="glass-panel rounded-[32px] flex flex-col h-full overflow-hidden animate-fade-in shadow-sm border border-white/60">
      
      {/* Header */}
      <div className="p-6 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-6 bg-white/50 backdrop-blur-sm">
        <div>
          <h2 className="text-3xl font-black text-slate-800 flex items-center gap-3">
            <span className="w-3 h-3 rounded-full ring-4 ring-white shadow-sm" style={{ backgroundColor: warehouse.color }}></span>
            {warehouse.name}
            {warehouse.isArchived && <span className="text-xs bg-red-100 text-red-600 px-2 py-1 rounded-lg">Arquivado</span>}
          </h2>
          <p className="text-slate-500 text-sm font-medium mt-1 flex items-center gap-2">
            <Package size={16} className="text-blue-500" /> {filteredItems.length} Itens Catalogados
          </p>
        </div>
        
        <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
           <div className="relative group">
             <Search size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-blue-500 transition-colors" />
             <input
               className="w-full sm:w-72 pl-12 pr-4 py-3 bg-white border border-slate-200 rounded-2xl text-sm font-bold text-slate-800 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 shadow-sm transition-all outline-none placeholder:font-normal placeholder:text-slate-400"
               placeholder="Buscar item, SKU..."
               value={searchTerm}
               onChange={(e) => setSearchTerm(e.target.value)}
             />
           </div>

           <div className="flex items-center bg-slate-100 rounded-2xl p-1 border border-slate-200">
              <button onClick={() => setViewMode('ACTIVE')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'ACTIVE' ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Ativos</button>
              {isAdmin && <button onClick={() => setViewMode('ARCHIVED')} className={`px-5 py-2.5 rounded-xl text-xs font-bold transition-all ${viewMode === 'ARCHIVED' ? 'bg-red-500 text-white shadow-sm' : 'text-slate-500 hover:text-slate-800'}`}>Arquivados</button>}
           </div>

           <button onClick={onHistory} className="p-3 bg-white hover:bg-slate-50 text-slate-600 rounded-2xl transition-all shadow-sm border border-slate-200" title="Histórico">
             <History size={22} />
           </button>
        </div>
      </div>

      {/* Table with Clean Rows */}
      <div className="overflow-x-auto flex-1 custom-scrollbar p-6">
        <table className="w-full text-left border-separate border-spacing-y-2">
          <thead>
            <tr className="text-[10px] uppercase font-extrabold text-slate-400 tracking-wider">
              <th className="px-6 pb-2 pl-8">Produto</th>
              <th className="px-6 pb-2">Categoria</th>
              <th className="px-6 pb-2 text-right">Saldo</th>
              <th className="px-6 pb-2 text-center">Status</th>
              <th className="px-6 pb-2 text-center">Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredItems.map((item) => (
              <tr key={item.id} className="bg-white shadow-sm hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group rounded-2xl">
                <td className="py-4 px-6 rounded-l-2xl border-l-4 border-transparent hover:border-blue-500 transition-all">
                  <div className="font-bold text-slate-800 text-sm group-hover:text-blue-700 transition-colors">{item.name}</div>
                  <div className="text-[10px] text-slate-400 font-mono mt-1 bg-slate-50 px-1.5 py-0.5 rounded w-fit">{item.sku}</div>
                </td>
                <td className="py-4 px-6 align-middle">
                   <span className="px-2.5 py-1 bg-slate-50 text-slate-600 rounded-md text-[10px] font-bold uppercase tracking-wide border border-slate-100">{item.category}</span>
                </td>
                <td className="py-4 px-6 text-right align-middle">
                  <span className="text-lg font-black text-slate-800">{item.quantity}</span> 
                  <span className="text-xs text-slate-400 ml-1 font-bold">{item.unit}</span>
                </td>
                <td className="py-4 px-6 text-center align-middle">
                  {getStatusBadge(item)}
                </td>
                <td className="py-4 px-6 rounded-r-2xl align-middle">
                  <div className="flex items-center justify-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
                    {!item.isArchived && (
                      <>
                        <button onClick={() => onTransaction('IN', item)} className="p-2 text-emerald-600 bg-emerald-50 hover:bg-emerald-100 rounded-lg transition-colors" title="Entrada"><PlusCircle size={16}/></button>
                        <button onClick={() => onTransaction('OUT', item)} className="p-2 text-orange-600 bg-orange-50 hover:bg-orange-100 rounded-lg transition-colors" title="Saída"><MinusCircle size={16}/></button>
                        <button onClick={() => onTransaction('TRANSFER', item)} className="p-2 text-purple-600 bg-purple-50 hover:bg-purple-100 rounded-lg transition-colors" title="Transferir"><ArrowRightLeft size={16}/></button>
                        
                        <div className="w-px h-6 bg-slate-100 mx-1"></div>
                        
                        {canEdit && <button onClick={() => onEdit(item)} className="p-2 text-blue-600 bg-blue-50 hover:bg-blue-100 rounded-lg transition-all" title="Editar"><Edit2 size={16}/></button>}
                        <button onClick={() => onPrintLabel(item)} className="p-2 text-slate-400 hover:text-slate-800 rounded-lg hover:bg-slate-100" title="Etiqueta"><Tag size={16}/></button>
                        {isAdmin && item.quantity > 0 && <button onClick={() => handleRemoveFromStock(item)} className="p-2 text-slate-300 hover:text-red-500 hover:bg-red-50 rounded-lg"><Trash size={16}/></button>}
                        {isAdmin && <button onClick={() => handleArchive(item)} className="p-2 text-slate-300 hover:text-slate-800 hover:bg-slate-100 rounded-lg"><Archive size={16}/></button>}
                      </>
                    )}
                    {item.isArchived && isAdmin && (
                       <button onClick={() => handleUnarchive(item)} className="px-3 py-1.5 bg-emerald-50 text-emerald-700 rounded-lg font-bold text-xs hover:bg-emerald-100 flex gap-2 items-center"><RefreshCcw size={14}/> Restaurar</button>
                    )}
                  </div>
                </td>
              </tr>
            ))}
            {filteredItems.length === 0 && (
              <tr><td colSpan={5} className="py-24 text-center text-slate-400 flex flex-col items-center justify-center rounded-3xl"><Package size={48} className="mb-4 opacity-20"/><p className="text-sm font-medium">Nenhum item encontrado nesta categoria.</p></td></tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default InventoryList;
