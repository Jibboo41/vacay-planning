import { useCallback, useEffect, useRef, useState, type KeyboardEvent, type PointerEvent, type ReactNode } from 'react';
import { cn } from '../../lib/cn';

const STORAGE_KEY = 'vacay:split-width';
const MIN_LEFT = 360;
const MIN_RIGHT = 420;
const STEP = 32;

function readStored(): number | null {
  const v = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(v) && v > 0 ? v : null;
}

function clampSplit(width: number, container: number) {
  const max = Math.max(MIN_LEFT, container - MIN_RIGHT);
  return Math.min(Math.max(width, MIN_LEFT), max);
}

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  /** Hide the left pane (collapsed). */
  collapsed?: boolean;
  leftLabel: string;
  className?: string;
}

/**
 * Two-pane layout with a draggable / keyboard-resizable divider.
 * The left width (px) is persisted in localStorage (`vacay:split-width`).
 */
export default function SplitPane({ left, right, collapsed, leftLabel, className }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState<number | null>(readStored);
  const [dragging, setDragging] = useState(false);
  const [containerWidth, setContainerWidth] = useState(0);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    const ro = new ResizeObserver(([entry]) => setContainerWidth(entry.contentRect.width));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const effective = containerWidth ? clampSplit(width ?? containerWidth / 2, containerWidth) : null;

  const commit = useCallback((w: number) => {
    setWidth(w);
    localStorage.setItem(STORAGE_KEY, String(Math.round(w)));
  }, []);

  const onPointerDown = (e: PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0) return;
    e.preventDefault();
    e.currentTarget.setPointerCapture(e.pointerId);
    setDragging(true);
  };
  const onPointerMove = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging || !containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    setWidth(clampSplit(e.clientX - rect.left, rect.width));
  };
  const onPointerUp = (e: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    setDragging(false);
    e.currentTarget.releasePointerCapture(e.pointerId);
    if (effective) commit(effective);
  };
  const onKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
    if (!containerWidth || effective == null) return;
    let next: number | null = null;
    if (e.key === 'ArrowLeft') next = effective - STEP;
    else if (e.key === 'ArrowRight') next = effective + STEP;
    else if (e.key === 'Home') next = MIN_LEFT;
    else if (e.key === 'End') next = containerWidth - MIN_RIGHT;
    if (next == null) return;
    e.preventDefault();
    commit(clampSplit(next, containerWidth));
  };

  return (
    <div
      ref={containerRef}
      className={cn('grid h-dvh w-full overflow-hidden', dragging && 'cursor-col-resize select-none', className)}
      style={{ gridTemplateColumns: collapsed ? '0px 0px 1fr' : `${effective ? `${effective}px` : '1fr'} 12px 1fr` }}
    >
      <section aria-label={leftLabel} hidden={collapsed} className="split-left relative h-dvh min-w-0 overflow-y-auto border-r-0">
        {left}
      </section>
      <div
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${leftLabel.toLowerCase()} pane`}
        aria-valuemin={MIN_LEFT}
        aria-valuemax={containerWidth ? Math.max(MIN_LEFT, containerWidth - MIN_RIGHT) : undefined}
        aria-valuenow={effective ? Math.round(effective) : undefined}
        tabIndex={collapsed ? -1 : 0}
        hidden={collapsed}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerCancel={onPointerUp}
        onKeyDown={onKeyDown}
        onDoubleClick={() => { setWidth(null); localStorage.removeItem(STORAGE_KEY); }}
        className="group relative z-10 flex cursor-col-resize touch-none items-center justify-center"
      >
        <span aria-hidden="true" className={cn('h-full w-px bg-white/10 transition-colors group-hover:bg-sys-blue/60 group-focus-visible:bg-sys-blue', dragging && 'bg-sys-blue')} />
        <span aria-hidden="true" className="absolute top-1/2 h-10 w-1.5 -translate-y-1/2 rounded-full bg-white/25 opacity-0 transition-opacity group-hover:opacity-100 group-focus-visible:opacity-100" />
      </div>
      <section aria-label="Details" className="split-right relative h-dvh min-w-0 overflow-y-auto">
        {right}
      </section>
    </div>
  );
}
