"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { PronunciationButton } from '@/components/PronunciationButton';

export interface DefinitionItem { pos: string; meaning: string }

export interface DictionaryStackProps {
  word: string;
  phonetic?: string;
  definitions: DefinitionItem[];
  tags?: string[];
}

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

export function DictionaryStack({ word, phonetic, definitions, tags = [] }: DictionaryStackProps) {
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

  const grouped = useMemo(() => {
    const map: Record<string, string[]> = {};
    for (const d of definitions) {
      const key = d.pos || '—';
      if (!map[key]) map[key] = [];
      map[key].push(d.meaning);
    }
    return map;
  }, [definitions]);

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
      <div className="relative" ref={containerRef} style={{ height: 440, width: '72%', perspective: 1000 }}>
        {/* back-left */}
        <div className="absolute inset-0 bg-surface/60 border border-border glass-surface" style={getPanelStyle('left')} />
        {/* back-right */}
        <div className="absolute inset-0 bg-surface/50 border border-border/60 glass-surface" style={getPanelStyle('right')} />
        {/* center card with content */}
        <div className="absolute inset-0 glass-surface p-5 md:p-6 overflow-auto" style={getPanelStyle('center')}>
          <div className="space-y-4">
            <div className="space-y-2">
              <h1 className="text-3xl md:text-4xl font-extrabold text-foreground tracking-tight">{word}</h1>
              {phonetic && (
                <div className="flex items-center gap-3 text-muted">
                  <span className="text-base">{phonetic}</span>
                  <PronunciationButton word={word} accent="US" />
                </div>
              )}
            </div>
            <div className="space-y-3">
              {Object.entries(grouped).map(([pos, list]) => (
                <div key={pos} className="flex items-start gap-3">
                  {pos !== '—' && <span className="text-xs md:text-sm text-muted bg-surface/30 px-2 py-1 rounded-md shrink-0">{pos}</span>}
                  <div className="space-y-1">
                    {list.map((m, i) => (
                      <p key={i} className="text-foreground/90 leading-relaxed">{m}</p>
                    ))}
                  </div>
                </div>
              ))}
            </div>
            {tags.length > 0 && (
              <div className="flex flex-wrap gap-2 pt-1">
                {tags.map((t, i) => (
                  <span key={i} className="text-xs text-slate-200/90 bg-slate-600/30 border border-border/60 px-2.5 py-1 rounded-full">{t}</span>
                ))}
              </div>
            )}

            {/* 仅展示权威释义，不显示操作按钮 */}
          </div>
        </div>
      </div>
    </div>
  );
}

export default DictionaryStack;


