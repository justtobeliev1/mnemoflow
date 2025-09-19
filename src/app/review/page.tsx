'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { useSessionQueue } from '@/hooks/useSessionQueue';
import { ReviewFlowStage } from '@/components/ui/review-flow-stage';
import { BreakScreen } from '@/components/ui/break-screen';

export default function ReviewPage() {
  const S = useSessionQueue('review', { limit: 20 });

  const empty = !S.loading && !S.current;

  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        {empty && (
          <BreakScreen
            title="今日记忆已巩固！"
            description={
              '基于智能间隔重复算法（FSRS）的精确计算，今天所有需要复习的记忆都已处于最佳巩固期。' +
              '\n过度学习不如适时休息，让你的大脑高效地处理信息吧。'
            }
            onExit={() => { window.location.href = '/'; }}
            primaryLabel={undefined as any}
            secondaryLabel={"回到主页"}
          />
        )}

        {!empty && S.current && (
          <ReviewFlowStage
            wordId={S.current.id}
            word={S.current.word}
            phonetic={undefined}
            definitions={[]}
            tags={[]}
            promptText={S.current.word}
            options={S.quizForCurrentWord?.options.map(o => o.word) ?? []}
            correctOption={S.quizForCurrentWord ? S.quizForCurrentWord.options[0].word : undefined}
            mnemonicHint={S.mnemonicHint}
            onNextWord={() => S.next()}
          />
        )}

        {!empty && S.current && S.atBatchEnd && (
          <div className="absolute inset-x-0 bottom-10">
            <BreakScreen
              title="已完成一轮复习！"
              description={'做得不错！你已经成功完成了20个单词的深度复习。\n继续或休息，一切取决于你。'}
              onContinue={() => S.next()}
              onExit={() => { window.location.href = '/'; }}
              primaryLabel="继续下一轮"
              secondaryLabel="这次就到这里"
            />
          </div>
        )}
      </main>
    </div>
  );
}


