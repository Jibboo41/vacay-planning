import { useEffect, useRef, useState, type PointerEvent as ReactPointerEvent, type RefObject } from 'react';

const DRAG_THRESHOLD_PX = 5;
const AUTO_SCROLL_EDGE_PX = 72;
const AUTO_SCROLL_MAX_STEP_PX = 18;
const INTERACTIVE_SELECTOR = 'a, button, input, label, select, textarea, [contenteditable="true"]';

interface UseTodoDragOptions {
  onDrop: (activeId: string, overId: string) => void;
  /** Element whose bottom edge marks the top of the visible list area, e.g. a sticky header. */
  topBoundaryRef?: RefObject<HTMLElement | null>;
}

interface TodoDragState {
  activeId: string | null;
  overId: string | null;
}

interface DragSession {
  id: string;
  pointerId: number;
  row: HTMLElement;
  startX: number;
  startY: number;
  pointerY: number;
  grabOffsetY: number;
  left: number;
  hitX: number;
  started: boolean;
  overId: string | null;
  preview: HTMLElement | null;
  scroller: HTMLElement | null;
  frame: number;
}

const IDLE_STATE: TodoDragState = { activeId: null, overId: null };

function findScrollContainer(element: HTMLElement) {
  for (let node = element.parentElement; node && node !== document.body; node = node.parentElement) {
    const { overflowY } = getComputedStyle(node);
    if ((overflowY === 'auto' || overflowY === 'scroll') && node.scrollHeight > node.clientHeight) return node;
  }
  return null;
}

function createPreview(row: HTMLElement, rect: DOMRect) {
  const card = row.cloneNode(true) as HTMLElement;
  card.removeAttribute('data-todo-id');
  card.removeAttribute('data-todo-item');
  card.classList.add('todo-drag-preview__card');

  const preview = document.createElement('div');
  preview.className = 'todo-drag-preview';
  preview.setAttribute('aria-hidden', 'true');
  preview.inert = true;
  preview.style.width = `${rect.width}px`;
  preview.style.height = `${rect.height}px`;
  preview.append(card);
  document.body.append(preview);
  return preview;
}

function suppressNextClick() {
  const swallow = (event: MouseEvent) => {
    event.preventDefault();
    event.stopPropagation();
  };
  window.addEventListener('click', swallow, { capture: true, once: true });
  window.setTimeout(() => window.removeEventListener('click', swallow, { capture: true }), 0);
}

function preventDefault(event: Event) {
  if (event.cancelable) event.preventDefault();
}

function scrollStep(depth: number) {
  return Math.ceil(AUTO_SCROLL_MAX_STEP_PX * Math.min(1, depth / AUTO_SCROLL_EDGE_PX) ** 2);
}

/**
 * Pointer-driven list reordering. Mouse drags can start anywhere on a row except its controls;
 * touch and pen drags start from an element marked with `data-drag-handle`. A copy of the row
 * follows the pointer while the original stays in place as a placeholder.
 */
export function useTodoDrag({ onDrop, topBoundaryRef }: UseTodoDragOptions) {
  const [dragState, setDragState] = useState<TodoDragState>(IDLE_STATE);
  const sessionRef = useRef<{ cancel: () => void } | null>(null);
  const onDropRef = useRef(onDrop);

  useEffect(() => {
    onDropRef.current = onDrop;
  });

  useEffect(() => () => sessionRef.current?.cancel(), []);

  const startDrag = (event: ReactPointerEvent<HTMLElement>, id: string) => {
    if (sessionRef.current || !event.isPrimary || event.button !== 0) return;

    const row = event.currentTarget;
    const target = event.target as Element;
    const isTouchLike = event.pointerType !== 'mouse';

    if (isTouchLike) {
      if (!target.closest('[data-drag-handle]')) return;
    } else {
      const control = target.closest(INTERACTIVE_SELECTOR);
      if (control && row.contains(control)) return;
    }

    const session: DragSession = {
      id,
      pointerId: event.pointerId,
      row,
      startX: event.clientX,
      startY: event.clientY,
      pointerY: event.clientY,
      grabOffsetY: event.clientY - row.getBoundingClientRect().top,
      left: 0,
      hitX: 0,
      started: false,
      overId: null,
      preview: null,
      scroller: null,
      frame: 0,
    };

    const getScrollBounds = () => {
      let top = 0;
      let bottom = window.innerHeight;

      if (session.scroller) {
        const rect = session.scroller.getBoundingClientRect();
        top = Math.max(top, rect.top);
        bottom = Math.min(bottom, rect.bottom);
      }

      const header = topBoundaryRef?.current;
      if (header) top = Math.max(top, header.getBoundingClientRect().bottom);

      const tabBar = document.querySelector<HTMLElement>('.mobile-tab-bar');
      if (tabBar && tabBar.getClientRects().length > 0) {
        bottom = Math.min(bottom, tabBar.getBoundingClientRect().top);
      }

      return { top, bottom };
    };

    const positionPreview = () => {
      if (!session.preview) return;
      session.preview.style.transform =
        `translate3d(${session.left}px, ${session.pointerY - session.grabOffsetY}px, 0)`;
    };

    const updateTarget = () => {
      const hit = document
        .elementFromPoint(session.hitX, session.pointerY)
        ?.closest<HTMLElement>('[data-todo-id]');
      if (!hit) return;

      const hitId = hit.dataset.todoId;
      const nextOverId = !hitId || hitId === session.id ? null : hitId;
      if (nextOverId === session.overId) return;

      session.overId = nextOverId;
      setDragState({ activeId: session.id, overId: nextOverId });
      if (nextOverId && 'vibrate' in navigator) navigator.vibrate(5);
    };

    const autoScroll = () => {
      session.frame = requestAnimationFrame(autoScroll);

      const { top, bottom } = getScrollBounds();
      const y = session.pointerY;
      let step = 0;

      // Only scroll toward the edge the pointer is moving to, so grabbing a row near an edge doesn't jump the list.
      if (y < top + AUTO_SCROLL_EDGE_PX && y < session.startY) {
        step = -scrollStep(top + AUTO_SCROLL_EDGE_PX - y);
      } else if (y > bottom - AUTO_SCROLL_EDGE_PX && y > session.startY) {
        step = scrollStep(y - (bottom - AUTO_SCROLL_EDGE_PX));
      }

      if (step === 0) return;
      if (session.scroller) session.scroller.scrollTop += step;
      else window.scrollBy(0, step);
    };

    const begin = () => {
      const rect = row.getBoundingClientRect();
      session.started = true;
      session.left = rect.left;
      session.hitX = rect.left + rect.width / 2;
      session.scroller = findScrollContainer(row);
      session.preview = createPreview(row, rect);

      document.body.classList.add('todo-reordering');
      window.addEventListener('scroll', updateTarget, { capture: true, passive: true });
      session.frame = requestAnimationFrame(autoScroll);

      setDragState({ activeId: session.id, overId: null });
      if ('vibrate' in navigator) navigator.vibrate(8);
    };

    const handlePointerMove = (moveEvent: PointerEvent) => {
      if (moveEvent.pointerId !== session.pointerId) return;
      session.pointerY = moveEvent.clientY;

      if (!session.started) {
        const distance = Math.hypot(moveEvent.clientX - session.startX, moveEvent.clientY - session.startY);
        if (distance < DRAG_THRESHOLD_PX) return;
        begin();
      }

      if (moveEvent.cancelable) moveEvent.preventDefault();
      positionPreview();
      updateTarget();
    };

    const end = (commit: boolean) => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
      window.removeEventListener('pointercancel', handlePointerCancel);
      window.removeEventListener('keydown', handleKeyDown, true);
      window.removeEventListener('blur', cancel);
      window.removeEventListener('scroll', updateTarget, true);
      window.removeEventListener('touchmove', preventDefault);
      window.removeEventListener('contextmenu', preventDefault);
      if (sessionRef.current === handle) sessionRef.current = null;
      if (!session.started) return;

      cancelAnimationFrame(session.frame);
      session.preview?.remove();
      document.body.classList.remove('todo-reordering');
      setDragState(IDLE_STATE);
      suppressNextClick();

      if (commit && session.overId) onDropRef.current(session.id, session.overId);
    };

    const cancel = () => end(false);

    const handlePointerUp = (upEvent: PointerEvent) => {
      if (upEvent.pointerId === session.pointerId) end(true);
    };

    const handlePointerCancel = (cancelEvent: PointerEvent) => {
      if (cancelEvent.pointerId === session.pointerId) cancel();
    };

    const handleKeyDown = (keyEvent: KeyboardEvent) => {
      if (keyEvent.key !== 'Escape') return;
      if (session.started) {
        keyEvent.preventDefault();
        keyEvent.stopPropagation();
      }
      cancel();
    };

    const handle = { cancel };
    sessionRef.current = handle;

    window.addEventListener('pointermove', handlePointerMove, { passive: false });
    window.addEventListener('pointerup', handlePointerUp);
    window.addEventListener('pointercancel', handlePointerCancel);
    window.addEventListener('keydown', handleKeyDown, true);
    window.addEventListener('blur', cancel);
    if (isTouchLike) {
      // Belt-and-braces with the handle's `touch-action: none`: never let the page scroll mid-drag.
      window.addEventListener('touchmove', preventDefault, { passive: false });
      window.addEventListener('contextmenu', preventDefault);
    }
  };

  return { activeId: dragState.activeId, overId: dragState.overId, startDrag };
}
