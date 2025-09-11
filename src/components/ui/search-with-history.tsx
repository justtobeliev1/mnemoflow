"use client";

import React, { useState, useRef, useEffect } from "react";
import { Search, Clock } from "lucide-react";
import { cn } from "@/lib/utils";
import { useAuth } from "@/contexts/AuthContext";
import { supabase } from "@/lib/supabase";

interface SearchHistoryItem {
  id: string;
  query: string;
  search_count: number;
  last_searched_at: string;
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
  const [searchHistory, setSearchHistory] = useState<SearchHistoryItem[]>([]);
  const [loading, setLoading] = useState(false);
  
  const { session } = useAuth();
  const inputRef = useRef<HTMLInputElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  // 获取搜索历史
  const fetchSearchHistory = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/me/search-history?limit=5', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setSearchHistory(data.history);
      }
    } catch (error) {
      console.error('获取搜索历史失败:', error);
    }
  };

  // 添加搜索记录
  const addSearchRecord = async (searchQuery: string, resultsCount: number = 0) => {
    if (!session?.access_token) return;

    try {
      await fetch('/api/me/search-history', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          query: searchQuery,
          resultsCount
        })
      });
    } catch (error) {
      console.error('添加搜索记录失败:', error);
    }
  };

  // 组件挂载时获取搜索历史
  useEffect(() => {
    if (session) {
      fetchSearchHistory();
    }
  }, [session]);

  const handleSearch = async (searchQuery: string) => {
    if (searchQuery.trim()) {
      setLoading(true);
      
      // 执行搜索
      onSearch?.(searchQuery.trim());
      
      // 添加搜索记录
      await addSearchRecord(searchQuery.trim());
      
      // 重新获取搜索历史
      await fetchSearchHistory();
      
      setIsOpen(false);
      setLoading(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      handleSearch(query);
    }
  };

  const handleHistoryClick = (searchQuery: string) => {
    setQuery(searchQuery);
    handleSearch(searchQuery);
  };

  // 格式化时间显示
  const formatTimeAgo = (dateString: string) => {
    const now = new Date();
    const searchTime = new Date(dateString);
    const diffInMinutes = Math.floor((now.getTime() - searchTime.getTime()) / (1000 * 60));
    
    if (diffInMinutes < 1) return "刚刚";
    if (diffInMinutes < 60) return `${diffInMinutes}分钟前`;
    if (diffInMinutes < 1440) return `${Math.floor(diffInMinutes / 60)}小时前`;
    return `${Math.floor(diffInMinutes / 1440)}天前`;
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
          disabled={loading}
          className="absolute right-3 top-1/2 transform -translate-y-1/2 p-2 text-muted hover:text-foreground transition-colors duration-200 disabled:opacity-50"
        >
          {loading ? (
            <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-muted"></div>
          ) : (
            <Search size={20} />
          )}
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
            {searchHistory.map((item) => (
              <button
                key={item.id}
                onClick={() => handleHistoryClick(item.query)}
                className="w-full px-4 py-3 text-left hover:bg-surface/60 transition-colors duration-150 group"
              >
                <div className="flex items-center justify-between">
                  <div className="flex-1">
                    <div className="font-medium text-foreground group-hover:text-primary transition-colors">
                      {item.query}
                    </div>
                    <div className="text-sm text-muted mt-1">
                      {item.search_count} 次搜索
                    </div>
                  </div>
                  <div className="text-xs text-muted ml-4">
                    {formatTimeAgo(item.last_searched_at)}
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
