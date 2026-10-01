import { useMemo, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type ScreenReaderInstructions } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { GripVertical, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TripNote } from '../core/models';
import { cn } from '../lib/cn';
import Linkified from './Linkified';
import { Button, Card, EmptyState, Field, IconButton, Input, ScreenHeader, TextArea } from './ui';
import { deleteWithUndo } from '../store/deleteWithUndo';
import { SortableListItem } from './SortableList';

export default function NotesScreen() {
  const { generalNotes, addGeneralNote, updateGeneralNote, reorderGeneralNotes } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAdd = () => {
    if (!newTitle.trim() && !newContent.trim()) return;
    addGeneralNote(newTitle.trim(), newContent.trim());
    setNewTitle('');
    setNewContent('');
    setShowAddForm(false);
  };

  const startEdit = (note: TripNote) => {
    setEditingId(note.id);
    setEditTitle(note.title);
    setEditContent(note.content);
  };

  const commitEdit = () => {
    if (!editingId) return;
    if (!editTitle.trim() && !editContent.trim()) {
      deleteWithUndo('generalNotes', editingId, 'empty note');
      setEditingId(null);
      return;
    }
    updateGeneralNote(editingId, { title: editTitle.trim(), content: editContent.trim() });
    setEditingId(null);
  };

  const announcements = useMemo<Announcements>(() => {
    const getNoteLabel = (id: string | number) => {
      const note = generalNotes.find((candidate) => candidate.id === id);
      return note?.title || note?.content || 'note';
    };
    return {
      onDragStart: ({ active }) => `Picked up ${getNoteLabel(active.id)}.`,
      onDragOver: ({ active, over }) => over ? `${getNoteLabel(active.id)} is over ${getNoteLabel(over.id)}.` : undefined,
      onDragEnd: ({ active, over }) => over ? `Moved ${getNoteLabel(active.id)} before ${getNoteLabel(over.id)}.` : `Dropped ${getNoteLabel(active.id)}.`,
      onDragCancel: ({ active }) => `Reordering cancelled for ${getNoteLabel(active.id)}.`,
    };
  }, [generalNotes]);

  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(() => ({
    draggable: 'Press Space or Enter on the reorder button to pick up an item, use arrow keys to move it, then press Space or Enter to drop.',
  }), []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = generalNotes.findIndex((note) => note.id === active.id);
    const newIndex = generalNotes.findIndex((note) => note.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderGeneralNotes(arrayMove(generalNotes, oldIndex, newIndex));
  };

  return (
    <div className="safe-area-inset min-h-dvh">
      <ScreenHeader title="Trip Notes" subtitle="GENERAL REFERENCE" />

      <div className="px-6 pb-3">
        <p className="-mt-0.5 m-0 text-[14px] text-label-secondary">
          {generalNotes.length} note{generalNotes.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className="px-6 pb-[120px]">
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} block size="lg" className="mb-6">
            <Plus size={20} />
            New Note
          </Button>
        ) : (
          <Card padding="lg" className="mb-8 flex flex-col gap-4 border-sys-blue shadow-[0_8px_32px_rgba(10,132,255,0.15)]">
            <Field label="Note Title (Optional)" className="mb-0">
              {(id) => <Input id={id} type="text" autoFocus value={newTitle} onChange={(e) => setNewTitle(e.target.value)} placeholder="E.g., Packing List" />}
            </Field>

            <Field label="Content" className="mb-0">
              {(id) => (
                <TextArea
                  id={id}
                  value={newContent}
                  onChange={(e) => setNewContent(e.target.value)}
                  placeholder="Add your note details here... Links will become clickable automatically."
                  className="min-h-[120px]"
                />
              )}
            </Field>

            <div className="mt-1 flex gap-3">
              <Button onClick={handleAdd} disabled={!newTitle.trim() && !newContent.trim()} className="flex-1">
                Save Note
              </Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-3">
          {generalNotes.length === 0 ? (
            <Card>
              <EmptyState
                icon={<StickyNote size={32} />}
                title="No notes yet"
                description="Capture ideas, confirmation details, links, and reference info for your trip."
                action={(
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={18} />
                    New note
                  </Button>
                )}
              />
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={{ announcements, screenReaderInstructions }}>
              <SortableContext items={generalNotes.map((note) => note.id)} strategy={verticalListSortingStrategy}>
                {generalNotes.map((note) => {
              const isEditing = editingId === note.id;

              return (
                <SortableListItem key={note.id} id={note.id} disabled={isEditing}>
                  {({ attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, style }) => (
                <Card
                  ref={setNodeRef}
                  style={style}
                  data-note-item
                  className={cn(
                    'flex flex-col gap-3 rounded-card border p-5 transition-all duration-150 ease-ios shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
                    isEditing ? 'border-sys-blue/40' : 'border-white/8',
                    isDragging && 'z-[2] scale-[1.02] opacity-40 shadow-[0_8px_24px_rgba(10,132,255,0.2)]',
                  )}
                >
                  {isEditing ? (
                    <div className="flex flex-col gap-3">
                      <Input autoFocus value={editTitle} onChange={(e) => setEditTitle(e.target.value)} placeholder="Note Title" />
                      <TextArea value={editContent} onChange={(e) => setEditContent(e.target.value)} placeholder="Content..." className="min-h-[120px]" />
                      <div className="mt-1 flex justify-end gap-2">
                        <Button variant="secondary" onClick={() => setEditingId(null)}>
                          Cancel
                        </Button>
                        <Button onClick={commitEdit}>Save</Button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="flex items-start justify-between">
                        {note.title ? <h3 className="m-0 text-[18px] font-bold text-label">{note.title}</h3> : <div className="text-caption italic text-label-secondary">Untitled Note</div>}
                        <div className="ml-3 flex shrink-0 gap-2">
                          <IconButton aria-label="Edit note" variant="ghost" size="sm" onClick={() => startEdit(note)}>
                            <Pencil size={16} />
                          </IconButton>
                          <IconButton aria-label="Delete note" variant="danger" size="sm" onClick={() => deleteWithUndo('generalNotes', note.id, note.title ? `"${note.title}"` : 'note')}>
                            <Trash2 size={16} />
                          </IconButton>
                          <button
                            ref={setActivatorNodeRef}
                            type="button"
                            aria-label={`Reorder ${note.title || 'note'}`}
                            {...attributes}
                            {...listeners}
                            className="drag-handle -ml-1 flex cursor-grab touch-none items-center border-0 bg-transparent px-1 py-2 text-label-tertiary"
                          >
                            <GripVertical size={18} />
                          </button>
                        </div>
                      </div>

                      {note.content && (
                        <div className="mt-1 max-h-[300px] overflow-y-auto whitespace-pre-wrap pr-2 text-body leading-[1.5] text-label">
                          <Linkified text={note.content} />
                        </div>
                      )}
                    </>
                  )}
                </Card>
                  )}
                </SortableListItem>
              );
                })}
              </SortableContext>
            </DndContext>
          )}
        </div>
      </div>
    </div>
  );
}
