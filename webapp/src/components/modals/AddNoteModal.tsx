import { useState } from 'react';
import { Button, Field, Input, Sheet, TextArea } from '../ui';

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

  const canSave = Boolean(content.trim() || title.trim());

  return (
    <Sheet
      open
      onClose={onClose}
      title={(
        <span>
          New Note
          <span className="mt-0.5 block text-[13px] font-normal text-label-secondary">
            Adding to {dayLabel}
          </span>
        </span>
      )}
      className="max-h-[80vh]"
      footer={(
        <Button
          onClick={handleSave}
          disabled={!canSave}
          variant={canSave ? 'glass' : 'secondary'}
          block
          size="lg"
          className={canSave ? 'btn-glass-blue' : 'opacity-40'}
        >
          Add Note
        </Button>
      )}
    >
      <div className="flex flex-col gap-4 pt-1">
        <Field label="Title (optional)">
          {id => (
            <Input
              id={id}
              type="text"
              placeholder="e.g. Packing reminder"
              value={title}
              onChange={e => setTitle(e.target.value)}
              autoFocus
            />
          )}
        </Field>

        <Field label="Note" className="mb-0">
          {id => (
            <TextArea
              id={id}
              placeholder="Write anything…"
              value={content}
              onChange={e => setContent(e.target.value)}
              rows={6}
              className="resize-none leading-normal"
            />
          )}
        </Field>
      </div>
    </Sheet>
  );
}
