"use client";

import { useEffect, useMemo, useRef, useState } from 'react';
import { useLearningQueue, type LearningWord } from '@/hooks/useLearningQueue';
import { useReviewSession, ReviewQuiz } from '@/hooks/useReviewSession';
import { useDueReviews } from '@/hooks/useDueReviews';
import { usePromptBlueprint } from '@/hooks/usePromptBlueprint';
import type { FSRSRating } from '@/lib/validators/review.schemas';

export type SessionMode = 'learn' | 'review';
export type LearningStage = 'encoding' | 'testing' | 'consolidation_encoding' | 'consolidation_testing' | 'break' | 'summary';

export interface UseSessionQueueOptions {
  listId?: number;
  limit?: number;
  n?: number;
  enableT?: boolean; // 学习模式是否启用延迟测试队列T
  source?: 'session' | 'due'; // review 模式数据源：默认 session，可切换为 due 清单
}

export interface SessionWordLite {
  id: number;
  word: string;
}

export interface UseSessionQueueResult {
  mode: SessionMode;
  queue: SessionWordLite[]; // 主队列 Q
  index: number;
  current: SessionWordLite | null;
  hasMore: boolean;
  atBatchEnd: boolean;
  batchStart: number;
  batchEnd: number;
  quizForCurrentWord: ReviewQuiz | null;
  mnemonicHint: string;
  advance: (rating?: FSRSRating) => void;
  reset: () => void;
  enqueueRelearn: (wordId: number) => void; // R 队
  loading: boolean;
  error: string | null;
  learnWordsDetailed?: LearningWord[];
  forceTestForCurrent: boolean;
  clearForceTest: (id: number) => void;
  // 学习流
  learningStage: LearningStage;
  consolidationTip?: 'reencode' | 'retest' | null;
  continueFromBreak: () => void;
  fullLearnQueue: SessionWordLite[]; // Expose for prefetching
}

export function useSessionQueue(mode: SessionMode, opts: UseSessionQueueOptions = {}): UseSessionQueueResult {
  const limit = opts.limit ?? 20;
  const n = opts.n ?? 2;
  const enableT = opts.enableT ?? true;
  const reviewSource = opts.source ?? 'session';

  const learn = useLearningQueue(mode === 'learn' ? opts.listId : undefined, limit);
  const review = useReviewSession(undefined, limit, mode === 'review' && reviewSource === 'session');
  const due = useDueReviews(limit);

  const [index, setIndex] = useState(0);
  const [queueState, setQueueState] = useState<SessionWordLite[]>([]);
  const delayedRef = useRef<number[]>([]);
  const relearnRef = useRef<number[]>([]);
  const forceTestSetRef = useRef<Set<number>>(new Set());
  const testQueueRef = useRef<number[]>([]); // 学习模式 T 队
  const lastLearnedRef = useRef<number | null>(null);

  // 学习流状态
  const [learningStage, setLearningStage] = useState<LearningStage>('encoding');
  const [consolidationTip, setConsolidationTip] = useState<'reencode'|'retest'|null>(null);
  const lQueueRef = useRef<SessionWordLite[]>([]); // 学习队列 L
  const tQueueRef = useRef<SessionWordLite[]>([]); // 待测队列 T
  const pQueueRef = useRef<SessionWordLite[]>([]); // 问题词队列 P
  const lastEncodedRef = useRef<SessionWordLite | null>(null);
  const fullLearnQueueRef = useRef<SessionWordLite[]>([]); // Persists the full initial list for prefetching

  const reviewQueue: SessionWordLite[] = useMemo((): SessionWordLite[] => {
    if (mode !== 'review') return [];
    if (reviewSource === 'session') {
      if (!review.quizzes) return [];
      return review.quizzes.map((q: ReviewQuiz, i: number) => ({ id: q.quiz_word_id, word: `#${i + 1}` }));
    }
    const items = (due as any).data?.reviews ?? [];
    return items.map((x: any) => ({ id: x.word_id, word: x.word }));
  }, [mode, reviewSource, review.quizzes, (due as any).data?.reviews]);

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
    if (mode === 'learn') {
      lQueueRef.current = [...base];
      tQueueRef.current = [];
      pQueueRef.current = [];
      fullLearnQueueRef.current = [...base]; // Store for prefetching
      lastEncodedRef.current = null;
      setLearningStage('encoding');
      setConsolidationTip(null);
      if (base.length > 0) {
        setQueueState([base[0]]); // Set initial word
      } else {
        setQueueState([]);
      }
    }
  }, [mode, learnQueue.length, reviewQueue.length]);

  const queue = queueState;

  const current = queueState[0] || null;

  // hasMore logic updated for learning mode
  const hasMore = mode === 'review' 
    ? (index + 1 < queueState.length) 
    : (lQueueRef.current.length > 0 || tQueueRef.current.length > 0 || pQueueRef.current.length > 0);
  
  const atBatchEnd = mode === 'review' 
    ? (index === (Math.min(Math.floor(index / limit) * limit + limit, queueState.length)) - 1 || queueState.length === 0)
    : false; // Learning mode batch logic is handled by queue lengths

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

  // Main state machine advancement function
  function advance(rating?: FSRSRating) {
    // --- Review Mode ---
    if (mode === 'review') {
      let q = queueState.slice();
      let nextIndex = index + 1;
      // Interleave relearn words
      if (relearnRef.current.length > 0) {
        const wordId = relearnRef.current.shift()!;
        const existsIndex = q.findIndex(w => w.id === wordId);
        if (existsIndex !== -1) {
          const [item] = q.splice(existsIndex, 1);
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
      if (q.length === 0) setIndex(0); else setIndex(nextIndex);
      return;
    }

    // --- Learning Mode State Machine ---
    if (mode === 'learn') {
      // Phase 1 & 2: Testing words from T queue
      if (learningStage === 'testing') {
        const testedWord = tQueueRef.current.shift();
        if (testedWord && (rating === 'hard' || rating === 'again')) {
          pQueueRef.current.push(testedWord);
        }
      }
      // Phase 1: Encoding a new word from L queue
      if (learningStage === 'encoding') {
        const encodedWord = lQueueRef.current.shift();
        if (encodedWord) {
          tQueueRef.current.push(encodedWord);
          lastEncodedRef.current = encodedWord;
        }
      }
      // Phase 3: Re-encoding problem words from P queue
      if (learningStage === 'consolidation_encoding') {
        lQueueRef.current.shift(); // Consume the word from the temporary queue
      }
      // Phase 3: Re-testing problem words from P queue
      if (learningStage === 'consolidation_testing') {
        const testedWord = pQueueRef.current.shift();
        // Final rating, no longer adding to P queue
      }

      // Determine the next step after the action
      _determineNextStep();
    }
  }

  // Helper to decide the next current item and learning stage
  function _determineNextStep() {
    // Phase 1: Main learning loop
    if (lQueueRef.current.length > 0) {
      const nextTestWord = tQueueRef.current[0];
      if (nextTestWord && nextTestWord.id !== lastEncodedRef.current?.id) {
        setLearningStage('testing');
        setQueueState([nextTestWord]); // Current is the word to be tested
      } else {
        setLearningStage('encoding');
        setQueueState([lQueueRef.current[0]]); // Current is the word to be encoded
      }
      return;
    }

    // Phase 2: Wrap-up testing
    if (tQueueRef.current.length > 0) {
      setLearningStage('testing');
      setQueueState([tQueueRef.current[0]]);
      return;
    }

    // Phase 3: Consolidation
    if (pQueueRef.current.length > 0) {
      setLearningStage('break');
      setConsolidationTip('reencode');
      // The actual consolidation will start after the break
      return;
    }

    // Phase 4: Summary
    setLearningStage('summary');
    setQueueState([]);
  }

  function _startConsolidation(phase: 'encoding' | 'testing') {
    if (phase === 'encoding') {
      setLearningStage('consolidation_encoding');
      lQueueRef.current = [...pQueueRef.current]; // Use L queue temporarily for re-encoding
      setQueueState([lQueueRef.current[0]]);
    } else { // testing
      setLearningStage('consolidation_testing');
      setQueueState([pQueueRef.current[0]]);
    }
  }

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
  function reset() {
    const base = mode === 'learn' ? learnQueue : reviewQueue;
    setQueueState(base);
    setIndex(0);
    delayedRef.current = [];
    relearnRef.current = [];
    forceTestSetRef.current.clear();
    testQueueRef.current = [];
    lastLearnedRef.current = null;
    if (mode === 'learn') {
      lQueueRef.current = [...base];
      tQueueRef.current = [];
      pQueueRef.current = [];
      fullLearnQueueRef.current = [...base]; // Store for prefetching
      lastEncodedRef.current = null;
      setLearningStage('encoding');
      setConsolidationTip(null);
      if (base.length > 0) {
        setQueueState([base[0]]); // Set initial word
      } else {
        setQueueState([]);
      }
    }
  }

  function enqueueRelearn(wordId: number) { if (!relearnRef.current.includes(wordId)) relearnRef.current.push(wordId); forceTestSetRef.current.add(wordId); }
  function enqueueDelayed(wordId: number) { delayedRef.current.push(wordId); }
  function peekDelayed(): number | null { return delayedRef.current.length ? delayedRef.current[0] : null; }
  function shiftDelayed(): number | null { return delayedRef.current.shift() ?? null; }

  const loading = mode === 'learn' ? learn.loading : (reviewSource === 'session' ? review.loading : ((due as any).isLoading as boolean));
  const error = mode === 'learn' ? learn.error : (reviewSource === 'session' ? review.error : ((((due as any).error as any)?.message) ?? null));

  const forceTestForCurrent = (mode === 'learn' && (learningStage === 'testing' || learningStage === 'consolidation_testing')) || (current ? forceTestSetRef.current.has(current.id) : false);

  function clearForceTest(id: number) { forceTestSetRef.current.delete(id); }

  function continueFromBreak() {
    setConsolidationTip(null);
    if (pQueueRef.current.length > 0) {
      if (consolidationTip === 'reencode') {
        _startConsolidation('encoding');
      } else if (consolidationTip === 'retest') {
        _startConsolidation('testing');
      }
    }
  }

  // T 队接口（学习）
  const enqueueToTest = (wordId: number) => { testQueueRef.current.push(wordId); };
  const peekTest = () => testQueueRef.current.length ? testQueueRef.current[0] : null;
  const shiftTest = () => (testQueueRef.current.shift() ?? null);

  return {
    mode,
    queue: queueState,
    index,
    current,
    hasMore,
    atBatchEnd,
    batchStart: mode === 'review' ? Math.floor(index / limit) * limit : 0,
    batchEnd: mode === 'review' ? Math.min(Math.floor(index / limit) * limit + limit, queueState.length) : 0,
    quizForCurrentWord: quizForCurrentWord || null,
    mnemonicHint,
    advance,
    reset,
    enqueueRelearn,
    loading,
    error,
    learnWordsDetailed: mode === 'learn' ? learn.words : undefined,
    forceTestForCurrent,
    clearForceTest,
    // Learning flow
    learningStage,
    consolidationTip,
    continueFromBreak,
    fullLearnQueue: fullLearnQueueRef.current, // Expose for prefetching
  };
}
