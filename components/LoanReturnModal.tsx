
import React, { useState } from 'react';
import { Loan, User } from '../types';
import * as InventoryService from '../services/inventoryService';
import { X, Check, AlertTriangle } from 'lucide-react';

interface LoanReturnModalProps {
  loan: Loan;
  currentUser: User;
  onClose: () => void;
  onSuccess: () => void;
}

const LoanReturnModal: React.FC<LoanReturnModalProps> = ({ loan, currentUser, onClose, onSuccess }) => {
  // Track return quantities for each item
  const [returnQtys, setReturnQtys] = useState<Record<string, number>>({});

  const handleQtyChange = (itemId: string, val: string) => {
    const num = parseInt(val) || 0;
    setReturnQtys(prev => ({ ...prev, [itemId]: num }));
  };

  const handleConfirm = () => {
    // Filter only items with quantity > 0
    const itemsToReturn = (Object.entries(returnQtys) as [string, number][])
      .filter(([_, qty]) => qty > 0)
      .map(([itemId, qty]) => ({ itemId, quantity: qty }));

    if (itemsToReturn.length === 0) {
      alert("Informe a quantidade para pelo menos um item.");
      return;
    }

    try {
      InventoryService.returnLoanItems(loan.id, currentUser, itemsToReturn);
      onSuccess();
    } catch (e: any) {
      alert(e.message);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/30 backdrop-blur-sm animate-fade-in">
       <div className="bg-white rounded-2xl shadow-xl w-full max-w-lg overflow-hidden">
          <div className="p-5 border-b border-gray-100 flex justify-between items-center bg-indigo-50">
             <h3 className="text-lg font-bold text-indigo-900">Registrar Devolução</h3>
             <button onClick={onClose} className="text-indigo-400 hover:text-indigo-700"><X size={20}/></button>
          </div>
          
          <div className="p-6">
             <div className="mb-4 text-sm text-gray-600">
               Empréstimo <strong>#{loan.id}</strong> • {loan.missionaryName}
             </div>

             <div className="space-y-4 max-h-[50vh] overflow-y-auto">
               {loan.items.map(item => {
                 const openQty = item.qtyLoaned - item.qtyReturned;
                 if (openQty <= 0) return null; // Fully returned

                 return (
                   <div key={item.itemId} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg bg-gray-50">
                      <div className="flex-1">
                        <div className="font-bold text-gray-800">{item.itemName}</div>
                        <div className="text-xs text-gray-500">Pendente: {openQty} (Emprestado: {item.qtyLoaned})</div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold text-indigo-600 uppercase">Devolver:</span>
                        <input 
                          type="number" 
                          min="0" 
                          max={openQty}
                          className="w-20 p-2 border border-indigo-200 rounded text-center font-bold focus:ring-2 focus:ring-indigo-500 outline-none"
                          placeholder="0"
                          value={returnQtys[item.itemId] || ''}
                          onChange={e => handleQtyChange(item.itemId, e.target.value)}
                        />
                      </div>
                   </div>
                 );
               })}
               {loan.status === 'CLOSED' && (
                 <div className="text-center p-4 text-green-600 font-bold bg-green-50 rounded-lg">
                   <Check className="inline mr-2" size={18}/> Este empréstimo já foi totalmente devolvido.
                 </div>
               )}
             </div>

             <div className="mt-6 flex justify-end gap-3">
               <button onClick={onClose} className="px-4 py-2 text-gray-500 font-medium hover:bg-gray-100 rounded-lg">Cancelar</button>
               {loan.status !== 'CLOSED' && (
                 <button 
                   onClick={handleConfirm}
                   className="px-6 py-2 bg-indigo-600 text-white font-bold rounded-lg hover:bg-indigo-700 shadow-md"
                 >
                   Confirmar Devolução
                 </button>
               )}
             </div>
          </div>
       </div>
    </div>
  );
};

export default LoanReturnModal;
