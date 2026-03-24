
import React, { useState, useRef, useEffect } from 'react';
import { InventoryItem, Warehouse } from '../types';
import * as InventoryService from '../services/inventoryService';
import { QrCode, Check, Search, Smartphone, Save, Camera, AlertCircle, LogOut } from 'lucide-react';
import ScannerModal from './ScannerModal';
import { decodeItemQr } from '../utils/qrFormat';

interface MobileEntryProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
  onTransactionComplete: () => void;
  currentUser: any;
  onLogout: () => void;
}

const MobileEntry: React.FC<MobileEntryProps> = ({ items, warehouses, onTransactionComplete, currentUser, onLogout }) => {
  // Steps: 1. Scan -> 2. Select Stock (if generic) or Confirm -> 3. Quantity -> 4. Save
  const [step, setStep] = useState<1 | 2 | 3>(1);
  const [qrInput, setQrInput] = useState('');
  const [selectedItem, setSelectedItem] = useState<InventoryItem | null>(null);
  const [selectedWarehouseId, setSelectedWarehouseId] = useState<string>(warehouses[0]?.id || '');
  const [quantity, setQuantity] = useState<number>(1);
  const [successMsg, setSuccessMsg] = useState('');
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    // Auto-focus input for USB scanners or ready-to-type (only if scanner modal is closed)
    if (step === 1 && !isScannerOpen) inputRef.current?.focus();
  }, [step, isScannerOpen]);

  const processItemId = (rawId: string) => {
    // Tenta limpar o ID caso venha no formato antigo ou novo
    let cleanId = rawId;
    
    // Se for formato CTM, extrai o ID. Se não, tenta usar como está (legado ou manual)
    try {
      cleanId = decodeItemQr(rawId);
    } catch (e) {
      // Se falhar o decode, assumimos que é uma digitação manual ou código legado simples
      // Apenas logamos ou ignoramos a formatação estrita para digitação manual
      console.log("Input manual ou legado:", rawId);
    }

    const found = items.find(i => i.id === cleanId || i.sku === cleanId);
    
    if (found) {
      setSelectedItem(found);
      setSelectedWarehouseId(found.warehouseId);
      setStep(2);
      setQrInput('');
      setIsScannerOpen(false); // Garante fechamento
    } else {
      alert(`Item '${cleanId}' não encontrado!\n\nNo modo Mobile Add-Only, o item já deve estar cadastrado no sistema.`);
      setQrInput('');
      if (!isScannerOpen) inputRef.current?.focus();
    }
  };

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!qrInput.trim()) return;
    processItemId(qrInput);
  };

  const handleScanSuccess = (decodedText: string, itemId: string) => {
    // Callback do ScannerModal
    // O ScannerModal já valida o formato CTM. Aqui só buscamos o item.
    const found = items.find(i => i.id === itemId);
    
    if (found) {
      setSelectedItem(found);
      setSelectedWarehouseId(found.warehouseId);
      setStep(2);
      setIsScannerOpen(false);
    } else {
      alert(`QR Válido (${itemId}), mas item não encontrado no banco de dados.`);
      // Mantém scanner aberto para tentar outro
    }
  };

  const handleSave = () => {
    if (!selectedItem) return;
    try {
      InventoryService.processTransaction(
        'IN', 
        selectedItem.id, 
        quantity, 
        selectedWarehouseId, 
        currentUser, 
        undefined, 
        'Entrada Rápida Mobile'
      );
      onTransactionComplete();
      setSuccessMsg(`Entrada de +${quantity} ${selectedItem.unit} registrada!`);
      
      // Reset after delay
      setTimeout(() => {
        setSuccessMsg('');
        setStep(1);
        setQuantity(1);
        setSelectedItem(null);
      }, 1500);
    } catch (err: any) {
      alert(err.message);
    }
  };

  if (successMsg) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-6 text-center animate-fade-in bg-green-50">
        <div className="w-24 h-24 bg-green-100 rounded-full flex items-center justify-center mb-6 text-green-600 shadow-lg">
          <Check size={48} />
        </div>
        <h2 className="text-3xl font-bold text-gray-800 mb-2">Sucesso!</h2>
        <p className="text-xl text-gray-600 font-medium">{successMsg}</p>
        <p className="text-sm text-gray-400 mt-8">Redirecionando...</p>
      </div>
    );
  }

  return (
    <div className="max-w-md mx-auto bg-white min-h-[500px] flex flex-col shadow-xl rounded-2xl overflow-hidden border border-gray-200">
      
      {/* Scanner Modal Overlay */}
      {isScannerOpen && (
        <ScannerModal 
          onScanSuccess={handleScanSuccess} 
          onClose={() => setIsScannerOpen(false)} 
        />
      )}

      {/* Header Mobile */}
      <div className="bg-gradient-to-r from-[#324F85] to-[#ACCBEC] text-white p-4 flex items-center justify-between shadow-md">
        <div className="flex items-center gap-2">
          <Smartphone size={20} className="text-white" />
          <h2 className="font-bold tracking-wide">Mobile Add-Only</h2>
        </div>
        
        <button 
          onClick={onLogout}
          className="flex items-center gap-1 bg-white/20 hover:bg-white/30 px-3 py-1.5 rounded-lg text-xs font-bold transition-colors"
        >
          <LogOut size={14} /> Sair
        </button>
      </div>

      <div className="flex-1 p-6 flex flex-col relative">
        {step === 1 && (
          <div className="flex-1 flex flex-col justify-center animate-fade-in">
            <div className="text-center mb-8">
              <div className="w-20 h-20 bg-[#F0F5FA] rounded-full flex items-center justify-center mx-auto mb-4 text-[#324F85] border-4 border-white shadow-lg shadow-[#ACCBEC]/20">
                <QrCode size={40} />
              </div>
              <h3 className="text-2xl font-bold text-[#324F85]">Escanear Item</h3>
              <p className="text-[#ACCBEC] text-sm mt-2 font-bold">Aponte a câmera ou digite o ID</p>
            </div>

            <div className="space-y-4">
              <button 
                type="button" 
                onClick={() => setIsScannerOpen(true)}
                className="w-full bg-[#324F85] text-white py-4 rounded-xl font-bold text-lg shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-3"
              >
                <Camera size={24} />
                Ler QR Code
              </button>
              
              <form onSubmit={handleManualSubmit} className="relative group">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-gray-400 group-focus-within:text-[#324F85] transition-colors" />
                </div>
                <input
                  ref={inputRef}
                  type="text"
                  className="w-full pl-10 pr-4 py-4 border-2 border-gray-200 rounded-xl text-lg focus:outline-none focus:ring-2 focus:ring-[#324F85] focus:border-[#324F85] transition-all font-mono"
                  placeholder="ID Manual..."
                  value={qrInput}
                  onChange={e => setQrInput(e.target.value)}
                />
              </form>
            </div>

            <div className="mt-6 p-4 bg-blue-50 rounded-xl flex gap-3 items-start border border-blue-100">
               <AlertCircle className="text-blue-500 shrink-0 mt-0.5" size={18} />
               <p className="text-xs text-blue-700 leading-relaxed">
                 O novo padrão de etiquetas <strong>CTM|ITEM|...</strong> é obrigatório para o scanner automático. Códigos antigos devem ser digitados manualmente.
               </p>
            </div>

            <div className="mt-auto pt-8 text-center text-xs text-gray-400">
              CTM Brasil - Controle de Estoque
            </div>
          </div>
        )}

        {step === 2 && selectedItem && (
          <div className="flex-1 flex flex-col animate-fade-in h-full">
             <div className="bg-white p-4 rounded-xl mb-4 border border-[#ACCBEC]/30 shadow-sm relative overflow-hidden">
               <div className="absolute top-0 right-0 w-16 h-16 bg-[#ACCBEC]/20 rounded-bl-full -mr-8 -mt-8"></div>
               <div className="text-xs text-[#324F85] font-mono font-bold mb-1 tracking-wider">DETECTADO</div>
               <h3 className="text-xl font-bold text-[#324F85] leading-tight mb-1">{selectedItem.name}</h3>
               <div className="text-sm text-gray-500 font-mono">{selectedItem.sku}</div>
               
               <div className="mt-3 flex items-center justify-between p-3 bg-[#F0F5FA] rounded-lg">
                  <span className="text-xs font-bold text-[#ACCBEC] uppercase">Estoque Atual</span>
                  <span className="text-lg font-bold text-[#324F85]">{selectedItem.quantity} <span className="text-sm font-normal text-gray-500">{selectedItem.unit}</span></span>
               </div>
             </div>

             <div className="mb-4">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Local de Entrada</label>
               <select 
                 className="w-full p-3 bg-white border-2 border-gray-200 rounded-xl focus:ring-2 focus:ring-[#324F85] focus:border-[#324F85] font-medium text-gray-800"
                 value={selectedWarehouseId}
                 onChange={e => setSelectedWarehouseId(e.target.value)}
               >
                 {warehouses.map(w => (
                   <option key={w.id} value={w.id}>{w.name}</option>
                 ))}
               </select>
             </div>

             <div className="flex-1 flex flex-col">
               <label className="block text-xs font-bold text-gray-500 uppercase mb-2 ml-1">Quantidade ({selectedItem.unit})</label>
               
               <div className="flex items-center gap-3 mb-4">
                 <button onClick={() => setQuantity(Math.max(1, quantity - 1))} className="w-14 h-14 bg-gray-100 rounded-xl text-2xl font-bold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors">-</button>
                 <input 
                   type="number" 
                   value={quantity}
                   onChange={e => setQuantity(parseInt(e.target.value) || 0)}
                   className="flex-1 text-center h-14 border-2 border-gray-200 rounded-xl text-3xl font-bold text-gray-800 focus:border-[#324F85] focus:outline-none"
                 />
                 <button onClick={() => setQuantity(quantity + 1)} className="w-14 h-14 bg-gray-100 rounded-xl text-2xl font-bold text-gray-600 hover:bg-gray-200 active:bg-gray-300 transition-colors">+</button>
               </div>
               
               <div className="grid grid-cols-4 gap-2 mb-6">
                 {[1, 5, 10, 20].map(v => (
                   <button 
                    key={v}
                    onClick={() => setQuantity(v)}
                    className="py-2 bg-[#F0F5FA] text-[#324F85] font-bold rounded-lg border border-[#ACCBEC]/30 hover:bg-[#ACCBEC]/20 hover:scale-105 transition-all"
                   >
                     +{v}
                   </button>
                 ))}
               </div>
             </div>

             <div className="flex gap-3 mt-auto">
               <button onClick={() => setStep(1)} className="flex-1 py-4 border-2 border-gray-200 rounded-xl text-gray-600 font-bold hover:bg-gray-50 transition-colors">
                 Cancelar
               </button>
               <button onClick={handleSave} className="flex-[2] py-4 bg-green-600 hover:bg-green-700 text-white rounded-xl font-bold shadow-lg shadow-green-600/20 active:scale-95 transition-all flex items-center justify-center gap-2">
                 <Save size={20} /> SALVAR
               </button>
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default MobileEntry;
