import { memo } from 'react';
import { Card, CardContent, CardHeader } from '@components/ui/card';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { User, Building2, Target } from 'lucide-react';
import SignalBadge from './SignalBadge';
import type { DealWithContact } from '../types/deal';

/*
 * A compact representation of a deal used in the DealsBoard. Displays the deal name, stage,
 * use case, and associated contact (if any). Includes a polished stage selector dropdown
 * positioned in the top-right corner like modern CRM pipelines.
 */
type Props = {
  deal: DealWithContact;
  onClick: () => void;
  onStageChange: (dealId: string, newStage: string) => void;
};

const STAGES = [
  { id: 'new', title: 'New', color: 'bg-gradient-to-r from-sky-400 to-blue-500', dotColor: 'bg-sky-500' },
  { id: 'qualified', title: 'Qualified', color: 'bg-gradient-to-r from-amber-400 to-yellow-500', dotColor: 'bg-amber-500' },
  { id: 'negotiating', title: 'Negotiating', color: 'bg-gradient-to-r from-violet-400 to-purple-500', dotColor: 'bg-violet-500' },
  { id: 'closed_won', title: 'Closed Won', color: 'bg-gradient-to-r from-emerald-400 to-green-500', dotColor: 'bg-emerald-500' },
  { id: 'closed_lost', title: 'Closed Lost', color: 'bg-gradient-to-r from-rose-400 to-pink-500', dotColor: 'bg-rose-500' },
];

function DealCard({ deal, onClick, onStageChange }: Props) {
  const handleStageChange = (newStage: string) => {
    onStageChange(deal.id, newStage);
  };

  const handleCardClick = (e: React.MouseEvent) => {
    // Don't trigger card click if clicking on the select dropdown
    if ((e.target as HTMLElement).closest('[data-stage-selector]')) {
      e.stopPropagation();
      return;
    }
    onClick();
  };

  const currentStage = STAGES.find(s => s.id === deal.stage);

  return (
    <Card 
      onClick={handleCardClick}
      className="group cursor-pointer hover:shadow-xl hover:shadow-indigo-100/50 transition-all duration-300 border-0 bg-white/95 backdrop-blur-sm hover:scale-[1.03] hover:-translate-y-1.5 !overflow-visible shadow-lg"
    >
      <CardHeader className="p-5 pb-3 bg-gradient-to-br from-slate-50/50 to-white rounded-t-xl space-y-3">
        {/* Stage selector as a pill at the top */}
        <div data-stage-selector className="flex justify-start">
          <Select value={deal.stage} onValueChange={handleStageChange}>
            <SelectTrigger 
              className={`h-7 px-3 gap-2 inline-flex items-center rounded-full ${currentStage?.color} text-white border-0 shadow-md hover:shadow-lg transition-all duration-200 w-auto font-semibold text-xs`}
              aria-label="Change deal stage"
            >
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full bg-white/80"></div>
                <span>{currentStage?.title}</span>
              </div>
            </SelectTrigger>

            <SelectContent className="w-[160px] border-2 shadow-xl">
              {STAGES.map((stage) => (
                <SelectItem 
                  key={stage.id} 
                  value={stage.id}
                  className="text-sm py-2.5 px-3 hover:bg-slate-50 focus:bg-slate-100 rounded-lg mx-1 cursor-pointer"
                >
                  <div className="flex items-center gap-3">
                    <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor} shadow-md`}></div>
                    <span className="font-medium">{stage.title}</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {/* Deal Title */}
        <h3 className="text-lg font-bold text-slate-900 leading-tight group-hover:text-indigo-700 transition-colors line-clamp-2">
          {deal.name}
        </h3>
      </CardHeader>
      
      <CardContent className="px-5 pb-5 space-y-3.5">
        {/* Signal indicator badge with AI rationale */}
        <SignalBadge 
          signal={deal.signal} 
          rationale={deal.signal_rationale}
        />

        {/* Use case / description */}
        <div className="flex items-start gap-3 p-3 bg-gradient-to-br from-slate-50 to-blue-50/30 rounded-xl border border-slate-100">
          <Target className="w-4 h-4 text-indigo-500 mt-0.5 shrink-0" />
          <p className="text-sm text-slate-700 leading-relaxed italic line-clamp-2 font-medium">
            {deal.use_case}
          </p>
        </div>

        {/* Contact information */}
        {deal.contact_first_name && (
          <div className="flex items-center gap-3 p-3.5 bg-gradient-to-br from-indigo-50 to-purple-50/50 rounded-xl border border-indigo-100 shadow-sm hover:shadow-md transition-shadow">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-400 to-purple-500 flex items-center justify-center shadow-md">
              <User className="w-5 h-5 text-white" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold text-slate-900 truncate">
                {deal.contact_first_name} {deal.contact_last_name}
              </p>
              {deal.contact_company && (
                <div className="flex items-center gap-1.5 mt-1">
                  <Building2 className="w-3.5 h-3.5 text-indigo-400" />
                  <p className="text-xs text-slate-600 truncate font-medium">
                    {deal.contact_company}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

export default memo(DealCard);