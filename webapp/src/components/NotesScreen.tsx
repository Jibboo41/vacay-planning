import { useState, useRef } from 'react';
import { Menu, Plus, Trash2, Pencil, StickyNote, GripVertical } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TripNote } from '../core/models';
import Linkified from './Linkified';

export default function NotesScreen() {
  const { generalNotes, addGeneralNote, updateGeneralNote, deleteGeneralNote, setSidebarOpen } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTitle, setNewTitle] = useState('');
  const [newContent, setNewContent] = useState('');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editContent, setEditContent] = useState('');

  // Drag state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
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

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, index: number) => {
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
      // Ensure reorderGeneralNotes is destructured and called here
      useTripStore.getState().reorderGeneralNotes(ordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  // Touch drag handlers
  const handleGripTouchStart = (e: React.TouchEvent, index: number) => {
    e.stopPropagation();
    touchDragIndex.current = index;
    touchStartY.current = e.touches[0].clientY;
    setDraggingIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex.current === null) return;
    if (e.cancelable) e.preventDefault(); // Prevent scrolling on iOS during drag
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
    <div className="screen safe-area-inset">
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Trip Notes</h1>
          <p className="page-subtitle">{generalNotes.length} note{generalNotes.length !== 1 ? 's' : ''} saved</p>
        </div>
      </header>

      <div
        className="screen-body"
        style={{ touchAction: draggingIndex !== null ? 'none' : 'auto' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* New Note Area */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn--tonal btn--lg btn--block screen-action"
          >
            <Plus size={20} />
            New Note
          </button>
        ) : (
          <div className="form-card">
            <div className="edit-field-group">
              <label className="edit-field-label">Note Title (Optional)</label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g., Packing List"
                className="edit-field-input"
              />
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">Content</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Add your note details here... Links will become clickable automatically."
                className="edit-field-input edit-field-input--tall"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={handleAdd}
                disabled={!newTitle.trim() && !newContent.trim()}
                className="btn btn--primary"
              >
                Save Note
              </button>
              <button
                onClick={() => setShowAddForm(false)}
                className="btn"
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div className="list-stack">
          {generalNotes.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><StickyNote size={26} /></div>
              <p className="empty-state__text">No general notes. Jot down ideas, lists, and contacts here!</p>
            </div>
          ) : (
            generalNotes.map((note, index) => {
              const isEditing = editingId === note.id;
              const isDragging = draggingIndex === index;
              const isOver = overIndex === index;

              return (
                <div
                  key={note.id}
                  data-note-item
                  draggable={!isEditing}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragOver={(e) => e.preventDefault()}
                  onDragEnd={handleDragEnd}
                  className={`card note-row${isEditing ? ' note-row--editing' : ''}${isDragging ? ' note-row--dragging' : ''}${isOver ? ' note-row--drop-target' : ''}`}
                  style={isOver ? { transform: draggingIndex !== null && draggingIndex > index ? 'translateY(-4px)' : 'translateY(4px)' } : undefined}
                >
                  {isEditing ? (
                    <div className="list-row__editor">
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Note Title"
                        className="edit-field-input"
                      />
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Content..."
                        className="edit-field-input edit-field-input--tall"
                      />
                      <div className="form-actions form-actions--end">
                        <button onClick={() => setEditingId(null)} className="btn">
                          Cancel
                        </button>
                        <button onClick={commitEdit} className="btn btn--primary">
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div className="note-row__header">
                        {note.title ? (
                          <h3 className="note-row__title">{note.title}</h3>
                        ) : (
                          <div className="note-row__untitled">Untitled Note</div>
                        )}
                        <div className="list-row__actions">
                          <button onClick={() => startEdit(note)} className="icon-btn icon-btn--sm" aria-label="Edit">
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteGeneralNote(note.id)} className="icon-btn icon-btn--sm icon-btn--danger" aria-label="Delete">
                            <Trash2 size={16} />
                          </button>
                          <div
                            className="drag-handle note-row__grip"
                            onTouchStart={(e) => handleGripTouchStart(e, index)}
                          >
                            <GripVertical size={18} />
                          </div>
                        </div>
                      </div>

                      {note.content && (
                        <div className="note-row__content">
                          <Linkified text={note.content} />
                        </div>
                      )}
                    </>
                  )}
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
