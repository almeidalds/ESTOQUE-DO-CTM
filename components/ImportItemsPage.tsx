
import React, { useState, useRef } from 'react';
import { Upload, FileText, Check, AlertTriangle, Download, RefreshCw, Save } from 'lucide-react';
import { ImportRow, ImportResult, User } from '../types';
import * as ImportService from '../services/importService';
import * as InventoryService from '../services/inventoryService';
import ImportPreviewTable from './ImportPreviewTable';

interface Props {
  currentUser: User;
  onCancel: () => void;
}

const ImportItemsPage: React.FC<Props> = ({ currentUser, onCancel }) => {
  const [file, setFile] = useState<File | null>(null);
  const [rows, setRows] = useState<ImportRow[]>([]);
  const [mode, setMode] = useState<'CREATE_ONLY' | 'UPDATE_EXISTING'>('CREATE_ONLY');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState<ImportResult | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const selectedFile = e.target.files[0];
      setFile(selectedFile);
      setAnalyzing(true);
      try {
        const parsedRows = await ImportService.parseFile(selectedFile);
        
        // Basic pre-analysis against current DB to guess status (Create vs Update)
        // Note: Real confirmation happens on "Apply", but we give visual feedback
        const currentItems = InventoryService.getItems();
        const analyzedRows = parsedRows.map(row => {
           if (row.status === 'ERROR') return row;
           
           const exists = currentItems.some(i => 
             i.name.toLowerCase().trim() === row.name.toLowerCase().trim() &&
             (!row.stockId || i.warehouseId === row.stockId)
           );

           if (exists) {
             return { ...row, status: mode === 'UPDATE_EXISTING' ? 'UPDATE' : 'DUPLICATE_SKIP' } as ImportRow;
           } else {
             return { ...row, status: 'CREATE' } as ImportRow;
           }
        });

        setRows(analyzedRows);
      } catch (err: any) {
        alert(err.message);
        setFile(null);
      } finally {
        setAnalyzing(false);
      }
    }
  };

  const handleModeChange = (newMode: 'CREATE_ONLY' | 'UPDATE_EXISTING') => {
    setMode(newMode);
    // Re-analyze status
    const currentItems = InventoryService.getItems();
    setRows(prev => prev.map(row => {
       if (row.status === 'ERROR') return row;
       const exists = currentItems.some(i => 
         i.name.toLowerCase().trim() === row.name.toLowerCase().trim() &&
         (!row.stockId || i.warehouseId === row.stockId)
       );
       if (exists) {
         return { ...row, status: newMode === 'UPDATE_EXISTING' ? 'UPDATE' : 'DUPLICATE_SKIP' } as ImportRow;
       }
       return { ...row, status: 'CREATE' } as ImportRow;
    }));
  };

  const handleApply = async () => {
    if (!confirm(`Confirmar importação de ${rows.filter(r => r.status !== 'DUPLICATE_SKIP' && r.status !== 'ERROR').length} itens?`)) return;
    
    setAnalyzing(true);
    try {
      const res = await InventoryService.importItemsBatch(rows, mode, currentUser);
      setResult(res);
    } catch (e: any) {
      alert("Erro na importação: " + e.message);
    } finally {
      setAnalyzing(false);
    }
  };

  if (result) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-8 animate-fade-in">
        <div className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full text-center border border-green-100">
           <div className="w-20 h-20 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4 text-green-600">
             <Check size={40} strokeWidth={3} />
           </div>
           <h2 className="text-2xl font-bold text-gray-800 mb-6">Importação Concluída</h2>
           
           <div className="grid grid-cols-2 gap-4 mb-8">
              <div className="bg-green-50 p-3 rounded-xl border border-green-200">
                <div className="text-2xl font-bold text-green-700">{result.created}</div>
                <div className="text-xs font-bold text-green-600 uppercase">Criados</div>
              </div>
              <div className="bg-orange-50 p-3 rounded-xl border border-orange-200">
                <div className="text-2xl font-bold text-orange-700">{result.updated}</div>
                <div className="text-xs font-bold text-orange-600 uppercase">Atualizados</div>
              </div>
              <div className="bg-gray-50 p-3 rounded-xl border border-gray-200">
                <div className="text-2xl font-bold text-gray-700">{result.skipped}</div>
                <div className="text-xs font-bold text-gray-500 uppercase">Ignorados</div>
              </div>
              <div className="bg-red-50 p-3 rounded-xl border border-red-200">
                <div className="text-2xl font-bold text-red-700">{result.errors}</div>
                <div className="text-xs font-bold text-red-600 uppercase">Erros</div>
              </div>
           </div>

           <button onClick={onCancel} className="w-full py-3 bg-[#324F85] text-white rounded-xl font-bold hover:bg-[#263c66]">
             Voltar ao Inventário
           </button>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col p-6 animate-fade-in bg-white rounded-2xl shadow-sm border border-gray-100">
      
      {/* Header */}
      <div className="flex justify-between items-start mb-6">
        <div>
          <h2 className="text-2xl font-bold text-[#324F85] flex items-center gap-2">
            <Upload size={24} /> Importação em Massa
          </h2>
          <p className="text-gray-500 text-sm mt-1">Carregue arquivos CSV ou Excel para criar ou atualizar itens.</p>
        </div>
        <button onClick={onCancel} className="text-gray-400 hover:text-gray-600">Fechar</button>
      </div>

      {/* Control Bar */}
      {!file && (
        <div className="flex-1 flex flex-col items-center justify-center border-2 border-dashed border-gray-300 rounded-xl bg-gray-50 hover:bg-gray-100 transition-colors cursor-pointer group" onClick={() => fileInputRef.current?.click()}>
           <input type="file" accept=".csv, .xlsx, .xls" className="hidden" ref={fileInputRef} onChange={handleFileChange} />
           <div className="bg-white p-4 rounded-full shadow-sm mb-4 group-hover:scale-110 transition-transform">
             <FileText size={32} className="text-[#324F85]" />
           </div>
           <h3 className="font-bold text-gray-700 text-lg">Clique para upload ou arraste o arquivo</h3>
           <p className="text-gray-400 text-sm mt-2">Suporta CSV e Excel (.xlsx)</p>
           
           <div className="mt-8 p-4 bg-blue-50 rounded-lg text-left text-sm text-blue-800 max-w-lg border border-blue-100">
             <div className="font-bold mb-2 flex items-center gap-2"><AlertTriangle size={14}/> Colunas Obrigatórias (Header):</div>
             <code className="block bg-white p-2 rounded border border-blue-200 text-xs">
               NOME_DO_PRODUTO, CATEGORIA, UNIDADE, QUANTIDADE_MINIMA, QUANTIDADE_MAXIMA
             </code>
             <div className="font-bold mt-3 mb-2">Opcionais:</div>
             <code className="block bg-white p-2 rounded border border-blue-200 text-xs">
               ESTOQUE_ID, CAMINHO, QTD_INICIAL
             </code>
           </div>
        </div>
      )}

      {file && (
        <div className="flex flex-col h-full overflow-hidden">
           <div className="flex items-center justify-between mb-4 bg-gray-50 p-4 rounded-xl border border-gray-200">
              <div className="flex items-center gap-3">
                 <div className="bg-[#324F85] text-white p-2 rounded-lg"><FileText size={20}/></div>
                 <div>
                   <div className="font-bold text-gray-800">{file.name}</div>
                   <div className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</div>
                 </div>
              </div>
              
              <div className="flex items-center gap-4">
                 <div className="flex bg-white rounded-lg border border-gray-300 p-1">
                    <button 
                      onClick={() => handleModeChange('CREATE_ONLY')}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${mode === 'CREATE_ONLY' ? 'bg-green-100 text-green-700' : 'text-gray-500'}`}
                    >
                      Apenas Criar
                    </button>
                    <button 
                      onClick={() => handleModeChange('UPDATE_EXISTING')}
                      className={`px-3 py-1.5 text-xs font-bold rounded transition-colors ${mode === 'UPDATE_EXISTING' ? 'bg-orange-100 text-orange-700' : 'text-gray-500'}`}
                    >
                      Criar e Atualizar
                    </button>
                 </div>

                 <button onClick={() => { setFile(null); setRows([]); }} className="text-gray-400 hover:text-red-500 px-3 font-bold text-sm">Remover</button>
                 <button 
                   onClick={handleApply}
                   disabled={analyzing || rows.filter(r => r.status === 'ERROR').length === rows.length}
                   className="flex items-center gap-2 bg-[#324F85] text-white px-6 py-2.5 rounded-xl font-bold hover:bg-[#263c66] shadow-md disabled:opacity-50"
                 >
                   {analyzing ? <RefreshCw className="animate-spin" size={18}/> : <Save size={18} />} 
                   Aplicar Importação
                 </button>
              </div>
           </div>

           <div className="flex-1 overflow-auto custom-scrollbar">
              <ImportPreviewTable rows={rows} />
           </div>
        </div>
      )}

    </div>
  );
};

export default ImportItemsPage;
