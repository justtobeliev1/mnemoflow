"use client";

import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { X, AlertTriangle } from 'lucide-react';

interface ConfirmModalProps {
  isOpen: boolean;
  title: string;
  description?: string;
  confirmText?: string;
  cancelText?: string;
  onConfirm: () => void;
  onClose: () => void;
  loading?: boolean;
}

export function ConfirmModal({
  isOpen,
  title,
  description,
  confirmText = '确认',
  cancelText = '取消',
  onConfirm,
  onClose,
  loading = false,
}: ConfirmModalProps) {
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
                  <AlertTriangle size={24} className="text-primary" />
                </div>
              </div>
              <div className="text-center mb-6">
                <h3 className="text-lg font-semibold text-foreground mb-2">{title}</h3>
                {description && <p className="text-sm text-muted">{description}</p>}
              </div>
              <div className="flex gap-3 pt-2">
                <button
                  onClick={onClose}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-surface/60 hover:bg-surface/80 text-foreground font-medium rounded-lg transition-all duration-200 disabled:opacity-50"
                >
                  {cancelText}
                </button>
                <button
                  onClick={onConfirm}
                  disabled={loading}
                  className="flex-1 py-2.5 px-4 bg-gradient-to-r from-indigo-200 via-white to-rose-200 text-gray-800 font-semibold rounded-lg transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:scale-[1.02]"
                >
                  {confirmText}
                </button>
              </div>
              <div className="absolute inset-0 rounded-xl bg-gradient-to-r from-primary/5 via-transparent to-primary/5 pointer-events-none"></div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}


