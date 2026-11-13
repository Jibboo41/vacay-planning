import { useState, useRef, useMemo } from 'react';
import { CheckCircle2, Circle, Plus, Trash2, Luggage, Menu, GripVertical, Pencil, X, Check, Package } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { PackingItem } from '../core/models';

type PackingCategory = PackingItem['category'];

export default function PackingScreen() {
  const { packingItems, addPackingItem, updatePackingItem, togglePackingItem, deletePackingItem, reorderPackingItems, setSidebarOpen } = useTripStore();
  const [showAddForm, setShowAddForm] = useState(false);
  const [newItemText, setNewItemText] = useState('');
  const [newCategory, setNewCategory] = useState<PackingCategory>('Luggage');
  
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editText, setEditText] = useState('');
  const [editCategory, setEditCategory] = useState<PackingCategory>('Luggage');

  // Drag state
  const [draggingIndex, setDraggingIndex] = useState<number | null>(null);
  const [overIndex, setOverIndex] = useState<number | null>(null);
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);
  const touchDragIndex = useRef<number | null>(null);

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
    if (!editingId || !editText.trim()) { setEditingId(null); return; }
    updatePackingItem(editingId, { text: editText.trim(), category: editCategory });
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
      const ordered = [...packingItems];
      const [dragged] = ordered.splice(dragItem.current, 1);
      ordered.splice(dragOverItem.current, 0, dragged);
      reorderPackingItems(ordered);
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
    setDraggingIndex(index);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (touchDragIndex.current === null) return;
    if (e.cancelable) e.preventDefault();
    const touch = e.touches[0];
    const target = document.elementFromPoint(touch.clientX, touch.clientY);
    const itemEl = target?.closest('[data-packing-item]');
    
    if (itemEl) {
      const elements = Array.from(document.querySelectorAll('[data-packing-item]'));
      const newOver = elements.indexOf(itemEl);
      if (newOver !== -1 && newOver !== overIndex) {
        setOverIndex(newOver);
      }
    }
  };

  const handleTouchEnd = () => {
    if (touchDragIndex.current !== null && overIndex !== null && overIndex !== touchDragIndex.current) {
      const ordered = [...packingItems];
      const [dragged] = ordered.splice(touchDragIndex.current, 1);
      ordered.splice(overIndex, 0, dragged);
      reorderPackingItems(ordered);
    }
    touchDragIndex.current = null;
    setDraggingIndex(null);
    setOverIndex(null);
  };

  const completedCount = packingItems.filter(t => t.completed).length;

  const categories: PackingCategory[] = ['Luggage', 'Carry-on', 'Other'];

  // Flattened but grouped for rendering if we want drag/drop across the whole trip
  // For now, I'll just render them in the order they are in the store, but grouped visually
  const itemsByCategory = useMemo(() => {
    const map: Record<PackingCategory, PackingItem[]> = {
      'Luggage': [],
      'Carry-on': [],
      'Other': []
    };
    packingItems.forEach(item => {
      map[item.category].push(item);
    });
    return map;
  }, [packingItems]);

  return (
    <div className="screen safe-area-inset" style={{ touchAction: draggingIndex !== null ? 'none' : 'auto' }}>
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn legacy-menu-button" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div className="screen-header__titles">
          <h1 className="page-title">Packing List</h1>
          <p className="page-subtitle">{completedCount} of {packingItems.length} items packed</p>
        </div>
      </header>

      <div className="screen-body">
        {/* New Item Area */}
        {!showAddForm ? (
          <button
            onClick={() => setShowAddForm(true)}
            className="btn btn--tonal btn--lg btn--block screen-action"
          >
            <Plus size={20} />
            Add Gear
          </button>
        ) : (
          <div className="form-card">
            <div className="edit-field-group">
              <label className="edit-field-label">Item Name</label>
              <input
                type="text"
                autoFocus
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Hiking boots, Passport, etc."
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                className="edit-field-input"
              />
            </div>

            <div className="edit-field-group">
              <label className="edit-field-label">Category</label>
              <div className="segmented">
                {categories.map(c => {
                  const isActive = newCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      aria-pressed={isActive}
                      onClick={() => setNewCategory(c)}
                      className="segmented__item"
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="form-actions">
              <button
                onClick={handleAdd}
                disabled={!newItemText.trim()}
                className="btn btn--primary"
              >
                Add to List
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

        <div
          className="list-sections"
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {packingItems.length === 0 ? (
            <div className="empty-state">
              <div className="empty-state__icon"><Package size={26} /></div>
              <p className="empty-state__text">Your packing list is empty. Start adding gear!</p>
            </div>
          ) : (
            categories.map(cat => {
              const items = itemsByCategory[cat];
              if (items.length === 0) return null;

              return (
                <div key={cat}>
                  <div className="section-heading">
                    <Luggage size={15} aria-hidden="true" />
                    <h3 className="section-heading__label">{cat}</h3>
                    <span className="section-heading__meta" aria-label={`${items.filter(item => item.completed).length} of ${items.length} packed`}>
                      {items.filter(item => item.completed).length}/{items.length}
                    </span>
                  </div>

                  <div className="list-stack">
                    {items.map(item => {
                      // We need the absolute index in packingItems for drag/drop
                      const index = packingItems.findIndex(p => p.id === item.id);
                      const isEditing = editingId === item.id;
                      const isDragging = draggingIndex === index;
                      const isOver = overIndex === index && draggingIndex !== null && draggingIndex !== index;

                      return (
                        <div
                          key={item.id}
                          data-packing-item
                          draggable
                          onDragStart={(e) => handleDragStart(e, index)}
                          onDragEnter={() => handleDragEnter(index)}
                          onDragEnd={handleDragEnd}
                          onDragOver={e => e.preventDefault()}
                          className={`card list-row${isEditing ? ' list-row--editing' : ''}${isDragging ? ' list-row--lifted' : ''}${isOver ? ' list-row--drop-target' : ''}`}
                        >
                          <div
                            className="list-row__grip"
                            onTouchStart={e => handleGripTouchStart(e, index)}
                          >
                            <GripVertical size={18} />
                          </div>

                          <button
                            onClick={() => togglePackingItem(item.id)}
                            className={`check-toggle${item.completed ? ' check-toggle--checked' : ''}`}
                          >
                            {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                          </button>

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
                                <div className="segmented" role="group" aria-label="Category">
                                  {categories.map(c => {
                                    const isActive = editCategory === c;
                                    return (
                                      <button
                                        key={c}
                                        type="button"
                                        aria-pressed={isActive}
                                        onClick={() => setEditCategory(c)}
                                        className="segmented__item segmented__item--sm"
                                      >
                                        {c}
                                      </button>
                                    );
                                  })}
                                </div>
                              </div>
                            ) : (
                              <span className={`list-row__title list-row__title--truncate${item.completed ? ' list-row__title--done' : ''}`}>
                                {item.text}
                              </span>
                            )}
                          </div>

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
                                <button onClick={() => startEdit(item)} className="icon-btn icon-btn--sm" aria-label="Edit">
                                  <Pencil size={16} />
                                </button>
                                <button onClick={() => deletePackingItem(item.id)} className="icon-btn icon-btn--sm icon-btn--danger" aria-label="Delete">
                                  <Trash2 size={16} />
                                </button>
                              </>
                            )}
                          </div>
                        </div>
                      );
                    })}
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
