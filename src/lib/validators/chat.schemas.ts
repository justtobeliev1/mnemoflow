import { z } from 'zod';

/**
 * Chat相关的Zod验证Schema
 */

/**
 * 消息角色枚举
 */
export const MessageRoleSchema = z.enum(['user', 'assistant']);

/**
 * 发送消息的验证Schema
 */
export const SendMessageSchema = z.object({
  content: z
    .string()
    .min(1, '消息内容不能为空')
    .max(2000, '消息内容不能超过2000个字符')
    .trim()
    .describe('消息内容'),
  context: z
    .string()
    .max(1000, '上下文信息不能超过1000个字符')
    .optional()
    .describe('额外的上下文信息，可选'),
});

/**
 * 聊天消息响应Schema
 */
export const ChatMessageResponseSchema = z.object({
  id: z.number().int().positive().describe('消息ID'),
  word_id: z.number().int().positive().describe('单词ID'),
  user_id: z.string().uuid().describe('用户ID'),
  role: MessageRoleSchema.describe('消息角色'),
  content: z.string().describe('消息内容'),
  context: z.string().nullable().describe('上下文信息'),
  response_time: z.number().nullable().describe('AI响应时间（毫秒）'),
  created_at: z.string().datetime().describe('创建时间'),
});

/**
 * 聊天历史查询参数Schema
 */
export const ChatHistoryQuerySchema = z.object({
  limit: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 50)
    .pipe(z.number().int().min(1).max(200))
    .describe('返回结果数量限制，默认50，最大200'),
  before: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : undefined)
    .pipe(z.number().int().positive().optional())
    .describe('返回指定消息ID之前的消息，用于分页'),
});

/**
 * 聊天会话信息Schema
 */
export const ChatSessionSchema = z.object({
  word_id: z.number().int().positive().describe('单词ID'),
  word: z.object({
    id: z.number().int().positive().describe('单词ID'),
    word: z.string().describe('单词文本'),
    definition: z.any().nullable().describe('词典定义'),
    phonetic: z.string().nullable().describe('音标'),
  }).describe('单词信息'),
  message_count: z.number().int().min(0).describe('消息总数'),
  last_message_at: z.string().datetime().nullable().describe('最后消息时间'),
});

/**
 * 类型导出
 */
export type MessageRole = z.infer<typeof MessageRoleSchema>;
export type SendMessage = z.infer<typeof SendMessageSchema>;
export type ChatMessageResponse = z.infer<typeof ChatMessageResponseSchema>;
export type ChatHistoryQuery = z.infer<typeof ChatHistoryQuerySchema>;
export type ChatSession = z.infer<typeof ChatSessionSchema>;