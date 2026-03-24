
import React, { useRef, useState } from 'react';
import { Missionary, DonationTerm } from '../../types';
import { X, PenTool, Check } from 'lucide-react';

interface Props {
  missionary: Missionary;
  type: 'DONATION' | 'LOAN';
  items: { itemName: string; quantity: number }[];
  onClose: () => void;
  onSave: (signatureData: string) => void;
}

const TermSigner: React.FC<Props> = ({ missionary, type, items, onClose, onSave }) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const getCoordinates = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    let clientX, clientY;
    
    if ('touches' in e) {
      clientX = e.touches[0].clientX;
      clientY = e.touches[0].clientY;
    } else {
      clientX = (e as React.MouseEvent).clientX;
      clientY = (e as React.MouseEvent).clientY;
    }
    return { x: clientX - rect.left, y: clientY - rect.top };
  };

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    setIsDrawing(true);
    const { x, y } = getCoordinates(e);
    ctx.beginPath();
    ctx.moveTo(x, y);
  };

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if (!isDrawing) return;
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx) return;
    const { x, y } = getCoordinates(e);
    ctx.lineTo(x, y);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    setHasSignature(true);
  };

  const clear = () => {
    const ctx = canvasRef.current?.getContext('2d');
    if (!ctx || !canvasRef.current) return;
    ctx.clearRect(0, 0, canvasRef.current.width, canvasRef.current.height);
    setHasSignature(false);
  };

  const handleSave = () => {
    if (!hasSignature || !canvasRef.current) return;
    onSave(canvasRef.current.toDataURL());
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[90vh]">
        <div className="p-4 bg-slate-50 border-b border-gray-200 flex justify-between items-center">
           <h3 className="font-bold text-slate-800">Assinar Termo de {type === 'DONATION' ? 'Doação' : 'Empréstimo'}</h3>
           <button onClick={onClose}><X size={20} className="text-slate-400 hover:text-slate-600"/></button>
        </div>
        
        <div className="p-6 flex-1 overflow-y-auto">
           <p className="text-sm text-gray-600 mb-4 bg-yellow-50 p-3 rounded border border-yellow-100">
             Eu, <strong>{missionary.name}</strong>, confirmo o recebimento dos itens abaixo e concordo com a política de uso.
           </p>
           
           <ul className="text-xs text-gray-500 mb-6 space-y-1 border-b pb-4 max-h-40 overflow-y-auto">
             {items.map((i, idx) => (
               <li key={idx} className="flex justify-between">
                 <span>{i.itemName}</span>
                 <span className="font-bold">{i.quantity}</span>
               </li>
             ))}
           </ul>

           <div className="border-2 border-dashed border-slate-300 rounded-xl bg-slate-50 relative touch-none">
              <canvas 
                ref={canvasRef}
                width={400}
                height={150}
                className="w-full h-[150px] cursor-crosshair"
                onMouseDown={startDraw}
                onMouseMove={draw}
                onMouseUp={stopDraw}
                onMouseLeave={stopDraw}
                onTouchStart={startDraw}
                onTouchMove={draw}
                onTouchEnd={stopDraw}
              />
              <div className="absolute bottom-2 right-2 text-[10px] text-slate-400 pointer-events-none flex items-center gap-1">
                <PenTool size={10} /> Assine aqui
              </div>
           </div>
           <button onClick={clear} className="text-xs text-red-500 font-bold mt-2 hover:underline">Limpar Assinatura</button>
        </div>

        <div className="p-4 bg-white border-t border-gray-100 flex justify-end gap-3">
           <button onClick={onClose} className="px-4 py-2 text-slate-500 font-bold text-sm">Cancelar</button>
           <button 
             onClick={handleSave} 
             disabled={!hasSignature}
             className="px-6 py-2 bg-[#001B48] text-white rounded-xl font-bold shadow-lg disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2"
           >
             <Check size={16} /> Confirmar
           </button>
        </div>
      </div>
    </div>
  );
};

export default TermSigner;
