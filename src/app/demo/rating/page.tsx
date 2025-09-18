'use client';

import { useState } from 'react';
import { AnimatedBackground } from '@/components/ui/animated-background';
import { FsrsRatingPanel } from '@/components/ui/fsrs-rating-panel';
import { Info } from 'lucide-react';

export default function DemoRatingPage() {
  const [last, setLast] = useState<string>('—');
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="grid gap-10 md:grid-cols-2 items-start">
            {/* 左：三叠框空壳占位，保持布局 */}
            <div className="min-h-[460px]" />
            {/* 右：评级面板 居中 + tips */}
            <div className="flex flex-col items-center justify-center min-h-[460px]">
              <FsrsRatingPanel onRate={async (r) => setLast(r)} />
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}


