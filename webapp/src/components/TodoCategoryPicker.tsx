import { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import {
  DEFAULT_TODO_CATEGORY,
  getTodoCategoryIcon,
  MAX_TODO_CATEGORY_LENGTH,
  normalizeTodoCategory,
} from '../core/todoCategories';

interface TodoCategoryPickerProps {
  value: string;
  onChange: (category: string) => void;
  options: string[];
  compact?: boolean;
  labelId?: string;
}

export default function TodoCategoryPicker({
  value,
  onChange,
  options,
  compact = false,
  labelId,
}: TodoCategoryPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const previousValueRef = useRef(value);
  const selectedChipRef = useRef<HTMLButtonElement>(null);
  const newChipRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<'selected' | 'new' | null>(null);
  const allOptions = options.some(option => option.toLowerCase() === value.toLowerCase())
    ? options
    : [...options, value];

  useEffect(() => {
    if (adding || !returnFocusRef.current) return;
    const target = returnFocusRef.current === 'selected'
      ? selectedChipRef.current
      : newChipRef.current;
    returnFocusRef.current = null;
    target?.focus();
  }, [adding, value]);

  const select = (category: string) => {
    onChange(category);
    if (!adding) return;
    setDraft('');
    returnFocusRef.current = 'selected';
    setAdding(false);
  };

  const updateDraft = (nextDraft: string) => {
    setDraft(nextDraft);
    onChange(normalizeTodoCategory(nextDraft, options) ?? previousValueRef.current);
  };

  const commit = () => {
    onChange(normalizeTodoCategory(draft, options) ?? DEFAULT_TODO_CATEGORY);
    setDraft('');
    returnFocusRef.current = 'selected';
    setAdding(false);
  };

  const cancel = () => {
    onChange(previousValueRef.current);
    setDraft('');
    returnFocusRef.current = 'new';
    setAdding(false);
  };

  const chipStyle = (selected: boolean): React.CSSProperties => ({
    display: 'inline-flex',
    alignItems: 'center',
    gap: '6px',
    minHeight: compact ? '32px' : '38px',
    padding: compact ? '6px 9px' : '8px 12px',
    borderRadius: '999px',
    border: selected
      ? '1px solid rgba(10,132,255,0.65)'
      : '1px solid rgba(var(--neutral-rgb), 0.12)',
    background: selected ? 'rgba(10,132,255,0.18)' : 'rgba(var(--neutral-rgb), 0.06)',
    color: selected ? 'var(--sys-label-primary)' : 'var(--sys-label-secondary)',
    fontSize: compact ? '11px' : '12px',
    fontWeight: 700,
    cursor: 'pointer',
  });

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : 'Category'}
      style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '8px' }}
    >
      {allOptions.map(category => {
        const Icon = getTodoCategoryIcon(category);
        const selected = category.toLowerCase() === value.toLowerCase();

        return (
          <button
            key={category}
            ref={selected ? selectedChipRef : undefined}
            type="button"
            aria-pressed={selected}
            onClick={() => select(category)}
            style={chipStyle(selected)}
          >
            <Icon size={compact ? 13 : 15} aria-hidden="true" />
            {category}
          </button>
        );
      })}

      {adding ? (
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', minWidth: 0, flexBasis: '100%' }}>
          <input
            autoFocus
            aria-label="New category name"
            placeholder="e.g. Hiking prep"
            maxLength={MAX_TODO_CATEGORY_LENGTH}
            value={draft}
            onChange={event => updateDraft(event.target.value)}
            onKeyDown={event => {
              if (event.key === 'Enter') {
                event.preventDefault();
                commit();
              }
              if (event.key === 'Escape') {
                event.preventDefault();
                event.stopPropagation();
                cancel();
              }
            }}
            style={{
              minWidth: 0,
              flex: 1,
              height: compact ? '36px' : '40px',
              background: 'rgba(var(--neutral-rgb), 0.07)',
              border: '1px solid rgba(var(--neutral-rgb), 0.12)',
              borderRadius: '10px',
              padding: '8px 10px',
              color: 'var(--sys-label-primary)',
              fontSize: compact ? '12px' : '14px',
              outline: 'none',
            }}
          />
          <button
            type="button"
            aria-label="Add category"
            onClick={commit}
            disabled={!draft.trim()}
            style={{
              ...chipStyle(true),
              width: compact ? '34px' : '38px',
              justifyContent: 'center',
              padding: 0,
              opacity: draft.trim() ? 1 : 0.45,
            }}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            aria-label="Cancel new category"
            onClick={cancel}
            style={{ ...chipStyle(false), width: compact ? '34px' : '38px', justifyContent: 'center', padding: 0 }}
          >
            <X size={16} />
          </button>
        </div>
      ) : (
        <button
          ref={newChipRef}
          type="button"
          onClick={() => {
            previousValueRef.current = value;
            setAdding(true);
          }}
          style={{ ...chipStyle(false), borderStyle: 'dashed' }}
        >
          <Plus size={compact ? 13 : 15} aria-hidden="true" />
          New
        </button>
      )}
    </div>
  );
}
