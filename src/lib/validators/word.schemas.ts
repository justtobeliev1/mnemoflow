import { z } from 'zod';

/**
 * Word相关的Zod验证Schema
 */

/**
 * 收录单词到单词本的验证Schema
 */
export const WordCollectSchema = z.object({
  word_id: z
    .number()
    .int()
    .positive()
    .describe('单词ID，必须是正整数'),
  list_id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('单词本ID，可选，默认使用用户的默认单词本'),
});

/**
 * 移动单词到其他单词本的验证Schema
 */
export const WordMoveSchema = z.object({
  new_list_id: z
    .number()
    .int()
    .positive()
    .describe('新单词本ID，必须是正整数'),
});

/**
 * 单词搜索参数验证Schema
 */
export const WordSearchSchema = z.object({
  term: z
    .string()
    .min(1, '搜索词不能为空')
    .max(100, '搜索词不能超过100个字符')
    .trim()
    .describe('搜索的单词'),
});

/**
 * 搜索历史查询参数验证Schema
 */
export const SearchHistoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 10)
    .pipe(z.number().int().min(1).max(100))
    .describe('返回结果数量限制，默认10，最大100'),
});

/**
 * 单词响应的验证Schema
 */
export const WordResponseSchema = z.object({
  id: z.number().int().positive().describe('单词ID'),
  word: z.string().describe('单词文本'),
  definition: z.any().nullable().describe('词典定义(JSONB)'),
  phonetic: z.string().nullable().describe('音标'),
  tags: z.array(z.string()).nullable().describe('考试标签'),
  created_at: z.string().datetime().describe('创建时间'),
});

/**
 * 用户单词进度响应Schema
 */
export const UserWordProgressSchema = z.object({
  id: z.number().int().positive().describe('进度记录ID'),
  user_id: z.string().uuid().describe('用户ID'),
  word_id: z.number().int().positive().describe('单词ID'),
  word_list_id: z.number().int().positive().nullable().describe('单词本ID'),
  stability: z.number().nullable().describe('FSRS稳定度'),
  difficulty: z.number().nullable().describe('FSRS难度'),
  due: z.string().datetime().describe('下次复习时间'),
  lapses: z.number().int().min(0).describe('遗忘次数'),
  state: z.number().int().min(0).describe('FSRS状态'),
  last_review: z.string().datetime().nullable().describe('上次复习时间'),
  created_at: z.string().datetime().describe('创建时间'),
});

/**
 * 类型导出
 */
export type WordCollectData = z.infer<typeof WordCollectSchema>;
export type WordMoveData = z.infer<typeof WordMoveSchema>;
export type WordSearchData = z.infer<typeof WordSearchSchema>;
export type SearchHistoryQuery = z.infer<typeof SearchHistoryQuerySchema>;
export type WordResponse = z.infer<typeof WordResponseSchema>;
export type UserWordProgress = z.infer<typeof UserWordProgressSchema>;