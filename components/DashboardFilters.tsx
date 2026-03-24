
import React from 'react';
import { Warehouse, DashboardFiltersState } from '../types';
import { Filter, Calendar, Search, RefreshCw, Download } from 'lucide-react';
import { CATEGORIES } from '../constants';

interface DashboardFiltersProps {
  warehouses: Warehouse[];
  filters: DashboardFiltersState;
  onFilterChange: (newFilters: DashboardFiltersState) => void;
  onRefresh: () => void;
  onExport: () => void;
  userRole: string;
}

const DashboardFilters: React.FC<DashboardFiltersProps> = ({ 
  warehouses, filters, onFilterChange, onRefresh, onExport, userRole 
}) => {
  
  const handleChange = (field: keyof DashboardFiltersState, value: any) => {
    onFilterChange({ ...filters, [field]: value });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-gray-100 mb-6 flex flex-col md:flex-row gap-4 items-center justify-between animate-fade-in">
      
      <div className="flex flex-wrap items-center gap-3 w-full md:w-auto">
        {/* Período */}
        <div className="flex items-center gap-2 bg-[#F0F5FA] px-3 py-2 rounded-lg border border-gray-200">
          <Calendar size={16} className="text-[#324F85]" />
          <select 
            value={filters.range}
            onChange={(e) => handleChange('range', e.target.value)}
            className="bg-transparent text-sm font-bold text-[#324F85] focus:outline-none cursor-pointer"
          >
            <option value="today">Hoje</option>
            <option value="7d">Últimos 7 dias</option>
            <option value="30d">Últimos 30 dias</option>
            <option value="90d">Últimos 90 dias</option>
            <option value="custom">Personalizado</option>
          </select>
        </div>

        {filters.range === 'custom' && (
          <div className="flex gap-2">
             <input type="date" value={filters.startDate} onChange={e => handleChange('startDate', e.target.value)} className="text-xs p-2 border rounded" />
             <input type="date" value={filters.endDate} onChange={e => handleChange('endDate', e.target.value)} className="text-xs p-2 border rounded" />
          </div>
        )}

        {/* Estoque */}
        <div className="flex items-center gap-2 bg-[#F0F5FA] px-3 py-2 rounded-lg border border-gray-200">
           <Filter size={16} className="text-[#324F85]" />
           <select 
             value={filters.warehouseId}
             disabled={userRole === 'helpdesk'}
             onChange={(e) => handleChange('warehouseId', e.target.value)}
             className="bg-transparent text-sm font-bold text-[#324F85] focus:outline-none cursor-pointer max-w-[150px]"
           >
             <option value="ALL">Todos os Estoques</option>
             {warehouses.filter(w => !w.isArchived).map(w => (
               <option key={w.id} value={w.id}>{w.name}</option>
             ))}
           </select>
        </div>

        {/* Categoria */}
        <div className="flex items-center gap-2 bg-[#F0F5FA] px-3 py-2 rounded-lg border border-gray-200 hidden lg:flex">
           <select 
             value={filters.category}
             onChange={(e) => handleChange('category', e.target.value)}
             className="bg-transparent text-sm font-medium text-[#324F85] focus:outline-none cursor-pointer"
           >
             <option value="ALL">Todas Categorias</option>
             {CATEGORIES.map(c => (
               <option key={c} value={c}>{c}</option>
             ))}
           </select>
        </div>
      </div>

      <div className="flex items-center gap-3 w-full md:w-auto">
        {/* Busca Global */}
        <div className="relative flex-1 md:w-64">
          <Search size={16} className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
          <input 
            type="text"
            placeholder="Buscar item, ID ou missionário..."
            value={filters.search}
            onChange={(e) => handleChange('search', e.target.value)}
            className="w-full pl-9 pr-4 py-2 border border-gray-200 rounded-lg text-sm focus:ring-2 focus:ring-[#324F85] outline-none"
          />
        </div>

        <button 
          onClick={onRefresh} 
          className="p-2 text-[#324F85] hover:bg-[#F0F5FA] rounded-lg transition-colors"
          title="Atualizar Dados"
        >
          <RefreshCw size={18} />
        </button>

        <button 
          onClick={onExport} 
          className="p-2 text-green-600 hover:bg-green-50 rounded-lg transition-colors border border-green-100"
          title="Exportar CSV da Visão Atual"
        >
          <Download size={18} />
        </button>
      </div>
    </div>
  );
};

export default DashboardFilters;
