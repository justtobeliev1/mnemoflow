import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取助记内容
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

    // 查询助记内容
    const { data: mnemonic, error } = await supabase
      .from('word_mnemonics')
      .select('*')
      .eq('word_id', wordIdNum)
      .single()

    if (error || !mnemonic) {
      // 助记内容还在生成中或不存在
      return NextResponse.json({
        status: 'loading'
      })
    }

    return NextResponse.json(mnemonic)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 重新生成助记内容
export async function PUT(
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
    const { prompt } = body

    // TODO: 这里应该调用LLM重新生成助记内容
    // 目前先返回一个模拟的响应
    const mockMnemonicContent = {
      blueprint: "重新生成的助记蓝图",
      scene_segments: [
        {
          segment: "场景片段1",
          description: "详细描述1"
        }
      ]
    }

    // 更新或插入助记内容
    const { data: mnemonic, error } = await supabase
      .from('word_mnemonics')
      .upsert({
        word_id: wordIdNum,
        content: mockMnemonicContent,
        version: 1,
        created_by: user.id
      }, {
        onConflict: 'word_id'
      })
      .select()
      .single()

    if (error) {
      console.error('更新助记内容时出错:', error)
      return NextResponse.json(
        { error: '更新助记内容失败' },
        { status: 500 }
      )
    }

    return NextResponse.json(mnemonic)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}