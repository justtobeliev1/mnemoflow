import { SupabaseClient } from '@supabase/supabase-js';
import { CreateFeedbackData } from '@/lib/validators/feedback.schemas';
import { AppError } from '@/lib/errors';

/**
 * Feedback Service - 函数式实现
 * 管理用户反馈相关操作
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
 * 创建用户反馈
 * 
 * @param args - 包含supabase客户端、用户ID和反馈数据的参数对象
 * @returns 创建的反馈记录
 */
export async function createFeedbackForUser({
  supabase,
  userId,
  data,
}: BaseArgs & { data: CreateFeedbackData }) {
  // 准备插入数据
  const feedbackData = {
    type: data.type,
    title: data.title,
    content: data.content,
    priority: data.priority,
    status: 'open', // 新反馈默认为开放状态
    contact_email: data.contact_email || null,
    user_agent: data.user_agent || null,
    url: data.url || null,
    user_id: userId,
  };

  // 插入反馈记录
  const { data: newFeedback, error } = await (supabase as any)
    .from('feedback')
    .insert(feedbackData)
    .select()
    .single();

  if (error) {
    throw new AppError(`创建反馈失败: ${error.message}`, 500);
  }

  return newFeedback;
}

/**
 * 获取用户的反馈历史
 * 
 * @param args - 包含supabase客户端、用户ID和查询参数的参数对象
 * @returns 用户的反馈列表
 */
export async function getFeedbackForUser({
  supabase,
  userId,
  limit = 20,
  offset = 0,
}: BaseArgs & { limit?: number; offset?: number }) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .range(offset, offset + limit - 1);

  if (error) {
    throw new AppError(`获取反馈历史失败: ${error.message}`, 500);
  }

  return data || [];
}

/**
 * 获取单个反馈详情
 * 
 * @param args - 包含supabase客户端、用户ID和反馈ID的参数对象
 * @returns 反馈详情
 */
export async function getFeedbackByIdForUser({
  supabase,
  userId,
  feedbackId,
}: BaseArgs & { feedbackId: string }) {
  const { data, error } = await supabase
    .from('feedback')
    .select('*')
    .eq('id', feedbackId)
    .eq('user_id', userId)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 反馈不存在
    }
    throw new AppError(`获取反馈详情失败: ${error.message}`, 500);
  }

  return data;
}