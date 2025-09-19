"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLearningQueue, type LearningWord } from '@/hooks/useLearningQueue';
import { useReviewSession, ReviewQuiz } from '@/hooks/useReviewSession';
import { usePromptBlueprint } from '@/hooks/usePromptBlueprint';

export type SessionMode = 'learn' | 'review';

export interface UseSessionQueueOptions {
  listId?: number;
  limit?: number;
  n?: number;
}

export interface SessionWordLite {
  id: number;
  word: string;
}

export interface UseSessionQueueResult {
  mode: SessionMode;
  queue: SessionWordLite[];
  index: number;
  current: SessionWordLite | null;
  hasMore: boolean;
  atBatchEnd: boolean;
  batchStart: number;
  batchEnd: number;
  quizForCurrentWord: ReviewQuiz | null;
  mnemonicHint: string;
  next: () => void;
  prev: () => void;
  reset: () => void;
  enqueueRelearn: (wordId: number) => void;
  enqueueDelayed: (wordId: number) => void;
  peekDelayed: () => number | null;
  shiftDelayed: () => number | null;
  loading: boolean;
  error: string | null;
  // 仅在 learn 模式下可用：提供带 definition 的原始数据，便于页面本地生成选项
  learnWordsDetailed?: LearningWord[];
}

export function useSessionQueue(mode: SessionMode, opts: UseSessionQueueOptions = {}): UseSessionQueueResult {
  const limit = opts.limit ?? 20;
  const n = opts.n ?? 2;

  const learn = useLearningQueue(mode === 'learn' ? opts.listId : undefined, limit);
  // 仅复习模式才请求会话，避免学习页多余的 /review/session 请求
  const review = useReviewSession(undefined, limit, mode === 'review');

  const [index, setIndex] = useState(0);
  const delayedRef = useRef<number[]>([]);
  const relearnRef = useRef<number[]>([]);

  const reviewQueue: SessionWordLite[] = useMemo((): SessionWordLite[] => {
    if (mode !== 'review' || !review.quizzes) return [];
    return review.quizzes.map((q: ReviewQuiz, i: number) => ({ id: q.quiz_word_id, word: `#${i + 1}` }));
  }, [review.quizzes, mode]);

  const learnQueue: SessionWordLite[] = useMemo((): SessionWordLite[] => {
    if (mode !== 'learn' || !learn.words) return [];
    return learn.words.map(w => ({ id: w.id, word: w.word }));
  }, [learn.words, mode]);

  const queue = mode === 'learn' ? learnQueue : reviewQueue;

  useEffect(() => { setIndex(0); }, [mode, queue.length]);

  const current = queue[index] || null;
  const hasMore = index + 1 < queue.length;
  const batchStart = Math.floor(index / limit) * limit;
  const batchEnd = Math.min(batchStart + limit, queue.length);
  const atBatchEnd = index === batchEnd - 1 || queue.length === 0;

  // 复习模式下才从会话中匹配选择题；学习模式可按需另行获取
  const quizForCurrentWord = useMemo(() => {
    if (!current) return null;
    if (mode === 'review') {
      if (!review.quizzes) return null;
      return review.quizzes.find((q: any) => q.quiz_word_id === current.id) || null;
    }
    // learn 模式下，选项在页面层按需获取
    return null;
  }, [mode, current?.id, review.quizzes]);

  const { mnemonicHint } = (() => {
    const r = usePromptBlueprint(current?.id);
    return { mnemonicHint: r.blueprint || '' };
  })();

  function next() {
    const remaining = queue.length - (index + 1);
    if (relearnRef.current.length > 0 && remaining > 0) {
      // 插入策略留给后端会话生成，此处不修改主队列，避免前端与后端不一致。
    }
    if (index + 1 < queue.length) setIndex(index + 1);
  }
  function prev() { if (index > 0) setIndex(index - 1); }
  function reset() { setIndex(0); delayedRef.current = []; relearnRef.current = []; }

  function enqueueRelearn(wordId: number) { if (!relearnRef.current.includes(wordId)) relearnRef.current.push(wordId); }
  function enqueueDelayed(wordId: number) { delayedRef.current.push(wordId); }
  function peekDelayed(): number | null { return delayedRef.current.length ? delayedRef.current[0] : null; }
  function shiftDelayed(): number | null { return delayedRef.current.shift() ?? null; }

  const loading = mode === 'learn' ? learn.loading : review.loading;
  const error = mode === 'learn' ? learn.error : review.error;

  return {
    mode,
    queue,
    index,
    current,
    hasMore,
    atBatchEnd,
    batchStart,
    batchEnd,
    quizForCurrentWord: quizForCurrentWord || null,
    mnemonicHint,
    next,
    prev,
    reset,
    enqueueRelearn,
    enqueueDelayed,
    peekDelayed,
    shiftDelayed,
    loading,
    error,
    learnWordsDetailed: mode === 'learn' ? learn.words : undefined,
  };
}
