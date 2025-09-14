"use client";

import React, { useRef, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { WordListCard } from "./word-list-card";
import { cn } from "@/lib/utils";

interface WordList {
  id: number;
  name: string;
  wordCount: number;
}

interface HorizontalWordListsProps {
  wordLists: WordList[];
  onWordListClick: (listId: number) => void;
  onCreateWordList: () => void;
}

const HorizontalWordLists: React.FC<HorizontalWordListsProps> = ({
  wordLists,
  onWordListClick,
  onCreateWordList,
}) => {
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [canScrollLeft, setCanScrollLeft] = useState(false);
  const [canScrollRight, setCanScrollRight] = useState(true);

  const checkScrollability = () => {
    if (scrollContainerRef.current) {
      const { scrollLeft, scrollWidth, clientWidth } = scrollContainerRef.current;
      setCanScrollLeft(scrollLeft > 0);
      setCanScrollRight(scrollLeft < scrollWidth - clientWidth - 1);
    }
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollContainerRef.current) {
      const scrollAmount = 208; // 卡片宽度(192px) + 间距(16px)
      const newScrollLeft = scrollContainerRef.current.scrollLeft + 
        (direction === "left" ? -scrollAmount : scrollAmount);
      
      scrollContainerRef.current.scrollTo({
        left: newScrollLeft,
        behavior: "smooth",
      });
    }
  };

  React.useEffect(() => {
    checkScrollability();
    const handleResize = () => checkScrollability();
    window.addEventListener("resize", handleResize);
    return () => window.removeEventListener("resize", handleResize);
  }, [wordLists]);

  return (
    <section className="py-8">
      <h2
        className="text-2xl font-bold text-foreground mb-6 cursor-pointer hover:text-primary"
        onClick={() => onWordListClick(-1)}
        title="点击进入单词本管理页"
      >
        单词本
      </h2>
      
      {/* 限制宽度的容器 */}
      <div className="max-w-5xl mx-auto">
        <div className="relative">
          {/* 左侧滚动按钮 */}
          {canScrollLeft && (
            <button
              onClick={() => scroll("left")}
              className="absolute left-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-muted hover:text-foreground transition-colors shadow-lg"
            >
              <ChevronLeft size={20} />
            </button>
          )}

          {/* 右侧滚动按钮 */}
          {canScrollRight && (
            <button
              onClick={() => scroll("right")}
              className="absolute right-2 top-1/2 -translate-y-1/2 z-10 w-10 h-10 bg-surface/80 backdrop-blur-sm border border-border rounded-full flex items-center justify-center text-muted hover:text-foreground transition-colors shadow-lg"
            >
              <ChevronRight size={20} />
            </button>
          )}

          {/* 滚动容器 */}
          <div
            ref={scrollContainerRef}
            onScroll={checkScrollability}
            className="flex gap-4 overflow-x-auto scrollbar-hide pb-6 pt-2 px-4"
            style={{
              scrollbarWidth: "none",
              msOverflowStyle: "none",
            }}
          >
            {/* 单词本卡片 */}
            {wordLists.map((list, index) => (
              <div key={index} className="flex-shrink-0 w-48">
                <WordListCard
                  id={list.id}
                  name={list.name}
                  wordCount={list.wordCount}
                  onClick={() => onWordListClick(list.id)}
                  className="h-24"
                />
              </div>
            ))}
            
            {/* 创建新单词本卡片 */}
            <div className="flex-shrink-0 w-48">
              <WordListCard
                name=""
                wordCount={0}
                isCreateNew={true}
                onClick={onCreateWordList}
                className="h-24"
              />
            </div>
          </div>

          {/* 进度指示器 */}
          <div className="flex justify-center mt-4 gap-1">
            {Array.from({ length: Math.ceil((wordLists.length + 1) / 3) }).map((_, index) => (
              <div
                key={index}
                className={cn(
                  "w-2 h-2 rounded-full transition-colors",
                  index === 0 ? "bg-foreground" : "bg-muted"
                )}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};

export { HorizontalWordLists };
