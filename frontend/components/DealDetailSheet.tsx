import { useState } from 'react';
import { Badge } from '@components/ui/badge';
import { Button } from '@components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@components/ui/select';
import { Textarea } from '@components/ui/textarea';
import { addDealNote, updateDealNote, deleteDealNote } from '../actions/updateDealNotes';
import type { DealWithContact } from '../types/deal';
import type { DealNote } from '../types/deal';

type Props = {
  deal: DealWithContact | null;
  open: boolean;
  onClose: () => void;
  onStageChange: (dealId: string, newStage: string) => void;
  onEdit: () => void;
  onDealUpdated?: () => void;
};

const STAGES = [
  { id: 'new', title: 'New', color: 'bg-gradient-to-r from-sky-400 to-blue-500', dotColor: 'bg-sky-500' },
  { id: 'qualified', title: 'Qualified', color: 'bg-gradient-to-r from-amber-400 to-yellow-500', dotColor: 'bg-amber-500' },
  { id: 'negotiating', title: 'Negotiating', color: 'bg-gradient-to-r from-violet-400 to-purple-500', dotColor: 'bg-violet-500' },
  { id: 'closed_won', title: 'Closed Won', color: 'bg-gradient-to-r from-emerald-400 to-green-500', dotColor: 'bg-emerald-500' },
  { id: 'closed_lost', title: 'Closed Lost', color: 'bg-gradient-to-r from-rose-400 to-pink-500', dotColor: 'bg-rose-500' },
];

const signalColors: Record<'positive' | 'neutral' | 'negative', { bg: string; text: string; dot: string; label: string }> = {
  positive: {
    bg: 'bg-emerald-50 border-emerald-200',
    text: 'text-emerald-800',
    dot: 'bg-emerald-500',
    label: 'Positive'
  },
  neutral: {
    bg: 'bg-amber-50 border-amber-200',
    text: 'text-amber-800',
    dot: 'bg-amber-500',
    label: 'Neutral'
  },
  negative: {
    bg: 'bg-rose-50 border-rose-200',
    text: 'text-rose-800',
    dot: 'bg-rose-500',
    label: 'Negative'
  },
};

export default function DealDetailSheet({ deal, open, onClose, onStageChange, onEdit, onDealUpdated }: Props) {
  const [isEditing, setIsEditing] = useState(false);
  const [newNoteContent, setNewNoteContent] = useState('');
  const [editingNoteId, setEditingNoteId] = useState<string | null>(null);
  const [editingContent, setEditingContent] = useState('');
  const [isSaving, setIsSaving] = useState(false);

  console.log('📋 SHEET: DealDetailSheet render:', { 
    dealName: deal?.name, 
    open, 
    hasOnClose: !!onClose,
    hasOnEdit: !!onEdit,
    dealId: deal?.id 
  });

  // Don't show sheet if not open or no deal
  if (!open) {
    console.log('📋 SHEET: Not open, returning null');
    return null;
  }

  if (!deal) {
    console.log('📋 SHEET: No deal provided but sheet is open, showing loading...');
    // Show loading state instead of returning null
    return (
      <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
        <div className="bg-white w-[600px] rounded-lg shadow-xl p-8">
          <div className="text-center">
            <p className="text-slate-500">Loading deal...</p>
          </div>
        </div>
      </div>
    );
  }

  const handleStageChange = (newStage: string) => {
    console.log('📋 SHEET: Stage change requested:', newStage);
    onStageChange(deal.id, newStage);
  };

  const handleEditClick = () => {
    console.log('📋 SHEET: Edit button clicked!');
    onEdit();
  };

  const handleAddNote = async () => {
    if (!newNoteContent.trim() || isSaving) return;
    
    setIsSaving(true);
    const result = await addDealNote(deal.id, newNoteContent);
    
    if (result.success) {
      setNewNoteContent('');
      // Refresh deal data to show new note
      if (onDealUpdated) onDealUpdated();
    } else {
      alert('Failed to add note: ' + result.error);
    }
    setIsSaving(false);
  };

  const handleEditNote = async (noteId: string) => {
    if (!editingContent.trim() || isSaving) return;
    
    setIsSaving(true);
    const result = await updateDealNote(deal.id, noteId, editingContent);
    
    if (result.success) {
      setEditingNoteId(null);
      setEditingContent('');
      // Refresh deal data to show updated note
      if (onDealUpdated) onDealUpdated();
    } else {
      alert('Failed to update note: ' + result.error);
    }
    setIsSaving(false);
  };

  const handleDeleteNote = async (noteId: string) => {
    if (isSaving) return;
    
    setIsSaving(true);
    const result = await deleteDealNote(deal.id, noteId);
    
    if (result.success) {
      // Refresh deal data to show deleted note
      if (onDealUpdated) onDealUpdated();
    } else {
      alert('Failed to delete note: ' + result.error);
    }
    setIsSaving(false);
  };

  const startEditingNote = (note: DealNote) => {
    setEditingNoteId(note.id);
    setEditingContent(note.content);
  };

  const cancelEditingNote = () => {
    setEditingNoteId(null);
    setEditingContent('');
  };

  const currentStage = STAGES.find(stage => stage.id === deal.stage);
  const signalStyle = signalColors[deal.signal];

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
    <div className="fixed inset-0 z-50 bg-black/50 flex items-center justify-center">
      <div className="bg-white w-[600px] max-h-[90vh] rounded-lg shadow-xl overflow-hidden">
            {/* Header */}
            <div className="px-6 py-4 border-b border-slate-200 flex items-center justify-between">
              <h2 className="text-xl font-bold text-slate-900">{deal.name}</h2>
              <button
                onClick={onClose}
                className="text-slate-500 hover:text-slate-700 text-2xl"
              >
                ×
              </button>
            </div>
            
            {/* Content */}
            <div className="p-6 overflow-y-auto max-h-[70vh]">
              <div className="space-y-6">
                
                {/* Signal and Stage */}
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 sm:gap-4">
                  <div className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-lg border ${signalStyle.bg}`}>
                    <div className={`w-2 h-2 rounded-full ${signalStyle.dot}`}></div>
                    <span className={`text-xs font-medium uppercase tracking-wide ${signalStyle.text}`}>
                      {signalStyle.label}
                    </span>
                  </div>
                  
                  <Select value={deal.stage} onValueChange={handleStageChange}>
                    <SelectTrigger className="w-full sm:w-[160px] h-9 px-3">
                      <div className="flex items-center gap-2">
                        <div className={`w-2.5 h-2.5 rounded-full ${currentStage?.dotColor} shadow-sm`}></div>
                        <span className="text-sm font-semibold text-slate-700">{currentStage?.title}</span>
                      </div>
                    </SelectTrigger>
                    <SelectContent>
                      {STAGES.map((stage) => (
                        <SelectItem key={stage.id} value={stage.id}>
                          <div className="flex items-center gap-2">
                            <div className={`w-2.5 h-2.5 rounded-full ${stage.dotColor} shadow-sm`}></div>
                            <span className="font-medium">{stage.title}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                {/* Use Case */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-2">Use Case</h3>
                  <p className="text-slate-700 bg-slate-50 rounded-lg p-4 italic">
                    {deal.use_case}
                  </p>
                </div>

                {/* Description */}
                {deal.description && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">Description</h3>
                    <p className="text-slate-700 bg-white border border-slate-200 rounded-lg p-4">
                      {deal.description}
                    </p>
                  </div>
                )}

                {/* Contact Information */}
                {deal.contact_first_name && (
                  <div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-3">Contact</h3>
                    <div className="bg-white border border-slate-200 rounded-lg p-4">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-gradient-to-br from-blue-500 to-purple-600 rounded-lg flex items-center justify-center text-white font-semibold">
                          {deal.contact_first_name.charAt(0)}{deal.contact_last_name?.charAt(0)}
                        </div>
                        <div>
                          <p className="font-semibold text-slate-900">
                            {deal.contact_first_name} {deal.contact_last_name}
                          </p>
                          {deal.contact_company && (
                            <p className="text-sm text-slate-600">{deal.contact_company}</p>
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* Timestamps */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Timeline</h3>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 mb-1">Created</p>
                      <p className="text-slate-900 font-medium">{formatDate(deal.created_at)}</p>
                    </div>
                    <div className="bg-slate-50 rounded-lg p-3">
                      <p className="text-sm text-slate-600 mb-1">Updated</p>
                      <p className="text-slate-900 font-medium">{formatDate(deal.updated_at)}</p>
                    </div>
                  </div>
                </div>

                {/* Notes Section */}
                <div>
                  <h3 className="text-lg font-semibold text-slate-900 mb-3">Notes</h3>
                  
                  {/* Add Note Form */}
                  <div className="mb-4 space-y-2">
                    <Textarea
                      value={newNoteContent}
                      onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setNewNoteContent(e.target.value)}
                      placeholder="Add a note about this deal..."
                      className="min-h-[80px] resize-none"
                      disabled={isSaving}
                    />
                    <div className="flex justify-end">
                      <Button 
                        onClick={handleAddNote} 
                        disabled={!newNoteContent.trim() || isSaving}
                        size="sm"
                      >
                        {isSaving ? 'Adding...' : 'Add Note'}
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
                              : 'bg-white border-slate-200'
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
                            <div className="space-y-2">
                              <Textarea
                                value={editingContent}
                                onChange={(e: React.ChangeEvent<HTMLTextAreaElement>) => setEditingContent(e.target.value)}
                                className="min-h-[80px] resize-none"
                                disabled={isSaving}
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
                                    disabled={isSaving}
                                  >
                                    Cancel
                                  </Button>
                                  <Button 
                                    size="sm"
                                    onClick={() => handleEditNote(note.id)}
                                    disabled={!editingContent.trim() || isSaving}
                                  >
                                    {isSaving ? 'Saving...' : 'Save'}
                                  </Button>
                                </div>
                              </div>
                            </div>
                          ) : (
                            // View mode
                            <div>
                              <p className="text-slate-700 whitespace-pre-wrap mb-2">
                                {note.content}
                              </p>
                              <div className="flex justify-between items-center">
                                <p className="text-xs text-slate-500">
                                  {formatDate(note.created_at)}
                                  {note.updated_at && ` • Edited: ${formatDate(note.updated_at)}`}
                                </p>
                                <div className="flex gap-2">
                                  <button
                                    onClick={() => startEditingNote(note)}
                                    className="text-xs text-blue-600 hover:text-blue-800 disabled:opacity-50"
                                    disabled={isSaving}
                                  >
                                    Edit
                                  </button>
                                  <button
                                    onClick={() => handleDeleteNote(note.id)}
                                    className="text-xs text-red-600 hover:text-red-800 disabled:opacity-50"
                                    disabled={isSaving}
                                  >
                                    Delete
                                  </button>
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-slate-500 text-sm italic">No notes yet. Add one above!</p>
                  )}
                </div>

              </div>
            </div>
            
            {/* Footer */}
            <div className="px-6 py-4 border-t border-slate-200 flex justify-end gap-2">
              <Button variant="outline" onClick={onClose}>
                Close
              </Button>
              <Button onClick={handleEditClick}>
                View Deal
              </Button>
            </div>
          </div>
        </div>
  );
}