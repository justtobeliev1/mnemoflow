"use client";

import React from "react";
import { Book, Plus } from "lucide-react";
import { cn } from "@/lib/utils";

interface WordListCardProps {
  name: string;
  wordCount: number;
  isDefault?: boolean;
  isCreateNew?: boolean;
  onClick?: () => void;
  className?: string;
}

const WordListCard: React.FC<WordListCardProps> = ({
  name,
  wordCount,
  isDefault = false,
  isCreateNew = false,
  onClick,
  className,
}) => {
  if (isCreateNew) {
    return (
      <button
        onClick={onClick}
        className={cn(
          "group relative w-full glass-surface rounded-xl p-4 text-center transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50",
          "h-full flex flex-col items-center justify-center overflow-hidden",
          className
        )}
      >
        <div className="flex items-center justify-center mb-2">
          <Plus size={16} className="text-primary group-hover:text-foreground transition-colors" />
        </div>
        <span className="text-foreground font-medium text-sm">添加单词本</span>
      </button>
    );
  }

  return (
    <button
      onClick={onClick}
      className={cn(
        "group relative w-full glass-surface rounded-xl p-4 text-left transition-all duration-300 hover:scale-[1.02] hover:shadow-lg hover:border-primary/50",
        "h-full flex flex-col overflow-hidden",
        className
      )}
    >
      {/* 图标 */}
      <div className="flex items-center justify-start mb-3">
        <Book size={16} className="text-primary group-hover:text-foreground transition-colors" />
      </div>
      
      {/* 单词本信息 */}
      <div className="flex-1 space-y-1">
        <h3 className="font-semibold text-foreground group-hover:text-primary transition-colors text-sm line-clamp-2">
          {name}
        </h3>
        <p className="text-xs text-muted">
          {wordCount} 词
        </p>
      </div>
      
      {/* 悬停效果 */}
      <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 to-accent/5 opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    </button>
  );
};

export { WordListCard };
