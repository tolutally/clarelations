import { memo } from 'react';
import DealCard from './DealCard';
import type { DealWithContact } from '../types/deal';

/*
 * Renders a column in the deals board corresponding to a single stage. Contains a title and a
 * vertical list of DealCard components. When a card is clicked, the onViewDeal callback is
 * invoked with the deal id.
 */
type Props = {
  id: string;
  title: string;
  deals: DealWithContact[];
  onViewDeal: (dealId: string) => void;
  onStageChange: (dealId: string, newStage: string) => void;
};

// Column color themes for each stage - Beautiful pastel colors
const columnThemes: Record<string, { bg: string; header: string; border: string; accent: string; shadow: string }> = {
  new: { 
    bg: 'bg-gradient-to-br from-sky-50/90 via-blue-50/80 to-indigo-50/90', 
    header: 'bg-gradient-to-r from-sky-100 to-blue-100 text-sky-900 border-sky-200/50', 
    border: 'border-sky-200/50',
    accent: 'bg-gradient-to-r from-sky-400 to-blue-500 shadow-sky-200',
    shadow: 'shadow-sky-100/50'
  },
  qualified: { 
    bg: 'bg-gradient-to-br from-amber-50/90 via-yellow-50/80 to-orange-50/90', 
    header: 'bg-gradient-to-r from-amber-100 to-yellow-100 text-amber-900 border-amber-200/50', 
    border: 'border-amber-200/50',
    accent: 'bg-gradient-to-r from-amber-400 to-yellow-500 shadow-amber-200',
    shadow: 'shadow-amber-100/50'
  },
  negotiating: { 
    bg: 'bg-gradient-to-br from-violet-50/90 via-purple-50/80 to-fuchsia-50/90', 
    header: 'bg-gradient-to-r from-violet-100 to-purple-100 text-violet-900 border-violet-200/50', 
    border: 'border-violet-200/50',
    accent: 'bg-gradient-to-r from-violet-400 to-purple-500 shadow-violet-200',
    shadow: 'shadow-violet-100/50'
  },
  closed_won: { 
    bg: 'bg-gradient-to-br from-emerald-50/90 via-green-50/80 to-teal-50/90', 
    header: 'bg-gradient-to-r from-emerald-100 to-green-100 text-emerald-900 border-emerald-200/50', 
    border: 'border-emerald-200/50',
    accent: 'bg-gradient-to-r from-emerald-400 to-green-500 shadow-emerald-200',
    shadow: 'shadow-emerald-100/50'
  },
  closed_lost: { 
    bg: 'bg-gradient-to-br from-rose-50/90 via-pink-50/80 to-red-50/90', 
    header: 'bg-gradient-to-r from-rose-100 to-pink-100 text-rose-900 border-rose-200/50', 
    border: 'border-rose-200/50',
    accent: 'bg-gradient-to-r from-rose-400 to-pink-500 shadow-rose-200',
    shadow: 'shadow-rose-100/50'
  },
};

function DealColumn({ id, title, deals, onViewDeal, onStageChange }: Props) {
  const theme = columnThemes[id] || columnThemes.new;
  
  return (
    <div className={`flex min-h-[500px] flex-col rounded-2xl border ${theme.border} ${theme.bg} backdrop-blur-sm shadow-lg ${theme.shadow} transition-all duration-300 hover:shadow-xl`}>
      {/* Column Header */}
      <div className={`flex items-center justify-between px-5 py-4 rounded-t-2xl border-b ${theme.header} shadow-sm`}>
        <div className="flex items-center gap-3">
          <div className={`w-2.5 h-2.5 rounded-full ${theme.accent} shadow-lg animate-pulse`}></div>
          <h3 className="text-sm font-bold uppercase tracking-wider">
            {title}
          </h3>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-full bg-white/90 shadow-md border border-white/50 backdrop-blur-sm">
            {deals.length}
          </span>
        </div>
      </div>

      {/* Column Content */}
      <div className="flex-1 p-4 space-y-3 overflow-y-auto">
        {deals.length > 0 ? (
          deals.map((deal) => (
            <DealCard 
              key={deal.id} 
              deal={deal} 
              onClick={() => onViewDeal(deal.id)}
              onStageChange={onStageChange}
            />
          ))
        ) : (
          <div className="flex flex-col items-center justify-center flex-1 text-slate-400 py-12">
            <div className="w-16 h-16 rounded-2xl bg-white/70 backdrop-blur-sm flex items-center justify-center mb-4 shadow-lg border border-white/50">
              <div className="w-8 h-8 rounded-xl bg-slate-200/50"></div>
            </div>
            <p className="text-sm font-semibold text-slate-500">No deals yet</p>
            <p className="text-xs text-slate-400 mt-1">Drag deals here or create new ones</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default memo(DealColumn);