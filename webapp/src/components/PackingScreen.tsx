import { useMemo, useState } from 'react';
import { closestCenter, DndContext, KeyboardSensor, PointerSensor, TouchSensor, useSensor, useSensors, type Announcements, type DragEndEvent, type ScreenReaderInstructions } from '@dnd-kit/core';
import { arrayMove, SortableContext, sortableKeyboardCoordinates, verticalListSortingStrategy } from '@dnd-kit/sortable';
import { Check, CheckCircle2, Circle, GripVertical, Luggage, Package, Pencil, Plus, Trash2, X } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { PackingItem } from '../core/models';
import { cn } from '../lib/cn';
import { Button, Card, EmptyState, Field, IconButton, Input, ScreenHeader } from './ui';
import { deleteWithUndo } from '../store/deleteWithUndo';
import { SortableListItem } from './SortableList';

type PackingCategory = PackingItem['category'];

export default function PackingScreen() {
  const { packingItems, addPackingItem, updatePackingItem, togglePackingItem, reorderPackingItems } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState<PackingCategory>('Luggage');
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<PackingCategory>('Luggage');

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 120, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const categories: PackingCategory[] = ['Luggage', 'Carry-on', 'Other'];

  const handleAdd = () => {
    if (!newItemText.trim()) return;
    addPackingItem(newItemText.trim(), newCategory);
    setNewItemText('');
    setShowAddForm(false);
  };

  const startEdit = (item: PackingItem) => {
    setEditingId(item.id);
    setEditText(item.text);
    setEditCategory(item.category);
  };

  const commitEdit = () => {
    if (!editingId || !editText.trim()) {
      setEditingId(null);
      return;
    }
    updatePackingItem(editingId, { text: editText.trim(), category: editCategory });
    setEditingId(null);
  };

  const announcements = useMemo<Announcements>(() => {
    const getPackingLabel = (id: string | number) => packingItems.find((item) => item.id === id)?.text ?? 'packing item';
    return {
      onDragStart: ({ active }) => `Picked up ${getPackingLabel(active.id)}.`,
      onDragOver: ({ active, over }) => over ? `${getPackingLabel(active.id)} is over ${getPackingLabel(over.id)}.` : undefined,
      onDragEnd: ({ active, over }) => over ? `Moved ${getPackingLabel(active.id)} before ${getPackingLabel(over.id)}.` : `Dropped ${getPackingLabel(active.id)}.`,
      onDragCancel: ({ active }) => `Reordering cancelled for ${getPackingLabel(active.id)}.`,
    };
  }, [packingItems]);

  const screenReaderInstructions = useMemo<ScreenReaderInstructions>(() => ({
    draggable: 'Press Space or Enter on the reorder button to pick up an item, use arrow keys to move it, then press Space or Enter to drop.',
  }), []);

  const handleDragEnd = ({ active, over }: DragEndEvent) => {
    if (!over || active.id === over.id) return;
    const oldIndex = packingItems.findIndex((item) => item.id === active.id);
    const newIndex = packingItems.findIndex((item) => item.id === over.id);
    if (oldIndex === -1 || newIndex === -1) return;
    reorderPackingItems(arrayMove(packingItems, oldIndex, newIndex));
  };

  const completedCount = packingItems.filter((item) => item.completed).length;

  const itemsByCategory = useMemo(() => {
    const map: Record<PackingCategory, PackingItem[]> = { Luggage: [], 'Carry-on': [], Other: [] };
    packingItems.forEach((item) => {
      map[item.category].push(item);
    });
    return map;
  }, [packingItems]);

  const renderCategoryButtons = (value: PackingCategory, onChange: (category: PackingCategory) => void, compact = false) => (
    <div className={cn('flex flex-row bg-white/5', compact ? 'gap-[3px] rounded-control p-[3px]' : 'gap-1 rounded-[14px] p-1')}>
      {categories.map((category) => {
        const isActive = value === category;
        return (
          <Button
            key={category}
            variant={isActive ? 'primary' : 'ghost'}
            size="sm"
            aria-pressed={isActive}
            onClick={() => onChange(category)}
            className={cn('flex-1', compact ? 'px-0.5 py-1.5 text-caption' : 'px-1 py-2.5 text-caption')}
          >
            {category}
          </Button>
        );
      })}
    </div>
  );

  return (
    <div className="safe-area-inset min-h-dvh">
      <ScreenHeader title="Packing List" subtitle="GEAR & LUGGAGE" />

      <div className="px-6 pb-3">
        <p className="-mt-0.5 m-0 text-[14px] text-label-secondary">
          {completedCount} of {packingItems.length} items packed
        </p>
      </div>

      <div className="px-6 pb-[120px]">
        {!showAddForm ? (
          <Button onClick={() => setShowAddForm(true)} block size="lg" className="mb-6">
            <Plus size={20} />
            Add Gear
          </Button>
        ) : (
          <Card padding="lg" className="mb-8 flex flex-col gap-4 border-sys-blue">
            <Field label="Item Name" className="mb-0">
              {(id) => (
                <Input
                  id={id}
                  type="text"
                  autoFocus
                  value={newItemText}
                  onChange={(e) => setNewItemText(e.target.value)}
                  placeholder="Hiking boots, Passport, etc."
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') handleAdd();
                  }}
                />
              )}
            </Field>

            <Field label="Category" className="mb-0">
              {(id) => <div id={id}>{renderCategoryButtons(newCategory, setNewCategory)}</div>}
            </Field>

            <div className="flex gap-3">
              <Button onClick={handleAdd} disabled={!newItemText.trim()} className="flex-1">
                Add to List
              </Button>
              <Button variant="secondary" onClick={() => setShowAddForm(false)} className="flex-1">
                Cancel
              </Button>
            </div>
          </Card>
        )}

        <div className="flex flex-col gap-8">
          {packingItems.length === 0 ? (
            <Card>
              <EmptyState
                icon={<Package size={32} />}
                title="Your packing list is empty"
                description="Add luggage, carry-on, and other gear so nothing gets left behind."
                action={(
                  <Button onClick={() => setShowAddForm(true)}>
                    <Plus size={18} />
                    Add an item
                  </Button>
                )}
              />
            </Card>
          ) : (
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd} accessibility={{ announcements, screenReaderInstructions }}>
              <SortableContext items={categories.flatMap((category) => itemsByCategory[category].map((item) => item.id))} strategy={verticalListSortingStrategy}>
                {categories.map((category) => {
              const items = itemsByCategory[category];
              if (items.length === 0) return null;

              return (
                <div key={category}>
                  <div className="mb-3.5 flex items-center gap-2 pl-1">
                    <Luggage size={14} className="text-sys-blue" />
                    <h3 className="m-0 text-footnote font-extrabold uppercase tracking-[0.08em] text-label-secondary">{category}</h3>
                  </div>

                  <div className="flex flex-col gap-2.5">
                    {items.map((item) => {
                      const isEditing = editingId === item.id;

                      return (
                        <SortableListItem key={item.id} id={item.id} disabled={isEditing}>
                          {({ attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, style }) => (
                        <Card
                          ref={setNodeRef}
                          style={style}
                          data-packing-item
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
                            aria-label={`Reorder ${item.text}`}
                            {...attributes}
                            {...listeners}
                            className={cn('drag-handle shrink-0 cursor-grab touch-none text-label-tertiary', isEditing && 'pt-2.5')}
                          >
                            <GripVertical size={18} />
                          </button>

                          <button type="button" aria-pressed={item.completed} aria-label={item.completed ? 'Mark item unpacked' : 'Mark item packed'} onClick={() => togglePackingItem(item.id)} className={cn('flex shrink-0 cursor-pointer items-center border-0 bg-transparent p-0', isEditing && 'pt-2.5', item.completed ? 'text-sys-blue' : 'text-label-tertiary')}>
                            {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
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
                                <div className="flex flex-col gap-1.5">
                                  <span className="ml-1 text-caption font-semibold text-label-secondary">Category:</span>
                                  {renderCategoryButtons(editCategory, setEditCategory, true)}
                                </div>
                              </div>
                            ) : (
                              <span className={cn('block truncate text-[16px] font-medium transition-all duration-200', item.completed ? 'text-label-tertiary line-through' : 'text-label')}>
                                {item.text}
                              </span>
                            )}
                          </div>

                          <div className="flex shrink-0 items-center gap-1.5">
                            {isEditing ? (
                              <>
                                <IconButton aria-label="Save packing item" variant="ghost" size="sm" onClick={commitEdit} className="bg-sys-green/15 text-sys-green">
                                  <Check size={16} />
                                </IconButton>
                                <IconButton aria-label="Cancel editing packing item" variant="ghost" size="sm" onClick={() => setEditingId(null)}>
                                  <X size={16} />
                                </IconButton>
                              </>
                            ) : (
                              <>
                                <IconButton aria-label="Edit packing item" variant="ghost" size="sm" onClick={() => startEdit(item)}>
                                  <Pencil size={16} />
                                </IconButton>
                                <IconButton aria-label="Delete packing item" variant="danger" size="sm" onClick={() => deleteWithUndo('packingItems', item.id, `"${item.text}"`)}>
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
                </div>
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
