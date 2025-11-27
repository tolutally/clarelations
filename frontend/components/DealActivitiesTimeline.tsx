import { useState } from 'react';
import { useLoadAction } from '../lib/quibakery-data';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { Clock, Plus } from 'lucide-react';
import loadDealActivitiesAction from '@actions/loadDealActivities';
import LogActivityDialog from '@components/LogActivityDialog';
import ActivityItem from '@components/ActivityItem';
import type { Activity } from '../types/activity';

/**
 * Timeline component for displaying activities associated with a deal.  This
 * component largely mirrors `ActivitiesTimeline` but passes deal‑specific
 * identifiers into the log activity dialog and uses the
 * `loadDealActivitiesAction` to fetch activities for a given deal.
 */
type Props = {
  dealId: string;
  contactId: string;
  dealTitle: string;
};

function DealActivitiesTimeline({ dealId, contactId, dealTitle }: Props) {
  // Track whether the log dialog is open
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  // Track the activity currently being edited
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Load activities for this deal
  const { data: activities, loading, refresh } =
    useLoadAction(loadDealActivitiesAction, [dealId], {
      dealId: dealId,
    });

  const activityList: Activity[] = Array.isArray(activities) ? (activities as Activity[]) : [];

  const handleActivityLogged = () => {
    setIsLoggingActivity(false);
    setEditingActivity(null);
    refresh();
  };

  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsLoggingActivity(true);
  };

  const handleDelete = () => {
    refresh();
  };

  const handleDialogClose = () => {
    setIsLoggingActivity(false);
    setEditingActivity(null);
  };

  return (
    <>
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-white border-b border-slate-200">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Clock className="w-6 h-6 text-slate-700" />
              <CardTitle className="text-2xl font-semibold text-slate-900">
                Activity Timeline
              </CardTitle>
            </div>
            <Badge variant="secondary">{activityList.length}</Badge>
          </div>
          <Button onClick={() => setIsLoggingActivity(true)} size="sm">
            <Plus className="w-4 h-4 mr-2" />
            Log Activity
          </Button>
        </CardHeader>
        <CardContent className="p-6">
          {loading ? (
            <div className="space-y-4">
              {[...Array(3)].map((_, i) => (
                <Skeleton key={i} className="h-24 w-full" />
              ))}
            </div>
          ) : activityList.length === 0 ? (
            <div className="text-center py-12 text-slate-500">
              <Clock className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No activities yet</p>
              <p className="text-sm">
                Log an activity to start tracking interactions
              </p>
            </div>
          ) : (
            <div className="relative">
              <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-blue-300 via-indigo-300 to-purple-300" />
              <div className="space-y-6">
                {activityList.map((activity, index) => (
                  <ActivityItem
                    key={activity.id}
                    activity={activity}
                    isLast={index === activityList.length - 1}
                    onEdit={handleEdit}
                    onDelete={handleDelete}
                  />
                ))}
              </div>
            </div>
          )}
        </CardContent>
      </Card>
      <LogActivityDialog
        open={isLoggingActivity}
        onClose={handleDialogClose}
        contactId={contactId}
        dealId={dealId}
        contactName={dealTitle}
        onSuccess={handleActivityLogged}
        editActivity={editingActivity || undefined}
      />
    </>
  );
}

export default DealActivitiesTimeline;