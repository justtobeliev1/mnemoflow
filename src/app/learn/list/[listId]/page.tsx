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

  const defs = useMemo(() => (S as any).current?.definition ? parseDefinition((S as any).current.definition) : [], [S.current]);
  const tags = useMemo(() => (S as any).current?.tags ? parseTags((S as any).current.tags) : [], [S.current]);

  // 预取：当批次窗口变更时，提前请求本批次所有题目的选项
  useEffect(() => {
    if (!S.queue.length) return;
    const ids = S.queue.slice(S.batchStart, S.batchEnd).map(w => w.id);
    prefetchQuizOptions(ids);
  }, [S.queue, S.batchStart, S.batchEnd]);

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

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {!resolvedListId && (
          <BreakScreen title="正在定位单词本..." description="稍候片刻" />
        )}

        {resolvedListId && !S.loading && !S.current && (
          <BreakScreen title="该单词本暂无可学习的单词" onExit={() => { window.location.href = '/'; }} />
        )}

        {resolvedListId && S.current && (
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
            onNextWord={() => S.next()}
            forceTestForCurrent={S.forceTestForCurrent}
            enqueueRelearn={(id) => S.enqueueRelearn(id)}
            clearForceTest={(id) => S.clearForceTest(id)}
          />
        )}

        {resolvedListId && !S.loading && !S.current && (
          <BreakScreen fullScreen title="已完成一轮学习！" description={'做得不错！你已经成功完成了20个单词的深度学习。\n继续或休息，一切取决于你。'} onContinue={() => { window.location.reload(); }} onExit={() => { window.location.href = '/'; }} primaryLabel="再来一轮" secondaryLabel="返回主页" />
        )}
      </main>
    </div>
  );
}


