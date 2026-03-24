
import React, { useState, useMemo } from 'react';
import { InventoryItem, Warehouse } from '../../types';
import { MapPin, Box, Search } from 'lucide-react';

interface Props {
  items: InventoryItem[];
  warehouses: Warehouse[];
}

const LocationMap: React.FC<Props> = ({ items, warehouses }) => {
  const [selectedStock, setSelectedStock] = useState(warehouses[0]?.id || '');
  const [pathFilter, setPathFilter] = useState('');

  // Items in selected stock
  const stockItems = useMemo(() => 
    items.filter(i => i.warehouseId === selectedStock && !i.isArchived), 
  [items, selectedStock]);

  // Group by Location Path
  const groupedItems = useMemo(() => {
    const groups: Record<string, InventoryItem[]> = {};
    stockItems.forEach(item => {
      const path = item.locationPath || 'Sem Localização Definida';
      if (!groups[path]) groups[path] = [];
      groups[path].push(item);
    });
    return groups;
  }, [stockItems]);

  const filteredPaths = Object.keys(groupedItems).filter(path => 
    path.toLowerCase().includes(pathFilter.toLowerCase())
  ).sort();

  return (
    <div className="p-6 h-full flex flex-col bg-[#F0F5FA] animate-fade-in">
      <div className="flex flex-col md:flex-row justify-between items-center bg-white p-6 rounded-2xl shadow-sm border border-gray-100 mb-6 gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#001B48] flex items-center gap-2">
            <MapPin className="text-[#018ABE]" /> Mapa de Localização
          </h2>
          <p className="text-sm text-gray-500 mt-1">Visualize onde cada item está armazenado.</p>
        </div>
        
        <div className="flex gap-3">
           <select 
             value={selectedStock} 
             onChange={e => setSelectedStock(e.target.value)}
             className="bg-slate-50 border border-slate-200 rounded-xl px-4 py-2 font-bold text-[#001B48] outline-none focus:ring-2 focus:ring-[#018ABE]"
           >
             {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
           </select>
        </div>
      </div>

      <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex gap-4 items-center sticky top-0 z-10">
         <Search className="text-gray-400" />
         <input 
           className="flex-1 outline-none text-sm font-bold text-slate-700" 
           placeholder="Filtrar local (ex: Estante A...)"
           value={pathFilter}
           onChange={e => setPathFilter(e.target.value)}
         />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 overflow-y-auto pb-10 custom-scrollbar">
        {filteredPaths.map(path => (
          <div key={path} className="bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden flex flex-col hover:shadow-md transition-all">
             <div className="bg-slate-50 p-4 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-bold text-[#001B48] flex items-center gap-2 text-sm truncate max-w-[200px]" title={path}>
                  <Box size={16} className="text-[#018ABE]" /> {path}
                </h3>
                <span className="text-xs font-bold bg-white px-2 py-1 rounded border border-gray-200 text-slate-500">
                  {groupedItems[path].length} Itens
                </span>
             </div>
             <div className="p-2 flex-1 max-h-[300px] overflow-y-auto custom-scrollbar">
               <ul className="space-y-1">
                 {groupedItems[path].map(item => (
                   <li key={item.id} className="flex justify-between items-center p-2 hover:bg-slate-50 rounded-lg group">
                      <div className="flex-1 min-w-0 pr-2">
                        <div className="text-sm font-medium text-slate-700 truncate">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">{item.sku}</div>
                      </div>
                      <div className="text-sm font-bold text-[#001B48]">{item.quantity} <span className="text-[10px] font-normal text-slate-400">{item.unit}</span></div>
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        ))}
        {filteredPaths.length === 0 && (
          <div className="col-span-full text-center py-12 text-gray-400 italic">
            Nenhuma localização encontrada.
          </div>
        )}
      </div>
    </div>
  );
};

export default LocationMap;
