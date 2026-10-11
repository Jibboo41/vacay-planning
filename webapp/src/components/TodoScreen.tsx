import { Fragment, useMemo, useRef, useState } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, CheckSquare, Menu, Calendar, GripVertical, Pencil, X, Check } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TodoItem } from '../core/models';
import {
  DEFAULT_TODO_CATEGORY,
  getTodoCategoryIcon,
  groupTodosByCategory,
  listTodoCategories,
  moveTodo,
  todoCategoryOf,
} from '../core/todoCategories';
import TodoCategoryPicker from './TodoCategoryPicker';

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos, setSidebarOpen } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [newCategory, setNewCategory] = useState(DEFAULT_TODO_CATEGORY);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');
  const [editCategory, setEditCategory] = useState(DEFAULT_TODO_CATEGORY);

  const categoryOptions = useMemo(() => listTodoCategories(todos), [todos]);
  const groupedTodoRows = useMemo(
    () => groupTodosByCategory(todos).flatMap((group, groupIndex) =>
      group.todos.map((todo, todoIndex) => ({
        todo,
        group,
        groupIndex,
        isFirstInGroup: todoIndex === 0,
      }))),
    [todos],
  );

  // Drag state
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [overId, setOverId] = useState<string | null>(null);
  const dragItem = useRef<string | null>(null);
  const dragOverItem = useRef<string | null>(null);
  const touchDragId = useRef<string | null>(null);

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim(), newDueDate || undefined, newNotes.trim() || undefined, newCategory);
    setNewTodo('');
    setNewDueDate('');
    setNewNotes('');
    setShowAddForm(false);
  };

  const startEdit = (todo: TodoItem) => {
    setEditingId(todo.id);
    setEditText(todo.text);
    setEditDueDate(todo.dueDate || '');
    setEditNotes(todo.notes || '');
    setEditCategory(todoCategoryOf(todo));
  };

  const commitEdit = () => {
    if (!editingId || !editText.trim()) { setEditingId(null); return; }
    updateTodo(editingId, {
      text: editText.trim(),
      dueDate: editDueDate || null,
      notes: editNotes.trim() || null,
      category: editCategory,
    });
    setEditingId(null);
  };

  // Mouse drag handlers
  const handleDragStart = (e: React.DragEvent, id: string) => {
    dragItem.current = id;
    setDraggingId(id);
    e.dataTransfer.effectAllowed = 'move';
  };
  const handleDragEnter = (id: string) => {
    dragOverItem.current = id;
    setOverId(id);
  };
  const handleDragEnd = () => {
    if (dragItem.current && dragOverItem.current) {
      const reordered = moveTodo(todos, dragItem.current, dragOverItem.current);
      if (reordered) reorderTodos(reordered);
    }
    dragItem.current = null;
    dragOverItem.current = null;
    setDraggingId(null);
    setOverId(null);
  };

  // Touch drag handlers
  const handleGripTouchStart = (e: React.TouchEvent, id: string) => {
    e.stopPropagation();
    touchDragId.current = id;
    setDraggingId(id);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!touchDragId.current) return;
    if (e.cancelable) e.preventDefault(); // Prevent scrolling on iOS during drag
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = target?.closest<HTMLElement>('[data-todo-id]');
    const nextOverId = itemEl?.dataset.todoId;
    
    if (nextOverId && nextOverId !== overId) {
      dragOverItem.current = nextOverId;
      setOverId(nextOverId);
      if ('vibrate' in navigator) navigator.vibrate(5);
    }
  };

  const handleTouchEnd = () => {
    if (touchDragId.current && dragOverItem.current) {
      const reordered = moveTodo(todos, touchDragId.current, dragOverItem.current);
      if (reordered) reorderTodos(reordered);
    }
    touchDragId.current = null;
    dragOverItem.current = null;
    setDraggingId(null);
    setOverId(null);
  };

  const isOverdue = (todo: TodoItem) =>
    !todo.completed && todo.dueDate &&
    new Date(todo.dueDate.replace(/-/g, '/')) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="safe-area-inset" style={{ minHeight: '100vh', touchAction: draggingId !== null ? 'none' : 'auto' }}>
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Things to Do</h1>
          <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>TRIP CHECKLIST</div>
        </div>
      </header>
      <div style={{ padding: '0 24px 12px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {completedCount} of {todos.length} tasks completed
          </p>
      </div>

      <div style={{ padding: '0 24px 120px 24px' }}>
        {/* New Todo Area */}
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
            New Todo
          </button>
        ) : (
          <div style={{
            background: 'var(--sys-bg-elevated-2)', padding: '24px',
            borderRadius: '24px', border: '1px solid var(--sys-blue)',
            marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">What needs to be done?</label>
              <input
                type="text"
                autoFocus
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Pack gear, Check in, etc."
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none',
                  borderRadius: '10px', padding: '12px 14px', color: '#fff',
                  fontSize: '17px', outline: 'none', width: '100%'
                }}
              />
            </div>

            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <span id="new-todo-category-label" className="edit-field-label">Category</span>
              <TodoCategoryPicker
                labelId="new-todo-category-label"
                value={newCategory}
                onChange={setNewCategory}
                options={categoryOptions}
              />
            </div>

            <div className="edit-field-group" style={{ marginBottom: 0, width: '100%', overflow: 'hidden' }}>
              <label className="edit-field-label">Due Date (Optional)</label>
              <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  style={{
                    background: 'rgba(255,255,255,0.07)', border: '1px solid rgba(255,255,255,0.1)',
                    borderRadius: '12px', padding: '14px 16px', color: '#fff',
                    fontSize: '16px', colorScheme: 'dark', width: '100%',
                    boxSizing: 'border-box', display: 'block', margin: 0
                  }}
                />
              </div>
            </div>
            
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Notes (Optional)</label>
              <textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Confirmation numbers, packing details, etc."
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none',
                  borderRadius: '10px', padding: '12px 14px', color: '#fff',
                  fontSize: '15px', outline: 'none', width: '100%', minHeight: '60px',
                  resize: 'vertical', display: 'block', boxSizing: 'border-box'
                }}
              />
            </div>

            <div style={{ display: 'flex', gap: '12px', marginTop: '4px' }}>
              <button 
                onClick={handleAdd}
                disabled={!newTodo.trim()}
                className="btn-glass-blue"
                style={{ flex: 1, padding: '16px', borderRadius: '14px', fontSize: '15px' }}
              >
                Save Task
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
            groupedTodoRows.map(({ todo, group, groupIndex, isFirstInGroup }) => {
              const isEditing = editingId === todo.id;
              const isDragging = draggingId === todo.id;
              const isOver = overId === todo.id && draggingId !== null && draggingId !== todo.id;
              const CategoryIcon = getTodoCategoryIcon(group.category);
              const completedInGroup = group.todos.filter(groupTodo => groupTodo.completed).length;

              return (
                <Fragment key={todo.id}>
                  {isFirstInGroup && (
                    <div
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: '8px',
                        padding: '0 4px',
                        marginTop: groupIndex === 0 ? 0 : '18px',
                        marginBottom: '2px',
                      }}
                    >
                      <CategoryIcon size={15} color="var(--sys-blue)" aria-hidden="true" />
                      <h2 style={{
                        flex: 1,
                        margin: 0,
                        fontSize: '12px',
                        fontWeight: 800,
                        letterSpacing: '0.08em',
                        textTransform: 'uppercase',
                        color: 'var(--sys-label-secondary)',
                      }}>
                        {group.category}
                      </h2>
                      <span
                        aria-label={`${completedInGroup} of ${group.todos.length} done`}
                        style={{ fontSize: '11px', fontWeight: 700, color: 'var(--sys-label-tertiary)' }}
                      >
                        {completedInGroup}/{group.todos.length}
                      </span>
                    </div>
                  )}
                  <div
                    data-todo-item
                    data-todo-id={todo.id}
                    draggable={!isEditing}
                    onDragStart={(e) => handleDragStart(e, todo.id)}
                    onDragEnter={() => handleDragEnter(todo.id)}
                    onDragEnd={handleDragEnd}
                    onDragOver={e => e.preventDefault()}
                    className="glass-card"
                    style={{
                      display: 'flex', alignItems: isEditing ? 'flex-start' : 'center', gap: '12px',
                      padding: '14px 12px',
                      borderRadius: '16px',
                      background: isOver ? 'rgba(10,132,255,0.1)' : undefined,
                      border: isOver ? '1px solid rgba(10,132,255,0.4)' : '1px solid rgba(255,255,255,0.08)',
                      transition: 'all 0.15s ease',
                      opacity: isDragging ? 0.4 : 1,
                      transform: isDragging ? 'scale(1.02) translateY(-4px)' : 'none',
                      boxShadow: isDragging ? '0 8px 32px rgba(0,0,0,0.3)' : undefined,
                      zIndex: isDragging ? 2 : 1
                    }}
                  >
                  {/* Grip */}
                  <div
                    style={{ 
                      color: 'var(--sys-label-tertiary)', cursor: 'grab', flexShrink: 0, 
                      paddingTop: isEditing ? '10px' : 0,
                      touchAction: 'none' // Important for iOS dragging
                    }}
                    onTouchStart={e => handleGripTouchStart(e, todo.id)}
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
                        <textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="Add notes..."
                          style={{
                            background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)',
                            borderRadius: '8px', padding: '8px 10px', color: '#fff',
                            fontSize: '14px', outline: 'none', width: '100%', minHeight: '50px',
                            resize: 'vertical', marginTop: '2px', boxSizing: 'border-box'
                          }}
                        />
                        <TodoCategoryPicker
                          compact
                          value={editCategory}
                          onChange={setEditCategory}
                          options={categoryOptions}
                        />
                      </div>
                    ) : (
                      <>
                        <span style={{
                          fontSize: '16px', color: todo.completed ? 'var(--sys-label-tertiary)' : '#fff',
                          textDecoration: todo.completed ? 'line-through' : 'none',
                          transition: 'all 0.2s ease', fontWeight: 500,
                          display: 'block', wordBreak: 'break-word', overflowWrap: 'anywhere'
                        }}>
                          {todo.text}
                        </span>
                        {todo.dueDate && (
                          <div style={{
                            fontSize: '11px', marginTop: '4px', fontWeight: 700,
                            color: isOverdue(todo) ? 'var(--sys-red)' : 'var(--sys-label-secondary)'
                          }}>
                            {isOverdue(todo) ? '⚠ ' : ''}Due: {new Date(todo.dueDate.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {todo.notes && (
                          <div style={{
                            fontSize: '13px', marginTop: '6px', color: 'var(--sys-label-secondary)',
                            lineHeight: '1.4', whiteSpace: 'pre-wrap', wordBreak: 'break-word', overflowWrap: 'anywhere'
                          }}>
                            {todo.notes}
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
                        <button onClick={() => { if (window.confirm(`Delete "${todo.text}"?`)) deleteTodo(todo.id); }} aria-label="Delete" style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', padding: '7px', borderRadius: '9px', color: '#FF453A', cursor: 'pointer', display: 'flex' }}>
                          <Trash2 size={16} />
                        </button>
                      </>
                    )}
                  </div>
                  </div>
                </Fragment>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
