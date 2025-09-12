import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 更新用户单词学习进度
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
    const { word_id, new_fsrs_state } = body

    if (word_id !== wordIdNum) {
      return NextResponse.json(
        { error: '路径参数与请求体中的单词ID不匹配' },
        { status: 400 }
      )
    }

    if (!new_fsrs_state) {
      return NextResponse.json(
        { error: '新的FSRS状态不能为空' },
        { status: 400 }
      )
    }

    const {
      stability,
      difficulty,
      due,
      lapses,
      state,
      last_review
    } = new_fsrs_state

    // 更新学习进度
    const { data: updatedProgress, error } = await supabase
      .from('user_word_progress')
      .update({
        stability,
        difficulty,
        due: new Date(due).toISOString(),
        lapses,
        state,
        last_review: last_review ? new Date(last_review).toISOString() : null
      })
      .eq('user_id', user.id)
      .eq('word_id', wordIdNum)
      .select()
      .single()

    if (error) {
      console.error('更新学习进度时出错:', error)
      return NextResponse.json(
        { error: '更新学习进度失败' },
        { status: 500 }
      )
    }

    if (!updatedProgress) {
      return NextResponse.json(
        { error: '未找到该单词的学习记录' },
        { status: 404 }
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