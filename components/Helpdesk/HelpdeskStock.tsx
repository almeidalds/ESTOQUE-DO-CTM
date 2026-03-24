
import React, { useState } from 'react';
import { InventoryItem } from '../../types';
import { Search, AlertTriangle, AlertOctagon, CheckCircle, Package } from 'lucide-react';

interface HelpdeskStockProps {
  items: InventoryItem[];
  onClose: () => void;
}

const HelpdeskStock: React.FC<HelpdeskStockProps> = ({ items, onClose }) => {
  const [search, setSearch] = useState('');
  
  // Filter for Helpdesk stock only (Already passed filtered usually, but safety check)
  const stockItems = items.filter(i => 
    i.warehouseId === 'STOCK-HELPDESK' && 
    !i.isArchived &&
    (i.name.toLowerCase().includes(search.toLowerCase()) || 
     i.sku.toLowerCase().includes(search.toLowerCase()) ||
     i.id.toLowerCase().includes(search.toLowerCase()))
  );

  return (
    <div className="flex flex-col h-full bg-white overflow-hidden">
      {/* Header */}
      <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-slate-50">
        <div>
           <h2 className="font-bold text-gray-800 text-xl flex items-center gap-2">
             <Package className="text-blue-600" /> Estoque Helpdesk
           </h2>
           <p className="text-xs text-gray-500 mt-1">Visualização de saldo disponível para suporte.</p>
        </div>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 font-bold text-sm">Fechar (Esc)</button>
      </div>

      {/* Search */}
      <div className="p-4 border-b border-gray-100 sticky top-0 bg-white z-10">
        <div className="relative">
          <Search className="absolute left-4 top-3.5 text-gray-400" size={18} />
          <input 
            type="text"
            autoFocus
            className="w-full pl-12 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl text-sm font-bold focus:outline-none focus:ring-2 focus:ring-blue-500"
            placeholder="Buscar por Nome, SKU ou ID..."
            value={search}
            onChange={e => setSearch(e.target.value)}
          />
        </div>
      </div>

      {/* List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar p-4">
        {stockItems.length === 0 ? (
          <div className="p-12 text-center text-gray-400 flex flex-col items-center">
             <Search size={48} className="mb-4 opacity-20" />
             <p>Nenhum item encontrado.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            {stockItems.map(item => {
              const isCritical = item.quantity < item.minLevel;
              const isExcess = item.quantity > item.maxLevel;
              
              return (
                <div key={item.id} className="p-4 flex justify-between items-center bg-white border border-gray-100 rounded-xl shadow-sm hover:shadow-md transition-all">
                  <div>
                    <div className="font-bold text-gray-800 text-lg">{item.name}</div>
                    <div className="flex items-center gap-2 mt-1">
                       <span className="text-[10px] bg-slate-100 text-slate-500 px-1.5 py-0.5 rounded font-mono border border-slate-200">{item.id}</span>
                       <span className="text-xs text-gray-400 font-mono">{item.sku}</span>
                    </div>
                    <div className="flex gap-2 mt-2">
                      {isCritical && <span className="text-[10px] bg-red-100 text-red-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><AlertTriangle size={10}/> BAIXO</span>}
                      {isExcess && <span className="text-[10px] bg-orange-100 text-orange-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><AlertOctagon size={10}/> ALTO</span>}
                      {!isCritical && !isExcess && <span className="text-[10px] bg-green-100 text-green-700 px-2 py-0.5 rounded font-bold flex items-center gap-1"><CheckCircle size={10}/> OK</span>}
                    </div>
                  </div>
                  <div className="text-right bg-slate-50 p-2 rounded-lg min-w-[70px] text-center border border-slate-100">
                    <div className="text-2xl font-black text-slate-800">{item.quantity}</div>
                    <div className="text-[10px] text-slate-400 font-bold uppercase">{item.unit}</div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
};

export default HelpdeskStock;
