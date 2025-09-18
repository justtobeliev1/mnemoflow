"use client";

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Info } from 'lucide-react';
import type { FSRSRating } from '@/lib/validators/review.schemas';

export interface FsrsRatingPanelProps {
  onRate: (rating: FSRSRating) => Promise<void> | void;
  pending?: boolean;
  /** 自定义“简单”按钮高亮样式（例："ring-1 ring-emerald-400/50"） */
  easyHighlightClassName?: string;
}

const variants = {
  initial: { opacity: 0, y: 8 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -8 },
};

export function FsrsRatingPanel({ onRate, pending, easyHighlightClassName }: FsrsRatingPanelProps) {
  const [loading, setLoading] = useState(false);

  async function handle(rate: FSRSRating) {
    if (loading || pending) return;
    try {
      setLoading(true);
      await onRate(rate);
    } finally {
      setLoading(false);
    }
  }

  const btn = (label: string, key: FSRSRating, style: string) => (
    <motion.button
      key={key}
      variants={variants}
      whileTap={{ scale: 0.98 }}
      onClick={() => handle(key)}
      className={
        "w-full max-w-sm mx-auto px-4 py-3 rounded-xl border text-center " +
        style +
        (key === 'easy' && !loading ? ` ${easyHighlightClassName ?? 'ring-1 ring-white/40'}` : '') +
        (loading ? " opacity-60 pointer-events-none" : "")
      }
    >
      {label}
    </motion.button>
  );

  return (
    <div className="w-full max-w-md">
      {/* 轻量 tips + Tooltip */}
      <div className="mb-2 w-full flex items-center justify-center">
        <div className="relative group inline-flex items-center gap-1.5 text-xs text-foreground/80">
          <span>请为您的记忆评级</span>
          <Info className="w-3.5 h-3.5 opacity-70" />
          <div className="pointer-events-none group-hover:pointer-events-auto group-hover:opacity-100 opacity-0 transition-opacity duration-150 absolute left-1/2 -translate-x-1/2 top-6 z-10 w-[min(88vw,560px)]">
            <div className="rounded-lg bg-surface/60 border border-border backdrop-blur-xs p-4 text-[12px] leading-relaxed text-foreground/90 space-y-2">
              <p>请根据您回忆的清晰度和速度，诚实地评估。这将帮助系统为您安排更合适的复习时间间隔。</p>
              <div className="grid grid-cols-1 gap-2">
                <div>
                  <p className="font-medium">[ 忘记 ]</p>
                  <p className="text-foreground/85">核心情景：您的脑海中一片空白，对这个单词的意思完全没有印象，或者您回忆起的答案是错误的。</p>
                  <p className="text-foreground/85">选择建议：需要看到答案才明白时选。</p>
                </div>
                <div>
                  <p className="font-medium">[ 困难 ]</p>
                  <p className="text-foreground/85">核心情景：回忆的过程非常挣扎。虽然最终您可能想起来了，但花费了很长时间，或者您在好几个相似的意思之间犹豫不决，感觉不肯定。</p>
                  <p className="text-foreground/85">选择建议：在“嘴边说不出”或对答案不自信时选择。</p>
                </div>
                <div>
                  <p className="font-medium">[ 良好 ]</p>
                  <p className="text-foreground/85">核心情景：回忆的过程比较顺利。您可能需要短暂地思考一下，但最终能够比较轻松且准确地回忆起它的核心意思。</p>
                  <p className="text-foreground/85">选择建议：最常见的评级，当您的感觉是“嗯，我想起来了”，并且没有明显的困难时，请选择此项。</p>
                </div>
                <div>
                  <p className="font-medium">[ 简单 ]</p>
                  <p className="text-foreground/85">核心情景：您几乎是瞬间反应，毫不费力地就想起了它的意思，就像母语一样熟悉，完全没有迟疑。</p>
                  <p className="text-foreground/85">选择建议：当这个单词对您来说已经“刻在DNA里”，看到就能脱口而出其含义时，才选择此项。请谨慎使用，避免过于自信。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      <AnimatePresence mode="wait">
        <motion.div
          key="fsrs"
          initial="initial"
          animate="animate"
          exit="exit"
          transition={{ duration: 0.25 }}
          className="space-y-3"
        >
          {btn('简单', 'easy', 'bg-surface/50 border-border hover:bg-surface/70')}
          {btn('良好', 'good', 'bg-surface/50 border-border hover:bg-surface/70')}
          {btn('困难', 'hard', 'bg-surface/50 border-border hover:bg-surface/70')}
          {btn('忘记', 'again', 'bg-surface/50 border-border hover:bg-surface/70')}
        </motion.div>
      </AnimatePresence>
    </div>
  );
}

export default FsrsRatingPanel;


