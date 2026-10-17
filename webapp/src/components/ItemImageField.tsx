import { useEffect, useId, useRef, useState } from 'react';
import { ImagePlus, Loader, Trash2 } from 'lucide-react';
import { prepareItemImage } from '../data/itemImages';
import { validateImageUrl } from '../core/timelineDetails';

interface Props {
  url: string;
  file: Blob | null;
  disabled: boolean;
  onChange: (url: string, file: Blob | null) => void;
  onBusyChange: (busy: boolean) => void;
}

export default function ItemImageField({ url, file, disabled, onChange, onBusyChange }: Props) {
  const inputId = useId();
  const [preview, setPreview] = useState('');
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState('');
  const [failedUrl, setFailedUrl] = useState('');
  const mounted = useRef(true);
  useEffect(() => { mounted.current = true; return () => { mounted.current = false; }; }, []);
  useEffect(() => {
    if (!file) return;
    const objectUrl = URL.createObjectURL(file);
    setPreview(objectUrl);
    return () => URL.revokeObjectURL(objectUrl);
  }, [file]);
  let imageSrc = file ? preview : '';
  if (!file) {
    try { imageSrc = validateImageUrl(url); } catch { /* Validate on save; don't request partial URLs. */ }
  }
  return (
    <div className="edit-field-group item-image-field">
      <label className="edit-field-label" htmlFor={`${inputId}-url`}>Timeline image <span className="field-optional">(optional)</span></label>
      <div className="item-image-field__body">
        <div className="item-image-field__preview">
          {imageSrc && imageSrc !== failedUrl ? <img src={imageSrc} alt="Selected timeline image" referrerPolicy="no-referrer" onError={() => setFailedUrl(imageSrc)} /> : <ImagePlus size={28} aria-hidden="true" />}
        </div>
        <div className="item-image-field__controls">
          <label className={`btn-glass-blue image-upload-button${disabled || busy ? ' is-disabled' : ''}`}>
            {busy ? <Loader size={16} className="spinning" /> : <ImagePlus size={16} />}
            {busy ? 'Preparing photo…' : file || url ? 'Change photo' : 'Choose photo'}
            <input type="file" accept="image/jpeg,image/png,image/webp,image/gif" disabled={disabled || busy} aria-label="Choose timeline photo" onChange={async event => {
              const selected = event.target.files?.[0];
              event.target.value = '';
              if (!selected) return;
              setBusy(true); onBusyChange(true); setError('');
              try {
                const blob = await prepareItemImage(selected);
                if (mounted.current) onChange('', blob);
              } catch (cause) {
                if (mounted.current) setError(cause instanceof Error ? cause.message : 'This photo could not be opened.');
              } finally {
                if (mounted.current) { setBusy(false); onBusyChange(false); }
              }
            }} />
          </label>
          {(url || file) && <button type="button" className="image-remove-button" disabled={disabled || busy} onClick={() => { onChange('', null); setError(''); }}><Trash2 size={14} />Use category icon</button>}
          <p className="field-hint">JPG, PNG, WebP, or GIF · up to 10 MB</p>
        </div>
      </div>
      <input id={`${inputId}-url`} className="edit-field-input" type="url" value={url} placeholder="Or paste an HTTPS image link" disabled={disabled || busy} onChange={event => { onChange(event.target.value, null); setError(''); }} />
      {imageSrc && imageSrc === failedUrl && <p className="field-hint">Image unavailable. The category icon will appear until the image can load.</p>}
      {error && <p className="field-error" role="alert">{error}</p>}
    </div>
  );
}
