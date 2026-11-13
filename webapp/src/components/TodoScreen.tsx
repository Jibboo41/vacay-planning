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
import { useTodoDrag } from './useTodoDrag';

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
    () => groupTodosByCategory(todos).flatMap(group =>
      group.todos.map((todo, todoIndex) => ({
        todo,
        group,
        isFirstInGroup: todoIndex === 0,
      }))),
    [todos],
  );

  const headerRef = useRef<HTMLElement>(null);
  const { activeId: draggingId, overId, startDrag } = useTodoDrag({
    topBoundaryRef: headerRef,
    onDrop: (activeId, targetId) => {
      const reordered = moveTodo(todos, activeId, targetId);
      if (reordered) reorderTodos(reordered);
    },
  });
  // moveTodo lands the item after the target when moving down the list, before it when moving up.
  const dragFromIndex = draggingId ? groupedTodoRows.findIndex(row => row.todo.id === draggingId) : -1;
  const dragToIndex = overId ? groupedTodoRows.findIndex(row => row.todo.id === overId) : -1;
  const dropPosition = dragFromIndex < dragToIndex ? 'after' : 'before';

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

  const isOverdue = (todo: TodoItem) =>
    !todo.completed && todo.dueDate &&
    new Date(todo.dueDate.replace(/-/g, '/')) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedCount = todos.filter(t => t.completed).length;

  return (
    <div className="screen safe-area-inset">
      {/* Header */}
      <header ref={headerRef} className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Things to Do</h1>
          <p className="page-subtitle">{completedCount} of {todos.length} tasks completed</p>
        </div>
      </header>

      <div className="screen-body">
        {/* New Todo Area */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn--tonal btn--lg btn--block screen-action"
          >
            <Plus size={20} />
            New Todo
          </button>
        ) : (
          <div className="form-card">
            <div className="edit-field-group">
              <label className="edit-field-label">What needs to be done?</label>
              <input
                type="text"
                autoFocus
                value={newTodo}
                onChange={e => setNewTodo(e.target.value)}
                placeholder="Pack gear, Check in, etc."
                className="edit-field-input"
              />
            </div>

            <div className="edit-field-group">
              <span id="new-todo-category-label" className="edit-field-label">Category</span>
              <TodoCategoryPicker
                labelId="new-todo-category-label"
                value={newCategory}
                onChange={setNewCategory}
                options={categoryOptions}
              />
            </div>

            {/* The clipping wrappers keep iOS Safari's date input from overflowing the card. */}
            <div className="edit-field-group" style={{ width: '100%', overflow: 'hidden' }}>
              <label className="edit-field-label">Due Date (Optional)</label>
              <div style={{ borderRadius: '12px', overflow: 'hidden', width: '100%' }}>
                <input
                  type="date"
                  value={newDueDate}
                  onChange={e => setNewDueDate(e.target.value)}
                  className="edit-field-input"
                  style={{ display: 'block', margin: 0 }}
                />
              </div>
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">Notes (Optional)</label>
              <textarea
                value={newNotes}
                onChange={e => setNewNotes(e.target.value)}
                placeholder="Confirmation numbers, packing details, etc."
                className="edit-field-input"
              />
            </div>

            <div className="form-actions">
              <button
                onClick={handleAdd}
                disabled={!newTodo.trim()}
                className="btn btn--primary"
              >
                Save Task
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

        {/* Todo List */}
        <div className="list-stack">
          {todos.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><CheckSquare size={26} /></div>
              <p className="empty-state__text">No tasks yet. Stay organized for your trip!</p>
            </div>
          ) : (
            groupedTodoRows.map(({ todo, group, isFirstInGroup }) => {
              const isEditing = editingId === todo.id;
              const isDragging = draggingId === todo.id;
              const isOver = overId === todo.id && draggingId !== null && draggingId !== todo.id;
              const CategoryIcon = getTodoCategoryIcon(group.category);
              const completedInGroup = group.todos.filter(groupTodo => groupTodo.completed).length;

              return (
                <Fragment key={todo.id}>
                  {isFirstInGroup && (
                    <div className="section-heading">
                      <CategoryIcon size={15} aria-hidden="true" />
                      <h2 className="section-heading__label">
                        {group.category}
                      </h2>
                      <span
                        className="section-heading__meta"
                        aria-label={`${completedInGroup} of ${group.todos.length} done`}
                      >
                        {completedInGroup}/{group.todos.length}
                      </span>
                    </div>
                  )}
                  <div
                    data-todo-item
                    data-todo-id={todo.id}
                    onPointerDown={isEditing ? undefined : event => startDrag(event, todo.id)}
                    className={`card list-row${isEditing ? ' list-row--editing' : ''}${isDragging ? ' list-row--dragging' : ''}${isOver ? ' list-row--drop-target' : ''}`}
                  >
                  {isOver && (
                    <span className={`todo-drop-indicator todo-drop-indicator--${dropPosition}`} aria-hidden="true" />
                  )}
                  {/* Grip */}
                  <div
                    data-drag-handle
                    className={`todo-drag-handle ${isEditing ? 'todo-drag-handle--disabled' : ''}`}
                    title={isEditing ? undefined : 'Drag to reorder'}
                  >
                    <GripVertical size={18} aria-hidden="true" />
                  </div>

                  {/* Check */}
                  <button
                    onClick={() => toggleTodo(todo.id)}
                    className={`check-toggle${todo.completed ? ' check-toggle--checked' : ''}`}
                  >
                    {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  {/* Content / Edit area */}
                  <div className="list-row__main">
                    {isEditing ? (
                      <div className="list-row__editor">
                        <input
                          autoFocus
                          value={editText}
                          onChange={e => setEditText(e.target.value)}
                          onKeyDown={e => { if (e.key === 'Enter') commitEdit(); if (e.key === 'Escape') setEditingId(null); }}
                          className="text-input"
                        />
                        <div className="list-row__due">
                          <Calendar size={13} />
                          <span>Due:</span>
                          <input
                            type="date"
                            value={editDueDate}
                            onChange={e => setEditDueDate(e.target.value)}
                            className="text-input text-input--sm"
                          />
                          {editDueDate && (
                            <button onClick={() => setEditDueDate('')} className="btn btn--ghost btn--sm">Clear</button>
                          )}
                        </div>
                        <textarea
                          value={editNotes}
                          onChange={e => setEditNotes(e.target.value)}
                          placeholder="Add notes..."
                          className="text-input"
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
                        <span className={`list-row__title${todo.completed ? ' list-row__title--done' : ''}`}>
                          {todo.text}
                        </span>
                        {todo.dueDate && (
                          <div className={`list-row__meta${isOverdue(todo) ? ' list-row__meta--alert' : ''}`}>
                            {isOverdue(todo) ? '⚠ ' : ''}Due: {new Date(todo.dueDate.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {todo.notes && (
                          <div className="list-row__note">
                            {todo.notes}
                          </div>
                        )}
                      </>
                    )}
                  </div>

                  {/* Actions */}
                  <div className="list-row__actions">
                    {isEditing ? (
                      <>
                        <button onClick={commitEdit} className="icon-btn icon-btn--sm icon-btn--success" aria-label="Save">
                          <Check size={16} />
                        </button>
                        <button onClick={() => setEditingId(null)} className="icon-btn icon-btn--sm" aria-label="Cancel">
                          <X size={16} />
                        </button>
                      </>
                    ) : (
                      <>
                        <button onClick={() => startEdit(todo)} className="icon-btn icon-btn--sm" aria-label="Edit">
                          <Pencil size={16} />
                        </button>
                        <button onClick={() => { if (window.confirm(`Delete "${todo.text}"?`)) deleteTodo(todo.id); }} aria-label="Delete" className="icon-btn icon-btn--sm icon-btn--danger">
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
