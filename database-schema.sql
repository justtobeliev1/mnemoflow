-- Mnemoflow 安全的数据库更新脚本
-- 只添加必要的RLS策略，不影响现有数据结构

-- 1. 为 word_lists 表启用RLS（如果还没启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'word_lists' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE word_lists ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 2. 为 word_lists 添加RLS策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'word_lists' AND policyname = 'Users can manage own word lists'
    ) THEN
        CREATE POLICY "Users can manage own word lists" ON word_lists
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 3. 为 user_search_history 表启用RLS（如果还没启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_search_history' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE user_search_history ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 4. 为 user_search_history 添加RLS策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_search_history' AND policyname = 'Users can manage own search history'
    ) THEN
        CREATE POLICY "Users can manage own search history" ON user_search_history
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 5. 为 user_word_progress 表启用RLS（如果还没启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'user_word_progress' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE user_word_progress ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 6. 为 user_word_progress 添加RLS策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'user_word_progress' AND policyname = 'Users can manage own progress'
    ) THEN
        CREATE POLICY "Users can manage own progress" ON user_word_progress
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 7. 为 word_mnemonics 表启用RLS（如果还没启用）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_class c
        JOIN pg_namespace n ON n.oid = c.relnamespace
        WHERE c.relname = 'word_mnemonics' AND n.nspname = 'public' AND c.relrowsecurity = true
    ) THEN
        ALTER TABLE word_mnemonics ENABLE ROW LEVEL SECURITY;
    END IF;
END $$;

-- 8. 为 word_mnemonics 添加RLS策略（如果不存在）
DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1 FROM pg_policies 
        WHERE tablename = 'word_mnemonics' AND policyname = 'Users can manage own mnemonics'
    ) THEN
        CREATE POLICY "Users can manage own mnemonics" ON word_mnemonics
            FOR ALL USING (auth.uid() = user_id);
    END IF;
END $$;

-- 9. 创建有用的索引（如果不存在）
CREATE INDEX IF NOT EXISTS idx_word_lists_user_id ON word_lists(user_id);
CREATE INDEX IF NOT EXISTS idx_word_lists_is_default ON word_lists(is_default);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_user_id ON user_word_progress(user_id);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_due ON user_word_progress(due);
CREATE INDEX IF NOT EXISTS idx_user_word_progress_state ON user_word_progress(state);
CREATE INDEX IF NOT EXISTS idx_user_search_history_user_id ON user_search_history(user_id);
CREATE INDEX IF NOT EXISTS idx_user_search_history_last_searched_at ON user_search_history(last_searched_at);