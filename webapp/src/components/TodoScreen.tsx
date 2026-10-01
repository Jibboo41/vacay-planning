import { useMemo, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type ScreenReaderInstructions } from '@dnd-kit/core';
import { SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Check, CheckCircle2, CheckSquare, Circle, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TodoItem } from '../core/models';
import { DEFAULT_TODO_CATEGORY, getTodoCategoryIcon, groupTodosByCategory, listTodoCategories, moveTodo, todoCategoryOf } from '../core/todoCategories';
import { cn } from '../lib/cn';
import { Button, Card, EmptyState, Field, IconButton, Input, ScreenHeader, TextArea } from './ui';
import { deleteWithUndo } from '../store/deleteWithUndo';
import { SortableListItem } from './SortableList';
import TodoCategoryPicker from './TodoCategoryPicker';

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodo, reorderTodos } = useTripStore();
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
  const groups = useMemo(() => groupTodosByCategory(todos), [todos]);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    // Keep the chosen category so several to-dos can be added to it in a row.
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
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    updateTodo(editingId, { text: editText.trim(), dueDate: editDueDate || null, notes: editNotes.trim() || null, category: editCategory });
    setEditingId(null);
  };

  const announcements = useMemo<Announcements>(() => {
    const find = (id: string | number) => todos.find((todo) => todo.id === id);
    const getTodoLabel = (id: string | number) => find(id)?.text ?? 'task';
    const getCategory = (id: string | number) => { const todo = find(id); return todo ? todoCategoryOf(todo) : DEFAULT_TODO_CATEGORY; };
    return {
      onDragStart: ({ active }) => `Picked up ${getTodoLabel(active.id)} from ${getCategory(active.id)}.`,
      onDragOver: ({ active, over }) => over ? `${getTodoLabel(active.id)} is over ${getTodoLabel(over.id)} in ${getCategory(over.id)}.` : undefined,
      onDragEnd: ({ active, over }) => over ? `Moved ${getTodoLabel(active.id)} to ${getCategory(over.id)}, next to ${getTodoLabel(over.id)}.` : `Dropped ${getTodoLabel(active.id)}.`,
      onDragCancel: ({ active }) => `Reordering cancelled for ${getTodoLabel(active.id)}.`,
    };
  }, [todos]);

  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(() => ({
    draggable: 'Press Space or Enter on the reorder button to pick up an item, use arrow keys to move it, then press Space or Enter to drop.',
  }), []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over) return;
    const next = moveTodo(todos, String(active.id), String(over.id));
    if (next) reorderTodos(next);
  };

  const isOverdue = (todo: TodoItem) =>
    !todo.completed &&
    todo.dueDate &&
    new Date(todo.dueDate.replace(/-/g, '/')) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className="safe-area-inset min-h-dvh">
      <ScreenHeader title="Things to Do" subtitle="TRIP CHECKLIST" />

      <div className="px-6 pb-3">
        <p className="-mt-0.5 m-0 text-[14px] text-label-secondary">
          {completedCount} of {todos.length} tasks completed
        </p>
      </div>

      <div className="px-6 pb-[120px]">
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} block size="lg" className="mb-6">
            <Plus size={20} />
            New Todo
          </Button>
        ) : (
          <Card padding="lg" className="mb-8 flex flex-col gap-4 border-sys-blue">
            <Field label="What needs to be done?" className="mb-0">
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  autoFocus
                  value={newTodo}
                  onChange={(e) => setNewTodo(e.target.value)}
                  placeholder="Pack gear, Check in, etc."
                />
              )}
            </Field>

            <div className="edit-field-group mb-0">
              <span id="new-todo-category-label" className="edit-field-label">Category</span>
              <TodoCategoryPicker labelId="new-todo-category-label" value={newCategory} onChange={setNewCategory} options={categoryOptions} />
            </div>

            <Field label="Due Date (Optional)" className="mb-0">
              {(id) => (
                <Input
                  id={id}
                  type="date"
                  value={newDueDate}
                  onChange={(e) => setNewDueDate(e.target.value)}
                  className="scheme-dark"
                />
              )}
            </Field>

            <Field label="Notes (Optional)" className="mb-0">
              {(id) => (
                <TextArea
                  id={id}
                  value={newNotes}
                  onChange={(e) => setNewNotes(e.target.value)}
                  placeholder="Confirmation numbers, packing details, etc."
                  className="min-h-[60px]"
                />
              )}
            </Field>

            <div className="mt-1 flex gap-3">
              <Button onClick={handleAdd} disabled={!newTodo.trim()} className="flex-1">
                Save Task
              </Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-7">
          {todos.length === 0 ? (
            <Card>
              <EmptyState
                icon={<CheckSquare size={32} />}
                title="No tasks yet"
                description="Keep pre-trip errands, reservations, and reminders organized in one checklist."
                action={(
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={18} />
                    Add a task
                  </Button>
                )}
              />
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={{ announcements, screenReaderInstructions }}>
              <SortableContext items={groups.flatMap((group) => group.todos.map((todo) => todo.id))} strategy={verticalListSortingStrategy}>
                {groups.map((group, groupIndex) => {
                  const CategoryIcon = getTodoCategoryIcon(group.category);
                  const done = group.todos.filter((todo) => todo.completed).length;
                  const headingId = `todo-category-${groupIndex}`;
                  return (
                    <section key={group.category.toLowerCase()} aria-labelledby={headingId}>
                      <div className="mb-3 flex items-center gap-2 pl-1">
                        <CategoryIcon size={14} className="text-sys-blue" aria-hidden="true" />
                        <h2 id={headingId} className="m-0 flex-1 text-footnote font-extrabold uppercase tracking-[0.08em] text-label-secondary">{group.category}</h2>
                        <span className="text-caption font-bold text-label-tertiary" aria-label={`${done} of ${group.todos.length} done`}>
                          {done}/{group.todos.length}
                        </span>
                      </div>
                      <div className="flex flex-col gap-2.5">
                {group.todos.map((todo) => {
              const isEditing = editingId === todo.id;

              return (
                <SortableListItem key={todo.id} id={todo.id} disabled={isEditing}>
                  {({ attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, style }) => (
                <Card
                  ref={setNodeRef}
                  style={style}
                  data-todo-item
                  className={cn(
                    'flex gap-3 rounded-2xl border p-3.5 px-3 transition-all duration-150 ease-ios',
                    isEditing ? 'items-start' : 'items-center',
                    'border-white/8',
                    isDragging && 'z-[2] -translate-y-1 scale-[1.02] opacity-40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
                  )}
                >
                  <button
                    ref={setActivatorNodeRef}
                    type="button"
                    aria-label={`Reorder ${todo.text}`}
                    {...attributes}
                    {...listeners}
                    className={cn('drag-handle shrink-0 cursor-grab touch-none text-label-tertiary', isEditing && 'pt-2.5')}
                  >
                    <GripVertical size={18} />
                  </button>

                  <button
                    type="button"
                    aria-pressed={todo.completed}
                    aria-label={todo.completed ? 'Mark task incomplete' : 'Mark task complete'}
                    onClick={() => toggleTodo(todo.id)}
                    className={cn(
                      'flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0',
                      isEditing && 'pt-2.5',
                      todo.completed ? 'text-sys-blue' : 'text-label-tertiary',
                    )}
                  >
                    {todo.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                  </button>

                  <div className="min-w-0 flex-1">
                    {isEditing ? (
                      <div className="flex flex-col gap-2">
                        <Input
                          autoFocus
                          value={editText}
                          onChange={(e) => setEditText(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === 'Enter') commitEdit();
                            if (e.key === 'Escape') setEditingId(null);
                          }}
                        />
                        <div className="flex items-center gap-2">
                          <Input type="date" aria-label="Due date" value={editDueDate} onChange={(e) => setEditDueDate(e.target.value)} className="scheme-dark text-caption" />
                          {editDueDate && (
                            <Button variant="ghost" size="sm" onClick={() => setEditDueDate('')}>
                              Clear
                            </Button>
                          )}
                        </div>
                        <TextArea value={editNotes} onChange={(e) => setEditNotes(e.target.value)} placeholder="Add notes..." className="min-h-[50px]" />
                        <TodoCategoryPicker compact value={editCategory} onChange={setEditCategory} options={categoryOptions} />
                      </div>
                    ) : (
                      <>
                        <span className={cn('block truncate text-[16px] font-medium transition-all duration-200', todo.completed ? 'text-label-tertiary line-through' : 'text-label')}>
                          {todo.text}
                        </span>
                        {todo.dueDate && (
                          <div className={cn('mt-1 text-caption font-bold', isOverdue(todo) ? 'text-sys-red' : 'text-label-secondary')}>
                            {isOverdue(todo) ? '⚠ ' : ''}Due: {new Date(todo.dueDate.replace(/-/g, '/')).toLocaleDateString(undefined, { month: 'short', day: 'numeric', year: 'numeric' })}
                          </div>
                        )}
                        {todo.notes && <div className="mt-1.5 whitespace-pre-wrap text-footnote leading-[1.4] text-label-secondary">{todo.notes}</div>}
                      </>
                    )}
                  </div>

                  <div className="flex shrink-0 items-center gap-1.5">
                    {isEditing ? (
                      <>
                        <IconButton aria-label="Save task" variant="ghost" size="sm" onClick={commitEdit} className="bg-sys-green/15 text-sys-green">
                          <Check size={16} />
                        </IconButton>
                        <IconButton aria-label="Cancel editing task" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                          <X size={16} />
                        </IconButton>
                      </>
                    ) : (
                      <>
                        <IconButton aria-label="Edit task" variant="ghost" size="sm" onClick={() => startEdit(todo)}>
                          <Pencil size={16} />
                        </IconButton>
                        <IconButton aria-label="Delete task" variant="danger" size="sm" onClick={() => deleteWithUndo('todos', todo.id, `"${todo.text}"`)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </Card>
                  )}
                </SortableListItem>
              );
                })}
                      </div>
                    </section>
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
