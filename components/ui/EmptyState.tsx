
import React from 'react';
import { Search } from 'lucide-react';

interface EmptyStateProps {
  title?: string;
  description?: string;
  icon?: React.ElementType;
}

const EmptyState: React.FC<EmptyStateProps> = ({ 
  title = "Nenhum resultado encontrado", 
  description = "Tente ajustar os filtros ou busque por outro termo.",
  icon: Icon = Search
}) => {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center bg-white rounded-2xl border border-dashed border-slate-200">
      <div className="bg-slate-50 p-4 rounded-full mb-4">
        <Icon className="text-slate-300" size={32} />
      </div>
      <h3 className="text-base font-bold text-slate-700">{title}</h3>
      <p className="text-sm text-slate-400 max-w-xs mt-1">{description}</p>
    </div>
  );
};

export default EmptyState;
