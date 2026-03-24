
import React, { useState, useEffect } from 'react';
import { Warehouse } from '../types';
import { Save, Plus, Archive, RefreshCcw, Box, Trash2, Edit3, Check, X } from 'lucide-react';
import { AVAILABLE_ICONS } from '../constants';
import * as InventoryService from '../services/inventoryService';
import * as Icons from 'lucide-react';

interface WarehouseSettingsProps {
  warehouses: Warehouse[];
  onUpdateAll: (warehouses: Warehouse[]) => void;
  onResetWarehouses: () => void;
  onResetFullSystem: () => void;
}

const WarehouseSettings: React.FC<WarehouseSettingsProps> = ({ 
  warehouses, 
  onUpdateAll
}) => {
  const [localWarehouses, setLocalWarehouses] = useState<Warehouse[]>([]);
  const [activeTab, setActiveTab] = useState<'ACTIVE' | 'ARCHIVED'>('ACTIVE');
  const [isDirty, setIsDirty] = useState(false);

  // New Stock Form
  const [isCreating, setIsCreating] = useState(false);
  const [newStock, setNewStock] = useState({ id: '', name: '', type: 'geral', color: '#324F85', icon: 'Package' });

  // Mock Admin User
  const currentUser = { uid: 'sys', name: 'Admin', role: 'admin' as any };

  useEffect(() => {
    // Deep copy to allow editing without affecting parent state immediately
    setLocalWarehouses(JSON.parse(JSON.stringify(warehouses)));
    setIsDirty(false);
  }, [warehouses]);

  const handleChange = (id: string, field: keyof Warehouse, value: string) => {
    setLocalWarehouses(prev => prev.map(wh => 
      wh.id === id ? { ...wh, [field]: value } : wh
    ));
    setIsDirty(true);
  };

  const handleSave = () => {
    onUpdateAll(localWarehouses);
    setIsDirty(false);
    alert('Configurações de estoque atualizadas com sucesso!');
  };

  const handleCreateStock = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newStock.id || !newStock.name) return alert("Preencha ID e Nome");
    
    try {
      await InventoryService.createStock(newStock, currentUser);
      alert("Estoque criado com sucesso!");
      setIsCreating(false);
      setNewStock({ id: '', name: '', type: 'geral', color: '#324F85', icon: 'Package' });
      // Force reload handled by parent usually, but we can trigger callback
      window.location.reload(); 
    } catch (e: any) {
      alert(e.message);
    }
  };

  const handleArchiveStock = async (stockId: string) => {
    if (!confirm("ATENÇÃO: Deseja arquivar este estoque?\n\n- Ele ficará oculto.\n- Não pode haver itens com saldo positivo dentro dele.")) return;
    try {
      await InventoryService.archiveStock(stockId, currentUser);
      // Optimistic update locally
      setLocalWarehouses(prev => prev.map(w => w.id === stockId ? { ...w, isArchived: true } : w));
      alert("Estoque arquivado.");
    } catch (e: any) {
      alert(`ERRO: ${e.message}`);
    }
  };

  const handleUnarchiveStock = async (stockId: string) => {
     if (!confirm("Deseja restaurar este estoque?")) return;
     try {
       await InventoryService.unarchiveStock(stockId, currentUser);
       setLocalWarehouses(prev => prev.map(w => w.id === stockId ? { ...w, isArchived: false } : w));
       alert("Estoque restaurado!");
     } catch (e: any) {
       alert(e.message);
     }
  };

  const renderIcon = (iconName: string, size: number = 16, color?: string) => {
    const IconComponent = (Icons as any)[iconName] || Icons.HelpCircle;
    return <IconComponent size={size} style={{ color }} />;
  };

  const filteredList = localWarehouses.filter(w => activeTab === 'ARCHIVED' ? w.isArchived : !w.isArchived);

  return (
    <div className="space-y-8 animate-fade-in pb-12">
      
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-end gap-4">
        <div>
          <h2 className="text-2xl font-black text-[#001B48]">Configuração de Estoques</h2>
          <p className="text-sm text-slate-500 mt-1">Personalize nomes, cores e ícones que aparecem em todo o sistema.</p>
        </div>
        
        <div className="flex bg-white p-1 rounded-xl shadow-sm border border-gray-200">
           <button onClick={() => setActiveTab('ACTIVE')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ACTIVE' ? 'bg-[#001B48] text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Ativos</button>
           <button onClick={() => setActiveTab('ARCHIVED')} className={`px-6 py-2 rounded-lg text-sm font-bold transition-all ${activeTab === 'ARCHIVED' ? 'bg-red-600 text-white shadow-md' : 'text-slate-500 hover:bg-slate-50'}`}>Arquivados</button>
        </div>
      </div>

      {/* Creation Card */}
      {isCreating && (
        <div className="glass-panel p-6 rounded-2xl border border-blue-100 animate-fade-in">
           <h3 className="font-bold text-[#001B48] mb-4 flex items-center gap-2"><Plus className="bg-blue-100 text-blue-600 p-1 rounded-md" size={24} /> Novo Estoque</h3>
           <form onSubmit={handleCreateStock} className="grid grid-cols-1 md:grid-cols-5 gap-4 items-end">
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">ID (Ex: STOCK-09)</label>
                <input required type="text" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-mono font-bold" value={newStock.id} onChange={e => setNewStock({...newStock, id: e.target.value})} />
              </div>
              <div className="md:col-span-2">
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Nome de Exibição</label>
                <input required type="text" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm font-bold" value={newStock.name} onChange={e => setNewStock({...newStock, name: e.target.value})} />
              </div>
              <div>
                <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Tipo</label>
                <input type="text" className="w-full border-2 border-slate-200 rounded-xl px-3 py-2 text-sm" value={newStock.type} onChange={e => setNewStock({...newStock, type: e.target.value})} />
              </div>
              <div className="flex gap-2">
                 <button type="button" onClick={() => setIsCreating(false)} className="px-4 py-2.5 bg-slate-100 rounded-xl text-slate-600 font-bold text-sm">Cancelar</button>
                 <button type="submit" className="flex-1 px-4 py-2.5 bg-[#001B48] text-white rounded-xl font-bold text-sm shadow-lg hover:bg-[#02457A]">Criar</button>
              </div>
           </form>
        </div>
      )}

      {/* Main List */}
      <div className="space-y-4">
        {!isCreating && activeTab === 'ACTIVE' && (
           <button 
             onClick={() => setIsCreating(true)}
             className="w-full py-3 border-2 border-dashed border-blue-200 bg-blue-50/50 rounded-xl text-blue-600 font-bold hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
           >
             <Plus size={20} /> Adicionar Novo Estoque
           </button>
        )}

        {filteredList.map((wh) => (
          <div key={wh.id} className={`bg-white p-4 rounded-2xl shadow-sm border transition-all hover:shadow-md ${wh.isArchived ? 'border-gray-200 opacity-70' : 'border-gray-100'}`}>
             <div className="flex flex-col md:flex-row items-center gap-4">
                
                {/* ID & Color - Visual Indicator */}
                <div className="flex items-center gap-3 w-full md:w-auto">
                   <div className="relative group cursor-pointer">
                      <div className="w-12 h-12 rounded-xl flex items-center justify-center shadow-inner" style={{ backgroundColor: wh.color }}>
                         {renderIcon(wh.icon || 'Package', 24, '#FFF')}
                      </div>
                      <input 
                        type="color" 
                        value={wh.color}
                        onChange={(e) => handleChange(wh.id, 'color', e.target.value)}
                        className="absolute inset-0 opacity-0 cursor-pointer w-full h-full"
                        title="Alterar Cor"
                      />
                   </div>
                   <div>
                      <div className="text-[10px] font-bold text-slate-400 font-mono uppercase">{wh.id}</div>
                      <div className="text-xs text-slate-500">{wh.isArchived ? 'Arquivado' : 'Ativo'}</div>
                   </div>
                </div>

                {/* Editable Fields */}
                <div className="flex-1 grid grid-cols-1 md:grid-cols-3 gap-3 w-full">
                   <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase mb-1 block">Nome do Estoque</label>
                      <input 
                        disabled={wh.isArchived}
                        type="text" 
                        value={wh.name}
                        onChange={(e) => handleChange(wh.id, 'name', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-bold text-[#001B48] focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                   
                   <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase mb-1 block">Ícone</label>
                      <div className="relative">
                        <select
                          disabled={wh.isArchived}
                          value={wh.icon || 'Package'}
                          onChange={(e) => handleChange(wh.id, 'icon', e.target.value)}
                          className="w-full appearance-none bg-slate-50 border border-slate-200 rounded-lg pl-9 pr-3 py-2 text-sm font-medium text-slate-700 focus:ring-2 focus:ring-blue-500 outline-none cursor-pointer"
                        >
                          {AVAILABLE_ICONS.map(icon => (
                            <option key={icon} value={icon}>{icon}</option>
                          ))}
                        </select>
                        <div className="absolute left-3 top-2.5 text-slate-500 pointer-events-none">
                           {renderIcon(wh.icon || 'Package', 14)}
                        </div>
                      </div>
                   </div>

                   <div>
                      <label className="text-[10px] font-bold text-slate-300 uppercase mb-1 block">Tipo / Categoria</label>
                      <input 
                        disabled={wh.isArchived}
                        type="text" 
                        value={wh.type}
                        onChange={(e) => handleChange(wh.id, 'type', e.target.value)}
                        className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-2 text-sm font-medium text-slate-600 focus:ring-2 focus:ring-blue-500 outline-none"
                      />
                   </div>
                </div>

                {/* Actions */}
                <div className="flex gap-2">
                   {!wh.isArchived ? (
                      <button 
                        onClick={() => handleArchiveStock(wh.id)}
                        className="p-3 bg-white border border-gray-200 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded-xl transition-colors"
                        title="Arquivar Estoque"
                      >
                        <Archive size={18} />
                      </button>
                   ) : (
                      <button 
                        onClick={() => handleUnarchiveStock(wh.id)}
                        className="p-3 bg-green-50 border border-green-200 text-green-600 hover:bg-green-100 rounded-xl transition-colors"
                        title="Restaurar Estoque"
                      >
                        <RefreshCcw size={18} />
                      </button>
                   )}
                </div>
             </div>
          </div>
        ))}

        {filteredList.length === 0 && (
          <div className="text-center py-12 text-slate-400 italic bg-white rounded-2xl border border-dashed border-gray-200">
            Nenhum estoque encontrado nesta categoria.
          </div>
        )}
      </div>

      {/* Floating Save Button */}
      {isDirty && !activeTab.includes('ARCHIVED') && (
         <div className="fixed bottom-6 right-6 z-50 animate-bounce-in">
           <button 
              onClick={handleSave}
              className="px-8 py-4 bg-[#001B48] text-white rounded-full flex items-center gap-3 hover:bg-[#02457A] shadow-2xl hover:scale-105 transition-all font-bold text-lg"
            >
              <Save size={24} /> Salvar Alterações
            </button>
         </div>
      )}
    </div>
  );
};

export default WarehouseSettings;
