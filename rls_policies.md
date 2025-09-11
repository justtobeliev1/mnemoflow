# Mnemoflow 行级安全策略 (RLS)

  

**文档版本**: 1.0

**状态**: ✅ **已在生产数据库中激活并生效**

  

## 核心目的

  

本文档包含了 Mnemoflow 应用所有数据表的行级安全 (RLS) 策略的完整 SQL 定义。

  

**请将此文件作为数据访问权限的“唯一事实来源 (Single Source of Truth)”。** 所有后端代码在进行数据操作时，都必须遵守这些已生效的安全规则。

  

-- =================================================================

-- Description: This script defines the complete, performance-optimized

-- RLS policies for the application. It ensures that users can only

-- access their own data while maintaining high performance.

-- =================================================================

  

-- 1. Profiles (用户资料表)

-- Users can manage their own profile, but not others'.

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can view their own profile."

  ON public.profiles FOR SELECT

  TO authenticated

  USING ( (SELECT auth.uid()) = id );

  

CREATE POLICY "Users can insert their own profile."

  ON public.profiles FOR INSERT

  TO authenticated

  WITH CHECK ( (SELECT auth.uid()) = id );

  

CREATE POLICY "Users can update their own profile."

  ON public.profiles FOR UPDATE

  TO authenticated

  USING ( (SELECT auth.uid()) = id )

  WITH CHECK ( (SELECT auth.uid()) = id );

  

CREATE POLICY "Users can delete their own profile."

  ON public.profiles FOR DELETE

  TO authenticated

  USING ( (SELECT auth.uid()) = id );

  

-- =================================================================

  

-- 2. Words (词典核心表)

-- All authenticated users can read from the dictionary. No one can write.

ALTER TABLE public.words ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Allow authenticated read access"

  ON public.words FOR SELECT

  TO authenticated

  USING (true);

  

-- =================================================================

  

-- 3. Word Mnemonics (助记内容表)

-- All authenticated users can read, but only the creator can edit/delete.

ALTER TABLE public.word_mnemonics ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Allow authenticated read access"

  ON public.word_mnemonics FOR SELECT

  TO authenticated

  USING (true);

  

CREATE POLICY "Users can insert their own mnemonics."

  ON public.word_mnemonics FOR INSERT

  TO authenticated

  WITH CHECK ( (SELECT auth.uid()) = created_by );

  

CREATE POLICY "Users can update their own mnemonics."

  ON public.word_mnemonics FOR UPDATE

  TO authenticated

  USING ( (SELECT auth.uid()) = created_by )

  WITH CHECK ( (SELECT auth.uid()) = created_by );

  

CREATE POLICY "Users can delete their own mnemonics."

  ON public.word_mnemonics FOR DELETE

  TO authenticated

  USING ( (SELECT auth.uid()) = created_by );

  

-- =================================================================

  

-- 4. Word Lists (用户单词本)

-- Users can only manage their own word lists.

ALTER TABLE public.word_lists ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can manage their own word lists."

  ON public.word_lists FOR ALL

  TO authenticated

  USING ( (SELECT auth.uid()) = user_id )

  WITH CHECK ( (SELECT auth.uid()) = user_id );

  

-- =================================================================

  

-- 5. User Word Progress (用户学习进度)

-- Users can only manage their own learning progress.

ALTER TABLE public.user_word_progress ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can manage their own word progress."

  ON public.user_word_progress FOR ALL

  TO authenticated

  USING ( (SELECT auth.uid()) = user_id )

  WITH CHECK ( (SELECT auth.uid()) = user_id );

  

-- =================================================================

  

-- 6. Mnemonic Feedback (助记内容反馈)

-- Users can only manage their own feedback.

ALTER TABLE public.mnemonic_feedback ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can manage their own feedback."

  ON public.mnemonic_feedback FOR ALL

  TO authenticated

  USING ( (SELECT auth.uid()) = user_id )

  WITH CHECK ( (SELECT auth.uid()) = user_id );

  

-- =================================================================

  

-- 7. User Search History (用户搜索历史)

-- Users can only manage their own search history.

ALTER TABLE public.user_search_history ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can manage their own search history."

  ON public.user_search_history FOR ALL

  TO authenticated

  USING ( (SELECT auth.uid()) = user_id )

  WITH CHECK ( (SELECT auth.uid()) = user_id );

  

-- =================================================================

  

-- 8. Word Chat History (单词聊天历史)

-- Users can only manage their own chat history.

ALTER TABLE public.word_chat_history ENABLE ROW LEVEL SECURITY;

  

CREATE POLICY "Users can manage their own chat history."

  ON public.word_chat_history FOR ALL

  TO authenticated

  USING ( (SELECT auth.uid()) = user_id )

  WITH CHECK ( (SELECT auth.uid()) = user_id );