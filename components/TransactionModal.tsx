
import React, { useState, useEffect, useMemo } from 'react';
import { InventoryItem, TransactionType, Warehouse, TransactionRecipient, TransactionReasonCategory, Missionary } from '../types';
import { ArrowRightLeft, PlusCircle, MinusCircle, Users, Search, Trash2, UserPlus, MapPin, Clock, X, Calendar, Share2, Check, ShieldAlert } from 'lucide-react';
import * as InventoryService from '../services/inventoryService';
import * as SettingsService from '../services/settingsService';

interface TransactionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (data: any) => void;
  type: TransactionType;
  item: InventoryItem | null;
  warehouses: Warehouse[];
  userRole: string;
}

const TransactionModal: React.FC<TransactionModalProps> = ({ isOpen, onClose, onConfirm, type, item, warehouses, userRole }) => {
  const [transactionMode, setTransactionMode] = useState<'STANDARD' | 'LOAN'>('STANDARD');
  const [quantity, setQuantity] = useState<number>(1);
  const [reason, setReason] = useState<string>('');
  const [reasonCategory, setReasonCategory] = useState<TransactionReasonCategory>('INTERNAL_USE');
  const [targetWarehouse, setTargetWarehouse] = useState<string>('');
  const [recipients, setRecipients] = useState<TransactionRecipient[]>([]);
  const [missionarySearch, setMissionarySearch] = useState('');
  const [availableMissionaries, setAvailableMissionaries] = useState<Missionary[]>([]);
  
  // New: Location Support
  const [targetLocation, setTargetLocation] = useState('');
  const [sourceLocation, setSourceLocation] = useState('');
  const [availableLocations, setAvailableLocations] = useState<string[]>([]);

  // Restricted Check
  const [approvalNeeded, setApprovalNeeded] = useState(false);

  // Load locations for target
  useEffect(() => {
    if (targetWarehouse) {
      setAvailableLocations(SettingsService.getLocationsForStock(targetWarehouse));
    }
  }, [targetWarehouse]);

  useEffect(() => {
    if (isOpen && item) {
      setAvailableMissionaries(InventoryService.getMissionaries());
      setQuantity(1);
      setReason('');
      setTargetWarehouse('');
      setRecipients([]);
      setReasonCategory('INTERNAL_USE');
      // Set current location if known
      setSourceLocation(item.locationPath || '');
      setTargetLocation('');
      
      // Check restricted
      if (item.isRestricted && type === 'OUT') {
        setApprovalNeeded(true);
      } else {
        setApprovalNeeded(false);
      }
    }
  }, [isOpen, type, item]);

  const handleAddRecipient = (m: Missionary) => {
    if (recipients.some(r => r.missionaryId === m.id)) return;
    setRecipients([...recipients, { missionaryId: m.id, missionaryName: m.name, quantity: 1 }]);
    setMissionarySearch('');
  };

  const filteredMissionaries = useMemo(() => availableMissionaries.filter(m => 
    m.name.toLowerCase().includes(missionarySearch.toLowerCase()) || m.id.includes(missionarySearch)
  ).slice(0, 5), [availableMissionaries, missionarySearch]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (approvalNeeded && userRole !== 'admin') {
      alert("Este item é RESTRITO. Apenas administradores podem liberar.");
      return; 
    }

    if (type === 'TRANSFER' && !targetWarehouse) {
      alert("Selecione o destino.");
      return;
    }

    const payload = { 
      quantity, 
      reason, 
      targetWarehouse, 
      reasonCategory, 
      recipients, 
      toLocation: type === 'TRANSFER' ? targetLocation : undefined,
      fromLocation: sourceLocation,
      isLoan: transactionMode === 'LOAN'
    };
    onConfirm(payload);
  };

  if (!isOpen || !item) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-[#001B48]/30 backdrop-blur-sm animate-fade-in">
      <div className="bg-white rounded-[32px] shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh] border border-white">
        
        {/* Header */}
        <div className="px-8 py-6 flex items-center justify-between bg-white border-b border-[#D6E8EE]">
          <div className="flex items-center gap-4">
             <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shadow-sm ${type === 'IN' ? 'bg-green-100 text-green-600' : type === 'OUT' ? 'bg-orange-100 text-orange-600' : 'bg-blue-100 text-blue-600'}`}>
               {type === 'IN' && <PlusCircle size={24} />}
               {type === 'OUT' && <MinusCircle size={24} />}
               {type === 'TRANSFER' && <ArrowRightLeft size={24} />}
             </div>
             <div>
               <h3 className="text-xl font-extrabold text-[#001B48] tracking-tight">
                 {type === 'IN' ? 'Entrada' : type === 'TRANSFER' ? 'Transferência' : 'Saída'}
               </h3>
               <p className="text-sm text-[#018ABE] font-medium truncate max-w-[200px]">{item.name}</p>
             </div>
          </div>
          <button onClick={onClose} className="text-[#018ABE] hover:text-[#001B48] bg-[#F0F5FA] p-2 rounded-xl transition-all"><X size={20} /></button>
        </div>

        <form onSubmit={handleSubmit} className="p-8 space-y-6 overflow-y-auto flex-1 custom-scrollbar">
          
          {approvalNeeded && (
            <div className="bg-red-50 p-4 rounded-xl border border-red-100 flex gap-3">
               <ShieldAlert className="text-red-600" size={24} />
               <div>
                 <h4 className="font-bold text-red-800 text-sm">Item Restrito</h4>
                 <p className="text-xs text-red-700">Esta operação requer privilégios de administrador.</p>
               </div>
            </div>
          )}

          {/* Current Location Display */}
          <div className="bg-[#F0F5FA] p-4 rounded-xl border border-[#D6E8EE] text-sm flex justify-between">
             <span className="font-bold text-[#001B48]">Local Atual:</span> 
             <span className="text-slate-600">{item.locationPath || 'Não definido'}</span>
          </div>

          <div>
            <label className="block text-xs font-bold text-[#018ABE] uppercase mb-2 ml-1">Quantidade</label>
            <input required type="number" min="1" max={(type === 'OUT' || type === 'TRANSFER') ? item.quantity : undefined} className="w-full px-6 py-4 bg-[#F0F5FA] border-2 border-transparent focus:border-[#001B48] rounded-2xl text-3xl font-black text-[#001B48] focus:bg-white focus:outline-none text-center transition-all" value={quantity} onChange={e => setQuantity(parseInt(e.target.value) || 0)} />
          </div>

          {type === 'TRANSFER' && (
             <div className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-[#018ABE] uppercase mb-2 ml-1">Destino (Estoque)</label>
                <select required className="w-full px-4 py-3 bg-[#F0F5FA] border border-[#D6E8EE] rounded-2xl text-sm font-semibold text-[#001B48] outline-none" value={targetWarehouse} onChange={e => setTargetWarehouse(e.target.value)}>
                  <option value="">Selecione...</option>
                  {warehouses.filter(w => w.id !== item.warehouseId).map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
                </select>
              </div>
              
              {targetWarehouse && (
                <div>
                  <label className="block text-xs font-bold text-[#018ABE] uppercase mb-2 ml-1">Localização no Destino</label>
                  <input 
                    list="locations"
                    placeholder="Ex: Prateleira B..."
                    className="w-full px-4 py-3 bg-[#F0F5FA] border border-[#D6E8EE] rounded-2xl text-sm font-semibold text-[#001B48] outline-none"
                    value={targetLocation}
                    onChange={e => setTargetLocation(e.target.value)}
                  />
                  <datalist id="locations">
                    {availableLocations.map(loc => <option key={loc} value={loc} />)}
                  </datalist>
                </div>
              )}
            </div>
          )}

          {type === 'OUT' && (
             <div className="space-y-4">
                <div className="flex bg-[#F0F5FA] p-1 rounded-xl">
                   <button type="button" onClick={() => setTransactionMode('STANDARD')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${transactionMode === 'STANDARD' ? 'bg-white shadow text-[#001B48]' : 'text-slate-500'}`}>Doação/Uso</button>
                   <button type="button" onClick={() => setTransactionMode('LOAN')} className={`flex-1 py-2 rounded-lg text-xs font-bold ${transactionMode === 'LOAN' ? 'bg-white shadow text-[#001B48]' : 'text-slate-500'}`}>Empréstimo</button>
                </div>

                {/* Recipient Logic */}
                <div className="relative">
                   <label className="block text-xs font-bold text-[#018ABE] uppercase mb-2 ml-1">Destinatário(s)</label>
                   <div className="flex gap-2 mb-2 flex-wrap">
                      {recipients.map((r, idx) => (
                        <span key={idx} className="bg-blue-100 text-blue-800 text-xs px-2 py-1 rounded-lg flex items-center gap-1">
                          {r.missionaryName} <button type="button" onClick={() => setRecipients(recipients.filter((_, i) => i !== idx))}><X size={12}/></button>
                        </span>
                      ))}
                   </div>
                   <input 
                     placeholder="Buscar missionário..." 
                     className="w-full px-4 py-3 bg-[#F0F5FA] border border-[#D6E8EE] rounded-2xl text-sm outline-none"
                     value={missionarySearch}
                     onChange={e => setMissionarySearch(e.target.value)}
                   />
                   {missionarySearch && (
                     <div className="absolute top-full left-0 w-full bg-white shadow-lg rounded-xl border border-gray-100 mt-1 max-h-40 overflow-y-auto z-10">
                        {filteredMissionaries.map(m => (
                          <button key={m.id} type="button" onClick={() => handleAddRecipient(m)} className="w-full text-left px-4 py-2 hover:bg-slate-50 text-sm">
                            {m.name}
                          </button>
                        ))}
                     </div>
                   )}
                </div>
             </div>
          )}

          <div className="pt-2 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-6 py-3 text-[#018ABE] font-bold hover:bg-[#F0F5FA] rounded-xl transition-colors text-sm">Cancelar</button>
            <button type="submit" className={`px-8 py-3 text-white rounded-xl font-bold shadow-lg shadow-[#001B48]/20 transition-all hover:-translate-y-0.5 text-sm flex items-center gap-2 bg-[#001B48] hover:bg-[#02457A]`}>Confirmar</button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default TransactionModal;
