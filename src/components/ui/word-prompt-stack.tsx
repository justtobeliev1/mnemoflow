"use client";

import { StackFrame } from '@/components/ui/stack-frame';

export interface WordPromptStackProps {
  prompt: string; // 大号单词提示或遮罩文本
  isLoading?: boolean; // 控制骨架屏
}

export function WordPromptStack({ prompt, isLoading }: WordPromptStackProps) {
  return (
    <StackFrame>
      {isLoading ? (
        <div className="p-6 h-full w-full flex items-center justify-center">
          <div className="h-10 w-40 bg-white/10 rounded animate-pulse" />
        </div>
      ) : (
        <div className="relative h-full w-full">
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="text-5xl md:text-6xl font-extrabold tracking-tight text-foreground/90 select-none">{prompt}</div>
          </div>
        </div>
      )}
    </StackFrame>
  );
}

export default WordPromptStack;


