"use client";

import { useMemo, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export type ChoiceResult = 'first_try' | 'second_try' | 'failed';

export interface ChoiceTestPanelProps {
  word: string;
  options: string[]; // 包含正确项
  correct: string;
  mnemonicHint?: string; // 助记蓝图提示文本
  onComplete: (result: ChoiceResult) => void;
  delayMs?: number; // 完成前的停留时长，默认500ms
}

function shuffleArray<T>(arr: T[]): T[] {
  const a = arr.slice();
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

export function ChoiceTestPanel({ word, options, correct, mnemonicHint, onComplete, delayMs = 200 }: ChoiceTestPanelProps) {
  const [selectedWrong, setSelectedWrong] = useState<Set<string>>(new Set());
  const [showHint, setShowHint] = useState(false);
  const [done, setDone] = useState<ChoiceResult | null>(null);
  const [correctSelected, setCorrectSelected] = useState<string | null>(null);

  const shuffled = useMemo(() => {
    // 打散选项，但保持字符串相等判断即可识别正确项
    return shuffleArray(options);
  }, [options]);

  function handleClick(opt: string) {
    // 允许二次选择：只有在确定完成后(done不为null)或当前选项已被选为错误时才禁用
    if (done || selectedWrong.has(opt)) return;

    if (opt === correct) {
      const result: ChoiceResult = showHint ? 'second_try' : 'first_try';
      setCorrectSelected(opt);
      setTimeout(() => {
        setDone(result);
        onComplete(result);
      }, delayMs);
      return;
    }

    // 错误
    const next = new Set(selectedWrong);
    next.add(opt);
    setSelectedWrong(next);

    if (!showHint) {
      setShowHint(true);
    } else {
      // 第二次仍然错：标红并延迟 完成
      setTimeout(() => {
        setDone('failed');
        onComplete('failed');
      }, delayMs);
    }
  }

  return (
    <div className="w-full max-w-xl flex flex-col items-center justify-center min-h-[460px]">
      <div className="space-y-4 w-full">
        <AnimatePresence>{showHint && mnemonicHint && (
          <motion.div
            key="hint"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            className="text-sm font-semibold text-transparent bg-clip-text bg-gradient-to-r from-gradient-indigo/70 via-gradient-white/70 to-gradient-rose/70 p-0 text-center"
          >
            {mnemonicHint}
          </motion.div>
        )}</AnimatePresence>

        <div className="grid grid-cols-1 gap-3 w-full max-w-sm mx-auto">
          {shuffled.map((opt, idx) => (
            <motion.button
              key={idx}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => handleClick(opt)}
              className={
                "text-center px-4 py-3 rounded-xl transition w-full " +
                (selectedWrong.has(opt)
                  ? "bg-rose-600/20 text-rose-200 pointer-events-none"
                  : correctSelected === opt
                    ? "bg-emerald-600/25 text-emerald-200"
                    : "bg-surface/50 hover:bg-surface/70")
              }
            >
              {opt}
            </motion.button>
          ))}
        </div>
      </div>
    </div>
  );
}

export default ChoiceTestPanel;


