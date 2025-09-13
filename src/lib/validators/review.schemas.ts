import { z } from 'zod';

/**
 * Review相关的Zod验证Schema
 */

/**
 * FSRS复习结果枚举
 */
export const FSRSRatingSchema = z.enum(['again', 'hard', 'good', 'easy']);

/**
 * 复习进度更新的验证Schema
 */
export const ReviewProgressUpdateSchema = z.object({
  rating: FSRSRatingSchema.describe('复习结果评级'),
  review_time: z
    .string()
    .datetime()
    .optional()
    .describe('复习时间，可选，默认使用当前时间'),
});

/**
 * 复习队列查询参数验证Schema
 */
export const ReviewQueueQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 20)
    .pipe(z.number().int().min(1).max(100))
    .describe('返回结果数量限制，默认20，最大100'),
  due_before: z
    .string()
    .datetime()
    .optional()
    .describe('只返回指定时间之前到期的单词'),
});

/**
 * 复习统计响应Schema
 */
export const ReviewStatsResponseSchema = z.object({
  total_words: z.number().int().min(0).describe('总单词数'),
  new_words: z.number().int().min(0).describe('新单词数'),
  learning_words: z.number().int().min(0).describe('学习中单词数'),
  review_words: z.number().int().min(0).describe('复习单词数'),
  due_today: z.number().int().min(0).describe('今日到期单词数'),
});

/**
 * 复习队列项响应Schema
 */
export const ReviewQueueItemSchema = z.object({
  id: z.number().int().positive().describe('进度记录ID'),
  word_id: z.number().int().positive().describe('单词ID'),
  word_list_id: z.number().int().positive().nullable().describe('单词本ID'),
  stability: z.number().nullable().describe('FSRS稳定度'),
  difficulty: z.number().nullable().describe('FSRS难度'),
  due: z.string().datetime().describe('到期时间'),
  lapses: z.number().int().min(0).describe('遗忘次数'),
  state: z.number().int().min(0).describe('FSRS状态'),
  last_review: z.string().datetime().nullable().describe('上次复习时间'),
  word: z.object({
    id: z.number().int().positive().describe('单词ID'),
    word: z.string().describe('单词文本'),
    definition: z.any().nullable().describe('词典定义'),
    phonetic: z.string().nullable().describe('音标'),
    tags: z.array(z.string()).nullable().describe('考试标签'),
  }).describe('单词信息'),
});

/**
 * 类型导出
 */
export type FSRSRating = z.infer<typeof FSRSRatingSchema>;
export type ReviewProgressUpdate = z.infer<typeof ReviewProgressUpdateSchema>;
export type ReviewQueueQuery = z.infer<typeof ReviewQueueQuerySchema>;
export type ReviewStatsResponse = z.infer<typeof ReviewStatsResponseSchema>;
export type ReviewQueueItem = z.infer<typeof ReviewQueueItemSchema>;