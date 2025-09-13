"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { Search, Clock, Loader2 } from "lucide-react";
import { cn, formatRelativeTime } from "@/lib/utils";
import { useSupabase } from "@/hooks/useSupabase";

interface ApiSearchHistoryItem {
  id: number;
  word_id: number;
  search_count: number;
  last_searched_at: string;
  words: {
    id: number;
    word: string;
    definition: string | null;
    phonetic: string | null;
    tags: string[] | null;
  };
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
  const [searchHistory, setSearchHistory] = useState<ApiSearchHistoryItem[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { authedFetch } = useSupabase();

  const truncateDefinition = (def: string | null): string => {
    if (!def) return '暂无释义';
    // The definition string contains literal '\\n' which should be treated as a separator.
    const firstLine = def.split('\\n')[0];
    return firstLine;
  };

  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const handleSearch = (searchQuery: string) => {
    if (searchQuery.trim()) {
      onSearch?.(searchQuery.trim());
      setIsOpen(false);
    }
  };

  const fetchSearchHistory = useCallback(async () => {
    if (searchHistory.length > 0) {
      setIsOpen(true);
      return;
    }

    setIsLoading(true);
    setError(null);
    try {
      const response = await authedFetch('/api/me/search-history?limit=20');
      if (!response.ok) {
        throw new Error('获取搜索历史失败');
      }
      const data = await response.json();
      setSearchHistory(data.search_history || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : '未知错误');
    } finally {
      setIsLoading(false);
    }
  }, [searchHistory.length, authedFetch]);

  const handleFocus = () => {
    setIsOpen(true);
    fetchSearchHistory();
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
          onFocus={handleFocus}
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
      {isOpen && (
        <div className="absolute top-full left-0 right-0 mt-2 glass-surface rounded-xl shadow-xl z-50 max-h-80 overflow-y-auto">
          <div className="p-3 border-b border-border">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Clock size={16} />
              <span>搜索历史</span>
            </div>
          </div>
          
          {isLoading && (
            <div className="flex items-center justify-center p-6">
              <Loader2 className="animate-spin text-muted" size={24} />
            </div>
          )}

          {error && (
            <div className="p-4 text-sm text-red-500 text-center">
              {error}
            </div>
          )}

          {!isLoading && !error && searchHistory.length > 0 && (
            <div className="py-2">
              {searchHistory.map((item) => (
                <button
                  key={item.id}
                  onClick={() => handleHistoryClick(item.words.word)}
                  className="w-full px-4 py-3 text-left hover:bg-surface/60 transition-colors duration-150 group"
                >
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                        {item.words.word}
                      </div>
                      <div className="text-sm text-muted mt-1 truncate">
                        {truncateDefinition(item.words.definition)}
                      </div>
                    </div>
                    <div className="text-xs text-muted ml-4 whitespace-nowrap">
                      {formatRelativeTime(item.last_searched_at)}
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}

          {!isLoading && !error && searchHistory.length === 0 && (
            <div className="p-4 text-sm text-muted text-center">
              暂无搜索历史
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export { SearchWithHistory };
