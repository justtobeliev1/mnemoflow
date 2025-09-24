"use client";

import React from 'react';

export interface BreakScreenProps {
  title?: string;
  description?: string;
  primaryLabel?: string;
  secondaryLabel?: string;
  onContinue?: () => void;
  onExit?: () => void;
  fullScreen?: boolean; // center in a clean page
  minimal?: boolean; // no card, pure text
  prominentSecondary?: boolean; // make secondary button more prominent
}

export function BreakScreen({ title='会话完成', description, primaryLabel='继续', secondaryLabel='退出', onContinue, onExit, fullScreen=false, minimal=false, prominentSecondary=false }: BreakScreenProps) {
  const core = (
    <div className="flex flex-col items-center justify-center gap-4">
      {title && <h2 className="text-3xl font-extrabold bg-gradient-to-r from-indigo-200 via-slate-300 to-rose-200 bg-clip-text text-transparent text-center">{title}</h2>}
      {description && <p className="text-muted whitespace-pre-line text-center max-w-2xl">{description}</p>}
      <div className="flex items-center justify-center gap-3 mt-2">
        {onContinue && <button className="px-4 py-2 rounded-md bg-primary text-primary-foreground" onClick={onContinue}>{primaryLabel}</button>}
        {onExit && (
          <button
            className={`px-4 py-2 rounded-md transition-all ${
              prominentSecondary
                ? 'bg-white hover:bg-white/90 text-gray-900 shadow-lg font-medium'
                : 'border border-border hover:bg-surface/60'
            }`}
            onClick={onExit}
          >
            {secondaryLabel}
          </button>
        )}
      </div>
    </div>
  );

  if (minimal) {
    return fullScreen ? (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {core}
      </div>
    ) : core;
  }

  const card = (
    <div className="inset-0 flex items-center justify-center">
      <div className="text-center px-6 py-8 rounded-2xl border border-border bg-surface/60 backdrop-blur-md shadow-lg max-w-xl w-[92vw]">
        {core}
      </div>
    </div>
  );

  if (fullScreen) {
    return (
      <div className="fixed inset-0 z-40 flex items-center justify-center">
        {minimal ? core : card}
      </div>
    );
  }

  return card;
}

export default BreakScreen;
