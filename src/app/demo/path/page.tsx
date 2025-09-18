'use client';

import { AnimatedBackground } from '@/components/ui/animated-background';
import { PathSelector } from '@/components/ui/path-selector';

export default function DemoPathPage() {
  return (
    <div className="min-h-screen bg-background relative">
      <AnimatedBackground />
      <main className="relative z-10 max-w-6xl mx-auto px-6 py-10 min-h-screen flex items-center justify-center">
        <div className="w-full max-w-[1200px] mx-auto">
          <div className="grid gap-10 md:grid-cols-2 items-start">
            {/* 左：三叠框路径选择 */}
            <PathSelector word="context" onSelect={() => {}} />
            {/* 右：空白占位 */}
            <div className="min-h-[460px]" />
          </div>
        </div>
      </main>
    </div>
  );
}


