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

  const chipClass = (selected: boolean, modifier = '') =>
    `choice-chip${compact ? ' choice-chip--sm' : ''}${selected ? ' choice-chip--selected' : ''}${modifier}`;

  return (
    <div
      role="group"
      aria-labelledby={labelId}
      aria-label={labelId ? undefined : 'Category'}
      className="choice-chips"
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
            className={chipClass(selected)}
          >
            <Icon size={compact ? 13 : 15} aria-hidden="true" />
            {category}
          </button>
        );
      })}

      {adding ? (
        <div className="choice-chips__draft">
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
            className="text-input"
          />
          <button
            type="button"
            aria-label="Add category"
            onClick={commit}
            disabled={!draft.trim()}
            className={chipClass(true, ' choice-chip--icon')}
          >
            <Check size={16} />
          </button>
          <button
            type="button"
            aria-label="Cancel new category"
            onClick={cancel}
            className={chipClass(false, ' choice-chip--icon')}
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
          className={chipClass(false, ' choice-chip--dashed')}
        >
          <Plus size={compact ? 13 : 15} aria-hidden="true" />
          New
        </button>
      )}
    </div>
  );
}
