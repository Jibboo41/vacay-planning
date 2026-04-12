import { useState, useRef } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare, Menu, Calendar, GripVertical, Check } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TodoItem } from '../core/models';
import PullToRefresh from './PullToRefresh';

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos, setSidebarOpen, refreshAppData } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');

  // Drag state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchStartY = useRef<number>(0);
  const touchDragIndex = useRef<number | null>(null);

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim(), newDueDate || undefined);
    setNewTodo('');
    setNewDueDate('');
    setShowAddForm(false);
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
      const ordered = [...todos];
      const [dragged] = ordered.splice(dragItem.current, 1);
      ordered.splice(dragOverItem.current, 0, dragged);
      reorderTodos(ordered);
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
    if (e.cancelable) e.preventDefault(); 
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = target?.closest('[data-todo-item]');
    
    if (itemEl) {
      const elements = Array.from(document.querySelectorAll('[data-todo-item]'));
      const newOver = elements.indexOf(itemEl);
      if (newOver !== -1 && newOver !== overIndex) {
        setOverIndex(newOver);
        if ('vibrate' in navigator) navigator.vibrate(5);
      }
    }
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
    <PullToRefresh onRefresh={refreshAppData}>
      <div className="safe-area-inset" style={{ minHeight: '100vh', touchAction: draggingIndex !== null ? 'none' : 'auto' }}>
        <header className="screen-header" style={{ paddingTop: 'calc(6px + env(safe-area-inset-top))' }}>
          <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
            <Menu size={24} />
          </button>
          <div style={{ flex: 1, textAlign: 'center' }}>
            <h1 className="page-title" style={{ margin: 0 }}>Things to Do</h1>
            <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>TRIP CHECKLIST</div>
          </div>
          <div style={{ width: 44 }} />
        </header>
        
        <div style={{ padding: '0 24px 12px 24px' }}>
            <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
              {completedCount} of {todos.length} tasks completed
            </p>
        </div>

        <main style={{ padding: '0 24px 120px 24px' }}>
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
              <Plus size={20} /> Add Task
            </button>
          ) : (
            <div className="glass-effect" style={{ padding: '20px', borderRadius: '24px', background: 'rgba(10, 132, 255, 0.05)', border: '1px solid rgba(10, 132, 255, 0.2)', marginBottom: '24px' }}>
              <input 
                autoFocus
                type="text" value={newTodo} onChange={e => setNewTodo(e.target.value)}
                placeholder="What needs to be done?" 
                style={{ width: '100%', background: 'none', border: 'none', outline: 'none', color: '#FFF', fontSize: '18px', fontWeight: 600, marginBottom: '16px' }} 
              />
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', background: 'rgba(255,255,255,0.05)', padding: '6px 12px', borderRadius: '10px' }}>
                  <Calendar size={14} color="var(--sys-label-secondary)" />
                  <input 
                    type="date" value={newDueDate} onChange={e => setNewDueDate(e.target.value)}
                    style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '12px', fontWeight: 600 }} 
                  />
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={() => setShowAddForm(false)} style={{ background: 'none', border: 'none', color: 'var(--sys-label-tertiary)', fontWeight: 700 }}>Cancel</button>
                  <button onClick={handleAdd} disabled={!newTodo} style={{ background: 'var(--sys-blue)', color: '#FFF', border: 'none', padding: '10px 20px', borderRadius: '12px', fontWeight: 800, opacity: !newTodo ? 0.5 : 1 }}>ADD</button>
                </div>
              </div>
            </div>
          )}

          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            {todos.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-tertiary)' }}>
                <CheckSquare size={48} style={{ opacity: 0.1, marginBottom: '16px' }} />
                <p>Your checklist is empty. Add a task to get started!</p>
              </div>
            ) : (
              todos.map((todo, index) => (
                <div 
                  key={todo.id}
                  data-todo-item
                  draggable={editingId === null}
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  onTouchMove={handleTouchMove}
                  onTouchEnd={handleTouchEnd}
                  className={`glass-effect ${draggingIndex === index ? 'dragging' : ''} ${overIndex === index ? 'over' : ''}`}
                  style={{ 
                    display: 'flex', alignItems: 'center', gap: '16px', padding: '16px', borderRadius: '20px', 
                    background: todo.completed ? 'rgba(255,255,255,0.02)' : 'rgba(255,255,255,0.04)',
                    border: '1px solid rgba(255,255,255,0.08)',
                    opacity: draggingIndex === index ? 0.5 : 1,
                    transform: draggingIndex === index ? 'scale(1.02)' : 'scale(1)',
                    transition: 'all 0.2s'
                  }}
                >
                  <div 
                    onMouseDown={(e) => e.stopPropagation()} 
                    onTouchStart={(e) => handleGripTouchStart(e, index)}
                    style={{ cursor: 'grab', color: 'var(--sys-label-tertiary)', padding: '4px' }}
                  >
                    <GripVertical size={18} />
                  </div>
                  <button 
                    onClick={() => toggleTodo(todo.id)}
                    style={{ background: 'none', border: 'none', padding: 0, color: todo.completed ? 'var(--sys-green)' : 'var(--sys-label-tertiary)' }}
                  >
                    {todo.completed ? <CheckCircle2 size={24} /> : <Circle size={24} />}
                  </button>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    {editingId === todo.id ? (
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                        <input 
                          autoFocus
                          type="text" value={editText} onChange={e => setEditText(e.target.value)}
                          style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: 'none', borderRadius: '8px', padding: '8px 12px', color: '#FFF', fontSize: '15px' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <input 
                            type="date" value={editDueDate} onChange={e => setEditDueDate(e.target.value)}
                            style={{ background: 'none', border: 'none', color: 'var(--sys-label-secondary)', fontSize: '11px' }}
                          />
                          <div style={{ display: 'flex', gap: '8px' }}>
                            <button onClick={commitEdit} style={{ background: 'var(--sys-green)', color: '#FFF', border: 'none', padding: '4px 8px', borderRadius: '6px' }}><Check size={14} /></button>
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div onClick={() => startEdit(todo)}>
                        <h3 style={{ 
                          fontSize: '15px', fontWeight: 600, margin: 0, 
                          color: todo.completed ? 'var(--sys-label-tertiary)' : '#FFF',
                          textDecoration: todo.completed ? 'line-through' : 'none'
                        }}>
                          {todo.text}
                        </h3>
                        {todo.dueDate && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '4px', marginTop: '4px' }}>
                            <Calendar size={12} style={{ color: isOverdue(todo) ? 'var(--sys-red)' : 'var(--sys-label-tertiary)' }} />
                            <span style={{ fontSize: '11px', fontWeight: 700, color: isOverdue(todo) ? 'var(--sys-red)' : 'var(--sys-label-secondary)' }}>
                              {new Date(todo.dueDate.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                            </span>
                          </div>
                        )}
                      </div>
                    )}
                  </div>
                  {!todo.completed && (
                    <button onClick={() => deleteTodo(todo.id)} style={{ background: 'none', border: 'none', padding: '8px', color: 'var(--sys-red)', opacity: 0.3 }}>
                      <Trash2 size={18} />
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </main>
      </div>
    </PullToRefresh>
  );
}
