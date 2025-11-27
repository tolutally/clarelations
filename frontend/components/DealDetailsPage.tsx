import React, { useState, useRef, useEffect } from 'react';
import { 
  Card,
  CardHeader,
  CardTitle,
  CardContent,
} from '@components/ui/card';
import { Button } from '@components/ui/button';
import { Badge } from '@components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Input } from '@components/ui/input';
import { Textarea } from '@components/ui/textarea';
import SignalBadge from './SignalBadge';
import { 
  ArrowLeft, 
  Edit3, 
  Plus,
  Building,
  User,
  Clock,
  TrendingUp,
  Paperclip,
  Sparkles,
  Download,
  ExternalLink,
  MoreHorizontal,
  FileText,
  Image as ImageIcon,
  FileIcon,
  Save,
  X,
  Trash2,
  Link,
  MessageSquare,
} from 'lucide-react';
import updateDealAction from '../actions/updateDeal';
import deleteDealAction from '../actions/deleteDeal';
import addAttachmentAction from '../actions/addAttachment';
import removeAttachmentAction from '../actions/removeAttachment';
import loadContactsAction from '../actions/loadContacts';
import { addDealNote, updateDealNote, deleteDealNote } from '../actions/updateDealNotes';
import { DealChatAssistant } from './DealChatAssistant';
import type { Deal, DealWithContact, DealAttachment, DealNote } from '../types/deal';
import type { Contact } from '../types/contact';

const STAGES = [
  { id: 'new', title: 'New', color: 'bg-blue-500' },
  { id: 'qualified', title: 'Qualified', color: 'bg-amber-500' },
  { id: 'negotiating', title: 'Negotiating', color: 'bg-orange-500' },
  { id: 'closed_won', title: 'Closed Won', color: 'bg-emerald-500' },
  { id: 'closed_lost', title: 'Closed Lost', color: 'bg-rose-500' },
];

const formatCurrency = (amount: number) => {
  if (amount >= 1000000) {
    return `$${(amount / 1000000).toFixed(1)}M`;
  } else if (amount >= 1000) {
    return `$${(amount / 1000).toFixed(0)}K`;
  } else {
    return `$${amount.toLocaleString()}`;
  }
};

const formatFileSize = (bytes: number) => {
  const mb = bytes / (1024 * 1024);
  return `${mb.toFixed(1)} MB`;
};

const getFileIcon = (filename: string) => {
  const extension = filename.split('.').pop()?.toLowerCase();
  if (['jpg', 'jpeg', 'png', 'gif', 'svg', 'webp'].includes(extension || '')) {
    return <ImageIcon className="h-4 w-4" />;
  }
  return <FileIcon className="h-4 w-4" />;
};

type Props = {
  deal: DealWithContact;
  onBack: () => void;
  onEdit: () => void;
  onStageChange: (dealId: string, newStage: string) => void;
  onDealUpdated: () => void;
};

export default function DealDetailsPage({
  deal,
  onBack,
  onEdit,
  onStageChange,
  onDealUpdated,
}: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [editedDeal, setEditedDeal] = useState<DealWithContact>(deal);
  const [isSaving, setIsSaving] = useState(false);
  const [attachments, setAttachments] = useState<DealAttachment[]>(deal.attachments || []);
  const [isUploading, setIsUploading] = useState(false);
  const [contacts, setContacts] = useState<Contact[]>([]);
  const [loadingContacts, setLoadingContacts] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingNoteContent, setEditingNoteContent] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [showAIChat, setShowAIChat] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const currentStage = STAGES.find(stage => stage.id === editedDeal.stage);

  // Load contacts when editing starts
  useEffect(() => {
    if (isEditing && contacts.length === 0) {
      setLoadingContacts(true);
      loadContactsAction({})
        .then((data) => setContacts(data || []))
        .catch((error) => console.error('Error loading contacts:', error))
        .finally(() => setLoadingContacts(false));
    }
  }, [isEditing, contacts.length]);

  const hasUnsavedChanges = () => {
    return JSON.stringify(editedDeal) !== JSON.stringify(deal);
  };

  const handleBackClick = () => {
    if (isEditing && hasUnsavedChanges()) {
      if (confirm('You have unsaved changes. Are you sure you want to go back?')) {
        onBack();
      }
    } else {
      onBack();
    }
  };

  const handleEditToggle = () => {
    if (isEditing) {
      if (hasUnsavedChanges()) {
        if (confirm('You have unsaved changes. Are you sure you want to cancel editing?')) {
          setEditedDeal(deal); // Reset to original
          setIsEditing(false);
        }
      } else {
        setIsEditing(false);
      }
    } else {
      setIsEditing(true);
    }
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      await updateDealAction({
        dealId: editedDeal.id,
        name: editedDeal.name,
        stage: editedDeal.stage,
        useCase: editedDeal.use_case,
        signal: editedDeal.signal,
        description: editedDeal.description,
        contactId: editedDeal.contact_id || undefined,
      });
      setIsEditing(false);
      onDealUpdated();
    } catch (error) {
      console.error('Error updating deal:', error);
      alert('Failed to update deal. Please try again.');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteDealAction({ dealId: deal.id });
      console.log('✅ Deal deleted successfully');
      // Go back to deals board
      onBack();
      // Trigger refresh
      onDealUpdated();
    } catch (error) {
      console.error('❌ Error deleting deal:', error);
      alert('Failed to delete deal. Please try again.');
    } finally {
      setIsDeleting(false);
      setShowDeleteConfirm(false);
    }
  };

  const handleStageChange = (newStage: string) => {
    const stage = newStage as Deal['stage'];
    setEditedDeal(prev => ({ ...prev, stage }));
    onStageChange(deal.id, newStage);
  };

  const handleContactChange = (contactId: string) => {
    setEditedDeal(prev => ({ 
      ...prev, 
      contact_id: contactId,
      // Update contact fields for display
      contact_first_name: contacts.find(c => c.id === contactId)?.first_name || '',
      contact_last_name: contacts.find(c => c.id === contactId)?.last_name || '',
      contact_company: contacts.find(c => c.id === contactId)?.company || '',
      contact_position: contacts.find(c => c.id === contactId)?.position || '',
    }));
  };

  const handleFileUpload = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const files = event.target.files;
    if (!files || files.length === 0) return;

    const file = files[0];
    
    // Validate file size (max 10MB)
    const maxSize = 10 * 1024 * 1024; // 10MB
    if (file.size > maxSize) {
      alert('File size must be less than 10MB');
      return;
    }
    
    console.log('Starting file upload:', { fileName: file.name, fileSize: file.size, fileType: file.type });
    setIsUploading(true);

    try {
      console.log('Calling addAttachmentAction with:', { dealId: deal.id, file });
      const attachment = await addAttachmentAction({ dealId: deal.id, file });
      console.log('Attachment upload successful:', attachment);
      
      if (attachment && attachment.id) {
        setAttachments(prev => [...prev, attachment]);
        alert(`File "${file.name}" uploaded successfully!`);
      } else {
        throw new Error('Invalid attachment response');
      }
    } catch (error) {
      console.error('Error uploading file:', error);
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      alert(`Failed to upload file "${file.name}". Please try again. Error: ${errorMessage}`);
    } finally {
      setIsUploading(false);
      // Clear the input
      if (fileInputRef.current) {
        fileInputRef.current.value = '';
      }
    }
  };

  const handleDownloadAttachment = async (attachment: DealAttachment) => {
    try {
      if (attachment.url.startsWith('mock://')) {
        // Mock download - show alert instead of actual download
        alert(`Mock download: "${attachment.name}" (${formatFileSize(attachment.size)})`);
        return;
      }

      const response = await fetch(`/api/attachments/${attachment.id}/download`);
      if (!response.ok) throw new Error('Download failed');
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = attachment.name;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error('Error downloading file:', error);
      alert('Failed to download file. Please try again.');
    }
  };

  const handleDeleteAttachment = async (attachment: DealAttachment) => {
    if (!confirm(`Are you sure you want to delete ${attachment.name}?`)) {
      return;
    }

    try {
      await removeAttachmentAction({ dealId: deal.id, attachmentId: attachment.id });
      setAttachments(prev => prev.filter(att => att.id !== attachment.id));
    } catch (error) {
      console.error('Error deleting file:', error);
      alert('Failed to delete file. Please try again.');
    }
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || isSavingNote) return;
    
    setIsSavingNote(true);
    const result = await addDealNote(deal.id, newNoteContent);
    
    if (result.success) {
      setNewNoteContent('');
      onDealUpdated(); // Refresh deal data to show new note
    } else {
      alert('Failed to add note: ' + result.error);
    }
    setIsSavingNote(false);
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingNoteContent.trim() || isSavingNote) return;
    
    setIsSavingNote(true);
    const result = await updateDealNote(deal.id, noteId, editingNoteContent);
    
    if (result.success) {
      setEditingNoteId(null);
      setEditingNoteContent('');
      onDealUpdated(); // Refresh deal data to show updated note
    } else {
      alert('Failed to update note: ' + result.error);
    }
    setIsSavingNote(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isSavingNote) return;
    
    setIsSavingNote(true);
    const result = await deleteDealNote(deal.id, noteId);
    
    if (result.success) {
      onDealUpdated(); // Refresh deal data to show deleted note
    } else {
      alert('Failed to delete note: ' + result.error);
    }
    setIsSavingNote(false);
  };

  const startEditingNote = (note: DealNote) => {
    setEditingNoteId(note.id);
    setEditingNoteContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingNoteContent('');
  };

  // Get notes sorted by most recent first, including deleted ones for audit trail
  const sortedNotes = (deal.notes || []).sort((a, b) => 
    new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="bg-white border-b border-slate-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button onClick={handleBackClick} variant="ghost" size="icon" className="rounded-full hover:bg-slate-100">
                <ArrowLeft className="h-4 w-4" />
              </Button>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold text-slate-900">
                  {isEditing ? (
                    <Input
                      value={editedDeal.name}
                      onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedDeal(prev => ({ ...prev, name: e.target.value }))}
                      className="text-2xl font-bold border-none p-0 h-auto focus-visible:ring-0 bg-transparent"
                    />
                  ) : (
                    deal.name
                  )}
                </h1>
                <Badge variant="secondary" className={`${currentStage?.color} text-white border-0`}>
                  {currentStage?.title}
                </Badge>
              </div>
            </div>
            
            <div className="flex items-center gap-2">
              {/* AI Chat Button */}
              <Button
                onClick={() => setShowAIChat(true)}
                className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-700 hover:to-indigo-700 text-white"
              >
                <Sparkles className="w-4 h-4 mr-2" />
                Ask AI Assistant
              </Button>
              
              {isEditing && (
                <>
                  <Button 
                    onClick={handleSave} 
                    disabled={isSaving || !hasUnsavedChanges()}
                    className="bg-blue-600 hover:bg-blue-700 text-white"
                  >
                    <Save className="h-4 w-4 mr-2" />
                    {isSaving ? 'Saving...' : 'Save'}
                  </Button>
                  <Button onClick={handleEditToggle} variant="outline" className="border-slate-300">
                    <X className="h-4 w-4 mr-2" />
                    Cancel
                  </Button>
                </>
              )}
              {!isEditing && (
                <>
                  <Button onClick={handleEditToggle} variant="outline" className="border-slate-300 hover:bg-slate-50">
                    <Edit3 className="h-4 w-4 mr-2" />
                    Edit
                  </Button>
                  <Button 
                    onClick={() => setShowDeleteConfirm(true)} 
                    variant="outline" 
                    className="border-red-300 text-red-600 hover:bg-red-50 hover:border-red-400"
                  >
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        <div className="p-6">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Main Content */}
            <div className="lg:col-span-2 space-y-6">
              {/* Deal Overview */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900">Deal Overview</h2>
                </div>
                <div className="p-6 space-y-6">
                  <div className="grid grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Use Case</label>
                      {isEditing ? (
                        <Input
                          value={editedDeal.use_case}
                          onChange={(e: React.ChangeEvent<HTMLInputElement>) => setEditedDeal(prev => ({ ...prev, use_case: e.target.value }))}
                          className="border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        />
                      ) : (
                        <p className="text-sm text-slate-900 bg-slate-50 border border-slate-100 rounded-md px-3 py-2">
                          {deal.use_case}
                        </p>
                      )}
                    </div>
                    
                    <div>
                      <label className="block text-sm font-medium text-slate-600 mb-2">Stage</label>
                      <Select 
                        value={editedDeal.stage} 
                        onValueChange={handleStageChange}
                      >
                        <SelectTrigger className="border-slate-200 focus:border-blue-500">
                          <div className="flex items-center gap-2">
                            <div className={`w-2 h-2 rounded-full ${currentStage?.color}`}></div>
                            <span className="text-slate-900">{currentStage?.title}</span>
                          </div>
                        </SelectTrigger>
                        <SelectContent>
                          {STAGES.map(stage => (
                            <SelectItem key={stage.id} value={stage.id} className="hover:bg-slate-50">
                              <div className="flex items-center gap-2">
                                <div className={`w-2 h-2 rounded-full ${stage.color}`}></div>
                                <span>{stage.title}</span>
                              </div>
                            </SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                  </div>
                  
                  <div>
                    <label className="block text-sm font-medium text-slate-600 mb-2">Description</label>
                    {isEditing ? (
                      <Textarea
                        value={editedDeal.description}
                        onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditedDeal(prev => ({ ...prev, description: e.target.value }))}
                        placeholder="Add description about this deal..."
                        className="border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                        rows={4}
                      />
                    ) : (
                      <div className="text-sm text-slate-900 bg-slate-50 border border-slate-100 rounded-md px-3 py-3 whitespace-pre-wrap">
                        {deal.description || 'No description provided'}
                      </div>
                    )}
                  </div>

                  {/* AI Deal Signal - Compact & Beautiful */}
                  <div className="relative overflow-hidden rounded-lg border border-slate-200 bg-gradient-to-br from-purple-50/50 via-white to-indigo-50/50 p-4">
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-start gap-3 flex-1 min-w-0">
                        <div className="mt-0.5">
                          <Sparkles className="w-5 h-5 text-purple-600" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-1">
                            <h3 className="text-sm font-semibold text-slate-700">AI Signal Analysis</h3>
                            <Badge variant="outline" className="text-[10px] px-1.5 py-0 bg-purple-50 text-purple-700 border-purple-200">
                              AI
                            </Badge>
                          </div>
                          <p className="text-xs text-slate-500">
                            Comprehensive deal health assessment
                          </p>
                        </div>
                      </div>
                      <div className="shrink-0">
                        <SignalBadge 
                          signal={editedDeal.signal}
                          rationale={deal.signal_rationale}
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Notes Section */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <MessageSquare className="h-5 w-5 text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Notes</h2>
                    {sortedNotes.length > 0 && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {sortedNotes.filter(n => !n.deleted_at).length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  {/* Add Note Form */}
                  <div className="mb-6 space-y-2">
                    <Textarea
                      value={newNoteContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNoteContent(e.target.value)}
                      placeholder="Add a note about this deal..."
                      className="min-h-[100px] resize-none border-slate-200 focus:border-blue-500 focus:ring-blue-200"
                      disabled={isSavingNote}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!newNoteContent.trim() || isSavingNote}
                        size="sm"
                        className="bg-blue-600 hover:bg-blue-700 text-white"
                      >
                        <Plus className="h-4 w-4 mr-2" />
                        {isSavingNote ? 'Adding...' : 'Add Note'}
                      </Button>
                    </div>
                  </div>

                  {/* Notes List */}
                  {sortedNotes.length > 0 ? (
                    <div className="space-y-3">
                      {sortedNotes.map((note) => (
                        <div 
                          key={note.id} 
                          className={`border rounded-lg p-4 ${
                            note.deleted_at 
                              ? 'bg-red-50 border-red-200 opacity-60' 
                              : 'bg-slate-50 border-slate-200'
                          }`}
                        >
                          {note.deleted_at ? (
                            // Deleted note - show audit trail
                            <div>
                              <p className="text-sm text-red-700 italic">
                                [Deleted note]
                              </p>
                              <p className="text-xs text-red-600 mt-2">
                                Deleted on {formatDate(note.deleted_at)}
                              </p>
                              {note.updated_at && (
                                <p className="text-xs text-red-600">
                                  Last edited: {formatDate(note.updated_at)}
                                </p>
                              )}
                              <p className="text-xs text-red-600">
                                Created: {formatDate(note.created_at)}
                              </p>
                            </div>
                          ) : editingNoteId === note.id ? (
                            // Edit mode
                            <div className="space-y-3">
                              <Textarea
                                value={editingNoteContent}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingNoteContent(e.target.value)}
                                className="min-h-[100px] resize-none border-slate-200 focus:border-blue-500"
                                disabled={isSavingNote}
                              />
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">
                                  Created: {formatDate(note.created_at)}
                                  {note.updated_at && ` • Edited: ${formatDate(note.updated_at)}`}
                                </p>
                                <div className="flex gap-2">
                                  <Button 
                                    variant="outline" 
                                    size="sm"
                                    onClick={cancelEditingNote}
                                    disabled={isSavingNote}
                                  >
                                    <X className="h-4 w-4 mr-1" />
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleEditNote(note.id)}
                                    disabled={!editingNoteContent.trim() || isSavingNote}
                                    className="bg-blue-600 hover:bg-blue-700 text-white"
                                  >
                                    <Save className="h-4 w-4 mr-1" />
                                    {isSavingNote ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div>
                              <p className="text-slate-700 whitespace-pre-wrap mb-3 leading-relaxed">
                                {note.content}
                              </p>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">
                                  {formatDate(note.created_at)}
                                  {note.updated_at && (
                                    <span className="text-slate-400"> • Edited: {formatDate(note.updated_at)}</span>
                                  )}
                                </p>
                                <div className="flex gap-2">
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => startEditingNote(note)}
                                    disabled={isSavingNote}
                                    className="h-7 px-2 text-xs text-blue-600 hover:text-blue-800 hover:bg-blue-50"
                                  >
                                    <Edit3 className="h-3 w-3 mr-1" />
                                    Edit
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() => handleDeleteNote(note.id)}
                                    disabled={isSavingNote}
                                    className="h-7 px-2 text-xs text-red-600 hover:text-red-800 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-3 w-3 mr-1" />
                                    Delete
                                  </Button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-center py-8">
                      <MessageSquare className="h-12 w-12 text-slate-300 mx-auto mb-3" />
                      <p className="text-slate-500 font-medium">No notes yet</p>
                      <p className="text-sm text-slate-400 mt-1">Add your first note above to track important information</p>
                    </div>
                  )}
                </div>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Contact Info */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <User className="h-5 w-5 text-slate-600" />
                    Contact
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="bg-slate-50 rounded-lg p-4 border border-slate-100">
                      <p className="font-medium text-slate-900">{editedDeal.contact_first_name} {editedDeal.contact_last_name}</p>
                      <p className="text-sm text-slate-600 mt-1">{editedDeal.contact_position || 'Position not specified'}</p>
                    </div>
                    
                    {editedDeal.contact_company && (
                      <div className="flex items-center gap-3 p-3 bg-slate-50 rounded-lg border border-slate-100">
                        <Building className="h-4 w-4 text-slate-500" />
                        <span className="text-sm text-slate-700">{editedDeal.contact_company}</span>
                      </div>
                    )}
                    
                    {isEditing && (
                      <div className="border-t border-slate-100 pt-4">
                        <label className="block text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">
                          Link Contact
                        </label>
                        <Select 
                          value={editedDeal.contact_id || ''} 
                          onValueChange={handleContactChange}
                        >
                          <SelectTrigger className="border-slate-200 focus:border-blue-500">
                            <SelectValue placeholder="Select a contact..." />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="">No contact linked</SelectItem>
                            {contacts.map(contact => (
                              <SelectItem key={contact.id} value={contact.id} className="hover:bg-slate-50">
                                <div className="flex items-center gap-2">
                                  <User className="h-4 w-4 text-slate-400" />
                                  <div>
                                    <div className="font-medium">{contact.first_name} {contact.last_name}</div>
                                    <div className="text-xs text-slate-500">{contact.company} • {contact.email}</div>
                                  </div>
                                </div>
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        {loadingContacts && (
                          <p className="text-xs text-slate-500 mt-1">Loading contacts...</p>
                        )}
                      </div>
                    )}
                    
                    {!isEditing && (
                      <div className="border-t border-slate-100 pt-4">
                        <p className="text-xs font-medium text-slate-500 uppercase tracking-wide mb-2">Contact ID</p>
                        <p className="text-sm text-slate-900 font-mono bg-slate-50 px-2 py-1 rounded border">
                          {editedDeal.contact_id || 'No contact linked'}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Attachments */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4 flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Paperclip className="h-5 w-5 text-slate-600" />
                    <h2 className="text-lg font-semibold text-slate-900">Attachments</h2>
                    {attachments.length > 0 && (
                      <Badge variant="secondary" className="bg-slate-100 text-slate-700">
                        {attachments.length}
                      </Badge>
                    )}
                  </div>
                </div>
                <div className="p-6">
                  <input
                    ref={fileInputRef}
                    type="file"
                    onChange={handleFileUpload}
                    className="hidden"
                    accept="*/*"
                    aria-label="Upload attachment"
                  />
                  
                  <Button 
                    onClick={() => fileInputRef.current?.click()}
                    disabled={isUploading}
                    size="sm"
                    className="w-full bg-blue-600 hover:bg-blue-700 text-white mb-4"
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    {isUploading ? 'Uploading...' : 'Add File'}
                  </Button>

                  {attachments.length === 0 ? (
                    <div className="text-center py-8">
                      <Paperclip className="h-10 w-10 text-slate-300 mx-auto mb-3" />
                      <p className="text-sm text-slate-500">No attachments yet</p>
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {attachments.map((attachment) => (
                        <div key={attachment.id} className="flex items-center gap-3 p-3 bg-slate-50 border border-slate-100 rounded-lg hover:shadow-sm transition-all">
                          <div className="flex-shrink-0 text-slate-400">
                            {getFileIcon(attachment.name)}
                          </div>
                          <div className="flex-1 min-w-0">
                            <p className="text-sm font-medium text-slate-900 truncate">
                              {attachment.name}
                            </p>
                            <div className="text-xs text-slate-500 mt-0.5">
                              {formatFileSize(attachment.size)}
                            </div>
                          </div>
                          <div className="flex items-center gap-1">
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDownloadAttachment(attachment)}
                              className="h-7 w-7 p-0 hover:bg-slate-200"
                            >
                              <Download className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => handleDeleteAttachment(attachment)}
                              className="h-7 w-7 p-0 text-red-600 hover:text-red-700 hover:bg-red-50"
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>

              {/* Deal Metrics */}
              <div className="bg-white rounded-lg border border-slate-200 shadow-sm">
                <div className="border-b border-slate-100 px-6 py-4">
                  <h2 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
                    <TrendingUp className="h-5 w-5 text-slate-600" />
                    Metrics
                  </h2>
                </div>
                <div className="p-6">
                  <div className="space-y-4">
                    <div className="flex items-center justify-between py-2">
                      <span className="text-sm text-slate-600">Created</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(deal.created_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Last Updated</span>
                      <span className="text-sm font-medium text-slate-900">
                        {new Date(deal.updated_at).toLocaleDateString()}
                      </span>
                    </div>
                    
                    <div className="flex items-center justify-between py-2 border-t border-slate-100">
                      <span className="text-sm text-slate-600">Days in Stage</span>
                      <span className="text-sm font-medium text-slate-900">
                        {Math.floor((Date.now() - new Date(deal.updated_at).getTime()) / (1000 * 60 * 60 * 24))}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* AI Chat Assistant Modal */}
      <DealChatAssistant
        dealId={deal.id.toString()}
        dealName={deal.name}
        isOpen={showAIChat}
        onClose={() => setShowAIChat(false)}
      />

      {/* Delete Confirmation Dialog */}
      {showDeleteConfirm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
          <div className="bg-white rounded-lg shadow-xl max-w-md w-full mx-4 p-6">
            <div className="flex items-start gap-4 mb-4">
              <div className="p-3 bg-red-100 rounded-full">
                <Trash2 className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-slate-900 mb-2">
                  Delete Deal?
                </h3>
                <p className="text-sm text-slate-600">
                  Are you sure you want to delete <strong>"{deal.name}"</strong>? This action cannot be undone.
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3 justify-end mt-6">
              <Button
                onClick={() => setShowDeleteConfirm(false)}
                variant="outline"
                disabled={isDeleting}
                className="border-slate-300"
              >
                Cancel
              </Button>
              <Button
                onClick={handleDelete}
                disabled={isDeleting}
                className="bg-red-600 hover:bg-red-700 text-white"
              >
                {isDeleting ? (
                  <>
                    <span className="animate-spin mr-2">⏳</span>
                    Deleting...
                  </>
                ) : (
                  <>
                    <Trash2 className="h-4 w-4 mr-2" />
                    Delete Deal
                  </>
                )}
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}