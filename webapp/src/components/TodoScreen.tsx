import { useRef, useState, type DragEvent, type TouchEvent } from 'react';
import { Check, CheckCircle2, CheckSquare, Circle, GripVertical, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { TodoItem } from '../core/models';
import { cn } from '../lib/cn';
import { Button, Card, Field, IconButton, Input, ScreenHeader, TextArea } from './ui';

export default function TodoScreen() {
  const { todos, addTodo, updateTodo, toggleTodo, deleteTodo, reorderTodos } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTodo, setNewTodo] = useState('');
  const [newDueDate, setNewDueDate] = useState('');
  const [newNotes, setNewNotes] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editNotes, setEditNotes] = useState('');

  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);

  const handleAdd = () => {
    if (!newTodo.trim()) return;
    addTodo(newTodo.trim(), newDueDate || undefined, newNotes.trim() || undefined);
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
  };

  const commitEdit = () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    updateTodo(editingId, { text: editText.trim(), dueDate: editDueDate || null, notes: editNotes.trim() || null });
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
    !todo.completed &&
    todo.dueDate &&
    new Date(todo.dueDate.replace(/-/g, '/')) < new Date(new Date().setHours(0, 0, 0, 0));

  const completedCount = todos.filter((todo) => todo.completed).length;

  return (
    <div className={cn('safe-area-inset min-h-dvh', draggingIndex !== null ? 'touch-none' : 'touch-auto')}>
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

        <div className="flex flex-col gap-2.5" onTouchMove={handleTouchMove} onTouchEnd={handleTouchEnd}>
          {todos.length === 0 ? (
            <Card padding="lg" className="flex flex-col items-center gap-4 text-center text-label-secondary">
              <CheckSquare size={48} className="opacity-20" />
              <p className="text-body">No tasks yet. Stay organized for your trip!</p>
            </Card>
          ) : (
            todos.map((todo, index) => {
              const isEditing = editingId === todo.id;
              const isDragging = draggingIndex === index;
              const isOver = overIndex === index && draggingIndex !== null && draggingIndex !== index;

              return (
                <Card
                  key={todo.id}
                  data-todo-item
                  draggable
                  onDragStart={(e) => handleDragStart(e, index)}
                  onDragEnter={() => handleDragEnter(index)}
                  onDragEnd={handleDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className={cn(
                    'flex gap-3 rounded-2xl border p-3.5 px-3 transition-all duration-150 ease-ios',
                    isEditing ? 'items-start' : 'items-center',
                    isOver ? 'border-sys-blue/40 bg-sys-blue/10' : 'border-white/8',
                    isDragging && 'z-[2] -translate-y-1 scale-[1.02] opacity-40 shadow-[0_8px_32px_rgba(0,0,0,0.3)]',
                  )}
                >
                  <button
                    type="button"
                    aria-label="Drag to reorder"
                    className={cn('drag-handle shrink-0 cursor-grab touch-none text-label-tertiary', isEditing && 'pt-2.5')}
                    onTouchStart={(e) => handleGripTouchStart(e, index)}
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
                        <IconButton aria-label="Delete task" variant="danger" size="sm" onClick={() => deleteTodo(todo.id)}>
                          <Trash2 size={16} />
                        </IconButton>
                      </>
                    )}
                  </div>
                </Card>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
}
