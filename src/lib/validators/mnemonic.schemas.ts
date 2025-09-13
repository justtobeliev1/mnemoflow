import { z } from 'zod';

/**
 * Mnemonic相关的Zod验证Schema
 */

/**
 * 助记内容类型枚举
 */
export const MnemonicTypeSchema = z.enum(['story', 'association', 'visual', 'phonetic']);

/**
 * 助记内容状态枚举
 */
export const MnemonicStatusSchema = z.enum(['generating', 'completed', 'failed']);

/**
 * 助记内容生成请求Schema
 */
export const MnemonicGenerateRequestSchema = z.object({
  word_id: z
    .number()
    .int()
    .positive()
    .describe('单词ID，必须是正整数'),
  type: MnemonicTypeSchema
    .optional()
    .default('story')
    .describe('助记类型，默认为story'),
  user_context: z
    .string()
    .max(1000, '用户上下文不能超过1000个字符')
    .optional()
    .describe('用户提供的上下文信息，可选'),
});

/**
 * 助记内容响应Schema
 */
export const MnemonicResponseSchema = z.object({
  id: z.number().int().positive().describe('助记内容ID'),
  word_id: z.number().int().positive().describe('单词ID'),
  user_id: z.string().uuid().describe('用户ID'),
  type: MnemonicTypeSchema.describe('助记类型'),
  content: z.string().nullable().describe('助记内容'),
  status: MnemonicStatusSchema.describe('生成状态'),
  generation_time: z.number().nullable().describe('生成耗时（毫秒）'),
  user_context: z.string().nullable().describe('用户上下文'),
  created_at: z.string().datetime().describe('创建时间'),
  updated_at: z.string().datetime().describe('更新时间'),
  word: z.object({
    id: z.number().int().positive().describe('单词ID'),
    word: z.string().describe('单词文本'),
    definition: z.any().nullable().describe('词典定义'),
    phonetic: z.string().nullable().describe('音标'),
  }).optional().describe('单词信息'),
});

/**
 * 助记内容更新Schema
 */
export const MnemonicUpdateSchema = z.object({
  content: z
    .string()
    .min(1, '助记内容不能为空')
    .max(2000, '助记内容不能超过2000个字符')
    .describe('更新的助记内容'),
  status: MnemonicStatusSchema
    .optional()
    .describe('更新的状态'),
});

/**
 * 轮询查询参数Schema
 */
export const MnemonicPollQuerySchema = z.object({
  timeout: z
    .string()
    .optional()
    .transform((val) => val ? parseInt(val, 10) : 30000)
    .pipe(z.number().int().min(1000).max(60000))
    .describe('轮询超时时间，默认30秒，最大60秒'),
});

/**
 * 类型导出
 */
export type MnemonicType = z.infer<typeof MnemonicTypeSchema>;
export type MnemonicStatus = z.infer<typeof MnemonicStatusSchema>;
export type MnemonicGenerateRequest = z.infer<typeof MnemonicGenerateRequestSchema>;
export type MnemonicResponse = z.infer<typeof MnemonicResponseSchema>;
export type MnemonicUpdate = z.infer<typeof MnemonicUpdateSchema>;
export type MnemonicPollQuery = z.infer<typeof MnemonicPollQuerySchema>;