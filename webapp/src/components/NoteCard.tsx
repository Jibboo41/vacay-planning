import React, { useState } from 'react';
import { StickyNote, GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import { cn } from '../lib/cn';
import Linkified from './Linkified';
import { Button, IconButton } from './ui';

interface NoteCardProps {
  item: ItineraryItem;
  onPress: () => void;
  onGripTouchStart?: (e: React.TouchEvent) => void;
}

export default function NoteCard({ item, onPress, onGripTouchStart }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={cn(
        'glass-card fade-in relative mx-4 mb-3 overflow-hidden rounded-2xl border-l-4 border-type-note p-4 transition-all duration-300 ease-ios motion-reduce:transition-none',
        isExpanded ? 'expanded max-h-[800px] bg-white/5' : 'max-h-[120px]',
      )}
      onClick={() => setIsExpanded(v => !v)}
    >
      <div className="mb-2 flex items-center justify-between gap-3">
        <span className="rounded-chip bg-white/5 px-2 py-0.5 text-caption font-extrabold tracking-wide text-label-secondary">
          {item.title.toUpperCase()}
        </span>
        <button
          type="button"
          aria-label="Drag to reorder"
          className="drag-handle text-label-tertiary"
          onClick={e => e.stopPropagation()}
          onTouchStart={onGripTouchStart}
        >
          <GripVertical size={16} />
        </button>
      </div>

      <div className="flex items-start gap-3">
        <div className="flex size-10 shrink-0 items-center justify-center rounded-control bg-white/10 text-label-secondary">
          <StickyNote size={20} />
        </div>

        <div className="min-w-0 flex-1">
          {item.description && (
            <div className="mt-1 max-h-[100px] overflow-y-auto text-[14px] leading-6 text-label-secondary">
              <Linkified text={item.description} />
            </div>
          )}
        </div>

        <IconButton
          aria-label={isExpanded ? 'Hide details' : 'Show details'}
          aria-expanded={isExpanded}
          variant="ghost"
          size="sm"
          className="opacity-60"
          onClick={(e) => {
            e.stopPropagation();
            setIsExpanded(v => !v);
          }}
        >
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </IconButton>
      </div>

      {isExpanded && (
        <div className="mt-4 border-t border-white/5 pt-4">
          <div className="flex gap-2">
            <Button block onClick={(e) => { e.stopPropagation(); onPress(); }}>
              Edit Note
            </Button>
            <IconButton
              aria-label={`Delete ${item.title}`}
              variant="danger"
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${item.title}"?`)) {
                  useTripStore.getState().deleteItem(item.id);
                }
              }}
            >
              <Trash2 size={18} />
            </IconButton>
          </div>
        </div>
      )}
    </div>
  );
}
