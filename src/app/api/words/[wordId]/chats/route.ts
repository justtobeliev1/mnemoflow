import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取单词的AI聊天历史
export async function GET(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const { wordId } = params
    const wordIdNum = parseInt(wordId)

    if (isNaN(wordIdNum)) {
      return NextResponse.json(
        { error: '无效的单词ID' },
        { status: 400 }
      )
    }

    // 获取聊天历史
    const { data: chatHistory, error } = await supabase
      .from('word_chat_history')
      .select('*')
      .eq('user_id', user.id)
      .eq('word_id', wordIdNum)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('获取聊天历史时出错:', error)
      return NextResponse.json(
        { error: '获取聊天历史失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      chatHistory: chatHistory || null
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 向AI助手发送新消息
export async function POST(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    const token = authHeader.replace('Bearer ', '')
    const supabase = createServerSupabaseClient(token)
    const { data: { user }, error: authError } = await supabase.auth.getUser()

    if (authError || !user) {
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const { wordId } = params
    const wordIdNum = parseInt(wordId)

    if (isNaN(wordIdNum)) {
      return NextResponse.json(
        { error: '无效的单词ID' },
        { status: 400 }
      )
    }

    const body = await request.json()
    const { message } = body

    if (!message || message.trim().length === 0) {
      return NextResponse.json(
        { error: '消息内容不能为空' },
        { status: 400 }
      )
    }

    // 检查单词是否存在
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('id, word')
      .eq('id', wordIdNum)
      .single()

    if (wordError || !word) {
      return NextResponse.json(
        { error: '单词不存在' },
        { status: 404 }
      )
    }

    // 获取现有聊天历史
    const { data: existingChat } = await supabase
      .from('word_chat_history')
      .select('conversation_log')
      .eq('user_id', user.id)
      .eq('word_id', wordIdNum)
      .single()

    // TODO: 这里应该调用AI服务获取回复
    const aiResponse = `关于单词 "${word.word}" 的回复：这是一个模拟的AI回复。`

    // 构建新的对话日志
    const existingLog = existingChat?.conversation_log || []
    const newConversationLog = [
      ...existingLog,
      {
        role: 'user',
        content: message.trim(),
        timestamp: new Date().toISOString()
      },
      {
        role: 'assistant',
        content: aiResponse,
        timestamp: new Date().toISOString()
      }
    ]

    // 更新或创建聊天记录
    const { data: updatedChat, error } = await supabase
      .from('word_chat_history')
      .upsert({
        user_id: user.id,
        word_id: wordIdNum,
        conversation_log: newConversationLog
      }, {
        onConflict: 'user_id,word_id'
      })
      .select()
      .single()

    if (error) {
      console.error('更新聊天记录时出错:', error)
      return NextResponse.json(
        { error: '发送消息失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      chatHistory: updatedChat,
      aiResponse
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}