
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem } from '../../types';
import * as HelpdeskService from '../../services/helpdeskService';
import { Search, Zap, Package, Plus, AlertCircle, Barcode, Camera } from 'lucide-react';
import { useDebounce } from '../../hooks/useDebounce';

interface Props {
  items: InventoryItem[];
  onAddItem: (item: InventoryItem) => void;
  onOpenScanner: () => void;
  inputRef: React.RefObject<HTMLInputElement>;
}

const StockLookupPanel: React.FC<Props> = ({ items, onAddItem, onOpenScanner, inputRef }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const debouncedSearch = useDebounce(searchTerm, 300); // 300ms delay
  
  const [topItems, setTopItems] = useState<{ item: InventoryItem; count: number }[]>([]);

  useEffect(() => {
    setTopItems(HelpdeskService.getTopItemsToday());
  }, [items]);

  // Filter Logic with Debounce
  const filtered = useMemo(() => {
    if (debouncedSearch.length < 2) return [];
    
    const lowerTerm = debouncedSearch.toLowerCase().trim();
    
    return items.filter(i => 
      i.name.toLowerCase().includes(lowerTerm) || 
      i.sku.toLowerCase().includes(lowerTerm)
    ).slice(0, 10);
  }, [items, debouncedSearch]);

  // Suggestions logic (Items with quantity > 0)
  const suggestions = useMemo(() => {
    return items.filter(i => i.quantity > 0).slice(0, 4);
  }, [items]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      if (filtered.length > 0) {
        onAddItem(filtered[0]);
        setSearchTerm('');
      } else if (filtered.length === 0 && debouncedSearch.length > 0) {
         // Try exact SKU match even if not in filtered slice (edge case)
         const exactSku = items.find(i => i.sku.toLowerCase() === debouncedSearch.toLowerCase());
         if (exactSku) {
            onAddItem(exactSku);
            setSearchTerm('');
         }
      }
    }
  };

  return (
    <div className="flex flex-col h-full bg-slate-50/50">
      
      {/* Search Header */}
      <div className="p-4 border-b border-slate-200 bg-white">
        <div className="flex justify-between items-center mb-2">
          <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider flex items-center gap-2">
            <Search size={14} /> Catálogo Helpdesk (F3)
          </h3>
          <button 
            onClick={onOpenScanner}
            className="flex items-center gap-1.5 px-2.5 py-1 bg-red-50 text-red-600 rounded-lg text-[10px] font-bold border border-red-100 hover:bg-red-100 transition-colors"
          >
            <Camera size={12} /> SCANNER
          </button>
        </div>
        <div className="relative group">
          <input 
            ref={inputRef}
            className="w-full pl-4 pr-12 py-3 text-sm font-bold border-2 border-slate-200 rounded-xl focus:outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 transition-all text-slate-800"
            placeholder="Buscar por Nome ou SKU..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
          />
          <div className="absolute right-3 top-3 text-[10px] text-slate-400 font-bold bg-slate-100 px-2 py-0.5 rounded border border-slate-200 group-focus-within:border-blue-200 group-focus-within:text-blue-500 group-focus-within:bg-blue-50">
            ENTER
          </div>
        </div>
        {debouncedSearch && filtered.length === 0 && (
           <div className="mt-2 text-xs text-orange-500 font-medium flex items-center gap-1">
             <AlertCircle size={12} /> Nenhum resultado para "{debouncedSearch}"
           </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        
        {/* Search Results */}
        {debouncedSearch.length >= 2 && (
          <div className="mb-6 animate-fade-in">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 ml-1">Resultados da Busca</h4>
            <div className="space-y-2">
              {filtered.map((item, idx) => (
                <button 
                  key={item.id}
                  onClick={() => { onAddItem(item); setSearchTerm(''); inputRef.current?.focus(); }}
                  className={`w-full text-left p-3 rounded-xl border transition-all flex justify-between items-center group relative overflow-hidden
                    ${idx === 0 ? 'bg-blue-50 border-blue-300 shadow-sm ring-1 ring-blue-200' : 'bg-white border-slate-200 hover:border-blue-300 hover:shadow-md'}
                  `}
                >
                  <div className="relative z-10 flex-1">
                    <div className="text-sm font-bold text-slate-700 group-hover:text-blue-800">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono mt-0.5 flex items-center gap-1">
                      <Barcode size={10} /> {item.sku}
                    </div>
                  </div>
                  <div className={`relative z-10 text-xs font-bold px-2 py-1 rounded-lg ${item.quantity > 0 ? 'bg-white text-slate-600 border border-slate-200' : 'bg-red-100 text-red-600 border border-red-200'}`}>
                    {item.quantity} un
                  </div>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Top Used Today - Grid Layout */}
        {!searchTerm && (
          <div className="mb-6">
            <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 ml-1">
              <Zap size={14} className="text-yellow-500 fill-yellow-500" /> Mais Saídas Hoje
            </h4>
            
            {topItems.length > 0 ? (
              <div className="grid grid-cols-2 gap-3">
                {topItems.map(({ item, count }) => (
                  <button 
                    key={item.id}
                    onClick={() => onAddItem(item)}
                    className="relative text-left p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-md transition-all group overflow-hidden"
                  >
                    <div className="absolute top-0 right-0 bg-green-500 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-bl-lg shadow-sm">
                      {count}x
                    </div>
                    <div className="font-bold text-xs text-slate-700 truncate pr-4 group-hover:text-blue-700 mb-1">{item.name}</div>
                    <div className="text-[10px] text-slate-400 font-mono">Estoque: {item.quantity}</div>
                  </button>
                ))}
              </div>
            ) : (
              <div className="p-4 text-center text-xs text-slate-400 bg-slate-100 rounded-xl border border-slate-200 italic">
                Nenhuma movimentação hoje ainda.
              </div>
            )}
          </div>
        )}

        {/* Suggestions / Quick Add */}
        {!searchTerm && (
          <div>
             <h4 className="text-xs font-bold text-slate-400 uppercase mb-3 flex items-center gap-2 ml-1">
               <Package size={14} /> Sugestões
             </h4>
             <div className="space-y-2">
               {suggestions.map(item => (
                 <button 
                   key={item.id}
                   onClick={() => onAddItem(item)}
                   className="w-full flex items-center justify-between p-3 bg-white border border-slate-200 rounded-xl hover:border-blue-400 hover:shadow-sm group transition-all"
                 >
                    <div className="text-left flex-1 min-w-0 pr-2">
                      <div className="font-bold text-sm text-slate-700 truncate group-hover:text-blue-700">{item.name}</div>
                      <div className="text-[10px] text-slate-400">Saldo: {item.quantity} {item.unit}</div>
                    </div>
                    <div className="bg-slate-50 p-1.5 rounded-lg text-slate-400 group-hover:bg-blue-600 group-hover:text-white transition-colors shadow-sm">
                      <Plus size={16} strokeWidth={3} />
                    </div>
                 </button>
               ))}
               {suggestions.length === 0 && <p className="text-xs text-slate-400 p-2">Estoque vazio.</p>}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default StockLookupPanel;
