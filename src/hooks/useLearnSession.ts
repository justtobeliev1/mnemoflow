"use client";

import { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type ReviewOption = { word_id: number; word: string; definition?: string };
export type ReviewQuiz = { quiz_word_id: number; options: ReviewOption[] };

export function useLearnSession(listId?: number, limit: number = 20, active: boolean = true) {
  const { session } = useAuth();
  const [quizzes, setQuizzes] = useState<ReviewQuiz[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!active || !session?.access_token || !listId) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/me/learn/session?listId=${listId}&limit=${limit}`, {
          headers: { 'Authorization': `Bearer ${session.access_token}` },
          cache: 'no-store',
        });
        if (!mounted) return;
        if (!res.ok) {
          setError((await res.text()) || `加载失败(${res.status})`);
          return;
        }
        const body = await res.json();
        setQuizzes(body?.quizzes ?? []);
      } catch (e: any) {
        if (mounted) setError(e?.message || '网络错误');
      } finally {
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [session?.access_token, limit, active, listId]);

  return { quizzes, loading, error };
}
