"use client";

import { useRouter } from 'next/navigation';
import { motion, AnimatePresence } from 'framer-motion';
import { X } from 'lucide-react';

interface ExitConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  mode: 'learn' | 'review';
}

export function ExitConfirmModal({ isOpen, onClose, onConfirm, mode }: ExitConfirmModalProps) {
  const router = useRouter();

  const handleConfirm = () => {
    onConfirm();
    if (mode === 'learn') {
      router.push('/learn/select');
    } else {
      router.push('/');
    }
  };

  const title = mode === 'learn' ? '确认退出学习吗？' : '确认退出复习吗？';
  const description = mode === 'learn'
    ? '你可以随时退出学习，所有学习进度都会被自动保存。下次进入时，系统会从当前单词继续，让你无缝衔接之前的学习状态。'
    : '你可以随时退出复习，所有复习进度都会被自动保存。下次进入时，系统会从当前单词继续，让你无缝衔接之前的复习状态。';

  const confirmText = '确认退出';
  const cancelText = mode === 'learn' ? '继续学习' : '继续复习';

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center">
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="absolute inset-0 bg-black/40 backdrop-blur-sm"
            onClick={onClose}
          />

          {/* 弹窗内容 */}
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="relative w-[90vw] max-w-md rounded-2xl bg-gradient-to-br from-surface/90 via-indigo-500/5 to-purple-500/5 border border-white/10 backdrop-blur-xl p-6 shadow-2xl"
          >
            {/* 关闭按钮 */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1.5 rounded-lg text-foreground/60 hover:text-foreground hover:bg-surface/60 transition-colors"
              aria-label="关闭"
            >
              <X className="w-4 h-4" />
            </button>

            {/* 内容 */}
            <div className="space-y-5">
              {/* 标题 */}
              <h3 className="text-xl font-semibold text-foreground text-center">
                {title}
              </h3>

              {/* 描述 */}
              <p className="text-sm leading-relaxed text-foreground/80 text-center">
                {description}
              </p>

              {/* 按钮 */}
              <div className="flex gap-3 pt-2">
                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={onClose}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white/10 border border-white/20 hover:bg-white/20 text-foreground transition-colors font-medium"
                >
                  {cancelText}
                </motion.button>

                <motion.button
                  whileTap={{ scale: 0.98 }}
                  onClick={handleConfirm}
                  className="flex-1 px-4 py-2.5 rounded-xl bg-white hover:bg-white/90 text-gray-900 transition-colors font-medium shadow-lg"
                >
                  {confirmText}
                </motion.button>
              </div>
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

export default ExitConfirmModal;