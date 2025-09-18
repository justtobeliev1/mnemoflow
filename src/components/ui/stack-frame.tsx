"use client";

import { useEffect, useRef, useState } from 'react';

export interface StackFrameProps {
  children: React.ReactNode;
  height?: number; // 默认与学习舞台一致
}

// 与 MnemonicLearningStage 完全一致的间距算法
function calculateGap(width: number) {
  const minWidth = 1024;
  const maxWidth = 1456;
  const minGap = 60;
  const maxGap = 86;
  if (width <= minWidth) return minGap;
  if (width >= maxWidth)
    return Math.max(minGap, maxGap + 0.06018 * (width - maxWidth));
  return minGap + (maxGap - minGap) * ((width - minWidth) / (maxWidth - minWidth));
}

export function StackFrame({ children, height = 440 }: StackFrameProps) {
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
    <div className="flex flex-col items-center">
      <div className="relative" ref={containerRef} style={{ height, width: '72%', perspective: 1000 }}>
        <div className="absolute inset-0 bg-surface/60 border border-border glass-surface" style={getPanelStyle('left')} />
        <div className="absolute inset-0 bg-surface/50 border border-border/60 glass-surface" style={getPanelStyle('right')} />
        <div className="absolute inset-0 glass-surface p-5 md:p-6 overflow-auto" style={getPanelStyle('center')}>
          {children}
        </div>
      </div>
    </div>
  );
}

export default StackFrame;


