import { useState } from 'react';
import { X } from 'lucide-react';

interface AddNoteModalProps {
  activeDayKey: string;
  onClose: () => void;
  onAdd: (dayKey: string, title: string, content: string) => void;
}

export default function AddNoteModal({ activeDayKey, onClose, onAdd }: AddNoteModalProps) {
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');

  const handleSave = () => {
    if (!content.trim() && !title.trim()) return;
    onAdd(activeDayKey, title, content);
    onClose();
  };

  const dayLabel = (() => {
    const d = new Date(`${activeDayKey}T12:00:00`);
    return d.toLocaleDateString([], { weekday: 'long', month: 'long', day: 'numeric' });
  })();

  return (
    <div className="modal-backdrop" onClick={onClose}>
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh', paddingBottom: 0 }}>
        <div className="modal-pull-indicator" />

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4px' }}>
          <div>
            <h2 style={{ fontSize: '22px', fontWeight: 800 }}>New Note</h2>
            <p style={{ fontSize: '13px', color: 'var(--sys-label-secondary)', marginTop: '2px' }}>
              Adding to {dayLabel}
            </p>
          </div>
          <button onClick={onClose}><X size={22} color="var(--sys-label-secondary)" /></button>
        </div>

        {/* Form */}
        <div style={{ flex: 1, overflowY: 'auto', paddingTop: '20px', paddingBottom: '12px' }}>
          <div className="edit-field-group">
            <label className="edit-field-label">Title (optional)</label>
            <input
              className="edit-field-input"
              type="text"
              placeholder="e.g. Packing reminder"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          </div>

          <div className="edit-field-group" style={{ marginBottom: 0 }}>
            <label className="edit-field-label">Note</label>
            <textarea
              className="edit-field-input"
              placeholder="Write anything…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              style={{ resize: 'none', lineHeight: '1.5' }}
            />
          </div>
        </div>

        {/* Save */}
        <div style={{ flexShrink: 0, paddingTop: '16px', paddingBottom: 'calc(16px + env(safe-area-inset-bottom))' }}>
            <button
            onClick={handleSave}
            disabled={!content.trim() && !title.trim()}
            className={(content.trim() || title.trim()) ? "btn-glass-blue" : ""}
            style={{
              width: '100%', padding: '16px', borderRadius: '14px',
              fontSize: '16px', fontWeight: 700,
              transition: 'all 0.2s',
              opacity: (content.trim() || title.trim()) ? 1 : 0.4,
              border: !(content.trim() || title.trim()) ? '1px solid rgba(255,255,255,0.08)' : undefined,
              background: !(content.trim() || title.trim()) ? 'rgba(255,255,255,0.05)' : undefined,
            }}
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
