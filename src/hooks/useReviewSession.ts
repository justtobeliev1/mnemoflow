"use client";

import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';

export type ReviewOption = { word_id: number; word: string; definition?: string };
export type ReviewQuiz = { quiz_word_id: number; options: ReviewOption[] };

export function useReviewSession(targetWordId?: number, limit: number = 20, active: boolean = true) {
  const { session } = useAuth();
  const [quizzes, setQuizzes] = useState<ReviewQuiz[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!active || !session?.access_token) return;
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/me/review/session?limit=${limit}`, {
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
  }, [session?.access_token, limit, active]);

  const quizForWord = useMemo(() => {
    if (!quizzes || !quizzes.length) return null;
    if (targetWordId) {
      const q = quizzes.find(q => q.quiz_word_id === targetWordId);
      if (q) return q;
    }
    return quizzes[0] ?? null;
  }, [quizzes, targetWordId]);

  return { quizzes, quizForWord, loading, error };
}
