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
import { DictionaryStackContainer } from '@/components/ui/dictionary-stack-container';

export type ReviewStageMode =
  | { kind: 'idle' }
  | { kind: 'self_assess' }
  | { kind: 'test' }
  | { kind: 'review_stage' };

export interface ReviewFlowStageProps {
  wordId: number;
  word: string;
  phonetic?: string;
  definitions: { pos: string; meaning: string }[];
  tags?: string[];
  promptText?: string;
  options?: string[];
  correctOption?: string;
  mnemonicHint?: string;
  onNextWord?: () => void;
}

export function ReviewFlowStage(props: ReviewFlowStageProps) {
  const { wordId, word, phonetic, definitions, tags, promptText = word, options = [], correctOption, mnemonicHint, onNextWord } = props;
  const [mode, setMode] = useState<ReviewStageMode>({ kind: 'idle' });
  const { session } = useAuth();

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
      onNextWord?.();
    } else {
      setMode({ kind: 'review_stage' });
    }
    submitQuiz(rating);
  }

  function handlePathSelect(sel: PathSelection) {
    if (sel === 'self_assess') setMode({ kind: 'self_assess' });
    else setMode({ kind: 'test' });
  }

  function handleTestComplete(result: ChoiceResult) {
    if (result === 'first_try') {
      submitQuiz('good');
      onNextWord?.();
      return;
    }
    const rating: FSRSRating = result === 'second_try' ? 'hard' : 'again';
    setMode({ kind: 'review_stage' });
    submitQuiz(rating);
  }

  const t = { duration: 0.1 } as const;

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
        <div className="mt-4 flex justify-end"><NextArrowButton label="下一项 →" onClick={() => onNextWord?.()} /></div>
      </div>
    );
  }

  return (
    <div className="w-full">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 items-start">
        {/* Left side */}
        <AnimatePresence mode="sync">
          <motion.div key={leftKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t}>
            {mode.kind === 'idle' && (
              <PathSelector word={word} onSelect={handlePathSelect} />
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
        <AnimatePresence mode="sync">
          <motion.div key={rightKey} initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={t}>
            {mode.kind === 'idle' && (
              <div className="min-h-[460px]" />
            )}
            {mode.kind === 'self_assess' && (
              <div className="min-h-[460px] w-full flex items-center justify-center">
                <FsrsRatingPanel onRate={handleRate} />
              </div>
            )}
            {mode.kind === 'test' && (
              <div className="min-h-[460px] w-full flex items-center justify-center">
                <ChoiceTestPanel word={word} options={options} correct={correctOption || ''} mnemonicHint={mnemonicHint} onComplete={handleTestComplete} delayMs={400} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </div>
    </div>
  );
}

export default ReviewFlowStage;


