import { SupabaseClient } from '@supabase/supabase-js';
import { MnemonicGenerateRequest, MnemonicType } from '@/lib/validators/mnemonic.schemas';
import { createNotFoundError, AppError } from '@/lib/errors';
import { generateMnemonicViaOpenAI } from '@/lib/ai/openai-proxy';

/**
 * Mnemonic Service - 函数式实现
 * 管理AI助记内容生成相关操作
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
 * 模拟AI助记内容生成（实际项目中会调用真实的AI API）
 */
async function generateMnemonicContent(
  word: string,
  definition: any,
  type: MnemonicType,
  userContext?: string,
  action: 'initial' | 'regenerate' | 'refine' = 'initial',
  previous?: any,
): Promise<string> {
  // 使用 OpenAI 兼容中转站；内部已带指数退避重试
  return await generateMnemonicViaOpenAI(word, definition, type, userContext, undefined, action, previous);
}

/**
 * 获取单词的助记内容
 * 
 * @param args - 包含supabase客户端、用户ID和单词ID的参数对象
 * @returns 助记内容记录或null
 */
export async function getMnemonicForWord({
  supabase,
  userId,
  wordId,
}: BaseArgs & { wordId: number }) {
  const { data, error } = await supabase
    .from('word_mnemonics')
    .select(`
      *,
      words:word_id (
        id,
        word,
        definition,
        phonetic
      )
    `)
    .eq('word_id', wordId)
    .order('version', { ascending: false })
    .limit(1)
    .single();

  if (error) {
    if (error.code === 'PGRST116') {
      return null; // 助记内容不存在
    }
    throw new AppError(`获取助记内容失败: ${error.message}`, 500);
  }

  return data;
}

/**
 * 创建助记内容生成任务
 * 
 * @param args - 包含supabase客户端、用户ID和生成请求的参数对象
 * @returns 创建的助记内容记录
 */
export async function createMnemonicForWord({
  supabase,
  userId,
  data,
}: BaseArgs & { data: MnemonicGenerateRequest }) {
  // 1. 验证单词是否存在
  const { data: word, error: wordError } = await supabase
    .from('words')
    .select('*')
    .eq('id', data.word_id)
    .single();

  if (wordError || !word) {
    throw createNotFoundError('单词');
  }

  // 2. 检查是否已有助记内容
  const existingMnemonic = await getMnemonicForWord({
    supabase,
    userId,
    wordId: data.word_id,
  });

  if (existingMnemonic) {
    // 如果已存在，返回现有记录
    return existingMnemonic;
  }

  // 3. 创建新的助记内容记录（初始状态为生成中）
  const { data: newMnemonic, error: createError } = await (supabase as any)
    .from('word_mnemonics')
    .insert({
      word_id: data.word_id,
      content: { status: 'generating' },
      version: 1,
      created_by: userId,
    })
    .select(`
      *,
      words:word_id (
        id,
        word,
        definition,
        phonetic
      )
    `)
    .single();

  if (createError) {
    throw new AppError(`创建助记内容任务失败: ${createError.message}`, 500);
  }

  // 4. 同步生成助记内容（直接写入 content）
  try {
    const contentText = await generateMnemonicContent(
      word.word,
      word.definition,
      data.type,
      data.user_context,
      'initial'
    );

    let contentJson: any = null;
    try {
      const match = contentText.match(/```json[\s\S]*?```/i);
      const raw = match ? match[0].replace(/```json|```/g, '').trim() : contentText;
      contentJson = JSON.parse(raw);
    } catch {
      contentJson = { raw: contentText };
    }

    await (supabase as any)
      .from('word_mnemonics')
      .update({ content: contentJson })
      .eq('id', newMnemonic.id);
  } catch (error) {
    await (supabase as any)
      .from('word_mnemonics')
      .update({ content: { error: String(error) } })
      .eq('id', newMnemonic.id);
  }

  return await getMnemonicForWord({ supabase, userId, wordId: data.word_id });
}

/**
 * 重新生成助记内容
 * 
 * @param args - 包含supabase客户端、用户ID和单词ID的参数对象
 * @returns 更新后的助记内容记录
 */
export async function regenerateMnemonicForWord({
  supabase,
  userId,
  wordId,
  type,
  userContext,
}: BaseArgs & { wordId: number; type?: MnemonicType; userContext?: string }) {
  // 1. 获取现有助记内容记录
  const existingMnemonic = await getMnemonicForWord({
    supabase,
    userId,
    wordId,
  });

  if (!existingMnemonic) {
    throw createNotFoundError('助记内容');
  }

  // 2. 获取单词信息
  const { data: word, error: wordError } = await supabase
    .from('words')
    .select('*')
    .eq('id', wordId)
    .single();

  if (wordError || !word) {
    throw createNotFoundError('单词');
  }

  // 3. 新建一个版本（version + 1），状态为生成中
  const nextVersion = (existingMnemonic?.version || 1) + 1;
  const { data: newRow, error: insertErr } = await (supabase as any)
    .from('word_mnemonics')
    .insert({
      word_id: wordId,
      content: { status: 'generating' },
      version: nextVersion,
      created_by: userId,
    })
    .select('*')
    .single();

  if (insertErr || !newRow) {
    throw new AppError(`创建新版本失败: ${insertErr?.message || 'unknown'}`, 500);
  }

  // 4. 异步重新生成内容
  Promise.resolve().then(async () => {
    try {
      const contentText = await generateMnemonicContent(
        word.word,
        word.definition,
        type || 'story',
        userContext,
        userContext ? 'refine' : 'regenerate',
        existingMnemonic?.content || null
      );

      let contentJson: any = null;
      try {
        const match = contentText.match(/```json[\s\S]*?```/i);
        const raw = match ? match[0].replace(/```json|```/g, '').trim() : contentText;
        contentJson = JSON.parse(raw);
      } catch {
        contentJson = { raw: contentText };
      }

      await (supabase as any)
        .from('word_mnemonics')
        .update({ content: contentJson })
        .eq('id', newRow.id);
        
    } catch (error) {
      // 失败不再打印冗长日志，仅存入表中
      await (supabase as any)
        .from('word_mnemonics')
        .update({ content: { error: String(error) } })
        .eq('id', newRow.id);
    }
  });

  // 5. 返回更新后的记录
  return await getMnemonicForWord({ supabase, userId, wordId });
}