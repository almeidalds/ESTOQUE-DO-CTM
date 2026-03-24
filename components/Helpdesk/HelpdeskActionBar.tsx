
import React from 'react';
import { HeartHandshake, Share2, Terminal, Plus, ArrowRight } from 'lucide-react';
import { useHelpdeskHotkeys } from '../../hooks/useHelpdeskHotkeys';

interface Props {
  onDonate: () => void;
  onLoan: () => void;
  onOpenConsole: () => void;
  onCreateTicket: () => void;
}

const HelpdeskActionBar: React.FC<Props> = ({ onDonate, onLoan, onOpenConsole, onCreateTicket }) => {
  
  // Atalhos de Teclado
  useHelpdeskHotkeys({
    onCtrlEnter: onOpenConsole, // Atalho padrão para console se nada mais
    // Custom logic would go here if hook supported distinct keys, leveraging simple global listener below for Alt keys
  });

  React.useEffect(() => {
    const handleKeys = (e: KeyboardEvent) => {
      if (e.altKey && e.key.toLowerCase() === 'd') { e.preventDefault(); onDonate(); }
      if (e.altKey && e.key.toLowerCase() === 'e') { e.preventDefault(); onLoan(); }
      if (e.altKey && e.key.toLowerCase() === 'c') { e.preventDefault(); onOpenConsole(); }
    };
    window.addEventListener('keydown', handleKeys);
    return () => window.removeEventListener('keydown', handleKeys);
  }, [onDonate, onLoan, onOpenConsole]);

  return (
    <div className="bg-white border-b border-blue-100 px-6 py-4 flex flex-col md:flex-row items-center justify-between gap-4 sticky top-0 z-30 shadow-sm">
      
      <div className="flex gap-4 w-full md:w-auto">
        <button 
          onClick={onDonate}
          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-[#001B48] hover:bg-[#02457A] text-white px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide shadow-lg shadow-blue-900/20 active:scale-95 transition-all group"
        >
          <HeartHandshake size={20} className="text-blue-300 group-hover:text-white transition-colors" />
          Doar (Alt+D)
        </button>

        <button 
          onClick={onLoan}
          className="flex-1 md:flex-none flex items-center justify-center gap-3 bg-white border-2 border-[#001B48] text-[#001B48] hover:bg-blue-50 px-6 py-3 rounded-xl font-black text-sm uppercase tracking-wide shadow-sm active:scale-95 transition-all group"
        >
          <Share2 size={20} className="text-[#001B48] group-hover:scale-110 transition-transform" />
          Emprestar (Alt+E)
        </button>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto justify-end">
        <button 
          onClick={onCreateTicket}
          className="text-slate-500 hover:text-[#001B48] font-bold text-xs flex items-center gap-2 px-3 py-2 hover:bg-slate-100 rounded-lg transition-colors"
        >
          <Plus size={16} /> Criar Ticket
        </button>
        <div className="h-6 w-px bg-slate-200 hidden md:block"></div>
        <button 
          onClick={onOpenConsole}
          className="flex items-center gap-2 text-slate-600 hover:text-[#001B48] font-bold text-sm bg-slate-50 hover:bg-slate-100 px-4 py-2 rounded-lg border border-slate-200 transition-all"
        >
          <Terminal size={16} />
          Abrir Console (Alt+C)
        </button>
      </div>

    </div>
  );
};

export default HelpdeskActionBar;
