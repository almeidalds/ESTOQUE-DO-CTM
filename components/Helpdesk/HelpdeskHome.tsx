
import React from 'react';
import { InventoryItem, Transaction } from '../../types';
import { Truck, Package, Clock, AlertTriangle } from 'lucide-react';

interface HelpdeskHomeProps {
  items: InventoryItem[];
  transactions: Transaction[];
  onNavigate: (page: string) => void;
}

const HelpdeskHome: React.FC<HelpdeskHomeProps> = ({ items, transactions, onNavigate }) => {
  const stockItems = items.filter(i => i.warehouseId === 'STOCK-HELPDESK' && !i.isArchived);
  const lowStock = stockItems.filter(i => i.quantity < i.minLevel).length;
  
  // Recent transactions for Helpdesk
  const recent = transactions
    .filter(t => t.fromWarehouseId === 'STOCK-HELPDESK')
    .sort((a,b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime())
    .slice(0, 3);

  return (
    <div className="space-y-6">
      {/* Quick Actions */}
      <button 
        onClick={() => onNavigate('deliver')}
        className="w-full py-8 bg-gradient-to-r from-red-600 to-red-500 text-white rounded-2xl shadow-xl shadow-red-200 active:scale-95 transition-transform flex flex-col items-center justify-center gap-3"
      >
        <div className="p-3 bg-white/20 rounded-full">
          <Truck size={32} />
        </div>
        <div className="text-center">
          <div className="text-xl font-bold">Entregar Item</div>
          <div className="text-white/80 text-sm">Doação / Saída</div>
        </div>
      </button>

      {/* Stats Cards */}
      <div className="grid grid-cols-2 gap-4">
        <div onClick={() => onNavigate('stock')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-blue-50 text-blue-600 rounded-lg"><Package size={20} /></div>
            <span className="text-2xl font-bold text-gray-800">{stockItems.length}</span>
          </div>
          <div className="text-xs text-gray-500 font-medium">Itens em Estoque</div>
        </div>
        
        <div onClick={() => onNavigate('stock')} className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 active:bg-gray-50">
          <div className="flex justify-between items-start mb-2">
            <div className="p-2 bg-orange-50 text-orange-600 rounded-lg"><AlertTriangle size={20} /></div>
            <span className="text-2xl font-bold text-orange-600">{lowStock}</span>
          </div>
          <div className="text-xs text-gray-500 font-medium">Nível Crítico</div>
        </div>
      </div>

      {/* Recent Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="p-4 border-b border-gray-50 flex justify-between items-center">
          <h3 className="font-bold text-gray-800 flex items-center gap-2"><Clock size={16}/> Recentes</h3>
          <button onClick={() => onNavigate('history')} className="text-xs text-red-600 font-bold">Ver tudo</button>
        </div>
        <div className="divide-y divide-gray-50">
          {recent.length === 0 ? (
            <div className="p-6 text-center text-gray-400 text-sm">Nenhuma atividade recente.</div>
          ) : (
            recent.map(t => (
              <div key={t.id} className="p-4 flex items-center justify-between">
                <div>
                  <div className="font-bold text-sm text-gray-800">{t.itemName}</div>
                  <div className="text-xs text-gray-500">Para: {t.recipients?.[0]?.missionaryName || 'Desconhecido'}</div>
                </div>
                <div className="text-red-600 font-bold text-sm">-{t.quantity}</div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
};

export default HelpdeskHome;
