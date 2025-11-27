import { useLoadAction } from '../lib/quibakery-data';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { ArrowLeft, Trash2 } from 'lucide-react';
import { useState } from 'react';
import loadDealByIdAction from '@actions/loadDealById';
import deleteDealAction from '@actions/deleteDeal';
import DealActivitiesTimeline from './DealActivitiesTimeline';
import AttachmentList from './AttachmentList';
import type { DealWithContact } from '../types/deal';
import { format } from 'date-fns';

type Props = {
  dealId: string;
  onBack: () => void;
  onViewContact?: (contactId: string) => void;
};

/**
 * Displays the details of a single deal, including the associated contact and recent activities. If
 * the deal is not found a simple message is shown. Editing of the deal is not included in this
 * simplified version but could be added with a DealForm similar to ContactForm.
 */
export default function DealDetails({ dealId, onBack, onViewContact }: Props) {
  const { data: deals = [], loading } = useLoadAction(loadDealByIdAction, [dealId], { dealId: dealId });
  const deal: DealWithContact | undefined = deals && deals[0] ? (deals[0] as DealWithContact) : undefined;
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    if (!confirm('Are you sure you want to delete this deal? This action cannot be undone.')) {
      return;
    }

    setIsDeleting(true);
    try {
      await deleteDealAction({ dealId });
      console.log('Deal deleted successfully');
      onBack(); // Navigate back after successful deletion
    } catch (error) {
      console.error('Failed to delete deal:', error);
      alert('Failed to delete deal. Please try again.');
      setIsDeleting(false);
    }
  };

  if (loading) {
    return (
      <div className="w-full p-8 pt-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-blue-100 text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          <Skeleton className="h-96 lg:col-span-1" />
          <Skeleton className="h-96 lg:col-span-2" />
        </div>
      </div>
    );
  }

  if (!deal) {
    return (
      <div className="w-full p-8 pt-24">
        <Button
          variant="ghost"
          onClick={onBack}
          className="mb-6 hover:bg-blue-100 text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
        <Card className="shadow-xl border-0 bg-white">
          <CardContent className="p-12 text-center">
            <p className="text-slate-500">Deal not found</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="w-full p-8 pt-24">
      <div className="flex items-center justify-between mb-6">
        <Button
          variant="ghost"
          onClick={onBack}
          className="hover:bg-blue-100 text-blue-700 font-medium"
        >
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to Deals
        </Button>
        
        <Button
          variant="outline"
          onClick={handleDelete}
          disabled={isDeleting}
          className="text-red-600 border-red-300 hover:bg-red-50 hover:text-red-700 hover:border-red-400"
        >
          <Trash2 className="w-4 h-4 mr-2" />
          {isDeleting ? 'Deleting...' : 'Delete Deal'}
        </Button>
      </div>
      
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Deal info */}
        <div className="lg:col-span-1">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-2xl text-slate-900">{deal.name}</CardTitle>
            </CardHeader>
            <CardContent className="p-6 space-y-4">
              <div>
                <span className="font-medium text-slate-700">Use Case: </span>
                <span className="text-slate-600">{deal.use_case}</span>
              </div>
              <div>
                <span className="font-medium text-slate-700">Stage: </span>
                <Badge variant="secondary" className="capitalize">
                  {deal.stage.replace('_', ' ')}
                </Badge>
              </div>
              <div>
                <span className="font-medium text-slate-700">Signal: </span>
                <Badge className={
                  deal.signal === 'positive' ? 'bg-green-100 text-green-800' :
                  deal.signal === 'negative' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }>
                  {deal.signal === 'positive' && '🟢 '}
                  {deal.signal === 'neutral' && '🟡 '}
                  {deal.signal === 'negative' && '🔴 '}
                  {deal.signal}
                </Badge>
              </div>
              {deal.description && (
                <div>
                  <span className="font-medium text-slate-700">Description: </span>
                  <p className="text-slate-600 whitespace-pre-line mt-1">{deal.description}</p>
                </div>
              )}
              {deal.contact_id && (
                <div>
                  <span className="font-medium text-slate-700">Contact: </span>
                  <button
                    onClick={() => onViewContact?.(deal.contact_id!)}
                    className="text-blue-600 hover:text-blue-800 hover:underline cursor-pointer"
                  >
                    {deal.contact_first_name} {deal.contact_last_name}
                  </button>
                </div>
              )}
              <div className="pt-2 border-t border-gray-100">
                <span className="text-xs text-gray-500">
                  Created {format(new Date(deal.created_at), 'PP')}
                </span>
              </div>
              
              {/* Attachments */}
              {deal.attachments && deal.attachments.length > 0 && (
                <div className="pt-4 border-t border-gray-100">
                  <AttachmentList attachments={deal.attachments} />
                </div>
              )}
            </CardContent>
          </Card>
        </div>
        {/* Activities timeline */}
        <div className="lg:col-span-2">
          <Card className="shadow-xl border-0 bg-white">
            <CardHeader className="bg-white border-b border-slate-200">
              <CardTitle className="text-lg text-slate-900">Activities</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <DealActivitiesTimeline
                dealId={dealId}
                contactId={deal.contact_id || ''}
                dealTitle={deal.name}
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}