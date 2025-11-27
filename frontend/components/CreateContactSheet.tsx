import { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { useMutateAction } from '@quibakery/data';
import { User, Mail, Phone, Building, Briefcase, Tag, CheckCircle, Linkedin, Radio } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@components/ui/sheet';
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@components/ui/form';
import { Input } from '@components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Button } from '@components/ui/button';
import createContactAction from '@actions/createContact';

type Contact = {
  id: string;
  first_name: string;
  last_name: string;
  email: string;
  linkedin?: string;
  acquisition_channel?: string;
};

/*
 * Schema defining the fields required to create a contact. Each of the fields corresponds to a
 * column in the contacts table. Tags are optional and provided as a comma separated string.
 */
const formSchema = z.object({
  firstName: z.string().min(1, { message: 'First name is required' }),
  lastName: z.string().min(1, { message: 'Last name is required' }),
  email: z.string().email({ message: 'Valid email is required' }),
  phone: z.string().optional(),
  company: z.string().optional(),
  position: z.string().optional(),
  linkedin: z.string().optional(),
  acquisitionChannel: z.string().optional(),
  status: z.enum(['active', 'inactive']).default('active'),
  tags: z.string().optional(),
});

export type CreateContactData = z.infer<typeof formSchema>;

type Props = {
  /** Whether the sheet is open */
  open: boolean;
  /** Called when the open state changes */
  onOpenChange: (open: boolean) => void;
  /** Called after a contact is successfully created. Receives the new contact id and a boolean
   * indicating whether to navigate to the contact details. */
  onContactCreated: (contactId: string, shouldNavigate: boolean) => void;
};

/**
 * Sliding sheet component for creating a new contact. Presents a form with basic contact fields
 * and invokes the createContact action on submit. After creation it notifies the parent via
 * onContactCreated and closes itself.
 */
export default function CreateContactSheet({ open, onOpenChange, onContactCreated }: Props) {
  const form = useForm<CreateContactData>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      firstName: '',
      lastName: '',
      email: '',
      phone: '',
      company: '',
      position: '',
      linkedin: '',
      acquisitionChannel: '',
      status: 'active',
      tags: '',
    },
  });
  const { control, handleSubmit, reset, formState } = form;
  const { errors } = formState;

  const [createContact, { isLoading: isSubmitting }] = useMutateAction(createContactAction);

  const onSubmit = async (data: CreateContactData) => {
    const tagsArray = data.tags
      ? data.tags
          .split(',')
          .map((t) => t.trim())
          .filter((t) => t.length > 0)
      : [];
    const result = await createContact({
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
    // result is an array of rows; take the first id.
    const newId = result && result[0] ? (result[0] as Contact).id : '';
    onContactCreated(newId, true);
    reset();
    onOpenChange(false);
  };

  return (
    <Sheet open={open} onOpenChange={onOpenChange}>
      <SheetContent>
        <SheetHeader className="space-y-3 border-gray-100">
          <SheetTitle className="text-2xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
            Create New Contact
          </SheetTitle>
          <SheetDescription className="text-base">
            Add a new contact to your CRM. Fill in their details below.
          </SheetDescription>
        </SheetHeader>
        
        <div className="flex-1 overflow-y-auto px-8 py-6">
          <Form {...form}>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Name Fields - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="firstName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        First Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="John" 
                            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="lastName"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">
                        Last Name <span className="text-red-500">*</span>
                      </FormLabel>
                      <FormControl>
                        <div className="relative">
                          <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Doe" 
                            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* Email */}
              <FormField
                control={control}
                name="email"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">
                      Email Address <span className="text-red-500">*</span>
                    </FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          type="email" 
                          placeholder="john.doe@example.com" 
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Phone */}
              <FormField
                control={control}
                name="phone"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Phone Number</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="+1 (555) 123-4567" 
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Company & Position - Side by Side */}
              <div className="grid grid-cols-2 gap-4">
                <FormField
                  control={control}
                  name="company"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Company</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Building className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Acme Inc" 
                            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
                <FormField
                  control={control}
                  name="position"
                  render={({ field, fieldState }) => (
                    <FormItem>
                      <FormLabel className="text-sm font-semibold text-gray-700">Position</FormLabel>
                      <FormControl>
                        <div className="relative">
                          <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                          <Input 
                            placeholder="Manager" 
                            className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                            {...field} 
                          />
                        </div>
                      </FormControl>
                      <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                    </FormItem>
                  )}
                />
              </div>

              {/* LinkedIn */}
              <FormField
                control={control}
                name="linkedin"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">LinkedIn Profile</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Linkedin className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="linkedin.com/in/johndoe" 
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Acquisition Channel */}
              <FormField
                control={control}
                name="acquisitionChannel"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Acquisition Channel</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Radio className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <Select
                          value={field.value}
                          onValueChange={field.onChange}
                        >
                          <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select channel" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="website">🌐 Website</SelectItem>
                            <SelectItem value="referral">👥 Referral</SelectItem>
                            <SelectItem value="linkedin">💼 LinkedIn</SelectItem>
                            <SelectItem value="email">📧 Email Campaign</SelectItem>
                            <SelectItem value="event">🎪 Event</SelectItem>
                            <SelectItem value="cold-outreach">📞 Cold Outreach</SelectItem>
                            <SelectItem value="social-media">📱 Social Media</SelectItem>
                            <SelectItem value="other">📝 Other</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Status */}
              <FormField
                control={control}
                name="status"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Status</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <CheckCircle className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 z-10" />
                        <Select
                          value={field.value}
                          onValueChange={(value) => field.onChange(value as 'active' | 'inactive')}
                        >
                          <SelectTrigger className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500">
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active">✅ Active</SelectItem>
                            <SelectItem value="inactive">⭕ Inactive</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                  </FormItem>
                )}
              />

              {/* Tags */}
              <FormField
                control={control}
                name="tags"
                render={({ field, fieldState }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-semibold text-gray-700">Tags</FormLabel>
                    <FormControl>
                      <div className="relative">
                        <Tag className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                        <Input 
                          placeholder="vip, enterprise, customer" 
                          className="pl-10 h-11 border-gray-300 focus:border-blue-500 focus:ring-blue-500" 
                          {...field} 
                        />
                      </div>
                    </FormControl>
                    <FormMessage className="text-xs">{fieldState?.error?.message}</FormMessage>
                    <p className="text-xs text-gray-500 mt-1">Separate multiple tags with commas</p>
                  </FormItem>
                )}
              />
            </form>
          </Form>
        </div>

        {/* Buttons - Fixed at bottom */}
        <div className="flex-shrink-0 px-8 py-6 border-t border-gray-100 bg-gray-50/50">
          <div className="flex gap-3">
            <Button 
              type="button"
              onClick={handleSubmit(onSubmit)}
              disabled={isSubmitting} 
              className="flex-1 h-11 bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-semibold shadow-lg shadow-blue-500/30 transition-all"
            >
              {isSubmitting ? 'Creating...' : 'Create Contact'}
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
              className="px-8 h-11 border-2 font-semibold hover:bg-gray-50"
            >
              Cancel
            </Button>
          </div>
        </div>
      </SheetContent>
    </Sheet>
  );
}