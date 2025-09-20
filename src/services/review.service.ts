import { SupabaseClient } from '@supabase/supabase-js';
import { Database } from '@/lib/database.types';
import { AppError, createNotFoundError } from '@/lib/errors';
import { FSRSRating, FSRSRatingSchema } from '@/lib/validators/review.schemas';
import { fsrs, Card, State, Rating } from 'ts-fsrs';

/**
 * Review Service - 函数式实现
 * 管理复习队列和学习进度相关操作
 */

type SupabaseAdminClient = SupabaseClient<Database, 'public'>;

/**
 * 基础参数类型
 */
type BaseArgs = {
  supabase: SupabaseAdminClient;
  userId: string;
};

/**
 * FSRS算法相关常量
 */
const FSRS_INITIAL_STABILITY = 2.7; // 初始稳定度
const FSRS_INITIAL_DIFFICULTY = 5.0; // 初始难度

/**
 * 计算下次复习时间（简化版FSRS算法）
 */
function calculateNextReview(
  stability: number,
  difficulty: number,
  rating: FSRSRating,
  lapses: number
): { newStability: number; newDifficulty: number; nextDue: Date; newState: number } {
  let newStability = stability;
  let newDifficulty = difficulty;
  let intervalDays = 1;
  let newState = 1; // 1=learning, 2=review, 3=relearning
  
  switch (rating) {
    case 'again':
      // 遗忘，重新学习
      newStability = Math.max(0.1, stability * 0.8);
      newDifficulty = Math.min(10, difficulty + 0.8);
      intervalDays = 1; // 1天后重新复习
      newState = 3; // relearning
      break;
      
    case 'hard':
      // 困难，稳定度略微增加
      newStability = stability * 1.2;
      newDifficulty = Math.min(10, difficulty + 0.15);
      intervalDays = Math.max(1, Math.round(stability * 1.2));
      newState = stability < 7 ? 1 : 2;
      break;
      
    case 'good':
      // 良好，正常增加稳定度
      newStability = stability * 2.5;
      newDifficulty = Math.max(1, difficulty - 0.15);
      intervalDays = Math.max(1, Math.round(stability * 2.5));
      newState = 2; // review
      break;
      
    case 'easy':
      // 简单，大幅增加稳定度
      newStability = stability * 4.0;
      newDifficulty = Math.max(1, difficulty - 0.3);
      intervalDays = Math.max(1, Math.round(stability * 4.0));
      newState = 2; // review
      break;
  }
  
  const nextDue = new Date();
  nextDue.setDate(nextDue.getDate() + intervalDays);
  
  return {
    newStability: Math.round(newStability * 100) / 100,
    newDifficulty: Math.round(newDifficulty * 100) / 100,
    nextDue,
    newState
  };
}

/**
 * 获取用户的复习队列
 * 
 * @param args - 包含supabase客户端、用户ID和查询参数的参数对象
 * @returns 复习队列列表
 */
export async function getReviewQueueForUser({
  supabase,
  userId,
  limit = 20,
  dueBefore,
}: BaseArgs & { limit?: number; dueBefore?: string }) {
  let query = supabase
    .from('user_word_progress')
    .select(`
      id,
      word_id,
      word_list_id,
      stability,
      difficulty,
      due,
      lapses,
      state,
      last_review,
      words:word_id (
        id,
        word,
        definition,
        phonetic,
        tags
      )
    `)
    .eq('user_id', userId)
    .order('due', { ascending: true })
    .limit(limit);

  // 如果指定了到期时间限制
  if (dueBefore) {
    query = query.lte('due', dueBefore);
  } else {
    // 默认只返回已到期的单词
    query = query.lte('due', new Date().toISOString());
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(`获取复习队列失败: ${error.message}`, 500);
  }

  return data || [];
}

/**
 * 获取用户的复习统计信息
 * 
 * @param args - 包含supabase客户端和用户ID的参数对象
 * @returns 复习统计信息
 */
export async function getReviewStatsForUser({
  supabase,
  userId,
}: BaseArgs) {
  const now = new Date().toISOString();
  
  // 获取总体统计
  const { data: totalStats, error: totalError } = await supabase
    .from('user_word_progress')
    .select('state')
    .eq('user_id', userId);

  if (totalError) {
    throw new AppError(`获取复习统计失败: ${totalError.message}`, 500);
  }

  // 获取今日到期统计
  const { data: dueStats, error: dueError } = await supabase
    .from('user_word_progress')
    .select('id')
    .eq('user_id', userId)
    .lte('due', now);

  if (dueError) {
    throw new AppError(`获取到期统计失败: ${dueError.message}`, 500);
  }

  // 计算各种状态的单词数量
  const stats = {
    total_words: totalStats?.length || 0,
    new_words: totalStats?.filter(item => item.state === 0).length || 0,
    learning_words: totalStats?.filter(item => item.state === 1).length || 0,
    review_words: totalStats?.filter(item => item.state === 2).length || 0,
    due_today: dueStats?.length || 0,
  };

  return stats;
}

/**
 * 更新单词的学习进度
 * 
 * @param args - 包含supabase客户端、用户ID、单词ID和更新数据的参数对象
 * @returns 更新后的学习进度记录
 */
export async function updateWordProgressForUser({
  supabase,
  userId,
  wordId,
  data,
}: BaseArgs & { wordId: number; data: FSRSRating }) {
  // 1. 获取当前学习进度
  const { data: currentProgress, error: fetchError } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single();

  if (fetchError || !currentProgress) {
    throw createNotFoundError('学习记录');
  }

  // 2. 计算新的FSRS参数
  const currentStability = currentProgress.stability || FSRS_INITIAL_STABILITY;
  const currentDifficulty = currentProgress.difficulty || FSRS_INITIAL_DIFFICULTY;
  const currentLapses = currentProgress.lapses || 0;

  const fsrsResult = calculateNextReview(
    currentStability,
    currentDifficulty,
    data,
    currentLapses
  );

  // 3. 准备更新数据
  const reviewTime = data.review_time || new Date().toISOString();
  const newLapses = data === 'again' ? currentLapses + 1 : currentLapses;

  const updateData = {
    stability: fsrsResult.newStability,
    difficulty: fsrsResult.newDifficulty,
    due: fsrsResult.nextDue.toISOString(),
    lapses: newLapses,
    state: fsrsResult.newState,
    last_review: reviewTime,
  };

  // 4. 更新学习进度
  const { data: updatedProgress, error: updateError } = await (supabase as any)
    .from('user_word_progress')
    .update(updateData)
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .select()
    .single();

  if (updateError) {
    throw new AppError(`更新学习进度失败: ${updateError.message}`, 500);
  }

  return updatedProgress;
}

export async function submitQuizAnswerAndUpdateProgress({
  supabase,
  userId,
  wordId,
  userRating,
}: BaseArgs & { wordId: number; userRating: 'again' | 'hard' | 'good' | 'easy' }) {
  // 1) 读取当前学习进度
  const { data: progress, error: fetchError } = await supabase
    .from('user_word_progress')
    .select('*')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single();

  if (fetchError || !progress) {
    throw createNotFoundError('学习记录');
  }

  // 2) 数据库 -> FSRS Card 映射
  const now = new Date();
  const lastReview: Date | undefined = progress.last_review ? new Date(progress.last_review) : undefined;
  const due: Date = progress.due ? new Date(progress.due) : now;

  const dbState: number = progress.state ?? 0;

  const card: Card = {
    due: new Date(progress.due),
    stability: progress.stability ?? 0,
    difficulty: progress.difficulty ?? 0,
    lapses: progress.lapses ?? 0,
    state: progress.state as State,
    last_review: progress.last_review ? new Date(progress.last_review) : undefined,
    reps: progress.reps ?? 0,
    scheduled_days: progress.scheduled_days ?? 0,
  };

  // 2. Initialize FSRS with custom parameters for better UX
  const f = fsrs({
    learning_steps: ["1d"], // First review after 1 day
  });
  
  // 3. Map user rating string to FSRS Rating enum
  const ur = FSRSRatingSchema.parse(userRating);
  const ratingEnumMap: Record<'again'|'hard'|'good'|'easy', Rating> = {
    again: Rating.Again,
    hard: Rating.Hard,
    good: Rating.Good,
    easy: Rating.Easy,
  };
  const chosenEnum = ratingEnumMap[ur];
  const resultAny: any = f.repeat(card, now);
  const nextCard: any = resultAny[chosenEnum]?.card ?? card;

  // 5) FSRS Card -> 数据库
  const updateData = {
    due: nextCard?.due ? new Date(nextCard.due as any).toISOString() : new Date(now.getTime() + 24*60*60*1000).toISOString(),
    stability: nextCard?.stability ?? null,
    difficulty: nextCard?.difficulty ?? null,
    lapses: typeof nextCard?.lapses === 'number' ? nextCard.lapses : progress.lapses ?? 0,
    state: ((): number => {
      const reverse: Record<number, number> = {
        [State.New]: 0,
        [State.Learning]: 1,
        [State.Review]: 2,
        [State.Relearning]: 3,
      } as any;
      return reverse[nextCard?.state as any] ?? progress.state ?? 0;
    })(),
    last_review: now.toISOString(),
    reps: typeof nextCard?.reps === 'number' ? nextCard.reps : (progress.reps ?? 0) + 1,
    scheduled_days: typeof nextCard?.scheduled_days === 'number' ? nextCard.scheduled_days : progress.scheduled_days ?? 0,
  };

  // 5) 更新数据库
  const { data: updated, error: updError } = await (supabase as any)
    .from('user_word_progress')
    .update(updateData)
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .select()
    .single();

  if (updError) {
    throw new AppError(`更新学习进度失败: ${updError.message}`, 500);
  }

  return updated;
}