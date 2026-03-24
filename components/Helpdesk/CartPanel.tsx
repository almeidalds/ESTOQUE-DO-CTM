
import React, { useRef, useEffect } from 'react';
import { InventoryItem } from '../../types';
import { Trash2, Plus, Minus, Send, AlertTriangle, ShieldAlert, Lock, UserCheck, CalendarClock, Box, Share2, HeartHandshake } from 'lucide-react';

interface CartItem {
  item: InventoryItem;
  qty: number;
  isRepeated: boolean;
  lastDonationDate?: string;
  needsConfirmation?: boolean; 
  type: 'DONATION' | 'LOAN';
}

interface Props {
  cart: CartItem[];
  onUpdateQty: (idx: number, delta: number) => void;
  onToggleType: (idx: number) => void;
  onRemove: (idx: number) => void;
  onConfirm: () => void;
  onClear: () => void;
  
  operatorName: string;
  setOperatorName: (val: string) => void;
  location: string;
  setLocation: (val: string) => void;
  shift: string;
  setShift: (val: string) => void;
}

const CartPanel: React.FC<Props> = ({ 
  cart, onUpdateQty, onToggleType, onRemove, onConfirm, onClear,
  operatorName, setOperatorName, location, setLocation, shift, setShift
}) => {
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    scrollRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [cart.length]);

  const totalItems = cart.reduce((acc, c) => acc + c.qty, 0);
  
  const hasRestricted = cart.some(c => c.item.isRestricted);
  const hasRepeated = cart.some(c => c.isRepeated);

  return (
    <div className="flex flex-col h-full bg-slate-50">
      
      {/* Operator Header - Always Visible */}
      <div className="bg-white p-4 shadow-sm z-20 border-b border-slate-200">
         <div className="flex items-end gap-3">
            <div className="flex-1">
               <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 flex items-center gap-1">
                 <UserCheck size={12} /> Operador Responsável
               </label>
               <input 
                 value={operatorName}
                 onChange={e => setOperatorName(e.target.value)}
                 className={`w-full p-2.5 text-sm border-2 rounded-xl bg-slate-50 font-bold text-slate-700 outline-none transition-all ${!operatorName ? 'border-red-300 bg-red-50 focus:border-red-500' : 'border-slate-200 focus:border-blue-500'}`}
                 placeholder="Digite seu nome..."
               />
            </div>
            
            {/* Meta Compact Grid */}
            <div className="flex gap-2">
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Local</label>
                  <select value={location} onChange={e => setLocation(e.target.value)} className="w-28 p-2.5 text-xs border-2 border-slate-200 rounded-xl bg-white font-bold text-slate-600 outline-none focus:border-blue-500">
                    <option>Helpdesk</option>
                    <option>Alojamento</option>
                    <option>Refeitório</option>
                  </select>
               </div>
               <div>
                  <label className="text-[10px] font-bold text-slate-400 uppercase mb-1 block">Turno</label>
                  <select value={shift} onChange={e => setShift(e.target.value)} className="w-24 p-2.5 text-xs border-2 border-slate-200 rounded-xl bg-white font-bold text-slate-600 outline-none focus:border-blue-500">
                    <option>Manhã</option>
                    <option>Tarde</option>
                    <option>Noite</option>
                  </select>
               </div>
            </div>
         </div>
      </div>

      {/* Warnings Banner */}
      {(hasRepeated || hasRestricted) && (
        <div className={`px-4 py-3 text-xs font-bold border-b shadow-inner flex items-center gap-3 ${hasRestricted ? 'bg-red-50 text-red-800 border-red-100' : 'bg-orange-50 text-orange-800 border-orange-100'}`}>
           <div className={`p-1.5 rounded-full ${hasRestricted ? 'bg-red-200 text-red-700' : 'bg-orange-200 text-orange-700'}`}>
             {hasRestricted ? <ShieldAlert size={14}/> : <AlertTriangle size={14}/>}
           </div>
           <div>
             {hasRestricted && <p>ATENÇÃO: Itens restritos requerem liberação.</p>}
             {hasRepeated && <p>AVISO: Doação repetida detectada (últimos 30 dias).</p>}
           </div>
        </div>
      )}

      {/* Cart List */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 custom-scrollbar">
        {cart.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-slate-300 opacity-60">
            <div className="w-24 h-24 border-4 border-dashed border-slate-200 rounded-full flex items-center justify-center mb-4">
              <Box size={40} strokeWidth={1.5} />
            </div>
            <p className="text-lg font-bold text-slate-400">Carrinho Vazio</p>
            <p className="text-sm">Use a busca (F3) ou escaneie um item.</p>
          </div>
        )}
        
        {cart.map((line, idx) => (
          <div key={idx} className={`bg-white p-4 rounded-xl border shadow-sm relative group transition-all hover:shadow-md ${line.isRepeated ? 'border-orange-300 ring-2 ring-orange-100 bg-orange-50/10' : 'border-slate-200'}`}>
            
            {/* Badges */}
            <div className="absolute -top-2 -right-2 flex flex-col items-end gap-1 pointer-events-none z-10">
               {line.isRepeated && (
                 <span className="bg-orange-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1 animate-pulse">
                   <AlertTriangle size={10} /> REPETIDO
                 </span>
               )}
               {line.item.isRestricted && (
                 <span className="bg-red-600 text-white text-[10px] font-black px-2 py-0.5 rounded-full shadow-md flex items-center gap-1">
                   <Lock size={10} /> RESTRITO
                 </span>
               )}
            </div>

            <div className="flex items-start gap-4">
              {/* Qty Control (Big & Bold) */}
              <div className="flex flex-col items-center bg-slate-50 rounded-lg border border-slate-200 overflow-hidden shrink-0">
                 <button onClick={() => onUpdateQty(idx, 1)} className="w-10 h-8 hover:bg-blue-100 hover:text-blue-600 flex items-center justify-center transition-colors"><Plus size={14} strokeWidth={3}/></button>
                 <input 
                   className="w-10 h-8 text-center bg-white font-black text-slate-800 text-lg outline-none border-y border-slate-200"
                   value={line.qty}
                   onChange={e => {
                     const val = parseInt(e.target.value);
                     if (!isNaN(val)) onUpdateQty(idx, val - line.qty);
                   }}
                 />
                 <button onClick={() => onUpdateQty(idx, -1)} className="w-10 h-8 hover:bg-slate-200 text-slate-500 flex items-center justify-center transition-colors"><Minus size={14} strokeWidth={3}/></button>
              </div>

              <div className="flex-1 min-w-0 py-1">
                <div className="font-bold text-slate-800 text-lg leading-tight truncate">{line.item.name}</div>
                <div className="flex items-center gap-2 mt-1">
                   <span className="text-xs font-mono text-slate-500 bg-slate-100 px-1.5 rounded">{line.item.id}</span>
                   <span className="text-xs text-slate-400">|</span>
                   <span className="text-xs text-slate-500">Estoque: {line.item.quantity}</span>
                </div>
                
                {/* Type Toggle */}
                <div className="mt-3 flex items-center gap-2">
                   <div className="flex bg-slate-100 p-0.5 rounded-lg border border-slate-200">
                      <button 
                        onClick={() => onToggleType(idx)} 
                        className={`px-3 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${line.type === 'DONATION' ? 'bg-white text-green-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <HeartHandshake size={12} /> Doar
                      </button>
                      <button 
                        onClick={() => onToggleType(idx)} 
                        className={`px-3 py-1 text-[10px] font-bold rounded-md flex items-center gap-1 transition-all ${line.type === 'LOAN' ? 'bg-white text-blue-700 shadow-sm' : 'text-slate-400 hover:text-slate-600'}`}
                      >
                        <Share2 size={12} /> Emprestar
                      </button>
                   </div>
                   {line.type === 'LOAN' && (
                     <span className="text-[10px] font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded">Devolução em 7d</span>
                   )}
                </div>

                {line.isRepeated && line.lastDonationDate && (
                  <div className="text-xs text-orange-700 font-bold flex items-center gap-1 mt-2 bg-orange-100 border border-orange-200 w-fit px-2 py-1 rounded">
                    <CalendarClock size={12} /> Entregue: {new Date(line.lastDonationDate).toLocaleDateString()}
                  </div>
                )}
              </div>

              <button 
                onClick={() => onRemove(idx)} 
                className="text-slate-300 hover:text-red-500 hover:bg-red-50 p-2 rounded-lg transition-all self-center"
              >
                <Trash2 size={20} />
              </button>
            </div>
          </div>
        ))}
        <div ref={scrollRef} />
      </div>

      {/* Footer Actions */}
      <div className="bg-white p-4 border-t border-slate-200 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] z-20">
         <div className="flex justify-between items-center mb-4 px-1">
            <span className="text-xs font-bold text-slate-400 uppercase tracking-wide">Total de Itens</span>
            <span className="text-2xl font-black text-slate-800">{totalItems}</span>
         </div>

         <div className="flex gap-3">
           <button 
             onClick={onClear} 
             className="px-4 py-4 rounded-xl border-2 border-slate-200 text-slate-500 font-bold hover:bg-slate-50 hover:text-slate-700 transition-colors"
             title="Limpar (Esc)"
           >
             <Trash2 size={20} />
           </button>
           
           <button 
             onClick={onConfirm}
             disabled={cart.length === 0 || !operatorName}
             className={`flex-1 py-4 text-white rounded-xl font-bold shadow-lg active:scale-[0.98] transition-all flex items-center justify-center gap-3 text-lg ${
                hasRepeated 
                  ? 'bg-orange-600 hover:bg-orange-700 shadow-orange-200' 
                  : 'bg-blue-600 hover:bg-blue-700 shadow-blue-200'
             } disabled:bg-slate-300 disabled:cursor-not-allowed`}
           >
             <Send size={22} />
             {hasRepeated ? 'CONFIRMAR (ALERTA)' : 'CONFIRMAR ENTREGA'}
           </button>
         </div>
      </div>
    </div>
  );
};

export default CartPanel;
