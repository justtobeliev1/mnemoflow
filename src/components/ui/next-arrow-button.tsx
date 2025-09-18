"use client";

import { motion } from 'framer-motion';

export interface NextArrowButtonProps {
  label?: string;
  onClick?: () => void;
  disabled?: boolean;
}

/**
 * 统一的右下角前进按钮，符合 Mnemoflow 渐变悬浮风格
 */
export function NextArrowButton({ label = '→', onClick, disabled }: NextArrowButtonProps) {
  return (
    <motion.button
      whileTap={{ scale: disabled ? 1 : 0.97 }}
      onClick={disabled ? undefined : onClick}
      className={
        "inline-flex items-center gap-2 px-4 py-2 rounded-xl border text-white transition " +
        (disabled
          ? "opacity-60 cursor-not-allowed bg-surface/50 border-border"
          : "bg-surface/60 border-border hover:bg-gradient-to-r hover:from-indigo-500/40 hover:via-white/20 hover:to-rose-500/40")
      }
    >
      <span className="text-base font-medium select-none">{label}</span>
    </motion.button>
  );
}

export default NextArrowButton;


