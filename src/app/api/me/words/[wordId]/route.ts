import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 从用户学习列表中移除单词
export async function DELETE(
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

    // 删除学习进度记录
    const { error } = await supabase
      .from('user_word_progress')
      .delete()
      .eq('user_id', user.id)
      .eq('word_id', wordIdNum)

    if (error) {
      console.error('移除单词时出错:', error)
      return NextResponse.json(
        { error: '移除单词失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({ success: true })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 移动单词到另一个单词本
export async function PATCH(
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
    const { new_list_id } = body

    // 更新单词本归属
    const { data: updatedProgress, error } = await supabase
      .from('user_word_progress')
      .update({
        word_list_id: new_list_id
      })
      .eq('user_id', user.id)
      .eq('word_id', wordIdNum)
      .select()
      .single()

    if (error) {
      console.error('移动单词时出错:', error)
      return NextResponse.json(
        { error: '移动单词失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      progress: updatedProgress
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}