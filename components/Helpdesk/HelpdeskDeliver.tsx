
import React, { useState, useEffect } from 'react';
import { InventoryItem, User } from '../../types';
import * as InventoryService from '../../services/inventoryService';
import { Truck, QrCode, User as UserIcon, CheckCircle, Search, X } from 'lucide-react';
import ScannerModal from '../ScannerModal';
import { decodeMissionaryQr } from '../../utils/qrFormat';

interface HelpdeskDeliverProps {
  items: InventoryItem[]; // Full catalog passed down, filter inside if needed
  currentUser: User;
  onSuccess: () => void;
}

const HelpdeskDeliver: React.FC<HelpdeskDeliverProps> = ({ items, currentUser, onSuccess }) => {
  // Steps: 1. Select Items -> 2. Identify Missionary -> 3. Confirm
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [cart, setCart] = useState<{ item: InventoryItem; qty: number }[]>([]);
  const [missionaryId, setMissionaryId] = useState('');
  const [missionaryName, setMissionaryName] = useState('');
  const [location, setLocation] = useState('Balcão');
  const [shift, setShift] = useState('Manhã');
  
  // Scanner State
  const [scannerType, setScannerType] = useState<'ITEM' | 'MIS' | null>(null);
  const [manualInput, setManualInput] = useState('');

  // Items from Helpdesk Stock Only
  const helpdeskItems = items.filter(i => i.warehouseId === 'STOCK-HELPDESK' && !i.isArchived);

  const handleScan = (decoded: string, itemId: string) => {
    if (scannerType === 'ITEM') {
      const found = helpdeskItems.find(i => i.id === itemId);
      if (found) {
        addToCart(found);
        setScannerType(null); // Close scanner after 1 item? Or keep open? Let's close for confirmation.
      } else {
        alert("Item não encontrado no estoque Helpdesk ou ID inválido.");
      }
    } else if (scannerType === 'MIS') {
      try {
        const misId = decodeMissionaryQr(decoded);
        setMissionaryId(misId);
        // Try to auto-find name if exists in local cache (mock)
        const known = InventoryService.getMissionaries().find(m => m.id === misId);
        if (known) setMissionaryName(known.name);
        setScannerType(null);
      } catch (e) {
        alert("QR de missionário inválido.");
      }
    }
  };

  const addToCart = (item: InventoryItem) => {
    if (item.quantity <= 0) {
      alert("Sem saldo para este item.");
      return;
    }
    setCart(prev => {
      const existing = prev.find(i => i.item.id === item.id);
      if (existing) {
        if (existing.qty + 1 > item.quantity) {
          alert("Limite de saldo atingido.");
          return prev;
        }
        return prev.map(i => i.item.id === item.id ? { ...i, qty: i.qty + 1 } : i);
      }
      return [...prev, { item, qty: 1 }];
    });
  };

  const removeFromCart = (idx: number) => {
    setCart(prev => prev.filter((_, i) => i !== idx));
  };

  const handleManualItem = (e: React.FormEvent) => {
    e.preventDefault();
    const found = helpdeskItems.find(i => i.id === manualInput || i.sku === manualInput || i.name.toLowerCase().includes(manualInput.toLowerCase()));
    if (found) {
      addToCart(found);
      setManualInput('');
    } else {
      alert("Item não encontrado.");
    }
  };

  const handleConfirm = () => {
    if (!missionaryId || !missionaryName) {
      alert("Identifique o missionário.");
      return;
    }
    try {
      // Mapping to transaction structure expected by service
      // Note: In real implementation this calls Cloud Function `helpdeskDeliver`
      const recipients = [{
        missionaryId,
        missionaryName,
        quantity: cart.reduce((acc, i) => acc + i.qty, 0)
      }];

      // We process one transaction per item for simplicity in local service simulation, 
      // or batched if the service supports it. The `helpdeskDeliver` function supports batch.
      // Here we use the local service wrapper.
      
      cart.forEach(c => {
        InventoryService.processTransaction(
          'OUT',
          c.item.id,
          c.qty,
          'STOCK-HELPDESK',
          currentUser,
          undefined,
          'Entrega Helpdesk',
          undefined,
          'DONATION_TO_MISSIONARY',
          [{ missionaryId, missionaryName, quantity: c.qty }],
          currentUser.name,
          location,
          shift
        );
      });

      // Ensure missionary profile exists (Local Sim)
      let mis = InventoryService.getMissionaries().find(m => m.id === missionaryId);
      if (!mis) {
        InventoryService.createMissionary(missionaryName, missionaryId);
      }

      onSuccess();
      alert("Entrega registrada com sucesso!");
      setStep(1);
      setCart([]);
      setMissionaryId('');
      setMissionaryName('');
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white rounded-xl shadow-sm overflow-hidden relative">
      
      {scannerType && (
        <ScannerModal 
          onScanSuccess={handleScan} 
          onClose={() => setScannerType(null)} 
        />
      )}

      {/* Progress Bar */}
      <div className="flex border-b border-gray-100">
        <div className={`flex-1 py-3 text-center text-xs font-bold ${step >= 1 ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-300'}`}>1. ITENS</div>
        <div className={`flex-1 py-3 text-center text-xs font-bold ${step >= 2 ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-300'}`}>2. PESSOA</div>
        <div className={`flex-1 py-3 text-center text-xs font-bold ${step >= 3 ? 'text-red-600 border-b-2 border-red-600' : 'text-gray-300'}`}>3. CONFIRMAR</div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 custom-scrollbar">
        {step === 1 && (
          <div className="space-y-4">
            <button 
              onClick={() => setScannerType('ITEM')}
              className="w-full py-6 bg-red-600 text-white rounded-xl font-bold shadow-lg shadow-red-200 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <QrCode size={32} />
              ESCANEAR ITEM
            </button>

            <form onSubmit={handleManualItem} className="relative">
              <input 
                type="text" 
                placeholder="Buscar ou digitar ID..."
                className="w-full pl-10 pr-4 py-3 bg-gray-50 border border-gray-200 rounded-xl focus:ring-2 focus:ring-red-500 outline-none"
                value={manualInput}
                onChange={e => setManualInput(e.target.value)}
              />
              <Search className="absolute left-3 top-3.5 text-gray-400" size={18} />
            </form>

            <div className="mt-4">
              <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Carrinho ({cart.length})</h3>
              {cart.length === 0 ? (
                <div className="text-center py-8 text-gray-300 text-sm">Nenhum item selecionado.</div>
              ) : (
                <div className="space-y-2">
                  {cart.map((c, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-gray-50 p-3 rounded-lg border border-gray-100">
                      <div>
                        <div className="font-bold text-gray-800">{c.item.name}</div>
                        <div className="text-xs text-gray-500 font-mono">{c.item.id}</div>
                      </div>
                      <div className="flex items-center gap-3">
                        <span className="font-bold text-red-600 text-lg">x{c.qty}</span>
                        <button onClick={() => removeFromCart(idx)} className="text-gray-400 hover:text-red-500"><X size={18}/></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {step === 2 && (
          <div className="space-y-6">
             <div className="bg-gray-50 p-4 rounded-xl text-center">
                <div className="text-sm text-gray-500 mb-1">Itens a entregar</div>
                <div className="text-2xl font-bold text-gray-800">{cart.reduce((a,b)=>a+b.qty,0)}</div>
             </div>

             <button 
              onClick={() => setScannerType('MIS')}
              className="w-full py-6 bg-indigo-600 text-white rounded-xl font-bold shadow-lg shadow-indigo-200 flex flex-col items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              <UserIcon size={32} />
              ESCANEAR CRACHÁ
            </button>

            <div className="space-y-3">
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">ID Missionário</label>
                <input 
                  type="text" 
                  value={missionaryId}
                  onChange={e => setMissionaryId(e.target.value)}
                  className="w-full p-3 border rounded-lg font-mono text-lg font-bold"
                  placeholder="ID..."
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-500 uppercase">Nome Completo</label>
                <input 
                  type="text" 
                  value={missionaryName}
                  onChange={e => setMissionaryName(e.target.value)}
                  className="w-full p-3 border rounded-lg"
                  placeholder="Nome..."
                />
              </div>
            </div>
          </div>
        )}

        {step === 3 && (
          <div className="space-y-4">
             <div className="bg-green-50 border border-green-200 p-4 rounded-xl">
               <h3 className="text-green-800 font-bold flex items-center gap-2 mb-2"><UserIcon size={18}/> Destinatário</h3>
               <div className="text-lg font-bold text-gray-800">{missionaryName}</div>
               <div className="text-sm text-gray-500 font-mono">{missionaryId}</div>
             </div>

             <div className="grid grid-cols-2 gap-3">
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Local</label>
                 <select value={location} onChange={e => setLocation(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                   <option>Balcão</option>
                   <option>Alojamento</option>
                   <option>Refeitório</option>
                 </select>
               </div>
               <div>
                 <label className="text-xs font-bold text-gray-500 uppercase">Turno</label>
                 <select value={shift} onChange={e => setShift(e.target.value)} className="w-full p-2 border rounded-lg bg-white">
                   <option>Manhã</option>
                   <option>Tarde</option>
                   <option>Noite</option>
                 </select>
               </div>
             </div>

             <div className="border-t border-gray-100 pt-4">
               <h3 className="text-xs font-bold text-gray-400 uppercase mb-2">Resumo da Entrega</h3>
               <ul className="space-y-2">
                 {cart.map((c, i) => (
                   <li key={i} className="flex justify-between text-sm">
                     <span>{c.item.name}</span>
                     <span className="font-bold">x{c.qty}</span>
                   </li>
                 ))}
               </ul>
             </div>
          </div>
        )}
      </div>

      <div className="p-4 bg-white border-t border-gray-100">
        <div className="flex gap-3">
          {step > 1 && (
            <button onClick={() => setStep(prev => prev - 1 as any)} className="flex-1 py-3 border border-gray-300 rounded-xl font-bold text-gray-500">
              Voltar
            </button>
          )}
          <button 
            disabled={cart.length === 0}
            onClick={() => step < 3 ? setStep(prev => prev + 1 as any) : handleConfirm()}
            className="flex-[2] py-3 bg-red-600 text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:shadow-none"
          >
            {step === 3 ? 'FINALIZAR ENTREGA' : 'CONTINUAR'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default HelpdeskDeliver;
