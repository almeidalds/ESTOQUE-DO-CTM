
import React, { useState, useRef } from 'react';
import { Missionary, DonationTerm } from '../types';
import * as InventoryService from '../services/inventoryService';
import { FileText, Printer, PenTool, CheckCircle } from 'lucide-react';

interface DonationTermGeneratorProps {
  missionary: Missionary;
  onClose: () => void;
}

const DonationTermGenerator: React.FC<DonationTermGeneratorProps> = ({ missionary, onClose }) => {
  const [startDate, setStartDate] = useState(new Date().toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(new Date().toISOString().split('T')[0]);
  const [term, setTerm] = useState<DonationTerm | null>(null);
  const [view, setView] = useState<'SETUP' | 'PREVIEW'>('SETUP');
  
  // Canvas for signature
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const [hasSignature, setHasSignature] = useState(false);

  const handleGenerate = () => {
    try {
      const newTerm = InventoryService.createDonationTerm(missionary.id, startDate + 'T00:00:00', endDate + 'T23:59:59');
      setTerm(newTerm);
      setView('PREVIEW');
    } catch (e: any) {
      alert(e.message);
    }
  };

  const startDraw = (e: React.MouseEvent) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    setIsDrawing(true);
    const rect = canvas.getBoundingClientRect();
    ctx.beginPath();
    ctx.moveTo(e.clientX - rect.left, e.clientY - rect.top);
  };

  const draw = (e: React.MouseEvent) => {
    if (!isDrawing) return;
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    
    const rect = canvas.getBoundingClientRect();
    ctx.lineTo(e.clientX - rect.left, e.clientY - rect.top);
    ctx.stroke();
  };

  const stopDraw = () => {
    setIsDrawing(false);
    setHasSignature(true);
  };

  const clearSignature = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    setHasSignature(false);
  };

  const handleSign = () => {
    if (!term || !hasSignature || !canvasRef.current) return;
    const dataUrl = canvasRef.current.toDataURL();
    InventoryService.signDonationTerm(term.id, dataUrl);
    setTerm({ ...term, status: 'SIGNED', signature: dataUrl, signedAt: new Date().toISOString() });
  };

  const handlePrint = () => {
    window.print();
  };

  if (view === 'SETUP') {
    return (
      <div className="bg-white p-6 rounded-lg max-w-md mx-auto mt-10 shadow-lg border border-gray-100">
        <h3 className="text-xl font-bold mb-4 flex items-center gap-2">
          <FileText className="text-indigo-600" /> Gerar Termo de Doação
        </h3>
        <p className="text-gray-500 text-sm mb-4">Selecione o período para consolidar os itens recebidos.</p>
        
        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700">Início</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full border rounded p-2" />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Fim</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full border rounded p-2" />
          </div>
        </div>

        <div className="flex gap-2 justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-600">Cancelar</button>
          <button onClick={handleGenerate} className="px-4 py-2 bg-indigo-600 text-white rounded font-medium">Gerar Prévia</button>
        </div>
      </div>
    );
  }

  // PREVIEW / PRINT MODE
  return (
    <div className="flex flex-col h-full bg-gray-100 p-4">
      {/* Controls - Hidden on Print */}
      <div className="mb-4 flex justify-between items-center print:hidden bg-white p-4 rounded-lg shadow-sm">
        <h2 className="font-bold text-gray-700">Prévia do Documento</h2>
        <div className="flex gap-2">
           <button onClick={() => setView('SETUP')} className="px-4 py-2 text-gray-600 border border-gray-300 rounded">Voltar</button>
           <button onClick={handlePrint} className="px-4 py-2 bg-gray-800 text-white rounded flex items-center gap-2">
             <Printer size={16} /> Imprimir / Salvar PDF
           </button>
        </div>
      </div>

      {/* A4 Paper Simulation */}
      <div className="bg-white shadow-2xl mx-auto w-[210mm] min-h-[297mm] p-[20mm] text-gray-900 print:shadow-none print:w-full">
        <div className="text-center border-b-2 border-gray-800 pb-6 mb-8">
           <h1 className="text-2xl font-bold uppercase tracking-wider">Termo de Doação e Recebimento</h1>
           <p className="text-sm mt-2 font-mono">ID: {term?.id}</p>
        </div>

        <div className="mb-8 text-sm leading-relaxed">
           <p className="mb-4">
             Eu, <strong>{missionary.name}</strong> (ID: {missionary.id}), declaro ter recebido da organização <strong>CTM Brasil</strong> os itens listados abaixo, a título de doação gratuita, para uso pessoal e ministerial durante o período de {new Date(startDate).toLocaleDateString()} a {new Date(endDate).toLocaleDateString()}.
           </p>
           <p>
             Declaro estar ciente de que estes itens são para auxílio em minhas atividades e assumo a responsabilidade pelo seu bom uso.
           </p>
        </div>

        <table className="w-full text-sm border-collapse border border-gray-300 mb-8">
          <thead>
            <tr className="bg-gray-100">
              <th className="border border-gray-300 p-2 text-left">Item</th>
              <th className="border border-gray-300 p-2 text-center">Data</th>
              <th className="border border-gray-300 p-2 text-right">Qtd</th>
            </tr>
          </thead>
          <tbody>
            {term?.items.map((item, idx) => (
              <tr key={idx}>
                <td className="border border-gray-300 p-2">{item.itemName}</td>
                <td className="border border-gray-300 p-2 text-center">{new Date(item.date).toLocaleDateString()}</td>
                <td className="border border-gray-300 p-2 text-right font-bold">{item.quantity}</td>
              </tr>
            ))}
            {term?.items.length === 0 && (
              <tr><td colSpan={3} className="p-4 text-center italic">Nenhum item encontrado no período.</td></tr>
            )}
          </tbody>
        </table>

        {/* Signature Section */}
        <div className="mt-16 break-inside-avoid">
           <div className="flex justify-between items-end mb-4">
              <div className="text-sm">
                Data: {new Date().toLocaleDateString()}
              </div>
              <div className="w-1/2 text-center">
                {term?.status === 'SIGNED' ? (
                   <img src={term.signature} alt="Assinatura" className="h-16 mx-auto mb-2" />
                ) : (
                   <div className="print:hidden border-2 border-dashed border-gray-300 rounded p-4 bg-gray-50">
                     <p className="text-xs text-gray-400 mb-2 flex items-center justify-center gap-1"><PenTool size={12}/> Assine abaixo</p>
                     <canvas 
                       ref={canvasRef}
                       width={300} 
                       height={100}
                       className="border border-gray-300 bg-white cursor-crosshair mx-auto touch-none"
                       onMouseDown={startDraw}
                       onMouseMove={draw}
                       onMouseUp={stopDraw}
                       onMouseLeave={stopDraw}
                     />
                     <div className="flex justify-center gap-2 mt-2">
                       <button onClick={clearSignature} className="text-xs text-red-500 hover:underline">Limpar</button>
                       <button onClick={handleSign} disabled={!hasSignature} className="text-xs bg-indigo-600 text-white px-3 py-1 rounded disabled:bg-gray-300">Confirmar Assinatura</button>
                     </div>
                   </div>
                )}
                <div className="border-t border-black mt-2 pt-2 font-bold uppercase text-sm">
                  {missionary.name}
                </div>
                <div className="text-xs text-gray-500">Beneficiário</div>
              </div>
           </div>
        </div>

        <div className="mt-20 text-center text-xs text-gray-400 border-t pt-4">
          Gerenciador de Estoque CTM Brasil • Documento gerado eletronicamente em {new Date().toLocaleString()}
        </div>
      </div>
    </div>
  );
};

export default DonationTermGenerator;
