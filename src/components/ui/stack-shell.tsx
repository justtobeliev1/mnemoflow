"use client";

import { useEffect, useRef, useState } from 'react';
import clsx from 'clsx';

export interface StackShellProps {
  children: React.ReactNode;
  height?: number;
  innerClassName?: string;
}

function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1400;
  if (width <= minWidth) return 120;
  if (width >= maxWidth) return 220;
  return 120 + (width - minWidth) / (maxWidth - minWidth) * (220 - 120);
}

export function StackShell({ children, height = 460, innerClassName }: StackShellProps) {
  const [containerWidth, setContainerWidth] = useState(1200);
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const onResize = () => {
      if (containerRef.current) setContainerWidth(containerRef.current.offsetWidth);
    };
    onResize();
    window.addEventListener('resize', onResize);
    return () => window.removeEventListener('resize', onResize);
  }, []);

  function getPanelStyle(kind: 'left' | 'center' | 'right'): React.CSSProperties {
    const gap = calculateGap(containerWidth);
    const maxStickUp = gap * 0.8;
    const common: React.CSSProperties = {
      borderRadius: 24,
      boxShadow: '0 10px 30px rgba(0,0,0,0.35)'
    };
    if (kind === 'center') {
      return { ...common, zIndex: 3, transform: `translateX(0px) translateY(0px) scale(1) rotateY(0deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)' };
    }
    if (kind === 'left') {
      return { ...common, zIndex: 2, transform: `translateX(-${gap}px) translateY(-${maxStickUp}px) scale(0.92) rotateY(15deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)', opacity: 0.9 };
    }
    return { ...common, zIndex: 2, transform: `translateX(${gap}px) translateY(-${maxStickUp}px) scale(0.92) rotateY(-15deg)`, transition: 'all 0.8s cubic-bezier(.4,2,.3,1)', opacity: 0.9 };
  }

  return (
    <div ref={containerRef} className="relative w-full max-w-[560px]" style={{ height }}>
      {/* back-left */}
      <div className="absolute inset-0 bg-surface/60 border border-border glass-surface" style={getPanelStyle('left')} />
      {/* back-right */}
      <div className="absolute inset-0 bg-surface/50 border border-border/60 glass-surface" style={getPanelStyle('right')} />
      {/* center card with content */}
      <div className={clsx("absolute inset-0 glass-surface overflow-auto", innerClassName)} style={getPanelStyle('center')}>
        {children}
      </div>
    </div>
  );
}

export default StackShell;


