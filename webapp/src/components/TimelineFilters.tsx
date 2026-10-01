import { Search, X } from 'lucide-react';
import { FILTER_GROUPS } from '../core/itemTypes';
import { cn } from '../lib/cn';
import { isFilterGroupSelected, toggleFilterGroup } from '../store/timelineFilters';
import { useTripStore } from '../store/useTripStore';
import { useUiStore } from '../store/useUiStore';
import { Chip, IconButton, Input } from './ui';

interface TimelineFiltersProps {
  className?: string;
  /** Wrap the type chips onto several lines instead of scrolling horizontally. */
  wrap?: boolean;
}

/** Timeline search box + type filter chips (inline on desktop, in Settings on mobile). */
export default function TimelineFilters({ className, wrap = false }: TimelineFiltersProps) {
  const query = useUiStore((s) => s.timelineQuery);
  const setQuery = useUiStore((s) => s.setTimelineQuery);
  const activeFilters = useTripStore((s) => s.activeFilters);

  return (
    <div className={cn('flex flex-col gap-2', className)}>
      <div className="relative">
        <Search className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-label-tertiary" aria-hidden="true" />
        <Input
          enterKeyHint="search"
          aria-label="Search itinerary"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Search itinerary"
          className="h-11 rounded-full pr-11 pl-9"
        />
        {query && (
          <IconButton
            aria-label="Clear search"
            variant="ghost"
            size="sm"
            className="absolute top-1/2 right-1.5 -translate-y-1/2"
            onClick={() => setQuery('')}
          >
            <X size={16} />
          </IconButton>
        )}
      </div>
      <div
        role="group"
        aria-label="Itinerary type filters"
        className={cn('flex gap-2', wrap ? 'flex-wrap' : '-mx-1 overflow-x-auto px-1 pb-1')}
      >
        {FILTER_GROUPS.map((group) => (
          <Chip
            key={group.key}
            selected={isFilterGroupSelected(group.key, activeFilters)}
            aria-label={`Filter ${group.label}`}
            onClick={() => toggleFilterGroup(group.key)}
          >
            {group.label}
          </Chip>
        ))}
      </div>
    </div>
  );
}
