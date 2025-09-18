"use client";

import { motion } from 'framer-motion';
import { StackFrame } from '@/components/ui/stack-frame';
import { GradientButton } from '@/components/ui/gradient-button';

export type PathSelection = 'self_assess' | 'enter_test';

export interface PathSelectorProps {
  word: string;
  onSelect: (selection: PathSelection) => void;
}

export function PathSelector({ word, onSelect }: PathSelectorProps) {
  return (
    <StackFrame>
      <div className="relative h-full w-full p-6">
        <div className="absolute top-10 left-1/2 -translate-x-1/2 text-center space-y-2">
          <div className="text-3xl font-extrabold text-foreground tracking-tight">{word}</div>
          <div className="text-muted">选择你的复习路径</div>
        </div>
        <div className="absolute bottom-10 left-1/2 -translate-x-1/2 w-full max-w-xs space-y-4 flex flex-col items-center">
          <motion.div whileTap={{ scale: 0.97 }} className="w-full flex justify-center max-w-[210px]">
            <GradientButton
              className="w-full whitespace-nowrap text-[15px] px-7 py-3 brightness-[0.9] hover:brightness-100"
              variant="variant"
              style={{
                // 去掉边框高光，并整体压暗
                // @ts-ignore
                ['--border-color-1' as any]: 'transparent',
                ['--border-color-2' as any]: 'transparent',
                ['--color-2' as any]: '#18324f',
                ['--color-3' as any]: '#3b787b',
              }}
              onClick={() => onSelect('self_assess')}
            >
              ✅ 心中有数，直接对答案
            </GradientButton>
          </motion.div>
          <motion.div whileTap={{ scale: 0.97 }} className="w-full flex justify-center max-w-[210px]">
            <GradientButton
              className="w-full whitespace-nowrap text-[15px] px-7 py-3 brightness-[0.9] hover:brightness-100"
              // 采用“初始提示词”的主题色（indigo→white→rose 的玫瑰橙调），整体更暗更柔和
              style={{
                // @ts-ignore 自定义属性
                ['--color-1' as any]: '#100b0e', // 深基底
                ['--color-2' as any]: '#2a2036', // 靠近 indigo 的暗紫
                ['--color-3' as any]: '#6a4b58', // 过渡到玫瑰棕
                ['--color-4' as any]: '#d78b94', // 低饱和玫瑰橙 (接近 #FDA4AF 降亮度)
                // 边框透明以弱化存在感
                ['--border-color-1' as any]: 'transparent',
                ['--border-color-2' as any]: 'transparent',
              }}
              onClick={() => onSelect('enter_test')}
            >
              🤔 有点模糊，进入测试
            </GradientButton>
          </motion.div>
        </div>
      </div>
    </StackFrame>
  );
}

export default PathSelector;


