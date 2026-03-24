
import React, { useState } from 'react';
import { AppSettings } from '../../../types';
import { Plus, X } from 'lucide-react';

interface Props {
  settings: AppSettings;
  onUpdate: (s: Partial<AppSettings>) => void;
}

const CatalogPanel: React.FC<Props> = ({ settings, onUpdate }) => {
  const [newCat, setNewCat] = useState('');
  const [newUnit, setNewUnit] = useState('');

  const addCategory = () => {
    if (!newCat.trim() || settings.categories.includes(newCat)) return;
    onUpdate({ categories: [...settings.categories, newCat].sort() });
    setNewCat('');
  };

  const removeCategory = (cat: string) => {
    if (!confirm(`Remover categoria "${cat}"?`)) return;
    onUpdate({ categories: settings.categories.filter(c => c !== cat) });
  };

  const addUnit = () => {
    if (!newUnit.trim() || settings.units.includes(newUnit)) return;
    onUpdate({ units: [...settings.units, newUnit].sort() });
    setNewUnit('');
  };

  const removeUnit = (unit: string) => {
    if (!confirm(`Remover unidade "${unit}"?`)) return;
    onUpdate({ units: settings.units.filter(u => u !== unit) });
  };

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
      {/* Categories */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#001B48] mb-4">Categorias de Produtos</h3>
        <div className="flex gap-2 mb-4">
          <input 
            value={newCat} 
            onChange={e => setNewCat(e.target.value)} 
            placeholder="Nova Categoria..." 
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button onClick={addCategory} className="bg-blue-600 text-white p-2 rounded-lg"><Plus size={20}/></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.categories.map(c => (
            <span key={c} className="bg-blue-50 text-blue-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-blue-100">
              {c}
              <button onClick={() => removeCategory(c)} className="text-blue-400 hover:text-red-500"><X size={14}/></button>
            </span>
          ))}
        </div>
      </div>

      {/* Units */}
      <div className="bg-white p-6 rounded-2xl shadow-sm border border-gray-100">
        <h3 className="text-lg font-bold text-[#001B48] mb-4">Unidades de Medida</h3>
        <div className="flex gap-2 mb-4">
          <input 
            value={newUnit} 
            onChange={e => setNewUnit(e.target.value)} 
            placeholder="Nova Unidade (ex: kg)..." 
            className="flex-1 border rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-indigo-500"
          />
          <button onClick={addUnit} className="bg-indigo-600 text-white p-2 rounded-lg"><Plus size={20}/></button>
        </div>
        <div className="flex flex-wrap gap-2">
          {settings.units.map(u => (
            <span key={u} className="bg-indigo-50 text-indigo-800 px-3 py-1 rounded-full text-sm font-bold flex items-center gap-2 border border-indigo-100">
              {u}
              <button onClick={() => removeUnit(u)} className="text-indigo-400 hover:text-red-500"><X size={14}/></button>
            </span>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CatalogPanel;
