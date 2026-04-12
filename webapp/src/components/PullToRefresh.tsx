import React, { useState, useRef, useCallback } from 'react';
import { Loader2 } from 'lucide-react';

interface PullToRefreshProps {
  onRefresh: () => Promise<void>;
  children: React.ReactNode;
  className?: string;
}

const PULL_THRESHOLD = 80;
const RESISTANCE = 0.45;

export default function PullToRefresh({ onRefresh, children, className = '' }: PullToRefreshProps) {
  const [pullProgress, setPullProgress] = useState(0); // 0 to 1
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [isPulling, setIsPulling] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const startY = useRef(0);
  const currentY = useRef(0);

  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    if (isRefreshing) return;
    
    // Only allow pull if we are at the very top of the scrollable content
    const container = containerRef.current;
    if (container && container.scrollTop <= 0) {
      startY.current = e.touches[0].pageY;
      setIsPulling(true);
    }
  }, [isRefreshing]);

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    if (!isPulling || isRefreshing) return;

    currentY.current = e.touches[0].pageY;
    const diff = currentY.current - startY.current;

    if (diff > 0) {
      // Elastic resistance
      const progress = Math.min(diff * RESISTANCE, PULL_THRESHOLD + 20);
      setPullProgress(progress / PULL_THRESHOLD);
      
      // Prevent browser default pull-to-refresh
      if (e.cancelable) e.preventDefault();
    } else {
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [isPulling, isRefreshing]);

  const handleTouchEnd = useCallback(async () => {
    if (!isPulling || isRefreshing) return;

    if (pullProgress >= 0.95) {
      setIsRefreshing(true);
      setPullProgress(1);
      try {
        await onRefresh();
      } finally {
        // Smooth return
        setTimeout(() => {
          setIsRefreshing(false);
          setIsPulling(false);
          setPullProgress(0);
        }, 300);
      }
    } else {
      setIsPulling(false);
      setPullProgress(0);
    }
  }, [isPulling, isRefreshing, pullProgress, onRefresh]);

  return (
    <div 
      ref={containerRef}
      className={`pull-to-refresh-container ${className}`}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
      style={{ 
        position: 'relative',
        overflowY: 'auto',
        height: '100%',
        WebkitOverflowScrolling: 'touch'
      }}
    >
      {/* Pull Indicator Area */}
      <div 
        className="pull-indicator"
        style={{
          position: 'absolute',
          top: 0,
          left: 0,
          width: '100%',
          height: PULL_THRESHOLD,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          pointerEvents: 'none',
          opacity: Math.min(pullProgress * 1.5, 1),
          transform: `translateY(${(pullProgress * PULL_THRESHOLD) - PULL_THRESHOLD}px)`,
          zIndex: 0, // Behind headers usually
          transition: isRefreshing || !isPulling ? 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1), opacity 0.3s' : 'none'
        }}
      >
        <Loader2 
          size={28} 
          className={`text-blue-500 ${isRefreshing ? 'animate-spin' : ''}`}
          style={{ 
            transform: `rotate(${pullProgress * 360}deg)`,
            color: 'var(--sys-blue)',
            opacity: 0.8
          }} 
        />
      </div>

      {/* Content Area */}
      <div 
        className="pull-content"
        style={{
          position: 'relative',
          zIndex: 1,
          transform: `translateY(${isRefreshing ? PULL_THRESHOLD : (isPulling ? pullProgress * PULL_THRESHOLD : 0)}px)`,
          transition: isRefreshing || !isPulling ? 'transform 0.3s cubic-bezier(0.23, 1, 0.32, 1)' : 'none',
          background: 'transparent'
        }}
      >
        {children}
      </div>
    </div>
  );
}
