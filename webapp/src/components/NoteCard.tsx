import React, { useState } from 'react';
import { StickyNote, GripVertical, ChevronDown, ChevronUp, Info } from 'lucide-react';
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
      className={`glass-card fade-in ${isExpanded ? 'expanded' : ''}`}
      onClick={() => setIsExpanded(!isExpanded)}
      role="button"
      tabIndex={0}
      style={{
        borderLeft: '4px solid var(--sys-label-tertiary)',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        maxHeight: isExpanded ? '500px' : '120px',
        padding: '16px',
        borderRadius: '16px',
        margin: '0 16px 12px',
        position: 'relative',
        background: isExpanded ? 'rgba(255, 255, 255, 0.05)' : undefined
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '8px' }}>
        <span style={{ fontSize: '11px', fontWeight: 800, color: 'var(--sys-label-secondary)', letterSpacing: '0.05em' }}>
          NOTE
        </span>
        <div 
          className="drag-handle"
          onClick={(e: any) => e.stopPropagation()}
          onTouchStart={onGripTouchStart}
        >
          <GripVertical size={16} color="var(--sys-label-tertiary)" />
        </div>
      </div>

      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <div style={{
          width: '40px', height: '40px', borderRadius: '12px', flexShrink: 0,
          background: 'rgba(255, 255, 255, 0.1)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <StickyNote size={20} color="var(--sys-label-secondary)" />
        </div>

        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{
            fontSize: '17px', fontWeight: 700, color: '#FFF',
            marginBottom: '4px',
            whiteSpace: isExpanded ? 'normal' : 'nowrap',
            overflow: 'hidden',
            textOverflow: 'ellipsis',
          }}>
            {item.title}
          </h3>
        </div>

        <div style={{ padding: '4px', opacity: 0.4 }}>
          {isExpanded ? <ChevronUp size={18} /> : <ChevronDown size={18} />}
        </div>
      </div>

      {isExpanded && (
        <div style={{ marginTop: '16px', paddingTop: '16px', borderTop: '1px solid rgba(255,255,255,0.05)' }}>
          {item.description && (
            <div style={{
              fontSize: '14px', color: 'var(--sys-label-secondary)',
              lineHeight: '1.5', margin: '0 0 20px 0'
            }}>
              <Linkified text={item.description} />
            </div>
          )}

          <button 
            onClick={(e) => { e.stopPropagation(); onPress(); }}
            style={{
              width: '100%', padding: '12px', borderRadius: '12px', background: '#3a3a3c', color: '#fff',
              border: 'none', fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px'
            }}
          >
            <Info size={16} />
            Edit Note
          </button>
        </div>
      )}
    </div>
  );
}
