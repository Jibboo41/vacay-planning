import { useEffect, useRef, useState } from 'react';
import { Check, Plus, X } from 'lucide-react';
import { getTodoCategoryIcon, MAX_TODO_CATEGORY_LENGTH, normalizeTodoCategory, DEFAULT_TODO_CATEGORY } from '../core/todoCategories';
import { cn } from '../lib/cn';
import { Chip, IconButton, Input } from './ui';

interface TodoCategoryPickerProps {
  /** Display category (e.g. "General"). */
  value: string;
  onChange: (category: string) => void;
  /** From `listTodoCategories()`. */
  options: string[];
  compact?: boolean;
  labelId?: string;
}

/** Single-select category chips plus an inline "New" field for custom categories. */
export default function TodoCategoryPicker({ value, onChange, options, compact = false, labelId }: TodoCategoryPickerProps) {
  const [adding, setAdding] = useState(false);
  const [draft, setDraft] = useState('');
  const previousValueRef = useRef(value);
  const selectedChipRef = useRef<HTMLButtonElement>(null);
  const newChipRef = useRef<HTMLButtonElement>(null);
  const returnFocusRef = useRef<'selected' | 'new' | null>(null);
  const all = options.some((o) => o.toLowerCase() === value.toLowerCase()) ? options : [...options, value];
  const chipClass = compact ? 'min-h-8 px-2.5 text-caption' : 'min-h-10';

  useEffect(() => {
    if (adding || !returnFocusRef.current) return;
    const target = returnFocusRef.current === 'selected' ? selectedChipRef.current : newChipRef.current;
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

  const beginAdding = () => {
    previousValueRef.current = value;
    setAdding(true);
  };

  const updateDraft = (nextDraft: string) => {
    setDraft(nextDraft);
    const category = normalizeTodoCategory(nextDraft, options);
    onChange(category ?? previousValueRef.current);
  };

  const commit = () => {
    const name = normalizeTodoCategory(draft, options) ?? DEFAULT_TODO_CATEGORY;
    onChange(name);
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

  return (
    <div role="group" aria-labelledby={labelId} aria-label={labelId ? undefined : 'Category'} className="flex flex-wrap items-center gap-2">
      {all.map((category) => {
        const Icon = getTodoCategoryIcon(category);
        const selected = category.toLowerCase() === value.toLowerCase();
        return (
          <Chip
            key={category}
            ref={selected ? selectedChipRef : undefined}
            selected={selected}
            onClick={() => select(category)}
            className={cn(chipClass, selected && 'border-sys-blue/50 bg-sys-blue/20')}
          >
            <Icon size={compact ? 13 : 15} aria-hidden="true" />
            {category}
          </Chip>
        );
      })}
      {adding ? (
        <div className="flex min-w-0 basis-full items-center gap-1.5">
          <Input
            autoFocus
            aria-label="New category name"
            placeholder="e.g. Hiking prep"
            maxLength={MAX_TODO_CATEGORY_LENGTH}
            value={draft}
            onChange={(e) => updateDraft(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') { e.preventDefault(); commit(); }
              if (e.key === 'Escape') { e.preventDefault(); e.stopPropagation(); cancel(); }
            }}
            className={cn('m-0 min-w-0 flex-1', compact ? 'h-9 text-footnote' : 'h-10')}
          />
          <IconButton aria-label="Add category" variant="primary" size="sm" onClick={commit} disabled={!draft.trim()}>
            <Check size={16} />
          </IconButton>
          <IconButton aria-label="Cancel new category" variant="ghost" size="sm" onClick={cancel}>
            <X size={16} />
          </IconButton>
        </div>
      ) : (
        <Chip ref={newChipRef} aria-pressed={undefined} onClick={beginAdding} className={cn(chipClass, 'border-dashed border-white/20')}>
          <Plus size={compact ? 13 : 15} aria-hidden="true" />
          New
        </Chip>
      )}
    </div>
  );
}
