import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 收录单词到用户学习列表
export async function POST(request: NextRequest) {
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

    const body = await request.json()
    const { word_id, list_id } = body

    if (!word_id) {
      return NextResponse.json(
        { error: '单词ID不能为空' },
        { status: 400 }
      )
    }

    // 检查单词是否存在
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('id')
      .eq('id', word_id)
      .single()

    if (wordError || !word) {
      return NextResponse.json(
        { error: '单词不存在' },
        { status: 404 }
      )
    }

    // 创建学习进度记录
    const { data: progress, error } = await supabase
      .from('user_word_progress')
      .insert({
        user_id: user.id,
        word_id: word_id,
        word_list_id: list_id,
        stability: null,
        difficulty: null,
        due: new Date().toISOString(),
        lapses: 0,
        state: 0, // 新学习状态
        last_review: null
      })
      .select()
      .single()

    if (error) {
      if (error.code === '23505') { // unique constraint violation
        return NextResponse.json(
          { error: '该单词已在学习列表中' },
          { status: 409 }
        )
      }
      console.error('添加单词到学习列表时出错:', error)
      return NextResponse.json(
        { error: '添加单词失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      progress
    }, { status: 201 })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}