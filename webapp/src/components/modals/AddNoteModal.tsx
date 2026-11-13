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
      <div className="modal-sheet" onClick={e => e.stopPropagation()} style={{ maxHeight: '80vh' }}>
        <div className="modal-pull-indicator" />

        {/* Header */}
        <div className="modal-header">
          <div className="modal-title">
            <h2>New Note</h2>
            <p className="modal-subtitle">
              Adding to {dayLabel}
            </p>
          </div>
          <button onClick={onClose} className="icon-btn icon-btn--round" aria-label="Close"><X size={18} /></button>
        </div>

        {/* Form */}
        <div className="modal-form">
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

          <div className="edit-field-group">
            <label className="edit-field-label">Note</label>
            <textarea
              className="edit-field-input"
              placeholder="Write anything…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
            />
          </div>
        </div>

        {/* Save */}
        <div className="modal-footer modal-footer--safe">
          <button
            onClick={handleSave}
            disabled={!content.trim() && !title.trim()}
            className="btn btn--primary btn--lg"
          >
            Add Note
          </button>
        </div>
      </div>
    </div>
  );
}
