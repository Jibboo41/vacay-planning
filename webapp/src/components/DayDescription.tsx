import { useId, useState } from 'react';
import { AlignLeft, Pencil, Plus, Loader } from 'lucide-react';
import { useTripStore } from '../store/useTripStore';
import { MAX_DAY_DESCRIPTION_LENGTH } from '../core/timelineDetails';

interface Props { tripId: string; dateKey: string; label: string; description: string; }

export default function DayDescription({ tripId, dateKey, label, description }: Props) {
  const saveDayDescription = useTripStore(state => state.saveDayDescription);
  const id = useId();
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(description);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState('');
  const [status, setStatus] = useState('');
  const startEditing = () => { setDraft(description); setError(''); setEditing(true); };

  return (
    <div className={`day-description${description || editing ? ' day-description--filled' : ''}`}>
      {editing ? (
        <form onSubmit={async event => {
          event.preventDefault(); setSaving(true); setError('');
          try {
            await saveDayDescription(tripId, dateKey, draft);
            setEditing(false); setStatus(draft.trim() ? 'Day description saved.' : 'Day description removed.');
          } catch (cause) {
            setError(cause instanceof Error ? cause.message : 'Could not save. Please try again.');
          } finally { setSaving(false); }
        }}>
          <label className="edit-field-label" htmlFor={id}>The plan for {label}</label>
          <textarea id={id} className="edit-field-input" autoFocus value={draft} maxLength={MAX_DAY_DESCRIPTION_LENGTH} rows={3} disabled={saving} onChange={event => setDraft(event.target.value)} placeholder="Arrive in Paris and get settled; maybe some exploring in the evening…" onKeyDown={event => { if (event.key === 'Escape' && !saving) setEditing(false); }} />
          <div className="day-description__actions"><span className="field-hint">{draft.length}/{MAX_DAY_DESCRIPTION_LENGTH}</span><button type="button" disabled={saving} onClick={() => setEditing(false)}>Cancel</button><button type="submit" className="btn-glass-blue" disabled={saving}>{saving && <Loader size={14} className="spinning" />}{saving ? 'Saving…' : 'Save description'}</button></div>
          {error && <p className="field-error" role="alert">{error}</p>}
        </form>
      ) : description ? (
        <>
          <div className="day-description__heading"><span><AlignLeft size={15} aria-hidden="true" />The plan for today</span><button type="button" onClick={startEditing} aria-label={`Edit description for ${label}`}><Pencil size={14} />Edit</button></div>
          <p>{description}</p>
        </>
      ) : (
        <button type="button" className="day-description__add" onClick={startEditing}><Plus size={15} />Add a day description</button>
      )}
      <span className="sr-only" role="status">{status}</span>
    </div>
  );
}
