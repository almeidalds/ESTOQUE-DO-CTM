
import React, { useState, useEffect } from 'react';
import { Missionary, User } from '../types';
import * as InventoryService from '../services/inventoryService';
import { User as UserIcon, Search, UserPlus } from 'lucide-react';
import MissionaryProfile from './Missionary/MissionaryProfile';

const MissionaryList: React.FC = () => {
  const [missionaries, setMissionaries] = useState<Missionary[]>([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedMissionary, setSelectedMissionary] = useState<Missionary | null>(null);
  const [isCreating, setIsCreating] = useState(false);
  
  // Creation Form
  const [newName, setNewName] = useState('');
  const [newId, setNewId] = useState('');

  // Mock User
  const currentUser: User = { uid: 'sys', name: 'Admin', role: 'admin' };

  useEffect(() => {
    refreshData();
  }, []);

  const refreshData = () => {
    setMissionaries(InventoryService.getMissionaries());
  };

  const handleCreate = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newName.trim() || !newId.trim()) return alert("Nome e ID obrigatórios");
    try {
      InventoryService.createMissionary(newName, newId);
      setNewName('');
      setNewId('');
      setIsCreating(false);
      refreshData();
    } catch (e: any) { alert(e.message); }
  };

  const filtered = missionaries.filter(m => 
    m.name.toLowerCase().includes(searchTerm.toLowerCase()) || 
    m.id.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (selectedMissionary) {
    return <MissionaryProfile missionary={selectedMissionary} onBack={() => setSelectedMissionary(null)} currentUser={currentUser} />;
  }

  return (
    <div className="flex h-full gap-6 animate-fade-in">
      <div className="w-full bg-white rounded-xl shadow-sm border border-gray-100 flex flex-col overflow-hidden">
        <div className="p-6 border-b border-gray-100 flex justify-between items-center bg-white">
          <h2 className="text-xl font-bold text-[#001B48] flex items-center gap-2">
            <UserIcon className="text-[#018ABE]" /> Gestão de Missionários
          </h2>
          <button 
            onClick={() => setIsCreating(true)}
            className="bg-[#001B48] text-white px-4 py-2 rounded-lg font-bold text-sm flex items-center gap-2 hover:bg-[#02457A]"
          >
            <UserPlus size={16}/> Novo
          </button>
        </div>

        {isCreating && (
          <div className="p-4 bg-blue-50 border-b border-blue-100">
             <form onSubmit={handleCreate} className="flex gap-2">
                <input autoFocus placeholder="ID" className="border rounded-lg p-2 w-32" value={newId} onChange={e=>setNewId(e.target.value)} />
                <input placeholder="Nome Completo" className="border rounded-lg p-2 flex-1" value={newName} onChange={e=>setNewName(e.target.value)} />
                <button type="submit" className="bg-blue-600 text-white px-4 rounded-lg font-bold">Salvar</button>
                <button type="button" onClick={() => setIsCreating(false)} className="bg-white text-gray-500 border px-4 rounded-lg">Cancelar</button>
             </form>
          </div>
        )}

        <div className="p-4 border-b border-gray-100">
           <div className="relative">
             <Search className="absolute left-3 top-2.5 text-gray-400" size={18} />
             <input 
               className="w-full pl-10 pr-4 py-2 border rounded-xl text-sm outline-none focus:ring-2 focus:ring-[#018ABE]"
               placeholder="Buscar por nome ou ID..."
               value={searchTerm}
               onChange={e => setSearchTerm(e.target.value)}
             />
           </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar p-2">
           {filtered.map(m => (
             <button 
               key={m.id}
               onClick={() => setSelectedMissionary(m)}
               className="w-full text-left p-4 hover:bg-[#F0F5FA] rounded-xl flex justify-between items-center group transition-colors border border-transparent hover:border-gray-200 mb-2"
             >
                <div>
                  <div className="font-bold text-[#001B48] group-hover:text-[#018ABE]">{m.name}</div>
                  <div className="text-xs text-gray-400 font-mono">ID: {m.id}</div>
                </div>
                <div className="text-xs font-bold bg-gray-100 px-3 py-1 rounded text-gray-600">
                   {m.totalItemsReceived} itens
                </div>
             </button>
           ))}
           {filtered.length === 0 && <p className="text-center py-10 text-gray-400">Nenhum registro encontrado.</p>}
        </div>
      </div>
    </div>
  );
};

export default MissionaryList;
