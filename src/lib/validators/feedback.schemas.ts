import { z } from 'zod';

/**
 * Feedback相关的Zod验证Schema
 */

/**
 * 反馈类型枚举
 */
export const FeedbackTypeSchema = z.enum(['bug', 'feature', 'improvement', 'other']);

/**
 * 反馈优先级枚举
 */
export const FeedbackPrioritySchema = z.enum(['low', 'medium', 'high', 'urgent']);

/**
 * 创建反馈的验证Schema
 */
export const CreateFeedbackSchema = z.object({
  type: FeedbackTypeSchema.describe('反馈类型'),
  title: z
    .string()
    .min(5, '标题至少需要5个字符')
    .max(200, '标题不能超过200个字符')
    .trim()
    .describe('反馈标题'),
  content: z
    .string()
    .min(10, '内容至少需要10个字符')
    .max(2000, '内容不能超过2000个字符')
    .trim()
    .describe('反馈详细内容'),
  priority: FeedbackPrioritySchema
    .optional()
    .default('medium')
    .describe('优先级，默认为medium'),
  contact_email: z
    .string()
    .email('请提供有效的邮箱地址')
    .optional()
    .describe('联系邮箱，可选'),
  user_agent: z
    .string()
    .optional()
    .describe('用户代理信息，可选'),
  url: z
    .string()
    .url('请提供有效的URL')
    .optional()
    .describe('问题发生的页面URL，可选'),
});

/**
 * 反馈响应Schema
 */
export const FeedbackResponseSchema = z.object({
  id: z.string().uuid().describe('反馈ID'),
  type: FeedbackTypeSchema.describe('反馈类型'),
  title: z.string().describe('反馈标题'),
  content: z.string().describe('反馈内容'),
  priority: FeedbackPrioritySchema.describe('优先级'),
  status: z.enum(['open', 'in_progress', 'resolved', 'closed']).describe('处理状态'),
  contact_email: z.string().nullable().describe('联系邮箱'),
  user_agent: z.string().nullable().describe('用户代理'),
  url: z.string().nullable().describe('问题页面URL'),
  user_id: z.string().uuid().describe('用户ID'),
  created_at: z.string().datetime().describe('创建时间'),
  updated_at: z.string().datetime().describe('更新时间'),
});

/**
 * 类型导出
 */
export type FeedbackType = z.infer<typeof FeedbackTypeSchema>;
export type FeedbackPriority = z.infer<typeof FeedbackPrioritySchema>;
export type CreateFeedbackData = z.infer<typeof CreateFeedbackSchema>;
export type FeedbackResponse = z.infer<typeof FeedbackResponseSchema>;