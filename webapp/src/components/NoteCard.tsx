import ItemThumbnail from './ItemThumbnail';
import React, { useState } from 'react';
import { StickyNote, GripVertical, ChevronDown, ChevronUp, Trash2 } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import type { ItineraryItem } from '../core/models';
import Linkified from './Linkified';

interface NoteCardProps {
  item: ItineraryItem;
  onPress: () => void;
  onGripTouchStart?: (e: React.TouchEvent) => void;
}

export default function NoteCard({ item, onPress, onGripTouchStart }: NoteCardProps) {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <div
      className={`travel-card travel-card--note fade-in ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      style={{ maxHeight: isExpanded ? '800px' : item.imageUrl ? '180px' : '120px' }}
    >
      <div className="travel-card__meta">
        <span className="item-chip">
          {item.title.toUpperCase()}
        </span>
        <div
          className="drag-handle"
          onClick={(e: any) => e.stopPropagation()}
          onTouchStart={onGripTouchStart}
        >
          <GripVertical size={16} />
        </div>
      </div>

      <div className="travel-card__body travel-card__body--top">
        <ItemThumbnail imageUrl={item.imageUrl} title={item.title} icon={<StickyNote size={20} />} color="var(--sys-label-secondary)" background="var(--glass-bg-light)" onEdit={onPress} />

        {/* Title hidden as requested since it's in the badge */}
        <div className="travel-card__main">
          {item.description && (
            <div className="travel-card__note-text">
              <Linkified text={item.description} />
            </div>
          )}
        </div>

        <div className="travel-card__chevron">
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div className="travel-card__details">
          <div className="travel-card__actions">
            <button
              onClick={(e) => { e.stopPropagation(); onPress(); }}
              className="details-btn btn btn--tonal btn--grow"
            >
              Edit Note
            </button>
            <button
              onClick={(e) => {
                e.stopPropagation();
                if (window.confirm(`Delete "${item.title}"?`)) {
                  useTripStore.getState().deleteItem(item.id);
                }
              }}
              className="icon-btn icon-btn--lg icon-btn--danger"
              aria-label="Delete"
            >
              <Trash2 size={18} />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
