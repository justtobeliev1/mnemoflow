"use client";

import { useEffect, useState } from 'react';

export type QuizOptions = { options: string[]; correct: string };

const cache = new Map<number, QuizOptions>();

async function fetchOptions(wordId: number): Promise<QuizOptions> {
  const res = await fetch(`/api/me/quiz/options/${wordId}`, { cache: 'no-store' });
  if (!res.ok) throw new Error(`fetch options failed: ${res.status}`);
  const body = await res.json();
  const data: QuizOptions = { options: body.options || [], correct: body.correct || '' };
  cache.set(wordId, data);
  return data;
}

export function prefetchQuizOptions(wordIds: number[]) {
  const ids = Array.from(new Set(wordIds)).filter(id => id && !cache.has(id));
  if (!ids.length) return;
  // 并行预取，但不抛错，不阻塞 UI
  Promise.allSettled(ids.map(id => fetchOptions(id))).then(() => {});
}

export function useQuizOptions(wordId?: number) {
  const [data, setData] = useState<QuizOptions | null>(() => (wordId && cache.get(wordId)) || null);
  const [loading, setLoading] = useState<boolean>(false);

  useEffect(() => {
    if (!wordId) return;
    const cached = cache.get(wordId);
    if (cached) { setData(cached); return; }
    let alive = true;
    setLoading(true);
    fetchOptions(wordId)
      .then(d => { if (alive) setData(d); })
      .catch(() => { if (alive) setData(null); })
      .finally(() => { if (alive) setLoading(false); });
    return () => { alive = false; };
  }, [wordId]);

  return { data, loading };
}

export const QuizOptionsCache = { get: (id: number) => cache.get(id) || null };


