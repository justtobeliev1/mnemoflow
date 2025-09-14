"use client";

import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Plus, X, Book } from 'lucide-react';

interface CreateWordListModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (name: string, description?: string) => Promise<void>;
  loading?: boolean;
}

export function CreateWordListModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false 
}: CreateWordListModalProps) {
  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!name.trim()) {
      setError('单词本名称不能为空');
      return;
    }

    if (name.trim().length > 50) {
      setError('单词本名称不能超过50个字符');
      return;
    }

    try {
      setError('');
      await onConfirm(name.trim(), description.trim() || undefined);
      handleClose();
    } catch (error) {
      setError('创建失败，请重试');
    }
  };

  const handleClose = () => {
    setName('');
    setDescription('');
    setError('');
    onClose();
  };

  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* 背景遮罩 */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
            onClick={handleClose}
          />

          {/* 弹窗内容 */}
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 20 }}
              transition={{ duration: 0.2, ease: [0.25, 0.4, 0.25, 1] }}
              className="relative w-full max-w-md glass-surface rounded-xl p-6 shadow-2xl"
              onClick={(e) => e.stopPropagation()}
            >
              {/* 关闭按钮 */}
              <button
                onClick={handleClose}
                disabled={loading}
                className="absolute top-4 right-4 p-1 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60 disabled:opacity-50"
              >
                <X size={16} />
              </button>

              {/* 图标 */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-primary/20 flex items-center justify-center">
                  <Book size={24} className="text-primary" />
                </div>
              </div>

              {/* 标题 */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  创建新单词本
                </h3>
                <p className="text-sm text-muted">
                  为您的学习计划创建一个新的单词本
                </p>
              </div>

              {/* 表单 */}
              <form onSubmit={handleSubmit} className="space-y-4">
                {/* 单词本名称 */}
                <div>
                  <label htmlFor="wordlist-name" className="block text-sm font-medium text-foreground mb-2">
                    单词本名称 <span className="text-red-400">*</span>
                  </label>
                  <input
                    id="wordlist-name"
                    type="text"
                    value={name}
                    onChange={(e) => setName(e.target.value)}
                    placeholder="例如：TOEFL核心词汇"
                    maxLength={50}
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors text-foreground placeholder-muted disabled:opacity-50"
                  />
                  <div className="flex justify-between text-xs text-muted mt-1">
                    <span>必填项</span>
                    <span>{name.length}/50</span>
                  </div>
                </div>

                {/* 描述字段暂时禁用 - 等待数据库表更新 */}
                {false && (
                <div>
                  <label htmlFor="wordlist-description" className="block text-sm font-medium text-foreground mb-2">
                    描述（可选）
                  </label>
                  <textarea
                    id="wordlist-description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    placeholder="简要描述这个单词本的用途和内容"
                    maxLength={200}
                    rows={3}
                    disabled={loading}
                    className="w-full px-3 py-2.5 bg-input border border-border rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary/50 transition-colors text-foreground placeholder-muted resize-none disabled:opacity-50"
                  />
                  <div className="text-xs text-muted text-right mt-1">
                    {description.length}/200
                  </div>
                </div>
                )}

                {/* 错误信息 */}
                {error && (
                  <motion.div
                    initial={{ opacity: 0, y: -10 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg"
                  >
                    <p className="text-sm text-red-400">{error}</p>
                  </motion.div>
                )}

                {/* 按钮组 */}
                <div className="flex gap-3 pt-2">
                  <button
                    type="button"
                    onClick={handleClose}
                    disabled={loading}
                    className="flex-1 py-2.5 px-4 bg-surface/60 hover:bg-surface/80 text-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={loading || !name.trim()}
                    className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-200 via-white to-rose-200 text-gray-800 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2"
                  >
                    {loading ? (
                      <>
                        <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-gray-800"></div>
                        创建中...
                      </>
                    ) : (
                      <>
                        <Plus size={16} />
                        创建单词本
                      </>
                    )}
                  </button>
                </div>
              </form>

              {/* 装饰性渐变边框 */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
