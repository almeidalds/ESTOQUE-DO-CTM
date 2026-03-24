import React, { useState, useEffect } from 'react';
import { CycleCountTask, User, Warehouse } from '../types';
import * as InventoryService from '../services/inventoryService';
import { ClipboardList, CheckSquare, BarChart2, Check, AlertTriangle } from 'lucide-react';

interface CycleCountManagerProps {
  currentUser: User;
  warehouses: Warehouse[];
}

const CycleCountManager: React.FC<CycleCountManagerProps> = ({ currentUser, warehouses }) => {
  const [tasks, setTasks] = useState<CycleCountTask[]>([]);
  const [activeTask, setActiveTask] = useState<CycleCountTask | null>(null);
  const [counts, setCounts] = useState<Record<string, number>>({});

  useEffect(() => {
    refresh();
  }, []);

  const refresh = () => {
    setTasks(InventoryService.getCycleCounts());
  };

  const handleGenerate = (warehouseId: string, type: 'ABC_CRITICAL' | 'RANDOM') => {
    try {
      InventoryService.generateCycleCountTask(warehouseId, currentUser, type);
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  const openTask = (task: CycleCountTask) => {
    setActiveTask(task);
    const initialCounts: Record<string, number> = {};
    task.items.forEach(i => initialCounts[i.itemId] = i.countedQty ?? 0);
    setCounts(initialCounts);
  };

  const handleCountChange = (itemId: string, qty: number) => {
    setCounts(prev => ({ ...prev, [itemId]: qty }));
  };

  const handleSubmit = () => {
    if (!activeTask) return;
    const itemsToSubmit = Object.entries(counts).map(([itemId, qty]) => ({ 
      itemId, 
      countedQty: Number(qty) 
    }));
    InventoryService.submitCycleCount(activeTask.id, itemsToSubmit);
    setActiveTask(null);
    refresh();
  };

  const handleApprove = (task: CycleCountTask) => {
    try {
      InventoryService.approveCycleCount(task.id, currentUser);
      refresh();
    } catch (e: any) {
      alert(e.message);
    }
  };

  if (activeTask) {
    return (
      <div className="p-6 h-full flex flex-col bg-white rounded-xl shadow-lg border border-gray-100 max-w-4xl mx-auto my-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-xl font-bold text-gray-800">Contagem em Andamento</h2>
            <p className="text-sm text-gray-500">ID: {activeTask.id} • {warehouses.find(w=>w.id === activeTask.warehouseId)?.name}</p>
          </div>
          <button onClick={() => setActiveTask(null)} className="text-sm text-gray-500 hover:text-gray-800">Cancelar</button>
        </div>

        <div className="flex-1 overflow-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
               <tr>
                 <th className="p-3 text-left text-xs font-bold text-gray-500 uppercase">Item</th>
                 <th className="p-3 text-center text-xs font-bold text-gray-500 uppercase">Classe ABC</th>
                 <th className="p-3 text-right text-xs font-bold text-gray-500 uppercase">Contagem Física</th>
               </tr>
            </thead>
            <tbody className="divide-y">
              {activeTask.items.map(item => (
                <tr key={item.itemId}>
                  <td className="p-3 font-medium text-gray-700">{item.itemName}</td>
                  <td className="p-3 text-center">
                    <span className={`px-2 py-0.5 rounded text-xs font-bold ${item.abcClass === 'A' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-600'}`}>
                      {item.abcClass || '-'}
                    </span>
                  </td>
                  <td className="p-3 text-right">
                    <input 
                      type="number" 
                      min="0"
                      className="border rounded p-1 w-24 text-right font-bold"
                      value={counts[item.itemId]}
                      onChange={e => handleCountChange(item.itemId, parseInt(e.target.value) || 0)}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        <div className="mt-6 flex justify-end">
           <button onClick={handleSubmit} className="px-6 py-3 bg-indigo-600 text-white rounded-lg font-bold shadow-md hover:bg-indigo-700">
             Finalizar Contagem
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6 h-full flex flex-col animate-fade-in">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-2xl font-bold text-gray-800 flex items-center gap-2">
           <ClipboardList className="text-indigo-600" /> Inventário Cíclico
        </h2>
        {currentUser.role !== 'helpdesk' && (
          <div className="flex gap-2">
            <button 
              onClick={() => handleGenerate(warehouses[0].id, 'ABC_CRITICAL')} 
              className="px-4 py-2 bg-indigo-100 text-indigo-700 rounded-lg text-sm font-bold hover:bg-indigo-200 flex items-center gap-2"
            >
              <BarChart2 size={16} /> Gerar ABC (Recepção)
            </button>
          </div>
        )}
      </div>

      <div className="grid grid-cols-1 gap-4">
         {tasks.length === 0 && (
           <div className="text-center p-12 text-gray-400 bg-white rounded-xl border border-dashed border-gray-300">
             Nenhuma tarefa de contagem ativa. Gere uma nova tarefa baseada na Curva ABC.
           </div>
         )}
         {tasks.map(task => (
           <div key={task.id} className="bg-white p-4 rounded-xl border border-gray-100 shadow-sm flex justify-between items-center">
             <div>
               <div className="flex items-center gap-2 mb-1">
                 <span className={`text-xs font-bold px-2 py-0.5 rounded uppercase ${
                   task.status === 'OPEN' ? 'bg-blue-100 text-blue-700' :
                   task.status === 'COUNTED' ? 'bg-yellow-100 text-yellow-700' :
                   'bg-green-100 text-green-700'
                 }`}>{task.status}</span>
                 <span className="text-sm font-mono text-gray-400">#{task.id}</span>
               </div>
               <div className="font-bold text-gray-800">
                  {warehouses.find(w => w.id === task.warehouseId)?.name} • {task.items.length} Itens
               </div>
               <div className="text-xs text-gray-500">
                 Criado por {task.createdBy} em {new Date(task.createdAt).toLocaleDateString()}
               </div>
             </div>
             
             <div className="flex items-center gap-3">
               {task.status === 'OPEN' && (
                 <button onClick={() => openTask(task)} className="px-4 py-2 bg-indigo-600 text-white rounded-lg font-medium text-sm">
                   Iniciar Contagem
                 </button>
               )}
               {task.status === 'COUNTED' && currentUser.role !== 'helpdesk' && (
                 <button onClick={() => handleApprove(task)} className="px-4 py-2 bg-green-600 text-white rounded-lg font-medium text-sm flex items-center gap-2">
                   <CheckSquare size={16} /> Aprovar Ajustes
                 </button>
               )}
               {task.status === 'APPROVED' && (
                 <div className="text-green-600 flex items-center gap-1 text-sm font-bold">
                   <Check size={16} /> Concluído
                 </div>
               )}
             </div>
           </div>
         ))}
      </div>
    </div>
  );
};

export default CycleCountManager;