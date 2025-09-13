import { SupabaseClient } from '@supabase/supabase-js';
import { WordCollectData, WordMoveData } from '@/lib/validators/word.schemas';
import { createNotFoundError, createValidationError, AppError } from '@/lib/errors';

/**
 * Word Service - 函数式实现
 * 管理词汇查询、收录和学习进度相关操作
 */

type SupabaseClientType = SupabaseClient<any>;

/**
 * 基础参数类型
 */
type BaseArgs = {
  supabase: SupabaseClientType;
  userId: string;
};

/**
 * 根据单词文本查询单词信息
 * 
 * @param args - 包含supabase客户端和搜索词的参数对象
 * @returns 单词信息，如果不存在则返回null
 */
export async function findWordByText({
  supabase,
  searchTerm,
}: {
  supabase: SupabaseClientType;
  searchTerm: string;
}) {
  const { data, error } = await supabase
    .from('words')
    .select('*')
    .eq('word', searchTerm.toLowerCase().trim())
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 单词不存在
    }
    throw new AppError(`查询单词失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 收录单词到用户的学习列表
 * 
 * @param args - 包含supabase客户端、用户ID和收录数据的参数对象
 * @returns 创建的学习进度记录
 */
export async function collectWordForUser({
  supabase,
  userId,
  data,
}: BaseArgs & { data: WordCollectData }) {
  // 1. 验证单词是否存在
  const { data: word, error: wordError } = await supabase
    .from('words')
    .select('id')
    .eq('id', data.word_id)
    .single();

  if (wordError || !word) {
    throw createNotFoundError('单词');
  }

  // 2. 确定目标单词本ID
  let targetListId = data.list_id;
  
  if (!targetListId) {
    // 使用用户的默认单词本
    const { data: profile } = await supabase
      .from('profiles')
      .select('default_word_list_id')
      .eq('id', userId)
      .single();

    if (!profile?.default_word_list_id) {
      throw new AppError('用户没有设置默认单词本', 400);
    }
    
    targetListId = profile.default_word_list_id;
  }

  // 3. 验证单词本是否存在且属于用户
  const { data: wordList, error: listError } = await supabase
    .from('word_lists')
    .select('id')
    .eq('id', targetListId)
    .eq('user_id', userId)
    .single();

  if (listError || !wordList) {
    throw createNotFoundError('单词本');
  }

  // 4. 检查是否已经收录过
  const { data: existingProgress } = await supabase
    .from('user_word_progress')
    .select('id')
    .eq('user_id', userId)
    .eq('word_id', data.word_id)
    .single();

  if (existingProgress) {
    throw new AppError('该单词已经在学习列表中', 400);
  }

  // 5. 创建学习进度记录
  const { data: newProgress, error: progressError } = await (supabase as any)
    .from('user_word_progress')
    .insert({
      user_id: userId,
      word_id: data.word_id,
      word_list_id: targetListId,
      due: new Date().toISOString(), // 新词立即可学习
      lapses: 0,
      state: 0, // FSRS初始状态
    })
    .select()
    .single();

  if (progressError) {
    throw new AppError(`收录单词失败: ${progressError.message}`, 500);
  }

  return newProgress;
}

/**
 * 从用户学习列表中移除单词
 * 
 * @param args - 包含supabase客户端、用户ID和单词ID的参数对象
 * @returns 删除操作的结果
 */
export async function removeWordForUser({
  supabase,
  userId,
  wordId,
}: BaseArgs & { wordId: number }) {
  const { error } = await supabase
    .from('user_word_progress')
    .delete()
    .eq('user_id', userId)
    .eq('word_id', wordId);

  if (error) {
    throw new AppError(`移除单词失败: ${error.message}`, 500);
  }

  return { success: true };
}

/**
 * 移动单词到其他单词本
 * 
 * @param args - 包含supabase客户端、用户ID、单词ID和移动数据的参数对象
 * @returns 更新后的学习进度记录
 */
export async function moveWordForUser({
  supabase,
  userId,
  wordId,
  data,
}: BaseArgs & { wordId: number; data: WordMoveData }) {
  // 1. 验证目标单词本是否存在且属于用户
  const { data: wordList, error: listError } = await supabase
    .from('word_lists')
    .select('id')
    .eq('id', data.new_list_id)
    .eq('user_id', userId)
    .single();

  if (listError || !wordList) {
    throw createNotFoundError('目标单词本');
  }

  // 2. 更新学习进度记录的单词本ID
  const { data: updatedProgress, error: updateError } = await (supabase as any)
    .from('user_word_progress')
    .update({ word_list_id: data.new_list_id })
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .select()
    .single();

  if (updateError) {
    if (updateError.code === 'PGRST116') {
      throw createNotFoundError('学习记录');
    }
    throw new AppError(`移动单词失败: ${updateError.message}`, 500);
  }

  return updatedProgress;
}

/**
 * 获取用户的搜索历史
 * 
 * @param args - 包含supabase客户端、用户ID和查询限制的参数对象
 * @returns 搜索历史记录列表
 */
export async function getSearchHistoryForUser({
  supabase,
  userId,
  limit = 10,
}: BaseArgs & { limit?: number }) {
  const { data, error } = await supabase
    .from('user_search_history')
    .select(`
      id,
      word_id,
      search_count,
      last_searched_at,
      words:word_id (
        id,
        word,
        definition,
        phonetic,
        tags
      )
    `)
    .eq('user_id', userId)
    .order('last_searched_at', { ascending: false })
    .limit(limit);

  if (error) {
    throw new AppError(`获取搜索历史失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 记录用户搜索历史
 * 
 * @param args - 包含supabase客户端、用户ID和单词ID的参数对象
 * @returns 搜索历史记录
 */
export async function recordSearchHistory({
  supabase,
  userId,
  wordId,
}: BaseArgs & { wordId: number }) {
  // 使用upsert来处理重复搜索
  const { data, error } = await (supabase as any)
    .from('user_search_history')
    .upsert(
      {
        user_id: userId,
        word_id: wordId,
        search_count: 1,
        last_searched_at: new Date().toISOString(),
      },
      {
        onConflict: 'user_id,word_id',
        // 如果记录已存在，更新搜索次数和时间
        update: {
          search_count: 'search_count + 1',
          last_searched_at: new Date().toISOString(),
        },
      }
    )
    .select()
    .single();

  if (error) {
    // 搜索历史记录失败不应该影响主要功能，只记录错误
    console.error('记录搜索历史失败:', error);
    return null;
  }

  return data;
}