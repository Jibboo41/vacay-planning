import { useState, type CSSProperties, type ReactNode } from 'react';

interface ItemThumbnailProps {
  imageUrl?: string;
  title: string;
  icon: ReactNode;
  color?: string;
  background?: string;
  onEdit?: () => void;
}

export default function ItemThumbnail({ imageUrl, title, icon, color, background, onEdit }: ItemThumbnailProps) {
  const [failedUrl, setFailedUrl] = useState<string | null>(null);
  const showImage = !!imageUrl && failedUrl !== imageUrl;
  const style: CSSProperties = { color, background };
  const contents = showImage ? (
    <img src={imageUrl} alt={title} loading="lazy" decoding="async" referrerPolicy="no-referrer" draggable={false} onError={() => setFailedUrl(imageUrl)} />
  ) : icon;
  const className = `item-thumbnail${showImage ? ' item-thumbnail--photo' : ''}`;
  return onEdit ? (
    <button type="button" className={className} style={style} aria-label={`Edit image for ${title}`} onClick={event => { event.stopPropagation(); onEdit(); }}>
      {contents}
    </button>
  ) : <span className={className} style={style}>{contents}</span>;
}
