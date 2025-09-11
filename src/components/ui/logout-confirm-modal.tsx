"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { LogOut, X } from 'lucide-react';

interface LogoutConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => void;
  loading?: boolean;
}

export function LogoutConfirmModal({ 
  isOpen, 
  onClose, 
  onConfirm, 
  loading = false 
}: LogoutConfirmModalProps) {
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
            onClick={onClose}
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
                onClick={onClose}
                className="absolute top-4 right-4 p-1 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60"
              >
                <X size={16} />
              </button>

              {/* 图标 */}
              <div className="flex justify-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/20 flex items-center justify-center">
                  <LogOut size={24} className="text-red-400" />
                </div>
              </div>

              {/* 标题和描述 */}
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">
                  确认退出登录
                </h3>
                <p className="text-sm text-muted">
                  您确定要退出当前账户吗？退出后需要重新登录才能访问您的学习数据。
                </p>
              </div>

              {/* 按钮组 */}
              <div className="flex gap-3">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-surface/60 hover:bg-surface/80 text-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  取消
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 font-medium rounded-lg transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  {loading ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-red-400"></div>
                      退出中...
                    </>
                  ) : (
                    <>
                      <LogOut size={16} />
                      退出登录
                    </>
                  )}
                </button>
              </div>

              {/* 装饰性渐变边框 */}
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-red-500/5 via-transparent to-red-500/5 pointer-events-none"></div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
