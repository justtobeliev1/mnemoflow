'use client';

import { useState } from 'react';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { ReviewFlowStage } from '@/components/ui/review-flow-stage';
import { parseDefinition } from '@/utils/definition';

const defs = parseDefinition('[{"pos":"n.","meaning":"上下文, 语境"}]');

export default function DemoReviewFlowPage() {
  const [key, setKey] = useState(0);
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        <div className="w-full">
          <ReviewFlowStage
            wordId={1}
            word="context"
            phonetic="ˈkɒntekst"
            definitions={defs}
            tags={["IELTS","GRE"]}
            promptText="context"
            options={["上下文","内容","争论","联系"]}
            correctOption="上下文"
            mnemonicHint="con(一起)+text(文本) → 与文本一起出现：上下文"
            onNextWord={() => setKey(key + 1)}
          />
        </div>
      </main>
    </div>
  );
}


