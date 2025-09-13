import { SupabaseClient } from '@supabase/supabase-js';
import { SendMessage } from '@/lib/validators/chat.schemas';
import { createNotFoundError, AppError } from '@/lib/errors';
import { ChatSession } from '@/lib/validators/chat.schemas';

/**
 * Chat Service - 函数式实现
 * 管理AI聊天功能相关操作
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
 * 模拟AI聊天响应（实际项目中会调用真实的AI API）
 */
async function generateAIResponse(
  userMessage: string,
  wordInfo: any,
  context?: string
): Promise<string> {
  // 模拟AI响应延迟
  await new Promise(resolve => setTimeout(resolve, 1000 + Math.random() * 2000));
  
  const responses = [
    `关于单词"${wordInfo.word}"，我来为您详细解释一下...`,
    `这是一个很好的问题！让我们从"${wordInfo.word}"的词源开始说起...`,
    `我理解您对"${wordInfo.word}"的疑惑，让我用一个例子来说明...`,
    `"${wordInfo.word}"这个词在不同语境中有不同的用法，让我们来看看...`,
  ];
  
  let response = responses[Math.floor(Math.random() * responses.length)];
  
  if (context) {
    response += `\n\n结合您提到的：${context}`;
  }
  
  return response;
}

/**
 * 获取指定单词的聊天历史记录
 * @param args 包含supabase客户端、用户ID和单词ID的参数对象
 * @returns 聊天历史消息列表
 */
export async function getChatHistoryForWord({
  supabase,
  userId,
  wordId,
}: BaseArgs & { wordId: number }) {
  const { data, error } = await supabase
    .from('word_chat_history')
    .select('conversation_log')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 = no rows found
    console.error('Get chat history error:', error);
    throw new AppError('Failed to retrieve chat history', 500);
  }

  return data;
}

/**
 * 获取指定单词的所有聊天会话
 * @param args 包含supabase客户端和用户ID的参数对象
 * @returns 聊天会话列表
 */
export async function getChatSessions({
  supabase,
  userId,
}: BaseArgs): Promise<ChatSession[]> {
  const { data: chatHistory, error } = await supabase
    .from('word_chat_history')
    .select(`
      word_id,
      updated_at,
      words (
        word
      )
    `)
    .eq('user_id', userId)
    .order('updated_at', { ascending: false });

  if (error) {
    throw new AppError(`获取聊天会话失败: ${error.message}`, 500);
  }

  // The type from Supabase might be different, so we map it to our ChatSession type
  const sessions: ChatSession[] = (chatHistory as any[])?.map(item => ({
    word_id: item.word_id,
    word: item.words.word,
    updated_at: item.updated_at,
  })) || [];

  return sessions;
}

/**
 * 发送消息并获取AI响应
 * 
 * @param args - 包含supabase客户端、用户ID、单词ID和消息数据的参数对象
 * @returns 用户消息和AI响应消息
 */
export async function sendMessageForWord({
  supabase,
  userId,
  wordId,
  data,
}: BaseArgs & { wordId: number; data: SendMessage }) {
  // 1. 验证单词是否存在
  const { data: word, error: wordError } = await supabase
    .from('words')
    .select('*')
    .eq('id', wordId)
    .single();

  if (wordError || !word) {
    throw createNotFoundError('单词');
  }

  // 2. 保存用户消息
  const { data: userMessage, error: userMessageError } = await (supabase as any)
    .from('chat_messages')
    .insert({
      word_id: wordId,
      user_id: userId,
      role: 'user',
      content: data.content,
      context: data.context || null,
    })
    .select()
    .single();

  if (userMessageError) {
    throw new AppError(`保存用户消息失败: ${userMessageError.message}`, 500);
  }

  // 3. 生成AI响应
  let aiMessage = null;
  try {
    const startTime = Date.now();
    
    const aiResponse = await generateAIResponse(
      data.content,
      word,
      data.context
    );
    
    const responseTime = Date.now() - startTime;

    // 4. 保存AI响应消息
    const { data: aiMessageData, error: aiMessageError } = await (supabase as any)
      .from('chat_messages')
      .insert({
        word_id: wordId,
        user_id: userId,
        role: 'assistant',
        content: aiResponse,
        response_time: responseTime,
      })
      .select()
      .single();

    if (aiMessageError) {
      console.error('保存AI响应失败:', aiMessageError);
      // AI响应保存失败不应该影响用户消息的保存
    } else {
      aiMessage = aiMessageData;
    }
  } catch (error) {
    console.error('生成AI响应失败:', error);
    
    // 保存错误响应
    const { data: errorMessage } = await (supabase as any)
      .from('chat_messages')
      .insert({
        word_id: wordId,
        user_id: userId,
        role: 'assistant',
        content: '抱歉，我现在暂时无法回应您的问题。请稍后再试。',
      })
      .select()
      .single();
    
    aiMessage = errorMessage;
  }

  return {
    userMessage,
    aiMessage,
  };
}

export async function saveChatHistory({
  supabase,
  userId,
  wordId,
  messages,
}: BaseArgs & { wordId: number; messages: { role: 'user' | 'assistant', content: string }[] }) {
  // 1) 先查是否存在
  const { data: existing, error: findError } = await supabase
    .from('word_chat_history')
    .select('id')
    .eq('user_id', userId)
    .eq('word_id', wordId)
    .maybeSingle();

  if (findError) {
    console.error('Find chat history error:', findError);
    throw new AppError('Failed to query chat history', 500);
  }

  if (existing?.id) {
    // 2) 存在则更新
    const { data: updated, error: updError } = await (supabase as any)
      .from('word_chat_history')
      .update({ conversation_log: messages, updated_at: new Date().toISOString() })
      .eq('id', existing.id)
      .select()
      .single();

    if (updError) {
      console.error('Update chat history error:', updError);
      throw new AppError('Failed to update chat history', 500);
    }
    return updated;
  } else {
    // 3) 不存在则插入
    const { data: inserted, error: insError } = await (supabase as any)
      .from('word_chat_history')
      .insert({ user_id: userId, word_id: wordId, conversation_log: messages, updated_at: new Date().toISOString() })
      .select()
      .single();

    if (insError) {
      console.error('Insert chat history error:', insError);
      throw new AppError('Failed to insert chat history', 500);
    }
    return inserted;
  }
}