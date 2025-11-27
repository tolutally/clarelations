import { useState, useEffect, useMemo } from 'react';
import { useLoadAction } from '@quibakery/data';
import { Card, CardContent, CardHeader, CardTitle } from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Input } from '@components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@components/ui/select';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@components/ui/table';
import { Badge } from '@components/ui/badge';
import { Skeleton } from '@components/ui/skeleton';
import { Search as SearchIcon, ChevronLeft, ChevronRight, Plus } from 'lucide-react';
import loadContactsAction from '@actions/loadContacts';
import countContactsAction from '@actions/countContacts';
import loadCompaniesAction from '@actions/loadCompanies';
import updateContactAction from '@actions/updateContact';
import CreateContactSheet from '@components/CreateContactSheet';
import type { Contact } from '../types/contact';

/*
 * ContactList displays a paginated list of contacts with search and filter controls. It fetches data
 * from the backend using UI Bakery actions. The list supports filtering by company and status and
 * searching by name or email. Pagination is controlled via simple previous/next buttons.
 */
export type ContactListProps = {
  /** Callback invoked when the user selects a contact */
  onViewContact: (contactId: string) => void;
};

export default function ContactList({ onViewContact }: ContactListProps) {
  console.log('ContactList rendering...');
  
  // Search input state. We debounce the actual search term.
  const [searchInput, setSearchInput] = useState('');
  const [search, setSearch] = useState('');
  const [companyFilter, setCompanyFilter] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [page, setPage] = useState(1);
  const [updatingStatus, setUpdatingStatus] = useState<Record<string, boolean>>({});
  const pageSize = 10;

  // Debounce the search input so we don't spam the backend on every keystroke.
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(1);
    }, 500);
    return () => clearTimeout(timer);
  }, [searchInput]);

  // Fetch contacts according to current filters and pagination.
  const { data: contacts = [], loading: loadingContacts, refresh: refreshContacts } = useLoadAction(
    loadContactsAction,
    [],
    {
      search: search || null,
      company: companyFilter || null,
      status: statusFilter || null,
      limit: pageSize,
      offset: (page - 1) * pageSize,
    }
  );

  console.log('ContactList data:', { 
    contacts,
    contactsCount: contacts?.length,
    loading: loadingContacts,
    type: Array.isArray(contacts) ? 'array' : typeof contacts
  });
  
  // Fetch the total number of contacts so we can compute total pages.
  const { data: countResult = [], loading: loadingCount } = useLoadAction(countContactsAction, [], {
    search: search || null,
    company: companyFilter || null,
    status: statusFilter || null,
  });
  const totalCount = countResult[0]?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / pageSize));

  // Load the list of companies for the company filter. We only need the first result.
  const { data: companies = [] } = useLoadAction(loadCompaniesAction, []);

  // Derived contact list typed to Contact[].
  const contactList: Contact[] = contacts as Contact[];

  // Handler for clicking a row.
  const handleRowClick = (contactId: string) => {
    console.log('Clicked contact:', contactId);
    onViewContact(contactId.toString());
  };

  // Handlers for filter changes.
  const handleCompanyChange = (value: string) => {
    setCompanyFilter(value === 'all' ? null : value);
    setPage(1);
  };
  const handleStatusFilterChange = (value: string) => {
    setStatusFilter(value === 'all' ? null : value);
    setPage(1);
  };

  // Handler for creating a new contact sheet.
  const [createSheetOpen, setCreateSheetOpen] = useState(false);
  const handleContactCreated = (contactId: string, shouldNavigate: boolean) => {
    setCreateSheetOpen(false);
    refreshContacts();
    // If shouldNavigate is true, navigate to the newly created contact
    if (shouldNavigate && contactId) {
      onViewContact(contactId);
    }
  };

  // Handler for updating contact status
  const handleStatusChange = async (contactId: string, newStatus: string, contact: Contact) => {
    // Prevent propagation to row click
    event?.stopPropagation();
    
    setUpdatingStatus(prev => ({ ...prev, [contactId]: true }));
    
    try {
      await updateContactAction({
        id: contactId,
        first_name: contact.first_name,
        last_name: contact.last_name,
        email: contact.email,
        phone: contact.phone,
        company: contact.company,
        position: contact.position,
        linkedin: contact.linkedin,
        acquisition_channel: contact.acquisition_channel,
        status: newStatus,
        tags: contact.tags || [],
      });
      
      // Refresh the contacts list to show updated status
      refreshContacts();
    } catch (error) {
      console.error('Error updating contact status:', error);
      alert('Failed to update contact status. Please try again.');
    } finally {
      setUpdatingStatus(prev => ({ ...prev, [contactId]: false }));
    }
  };

  return (
    <div className="w-full p-8 pt-20">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-gradient-to-r from-blue-600 to-indigo-600 rounded-xl shadow-lg">
              <SearchIcon className="w-7 h-7 text-white" />
            </div>
            <div>
              <h1 className="text-4xl font-bold text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
                Contacts
              </h1>
              <p className="text-slate-600 mt-1">Manage your customer relationships</p>
            </div>
          </div>
          <Button onClick={() => setCreateSheetOpen(true)}>
            <Plus className="w-4 h-4 mr-2" /> Create Contact
          </Button>
        </div>
        {/* Search and filters */}
        <div className="flex flex-col sm:flex-row sm:items-end gap-4">
          <div className="flex-1 relative">
            <Input
              placeholder="Search by name or email..."
              value={searchInput}
              onChange={(e: React.ChangeEvent<HTMLInputElement>) => setSearchInput(e.target.value)}
            />
          </div>
          <Select value={companyFilter || 'all'} onValueChange={handleCompanyChange}>
            <SelectTrigger className="w-full sm:w-44">
              <SelectValue placeholder="Filter by company" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Companies</SelectItem>
              {companies.map((company: string) => (
                <SelectItem key={company} value={company}>
                  {company}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter || 'all'} onValueChange={handleStatusFilterChange}>
            <SelectTrigger className="w-full sm:w-32">
              <SelectValue placeholder="Filter by status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Statuses</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>
      {/* Card containing the table */}
      <Card className="shadow-xl border-0 bg-white">
        <CardHeader className="bg-white border-b border-slate-200">
          <CardTitle className="text-lg text-slate-900">Contact List</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loadingContacts || loadingCount ? (
            // Show skeletons while loading data
            <div className="p-6 space-y-4">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : contactList.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow className="bg-gradient-to-r from-slate-50 to-blue-50 border-b-2 border-blue-200">
                  <TableHead className="font-semibold text-slate-700 px-6">Name</TableHead>
                  <TableHead className="font-semibold text-slate-700">Email</TableHead>
                  <TableHead className="font-semibold text-slate-700">Company</TableHead>
                  <TableHead className="font-semibold text-slate-700">Position</TableHead>
                  <TableHead className="font-semibold text-slate-700">Channel</TableHead>
                  <TableHead className="font-semibold text-slate-700">Tags</TableHead>
                  <TableHead className="font-semibold text-slate-700">Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {contactList.map((contact) => (
                  <TableRow
                    key={contact.id}
                    className="hover:bg-slate-50 cursor-pointer"
                    onClick={() => handleRowClick(contact.id)}
                  >
                    <TableCell className="font-medium text-blue-600">
                      {contact.first_name} {contact.last_name}
                    </TableCell>
                    <TableCell className="text-slate-600">{contact.email || '—'}</TableCell>
                    <TableCell className="text-slate-600">{contact.company || '—'}</TableCell>
                    <TableCell className="text-slate-600">{contact.position || '—'}</TableCell>
                    <TableCell className="text-slate-600">
                      <Badge variant="outline" className="capitalize">
                        {contact.acquisition_channel?.replace(/-/g, ' ') || '—'}
                      </Badge>
                    </TableCell>
                    <TableCell className="text-slate-600">
                      <div className="flex gap-1 flex-wrap">
                        {contact.tags && contact.tags.length > 0 ? (
                          contact.tags.map((tag: string) => (
                            <Badge key={tag} variant="secondary" className="capitalize">
                              {tag}
                            </Badge>
                          ))
                        ) : (
                          '—'
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div onClick={(e) => e.stopPropagation()} className="w-24">
                        <Select
                          value={contact.status}
                          onValueChange={(newStatus: string) => handleStatusChange(contact.id, newStatus, contact)}
                          disabled={updatingStatus[contact.id]}
                        >
                          <SelectTrigger className="h-7 text-xs border-0 bg-transparent hover:bg-slate-100 focus:ring-0 p-0">
                            <div className="flex items-center gap-2 px-2">
                              <div 
                                className={`w-2 h-2 rounded-full ${
                                  contact.status === 'active' 
                                    ? 'bg-green-500' 
                                    : 'bg-slate-400'
                                }`}
                              />
                              <span className={`capitalize font-medium text-xs ${
                                contact.status === 'active'
                                  ? 'text-green-700'
                                  : 'text-slate-600'
                              }`}>
                                {contact.status}
                              </span>
                            </div>
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="active" className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500" />
                                <span>Active</span>
                              </div>
                            </SelectItem>
                            <SelectItem value="inactive" className="text-xs">
                              <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-slate-400" />
                                <span>Inactive</span>
                              </div>
                            </SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="p-12 text-center text-slate-500">
              <SearchIcon className="w-12 h-12 mx-auto mb-4 text-slate-300" />
              <p className="text-lg font-medium">No contacts found</p>
              <p className="text-sm">Try adjusting your filters</p>
            </div>
          )}
        </CardContent>
        {/* Pagination */}
        {contactList.length > 0 && (
          <div className="border-t border-slate-200 bg-gradient-to-r from-slate-50 to-blue-50 px-6 py-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.max(p - 1, 1))}
                disabled={page <= 1}
                className="border-slate-300"
              >
                <ChevronLeft className="w-4 h-4 mr-1" /> Previous
              </Button>
              <div className="px-3 py-1 text-sm text-slate-600">
                Page {page} of {totalPages}
              </div>
              <Button
                size="sm"
                variant="outline"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
                className="border-slate-300"
              >
                Next <ChevronRight className="w-4 h-4 ml-1" />
              </Button>
            </div>
          </div>
        )}
      </Card>
      {/* Create contact sheet */}
      <CreateContactSheet
        open={createSheetOpen}
        onOpenChange={setCreateSheetOpen}
        onContactCreated={handleContactCreated}
      />
    </div>
  );
}