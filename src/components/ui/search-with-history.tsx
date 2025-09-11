"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";

interface SearchHistoryItem {
  word: string;
  definition: string;
  searchedAt: string;
}

interface SearchWithHistoryProps {
  onSearch?: (query: string) => void;
  placeholder?: string;
  className?: string;
}

const SearchWithHistory: React.FC<SearchWithHistoryProps> = ({
  onSearch,
  placeholder = "请输入想要查询的单词",
  className,
}) => {
  const [query, setQuery] = useState("");
  const [isOpen, setIsOpen] = useState(false);
  const [searchHistory] = useState<SearchHistoryItem[]>([
    { word: "flow", definition: "流动; 流畅; 流程", searchedAt: "2分钟前" },
    { word: "yellow", definition: "黄色的; 黄色的(比喻意义)", searchedAt: "15分钟前" },
    { word: "purple", definition: "紫色的; 紫红色的", searchedAt: "1小时前" },
    { word: "orange", definition: "橙子; 橙色的; 橙色", searchedAt: "今天早上" },
  ]);

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleHistoryClick = (word: string) => {
    setQuery(word);
    handleSearch(word);
  };

  // 点击外部关闭下拉
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={containerRef} className={cn("relative w-full max-w-2xl mx-auto", className)}>
      {/* 搜索输入框 */}
      <div className="relative">
        <input
          ref={inputRef}
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          onKeyPress={handleKeyPress}
          onFocus={() => setIsOpen(true)}
          placeholder={placeholder}
          className="w-full px-4 py-3 pr-12 text-lg bg-surface/80 backdrop-blur-sm border border-border rounded-xl focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-all duration-200 text-foreground placeholder-muted"
        />
        <button
          onClick={() => handleSearch(query)}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-muted hover:text-foreground transition-colors duration-200"
        >
          <Search size={20} />
        </button>
      </div>

      {/* 搜索历史下拉 */}
      {isOpen && searchHistory.length > 0 && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-surface rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock size={16} />
              <span>搜索历史</span>
            </div>
          </div>
          
          <div className="py-2">
            {searchHistory.map((item, index) => (
              <button
                key={index}
                onClick={() => handleHistoryClick(item.word)}
                className="w-full px-4 py-3 text-left hover:bg-surface/60 transition-colors duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.word}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      {item.definition}
                    </div>
                  </div>
                  <div className="text-xs text-muted ml-4">
                    {item.searchedAt}
                  </div>
                </div>
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
};

export { SearchWithHistory };
