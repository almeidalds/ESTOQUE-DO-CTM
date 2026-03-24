
import React, { useState, useRef, useEffect } from 'react';
import { User, InventoryItem, Missionary, StockRequest } from '../../types';
import * as HelpdeskService from '../../services/helpdeskService';
import { useHelpdeskHotkeys } from '../../hooks/useHelpdeskHotkeys';
import { LogOut, LayoutGrid, AlertCircle, ShieldCheck, Command, Clock, MapPin, Package } from 'lucide-react';
import MissionaryPanel from './MissionaryPanel';
import CartPanel from './CartPanel';
import StockLookupPanel from './StockLookupPanel';
import HelpdeskStock from './HelpdeskStock';
import Modal from '../Modal';
import Toast, { ToastType } from '../ui/Toast';
import ScannerModal from '../ScannerModal';

interface Props {
  currentUser: User;
  onLogout: () => void;
  onRefreshData: () => void;
}

interface CartItem {
  item: InventoryItem;
  qty: number;
  isRepeated: boolean;
  lastDonationDate?: string;
  needsConfirmation?: boolean;
  type: 'DONATION' | 'LOAN';
}

const HelpdeskConsole: React.FC<Props> = ({ currentUser, onLogout, onRefreshData }) => {
  // ... (State and Effects retained)
  const [stockItems, setStockItems] = useState<InventoryItem[]>([]);
  const [missionary, setMissionary] = useState<Missionary | null>(null);
  const [cart, setCart] = useState<CartItem[]>([]);
  const [activeTab, setActiveTab] = useState<'SEARCH' | 'QUEUE'>('SEARCH');
  const [linkedTicketId, setLinkedTicketId] = useState<string | null>(null);
  
  const [isStockViewOpen, setIsStockViewOpen] = useState(false);
  const [isScannerOpen, setIsScannerOpen] = useState(false);

  const [operatorName, setOperatorName] = useState(localStorage.getItem('hd_operator') || currentUser.name);
  const [location, setLocation] = useState(localStorage.getItem('hd_loc') || 'Helpdesk');
  const [shift, setShift] = useState(localStorage.getItem('hd_shift') || 'Manhã');

  const [confirmModal, setConfirmModal] = useState<{ isOpen: boolean; doubleCheck: boolean }>({ isOpen: false, doubleCheck: false });
  const [toast, setToast] = useState<{ visible: boolean; msg: string; type: ToastType }>({ visible: false, msg: '', type: 'info' });

  const missionaryInputRef = useRef<HTMLInputElement>(null);
  const itemInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    loadData();
    const hour = new Date().getHours();
    const autoShift = hour < 12 ? 'Manhã' : hour < 18 ? 'Tarde' : 'Noite';
    if (!localStorage.getItem('hd_shift')) setShift(autoShift);
  }, []);

  useEffect(() => {
    localStorage.setItem('hd_operator', operatorName);
    localStorage.setItem('hd_loc', location);
    localStorage.setItem('hd_shift', shift);
  }, [operatorName, location, shift]);

  useEffect(() => {
    if (cart.length === 0) return;
    setCart(currentCart => currentCart.map(line => {
      if (missionary) {
        const repeatedTx = HelpdeskService.checkRepeatedDonation(missionary.id, line.item.id);
        if (!!repeatedTx !== line.isRepeated) {
           return { ...line, isRepeated: !!repeatedTx, lastDonationDate: repeatedTx?.timestamp };
        }
        return line;
      } else {
        return line.isRepeated ? { ...line, isRepeated: false, lastDonationDate: undefined } : line;
      }
    }));
  }, [missionary]);

  const loadData = () => {
    setStockItems(HelpdeskService.getHelpdeskStock());
    onRefreshData();
  };

  const showToast = (msg: string, type: ToastType = 'success') => {
    setToast({ visible: true, msg, type });
  };

  const handleAddItem = (item: InventoryItem, qtyOverride: number = 1) => {
    if (item.quantity <= 0) {
      showToast(`Item ${item.name} sem saldo!`, 'error');
      return; 
    }
    setCart(prev => {
      const existingIdx = prev.findIndex(c => c.item.id === item.id);
      if (existingIdx >= 0) {
        const existing = prev[existingIdx];
        const newQty = existing.qty + qtyOverride;
        if (newQty > item.quantity) {
          showToast(`Limite de saldo atingido para ${item.name}`, 'warning');
          return prev;
        }
        const newCart = [...prev];
        newCart[existingIdx] = { ...existing, qty: newQty };
        return newCart;
      }
      const repeatedTx = missionary ? HelpdeskService.checkRepeatedDonation(missionary.id, item.id) : null;
      if (repeatedTx) showToast(`Aviso: ${item.name} já doado.`, 'warning');
      return [...prev, { 
        item, 
        qty: qtyOverride, 
        isRepeated: !!repeatedTx, 
        lastDonationDate: repeatedTx?.timestamp, 
        needsConfirmation: item.isRestricted,
        type: 'DONATION' // Default type
      }];
    });
  };

  const handleScanSuccess = (decodedText: string, itemId: string) => {
    const item = stockItems.find(i => i.id === itemId);
    if (item) {
      handleAddItem(item);
      showToast(`Item ${item.name} adicionado via Scanner.`);
      setIsScannerOpen(false);
    } else {
      showToast(`Item ${itemId} não encontrado no estoque Helpdesk.`, 'error');
    }
  };

  const handleTicketSelect = (ticket: StockRequest) => {
    setMissionary({ id: ticket.requesterId, name: ticket.requesterName, createdAt: '', totalItemsReceived: 0 });
    setCart([]);
    const item = stockItems.find(i => i.id === ticket.itemId);
    if (item) { handleAddItem(item, ticket.quantity); setLinkedTicketId(ticket.id); showToast(`Pedido #${ticket.id} carregado.`, 'info'); setActiveTab('SEARCH'); }
    else { showToast(`Item não encontrado.`, 'error'); }
  };

  const handleUpdateQty = (idx: number, delta: number) => {
    setCart(prev => {
      const line = prev[idx];
      const newQty = line.qty + delta;
      if (newQty <= 0) return prev.filter((_, i) => i !== idx);
      if (newQty > line.item.quantity) return prev;
      const newCart = [...prev];
      newCart[idx] = { ...line, qty: newQty };
      return newCart;
    });
  };

  const handleToggleType = (idx: number) => {
    setCart(prev => {
      const line = prev[idx];
      const newCart = [...prev];
      newCart[idx] = { ...line, type: line.type === 'DONATION' ? 'LOAN' : 'DONATION' };
      return newCart;
    });
  };

  const handleRemove = (idx: number) => setCart(prev => prev.filter((_, i) => i !== idx));

  const handleConfirmStart = () => {
    if (!missionary) return showToast("Selecione um missionário.", 'warning');
    if (!operatorName) return showToast("Nome do operador obrigatório.", 'warning');
    const hasWarnings = cart.some(c => c.item.isRestricted || c.isRepeated);
    if (hasWarnings) { setConfirmModal({ isOpen: true, doubleCheck: false }); }
    else { executeDelivery(); }
  };

  const executeDelivery = () => {
    if (!missionary) return;
    try {
      HelpdeskService.helpdeskDeliver(currentUser, {
        missionaryId: missionary.id,
        missionaryName: missionary.name,
        operatorName,
        reason: linkedTicketId ? `Atendimento Ticket #${linkedTicketId}` : 'Atendimento Helpdesk',
        location,
        shift,
        items: cart,
        linkedTicketId: linkedTicketId || undefined
      });
      setCart([]); setMissionary(null); setLinkedTicketId(null); setConfirmModal({ isOpen: false, doubleCheck: false });
      loadData(); showToast("Entrega registrada com sucesso!", "success"); setActiveTab('SEARCH');
      setTimeout(() => missionaryInputRef.current?.focus(), 100);
    } catch (e: any) { showToast(e.message, 'error'); }
  };

  const handleClear = () => {
    if (cart.length > 0 || missionary) {
      if (confirm("Limpar atendimento atual?")) {
        setCart([]); setMissionary(null); setLinkedTicketId(null); missionaryInputRef.current?.focus();
      }
    }
  };

  useHelpdeskHotkeys({
    onF2: () => { setActiveTab('SEARCH'); setTimeout(() => missionaryInputRef.current?.focus(), 50); },
    onF3: () => itemInputRef.current?.focus(),
    onF4: () => setActiveTab(prev => prev === 'QUEUE' ? 'SEARCH' : 'QUEUE'),
    onCtrlK: () => itemInputRef.current?.focus(),
    onCtrlEnter: handleConfirmStart,
    onCtrlZ: () => { if (cart.length > 0) handleRemove(cart.length - 1); },
    onEsc: () => { if (isStockViewOpen) setIsStockViewOpen(false); else if (isScannerOpen) setIsScannerOpen(false); else handleClear(); }
  });

  return (
    <div className="flex flex-col h-screen bg-[#F3F9F7] overflow-hidden font-sans text-[#2C6975]">
      <Toast message={toast.msg} type={toast.type} isVisible={toast.visible} onClose={() => setToast({ ...toast, visible: false })} />
      {isScannerOpen && <ScannerModal onScanSuccess={handleScanSuccess} onClose={() => setIsScannerOpen(false)} />}
      
      {/* Top Bar - "Command Center" Style */}
      <div className="h-16 bg-white border-b border-[#E0ECDE] flex items-center justify-between px-6 shadow-sm shrink-0">
        <div className="flex items-center gap-4">
          <div className="bg-[#2C6975] text-white p-2 rounded-xl shadow-lg shadow-[#2C6975]/30">
             <Command size={20} />
          </div>
          <div>
            <h1 className="font-bold text-[#2C6975] leading-none tracking-wide text-base uppercase">Helpdesk Console</h1>
            <div className="flex items-center gap-2 mt-1">
               <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></span>
               <span className="text-[10px] text-[#68B2A0] font-medium">SISTEMA ONLINE</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-6">
           <button onClick={() => setIsStockViewOpen(true)} className="flex items-center gap-2 text-xs font-bold text-[#68B2A0] hover:text-[#2C6975] bg-[#F5F9F7] hover:bg-white px-3 py-2 rounded-xl border border-[#CDE0C9] transition-all shadow-sm">
             <Package size={16} /> ESTOQUE
           </button>
           <div className="w-px h-6 bg-[#CDE0C9]"></div>
           <div className="flex items-center gap-4 bg-white py-1.5 px-4 rounded-full border border-[#E0ECDE] shadow-sm">
              <div className="flex items-center gap-2 text-xs text-[#2C6975]">
                 <MapPin size={14} className="text-[#2C6975]" />
                 <span className="font-bold">{location}</span>
              </div>
              <div className="w-px h-3 bg-[#CDE0C9]"></div>
              <div className="flex items-center gap-2 text-xs text-[#2C6975]">
                 <Clock size={14} className="text-[#68B2A0]" />
                 <span className="font-bold">{shift}</span>
              </div>
           </div>
           <button onClick={onLogout} className="text-[#68B2A0] hover:text-red-500 font-bold text-xs flex items-center gap-2 hover:bg-red-50 px-3 py-2 rounded-xl transition-all">
             <LogOut size={16} /> SAIR
           </button>
        </div>
      </div>

      <div className="flex-1 overflow-hidden p-4">
        <div className="grid grid-cols-12 gap-4 h-full max-w-[1920px] mx-auto">
          <div className="col-span-3 h-full flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden border border-[#E0ECDE]">
            <MissionaryPanel missionary={missionary} setMissionary={setMissionary} inputRef={missionaryInputRef} onRepeatItem={(itemId) => { const item = stockItems.find(i => i.id === itemId); if (item) handleAddItem(item); }} onSelectTicket={handleTicketSelect} activeTab={activeTab} setActiveTab={setActiveTab} />
          </div>
          <div className="col-span-5 h-full flex flex-col bg-white rounded-[24px] shadow-lg shadow-[#2C6975]/5 overflow-hidden border border-[#E0ECDE] relative z-10 ring-1 ring-[#CDE0C9]">
            <CartPanel 
              cart={cart} 
              onUpdateQty={handleUpdateQty} 
              onToggleType={handleToggleType}
              onRemove={handleRemove} 
              onConfirm={handleConfirmStart} 
              onClear={handleClear} 
              operatorName={operatorName} 
              setOperatorName={setOperatorName} 
              location={location} 
              setLocation={setLocation} 
              shift={shift} 
              setShift={setShift} 
            />
          </div>
          <div className="col-span-4 h-full flex flex-col bg-white rounded-[24px] shadow-sm overflow-hidden border border-[#E0ECDE]">
            <StockLookupPanel items={stockItems} onAddItem={handleAddItem} onOpenScanner={() => setIsScannerOpen(true)} inputRef={itemInputRef} />
          </div>
        </div>
      </div>

      <div className="h-8 bg-white border-t border-[#E0ECDE] flex items-center justify-center gap-8 text-[10px] font-bold text-[#68B2A0] uppercase tracking-widest select-none shadow-[0_-4px_10px_rgba(0,0,0,0.02)]">
         <span className="flex items-center gap-1"><kbd className="bg-[#F5F9F7] text-[#2C6975] px-1.5 py-0.5 rounded border border-[#CDE0C9] font-mono">F2</kbd> BUSCAR PESSOA</span>
         <span className="flex items-center gap-1"><kbd className="bg-[#F5F9F7] text-[#2C6975] px-1.5 py-0.5 rounded border border-[#CDE0C9] font-mono">F3</kbd> BUSCAR ITEM</span>
         <span className="flex items-center gap-1"><kbd className="bg-[#F5F9F7] text-[#2C6975] px-1.5 py-0.5 rounded border border-[#CDE0C9] font-mono">F4</kbd> FILA/TICKETS</span>
         <span className="flex items-center gap-1"><kbd className="bg-[#F5F9F7] text-[#2C6975] px-1.5 py-0.5 rounded border border-[#CDE0C9] font-mono">CTRL+ENT</kbd> CONFIRMAR</span>
         <span className="flex items-center gap-1"><kbd className="bg-[#F5F9F7] text-[#2C6975] px-1.5 py-0.5 rounded border border-[#CDE0C9] font-mono">ESC</kbd> LIMPAR</span>
      </div>

      <Modal isOpen={isStockViewOpen} onClose={() => setIsStockViewOpen(false)} title=""><div className="h-[70vh]"><HelpdeskStock items={stockItems} onClose={() => setIsStockViewOpen(false)} /></div></Modal>
      <Modal isOpen={confirmModal.isOpen} onClose={() => setConfirmModal({ isOpen: false, doubleCheck: false })} title="Auditoria de Segurança">
        <div className="space-y-6">
           <div className="bg-orange-50 p-5 rounded-2xl border border-orange-100 flex gap-4">
             <div className="bg-orange-100 p-3 rounded-full h-fit text-orange-600"><AlertCircle size={24} /></div>
             <div>
               <h4 className="font-bold text-orange-900 text-lg">Atenção Necessária</h4>
               <p className="text-sm text-orange-800 mt-1 leading-relaxed">Existem alertas de doação repetida ou itens restritos. Verifique antes de confirmar.</p>
             </div>
           </div>
           <div className="pt-6 flex justify-end gap-3 border-t border-gray-100">
             <button onClick={() => setConfirmModal({ isOpen: false, doubleCheck: false })} className="px-6 py-3 text-slate-500 hover:bg-slate-50 rounded-xl font-bold transition-colors"> Cancelar </button>
             {!confirmModal.doubleCheck ? (
                <button onClick={() => setConfirmModal(prev => ({ ...prev, doubleCheck: true }))} className="px-8 py-3 bg-[#2C6975] text-white rounded-xl font-bold hover:bg-[#68B2A0] transition-colors shadow-lg"> Estou Ciente e Autorizo </button>
             ) : (
                <button onClick={executeDelivery} className="px-8 py-3 bg-[#E07A5F] text-white rounded-xl font-bold hover:bg-[#D68C8C] transition-colors shadow-lg shadow-orange-200"> CONFIRMAR AGORA </button>
             )}
           </div>
        </div>
      </Modal>
    </div>
  );
};

export default HelpdeskConsole;
