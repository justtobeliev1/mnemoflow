"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { User, Settings, LogOut } from "lucide-react";
import { useAuth } from "@/contexts/AuthContext";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { SearchWithHistory } from "@/components/ui/search-with-history";
import { InteractiveHoverButton } from "@/components/ui/interactive-hover-button";
import { Tooltip } from "@/components/ui/tooltip";
import { AnimatedBackground } from "@/components/ui/animated-background";
import { HorizontalWordLists } from "@/components/ui/horizontal-word-lists";
import { LogoutConfirmModal } from "@/components/ui/logout-confirm-modal";
import { motion } from "framer-motion";

function HomePageContent() {
  const { user, signOut } = useAuth();
  const router = useRouter();
  const [showLogoutModal, setShowLogoutModal] = useState(false);
  const [isLoggingOut, setIsLoggingOut] = useState(false);

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
    console.log("创建新单词本");
    // TODO: 打开创建单词本对话框
  };

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

  // 模拟数据
  const wordLists = [
    { name: "默认单词本", wordCount: 0 },
    { name: "test", wordCount: 0 },
    { name: "test1", wordCount: 0 },
    { name: "测试", wordCount: 7 },
    { name: "Bellon", wordCount: 23 },
    { name: "Elon", wordCount: 4 },
  ];

  // FSRS算法模拟数据
  const fsrsData = {
    dueForReview: 15,    // 今日待复习
    newToLearn: 28,      // 待学习新词
    totalLearned: 243,   // 总计学习过的词
  };

  const fadeUpVariants = {
    hidden: { opacity: 0, y: 30 },
    visible: { opacity: 1, y: 0 },
  };

  return (
    <div className="min-h-screen bg-background relative">
      {/* 动画背景 */}
      <AnimatedBackground />

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
          <h1 className="text-4xl font-bold mb-4">
            <span className="text-foreground">欢迎回来，</span>
            <span className="text-gradient">{user?.email?.split('@')[0]}</span>
          </h1>
          <p className="text-muted text-lg">您的智能英语学习助手</p>
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