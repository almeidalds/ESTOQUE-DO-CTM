import React, { useState } from 'react';
import { InventoryItem, Warehouse } from '../types';
import { analyzeStock } from '../services/geminiService';
import { Sparkles, RefreshCw, AlertTriangle } from 'lucide-react';
import ReactMarkdown from 'react-markdown'; 

interface AIAssistantProps {
  items: InventoryItem[];
  warehouses: Warehouse[];
}

const AIAssistant: React.FC<AIAssistantProps> = ({ items, warehouses }) => {
  const [analysis, setAnalysis] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAnalysis = async () => {
    setLoading(true);
    setError(null);
    try {
      const result = await analyzeStock(items, warehouses);
      setAnalysis(result || "Sem resposta da IA.");
    } catch (err: any) {
      setError(err.message || "Erro desconhecido ao analisar estoque.");
    } finally {
      setLoading(false);
    }
  };

  // Simple Markdown-ish renderer for the AI output
  const renderMarkdown = (text: string) => {
    const lines = text.split('\n');
    return lines.map((line, index) => {
      // Headers
      if (line.startsWith('### ')) return <h3 key={index} className="text-lg font-bold text-gray-800 mt-4 mb-2">{line.replace('### ', '')}</h3>;
      if (line.startsWith('## ')) return <h2 key={index} className="text-xl font-bold text-gray-900 mt-6 mb-3">{line.replace('## ', '')}</h2>;
      if (line.startsWith('**') && line.endsWith('**')) return <strong key={index} className="block mt-2 mb-1">{line.replace(/\*\*/g, '')}</strong>;
      
      // List items
      if (line.trim().startsWith('- ')) {
         return <li key={index} className="ml-4 list-disc text-gray-700 my-1">{line.replace('- ', '').replace(/\*\*/g, '')}</li>
      }
      if (line.trim().match(/^\d+\./)) {
         return <div key={index} className="ml-4 text-gray-700 my-1 font-medium">{line.replace(/\*\*/g, '')}</div>
      }

      // Paragraphs with bold replacement
      const parts = line.split(/(\*\*.*?\*\*)/g);
      return (
        <p key={index} className="mb-2 text-gray-700 leading-relaxed">
          {parts.map((part, i) => 
            part.startsWith('**') && part.endsWith('**') 
              ? <strong key={i} className="font-semibold text-gray-900">{part.slice(2, -2)}</strong> 
              : part
          )}
        </p>
      );
    });
  };

  return (
    <div className="bg-white rounded-xl shadow-lg border border-gray-100 overflow-hidden animate-fade-in max-w-4xl mx-auto mt-6">
      <div className="bg-gradient-to-r from-[#324F85] to-[#ACCBEC] p-8 text-white">
        <div className="flex items-center gap-3 mb-2">
          <Sparkles className="text-yellow-300" size={28} />
          <h2 className="text-2xl font-bold">Analista de Estoque</h2>
        </div>
        <p className="text-blue-100 opacity-90 max-w-2xl">
          Utilize a inteligência artificial Gemini para analisar seus 7 estoques, identificar gargalos,
          sugerir reabastecimentos e otimizar a distribuição de produtos entre as filiais.
        </p>
      </div>

      <div className="p-8">
        {!analysis && !loading && !error && (
          <div className="text-center py-12">
            <div className="bg-[#F0F5FA] w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4 text-[#324F85]">
              <Sparkles size={32} />
            </div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Pronto para Analisar</h3>
            <p className="text-gray-500 mb-8 max-w-md mx-auto">
              Clique no botão abaixo para gerar um relatório completo sobre a saúde do seu inventário.
            </p>
            <button
              onClick={handleAnalysis}
              className="px-6 py-3 bg-[#324F85] text-white rounded-lg font-semibold shadow-md hover:bg-[#263c66] transition-all transform hover:-translate-y-0.5 active:translate-y-0 flex items-center gap-2 mx-auto"
            >
              <Sparkles size={18} />
              Gerar Relatório Inteligente
            </button>
          </div>
        )}

        {loading && (
          <div className="text-center py-16 flex flex-col items-center">
            <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-[#324F85] mb-4"></div>
            <p className="text-gray-600 font-medium animate-pulse">Consultando Gemini AI...</p>
            <p className="text-sm text-gray-400 mt-2">Isso pode levar alguns segundos.</p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-6 flex flex-col items-center text-center">
             <AlertTriangle className="text-red-500 mb-3" size={32} />
             <h3 className="text-red-800 font-bold mb-1">Erro na Análise</h3>
             <p className="text-red-600 mb-4">{error}</p>
             <button
              onClick={handleAnalysis}
              className="px-4 py-2 bg-white border border-red-300 text-red-700 rounded-lg hover:bg-red-50 font-medium transition-colors flex items-center gap-2"
            >
              <RefreshCw size={16} /> Tentar Novamente
            </button>
          </div>
        )}

        {analysis && !loading && (
          <div className="animate-fade-in">
            <div className="prose prose-indigo max-w-none bg-gray-50 p-8 rounded-xl border border-gray-200">
              {renderMarkdown(analysis)}
            </div>
            <div className="mt-8 flex justify-end">
              <button
                onClick={handleAnalysis}
                className="px-4 py-2 text-[#324F85] hover:bg-[#F0F5FA] rounded-lg font-medium transition-colors flex items-center gap-2"
              >
                <RefreshCw size={18} />
                Atualizar Análise
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AIAssistant;
