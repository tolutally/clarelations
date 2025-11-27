import React, { useState, useEffect, useRef, useMemo } from 'react';
import { 
  MoreHorizontal, 
  Check, 
  TrendingUp, 
  Minus, 
  Plus, 
  Search, 
  Layers, 
  Kanban, 
  Loader2 
} from 'lucide-react';
import { useMutateAction } from '../lib/quibakery-data';
import updateDealStageAction from '../actions/updateDealStage';
import type { DealWithContact } from '../types/deal';

// Types
type Stage = 'new' | 'qualified' | 'negotiating' | 'closed_won' | 'closed_lost';

interface StageConfig {
  id: Stage;
  label: string;
  color: string;
}

interface DealsBoardProps {
  deals: DealWithContact[];
  onDealUpdated: () => void;
  onViewDeal: (dealId: string) => void;
}

// Constants
const STAGES: StageConfig[] = [
  { id: 'new', label: 'Cold', color: 'bg-blue-50 text-blue-700 border-blue-200 ring-blue-500/20' },
  { id: 'qualified', label: 'Qualified', color: 'bg-amber-50 text-amber-700 border-amber-200 ring-amber-500/20' },
  { id: 'negotiating', label: 'Negotiating', color: 'bg-orange-50 text-orange-700 border-orange-200 ring-orange-500/20' },
  { id: 'closed_won', label: 'Closed Won', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 ring-emerald-500/20' },
  { id: 'closed_lost', label: 'Closed Lost', color: 'bg-rose-50 text-rose-700 border-rose-200 ring-rose-500/20' },
];

// Components
const Badge: React.FC<{ children: React.ReactNode; className?: string }> = ({ 
  children, 
  className = '' 
}) => (
  <span className={`inline-flex items-center px-2 py-0.5 rounded-md text-xs font-medium ring-1 ring-inset ${className}`}>
    {children}
  </span>
);

const Currency: React.FC<{ value?: number | null }> = ({ value }) => {
  if (value === undefined || value === null) return null;
  return (
    <span className="text-slate-600 font-medium text-xs tracking-tight">
      {new Intl.NumberFormat('en-US', { 
        style: 'currency', 
        currency: 'USD', 
        maximumFractionDigits: 0 
      }).format(value)}
    </span>
  );
};

// Custom Dropdown for Stage Selection
const StageDropdown: React.FC<{
  currentStage: Stage;
  onSelect: (stage: Stage) => void;
}> = ({ currentStage, onSelect }) => {
  const [isOpen, setIsOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (ref.current && !ref.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  return (
    <div className="relative" ref={ref}>
      <button
        onClick={(e) => { 
          e.stopPropagation(); 
          setIsOpen(!isOpen); 
        }}
        className="p-1 rounded-md hover:bg-slate-100 text-slate-400 hover:text-slate-700 transition-colors focus:outline-none focus:ring-2 focus:ring-slate-200"
        aria-label="Change stage"
        title="Change stage"
      >
        <MoreHorizontal size={16} />
      </button>

      {isOpen && (
        <div className="absolute right-0 top-full mt-1 w-40 z-50 bg-white border border-slate-200 rounded-lg shadow-lg py-1 animate-in fade-in-0 duration-200">
          {STAGES.map((stage) => (
            <button
              key={stage.id}
              onClick={(e) => {
                e.stopPropagation();
                onSelect(stage.id);
                setIsOpen(false);
              }}
              className={`w-full text-left px-3 py-2 text-xs font-medium flex items-center gap-2 hover:bg-slate-50 transition-colors ${
                currentStage === stage.id ? 'text-slate-900 bg-slate-50' : 'text-slate-600'
              }`}
            >
              <span className={`w-2 h-2 rounded-full ${stage.color.split(' ')[0]}`}></span>
              {stage.label}
              {currentStage === stage.id && <span className="ml-auto"><Check size={12} /></span>}
            </button>
          ))}
        </div>
      )}
    </div>
  );
};

const DealCard: React.FC<{
  deal: DealWithContact;
  onStageChange: (dealId: string, newStage: Stage) => void;
  onOpen: (dealId: string) => void;
}> = ({ deal, onStageChange, onOpen }) => {
  const stageConfig = STAGES.find(s => s.id === deal.stage);
  
  return (
    <div 
      onClick={() => onOpen(deal.id)}
      className="group relative bg-white p-3 rounded-lg border border-slate-200 shadow-sm hover:shadow-md hover:border-slate-300 transition-all cursor-pointer mb-3"
    >
      <div className="flex justify-between items-start mb-2">
        <h3 className="text-sm font-medium text-slate-900 leading-tight pr-6">
          {deal.name || deal.title}
        </h3>
        <div className="absolute top-3 right-2">
          <StageDropdown 
            currentStage={deal.stage as Stage} 
            onSelect={(newStage) => onStageChange(deal.id, newStage)} 
          />
        </div>
      </div>

      <div className="flex items-center gap-2 mb-3">
        <Currency value={deal.amount} />
      </div>

      <div className="flex justify-between items-end border-t border-slate-50 pt-2 mt-2">
        <div className="flex items-center gap-2 text-slate-500">
          <div className="w-5 h-5 rounded-full bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 border border-slate-200">
            {(deal.contact_first_name || deal.contact_last_name || 'U').charAt(0)}
          </div>
          <span className="text-xs truncate max-w-[100px]">
            {deal.contact_company || `${deal.contact_first_name} ${deal.contact_last_name}`.trim() || 'Unknown'}
          </span>
        </div>
        {deal.signal && (
          <div title={`Signal: ${deal.signal}`}>
            {deal.signal === 'positive' ? (
              <TrendingUp className="text-emerald-500" size={14} />
            ) : (
              <Minus className="text-slate-400" size={14} />
            )}
          </div>
        )}
      </div>
      
      {/* Visual indicator of stage on card for quick scanning */}
      <div className={`absolute left-0 top-3 bottom-3 w-0.5 rounded-r ${stageConfig?.color.split(' ')[0]}`}></div>
    </div>
  );
};

const DealColumn: React.FC<{
  stage: StageConfig;
  deals: DealWithContact[];
  onStageChange: (dealId: string, newStage: Stage) => void;
  onOpen: (dealId: string) => void;
}> = ({ stage, deals, onStageChange, onOpen }) => {
  const totalAmount = deals.reduce((sum, d) => sum + (d.amount || 0), 0);
  
  return (
    <div className="flex-shrink-0 w-80 h-full flex flex-col bg-slate-50/50 border-r border-slate-100 last:border-r-0">
      <div className="sticky top-0 z-10 p-3 bg-slate-50/95 backdrop-blur-sm border-b border-slate-200/60 flex justify-between items-center group">
        <div className="flex items-center gap-2">
          <Badge className={`${stage.color} bg-opacity-50`}>
            {stage.label}
          </Badge>
          <span className="text-xs font-medium text-slate-400">{deals.length}</span>
        </div>
        <div className="opacity-0 group-hover:opacity-100 transition-opacity">
          <Plus size={14} className="text-slate-400 hover:text-slate-700 cursor-pointer" />
        </div>
      </div>
      
      <div className="p-2 overflow-y-auto flex-1 scrollbar-hide">
        <div className="text-[10px] font-medium text-slate-400 mb-2 px-1 uppercase tracking-wider flex justify-between">
          <span>Total</span>
          <span>
            {new Intl.NumberFormat('en-US', { 
              style: 'currency', 
              currency: 'USD', 
              notation: 'compact' 
            }).format(totalAmount)}
          </span>
        </div>
        {deals.map(deal => (
          <DealCard 
            key={deal.id} 
            deal={deal} 
            onStageChange={onStageChange}
            onOpen={onOpen}
          />
        ))}
        {deals.length === 0 && (
          <div className="h-24 flex items-center justify-center border border-dashed border-slate-200 rounded-lg m-1">
            <span className="text-xs text-slate-400">No deals</span>
          </div>
        )}
        <div className="h-8"></div> {/* Bottom spacer */}
      </div>
    </div>
  );
};

const Header: React.FC<{
  searchTerm: string;
  onSearch: (term: string) => void;
}> = ({ searchTerm, onSearch }) => (
  <header className="h-14 border-b border-slate-200 bg-white flex items-center justify-between px-4 flex-shrink-0 z-20">
    <div className="flex items-center gap-4">
      <div className="w-8 h-8 bg-black rounded-lg flex items-center justify-center text-white">
        <Layers size={18} className="text-white" />
      </div>
      <h1 className="text-sm font-semibold text-slate-900 tracking-tight">Pipeline</h1>
      <div className="h-4 w-px bg-slate-200 mx-2"></div>
      <div className="flex items-center gap-1 text-slate-500 text-xs font-medium bg-slate-100 px-2 py-1 rounded">
        <Kanban size={12} />
        <span>Board</span>
      </div>
    </div>

    <div className="flex items-center gap-3">
      <div className="relative group">
        <Search 
          size={14} 
          className="absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400 group-focus-within:text-slate-600" 
        />
        <input 
          type="text" 
          placeholder="Filter deals..." 
          value={searchTerm}
          onChange={(e) => onSearch(e.target.value)}
          className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md w-48 focus:outline-none focus:ring-1 focus:ring-slate-300 focus:bg-white transition-all placeholder:text-slate-400"
        />
      </div>
      <button className="bg-slate-900 hover:bg-slate-800 text-white text-xs font-medium px-3 py-1.5 rounded-md shadow-sm transition-colors flex items-center gap-1.5">
        <Plus size={14} />
        <span>New Deal</span>
      </button>
      <div className="w-7 h-7 bg-slate-100 rounded-full border border-slate-200 flex items-center justify-center text-xs font-medium text-slate-600">
        JD
      </div>
    </div>
  </header>
);

// Main Component
const DealsBoard: React.FC<DealsBoardProps> = ({ deals, onDealUpdated, onViewDeal }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [updateDealStage, { isLoading: isUpdating }] = useMutateAction(updateDealStageAction);

  const handleStageChange = async (dealId: string, newStage: Stage) => {
    try {
      await updateDealStage({ dealId, stage: newStage });
      onDealUpdated();
      console.log(`Updated deal ${dealId} to stage ${newStage}`);
    } catch (error) {
      console.error('Error updating deal stage:', error);
    }
  };

  const handleOpenDeal = (dealId: string) => {
    onViewDeal(dealId);
  };

  const filteredDeals = useMemo(() => {
    if (!searchTerm) return deals;
    const lower = searchTerm.toLowerCase();
    return deals.filter(d => 
      (d.name || d.title || '').toLowerCase().includes(lower) || 
      (d.contact_first_name || '').toLowerCase().includes(lower) ||
      (d.contact_last_name || '').toLowerCase().includes(lower) ||
      (d.contact_company || '').toLowerCase().includes(lower)
    );
  }, [deals, searchTerm]);

  return (
    <div className="h-full flex flex-col bg-white">
      <Header searchTerm={searchTerm} onSearch={setSearchTerm} />
      <main className="flex-1 overflow-x-auto overflow-y-hidden bg-slate-50/30">
        <div className="h-full inline-flex min-w-full divide-x divide-slate-200">
          {STAGES.map(stage => (
            <DealColumn 
              key={stage.id}
              stage={stage}
              deals={filteredDeals.filter(d => d.stage === stage.id)}
              onStageChange={handleStageChange}
              onOpen={handleOpenDeal}
            />
          ))}
        </div>
      </main>
      <style jsx>{`
        .scrollbar-hide::-webkit-scrollbar { 
          display: none; 
        }
        .scrollbar-hide { 
          -ms-overflow-style: none; 
          scrollbar-width: none; 
        }
      `}</style>
    </div>
  );
};

export default DealsBoard;