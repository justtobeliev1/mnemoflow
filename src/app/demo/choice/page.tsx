'use client';

import { useState } from 'react';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { ChoiceTestPanel, ChoiceResult } from '@/components/ui/choice-test-panel';

export default function DemoChoicePage() {
  const [result, setResult] = useState<ChoiceResult | null>(null);
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="grid gap-10 md:grid-cols-2 items-start">
            {/* 左：空壳占位，保持布局 */}
            <div className="min-h-[460px]" />
            {/* 右：选择题 */}
            <div className="flex flex-col items-start gap-4">
              <ChoiceTestPanel
                word="context"
                options={["语境", "上下文", "联系", "争论"]}
                correct="上下文"
                mnemonicHint="con(一起) + text(文本) → 把文本放在一起看才能懂：上下文"
                onComplete={(r) => setResult(r)}
              />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


