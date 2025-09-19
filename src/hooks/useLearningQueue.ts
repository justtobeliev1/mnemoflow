"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type LearningWord = {
  id: number;
  word: string;
  phonetic?: string | null;
  definition: any;
  tags?: string[] | null;
  created_at?: string;
};

export function useLearningQueue(listId?: number, batchSize: number = 20) {
  const { session } = useAuth();
  const [words, setWords] = useState<LearningWord[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!listId || !session?.access_token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/me/word-lists/${listId}/words`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (!mounted) return;
        if (!res.ok) {
          setError((await res.text()) || `加载失败(${res.status})`);
          return;
        }
        const body = await res.json();
        const arr: LearningWord[] = body?.words ?? [];
        const sorted = [...arr].sort((a, b) => {
          const ax = a.created_at ? new Date(a.created_at).getTime() : 0;
          const bx = b.created_at ? new Date(b.created_at).getTime() : 0;
          return ax - bx;
        });
        setWords(sorted);
        setIndex(0);
      } catch (e: any) {
        if (mounted) setError(e?.message || '网络错误');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [listId, session?.access_token]);

  const current = useMemo(() => words[index] || null, [words, index]);
  const inBatchIndex = useMemo(() => index % batchSize, [index, batchSize]);
  const batchStart = useMemo(() => Math.floor(index / batchSize) * batchSize, [index, batchSize]);
  const batchEnd = useMemo(() => Math.min(batchStart + batchSize, words.length), [batchStart, batchSize, words.length]);
  const batch = useMemo(() => words.slice(batchStart, batchEnd), [words, batchStart, batchEnd]);

  function next() { if (index + 1 < words.length) setIndex(index + 1); }
  function prev() { if (index > 0) setIndex(index - 1); }
  function reset() { setIndex(0); }

  const atBatchEnd = inBatchIndex === batch.length - 1 || batch.length === 0;
  const hasMore = index + 1 < words.length;

  return { words, current, index, batch, inBatchIndex, batchStart, batchEnd, atBatchEnd, hasMore, next, prev, reset, loading, error };
}
