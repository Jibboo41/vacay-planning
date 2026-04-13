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
    <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Trip Notes</h1>
          <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>GENERAL REFERENCE</div>
        </div>
        <div style={{ width: 44 }} /> {/* Balance header */}
      </header>

      <div style={{ padding: '0 24px 12px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {generalNotes.length} note{generalNotes.length !== 1 ? 's' : ''} saved
          </p>
      </div>

      <div 
        style={{ padding: '0 24px 120px 24px', touchAction: draggingIndex !== null ? 'none' : 'auto' }}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        {/* New Note Area */}
        {!showAddForm ? (
          <button 
            onClick={() => setShowAddForm(true)}
            className="btn-glass-blue"
            style={{ 
              width: '100%', padding: '16px', borderRadius: '16px', 
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              marginBottom: '24px', fontSize: '16px'
            }}
          >
            <Plus size={20} />
            New Note
          </button>
        ) : (
          <div style={{
            background: 'var(--sys-bg-elevated-2)', padding: '24px',
            borderRadius: '24px', border: '1px solid var(--sys-blue)',
            marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px',
            boxShadow: '0 8px 32px rgba(10,132,255,0.15)'
          }}>
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Note Title (Optional)</label>
              <input
                type="text"
                autoFocus
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                placeholder="E.g., Packing List"
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none',
                  borderRadius: '10px', padding: '12px 14px', color: '#fff',
                  fontSize: '17px', outline: 'none', width: '100%', boxSizing: 'border-box'
                }}
              />
            </div>
            
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Content</label>
              <textarea
                value={newContent}
                onChange={e => setNewContent(e.target.value)}
                placeholder="Add your note details here... Links will become clickable automatically."
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none',
                  borderRadius: '10px', padding: '12px 14px', color: '#fff',
                  fontSize: '15px', outline: 'none', width: '100%', minHeight: '120px',
                  resize: 'vertical', display: 'block', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button 
                onClick={handleAdd}
                disabled={!newTitle.trim() && !newContent.trim()}
                className="btn-glass-blue"
                style={{ flex: 1, padding: '16px', borderRadius: '14px', fontSize: '15px' }}
              >
                Save Note
              </button>
              <button 
                onClick={() => setShowAddForm(false)}
                style={{ 
                  flex: 1, padding: '16px', borderRadius: '14px', 
                  background: 'rgba(255,255,255,0.08)', color: '#fff', 
                  border: '1px solid rgba(255,255,255,0.1)', fontWeight: 700, fontSize: '15px' 
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        )}

        {/* Notes List */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {generalNotes.length === 0 ? (
             <div style={{
              textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
             }}>
              <StickyNote size={48} opacity={0.2} />
              <p style={{ fontSize: '15px' }}>No general notes. Jot down ideas, lists, and contacts here!</p>
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
                  className="glass-card"
                  style={{
                    display: 'flex', flexDirection: 'column', gap: '12px',
                    padding: '20px', borderRadius: '20px',
                    border: isEditing ? '1px solid rgba(10,132,255,0.4)' : (isOver ? '1px solid var(--sys-blue)' : '1px solid rgba(255,255,255,0.08)'),
                    opacity: isDragging ? 0.4 : 1,
                    transform: isOver ? (draggingIndex !== null && draggingIndex > index ? 'translateY(-4px)' : 'translateY(4px)') : 'none',
                    transition: 'all 0.15s ease',
                    boxShadow: isOver ? '0 8px 24px rgba(10,132,255,0.2)' : '0 4px 12px rgba(0,0,0,0.1)',
                    position: 'relative'
                  }}
                >
                  {isEditing ? (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                      <input
                        autoFocus
                        value={editTitle}
                        onChange={e => setEditTitle(e.target.value)}
                        placeholder="Note Title"
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px', padding: '12px 14px', color: '#fff',
                          fontSize: '17px', fontWeight: 600, outline: 'none', width: '100%', boxSizing: 'border-box'
                        }}
                      />
                      <textarea
                        value={editContent}
                        onChange={e => setEditContent(e.target.value)}
                        placeholder="Content..."
                        style={{
                          background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                          borderRadius: '10px', padding: '12px 14px', color: '#fff',
                          fontSize: '15px', outline: 'none', width: '100%', minHeight: '120px',
                          resize: 'vertical', display: 'block', boxSizing: 'border-box'
                        }}
                      />
                      <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px', marginTop: '4px' }}>
                        <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '10px 16px', borderRadius: '10px', color: '#fff', cursor: 'pointer', fontWeight: 600 }}>
                          Cancel
                        </button>
                        <button onClick={commitEdit} style={{ background: 'rgba(10,132,255,0.15)', border: '1px solid rgba(10,132,255,0.3)', padding: '10px 16px', borderRadius: '10px', color: '#0A84FF', cursor: 'pointer', fontWeight: 700 }}>
                          Save
                        </button>
                      </div>
                    </div>
                  ) : (
                    <>
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                        {note.title ? (
                          <h3 style={{ fontSize: '18px', fontWeight: 700, margin: 0, color: '#fff' }}>{note.title}</h3>
                        ) : (
                          <div style={{ fontSize: '12px', color: 'var(--sys-label-secondary)', fontStyle: 'italic' }}>Untitled Note</div>
                        )}
                        <div style={{ display: 'flex', gap: '8px', flexShrink: 0, marginLeft: '12px' }}>
                          <button onClick={() => startEdit(note)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '8px', borderRadius: '10px', color: 'var(--sys-label-secondary)', cursor: 'pointer', display: 'flex' }}>
                            <Pencil size={16} />
                          </button>
                          <button onClick={() => deleteGeneralNote(note.id)} style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', padding: '8px', borderRadius: '10px', color: '#FF453A', cursor: 'pointer', display: 'flex' }}>
                            <Trash2 size={16} />
                          </button>
                          <div 
                            className="drag-handle" 
                            style={{ 
                              background: 'transparent', border: 'none', padding: '8px 4px', color: 'var(--sys-label-tertiary)', 
                              cursor: 'grab', display: 'flex', alignItems: 'center', marginLeft: '-4px'
                            }}
                            onTouchStart={(e) => handleGripTouchStart(e, index)}
                          >
                            <GripVertical size={18} />
                          </div>
                        </div>
                      </div>
                      
                      {note.content && (
                        <div style={{
                          fontSize: '15px', color: 'var(--sys-label-primary)', lineHeight: '1.5',
                          whiteSpace: 'pre-wrap', marginTop: '4px',
                          maxHeight: '300px', overflowY: 'auto', paddingRight: '8px'
                        }}>
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
