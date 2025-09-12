import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 提交助记内容反馈
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
    const { word_mnemonic_id, rating } = body

    if (!word_mnemonic_id || rating === undefined) {
      return NextResponse.json(
        { error: '助记内容ID和评分不能为空' },
        { status: 400 }
      )
    }

    if (![1, -1].includes(rating)) {
      return NextResponse.json(
        { error: '评分必须是1（有用）或-1（无用）' },
        { status: 400 }
      )
    }

    // 检查助记内容是否存在
    const { data: mnemonic, error: mnemonicError } = await supabase
      .from('word_mnemonics')
      .select('id')
      .eq('id', word_mnemonic_id)
      .single()

    if (mnemonicError || !mnemonic) {
      return NextResponse.json(
        { error: '助记内容不存在' },
        { status: 404 }
      )
    }

    // 提交反馈（使用upsert处理重复反馈）
    const { data: feedback, error } = await supabase
      .from('mnemonic_feedback')
      .upsert({
        user_id: user.id,
        word_mnemonic_id,
        rating
      }, {
        onConflict: 'user_id,word_mnemonic_id'
      })
      .select()
      .single()

    if (error) {
      console.error('提交反馈时出错:', error)
      return NextResponse.json(
        { error: '提交反馈失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      feedback
    }, { status: 201 })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}