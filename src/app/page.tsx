"use client";

import React from "react";
import { User, Settings, LogOut } from "lucide-react";
import { SearchWithHistory } from "@/components/ui/search-with-history";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { LearningStatsCard } from "@/components/ui/learning-stats-card";
import { WordListCard } from "@/components/ui/word-list-card";
import { Tooltip } from "@/components/ui/tooltip";
import { HorizontalWordLists } from "@/components/ui/horizontal-word-lists";
import { ProtectedRoute } from "@/components/auth/ProtectedRoute";
import { useAuth } from "@/contexts/AuthContext";
import { AppLayout } from "@/components/layout/AppLayout";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { CreateWordListModal } from "@/components/ui/create-wordlist-modal";
import { motion } from "framer-motion";
import { useToast, ToastContainer } from "@/components/ui/toast-notification";

function HomePageContent() {
  const { user, signOut, session } = useAuth();
  const { success, error } = useToast();
  const [fsrsData, setFsrsData] = React.useState({
    dueForReview: 0,
    newToLearn: 0,
    totalLearned: 0,
  });
  const [wordLists, setWordLists] = React.useState<{name: string, wordCount: number, id: string}[]>([]);
  const [showLogoutModal, setShowLogoutModal] = React.useState(false);
  const [logoutLoading, setLogoutLoading] = React.useState(false);
  const [showCreateWordListModal, setShowCreateWordListModal] = React.useState(false);
  const [createWordListLoading, setCreateWordListLoading] = React.useState(false);

  const handleSearch = (query: string) => {
    console.log("搜索:", query);
    // TODO: 实现搜索逻辑
  };

  const handleLearnClick = () => {
    console.log("开始学习");
    // TODO: 导航到学习页面
  };

  const handleReviewClick = () => {
    console.log("开始复习");
    // TODO: 导航到复习页面
  };

  const handleWordListClick = (listName: string) => {
    console.log("打开单词本:", listName);
    // TODO: 导航到单词本详情页
  };

  const handleCreateWordList = () => {
    setShowCreateWordListModal(true);
  };

  const handleConfirmCreateWordList = async (name: string, description?: string) => {
    if (!session?.access_token) return;

    // 防重名检查
    const existingList = wordLists.find(list => list.name.toLowerCase() === name.toLowerCase());
    if (existingList) {
      error('单词本名称已存在，请使用其他名称');
      throw new Error('单词本名称已存在');
    }

    // 乐观更新 - 先添加到本地状态
    const optimisticId = Date.now().toString();
    const optimisticList = {
      id: optimisticId,
      name: name,
      wordCount: 0
    };
    
    setWordLists(prev => [optimisticList, ...prev]);
    setCreateWordListLoading(true);
    
    try {
      const response = await fetch('/api/me/word-lists', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${session.access_token}`
        },
        body: JSON.stringify({ name, description })
      });

      if (response.ok) {
        const data = await response.json();
        // 用真实数据替换乐观更新的数据
        const realWordList = {
          id: data.wordList.id.toString(),
          name: data.wordList.name,
          wordCount: 0
        };
        
        setWordLists(prev => {
          const index = prev.findIndex(list => list.id === optimisticId);
          if (index === -1) return prev;
          const newList = [...prev];
          newList[index] = realWordList;
          return newList;
        });
        
        setShowCreateWordListModal(false);
        success(`单词本「${name}」创建成功！`);
      } else {
        // 创建失败，回滚乐观更新
        setWordLists(prev => prev.filter(list => list.id !== optimisticId));
        const errorData = await response.json();
        error(errorData.error || '创建失败，请重试');
        throw new Error(errorData.error || '创建失败');
      }
    } catch (err) {
      // 网络错误等，回滚乐观更新
      setWordLists(prev => prev.filter(list => list.id !== optimisticId));
      console.error('创建单词本失败:', err);
      if (err instanceof Error && !err.message.includes('已存在')) {
        error('网络错误，请检查连接后重试');
      }
      throw err;
    } finally {
      setCreateWordListLoading(false);
    }
  };

  const handleSignOut = () => {
    setShowLogoutModal(true);
  };

  const handleConfirmLogout = async () => {
    setLogoutLoading(true);
    try {
      await signOut();
      setShowLogoutModal(false);
    } catch (error) {
      console.error('退出登录失败:', error);
    } finally {
      setLogoutLoading(false);
    }
  };

  // 获取复习数据
  const fetchReviewData = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/me/review/queue?type=review&limit=1', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        setFsrsData(data.stats);
      }
    } catch (error) {
      console.error('获取复习数据失败:', error);
    }
  };

  // 获取单词本数据
  const fetchWordLists = async () => {
    if (!session?.access_token) return;

    try {
      const response = await fetch('/api/me/word-lists', {
        headers: {
          'Authorization': `Bearer ${session.access_token}`
        }
      });

      if (response.ok) {
        const data = await response.json();
        if (data.wordLists && data.wordLists.length > 0) {
          setWordLists(data.wordLists.map((wl: any) => ({
            id: wl.id,
            name: wl.name,
            wordCount: wl.wordCount || 0
          })));
        }
      }
    } catch (error) {
      console.error('获取单词本失败:', error);
    }
  };

  // 组件挂载时获取数据
  React.useEffect(() => {
    if (session) {
      // 认证已经处理了初始化，直接获取数据
      fetchReviewData();
      fetchWordLists();
    }
  }, [session]);

  const fadeUpVariants = {
    hidden: { 
      opacity: 0, 
      y: 30 
    },
    visible: {
      opacity: 1,
      y: 0
    },
  };

  return (
    <AppLayout>
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
            <span className="text-sm text-muted hidden sm:block">
              {user?.email}
            </span>
            <button className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60">
              <Settings size={20} />
            </button>
            <button 
              onClick={handleSignOut}
              className="p-2 text-muted hover:text-foreground transition-colors rounded-lg hover:bg-surface/60"
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
          transition={{ delay: 0.2 }}
          className="text-center mb-12"
        >
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-foreground">欢迎使用 </span>
            <span className="text-gradient">Mnemoflow</span>
          </h1>
          <p className="text-muted text-lg">您的智能英语学习助手</p>
        </motion.div>

        {/* 搜索区域 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.3 }}
          className="mb-16"
        >
          <SearchWithHistory onSearch={handleSearch} />
        </motion.div>

        {/* FSRS学习状态 */}
        <motion.div 
          variants={fadeUpVariants}
          initial="hidden"
          animate="visible"
          transition={{ delay: 0.4 }}
          className="grid grid-cols-2 gap-12 mb-12 max-w-2xl mx-auto"
        >
          <div className="text-center">
            <h3 className="text-sm text-muted mb-3">今日复习</h3>
            <div className="flex items-baseline justify-center gap-2 mb-2">
              <span className="text-4xl font-bold text-foreground">{fsrsData.dueForReview}</span>
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
              <span className="text-4xl font-bold text-foreground">{fsrsData.newToLearn}</span>
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
          transition={{ delay: 0.5 }}
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
          transition={{ delay: 0.6 }}
        >
          <HorizontalWordLists
            wordLists={wordLists}
            onWordListClick={handleWordListClick}
            onCreateWordList={handleCreateWordList}
          />
        </motion.div>
      </main>

      {/* 退出登录确认弹窗 */}
      <LogoutConfirmModal
        isOpen={showLogoutModal}
        onClose={() => setShowLogoutModal(false)}
        onConfirm={handleConfirmLogout}
        loading={logoutLoading}
      />

      {/* 创建单词本弹窗 */}
      <CreateWordListModal
        isOpen={showCreateWordListModal}
        onClose={() => setShowCreateWordListModal(false)}
        onConfirm={handleConfirmCreateWordList}
        loading={createWordListLoading}
      />
    </AppLayout>
  );
}

export default function HomePage() {
  return (
    <ProtectedRoute>
      <HomePageContent />
      <ToastContainer />
    </ProtectedRoute>
  );
}
