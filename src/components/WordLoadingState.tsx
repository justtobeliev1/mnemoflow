'use client';

export function WordLoadingState() {
  return (
    <div className="glass-surface rounded-xl p-8 space-y-8 animate-pulse">
      {/* 单词标题和音标加载 */}
      <div className="space-y-4">
        <div className="h-10 bg-surface/50 rounded-lg w-48"></div>
        <div className="flex items-center gap-4">
          <div className="h-6 bg-surface/50 rounded w-16"></div>
          <div className="h-6 bg-surface/50 rounded w-32"></div>
          <div className="h-8 w-8 bg-surface/50 rounded-lg"></div>
        </div>
      </div>
      
      {/* 释义加载 */}
      <div className="space-y-4">
        <div className="h-6 bg-surface/50 rounded w-16"></div>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <div className="h-6 bg-surface/50 rounded w-8 shrink-0"></div>
            <div className="h-6 bg-surface/50 rounded flex-1"></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 bg-surface/50 rounded w-8 shrink-0"></div>
            <div className="h-6 bg-surface/50 rounded w-3/4"></div>
          </div>
          <div className="flex items-start gap-3">
            <div className="h-6 bg-surface/50 rounded w-8 shrink-0"></div>
            <div className="h-6 bg-surface/50 rounded w-2/3"></div>
          </div>
        </div>
      </div>
      
      {/* 标签加载 */}
      <div className="space-y-4">
        <div className="flex items-center gap-2">
          <div className="h-5 w-5 bg-surface/50 rounded"></div>
          <div className="h-6 bg-surface/50 rounded w-10"></div>
        </div>
        <div className="flex gap-2">
          <div className="h-6 bg-surface/50 rounded-full w-16"></div>
          <div className="h-6 bg-surface/50 rounded-full w-20"></div>
          <div className="h-6 bg-surface/50 rounded-full w-12"></div>
        </div>
      </div>
    </div>
  );
}

export function WordNotFound({ word }: { word: string }) {
  return (
    <div className="word-not-found">
      <div className="not-found-icon">📚</div>
      <h2 className="not-found-title">单词未找到</h2>
      <p className="not-found-message">
        未能找到单词 "<strong>{word}</strong>"
      </p>
      <div className="not-found-suggestions">
        <p>建议：</p>
        <ul>
          <li>检查单词拼写是否正确</li>
          <li>尝试搜索单词的其他形式</li>
          <li>使用更常见的单词进行搜索</li>
        </ul>
      </div>
    </div>
  );
}

export function WordErrorState({ 
  error, 
  onRetry 
}: { 
  error: string; 
  onRetry: () => void; 
}) {
  return (
    <div className="word-error-state">
      <div className="error-icon">⚠️</div>
      <h2 className="error-title">加载失败</h2>
      <p className="error-message">{error}</p>
      <button 
        onClick={onRetry}
        className="retry-btn"
        type="button"
      >
        重试
      </button>
    </div>
  );
}