import { useEffect, useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from '@components/ui/dialog';
import {
  Form,
  FormField,
  FormItem,
  FormLabel,
  FormControl,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import createActivityAction from '@actions/createActivity';
import updateActivityAction from '@actions/updateActivity';
import { Activity } from '../types/activity';
import { FieldValues } from 'react-hook-form';

/*
 * Schema for creating or editing an activity. Requires type and title; description is optional
 * and activityDate is required. Accepts date strings (ISO) for activityDate.
 * Transcript and transcript_summary are optional and only relevant for calls/meetings.
 */
const activitySchema = z.object({
  type: z.string().min(1, { message: 'Type is required' }),
  title: z.string().min(1, { message: 'Title is required' }),
  description: z.string().optional(),
  transcript: z.string().optional(),
  transcript_summary: z.string().optional(),
  activityDate: z.string().min(1, { message: 'Date and time is required' }),
});

export type ActivityFormData = z.infer<typeof activitySchema>;

type Props = {
  open: boolean;
  onClose: () => void;
  contactId?: string;
  dealId?: string;
  contactName?: string;
  dealTitle?: string;
  onSuccess: () => void;
  editActivity?: Activity;
  initialType?: 'note' | 'call' | 'meeting';
};

/**
 * A modal dialog for logging a new activity or editing an existing one. It supports linking
 * activities either to a contact or to a deal via contactId or dealId. When editActivity is
 * provided the form fields are populated and the updateActivity action is used instead of
 * createActivity. On successful submission, onSuccess is called and the dialog is closed.
 */
export default function LogActivityDialog({
  open,
  onClose,
  contactId,
  dealId,
  contactName,
  dealTitle,
  onSuccess,
  editActivity,
  initialType,
}: Props) {
  const form = useForm<ActivityFormData>({
    resolver: zodResolver(activitySchema),
    defaultValues: {
      type: editActivity?.type || initialType || '',
      title: editActivity?.title || '',
      description: editActivity?.description || '',
      transcript: editActivity?.transcript || '',
      transcript_summary: editActivity?.transcript_summary || '',
      activityDate: editActivity?.created_at
        ? new Date(editActivity.created_at).toISOString().slice(0, 16)
        : new Date().toISOString().slice(0, 16),
    },
  });
  const { control, handleSubmit, reset, watch } = form;
  const [isSubmitting, setIsSubmitting] = useState(false);
  const selectedType = watch('type');

  useEffect(() => {
    // Reset form when dialog opens or editActivity changes
    reset({
      type: editActivity?.type || '',
      title: editActivity?.title || '',
      description: editActivity?.description || '',
      transcript: editActivity?.transcript || '',
      transcript_summary: editActivity?.transcript_summary || '',
      activityDate: editActivity?.created_at
        ? new Date(editActivity.created_at).toISOString().slice(0, 16)
        : '',
    });
  }, [open, editActivity, reset]);

  const onSubmit = async (data: ActivityFormData) => {
    console.log('🚀 Form submitted, preventing default and starting submission');
    setIsSubmitting(true);
    try {
      console.log('🚀 Submitting activity:', {
        editActivity,
        data,
        contactId,
        dealId
      });

      // Convert date string to ISO; forms return local date/time strings (YYYY-MM-DDTHH:MM)
      const isoDate = new Date(data.activityDate).toISOString();
      
      let result;
      if (editActivity) {
        console.log('📝 Updating activity...');
        result = await updateActivityAction({
          id: editActivity.id,
          type: data.type,
          title: data.title,
          description: data.description,
          transcript: data.transcript,
          transcript_summary: data.transcript_summary,
          created_at: isoDate,
        });
      } else {
        console.log('➕ Creating new activity...');
        result = await createActivityAction({
          contact_id: contactId || null,
          deal_id: dealId || null,
          type: data.type,
          title: data.title,
          description: data.description,
          transcript: data.transcript,
          transcript_summary: data.transcript_summary,
          created_at: isoDate,
        });
      }
      
      console.log('✅ Activity saved successfully:', result);
      onSuccess();
      onClose();
    } catch (error) {
      console.error('❌ Failed to save activity:', error);
      // Show error to user instead of just console.log
      alert(`Failed to save activity: ${error instanceof Error ? error.message : 'Unknown error'}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={(v: boolean) => !v && onClose()}>
      <DialogContent className="sm:max-w-lg max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>{editActivity ? 'Edit Activity' : 'Log Activity'}</DialogTitle>
          <DialogDescription>
            {editActivity
              ? 'Update the details of this activity.'
              : `Log an activity for ${contactName || dealTitle}`}
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 pt-4">
          {/* Type */}
          <FormField
            control={control}
            name="type"
              render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Type</FormLabel>
                  <FormControl>
                    <Select
                      value={field.value}
                      onValueChange={(value: string) => field.onChange(value)}
                    >
                      <SelectTrigger id="type">
                        <SelectValue placeholder="Select type" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="call">Call</SelectItem>
                        <SelectItem value="meeting">Meeting</SelectItem>
                        <SelectItem value="note">Note</SelectItem>
                      </SelectContent>
                    </Select>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Title */}
            <FormField
              control={control}
              name="title"
              render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Title</FormLabel>
                  <FormControl>
                    <Input placeholder="Activity title" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Description */}
            <FormField
              control={control}
              name="description"
              render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Description</FormLabel>
                  <FormControl>
                    <Textarea placeholder="Optional notes" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Transcript - Only show for calls and meetings */}
            {(selectedType === 'call' || selectedType === 'meeting') && (
              <>
                <FormField
                  control={control}
                  name="transcript"
                  render={({ field }: { field: FieldValues }) => (
                    <FormItem>
                      <FormLabel>Call Transcript (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Paste the full transcript here. This will be used by AI to provide insights..." 
                          className="min-h-[120px] max-h-[300px] resize-y" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500 mt-1">
                        Full transcript for AI analysis. This can be very long.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
                
                <FormField
                  control={control}
                  name="transcript_summary"
                  render={({ field }: { field: FieldValues }) => (
                    <FormItem>
                      <FormLabel>Transcript Summary (Optional)</FormLabel>
                      <FormControl>
                        <Textarea 
                          placeholder="Brief summary of the key points..." 
                          className="min-h-[80px]" 
                          {...field} 
                        />
                      </FormControl>
                      <p className="text-xs text-slate-500 mt-1">
                        A brief summary shown in the timeline. Future: AI will generate this automatically.
                      </p>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </>
            )}

            {/* Date/time */}
            <FormField
              control={control}
              name="activityDate"
              render={({ field }: { field: FieldValues }) => (
                <FormItem>
                  <FormLabel>Date &amp; Time</FormLabel>
                  <FormControl>
                    <Input type="datetime-local" {...field} />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
            {/* Buttons */}
            <div className="flex gap-2 pt-4">
              <Button type="submit" disabled={isSubmitting} className="flex-1">
                {editActivity ? 'Save' : 'Log'}
              </Button>
              <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
                Cancel
              </Button>
            </div>
          </form>
      </DialogContent>
    </Dialog>
  );
}