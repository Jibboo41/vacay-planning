import { useRef, useState, type DragEvent, type TouchEvent } from 'react';
import { GripVertical, Pencil, Plus, StickyNote, Trash2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TripNote } from '../core/models';
import { cn } from '../lib/cn';
import Linkified from './Linkified';
import { Button, Card, Field, IconButton, Input, ScreenHeader, TextArea } from './ui';

export default function NotesScreen() {
  const { generalNotes, addGeneralNote, updateGeneralNote, deleteGeneralNote } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);

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
      deleteGeneralNote(editingId);
      setEditingId(null);
      return;
    }
    updateGeneralNote(editingId, { title: editTitle.trim(), content: editContent.trim() });
    setEditingId(null);
  };

  const handleDragStart = (e: DragEvent, index: number) => {
    dragItem.current = index;
    setDraggingIndex(index);
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (index: number) => {
    dragOverItem.current = index;
    setOverIndex(index);
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && dragItem.current !== dragOverItem.current) {
      const ordered = [...generalNotes];
      const [dragged] = ordered.splice(dragItem.current, 1);
      ordered.splice(dragOverItem.current, 0, dragged);
      useTripStore.getState().reorderGeneralNotes(ordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const handleGripTouchStart = (e: TouchEvent, index: number) => {
    e.stopPropagation();
    touchDragIndex.current = index;
    setDraggingIndex(index);
  };

  const handleTouchMove = (e: TouchEvent) => {
    if (touchDragIndex.current === null) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = target?.closest('[data-note-item]');

    if (itemEl) {
      const elements = Array.from(document.querySelectorAll('[data-note-item]'));
      const newOver = elements.indexOf(itemEl);
      if (newOver !== -1 && newOver !== overIndex) {
        setOverIndex(newOver);
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDragIndex.current !== null && overIndex !== null && overIndex !== touchDragIndex.current) {
      const ordered = [...generalNotes];
      const [dragged] = ordered.splice(touchDragIndex.current, 1);
      ordered.splice(overIndex, 0, dragged);
      useTripStore.getState().reorderGeneralNotes(ordered);
    }
    touchDragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  return (
    <div className="safe-area-inset min-h-dvh">
      <ScreenHeader title="Trip Notes" subtitle="GENERAL REFERENCE" />

      <div className="px-6 pb-3">
        <p className="-mt-0.5 m-0 text-[14px] text-label-secondary">
          {generalNotes.length} note{generalNotes.length !== 1 ? 's' : ''} saved
        </p>
      </div>

      <div className={cn('px-6 pb-[120px]', draggingIndex !== null ? 'touch-none' : 'touch-auto')} onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
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
            <Card padding="lg" className="flex flex-col items-center gap-4 text-center text-label-secondary">
              <StickyNote size={48} className="opacity-20" />
              <p className="text-body">No general notes. Jot down ideas, lists, and contacts here!</p>
            </Card>
          ) : (
            generalNotes.map((note, index) => {
              const isEditing = editingId === note.id;
              const isDragging = draggingIndex === index;
              const isOver = overIndex === index;

              return (
                <Card
                  key={note.id}
                  data-note-item
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={handleDragEnd}
                  className={cn(
                    'flex flex-col gap-3 rounded-card border p-5 transition-all duration-150 ease-ios shadow-[0_4px_12px_rgba(0,0,0,0.1)]',
                    isEditing ? 'border-sys-blue/40' : isOver ? 'border-sys-blue shadow-[0_8px_24px_rgba(10,132,255,0.2)]' : 'border-white/8',
                    isDragging && 'opacity-40',
                    isOver && draggingIndex !== null && (draggingIndex > index ? '-translate-y-1' : 'translate-y-1'),
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
                          <IconButton aria-label="Delete note" variant="danger" size="sm" onClick={() => deleteGeneralNote(note.id)}>
                            <Trash2 size={16} />
                          </IconButton>
                          <button type="button" aria-label="Drag to reorder" className="drag-handle -ml-1 flex cursor-grab touch-none items-center border-0 bg-transparent px-1 py-2 text-label-tertiary" onTouchStart={(e) => handleGripTouchStart(e, index)}>
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
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
