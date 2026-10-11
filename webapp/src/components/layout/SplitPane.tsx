import {
  useCallback,
  useEffect,
  useRef,
  useState,
  type KeyboardEvent,
  type PointerEvent,
  type ReactNode,
} from 'react';

const STORAGE_KEY = 'vacay:split-width';
const MIN_LEFT_WIDTH = 360;
const MIN_RIGHT_WIDTH = 420;
const DIVIDER_WIDTH = 12;
const KEYBOARD_STEP = 32;

function readStoredWidth(): number | null {
  const stored = Number(localStorage.getItem(STORAGE_KEY));
  return Number.isFinite(stored) && stored > 0 ? stored : null;
}

function clampWidth(width: number, containerWidth: number): number {
  const maximum = Math.max(
    MIN_LEFT_WIDTH,
    containerWidth - MIN_RIGHT_WIDTH - DIVIDER_WIDTH,
  );
  return Math.min(Math.max(width, MIN_LEFT_WIDTH), maximum);
}

interface SplitPaneProps {
  left: ReactNode;
  right: ReactNode;
  leftLabel: string;
}

export default function SplitPane({ left, right, leftLabel }: SplitPaneProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [leftWidth, setLeftWidth] = useState<number | null>(readStoredWidth);
  const [containerWidth, setContainerWidth] = useState(0);
  const [dragging, setDragging] = useState(false);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) return;

    const observer = new ResizeObserver(([entry]) => {
      setContainerWidth(entry.contentRect.width);
    });
    observer.observe(container);
    return () => observer.disconnect();
  }, []);

  const effectiveWidth = containerWidth
    ? clampWidth(leftWidth ?? containerWidth / 2, containerWidth)
    : null;

  const commitWidth = useCallback((width: number) => {
    const nextWidth = containerWidth ? clampWidth(width, containerWidth) : width;
    setLeftWidth(nextWidth);
    localStorage.setItem(STORAGE_KEY, String(Math.round(nextWidth)));
  }, [containerWidth]);

  const updateFromPointer = (clientX: number) => {
    const container = containerRef.current;
    if (!container) return;
    const bounds = container.getBoundingClientRect();
    setLeftWidth(clampWidth(clientX - bounds.left, bounds.width));
  };

  const handlePointerDown = (event: PointerEvent<HTMLDivElement>) => {
    if (event.button !== 0) return;
    event.preventDefault();
    event.currentTarget.setPointerCapture(event.pointerId);
    setDragging(true);
  };

  const handlePointerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromPointer(event.clientX);
  };

  const handlePointerUp = (event: PointerEvent<HTMLDivElement>) => {
    if (!dragging) return;
    updateFromPointer(event.clientX);
    setDragging(false);
    event.currentTarget.releasePointerCapture(event.pointerId);

    const container = containerRef.current;
    if (container) {
      const bounds = container.getBoundingClientRect();
      commitWidth(event.clientX - bounds.left);
    }
  };

  const handleKeyDown = (event: KeyboardEvent<HTMLDivElement>) => {
    if (!containerWidth || effectiveWidth === null) return;

    let nextWidth: number | null = null;
    if (event.key === 'ArrowLeft') nextWidth = effectiveWidth - KEYBOARD_STEP;
    if (event.key === 'ArrowRight') nextWidth = effectiveWidth + KEYBOARD_STEP;
    if (event.key === 'Home') nextWidth = MIN_LEFT_WIDTH;
    if (event.key === 'End') {
      nextWidth = containerWidth - MIN_RIGHT_WIDTH - DIVIDER_WIDTH;
    }
    if (nextWidth === null) return;

    event.preventDefault();
    commitWidth(nextWidth);
  };

  const resetWidth = () => {
    setLeftWidth(null);
    localStorage.removeItem(STORAGE_KEY);
  };

  return (
    <div
      ref={containerRef}
      className={`split-pane ${dragging ? 'split-pane--dragging' : ''}`}
      style={{
        gridTemplateColumns: effectiveWidth === null
          ? 'minmax(0, 1fr) 12px minmax(0, 1fr)'
          : `${effectiveWidth}px 12px minmax(0, 1fr)`,
      }}
    >
      <section className="split-left" aria-label={leftLabel}>
        {left}
      </section>

      <div
        className="split-pane__divider"
        role="separator"
        aria-orientation="vertical"
        aria-label={`Resize ${leftLabel.toLowerCase()} pane`}
        aria-valuemin={MIN_LEFT_WIDTH}
        aria-valuemax={containerWidth
          ? Math.max(MIN_LEFT_WIDTH, containerWidth - MIN_RIGHT_WIDTH - DIVIDER_WIDTH)
          : undefined}
        aria-valuenow={effectiveWidth === null ? undefined : Math.round(effectiveWidth)}
        tabIndex={0}
        onPointerDown={handlePointerDown}
        onPointerMove={handlePointerMove}
        onPointerUp={handlePointerUp}
        onPointerCancel={handlePointerUp}
        onKeyDown={handleKeyDown}
        onDoubleClick={resetWidth}
        title="Drag to resize. Double-click to reset."
      >
        <span className="split-pane__divider-line" aria-hidden="true" />
        <span className="split-pane__divider-grip" aria-hidden="true" />
      </div>

      <section className="split-right" aria-label="Details">
        {right}
      </section>
    </div>
  );
}
