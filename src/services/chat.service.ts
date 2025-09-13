import { SupabaseClient } from '@supabase/supabase-js';
import { SendMessage } from '@/lib/validators/chat.schemas';
import { createNotFoundError, AppError } from '@/lib/errors';

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
 * 获取单词的聊天历史
 * 
 * @param args - 包含supabase客户端、用户ID、单词ID和查询参数的参数对象
 * @returns 聊天消息列表
 */
export async function getChatHistoryForWord({
  supabase,
  userId,
  wordId,
  limit = 50,
  before,
}: BaseArgs & { wordId: number; limit?: number; before?: number }) {
  let query = supabase
    .from('chat_messages')
    .select('*')
    .eq('word_id', wordId)
    .eq('user_id', userId)
    .order('created_at', { ascending: false })
    .limit(limit);

  // 如果指定了before参数，用于分页
  if (before) {
    query = query.lt('id', before);
  }

  const { data, error } = await query;

  if (error) {
    throw new AppError(`获取聊天历史失败: ${error.message}`, 500);
  }

  // 返回时按时间正序排列（最早的消息在前）
  return (data || []).reverse();
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

/**
 * 获取用户的聊天会话列表
 * 
 * @param args - 包含supabase客户端和用户ID的参数对象
 * @returns 聊天会话列表
 */
export async function getChatSessionsForUser({
  supabase,
  userId,
  limit = 20,
}: BaseArgs & { limit?: number }) {
  const { data, error } = await supabase
    .from('chat_messages')
    .select(`
      word_id,
      created_at,
      words:word_id (
        id,
        word,
        definition,
        phonetic
      )
    `)
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw new AppError(`获取聊天会话失败: ${error.message}`, 500);
  }

  // 按单词分组，获取每个单词的最新消息时间和消息数量
  const sessionMap = new Map();
  
  (data || []).forEach((message: any) => {
    const wordId = message.word_id;
    if (!sessionMap.has(wordId)) {
      sessionMap.set(wordId, {
        word_id: wordId,
        word: message.words,
        message_count: 0,
        last_message_at: message.created_at,
      });
    }
    
    const session = sessionMap.get(wordId);
    session.message_count++;
    
    // 更新最新消息时间
    if (session.last_message_at < message.created_at) {
      session.last_message_at = message.created_at;
    }
  });

  // 转换为数组并按最后消息时间排序
  const sessions = Array.from(sessionMap.values())
    .sort((a, b) => new Date(b.last_message_at).getTime() - new Date(a.last_message_at).getTime())
    .slice(0, limit);

  return sessions;
}