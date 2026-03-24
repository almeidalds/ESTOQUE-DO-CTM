
import React, { useState } from 'react';
import { ReportFilters, ReportRange } from '../../types';
import { Filter, Calendar, Search, RefreshCw } from 'lucide-react';
import * as InventoryService from '../../services/inventoryService';
import { CATEGORIES } from '../../constants';

interface Props {
  filters: ReportFilters;
  onChange: (f: ReportFilters) => void;
  onRefresh: () => void;
  hideCategory?: boolean;
}

const ReportsFilterBar: React.FC<Props> = ({ filters, onChange, onRefresh, hideCategory }) => {
  const warehouses = InventoryService.getWarehouses();

  const handleRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
     onChange({ ...filters, range: e.target.value as ReportRange });
  };

  const handleDateChange = (field: 'startDate' | 'endDate', val: string) => {
    onChange({ ...filters, [field]: val });
  };

  return (
    <div className="bg-white p-4 rounded-xl shadow-sm border border-[#E0ECDE] mb-6 flex flex-col xl:flex-row gap-4 justify-between animate-fade-in">
      <div className="flex flex-wrap gap-3 items-center">
        {/* Date Range */}
        <div className="flex items-center gap-2 bg-[#F5F9F7] px-3 py-2 rounded-lg border border-[#CDE0C9]">
           <Calendar size={16} className="text-[#2C6975]" />
           <select value={filters.range} onChange={handleRangeChange} className="bg-transparent text-sm font-bold text-[#2C6975] outline-none">
             <option value="today">Hoje</option>
             <option value="7d">7 Dias</option>
             <option value="30d">30 Dias</option>
             <option value="90d">90 Dias</option>
             <option value="custom">Personalizado</option>
           </select>
        </div>

        {filters.range === 'custom' && (
           <div className="flex gap-2 items-center">
              <input type="date" className="p-2 border rounded text-xs" value={filters.startDate} onChange={e => handleDateChange('startDate', e.target.value)} />
              <span className="text-gray-400">-</span>
              <input type="date" className="p-2 border rounded text-xs" value={filters.endDate} onChange={e => handleDateChange('endDate', e.target.value)} />
           </div>
        )}

        {/* Warehouse */}
        <div className="flex items-center gap-2 bg-[#F5F9F7] px-3 py-2 rounded-lg border border-[#CDE0C9]">
           <Filter size={16} className="text-[#2C6975]" />
           <select value={filters.warehouseId} onChange={e => onChange({...filters, warehouseId: e.target.value})} className="bg-transparent text-sm font-bold text-[#2C6975] outline-none max-w-[140px]">
             <option value="ALL">Todos Estoques</option>
             {warehouses.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
           </select>
        </div>

        {/* Category */}
        {!hideCategory && (
          <div className="flex items-center gap-2 bg-[#F5F9F7] px-3 py-2 rounded-lg border border-[#CDE0C9]">
             <select value={filters.category} onChange={e => onChange({...filters, category: e.target.value})} className="bg-transparent text-sm font-medium text-[#2C6975] outline-none">
               <option value="ALL">Todas Categorias</option>
               {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
             </select>
          </div>
        )}
      </div>

      <div className="flex gap-3">
         <div className="relative flex-1 xl:w-64">
           <Search size={16} className="absolute left-3 top-2.5 text-[#68B2A0]" />
           <input 
             type="text" 
             placeholder="Buscar item ou ID..." 
             className="w-full pl-9 pr-3 py-2 border rounded-lg text-sm focus:ring-2 focus:ring-[#2C6975] outline-none"
             value={filters.search}
             onChange={e => onChange({...filters, search: e.target.value})}
           />
         </div>
         <button onClick={onRefresh} className="p-2 text-[#68B2A0] bg-[#F5F9F7] rounded-lg hover:bg-gray-200"><RefreshCw size={18}/></button>
      </div>
    </div>
  );
};

export default ReportsFilterBar;
