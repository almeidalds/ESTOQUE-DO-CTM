
import React from 'react';
import { InventoryItem, User } from '../types';
import { MapPin, Box, AlertTriangle, ArrowRight } from 'lucide-react';

interface Props {
  item: InventoryItem;
  user: User;
  onSelect: (item: InventoryItem) => void;
}

const SearchResultCard: React.FC<Props> = ({ item, user, onSelect }) => {
  const isHelpdesk = user.role === 'helpdesk';
  const showPath = !isHelpdesk || item.warehouseId === 'STOCK-HELPDESK';

  // Determine availability status
  const statusColor = item.quantity === 0 ? 'bg-gray-100 text-gray-400' : 
                      item.quantity < item.minLevel ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700';

  return (
    <div 
      onClick={() => onSelect(item)}
      className="bg-white border border-gray-200 rounded-xl p-4 hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group"
    >
      <div className="flex justify-between items-start">
        <div>
          <h4 className="font-bold text-[#324F85] text-lg">{item.name}</h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs font-mono bg-slate-100 px-1.5 py-0.5 rounded text-slate-500">{item.id}</span>
            <span className="text-xs text-slate-400">{item.category}</span>
          </div>
        </div>
        <div className={`text-xs font-bold px-2 py-1 rounded flex items-center gap-1 ${statusColor}`}>
           {item.quantity} {item.unit}
        </div>
      </div>

      {showPath && item.locationPath && (
        <div className="mt-3 pt-3 border-t border-gray-50 flex items-center gap-2 text-sm text-slate-600">
           <MapPin size={16} className="text-orange-500 shrink-0" />
           <span className="truncate font-medium">{item.locationPath}</span>
        </div>
      )}

      {/* Warehouse Indicator (Admin/Manager view) */}
      {!isHelpdesk && (
        <div className="mt-2 flex items-center gap-1 text-[10px] text-slate-400 uppercase font-bold">
           <Box size={12} /> {item.warehouseId}
        </div>
      )}
    </div>
  );
};

export default SearchResultCard;
