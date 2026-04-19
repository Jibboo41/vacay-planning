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
    <div className="safe-area-inset" style={{ minHeight: '100vh', touchAction: draggingIndex !== null ? 'none' : 'auto' }}>
      {/* Header */}
      <header className="screen-header">
        <button className="header-icon-btn" onClick={() => setSidebarOpen(true)}>
          <Menu size={24} />
        </button>
        <div style={{ flex: 1, textAlign: 'center' }}>
          <h1 className="page-title" style={{ margin: 0 }}>Packing List</h1>
          <div style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, letterSpacing: '0.05em', marginTop: '2px' }}>GEAR & LUGGAGE</div>
        </div>
        <div style={{ width: 44 }} />
      </header>

      <div style={{ padding: '0 24px 12px 24px' }}>
          <p style={{ fontSize: '14px', color: 'var(--sys-label-secondary)', marginTop: '-2px', margin: 0 }}>
            {completedCount} of {packingItems.length} items packed
          </p>
      </div>

      <div style={{ padding: '0 24px 120px 24px' }}>
        {/* New Item Area */}
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
            Add Gear
          </button>
        ) : (
          <div style={{
            background: 'var(--sys-bg-elevated-2)', padding: '24px',
            borderRadius: '24px', border: '1px solid var(--sys-blue)',
            marginBottom: '32px', display: 'flex', flexDirection: 'column', gap: '16px'
          }}>
            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Item Name</label>
              <input
                type="text"
                autoFocus
                value={newItemText}
                onChange={e => setNewItemText(e.target.value)}
                placeholder="Hiking boots, Passport, etc."
                onKeyDown={e => { if (e.key === 'Enter') handleAdd(); }}
                style={{
                  background: 'rgba(255,255,255,0.07)', border: 'none',
                  borderRadius: '10px', padding: '12px 14px', color: '#fff',
                  fontSize: '17px', outline: 'none', width: '100%'
                }}
              />
            </div>

            <div className="edit-field-group" style={{ marginBottom: 0 }}>
              <label className="edit-field-label">Category</label>
              <div style={{ 
                display: 'flex', 
                flexDirection: 'row', 
                background: 'rgba(255,255,255,0.05)', 
                borderRadius: '14px', 
                padding: '4px',
                gap: '4px'
              }}>
                {categories.map(c => {
                  const isActive = newCategory === c;
                  return (
                    <button
                      key={c}
                      type="button"
                      onClick={() => setNewCategory(c)}
                      style={{
                        flex: 1,
                        padding: '10px 4px',
                        borderRadius: '10px',
                        fontSize: '12px',
                        fontWeight: 700,
                        transition: 'all 0.2s ease',
                        background: isActive ? 'var(--sys-blue)' : 'transparent',
                        color: isActive ? '#fff' : 'var(--sys-label-secondary)',
                        boxShadow: isActive ? '0 4px 12px rgba(10, 132, 255, 0.3)' : 'none',
                        border: isActive ? '1px solid rgba(255,255,255,0.2)' : '1px solid transparent'
                      }}
                    >
                      {c}
                    </button>
                  );
                })}
              </div>
            </div>

            <div style={{ display: 'flex', gap: '12px' }}>
              <button 
                onClick={handleAdd}
                disabled={!newItemText.trim()}
                className="btn-glass-blue"
                style={{ flex: 1, padding: '16px', borderRadius: '14px', fontSize: '15px' }}
              >
                Add to List
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

        <div
          style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {packingItems.length === 0 ? (
            <div style={{
              textAlign: 'center', padding: '60px 20px', color: 'var(--sys-label-secondary)',
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px'
            }}>
              <Package size={48} opacity={0.2} />
              <p style={{ fontSize: '15px' }}>Your packing list is empty. Start adding gear!</p>
            </div>
          ) : (
            categories.map(cat => {
              const items = itemsByCategory[cat];
              if (items.length === 0) return null;

              return (
                <div key={cat}>
                  <div style={{ 
                    display: 'flex', alignItems: 'center', gap: '8px', 
                    marginBottom: '14px', paddingLeft: '4px' 
                  }}>
                    <Luggage size={14} color="var(--sys-blue)" />
                    <h3 style={{ 
                      fontSize: '13px', fontWeight: 800, color: 'var(--sys-label-secondary)', 
                      textTransform: 'uppercase', letterSpacing: '0.08em', margin: 0 
                    }}>{cat}</h3>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
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
                          <div
                            style={{ 
                              color: 'var(--sys-label-tertiary)', cursor: 'grab', flexShrink: 0, 
                              paddingTop: isEditing ? '10px' : 0,
                              touchAction: 'none'
                            }}
                            onTouchStart={e => handleGripTouchStart(e, index)}
                          >
                            <GripVertical size={18} />
                          </div>

                          <button
                            onClick={() => togglePackingItem(item.id)}
                            style={{
                              background: 'transparent', border: 'none', padding: 0,
                              color: item.completed ? 'var(--sys-blue)' : 'var(--sys-label-tertiary)',
                              cursor: 'pointer', display: 'flex', alignItems: 'center', flexShrink: 0,
                              paddingTop: isEditing ? '10px' : 0
                            }}
                          >
                            {item.completed ? <CheckCircle2 size={22} /> : <Circle size={22} />}
                          </button>

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
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                    <span style={{ fontSize: '11px', color: 'var(--sys-label-secondary)', fontWeight: 600, marginLeft: '4px' }}>Category:</span>
                                    <div style={{ 
                                        display: 'flex', 
                                        flexDirection: 'row', 
                                        background: 'rgba(255,255,255,0.05)', 
                                        borderRadius: '12px', 
                                        padding: '3px',
                                        gap: '3px'
                                      }}>
                                        {categories.map(c => {
                                          const isActive = editCategory === c;
                                          return (
                                            <button
                                              key={c}
                                              type="button"
                                              onClick={() => setEditCategory(c)}
                                              style={{
                                                flex: 1,
                                                padding: '6px 2px',
                                                borderRadius: '8px',
                                                fontSize: '10px',
                                                fontWeight: 700,
                                                transition: 'all 0.2s ease',
                                                background: isActive ? 'var(--sys-blue)' : 'transparent',
                                                color: isActive ? '#fff' : 'var(--sys-label-secondary)',
                                                border: isActive ? '1px solid rgba(255,255,255,0.1)' : 'none'
                                              }}
                                            >
                                              {c}
                                            </button>
                                          );
                                        })}
                                    </div>
                                </div>
                              </div>
                            ) : (
                              <span style={{
                                fontSize: '16px', color: item.completed ? 'var(--sys-label-tertiary)' : '#fff',
                                textDecoration: item.completed ? 'line-through' : 'none',
                                transition: 'all 0.2s ease', fontWeight: 500,
                                display: 'block', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap'
                              }}>
                                {item.text}
                              </span>
                            )}
                          </div>

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
                                <button onClick={() => startEdit(item)} style={{ background: 'rgba(255,255,255,0.06)', border: 'none', padding: '7px', borderRadius: '9px', color: 'var(--sys-label-secondary)', cursor: 'pointer', display: 'flex' }}>
                                  <Pencil size={16} />
                                </button>
                                <button onClick={() => deletePackingItem(item.id)} style={{ background: 'rgba(255, 69, 58, 0.1)', border: 'none', padding: '7px', borderRadius: '9px', color: '#FF453A', cursor: 'pointer', display: 'flex' }}>
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
