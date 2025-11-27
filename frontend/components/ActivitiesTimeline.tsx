import { useState, useEffect } from 'react';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { Clock } from 'lucide-react';
import loadActivitiesAction from '@actions/loadActivities';
import LogActivityDialog from '@components/LogActivityDialog';
import ActivityItem from '@components/ActivityItem';
import type { Activity } from '@types/activity';

/**
 * Timeline component for displaying a list of activities associated with a contact.
 * This component fetches activities via the `loadActivitiesAction` and renders
 * them in a card. Users can log new activities, edit existing ones, and see
 * loading/skeleton states when data is being fetched.
 */
type Props = {
  contactId: string;
  contactName: string;
  externalTriggerOpen?: boolean;
  externalInitialType?: 'note' | 'call' | 'meeting';
  onExternalClose?: () => void;
};

function ActivitiesTimeline({ 
  contactId, 
  contactName,
  externalTriggerOpen,
  externalInitialType,
  onExternalClose
}: Props) {
  console.log('🎯 ActivitiesTimeline rendering with:', { 
    contactId, 
    contactName, 
    externalTriggerOpen, 
    externalInitialType 
  });

  // Whether the log activity dialog is open
  const [isLoggingActivity, setIsLoggingActivity] = useState(false);
  // The activity currently being edited (if any)
  const [editingActivity, setEditingActivity] = useState<Activity | null>(null);

  // Load activities for this contact.  The `useLoadAction` hook comes from
  // Load activities for this contact using a custom hook implementation
  const [activities, setActivities] = useState<Activity[]>([]);
  const [loading, setLoading] = useState(true);

  const refresh = async () => {
    setLoading(true);
    try {
      const result = await loadActivitiesAction({ contactId });
      setActivities(result || []);
    } catch (error) {
      console.error('Failed to load activities:', error);
      setActivities([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  }, [contactId]);
  console.log('ActivitiesTimeline:', { activities, loading });

  // Ensure we always treat activities as an array of Activity objects
  const activityList: Activity[] = Array.isArray(activities) ? activities : [];

  // Handle external trigger
  const dialogOpen = externalTriggerOpen !== undefined ? externalTriggerOpen : isLoggingActivity;

  // Called after a new activity has been logged.  This closes the dialog,
  // clears any editing state and refreshes the activities list.
  const handleActivityLogged = () => {
    setIsLoggingActivity(false);
    setEditingActivity(null);
    if (onExternalClose) {
      onExternalClose();
    }
    refresh();
  };

  // When a user chooses to edit an activity, store the activity and open
  // the logging dialog in edit mode.
  const handleEdit = (activity: Activity) => {
    setEditingActivity(activity);
    setIsLoggingActivity(true);
  };

  // Refresh the activities list when an activity is deleted.  Deleting
  // logic happens inside ActivityItem and calls this prop.
  const handleDelete = () => {
    refresh();
  };

  // Close the log dialog without saving.  Clear editing state.
  const handleDialogClose = () => {
    setIsLoggingActivity(false);
    setEditingActivity(null);
    if (onExternalClose) {
      onExternalClose();
    }
  };

  return (
    <>
      <div className="bg-white rounded-lg border border-slate-200 shadow-sm overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-slate-50 to-slate-100 border-b border-slate-200 px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5 text-slate-600" />
              <h3 className="text-lg font-semibold text-slate-900">Activity Timeline</h3>
            </div>
            <Badge variant="secondary" className="text-xs">{activityList.length}</Badge>
          </div>
        </div>

        {/* Content */}
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : activityList.length === 0 ? (
          <div className="text-center py-12 px-4 text-slate-500">
            <Clock className="w-10 h-10 mx-auto mb-3 text-slate-300" />
            <p className="text-sm font-medium">No activities yet</p>
            <p className="text-xs text-slate-400 mt-1">
              Use the buttons above to log your first activity
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
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
        )}
      </div>
      <LogActivityDialog
        open={dialogOpen}
        onClose={handleDialogClose}
        contactId={contactId}
        contactName={contactName}
        onSuccess={handleActivityLogged}
        editActivity={editingActivity}
        initialType={externalInitialType}
      />
    </>
  );
}

export default ActivitiesTimeline;