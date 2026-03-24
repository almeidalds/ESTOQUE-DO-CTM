
import React from 'react';
import { InventoryItem, Warehouse } from '../types';
import { AlertTriangle, AlertOctagon, ArrowRight, Package, ArrowRightLeft, PlusCircle, TrendingDown, TrendingUp, CheckCircle } from 'lucide-react';

interface StockAlertsProps {
  filteredItems: InventoryItem[];
  warehouses: Warehouse[];
  onNavigateToAll: (type: 'CRITICAL' | 'EXCESS') => void;
  onAction: (type: 'IN' | 'TRANSFER', item: InventoryItem) => void;
}

interface AlertRowProps {
  item: InventoryItem; 
  type: 'critical' | 'excess'; 
  warehouseName: string;
  onAction: (type: 'IN' | 'TRANSFER', item: InventoryItem) => void;
}

const AlertRow: React.FC<AlertRowProps> = ({ item, type, warehouseName, onAction }) => {
  const diff = type === 'critical' ? item.minLevel - item.quantity : item.quantity - item.maxLevel;

  return (
    <tr className="group transition-all hover:bg-slate-50 border-b border-gray-50 last:border-0">
      {/* Item Info */}
      <td className="py-4 px-5 align-middle">
        <div className="flex flex-col">
          <span className="font-bold text-slate-700 text-sm group-hover:text-[#324F85] transition-colors">{item.name}</span>
          <div className="flex items-center gap-2 mt-1">
             <span className="text-[10px] font-mono text-slate-400 bg-slate-100 px-1.5 py-0.5 rounded border border-slate-200">{item.id}</span>
             <span className="text-[10px] text-slate-400 font-medium truncate max-w-[120px]">{warehouseName}</span>
          </div>
        </div>
      </td>

      {/* Status Column with Visual Indicator */}
      <td className="py-4 px-5 align-middle text-right">
        <div className="flex flex-col items-end gap-1.5">
          <div className="flex items-baseline gap-1">
             <span className={`text-lg font-black leading-none tracking-tight ${type === 'critical' ? 'text-red-500' : 'text-orange-500'}`}>
               {item.quantity}
             </span>
             <span className="text-xs text-slate-400 font-bold">
               / {type === 'critical' ? item.minLevel : item.maxLevel}
             </span>
          </div>
          
          <div className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wide border ${
             type === 'critical' ? 'bg-red-50 text-red-600 border-red-100' : 'bg-orange-50 text-orange-600 border-orange-100'
          }`}>
             {type === 'critical' ? <TrendingDown size={10} strokeWidth={3} /> : <TrendingUp size={10} strokeWidth={3} />}
             {type === 'critical' ? `Falta ${diff}` : `Sobra ${diff}`}
          </div>
        </div>
      </td>

      {/* Actions */}
      <td className="py-4 px-5 align-middle text-right">
        <div className="flex justify-end items-center gap-2">
           {/* Primary Action Button */}
           {type === 'critical' && (
             <button 
               onClick={() => onAction('IN', item)} 
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-green-700 hover:bg-green-50 hover:text-green-800 rounded-lg text-xs font-bold transition-all border border-green-200 shadow-sm hover:shadow-md"
               title="Repor Estoque"
             >
               <PlusCircle size={14} strokeWidth={2.5} /> Repor
             </button>
           )}
           {type === 'excess' && (
             <button 
               onClick={() => onAction('TRANSFER', item)} 
               className="flex items-center gap-1.5 px-3 py-1.5 bg-white text-blue-700 hover:bg-blue-50 hover:text-blue-800 rounded-lg text-xs font-bold transition-all border border-blue-200 shadow-sm hover:shadow-md"
               title="Transferir Excesso"
             >
               <ArrowRightLeft size={14} strokeWidth={2.5} /> Mover
             </button>
           )}
        </div>
      </td>
    </tr>
  );
};

const StockAlerts: React.FC<StockAlertsProps> = ({ filteredItems, warehouses, onNavigateToAll, onAction }) => {
  
  const getWarehouseName = (id: string) => {
    return warehouses.find(w => w.id === id)?.name || id;
  };

  // 1. Processar Críticos (qty < min)
  const criticalItems = filteredItems
    .filter(i => i.quantity < i.minLevel)
    .sort((a, b) => (b.minLevel - b.quantity) - (a.minLevel - a.quantity))
    .slice(0, 5); // Limit to 5 for cleaner dashboard view

  // 2. Processar Excesso (qty > max)
  const excessItems = filteredItems
    .filter(i => i.quantity > i.maxLevel)
    .sort((a, b) => (b.quantity - b.maxLevel) - (a.quantity - a.maxLevel))
    .slice(0, 5); // Limit to 5 for cleaner dashboard view

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 h-full">
      
      {/* Bloco Crítico (Baixo) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full ring-1 ring-red-50">
        <div className="px-6 py-5 border-b border-red-50 flex justify-between items-center bg-gradient-to-r from-red-50/50 to-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-red-100 text-red-600 flex items-center justify-center shadow-sm shadow-red-100">
               <AlertTriangle size={20} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Nível Crítico</h3>
               <p className="text-xs text-red-500 font-medium mt-0.5">Abaixo do mínimo</p>
             </div>
          </div>
          <button 
            onClick={() => onNavigateToAll('CRITICAL')}
            className="text-xs font-bold text-red-600 hover:text-red-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-red-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            Ver todos ({filteredItems.filter(i => i.quantity < i.minLevel).length}) <ArrowRight size={12} strokeWidth={3} />
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-50">
              {criticalItems.length > 0 ? (
                criticalItems.map(item => (
                  <AlertRow 
                    key={item.id} 
                    item={item} 
                    type="critical" 
                    warehouseName={getWarehouseName(item.warehouseId)}
                    onAction={onAction}
                  />
                ))
              ) : (
                <tr>
                  <td className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-green-50 rounded-full flex items-center justify-center mb-3 text-green-500 shadow-sm">
                         <CheckCircle size={32} /> 
                       </div>
                       <span className="text-slate-800 font-bold text-sm">Tudo certo por aqui!</span>
                       <span className="text-slate-400 text-xs mt-1">Nenhum item em nível crítico.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Bloco Excesso (Alto) */}
      <div className="bg-white rounded-[20px] shadow-sm border border-gray-100 overflow-hidden flex flex-col h-full ring-1 ring-orange-50">
        <div className="px-6 py-5 border-b border-orange-50 flex justify-between items-center bg-gradient-to-r from-orange-50/50 to-white">
          <div className="flex items-center gap-3">
             <div className="w-10 h-10 rounded-xl bg-orange-100 text-orange-600 flex items-center justify-center shadow-sm shadow-orange-100">
               <AlertOctagon size={20} strokeWidth={2.5} />
             </div>
             <div>
               <h3 className="text-sm font-bold text-gray-800 uppercase tracking-wide">Excesso</h3>
               <p className="text-xs text-orange-500 font-medium mt-0.5">Acima do máximo</p>
             </div>
          </div>
          <button 
             onClick={() => onNavigateToAll('EXCESS')}
             className="text-xs font-bold text-orange-600 hover:text-orange-800 flex items-center gap-1 bg-white px-3 py-1.5 rounded-full border border-orange-100 shadow-sm transition-all hover:shadow-md hover:-translate-y-0.5"
          >
            Ver todos ({filteredItems.filter(i => i.quantity > i.maxLevel).length}) <ArrowRight size={12} strokeWidth={3} />
          </button>
        </div>
        
        <div className="overflow-x-auto flex-1 custom-scrollbar">
          <table className="w-full text-left">
            <tbody className="divide-y divide-gray-50">
              {excessItems.length > 0 ? (
                excessItems.map(item => (
                  <AlertRow 
                    key={item.id} 
                    item={item} 
                    type="excess" 
                    warehouseName={getWarehouseName(item.warehouseId)}
                    onAction={onAction}
                  />
                ))
              ) : (
                <tr>
                   <td className="py-16 text-center">
                    <div className="flex flex-col items-center justify-center">
                       <div className="w-16 h-16 bg-blue-50 rounded-full flex items-center justify-center mb-3 text-blue-500 shadow-sm">
                         <Package size={32} /> 
                       </div>
                       <span className="text-slate-800 font-bold text-sm">Estoque Equilibrado</span>
                       <span className="text-slate-400 text-xs mt-1">Nenhum item com excesso.</span>
                    </div>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

    </div>
  );
};

export default StockAlerts;
