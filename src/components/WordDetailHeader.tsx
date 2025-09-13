'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

interface WordDetailHeaderProps {
  onBack: () => void;
  currentWord: string;
}

export function WordDetailHeader({ onBack, currentWord }: WordDetailHeaderProps) {
  const [searchValue, setSearchValue] = useState('');
  const router = useRouter();
  
  // 确保搜索框始终为空，除非用户输入
  useEffect(() => {
    setSearchValue('');
  }, [currentWord]);
  
  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    
    const trimmedValue = searchValue.trim();
    if (!trimmedValue) return;
    
    // 跳转到新的单词页面
    router.push(`/words/${encodeURIComponent(trimmedValue)}`);
  };
  
  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      // ESC键清空搜索框
      setSearchValue('');
    }
  };
  
  return (
    <div className="glass-surface border-b border-border/50">
      <div className="max-w-4xl mx-auto px-8 py-4 flex items-center justify-between">
        {/* 简洁的返回按钮 */}
        <button 
          onClick={onBack}
          className="text-2xl text-foreground hover:text-muted transition-colors p-2 hover:bg-surface/30 rounded-lg"
          type="button"
          title="返回上一页"
        >
          ‹
        </button>
        
        {/* 搜索框 */}
        <form onSubmit={handleSearch} className="flex-1 max-w-md ml-8">
          <div className="relative">
            <input
              type="text"
              value={searchValue}
              onChange={(e) => setSearchValue(e.target.value)}
              onKeyDown={handleKeyDown}
              className="w-full px-4 py-2 bg-surface/30 border border-border/30 rounded-lg text-foreground placeholder-muted focus:outline-none focus:ring-2 focus:ring-white/20 focus:border-transparent transition-all"
              placeholder="搜索其他单词"
              autoComplete="off"
            />
          </div>
        </form>
      </div>
    </div>
  );
}