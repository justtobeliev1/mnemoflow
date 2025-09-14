"use client";

import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Edit3 } from 'lucide-react';

interface RenameWordListModalProps {
  isOpen: boolean;
  initialName: string;
  onClose: () => void;
  onConfirm: (name: string) => Promise<void> | void;
  loading?: boolean;
}

export function RenameWordListModal({
  isOpen,
  initialName,
  onClose,
  onConfirm,
  loading = false,
}: RenameWordListModalProps) {
  const [name, setName] = useState(initialName);
  const [error, setError] = useState('');

  useEffect(() => {
    if (isOpen) {
      setName(initialName);
      setError('');
    }
  }, [isOpen, initialName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    const trimmed = name.trim();
    if (!trimmed) {
      setError('单词本名称不能为空');
      return;
    }
    if (trimmed.length > 100) {
      setError('单词本名称不能超过100个字符');
      return;
    }

    try {
      setError('');
      await onConfirm(trimmed);
      onClose();
    } catch (err) {
      setError('重命名失败，请重试');
    }
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={onClose}
          />

          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative w-full max-w-md glass-surface rounded-xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              <button
                onClick={onClose}
                disabled={loading}
                className="absolute top-4 right-4 p-1 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 disabled:opacity-50"
              >
                <X size={16} />
              </button>

              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Edit3 size={24} className="text-primary" />
                </div>
              </div>

              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">重命名单词本</h3>
                <p className="text-sm text-muted">为该单词本设置一个新的名称</p>
              </div>

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="rename-wordlist" className="block text-sm font-medium text-foreground mb-2">
                    新名称
                  </label>
                  <input
                    id="rename-wordlist"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    maxLength={100}
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors text-foreground placeholder-muted disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>必填项</span>
                    <span>{name.length}/100</span>
                  </div>
                </div>

                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={onClose}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-surface/60 hover:bg-surface/80 text-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-200 via-white to-rose-200 text-gray-800 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                  >
                    保存
                  </button>
                </div>
              </form>

              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


