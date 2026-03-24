
import React, { useState } from 'react';
import { AppSettings, Warehouse } from '../../../types';
import { Plus, Trash2, MapPin } from 'lucide-react';

interface Props {
  settings: AppSettings;
  warehouses: Warehouse[];
  onUpdate: (s: Partial<AppSettings>) => void;
}

const LocationsPanel: React.FC<Props> = ({ settings, warehouses, onUpdate }) => {
  const [selectedStock, setSelectedStock] = useState(warehouses[0]?.id || '');
  const [newLoc, setNewLoc] = useState('');

  const currentLocs = settings.locationsMap[selectedStock] || [];

  const handleAdd = () => {
    if (!newLoc.trim()) return;
    if (currentLocs.includes(newLoc)) return alert('Local já existe.');
    
    const newMap = {
      ...settings.locationsMap,
      [selectedStock]: [...currentLocs, newLoc].sort()
    };
    onUpdate({ locationsMap: newMap });
    setNewLoc('');
  };

  const handleRemove = (loc: string) => {
    if (!confirm('Remover localização?')) return;
    const newMap = {
      ...settings.locationsMap,
      [selectedStock]: currentLocs.filter(l => l !== loc)
    };
    onUpdate({ locationsMap: newMap });
  };

  return (
    <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100 animate-fade-in">
      <h3 className="text-lg font-bold text-[#001B48] mb-4">Mapa de Localizações</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="md:col-span-1 border-r border-gray-100 pr-6">
           <label className="text-xs font-bold text-gray-400 uppercase mb-2 block">Selecione o Estoque</label>
           <div className="space-y-2">
             {warehouses.filter(w => !w.isArchived).map(w => (
               <button
                 key={w.id}
                 onClick={() => setSelectedStock(w.id)}
                 className={`w-full text-left px-4 py-3 rounded-xl text-sm font-bold flex items-center gap-3 transition-all ${selectedStock === w.id ? 'bg-[#001B48] text-white shadow-lg' : 'bg-gray-50 text-gray-600 hover:bg-gray-100'}`}
               >
                 <span className="w-2 h-2 rounded-full" style={{ backgroundColor: w.color }}></span>
                 {w.name}
               </button>
             ))}
           </div>
        </div>

        <div className="md:col-span-2">
           <div className="flex gap-2 mb-4">
             <input 
               value={newLoc}
               onChange={e => setNewLoc(e.target.value)}
               placeholder="Ex: Corredor A > Prateleira 1"
               className="flex-1 border-2 border-gray-200 rounded-xl px-4 py-2 outline-none focus:border-[#018ABE]"
             />
             <button onClick={handleAdd} className="bg-[#018ABE] text-white px-4 py-2 rounded-xl font-bold flex items-center gap-2 hover:bg-[#02457A]">
               <Plus size={20}/> Adicionar
             </button>
           </div>

           <div className="bg-gray-50 rounded-xl p-4 min-h-[300px] max-h-[500px] overflow-y-auto">
             {currentLocs.length === 0 && <p className="text-gray-400 text-center py-10">Nenhuma localização cadastrada para este estoque.</p>}
             <ul className="space-y-2">
               {currentLocs.map(loc => (
                 <li key={loc} className="flex justify-between items-center bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                   <div className="flex items-center gap-3">
                     <MapPin size={16} className="text-[#018ABE]"/>
                     <span className="font-bold text-gray-700">{loc}</span>
                   </div>
                   <button onClick={() => handleRemove(loc)} className="text-gray-300 hover:text-red-500 p-2"><Trash2 size={16}/></button>
                 </li>
               ))}
             </ul>
           </div>
        </div>
      </div>
    </div>
  );
};

export default LocationsPanel;
