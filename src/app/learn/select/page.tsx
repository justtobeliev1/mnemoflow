'use client';

import React from 'react';
import { useRouter } from 'next/navigation';
import { AuthGuard } from '@/components/auth/AuthGuard';
import { useWordListsWithStats } from '@/hooks/useWordListsWithStats';
import { LearnWordListCard } from '@/components/ui/learn-word-list-card';
import { ArrowLeft } from 'lucide-react';
import { motion, Variants } from 'framer-motion';

function LearnSelectPageInner() {
  const router = useRouter();
  const { data: lists, isLoading, isError, error } = useWordListsWithStats();

  const handleSelect = (listId: number) => {
    router.push(`/learn/list/${listId}`);
  };

  const containerVariants: Variants = {
    hidden: { opacity: 0 },
    visible: {
      opacity: 1,
      transition: {
        staggerChildren: 0.08,
      },
    },
  };

  const itemVariants: Variants = {
    hidden: { y: 20, opacity: 0 },
    visible: {
      y: 0,
      opacity: 1,
      transition: {
        type: 'spring',
        stiffness: 100,
      },
    },
  };

  const renderContent = () => {
    if (isLoading) {
      return (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="h-48 rounded-xl bg-surface/50 animate-pulse" />
          ))}
        </div>
      );
    }

    if (isError) {
      return (
        <div className="text-center py-20">
          <p className="text-destructive">加载失败: {error?.message}</p>
        </div>
      );
    }

    if (!lists || lists.length === 0) {
      return (
        <div className="text-center py-20 flex flex-col items-center justify-center min-h-[50vh]">
          <svg className="w-20 h-20 text-foreground/30 mb-6" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M798.7 63.6H218.3c-49.6 0-89.6 40.1-89.6 89.6v716.7c0 49.5 40.1 89.6 89.6 89.6h580.3c49.5 0 89.6-40.1 89.6-89.6V153.2c0.1-49.5-40.1-89.6-89.5-89.6z m-115.2 63.2v163.1l-38.2-18.6c-8.8-4.3-18.8-6.6-28.8-6.6s-19.9 2.2-28.8 6.6l-38.2 18.5v-163h134z m141.6 743.1c0 14.5-11.9 26.4-26.4 26.4H218.3c-14.5 0-26.4-11.9-26.4-26.4V153.2c0-14.5 11.9-26.4 26.4-26.4h267.9v241.5c0 7.7 7.1 13.4 15 13.4 2.4 0 4.7-0.5 7.1-1.6l107-51.8c0.3-0.2 0.8-0.3 1.3-0.3s0.8 0.2 1.3 0.3l107 51.8c2.4 1.1 4.7 1.6 7.1 1.6 7.9 0 15-5.7 15-13.4V126.8h51.7c14.5 0 26.4 11.9 26.4 26.4v716.7z" fill="currentColor"></path><path d="M715.1 502.8H301.8c-17.4 0-31.6 14.2-31.6 31.6 0 17.4 14.2 31.6 31.6 31.6h413.3c17.5 0 31.6-14.2 31.6-31.6 0-17.4-14.3-31.6-31.6-31.6zM531.3 670.2H301.8c-17.4 0-31.6 14.2-31.6 31.6 0 17.4 14.2 31.6 31.6 31.6h229.5c17.4 0 31.6-14.2 31.6-31.6 0-17.4-14.3-31.6-31.6-31.6z" fill="currentColor"></path></svg>
          <h2 className="text-xl font-bold text-foreground/80">暂无新词可学</h2>
          <p className="text-foreground/60 mt-2">
            所有单词本均已完成初次学习，或去添加一些新词吧。
          </p>
        </div>
      );
    }

    return (
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="visible"
        className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5"
      >
        {lists.map(list => (
          <motion.div key={list.list_id} variants={itemVariants}>
            <LearnWordListCard
              listId={list.list_id}
              listName={list.list_name}
              newWords={list.new_words}
              learnedWords={list.learned_words}
              totalWords={list.total_words}
              onClick={handleSelect}
            />
          </motion.div>
        ))}
      </motion.div>
    );
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-7xl mx-auto px-8 sm:px-12 lg:px-16 py-10">
        <div className="flex items-center gap-3 mb-8">
          <button
            onClick={() => router.push('/')}
            className="p-2 rounded-lg hover:bg-surface/60 text-foreground"
            aria-label="返回主页"
          >
            <ArrowLeft size={18} />
          </button>
          <h1 className="text-3xl font-bold text-foreground">请选择单词本学习</h1>
        </div>
        {renderContent()}
      </div>
    </div>
  );
}

export default function LearnSelectPage() {
  return (
    <AuthGuard>
      <LearnSelectPageInner />
    </AuthGuard>
  );
}
