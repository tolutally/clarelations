import { useState } from 'react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import {
  Phone,
  Mail,
  Calendar,
  FileText,
  MessageSquare,
  UserCheck,
  Edit2,
  Trash2,
} from 'lucide-react';
import { Activity } from '../types/activity';
import { format } from 'date-fns';
import deleteActivityAction from '@actions/deleteActivity';

/**
 * Render a single activity entry in a timeline.  Shows the activity
 * type, title, date, optional description and author, and provides
 * buttons to edit or delete the entry.  Deletion uses the
 * `deleteActivityAction` mutation from UI Bakery.
 */
type Props = {
  activity: Activity;
  isLast: boolean;
  onEdit: (activity: Activity) => void;
  onDelete: () => void;
};

// Map activity types to icon components
const activityIcons: Record<string, React.ElementType> = {
  call: Phone,
  email: Mail,
  meeting: Calendar,
  note: FileText,
  message: MessageSquare,
  default: UserCheck,
};

// Map activity types to coloured badge classes
const activityColors: Record<string, string> = {
  call: 'bg-gradient-to-br from-green-100 to-emerald-100 text-green-700 border-green-300 shadow-sm',
  email: 'bg-gradient-to-br from-blue-100 to-cyan-100 text-blue-700 border-blue-300 shadow-sm',
  meeting: 'bg-gradient-to-br from-purple-100 to-violet-100 text-purple-700 border-purple-300 shadow-sm',
  note: 'bg-gradient-to-br from-amber-100 to-yellow-100 text-amber-700 border-amber-300 shadow-sm',
  message: 'bg-gradient-to-br from-pink-100 to-rose-100 text-pink-700 border-pink-300 shadow-sm',
  default: 'bg-gradient-to-br from-slate-100 to-gray-100 text-slate-700 border-slate-300 shadow-sm',
};

function ActivityItem({ activity, isLast, onEdit, onDelete }: Props) {
  const [isDeleting, setIsDeleting] = useState(false);
  const [showFullTranscript, setShowFullTranscript] = useState(false);

  // Choose the appropriate icon and colour based on the activity type
  const IconComponent =
    activityIcons[activity.type as keyof typeof activityIcons] || activityIcons.default;
  const colorClass =
    activityColors[activity.type as keyof typeof activityColors] || activityColors.default;

  // Prompt for confirmation before deleting and call the mutation
  const handleDelete = async () => {
    if (confirm('Are you sure you want to delete this activity?')) {
      setIsDeleting(true);
      try {
        await deleteActivityAction({ id: activity.id.toString() });
        onDelete();
      } catch (error) {
        console.error('Failed to delete activity:', error);
        alert('Failed to delete activity. Please try again.');
      } finally {
        setIsDeleting(false);
      }
    }
  };

  return (
    <div className="flex items-center gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
      {/* Icon */}
      <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center shrink-0 ${colorClass}`}>
        <IconComponent className="w-4 h-4" />
      </div>

      {/* Content */}
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <h3 className="font-medium text-sm text-slate-900 truncate">{activity.title}</h3>
          <Badge
            variant="outline"
            className={`text-[10px] px-1.5 py-0.5 shrink-0 font-medium ${
              activity.type === 'call'
                ? 'border-green-300 text-green-700 bg-green-50'
                : activity.type === 'email'
                ? 'border-blue-300 text-blue-700 bg-blue-50'
                : activity.type === 'meeting'
                ? 'border-purple-300 text-purple-700 bg-purple-50'
                : activity.type === 'note'
                ? 'border-amber-300 text-amber-700 bg-amber-50'
                : activity.type === 'message'
                ? 'border-pink-300 text-pink-700 bg-pink-50'
                : 'border-slate-300 text-slate-700 bg-slate-50'
            }`}
          >
            {activity.type}
          </Badge>
        </div>
        {activity.description && (
          <p className="text-xs text-slate-600 mb-1 line-clamp-2">
            {activity.description}
          </p>
        )}
        
        {/* Transcript Summary */}
        {activity.transcript_summary && (
          <div className="mt-2 p-2 bg-indigo-50 border border-indigo-200 rounded-md">
            <p className="text-xs text-indigo-900 leading-relaxed">
              <strong className="font-semibold">Summary:</strong> {activity.transcript_summary}
            </p>
            {activity.transcript && (
              <button
                onClick={() => setShowFullTranscript(!showFullTranscript)}
                className="text-[11px] text-indigo-600 hover:text-indigo-800 font-medium mt-1 inline-flex items-center gap-1"
              >
                {showFullTranscript ? '▼ Hide' : '▶ View Full Transcript'}
              </button>
            )}
          </div>
        )}

        {/* Full Transcript (Expandable) */}
        {showFullTranscript && activity.transcript && (
          <div className="mt-2 p-3 bg-slate-50 border border-slate-200 rounded-md max-h-[400px] overflow-y-auto">
            <p className="text-xs text-slate-700 leading-relaxed whitespace-pre-wrap">
              {activity.transcript}
            </p>
          </div>
        )}
        
        <p className="text-[11px] text-slate-400 mt-1">
          {format(new Date(activity.created_at), 'MMM d, yyyy • h:mm a')}
        </p>
      </div>

      {/* Actions */}
      <div className="flex items-center gap-1 shrink-0">
        <Button
          variant="ghost"
          size="sm"
          onClick={() => onEdit(activity)}
          className="h-9 w-9 p-0 text-slate-500 hover:text-indigo-600 hover:bg-indigo-50"
        >
          <Edit2 className="w-4 h-4" />
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={handleDelete}
          disabled={isDeleting}
          className="h-9 w-9 p-0 text-slate-500 hover:text-red-600 hover:bg-red-50"
        >
          <Trash2 className="w-4 h-4" />
        </Button>
      </div>
    </div>
  );
}

export default ActivityItem;