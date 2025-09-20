"use client";

import { useMemo, useState, useEffect } from 'react';
import { AnimatePresence, motion } from 'framer-motion';
import { MnemonicLearningStage } from '@/components/ui/mnemonic-learning-stage';
import { PathSelector, PathSelection } from '@/components/ui/path-selector';
import { WordPromptStack } from '@/components/ui/word-prompt-stack';
import { FsrsRatingPanel } from '@/components/ui/fsrs-rating-panel';
import { ChoiceTestPanel, ChoiceResult } from '@/components/ui/choice-test-panel';
import { NextArrowButton } from '@/components/ui/next-arrow-button';
import type { FSRSRating } from '@/lib/validators/review.schemas';
import { useAuth } from '@/contexts/AuthContext';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { DictionaryStackContainer } from '@/components/ui/dictionary-stack-container';

export type ReviewStageMode =
  | { kind: 'idle' }
  | { kind: 'self_assess' }
  | { kind: 'test' }
  | { kind: 'review_stage' };

export interface ReviewFlowStageProps {
  flow?: 'learn' | 'review';
  wordId: number;
  word: string;
  phonetic?: string;
  definitions: { pos: string; meaning: string }[];
  tags?: string[];
  promptText?: string;
  options?: string[];
  correctOption?: string;
  mnemonicHint?: string;
  onNextWord?: (rating?: FSRSRating) => void;
  // 来自队列：可选的强制测试标志与 R/T 队操作
  forceTestForCurrent?: boolean;
  enqueueRelearn?: (wordId: number) => void;
  clearForceTest?: (wordId: number) => void;
  alwaysAdvanceOnTest?: boolean; // 学习模式测试时使用，保证总能进入下一项
}

export function ReviewFlowStage(props: ReviewFlowStageProps) {
  const { flow = 'review', wordId, word, phonetic, definitions, tags, promptText = word, options = [], correctOption, mnemonicHint, onNextWord, forceTestForCurrent, enqueueRelearn, clearForceTest, alwaysAdvanceOnTest } = props;
  const [mode, setMode] = useState<ReviewStageMode>({ kind: 'idle' });
  const { session } = useAuth();
  const optionsReady = Array.isArray(options) && options.length > 0 && !!correctOption;

  // 切换新单词时：
  // - 学习页：从 ReviewStage 开始
  // - 复习页：默认 PathSelector；若标记强制测试则直达测试
  useEffect(() => {
    if (flow === 'learn') {
      setMode({ kind: 'review_stage' });
      return;
    }
    if (forceTestForCurrent) {
      setMode({ kind: 'test' });
    } else {
      setMode({ kind: 'idle' });
    }
  }, [wordId, forceTestForCurrent, flow]);

  const [promptLoading, setPromptLoading] = useState(false);

  const leftKey = useMemo(() => `${mode.kind}-${word}`, [mode, word]);
  const rightKey = useMemo(() => `${mode.kind}-right-${word}`, [mode, word]);

  useEffect(() => {
    if (mode.kind === 'test') {
      setPromptLoading(true);
      const t = setTimeout(() => setPromptLoading(false), 120);
      return () => clearTimeout(t);
    }
  }, [mode.kind]);

  function submitQuiz(rating: FSRSRating) {
    if (!session?.access_token) return;
    fetch('/api/me/quiz/submit', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${session.access_token}`,
      },
      body: JSON.stringify({ quiz_word_id: wordId, rating }),
    }).catch(() => {});
  }

  function handleRate(rating: FSRSRating) {
    // 先切界面 / 下一词，再后台提交
    if (rating === 'easy' || rating === 'good') {
      onNextWord?.(rating);
    } else {
      setMode({ kind: 'review_stage' });
    }
    submitQuiz(rating);
    if (rating === 'hard' || rating === 'again') {
      enqueueRelearn?.(wordId);
    } else {
      // easy/good 结束强制标记
      clearForceTest?.(wordId);
    }
  }

  function handlePathSelect(sel: PathSelection) {
    if (sel === 'self_assess') setMode({ kind: 'self_assess' });
    else setMode({ kind: 'test' });
  }

  function handleTestComplete(result: ChoiceResult) {
    const ratingMap: Record<ChoiceResult, FSRSRating> = {
      first_try: 'good',
      second_try: 'hard',
      failed: 'again',
    };
    const rating = ratingMap[result];
    submitQuiz(rating);

    if (alwaysAdvanceOnTest) {
      if (result === 'first_try') clearForceTest?.(wordId);
      onNextWord?.(rating);
      return;
    }

    // Default review flow logic
    if (result === 'first_try') {
      clearForceTest?.(wordId);
      onNextWord?.(rating);
    } else {
      setMode({ kind: 'review_stage' });
      enqueueRelearn?.(wordId);
    }
  }

  const t = { duration: 0.25, ease: 'easeInOut' } as const;

  if (mode.kind === 'review_stage') {
    return (
      <div className="w-full">
        <MnemonicLearningStage
          word={word}
          wordId={wordId}
          phonetic={phonetic}
          definitions={definitions}
          tags={tags}
          senses={[]}
          blueprint={''}
          scenario={''}
          example={{ en: '', zh: '' }}
        />
        <div className="mt-4 flex justify-end">
          <NextArrowButton
            label="下一项 →"
            onClick={() => {
              // 若为复习流程且当前单词被标记强制测试，则直接切换到测试视图，避免末尾仅剩 R 时无法再次强测
              if (flow === 'review' && forceTestForCurrent) {
                setMode({ kind: 'test' });
              } else {
                onNextWord?.();
              }
            }}
          />
        </div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left side */}
        <AnimatePresence mode="wait">
          <motion.div key={leftKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t}>
            {mode.kind === 'idle' && (
              forceTestForCurrent ? (
                <WordPromptStack prompt={promptText} isLoading={promptLoading} />
              ) : (
                <PathSelector word={word} onSelect={handlePathSelect} />
              )
            )}
            {mode.kind === 'self_assess' && (
              <DictionaryStackContainer word={word} />
            )}
            {mode.kind === 'test' && (
              <WordPromptStack prompt={promptText} isLoading={promptLoading} />
            )}
          </motion.div>
        </AnimatePresence>

        {/* Right side */}
        <AnimatePresence mode="wait">
          <motion.div key={rightKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t}>
            {mode.kind === 'idle' && (
              forceTestForCurrent ? (
                <div className="min-h-[460px] w-full flex items-center justify-center">
                  {optionsReady ? (
                    <ChoiceTestPanel word={word} options={options} correct={correctOption || ''} mnemonicHint={mnemonicHint} onComplete={handleTestComplete} delayMs={400} />
                  ) : (
                    <div className="w-full max-w-sm grid grid-cols-1 gap-3">
                      <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                      <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                      <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                      <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                    </div>
                  )}
                </div>
              ) : (
                <div className="min-h-[460px]" />
              )
            )}
            {mode.kind === 'self_assess' && (
              <div className="min-h-[460px] w-full flex items-center justify-center">
                <FsrsRatingPanel onRate={handleRate} />
              </div>
            )}
            {mode.kind === 'test' && (
              <div className="min-h-[460px] w-full flex items-center justify-center">
                {optionsReady ? (
                  <ChoiceTestPanel word={word} options={options} correct={correctOption || ''} mnemonicHint={mnemonicHint} onComplete={handleTestComplete} delayMs={400} />
                ) : (
                  <div className="w-full max-w-sm grid grid-cols-1 gap-3">
                    <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                    <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                    <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                    <div className="h-10 rounded-xl bg-surface/40 animate-pulse" />
                  </div>
                )}
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ReviewFlowStage;


