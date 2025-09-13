import { SupabaseClient } from '@supabase/supabase-js';
// import { Database } from '@/lib/database.types';
import { ProfileUpdateData } from '@/lib/validators/profile.schemas';
import { createNotFoundError, AppError } from '@/lib/errors';

/**
 * Profile Service - 函数式实现
 * 所有函数都是纯函数，接收依赖作为参数
 */

type SupabaseClientType = SupabaseClient<any>;

/**
 * 获取用户资料的参数类型
 */
type GetProfileArgs = {
  supabase: SupabaseClientType;
  userId: string;
};

/**
 * 更新用户资料的参数类型
 */
type UpdateProfileArgs = {
  supabase: SupabaseClientType;
  userId: string;
  data: ProfileUpdateData;
};

/**
 * 获取指定用户的资料信息
 * 
 * @param args - 包含supabase客户端和用户ID的参数对象
 * @returns 用户资料数据
 * @throws AppError 当用户资料不存在时
 */
export async function getProfileForUser({ supabase, userId }: GetProfileArgs) {
  const { data, error } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('用户资料');
    }
    throw new AppError(`获取用户资料失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 更新指定用户的资料信息
 * 
 * @param args - 包含supabase客户端、用户ID和更新数据的参数对象
 * @returns 更新后的用户资料数据
 * @throws AppError 当更新失败时
 */
export async function updateProfileForUser({ supabase, userId, data }: UpdateProfileArgs) {
  // 如果提供了default_word_list_id，验证该单词本是否存在且属于该用户
  if (data.default_word_list_id) {
    const { data: wordList, error: wordListError } = await supabase
      .from('word_lists')
      .select('id')
      .eq('id', data.default_word_list_id)
      .eq('user_id', userId)
      .single();

    if (wordListError || !wordList) {
      throw new AppError('指定的单词本不存在或不属于当前用户', 400);
    }
  }

  // 执行更新操作
  const updateData = { ...data };
  const { data: updatedProfile, error } = await (supabase as any)
    .from('profiles')
    .update(updateData)
    .eq('id', userId)
    .select()
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      throw createNotFoundError('用户资料');
    }
    throw new AppError(`更新用户资料失败: ${error.message}`, 500);
  }

  return updatedProfile;
}

/**
 * 检查用户资料是否存在
 * 
 * @param args - 包含supabase客户端和用户ID的参数对象
 * @returns 是否存在的布尔值
 */
export async function checkProfileExists({ supabase, userId }: GetProfileArgs): Promise<boolean> {
  const { data, error } = await supabase
    .from('profiles')
    .select('id')
    .eq('id', userId)
    .single();

  return !error && !!data;
}

/**
 * 创建新用户资料
 * 注意：通常由数据库触发器自动创建，此函数用于特殊情况
 * 
 * @param args - 包含supabase客户端、用户ID和邮箱的参数对象
 * @returns 创建的用户资料数据
 */
export async function createProfileForUser({
  supabase,
  userId,
  email,
}: {
  supabase: SupabaseClientType;
  userId: string;
  email?: string;
}) {
  const { data, error } = await (supabase as any)
    .from('profiles')
    .insert({
      id: userId,
      email,
    })
    .select()
    .single();

  if (error) {
    throw new AppError(`创建用户资料失败: ${error.message}`, 500);
  }

  return data;
}