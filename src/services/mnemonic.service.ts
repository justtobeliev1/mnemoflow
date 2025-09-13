import { SupabaseClient } from '@supabase/supabase-js';
import { MnemonicGenerateRequest, MnemonicType, MnemonicStatus } from '@/lib/validators/mnemonic.schemas';
import { createNotFoundError, AppError } from '@/lib/errors';

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
  userContext?: string
): Promise<string> {
  // 模拟异步AI生成过程
  await new Promise(resolve => setTimeout(resolve, 2000 + Math.random() * 3000));
  
  const templates = {
    story: `记忆小故事：想象一个关于"${word}"的生动故事...`,
    association: `联想记忆：将"${word}"与你熟悉的事物联系起来...`,
    visual: `视觉记忆：在脑海中构建"${word}"的视觉画面...`,
    phonetic: `语音记忆：利用"${word}"的发音特点来记忆...`,
  };
  
  let content = templates[type];
  
  if (userContext) {
    content += `\n\n结合您的背景：${userContext}`;
  }
  
  return content;
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
    .from('mnemonics')
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
    .eq('user_id', userId)
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
    .from('mnemonics')
    .insert({
      word_id: data.word_id,
      user_id: userId,
      type: data.type,
      status: 'generating',
      user_context: data.user_context || null,
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

  // 4. 异步生成助记内容（不阻塞响应）
  Promise.resolve().then(async () => {
    try {
      const startTime = Date.now();
      
      const content = await generateMnemonicContent(
        word.word,
        word.definition,
        data.type,
        data.user_context
      );
      
      const generationTime = Date.now() - startTime;
      
      // 更新助记内容
      await (supabase as any)
        .from('mnemonics')
        .update({
          content,
          status: 'completed',
          generation_time: generationTime,
        })
        .eq('id', newMnemonic.id);
        
    } catch (error) {
      // 生成失败时更新状态
      console.error('助记内容生成失败:', error);
      await (supabase as any)
        .from('mnemonics')
        .update({ status: 'failed' })
        .eq('id', newMnemonic.id);
    }
  });

  return newMnemonic;
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

  // 3. 更新状态为生成中
  const { error: updateError } = await (supabase as any)
    .from('mnemonics')
    .update({
      status: 'generating',
      type: type || existingMnemonic.type,
      user_context: userContext !== undefined ? userContext : existingMnemonic.user_context,
      content: null, // 清空旧内容
    })
    .eq('id', existingMnemonic.id);

  if (updateError) {
    throw new AppError(`更新助记内容状态失败: ${updateError.message}`, 500);
  }

  // 4. 异步重新生成内容
  Promise.resolve().then(async () => {
    try {
      const startTime = Date.now();
      
      const content = await generateMnemonicContent(
        word.word,
        word.definition,
        type || existingMnemonic.type,
        userContext !== undefined ? userContext : existingMnemonic.user_context
      );
      
      const generationTime = Date.now() - startTime;
      
      await (supabase as any)
        .from('mnemonics')
        .update({
          content,
          status: 'completed',
          generation_time: generationTime,
        })
        .eq('id', existingMnemonic.id);
        
    } catch (error) {
      console.error('助记内容重新生成失败:', error);
      await (supabase as any)
        .from('mnemonics')
        .update({ status: 'failed' })
        .eq('id', existingMnemonic.id);
    }
  });

  // 5. 返回更新后的记录
  return await getMnemonicForWord({ supabase, userId, wordId });
}