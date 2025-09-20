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

  const S = useSessionQueue('learn', { listId: resolvedListId ?? undefined, limit: 20 });
  const { session } = useAuth();

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

  const showInitialEmpty = attempted && !S.loading && S.queue.length === 0 && !startedWithWords;
  const showSessionSummary = S.learningStage === 'summary';
  const showConsolidationTip = S.learningStage === 'break' && S.consolidationTip;

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {!resolvedListId && !attempted && (
          <BreakScreen fullScreen minimal title="正在定位单词本..." />
        )}

        {showInitialEmpty && (
          <BreakScreen fullScreen minimal title="该单词本暂无可学习的单词" secondaryLabel="退出" onExit={() => { window.location.href = '/'; }} />
        )}

        {showConsolidationTip && (
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
        )}

        {S.current && (S.learningStage === 'encoding' || S.learningStage === 'consolidation_encoding') && (
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
        )}
        
        {S.current && (S.learningStage === 'testing' || S.learningStage === 'consolidation_testing') && (
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
        )}

        {showSessionSummary && (
          <BreakScreen fullScreen minimal title="已完成一轮学习！" description={'做得不错！你已经成功完成了20个单词的深度学习。\n继续或休息，一切取决于你。'} onContinue={() => { window.location.reload(); }} onExit={() => { window.location.href = '/'; }} primaryLabel="再来一轮" secondaryLabel="返回主页" />
        )}
      </main>
    </div>
  );
}


