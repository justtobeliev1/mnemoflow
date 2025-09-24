'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { ReviewFlowStage } from '@/components/ui/review-flow-stage';
import { BreakScreen } from '@/components/ui/break-screen';
import { useEffect, useMemo, useState } from 'react';
import { parseDefinition } from '@/utils/definition';
import { parseTags } from '@/utils/tags';
import { useAuth } from '@/contexts/AuthContext';
import { useQuizOptions, prefetchQuizOptions } from '@/hooks/useQuizOptions';
import { TextEffect } from '@/components/ui/text-effect';
import { useLearningQueue } from '@/hooks/useLearningQueue';
import { useRouter } from 'next/navigation';
import { AnimatePresence } from 'framer-motion';
import { ExitConfirmModal } from '@/components/ui/exit-confirm-modal';

export default function LearnListPage({ params }: { params: { listId: string } }) {
  const rawParam = params.listId;
  const numeric = Number(rawParam);
  const [resolvedListId, setResolvedListId] = useState<number | null>(
    Number.isFinite(numeric) && numeric > 0 ? numeric : null,
  );

  // 如果不是数字，则按名称查询得到真正的 listId，但不改变 URL
  useEffect(() => {
    if (resolvedListId !== null) return;
    (async () => {
      try {
        const res = await fetch(`/api/me/word-lists/by-name/${encodeURIComponent(rawParam)}`);
        if (res.ok) {
          const body = await res.json();
          if (body?.id) setResolvedListId(Number(body.id));
        }
      } catch {}
    })();
  }, [rawParam, resolvedListId]);

  const S = useSessionQueue('learn', { listId: resolvedListId ?? undefined, limit: 10 });
  const { session } = useAuth();
  const learn = useLearningQueue(S.current?.id);
  const router = useRouter();
  const [showExitConfirm, setShowExitConfirm] = useState(false);

  // 防止首次加载时空态/小结叠加与闪现
  const [attempted, setAttempted] = useState(false);
  useEffect(() => {
    if (S.loading) setAttempted(true);
    if (S.queue.length > 0) setAttempted(true);
    if (S.error) setAttempted(true);
  }, [S.loading, S.queue.length, S.error]);

  // 记录是否曾经拿到过词，区分“单词本为空”与“完成一轮学习”
  const [startedWithWords, setStartedWithWords] = useState(false);
  useEffect(() => { if (S.queue.length > 0) setStartedWithWords(true); }, [S.queue.length]);

  const defs = useMemo(() => S.learnWordsDetailed?.find(w => w.id === S.current?.id)?.definition ? parseDefinition(S.learnWordsDetailed.find(w => w.id === S.current?.id)!.definition) : [], [S.current?.id, S.learnWordsDetailed]);
  const tags = useMemo(() => S.learnWordsDetailed?.find(w => w.id === S.current?.id)?.tags ? parseTags(S.learnWordsDetailed.find(w => w.id === S.current?.id)!.tags as any) : [], [S.current?.id, S.learnWordsDetailed]);

  // 预取：会话开始时，一次性预取所有需学习单词的选项
  useEffect(() => {
    if (!S.fullLearnQueue?.length) return;
    const ids = S.fullLearnQueue.map(w => w.id);
    prefetchQuizOptions(ids);
  }, [S.fullLearnQueue]);

  // 当前词选项（命中内存缓存几乎瞬时）
  const { data: opt } = useQuizOptions(S.current?.id);

  // 初始化进度：当 current 变化时调用一次，避免首次 /quiz/submit 404
  useEffect(() => {
    const w = S.current?.id;
    if (!w || !session?.access_token || !resolvedListId) return;
    fetch(`/api/me/progress/ensure/${w}?listId=${resolvedListId}`, {
      method: 'POST',
      headers: { 'Authorization': `Bearer ${session.access_token}` },
    }).catch(() => {});
  }, [S.current?.id, session?.access_token, resolvedListId]);

  const showInitialEmpty = attempted && !S.loading && !learn.hasLearnedAll && S.queue.length === 0 && !startedWithWords;
  const showHasLearnedAll = attempted && !S.loading && learn.hasLearnedAll;
  const showSessionSummary = S.learningStage === 'summary' && !showHasLearnedAll;
  const showConsolidationTip = S.learningStage === 'break' && S.consolidationTip;

  if (!resolvedListId && !attempted) {
    return (
      <BreakScreen fullScreen minimal title="正在定位单词本..." />
    );
  }

  if (showInitialEmpty) {
    return (
      <BreakScreen fullScreen minimal title="该单词本暂无可学习的单词" secondaryLabel="退出" onExit={() => { window.location.href = '/'; }} />
    );
  }

  if (showHasLearnedAll) {
    return (
      <BreakScreen fullScreen minimal title="Congrats！你已攻克这个单词本！" description={'这个单词本中的所有新词都已完成初次学习，FSRS算法将在最恰当的时机提醒你复习单词，直到根植于你的脑海。'} secondaryLabel="返回主页" onExit={() => { window.location.href = '/'; }} />
    );
  }

  if (showConsolidationTip) {
    return (
      <div className="fixed inset-0 flex items-center justify-center">
        <div className="text-center">
          <TextEffect
            as="h2"
            per="char"
            preset="fade"
            delay={0.2}
            trigger={!!showConsolidationTip}
            className="text-3xl font-bold"
            onAnimationComplete={() => setTimeout(S.continueFromBreak, 1200)}
          >
            {S.consolidationTip === 'reencode'
              ? "接下来，我们来巩固一下刚才遇到的难点"
              : "巩固完成，进入再测试"}
          </TextEffect>
        </div>
      </div>
    );
  }

  if (showHasLearnedAll) {
    return (
       <BreakScreen
        fullScreen
        minimal
        title="Congrats！你已攻克这个单词本！"
        description={'这个单词本中的所有新词都已完成初次学习，FSRS算法将在最恰当的时机提醒你复习单词，直到根植于你的脑海。'}
        primaryLabel="学习下一个单词本"
        onContinue={() => router.push('/learn/select')}
        secondaryLabel="返回主页"
        onExit={() => router.push('/')}
      />
    );
  }

  if (showSessionSummary) {
    return (
      <BreakScreen
        fullScreen
        minimal
        title="已完成一轮学习！"
        description="做得不错！你已经成功完成了10个单词的深度学习（或复习）。继续or休息，一切去取决于你。"
        primaryLabel={S.hasNextBatch ? "继续下一轮" : "学习下一个单词本"}
        onContinue={S.hasNextBatch ? () => S.startNextBatch() : () => router.push('/learn/select')}
        secondaryLabel="这次就到这里"
        onExit={() => router.push('/learn/select')}
      />
    );
  }

  return (
    <div className="min-h-screen overflow-hidden">
      <button
        onClick={() => setShowExitConfirm(true)}
        className="fixed top-6 left-6 z-50 p-2 rounded-full text-white/70 hover:text-white hover:bg-white/10 transition-colors"
        aria-label="退出学习"
      >
        <svg className="w-6 h-6" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg">
          <path d="M324.211517 511.805631 787.889594 73.082583c16.19422-16.630365 16.19422-43.974704 0-60.605068-16.19422-16.630365-42.495607-16.630365-58.613976 0L235.750113 479.360302c-8.647031 8.969398-12.344775 20.934917-11.719003 32.445329-0.644735 11.90863 3.071972 23.874149 11.719003 32.824585l493.506542 466.882788c16.118369 16.649327 42.438718 16.649327 58.613976 0 16.19422-17.085471 16.19422-43.974704 0-60.605068L324.211517 511.805631" fill="currentColor"></path>
        </svg>
      </button>

      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {S.current && S.learningStage !== 'summary' && (
          <AnimatePresence mode="wait">
            {(() => {
              if (S.learningStage === 'encoding' || S.learningStage === 'consolidation_encoding') {
                return (
                  <ReviewFlowStage
                    flow="learn"
                    wordId={S.current.id}
                    word={S.current.word}
                    phonetic={undefined}
                    definitions={defs}
                    tags={tags}
                    promptText={S.current.word}
                    options={opt?.options ?? []}
                    correctOption={opt?.correct ?? ''}
                    mnemonicHint={S.mnemonicHint}
                    onNextWord={() => S.advance()}
                    forceTestForCurrent={false}
                    enqueueRelearn={(id) => S.enqueueRelearn(id)} // R 队，学习时不用
                    clearForceTest={(id) => S.clearForceTest(id)}
                  />
                );
              }
              if (S.learningStage === 'testing' || S.learningStage === 'consolidation_testing') {
                return (
                  <ReviewFlowStage
                    flow="review" // Use review flow for testing UI
                    wordId={S.current.id}
                    word={S.current.word}
                    phonetic={undefined}
                    definitions={defs}
                    tags={tags}
                    promptText={S.current.word}
                    options={opt?.options ?? []}
                    correctOption={opt?.correct ?? ''}
                    mnemonicHint={S.mnemonicHint}
                    onNextWord={(rating) => S.advance(rating)}
                    forceTestForCurrent={true}
                    alwaysAdvanceOnTest={true}
                    enqueueRelearn={(id) => S.enqueueRelearn(id)} // R 队，学习时不用
                    clearForceTest={(id) => S.clearForceTest(id)}
                  />
                );
              }
              return null;
            })()}
          </AnimatePresence>
        )}
      </main>

      {/* 退出确认弹窗 */}
      <ExitConfirmModal
        isOpen={showExitConfirm}
        onClose={() => setShowExitConfirm(false)}
        onConfirm={() => {}}
        mode="learn"
      />
    </div>
  );
}


