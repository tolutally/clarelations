import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@quibakery/data';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import { Label } from '@components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Save, X } from 'lucide-react';
import updateContactAction from '@actions/updateContact';
import type { Contact } from '@types/contact';

/*
 * Schema for validating contact fields. Uses zod to ensure required fields are present and
 * optional fields are strings. Tags are entered as a comma separated string and parsed when
 * submitting the form.
 */
const contactSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email address'),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  linkedin: z.string().optional(),
  acquisitionChannel: z.string().optional(),
  status: z.enum(['active', 'inactive']),
  tags: z.string().optional(),
});

export type ContactFormData = z.infer<typeof contactSchema>;

type Props = {
  /** The contact to edit */
  contact: Contact;
  /** Called when the user clicks cancel */
  onCancel: () => void;
  /** Called after the contact is successfully saved */
  onSaveSuccess: () => void;
};

/**
 * A form for editing a contact. This component is used within ContactDetails to allow inline
 * editing of a contact record. It uses react‑hook‑form with zod for validation and calls the
 * updateContact action on submit. Tags are entered as a comma separated list which is split
 * into an array when sending the mutation.
 */
export default function ContactForm({ contact, onCancel, onSaveSuccess }: Props) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ContactFormData>({
    resolver: zodResolver(contactSchema),
    defaultValues: {
      firstName: contact.first_name,
      lastName: contact.last_name,
      email: contact.email,
      phone: contact.phone || '',
      company: contact.company || '',
      position: contact.position || '',
      linkedin: contact.linkedin || '',
      acquisitionChannel: contact.acquisition_channel || '',
      status: (contact.status as 'active' | 'inactive') || 'active',
      tags: contact.tags?.join(', ') || '',
    },
  });

  // Mutation for updating a contact. isSubmitting is true while the mutation is in flight.
  const [updateContact, { isLoading: isSubmitting }] = useMutateAction(updateContactAction);

  // Watch the status field so we can set it when the Select changes.
  const statusValue = watch('status');

  const onSubmit = async (data: ContactFormData) => {
    // Split the tags string on commas, trim whitespace and remove empty entries.
    const tagsArray = data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];
    // Perform the mutation. The action expects an object with the id and updated fields.
    await updateContact({
      id: contact.id,
      first_name: data.firstName,
      last_name: data.lastName,
      email: data.email,
      phone: data.phone,
      company: data.company,
      position: data.position,
      linkedin: data.linkedin,
      acquisition_channel: data.acquisitionChannel,
      status: data.status,
      tags: tagsArray,
    });
    onSaveSuccess();
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4 p-6">
      {/* First and last name */}
      <div className="grid gap-2">
        <Label htmlFor="firstName">First Name *</Label>
        <Input id="firstName" {...register('firstName')} />
        {errors.firstName && (
          <p className="text-sm text-red-600">{errors.firstName.message}</p>
        )}
      </div>
      <div className="grid gap-2">
        <Label htmlFor="lastName">Last Name *</Label>
        <Input id="lastName" {...register('lastName')} />
        {errors.lastName && (
          <p className="text-sm text-red-600">{errors.lastName.message}</p>
        )}
      </div>
      {/* Email */}
      <div className="grid gap-2">
        <Label htmlFor="email">Email *</Label>
        <Input id="email" type="email" {...register('email')} />
        {errors.email && (
          <p className="text-sm text-red-600">{errors.email.message}</p>
        )}
      </div>
      {/* Optional fields: phone, company, position */}
      <div className="grid gap-2">
        <Label htmlFor="phone">Phone</Label>
        <Input id="phone" {...register('phone')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="company">Company</Label>
        <Input id="company" {...register('company')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="position">Position</Label>
        <Input id="position" {...register('position')} />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="linkedin">LinkedIn Profile</Label>
        <Input id="linkedin" {...register('linkedin')} placeholder="linkedin.com/in/johndoe" />
      </div>
      <div className="grid gap-2">
        <Label htmlFor="acquisitionChannel">Acquisition Channel</Label>
        <Input id="acquisitionChannel" {...register('acquisitionChannel')} placeholder="e.g., referral, website, linkedin" />
      </div>
      {/* Status select */}
      <div className="grid gap-2">
        <Label htmlFor="status">Status</Label>
        <Select
          value={statusValue}
          onValueChange={(value) => setValue('status', value as 'active' | 'inactive')}
        >
          <SelectTrigger id="status">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      {/* Tags */}
      <div className="grid gap-2">
        <Label htmlFor="tags">Tags (comma separated)</Label>
        <Input id="tags" {...register('tags')} placeholder="vip, enterprise, customer" />
      </div>
      {/* Submit and cancel buttons */}
      <div className="flex gap-2 pt-2">
        <Button
          type="submit"
          disabled={isSubmitting}
          className="flex-1 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-600 hover:to-indigo-700 text-white"
        >
          <Save className="w-4 h-4 mr-2" />
          Save Changes
        </Button>
        <Button
          type="button"
          variant="outline"
          onClick={onCancel}
          disabled={isSubmitting}
          className="border-slate-300"
        >
          <X className="w-4 h-4 mr-2" />
          Cancel
        </Button>
      </div>
    </form>
  );
}