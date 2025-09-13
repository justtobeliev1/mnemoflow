'use client';

import { useState, useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';

interface WordData {
  id: number;
  word: string;
}

interface WordList {
  id: number;
  name: string;
  word_count: number;
}

interface CollectWordButtonProps {
  word: WordData;
  onCollected?: () => void;
}

export function CollectWordButton({ word, onCollected }: CollectWordButtonProps) {
  const [showSelector, setShowSelector] = useState(false);
  const [wordLists, setWordLists] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isCollected, setIsCollected] = useState(false);
  const { session } = useAuth();
  
  // 获取用户单词本列表
  const fetchWordLists = async () => {
    if (!session?.access_token) return;
    
    try {
      const response = await fetch('/api/me/word-lists', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });
      
      if (response.ok) {
        const data = await response.json();
        setWordLists(data.word_lists || []);
      } else {
        throw new Error('获取单词本列表失败');
      }
    } catch (err) {
      console.error('获取单词本列表失败:', err);
      setError('获取单词本列表失败');
    }
  };
  
  // 收藏单词到指定单词本
  const handleCollect = async (listId: number) => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      const response = await fetch('/api/me/words', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({
          word_id: word.id,
          list_id: listId
        })
      });
      
      if (response.ok) {
        setShowSelector(false);
        setIsCollected(true);
        onCollected?.();
        
        // 显示成功提示
        if (typeof window !== 'undefined') {
          // 这里可以集成toast通知，暂时用alert
          alert('单词已收藏，助记内容正在生成中...');
        }
      } else {
        const errorData = await response.json();
        throw new Error(errorData.error || '收藏失败');
      }
    } catch (err) {
      console.error('收藏单词失败:', err);
      setError(err instanceof Error ? err.message : '收藏失败');
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenSelector = () => {
    if (!session) {
      alert('请先登录');
      return;
    }
    
    setShowSelector(true);
    fetchWordLists();
  };
  
  return (
    <>
      <button
        onClick={handleOpenSelector}
        className={`p-3 text-white hover:text-primary transition-colors rounded-lg hover:bg-surface/30 ${isCollected ? 'text-orange-400' : ''}`}
        disabled={loading}
        title="收藏到单词本"
      >
        {isCollected ? (
          // a a a a
          <svg className="w-8 h-8 icon" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M978.489 471.04c20.48-22.756 29.582-54.613 18.204-84.196-9.102-29.582-34.133-50.062-61.44-52.337l-220.729-34.134c-9.102-2.275-15.928-6.826-20.48-15.929L593.92 75.094c-13.653-27.307-40.96-45.512-70.542-45.512s-56.89 15.93-70.542 45.511l-97.85 209.351c-4.55 9.103-11.377 15.93-20.48 15.93l-220.728 34.133c-29.582 4.55-52.338 25.03-61.44 52.337-9.102 29.583-2.276 61.44 18.204 84.196l161.565 163.84c6.826 6.827 9.102 15.929 6.826 27.307l-38.684 229.83c-4.551 31.859 6.827 61.44 34.133 79.645 25.031 15.93 54.614 18.205 81.92 4.551l197.974-109.226c6.826-4.551 15.928-4.551 22.755 0l197.973 109.226c11.378 6.827 25.032 9.103 36.41 9.103 15.928 0 31.857-4.552 45.51-13.654 25.032-18.204 38.685-47.786 31.858-79.644L810.098 659.91c-2.276-9.102 2.275-20.48 9.102-27.307L978.489 471.04z" fill="currentColor"></path></svg>
        ) : (
          // a a a a
          <svg className="w-8 h-8 icon" viewBox="0 0 1059 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M253.488042 1024c-16.9 0-33.2875-5.1125-47.6125-15.3625-26.625-18.425-39.425-49.6625-34.3125-81.925l40.9625-251.9c1.5375-10.2375-1.5375-20.475-8.7-27.65L28.213042 466.4375c-22.0125-22.525-29.1875-55.3-19.45-84.9875 9.725-29.7 35.325-51.2 66.05-55.8125l237.575-36.35c10.75-1.5375 19.4625-8.1875 24.0625-17.925L441.388042 48.125c13.825-29.7 42.5-48.125 75.2625-48.125s61.4375 18.4375 75.2625 48.125l104.45 223.2375c4.6125 9.725 13.825 16.375 24.0625 17.925L958.000542 325.625a82.355 82.355 0 0 1 66.05 55.8125c10.2375 29.7 2.5625 62.4625-19.45 84.9875l-175.625 180.7375c-7.1625 7.175-10.2375 17.925-8.7 27.65l40.9625 251.9c5.125 31.75-8.1875 63.4875-34.3 81.925-26.1125 18.4375-59.9 20.4875-88.0625 4.6125l-206.85-114.6875c-9.725-5.1125-20.9875-5.1125-30.7125 0l-207.3625 115.2c-12.8125 6.65-26.6375 10.2375-40.4625 10.2375zM516.650542 51.2c-12.8 0-23.55 7.1625-29.1875 18.4375L383.525542 292.875c-11.775 25.0875-35.325 43.0125-62.975 47.1l-237.575 36.35c-12.2875 2.05-21.5 9.7375-25.6 21.5-4.1 11.775-1.025 24.0625 7.675 32.775L240.688042 611.325c18.4375 18.95 26.625 45.5625 22.525 71.675L222.250542 934.9125c-2.05 12.8 3.075 24.575 13.3125 31.7375 10.2375 7.175 23.0375 7.6875 33.7875 1.5375l207.3625-115.2c25.0875-13.825 55.3-13.825 80.3875 0l207.3625 115.2c10.75 6.1375 23.55 5.625 33.8-1.5375 10.2375-7.1625 15.3625-18.95 13.3125-31.7375L770.625542 683.0125c-4.1-26.1125 4.1-52.7375 22.525-71.675l175.625-180.7375c8.7-8.7 11.2625-20.9875 7.675-32.775-4.0875-11.775-13.3125-19.9625-25.6-21.5l-237.5625-36.35c-27.65-4.0875-51.2-22.0125-62.975-47.1L545.838042 69.6375c-5.625-11.2625-16.375-18.4375-29.1875-18.4375z m0 0" fill="currentColor"></path></svg>
        )}
      </button>
      
      {showSelector && (
        <WordListSelector
          wordLists={wordLists}
          onSelect={handleCollect}
          onCancel={() => setShowSelector(false)}
          loading={loading}
          error={error}
        />
      )}
    </>
  );
}

// 单词本选择器组件
function WordListSelector({
  wordLists,
  onSelect,
  onCancel,
  loading,
  error
}: {
  wordLists: WordList[];
  onSelect: (listId: number) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
}) {
  return (
    <div className="word-list-selector-overlay">
      <div className="word-list-selector-modal">
        <div className="selector-header">
          <h3>选择单词本</h3>
          <button 
            onClick={onCancel}
            className="close-btn"
            disabled={loading}
          >
            ✕
          </button>
        </div>
        
        <div className="selector-content">
          {error && (
            <div className="error-message">
              {error}
            </div>
          )}
          
          {wordLists.length === 0 ? (
            <div className="empty-state">
              <p>暂无单词本</p>
              <p className="empty-hint">请先创建一个单词本</p>
            </div>
          ) : (
            <div className="word-lists-grid">
              {wordLists.map(list => (
                <button
                  key={list.id}
                  onClick={() => onSelect(list.id)}
                  className="word-list-item"
                  disabled={loading}
                >
                  <div className="list-name">{list.name}</div>
                  <div className="list-count">{list.word_count} 词</div>
                </button>
              ))}
            </div>
          )}
        </div>
        
        <div className="selector-footer">
          <button 
            onClick={onCancel}
            className="cancel-btn"
            disabled={loading}
          >
            取消
          </button>
        </div>
      </div>
    </div>
  );
}