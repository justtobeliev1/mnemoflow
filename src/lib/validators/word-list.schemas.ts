import { z } from 'zod';

/**
 * Word List相关的Zod验证Schema
 */

/**
 * 创建单词本的验证Schema
 */
export const WordListCreateSchema = z.object({
  name: z
    .string()
    .min(1, '单词本名称不能为空')
    .max(100, '单词本名称不能超过100个字符')
    .trim()
    .describe('单词本名称'),
});

/**
 * 更新单词本的验证Schema
 */
export const WordListUpdateSchema = z.object({
  name: z
    .string()
    .min(1, '单词本名称不能为空')
    .max(100, '单词本名称不能超过100个字符')
    .trim()
    .describe('单词本名称'),
});

/**
 * 单词本响应的验证Schema
 */
export const WordListResponseSchema = z.object({
  id: z.number().int().positive().describe('单词本ID'),
  user_id: z.string().uuid().describe('用户UUID'),
  name: z.string().describe('单词本名称'),
  created_at: z.string().datetime().describe('创建时间'),
});

/**
 * 带单词数量的单词本响应Schema
 */
export const WordListWithCountSchema = WordListResponseSchema.extend({
  word_count: z.number().int().min(0).describe('单词数量'),
});

/**
 * 类型导出
 */
export type WordListCreateData = z.infer<typeof WordListCreateSchema>;
export type WordListUpdateData = z.infer<typeof WordListUpdateSchema>;
export type WordListResponse = z.infer<typeof WordListResponseSchema>;
export type WordListWithCount = z.infer<typeof WordListWithCountSchema>;