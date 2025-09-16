'use client';

import { useState, useEffect, useMemo } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useSWR from 'swr';
import { ToastManager } from '@/components/ui/toast-notification';
import { ConfirmModal } from '@/components/ui/confirm-modal';

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
  const [wordListsCache, setWordListsCache] = useState<WordList[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [currentListId, setCurrentListId] = useState<number | null>(null);
  const [pendingMoveListId, setPendingMoveListId] = useState<number | null>(null);
  const { session } = useAuth();
  const { success, error: toastError } = {
    success: (msg: string) => ToastManager.getInstance().show({ message: msg, type: 'success' }),
    error: (msg: string) => ToastManager.getInstance().show({ message: msg, type: 'error' }),
  };
  const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());
  const { data: listsData, mutate } = useSWR('/api/me/word-lists', fetcher, { revalidateOnFocus: true });
  const wordLists: WordList[] = (listsData?.word_lists || wordListsCache) as WordList[];
  
  useEffect(() => {
    if (listsData?.word_lists) setWordListsCache(listsData.word_lists);
  }, [listsData]);

  // 获取当前单词是否已收藏（以及所属列表）
  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        const res = await fetch(`/api/me/words/${word.id}`, { method: 'GET' });
        if (res.ok) {
          const data = await res.json();
          if (mounted) setCurrentListId(data?.word_list_id ?? null);
        }
      } catch {}
    })();
    return () => { mounted = false; };
  }, [word.id]);
  
  // 收藏单词到指定单词本
  const handleCollect = async (listId: number) => {
    if (!session?.access_token) return;
    
    setLoading(true);
    setError(null);
    
    try {
      setShowSelector(false);
      // 取消收藏
      if (listId === 0) {
        const prev = currentListId;
        setCurrentListId(null);
        const res = await fetch(`/api/me/words/${word.id}`, { method: 'DELETE', headers: { 'Authorization': `Bearer ${session.access_token}` } });
        if (!res.ok) {
          setCurrentListId(prev); // 回滚
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error?.message || '取消收藏失败');
        }
        success('已取消收藏');
        mutate();
        onCollected?.();
        return;
      }

      // 如果已收藏到其它列表，弹出二次确认改为移动
      if (currentListId && currentListId !== listId) {
        setPendingMoveListId(listId);
        setLoading(false);
        return; // 移动逻辑在确认弹窗中处理
      }

      // 正常“添加收藏”
      setCurrentListId(listId);
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
        success('已收藏到单词本');
        onCollected?.();
        mutate();
        // 静默触发助记生成（失败不打扰用户，服务端已做重试与状态管理）
        try {
          // 先查询是否已有助记（避免二次生成）
          const check = await fetch(`/api/mnemonics/${word.id}?timeout=1000`, { headers: { 'Authorization': `Bearer ${session.access_token}` }, cache: 'no-store' });
          if (!check.ok || check.status === 404) {
            fetch(`/api/mnemonics/${word.id}`, { method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` }, body: JSON.stringify({}) });
          }
        } catch {}
      } else {
        const errorData = await response.json();
        throw new Error(errorData?.error?.message || '收藏失败');
      }
    } catch (err) {
      setCurrentListId(null); // 回滚
      const msg = err instanceof Error ? err.message : '收藏失败';
      setError(msg);
      toastError(msg);
      setShowSelector(true); // 失败重新弹出
    } finally {
      setLoading(false);
    }
  };
  
  const handleOpenSelector = () => {
    if (!session) {
      alert('请先登录');
      return;
    }
    // 先使用缓存渲染，再后台刷新
    setShowSelector(true);
    mutate();
  };
  
  return (
    <>
      <button
        onClick={handleOpenSelector}
        className={`p-3 text-white hover:text-primary transition-colors rounded-lg hover:bg-surface/30`}
        disabled={loading}
        title="收藏到单词本"
      >
        <svg className="w-8 h-8 icon" viewBox="0 0 1024 1024" xmlns="http://www.w3.org/2000/svg"><path d="M821.1 41.5H184.7c-34.9 1.8-62.9 30-64.4 65v843c0 0.7 0 1.3 0.1 2 0 0.3 0 0.6 0.1 1 0 0.3 0 0.7 0.1 1 0 0.4 0.1 0.8 0.1 1.2 0 0.3 0.1 0.5 0.1 0.8 0.1 0.4 0.1 0.9 0.2 1.3 0 0.2 0.1 0.4 0.1 0.7 0.1 0.4 0.2 0.9 0.3 1.3 0.1 0.2 0.1 0.4 0.1 0.6l0.3 1.2c0.1 0.2 0.1 0.5 0.2 0.7 0.1 0.4 0.2 0.8 0.4 1.1 0.1 0.3 0.2 0.5 0.3 0.8 0.1 0.3 0.3 0.7 0.4 1l0.3 0.9c0.1 0.3 0.3 0.6 0.4 0.9 0.1 0.3 0.3 0.7 0.4 1 0.1 0.2 0.2 0.5 0.4 0.7 0.2 0.4 0.4 0.7 0.5 1.1 0.1 0.2 0.2 0.4 0.4 0.6 0.2 0.4 0.4 0.7 0.6 1.1 0.1 0.2 0.2 0.4 0.4 0.6 0.2 0.4 0.5 0.7 0.7 1.1 0.1 0.2 0.3 0.4 0.4 0.6 0.2 0.4 0.5 0.7 0.8 1.1 0.2 0.2 0.3 0.4 0.5 0.6 0.2 0.3 0.5 0.6 0.7 0.9 0.2 0.3 0.5 0.5 0.7 0.8 0.2 0.2 0.4 0.5 0.6 0.7 0.5 0.5 0.9 1 1.4 1.5 0.5 0.5 1 0.9 1.5 1.4 0.2 0.2 0.5 0.4 0.7 0.6 0.3 0.2 0.5 0.5 0.8 0.7 0.3 0.3 0.6 0.5 0.9 0.7 0.2 0.2 0.4 0.3 0.6 0.5 0.4 0.3 0.7 0.5 1.1 0.8 0.2 0.1 0.4 0.3 0.6 0.4 0.4 0.2 0.7 0.5 1.1 0.7 0.2 0.1 0.4 0.2 0.6 0.4 0.4 0.2 0.7 0.4 1.1 0.5 0.2 0.1 0.5 0.2 0.7 0.4 0.3 0.2 0.7 0.3 1 0.4 0.3 0.1 0.6 0.3 0.9 0.4l0.9 0.3c0.3 0.1 0.7 0.3 1 0.4 0.3 0.1 0.5 0.2 0.8 0.3 0.4 0.1 0.8 0.3 1.1 0.4 0.2 0.1 0.5 0.1 0.7 0.2l1.2 0.3c0.2 0.1 0.4 0.1 0.7 0.2 0.4 0.1 0.9 0.2 1.3 0.3 0.2 0 0.4 0.1 0.7 0.1 0.4 0.1 0.9 0.2 1.3 0.2 0.3 0 0.5 0.1 0.8 0.1 0.4 0.1 0.8 0.1 1.2 0.1 0.3 0 0.7 0.1 1 0.1 0.3 0 0.6 0.1 1 0.1 0.7 0 1.3 0.1 2 0.1s1.4 0 2-0.1c0.3 0 0.6 0 1-0.1 0.3 0 0.7 0 1-0.1 0.4 0 0.8-0.1 1.2-0.1 0.3 0 0.5-0.1 0.8-0.1 0.4-0.1 0.9-0.1 1.3-0.2 0.2 0 0.4-0.1 0.7-0.1 0.4-0.1 0.9-0.2 1.3-0.3 0.2-0.1 0.4-0.1 0.7-0.2l1.2-0.3c0.2-0.1 0.5-0.1 0.7-0.2 0.4-0.1 0.8-0.2 1.1-0.4 0.3-0.1 0.5-0.2 0.8-0.3 0.3-0.1 0.7-0.3 1-0.4l0.9-0.3c0.3-0.1 0.6-0.3 0.9-0.4 0.3-0.1 0.7-0.3 1-0.4 0.2-0.1 0.5-0.2 0.7-0.4 0.4-0.2 0.7-0.4 1.1-0.5 0.2-0.1 0.4-0.2 0.6-0.4 0.4-0.2 0.8-0.5 1.1-0.7 0.2-0.1 0.4-0.3 0.6-0.4 0.4-0.2 0.7-0.5 1.1-0.8 0.2-0.2 0.4-0.3 0.6-0.5 0.3-0.2 0.6-0.5 1-0.7 0.3-0.2 0.5-0.4 0.8-0.7 0.2-0.2 0.5-0.4 0.7-0.6 0.5-0.4 1-0.9 1.4-1.4l312-312 312 312c8.1 8.1 18.8 12.1 29.5 12h0.5c22.6 0 41-18.3 41-41V107.3C884 72 856.1 43.5 821.1 41.5z" fill="currentColor" /></svg>
      </button>
      
      {showSelector && (
        <WordListSelector
          wordLists={wordLists}
          onSelect={handleCollect}
          onCancel={() => setShowSelector(false)}
          loading={loading}
          error={error}
          currentListId={currentListId}
        />
      )}

      <ConfirmModal
        isOpen={pendingMoveListId !== null}
        title="移动到新的单词本"
        description="该单词已被收藏至其它单词本，是否移动到新的单词本？"
        confirmText="移动"
        onConfirm={async () => {
          if (!session?.access_token || pendingMoveListId === null) return;
          const target = pendingMoveListId;
          setPendingMoveListId(null);
          const prev = currentListId;
          setCurrentListId(target);
          try {
            const moveRes = await fetch(`/api/me/words/${word.id}`, {
              method: 'PATCH',
              headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session.access_token}` },
              body: JSON.stringify({ new_list_id: target })
            });
            if (!moveRes.ok) {
              setCurrentListId(prev);
              const body = await moveRes.json().catch(() => ({}));
              throw new Error(body?.error?.message || '移动失败');
            }
            success('已移动到新的单词本');
            mutate();
            onCollected?.();
          } catch (err) {
            setCurrentListId(prev);
            toastError(err instanceof Error ? err.message : '移动失败');
            // 失败后重新打开选择器以便重试
            setShowSelector(true);
          }
        }}
        onClose={() => { setPendingMoveListId(null); setShowSelector(true); }}
      />
    </>
  );
}

// 单词本选择器组件
function WordListSelector({
  wordLists,
  onSelect,
  onCancel,
  loading,
  error,
  currentListId,
}: {
  wordLists: WordList[];
  onSelect: (listId: number) => void;
  onCancel: () => void;
  loading: boolean;
  error: string | null;
  currentListId: number | null;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="fixed inset-0 bg-black/50 backdrop-blur-sm" onClick={onCancel}></div>
      <div className="relative glass-surface rounded-xl p-6 w-full max-w-md z-10 border border-border">
        <div className="selector-header">
          <h3 className="text-lg font-semibold text-foreground">选择单词本</h3>
          <p className="text-xs text-muted mt-1">为了便于学习数据管理，一个单词只能归属一个单词本</p>
          <button onClick={onCancel} className="absolute top-4 right-4 p-1 text-muted hover:text-foreground rounded-lg hover:bg-surface/60" disabled={loading}>✕</button>
        </div>
        
        <div className="mt-4">
          {error && (
            <div className="p-2 text-red-400 text-sm border border-red-500/30 rounded-lg bg-red-500/10">该单词已被收藏至该单词本</div>
          )}
          
          {wordLists.length === 0 ? (
            <div className="text-muted text-sm">暂无单词本，请先创建一个单词本</div>
          ) : (
            <div className="space-y-2 max-h-72 overflow-y-auto pr-1 scrollbar-hide">
              {wordLists.map(list => (
                <label key={list.id} className="flex items-center justify-between w-full px-3 py-2 rounded-lg hover:bg-surface/70 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <input type="radio" name="targetList" className="accent-white" defaultChecked={list.id === currentListId} onChange={() => onSelect(list.id)} disabled={loading} />
                    <span className="text-foreground">{list.name}</span>
                  </div>
                  <span className="text-xs text-muted">{list.word_count} 词</span>
                </label>
              ))}
              <label className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-surface/70 cursor-pointer">
                <input type="radio" name="targetList" className="accent-white" defaultChecked={currentListId === null} onChange={() => onSelect(0)} disabled={loading} />
                <span className="text-foreground">取消收藏（从当前单词本移除）</span>
              </label>
            </div>
          )}
        </div>
        
        <div className="mt-4 text-right">
          <button onClick={onCancel} className="px-3 py-2 text-foreground bg-surface/60 hover:bg-surface/80 rounded-lg" disabled={loading}>关闭</button>
        </div>
      </div>
    </div>
  );
}