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
  enableT?: boolean; // 学习模式是否启用延迟测试队列T
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
  learnWordsDetailed?: LearningWord[];
  forceTestForCurrent: boolean;
  // T 队列（仅学习）：入队与查看
  enqueueToTest?: (wordId: number) => void;
  peekTest?: () => number | null;
  shiftTest?: () => number | null;
  clearForceTest: (id: number) => void;
}

export function useSessionQueue(mode: SessionMode, opts: UseSessionQueueOptions = {}): UseSessionQueueResult {
  const limit = opts.limit ?? 20;
  const n = opts.n ?? 2;
  const enableT = opts.enableT ?? true;

  const learn = useLearningQueue(mode === 'learn' ? opts.listId : undefined, limit);
  const review = useReviewSession(undefined, limit, mode === 'review');

  const [index, setIndex] = useState(0);
  const [queueState, setQueueState] = useState<SessionWordLite[]>([]);
  const delayedRef = useRef<number[]>([]);
  const relearnRef = useRef<number[]>([]);
  const forceTestSetRef = useRef<Set<number>>(new Set());
  const testQueueRef = useRef<number[]>([]); // 学习模式 T 队
  const lastLearnedRef = useRef<number | null>(null);

  const reviewQueue: SessionWordLite[] = useMemo((): SessionWordLite[] => {
    if (mode !== 'review' || !review.quizzes) return [];
    return review.quizzes.map((q: ReviewQuiz, i: number) => ({ id: q.quiz_word_id, word: `#${i + 1}` }));
  }, [review.quizzes, mode]);

  const learnQueue: SessionWordLite[] = useMemo((): SessionWordLite[] => {
    if (mode !== 'learn' || !learn.words) return [];
    return learn.words.map(w => ({ id: w.id, word: w.word }));
  }, [learn.words, mode]);

  useEffect(() => {
    const base = mode === 'learn' ? learnQueue : reviewQueue;
    setQueueState(base);
    setIndex(0);
    delayedRef.current = [];
    relearnRef.current = [];
    forceTestSetRef.current.clear();
    testQueueRef.current = [];
    lastLearnedRef.current = null;
  }, [mode, learnQueue.length, reviewQueue.length]);

  const queue = queueState;

  const current = queue[index] || null;
  const hasMore = index + 1 < queue.length;
  const batchStart = Math.floor(index / limit) * limit;
  const batchEnd = Math.min(batchStart + limit, queue.length);
  const atBatchEnd = index === batchEnd - 1 || queue.length === 0;

  const quizForCurrentWord = useMemo(() => {
    if (!current) return null;
    if (mode === 'review') {
      if (!review.quizzes) return null;
      return review.quizzes.find((q: any) => q.quiz_word_id === current.id) || null;
    }
    return null;
  }, [mode, current?.id, review.quizzes]);

  const { mnemonicHint } = (() => {
    const r = usePromptBlueprint(current?.id);
    return { mnemonicHint: r.blueprint || '' };
  })();

  function next() {
    let q = queue.slice();
    let nextIndex = index + 1;

    // 学习模式：学习编码完成后，将 current 入 T，并在下一步优先测试 T 队首（若不是刚学的）
    if (mode === 'learn' && current && enableT) {
      testQueueRef.current.push(current.id);
      lastLearnedRef.current = current.id;
      const head = testQueueRef.current[0];
      if (head && head !== current.id) {
        testQueueRef.current.shift();
        const existsIndex = q.findIndex(w => w.id === head);
        const insertPos = Math.min(index + 1, q.length);
        if (existsIndex === -1) {
          q.splice(insertPos, 0, { id: head, word: `#${head}` });
        }
        forceTestSetRef.current.add(head);
      }
    }

    // 穿插重学：使用入参 n（学习场景可传 1，复习场景可传 2）
    if (relearnRef.current.length > 0) {
      const wordId = relearnRef.current.shift()!;
      const existsIndex = q.findIndex(w => w.id === wordId);
      if (existsIndex !== -1) {
        const [item] = q.splice(existsIndex, 1);
        // 若移除位置在当前或之前，下一项索引左移一位
        if (existsIndex <= index) nextIndex = index; else nextIndex = index + 1;
        const remAfter = q.length - (index + 1);
        const targetPos = remAfter > n ? index + n + 1 : q.length;
        q.splice(Math.min(targetPos, q.length), 0, item);
      } else {
        const remaining = q.length - (index + 1);
        const targetPos = remaining > n ? index + n + 1 : q.length;
        q.splice(Math.min(targetPos, q.length), 0, { id: wordId, word: `#${wordId}` });
      }
      forceTestSetRef.current.add(wordId);
    }

    setQueueState(q);
    // 允许 index 走到 q.length，以便 current 变为 null → 触发会话小结
    if (q.length === 0) setIndex(0); else setIndex(nextIndex);
  }
  function prev() { if (index > 0) setIndex(index - 1); }
  function reset() { setIndex(0); delayedRef.current = []; relearnRef.current = []; forceTestSetRef.current.clear(); testQueueRef.current = []; lastLearnedRef.current = null; }

  function enqueueRelearn(wordId: number) { if (!relearnRef.current.includes(wordId)) relearnRef.current.push(wordId); forceTestSetRef.current.add(wordId); }
  function enqueueDelayed(wordId: number) { delayedRef.current.push(wordId); }
  function peekDelayed(): number | null { return delayedRef.current.length ? delayedRef.current[0] : null; }
  function shiftDelayed(): number | null { return delayedRef.current.shift() ?? null; }

  const loading = mode === 'learn' ? learn.loading : review.loading;
  const error = mode === 'learn' ? learn.error : review.error;

  const forceTestForCurrent = current ? forceTestSetRef.current.has(current.id) : false;

  function clearForceTest(id: number) { forceTestSetRef.current.delete(id); }

  // T 队接口（学习）
  const enqueueToTest = (wordId: number) => { testQueueRef.current.push(wordId); };
  const peekTest = () => testQueueRef.current.length ? testQueueRef.current[0] : null;
  const shiftTest = () => (testQueueRef.current.shift() ?? null);

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
    forceTestForCurrent,
    clearForceTest,
    enqueueToTest: mode === 'learn' ? enqueueToTest : undefined,
    peekTest: mode === 'learn' ? peekTest : undefined,
    shiftTest: mode === 'learn' ? shiftTest : undefined,
  };
}
