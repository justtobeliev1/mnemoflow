import { z } from 'zod';

/**
 * Profile相关的Zod验证Schema
 */

/**
 * 更新用户资料的验证Schema
 */
export const ProfileUpdateSchema = z.object({
  default_word_list_id: z
    .number()
    .int()
    .positive()
    .optional()
    .describe('默认单词本ID，必须是正整数'),
});

/**
 * 用户资料响应的验证Schema
 */
export const ProfileResponseSchema = z.object({
  id: z.string().uuid().describe('用户UUID'),
  email: z.string().email().nullable().describe('用户邮箱'),
  default_word_list_id: z.number().int().positive().nullable().describe('默认单词本ID'),
  updated_at: z.string().datetime().describe('更新时间'),
});

/**
 * 类型导出
 */
export type ProfileUpdateData = z.infer<typeof ProfileUpdateSchema>;
export type ProfileResponse = z.infer<typeof ProfileResponseSchema>;