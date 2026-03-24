
import React from 'react';
import { ImportRow } from '../types';
import { AlertCircle, CheckCircle, PlusCircle, RefreshCcw } from 'lucide-react';

interface Props {
  rows: ImportRow[];
}

const ImportPreviewTable: React.FC<Props> = ({ rows }) => {
  if (rows.length === 0) return null;

  return (
    <div className="overflow-x-auto border border-gray-200 rounded-lg shadow-sm">
      <table className="w-full text-left text-xs">
        <thead className="bg-gray-50 text-gray-500 font-bold uppercase">
          <tr>
            <th className="p-3">Status</th>
            <th className="p-3">Linha</th>
            <th className="p-3">Nome</th>
            <th className="p-3">Categoria</th>
            <th className="p-3">Min/Max</th>
            <th className="p-3">Estoque</th>
            <th className="p-3">Caminho</th>
            <th className="p-3">Qtd Inicial</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-gray-100 bg-white">
          {rows.map((row) => (
            <tr key={row.rowId} className={row.status === 'ERROR' ? 'bg-red-50' : 'hover:bg-gray-50'}>
              <td className="p-3">
                {row.status === 'OK' && <span className="text-blue-500 font-bold flex gap-1"><CheckCircle size={14}/> OK</span>}
                {row.status === 'CREATE' && <span className="text-green-600 font-bold flex gap-1"><PlusCircle size={14}/> NOVO</span>}
                {row.status === 'UPDATE' && <span className="text-orange-500 font-bold flex gap-1"><RefreshCcw size={14}/> ATUALIZAR</span>}
                {row.status === 'DUPLICATE_SKIP' && <span className="text-gray-400 font-bold">IGNORAR</span>}
                {row.status === 'ERROR' && (
                  <div className="text-red-600 font-bold flex items-center gap-1" title={row.message}>
                    <AlertCircle size={14}/> ERRO
                  </div>
                )}
              </td>
              <td className="p-3 font-mono text-gray-400">{row.rowId}</td>
              <td className="p-3 font-medium text-gray-800">{row.name}</td>
              <td className="p-3 text-gray-600">{row.category}</td>
              <td className="p-3 text-gray-600">{row.minQty} / {row.maxQty}</td>
              <td className="p-3 text-gray-600">{row.stockId || '-'}</td>
              <td className="p-3 text-gray-600 truncate max-w-[150px]">{row.locationPath || '-'}</td>
              <td className="p-3 text-gray-600 font-bold">{row.initialQty !== undefined ? row.initialQty : '-'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default ImportPreviewTable;
