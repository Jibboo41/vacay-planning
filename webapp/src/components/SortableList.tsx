import type { CSSProperties, ReactNode } from 'react';
import type { UniqueIdentifier } from '@dnd-kit/core';
import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type SortableListItemProps = {
  id: UniqueIdentifier;
  disabled?: boolean;
  children: (sortable: Pick<ReturnType<typeof useSortable>, 'attributes' | 'isDragging' | 'listeners' | 'setActivatorNodeRef' | 'setNodeRef'> & { style: CSSProperties }) => ReactNode;
};

export function SortableListItem({ id, disabled = false, children }: SortableListItemProps) {
  const { attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, transform, transition } = useSortable({ id, disabled });
  const style: CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
  };

  return <>{children({ attributes, isDragging, listeners, setActivatorNodeRef, setNodeRef, style })}</>;
}
