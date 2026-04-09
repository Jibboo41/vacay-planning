import { useState, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare, Menu, Calendar, GripVertical, Pencil, X, Check } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TodoItem } from '../core/models';

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos, setSidebarOpen } = useTripStore();
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Drag state
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  // Touch drag state
  const touchStartY = useRef<number>(0);
  const touchDragIndex = useRef<number | null>(null);
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim(), newDueDate || undefined);
    setNewTodo('');
    setNewDueDate('');
  };

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || '');
  };

  const commitEdit = () => {
    if (!editingId || !editText.trim()) { setEditingId(null); return; }
    updateTodo(editingId, { text: editText.trim(), dueDate: editDueDate || null });
    setEditingId(null);
  };

  // Mouse drag handlers
  const handleDragStart = (index: number) => { dragItem.current = index; };
  const handleDragEnter = (index: number) => { dragOverItem.current = index; };
  const handleDragEnd = () => {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const ordered = [...todos];
    const [dragged] = ordered.splice(dragItem.current, 1);
    ordered.splice(dragOverItem.current, 0, dragged);
    reorderTodos(ordered);
    dragItem.current = null;
    dragOverItem.current = null;
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
    e.preventDefault();
    const y = e.touches[0].clientY;
    const items = document.querySelectorAll('[data-todo-item]');
    let newOver: number | null = null;
    items.forEach((el, i) => {
      const rect = el.getBoundingClientRect();
      if (y >= rect.top && y <= rect.bottom) newOver = i;
    });
    setOverIndex(newOver);
  };

  const handleTouchEnd = () => {
    if (touchDragIndex.current !== null && overIndex !== null && overIndex !== touchDragIndex.current) {
      const ordered = [...todos];
      const [dragged] = ordered.splice(touchDragIndex.current, 1);
      ordered.splice(overIndex, 0, dragged);
      reorderTodos(ordered);
    }
    touchDragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const isOverdue = (todo: TodoItem) =>
    !todo.completed && todo.dueDate &&
    new Date(todo.dueDate.replace(/-/g, '/')) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="safe-area-inset" style={{ minHeight: '100vh' }}>
      {/* Header */}
      <div className="screen-header glass-effect" style={{ marginBottom: '0' }}>
        <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ display: 'flex', flexDirection: 'column' }}>
          <h1 style={{ fontSize: '32px', fontWeight: 800, letterSpacing: '-1px', color: '#FFF', margin: 0 }}>
            Todo List
          </h1>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {completedCount} of {todos.length} tasks completed
          </p>
        </div>
      </div>

      <div style={{ padding: '24px', paddingBottom: '120px' }}>
        {/* Input Area */}
        <div style={{
          display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '32px',
          background: 'rgba(255,255,255,0.05)', padding: '16px',
          borderRadius: '20px', border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <div style={{ display: 'flex', gap: '12px' }}>
            <input
              type="text"
              value={newTodo}
              onChange={e => setNewTodo(e.target.value)}
              placeholder="What needs to be done?"
              onKeyDown={e => e.key === 'Enter' && handleAdd()}
              style={{
                flex: 1, background: 'transparent', border: 'none',
                color: '#fff', fontSize: '17px', outline: 'none', fontWeight: 500
              }}
            />
            <button
              onClick={handleAdd}
              disabled={!newTodo.trim()}
              className={newTodo.trim() ? 'btn-glass-blue' : ''}
              style={{
                width: '40px', height: '40px', borderRadius: '12px',
                background: newTodo.trim() ? undefined : 'rgba(255,255,255,0.08)',
                border: newTodo.trim() ? undefined : 'none',
                color: '#fff', display: 'flex', alignItems: 'center', justifyContent: 'center',
                cursor: 'pointer'
              }}
            >
              <Plus size={22} />
            </button>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', paddingTop: '8px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
            <Calendar size={14} color="var(--sys-label-secondary)" />
            <span style={{ fontSize: '12px', color: 'var(--sys-label-secondary)', fontWeight: 600 }}>Due Date (Optional):</span>
            <input
              type="date"
              value={newDueDate}
              onChange={e => setNewDueDate(e.target.value)}
              style={{
                background: 'rgba(255,255,255,0.05)', border: 'none',
                borderRadius: '6px', padding: '4px 8px', color: '#fff',
                fontSize: '12px', colorScheme: 'dark'
              }}
            />
            {newDueDate && (
              <button onClick={() => setNewDueDate('')} style={{ fontSize: '11px', color: 'var(--sys-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
            )}
          </div>
        </div>

        {/* Todo List */}
        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {todos.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
            }}>
              <CheckSquare size={48} opacity={0.2} />
              <p style={{ fontSize: '15px' }}>No tasks yet. Stay organized for your trip!</p>
            </div>
          ) : (
            todos.map((todo, index) => {
              const isEditing = editingId === todo.id;
              const isDragging = draggingIndex === index;
              const isOver = overIndex === index && draggingIndex !== null && draggingIndex !== index;

              return (
                <div
                  key={todo.id}
                  data-todo-item
                  draggable
                  onDragStart={() => handleDragStart(index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={e => e.preventDefault()}
                  style={{
                    display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: '12px',
                    background: isOver ? 'rgba(10,132,255,0.1)' : 'var(--sys-bg-elevated)',
                    padding: '14px 12px',
                    borderRadius: '16px',
                    border: isOver ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.05)',
                    transition: 'all 0.15s ease',
                    opacity: isDragging ? 0.4 : 1,
                  }}
                >
                  {/* Grip */}
                  <div
                    style={{ color: 'var(--sys-label-tertiary)', cursor: 'grab', flexShrink: 0, paddingTop: isEditing ? '10px' : 0 }}
                    onTouchStart={e => handleGripTouchStart(e, index)}
                  >
                    <GripVertical size={18} />
                  </div>

                  {/* Check */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    style={{
                      background: 'transparent', border: 'none', padding: 0,
                      color: todo.completed ? 'var(--sys-blue)' : 'var(--sys-label-tertiary)',
                      cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
                      paddingTop: isEditing ? '10px' : 0
                    }}
                  >
                    {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  {/* Content / Edit area */}
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {isEditing ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                          style={{
                            background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(10,132,255,0.4)',
                            borderRadius: '8px', padding: '8px 10px', color: '#fff',
                            fontSize: '16px', fontWeight: 500, outline: 'none', width: '100%'
                          }}
                        />
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <Calendar size={13} color="var(--sys-label-secondary)" />
                          <span style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600 }}>Due:</span>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            style={{
                              background: 'rgba(255,255,255,0.05)', border: 'none',
                              borderRadius: '6px', padding: '3px 7px', color: '#fff',
                              fontSize: '12px', colorScheme: 'dark'
                            }}
                          />
                          {editDueDate && (
                            <button onClick={() => setEditDueDate('')} style={{ fontSize: '11px', color: 'var(--sys-blue)', fontWeight: 700, background: 'none', border: 'none', cursor: 'pointer' }}>Clear</button>
                          )}
                        </div>
                      </div>
                    ) : (
                      <>
                        <span style={{
                          fontSize: '16px', color: todo.completed ? 'var(--sys-label-tertiary)' : '#fff',
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          transition: 'all 0.2s ease', fontWeight: 500,
                          display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                        }}>
                          {todo.text}
                        </span>
                        {todo.dueDate && (
                          <div style={{
                            fontSize: '11px', marginTop: '2px', fontWeight: 700,
                            color: isOverdue(todo) ? 'var(--sys-red)' : 'var(--sys-label-secondary)'
                          }}>
                            {isOverdue(todo) ? '⚠ ' : ''}Due: {new Date(todo.dueDate.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div style={{ display: 'flex', gap: '6px', flexShrink: 0, alignItems: 'center' }}>
                    {isEditing ? (
                      <>
                        <button onClick={commitEdit} style={{ background: 'rgba(48,209,88,0.15)', border: 'none', padding: '7px', borderRadius: '9px', color: 'var(--sys-green)', cursor: 'pointer', display: 'flex' }}>
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '7px', borderRadius: '9px', color: 'var(--sys-label-secondary)', cursor: 'pointer', display: 'flex' }}>
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(todo)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '7px', borderRadius: '9px', color: 'var(--sys-label-secondary)', cursor: 'pointer', display: 'flex' }}>
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => deleteTodo(todo.id)} style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', padding: '7px', borderRadius: '9px', color: '#FF453A', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
