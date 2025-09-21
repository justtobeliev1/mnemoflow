"use client";

import React, { useState } from "react";
import useSWR from 'swr';
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SearchWithHistory } from "@/components/ui/search-with-history";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Tooltip } from "@/components/ui/tooltip";
import { useToast } from "@/components/ui/toast-notification";
import { HorizontalWordLists } from "@/components/ui/horizontal-word-lists";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { CreateWordListModal } from "@/components/ui/create-wordlist-modal";
import { motion } from "framer-motion";
import { useDueReviews } from "@/hooks/useDueReviews";
import { useWordListsWithStats } from "@/hooks/useWordListsWithStats";
import { FlipWords } from "@/components/ui/flip-words";

function HomePageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);
  const { success, error } = useToast();
  const { data: dueData, isLoading: dueLoading } = useDueReviews(100);
  const { data: statsData, isLoading: statsLoading } = useWordListsWithStats();

  const handleSearch = (query: string) => {
    const trimmedQuery = query.trim();
    if (!trimmedQuery) return;
    
    console.log("搜索:", trimmedQuery);
    // 跳转到单词详情页面
    router.push(`/words/${encodeURIComponent(trimmedQuery)}`);
  };

  const handleLearnClick = () => {
    router.push('/learn/select');
  };

  const handleReviewClick = () => {
    router.push('/review');
  };

  const handleWordListClick = (listId: number) => {
    if (listId === -1) {
      router.push('/word-lists');
    } else {
      router.push(`/word-lists/${listId}`);
    }
  };

  const [createOpen, setCreateOpen] = useState(false);
  const handleCreateWordList = () => setCreateOpen(true);

  const handleSignOutClick = () => {
    setShowLogoutModal(true);
  };

  const handleSignOutConfirm = async () => {
    setIsLoggingOut(true);
    const { error } = await signOut();
    if (error) {
      console.error('退出登录失败:', error);
      setIsLoggingOut(false);
    } else {
      setShowLogoutModal(false);
      setIsLoggingOut(false);
      router.push('/login');
    }
  };

  const handleSignOutCancel = () => {
    setShowLogoutModal(false);
  };

  const fetcher = (url: string) => fetch(url, { cache: 'no-store' }).then(r => r.json());
  const { data: listsData, isLoading: loadingLists, mutate } = useSWR('/api/me/word-lists', fetcher, { revalidateOnFocus: true });
  const wordLists = (listsData?.word_lists || []).map((x:any)=>({ id:x.id, name:x.name, wordCount:x.word_count }));

  // FSRS算法模拟数据
  const fsrsData = {
    dueForReview: dueLoading ? null : ((dueData?.reviews?.length ?? 0) as number | null),
    newToLearn: statsLoading ? null : (statsData?.reduce((sum, list) => sum + list.new_words, 0) ?? 0),
    totalLearned: 243,
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen relative">

      {/* 头部导航 */}
      <motion.header 
        initial={{ opacity: 0, y: -20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="relative z-20 glass-surface border-b border-border/50"
      >
        <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-bold">
              M
            </div>
            <span className="text-xl font-semibold text-foreground">Mnemoflow</span>
          </div>
          
          <div className="flex items-center gap-4">
            {/* 用户信息显示 */}
            <div className="flex items-center gap-2 text-sm text-muted">
              <User size={16} />
              <span>{user?.email}</span>
            </div>
            
            <button className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60">
              <Settings size={20} />
            </button>
            
            <button 
              onClick={handleSignOutClick}
              className="p-2 text-muted hover:text-red-400 transition-colors rounded-lg hover:bg-surface/60"
              title="退出登录"
            >
              <LogOut size={20} />
            </button>
          </div>
        </div>
      </motion.header>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12">
        {/* 欢迎区域 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-12"
        >
          <div className="text-4xl font-bold mb-4">
            <span className="text-foreground">Memorize with</span>
            <span className="text-gradient">
              <FlipWords words={["Connection", "Comprehension", "Creation"]} duration={2000} />
            </span>
          </div>
          <p className="text-muted text-lg">让每一次记忆，都是一场复利之旅</p>
        </motion.div>

        {/* 搜索区域 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.3 }}
          className="mb-16"
        >
          <SearchWithHistory onSearch={handleSearch} />
        </motion.div>

        {/* FSRS学习状态 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.4 }}
          className="grid grid-cols-2 gap-12 mb-12 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <h3 className="text-sm text-muted mb-3">今日待复习</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{fsrsData.dueForReview ?? '—'}</span>
              <span className="text-sm text-muted">词</span>
            </div>
            <div className="flex items-center justify-center gap-1">
              <p className="text-xs text-muted">基于FSRS算法安排</p>
              <Tooltip
                content={
                  <div>
                    <p className="mb-2">
                      <strong>FSRS (Free Spaced Repetition Scheduler)</strong> 是一种基于遗忘曲线的智能复习算法。
                    </p>
                    <p className="mb-2">
                      它会根据您的记忆表现动态调整每个单词的复习间隔，确保在您即将遗忘时安排复习，从而最大化学习效率。
                    </p>
                    <p>
                      了解更多：{" "}
                      <a 
                        href="https://github.com/open-spaced-repetition/fsrs4anki"
                        target="_blank"
                        rel="noopener noreferrer"
                        className="text-primary hover:underline"
                      >
                        GitHub - FSRS算法
                      </a>
                    </p>
                  </div>
                }
              />
            </div>
          </div>
          
          <div className="text-center">
            <h3 className="text-sm text-muted mb-3">新词学习</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{fsrsData.newToLearn ?? '—'}</span>
              <span className="text-sm text-muted">词</span>
            </div>
            <p className="text-xs text-muted">待首次学习</p>
          </div>
        </motion.div>

        {/* 学习和复习按钮 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.5 }}
          className="flex justify-center gap-8 mb-16"
        >
          <InteractiveHoverButton
            text="学习"
            onClick={handleLearnClick}
            className="w-40 h-14 text-lg"
          />
          <InteractiveHoverButton
            text="复习"
            onClick={handleReviewClick}
            className="w-40 h-14 text-lg"
          />
        </motion.div>

        {/* 单词本区域 - 横向滚动 */}
        <motion.div
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ duration: 0.8, delay: 0.6 }}
        >
          {loadingLists ? (
            <div className="text-center text-muted">加载单词本...</div>
          ) : (
            <HorizontalWordLists
              wordLists={wordLists}
              onWordListClick={handleWordListClick}
              onCreateWordList={handleCreateWordList}
            />
          )}
          <CreateWordListModal
            isOpen={createOpen}
            onClose={() => setCreateOpen(false)}
            onConfirm={async (name) => {
              setCreateOpen(false);
              try {
                // 乐观添加
                const key = '/api/me/word-lists';
                const optimistic = { id: -(Date.now()), user_id: '', name, created_at: new Date().toISOString(), word_count: 0 };
                await mutate((current: any) => ({ word_lists: [optimistic, ...(current?.word_lists||[])] }), { revalidate: false });
                const res = await fetch('/api/me/word-lists', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ name }) });
                if (!res.ok) {
                  const body = await res.json();
                  if (body?.error?.error_code === 'WORDLIST_NAME_CONFLICT') {
                    throw new Error('WORDLIST_NAME_CONFLICT');
                  }
                  throw new Error('CREATE_FAILED');
                }
                const body = await res.json();
                await mutate((current: any) => {
                  const filtered = (current?.word_lists||[]).filter((x:any)=>x.id!==optimistic.id);
                  return { word_lists: [body.word_list, ...filtered] };
                }, { revalidate: false });
                await mutate();
                success('已创建单词本');
              } catch (e: any) {
                await mutate(); // 回滚
                if (e?.message === 'WORDLIST_NAME_CONFLICT') error('单词本名称已存在');
                else error('创建失败');
                setCreateOpen(true); // 失败重新打开
                throw e;
              }
            }}
          />
        </motion.div>
      </main>

      {/* 退出登录确认弹窗 */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={handleSignOutCancel}
        onConfirm={handleSignOutConfirm}
        loading={isLoggingOut}
      />
    </div>
  );
}

export default function HomePage() {
  return (
    <AuthGuard>
      <HomePageContent />
    </AuthGuard>
  );
}