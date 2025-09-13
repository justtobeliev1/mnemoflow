import { SupabaseClient } from '@supabase/supabase-js';
// import { Database } from '@/lib/database.types';
import { WordListCreateData, WordListUpdateData } from '@/lib/validators/word-list.schemas';
import { createNotFoundError, createForbiddenError, AppError } from '@/lib/errors';

/**
 * Word List Service - 函数式实现
 * 管理用户的单词本相关操作
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
 * 获取用户的所有单词本
 * 
 * @param args - 包含supabase客户端和用户ID的参数对象
 * @returns 用户的单词本列表，包含每个单词本的单词数量
 */
export async function getWordListsForUser({ supabase, userId }: BaseArgs) {
  // 使用子查询获取每个单词本的单词数量
  const { data, error } = await supabase
    .from('word_lists')
    .select(`
      id,
      user_id,
      name,
      created_at,
      word_count:user_word_progress(count)
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`获取单词本列表失败: ${error.message}`, 500);
  }

  // 转换数据格式，将count结果转换为数字
  const wordListsWithCount = data.map(list => ({
    ...list,
    word_count: Array.isArray(list.word_count) ? list.word_count.length : 0
  }));

  return wordListsWithCount;
}

/**
 * 获取指定的单词本详情
 * 
 * @param args - 包含supabase客户端、用户ID和单词本ID的参数对象
 * @returns 单词本详情信息
 */
export async function getWordListById({
  supabase,
  userId,
  listId,
}: BaseArgs & { listId: number }) {
  const { data, error } = await supabase
    .from('word_lists')
    .select('*')
    .eq('id', listId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('单词本');
    }
    throw new AppError(`获取单词本详情失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 获取单词本中的所有单词
 * 
 * @param args - 包含supabase客户端、用户ID和单词本ID的参数对象
 * @returns 单词本中的单词列表，包含单词详情和学习进度
 */
export async function getWordsInList({
  supabase,
  userId,
  listId,
}: BaseArgs & { listId: number }) {
  // 首先验证单词本是否存在且属于用户
  await getWordListById({ supabase, userId, listId });

  // 获取单词本中的所有单词及其详情
  const { data, error } = await supabase
    .from('user_word_progress')
    .select(`
      id,
      word_id,
      stability,
      difficulty,
      due,
      lapses,
      state,
      last_review,
      created_at,
      words:word_id (
        id,
        word,
        definition,
        phonetic,
        tags
      )
    `)
    .eq('user_id', userId)
    .eq('word_list_id', listId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`获取单词本内容失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 创建新的单词本
 * 
 * @param args - 包含supabase客户端、用户ID和创建数据的参数对象
 * @returns 创建的单词本信息
 */
export async function createWordListForUser({
  supabase,
  userId,
  data,
}: BaseArgs & { data: WordListCreateData }) {
  const { data: newWordList, error } = await supabase
    .from('word_lists')
    .insert({
      user_id: userId,
      name: data.name,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`创建单词本失败: ${error.message}`, 500);
  }

  return newWordList;
}

/**
 * 更新单词本信息
 * 
 * @param args - 包含supabase客户端、用户ID、单词本ID和更新数据的参数对象
 * @returns 更新后的单词本信息
 */
export async function updateWordListForUser({
  supabase,
  userId,
  listId,
  data,
}: BaseArgs & { listId: number; data: WordListUpdateData }) {
  const { data: updatedWordList, error } = await supabase
    .from('word_lists')
    .update(data)
    .eq('id', listId)
    .eq('user_id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('单词本');
    }
    throw new AppError(`更新单词本失败: ${error.message}`, 500);
  }

  return updatedWordList;
}

/**
 * 删除单词本
 * 注意：这会同时删除该单词本中的所有学习进度记录
 * 
 * @param args - 包含supabase客户端、用户ID和单词本ID的参数对象
 * @returns 删除操作的结果
 */
export async function deleteWordListForUser({
  supabase,
  userId,
  listId,
}: BaseArgs & { listId: number }) {
  // 首先检查是否为用户的默认单词本
  const { data: profile } = await supabase
    .from('profiles')
    .select('default_word_list_id')
    .eq('id', userId)
    .single();

  if (profile?.default_word_list_id === listId) {
    throw new AppError('不能删除默认单词本', 400, '请先设置其他单词本为默认，再删除此单词本');
  }

  // 执行删除操作
  const { error } = await supabase
    .from('word_lists')
    .delete()
    .eq('id', listId)
    .eq('user_id', userId);

  if (error) {
    throw new AppError(`删除单词本失败: ${error.message}`, 500);
  }

  return { success: true };
}

/**
 * 检查单词本是否属于指定用户
 * 
 * @param args - 包含supabase客户端、用户ID和单词本ID的参数对象
 * @returns 是否属于该用户的布尔值
 */
export async function checkWordListOwnership({
  supabase,
  userId,
  listId,
}: BaseArgs & { listId: number }): Promise<boolean> {
  const { data, error } = await supabase
    .from('word_lists')
    .select('id')
    .eq('id', listId)
    .eq('user_id', userId)
    .single();

  return !error && !!data;
}