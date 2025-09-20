'use client';

import React from 'react';
import { motion } from 'framer-motion';
import { cn } from '@/lib/utils';

interface LearnWordListCardProps {
  listId: number;
  listName: string;
  newWords: number;
  learnedWords: number;
  totalWords: number;
  onClick: (listId: number) => void;
  className?: string;
}

export function LearnWordListCard({
  listId,
  listName,
  newWords,
  learnedWords,
  totalWords,
  onClick,
  className,
}: LearnWordListCardProps) {
  return (
    <motion.div
      onClick={() => onClick(listId)}
      className={cn(
        'group relative glass-surface rounded-xl p-5 text-left transition-all duration-300 hover:scale-[1.03] hover:shadow-lg hover:border-primary/50 flex flex-col justify-between overflow-hidden cursor-pointer h-40',
        className
      )}
      whileHover={{ y: -5 }}
    >
      <div className="flex flex-col h-full">
        {/* Top Section */}
        <div className="flex items-center gap-3 mb-3">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5 text-foreground/80 group-hover:text-primary transition-colors"><path d="M4 19.5v-15A2.5 2.5 0 0 1 6.5 2H20v20H6.5a2.5 2.5 0 0 1 0-5H20"></path></svg>
          <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-md line-clamp-2">
            {listName}
          </h3>
        </div>

        {/* Middle Section (Stretched) */}
        <div className="flex-grow" />

        {/* Bottom Section */}
        <div>
          <p className="text-sm text-foreground/70">本次可学</p>
          <div className="flex items-baseline gap-2 mt-1">
            <span className="text-3xl font-bold text-white">{newWords}</span>
            <span className="text-lg text-foreground/80">个新词</span>
          </div>
          <p className="text-xs text-foreground/60 font-mono mt-2 text-right">
            {learnedWords} / {totalWords}
          </p>
        </div>
      </div>
       <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
    </motion.div>
  );
}
