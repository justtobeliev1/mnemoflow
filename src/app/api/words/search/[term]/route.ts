import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

export async function GET(
  request: NextRequest,
  { params }: { params: { term: string } }
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

    const { term: searchTerm } = params

    // 1. 查询单词基础信息
    const { data: word, error: wordError } = await supabase
      .from('words')
      .select('*')
      .eq('word', searchTerm)
      .single()

    if (wordError || !word) {
      return NextResponse.json(
        { error: '单词未找到' },
        { status: 404 }
      )
    }

    // 2. 查询助记内容
    const { data: mnemonic, error: mnemonicError } = await supabase
      .from('word_mnemonics')
      .select('*')
      .eq('word_id', word.id)
      .single()

    // 3. 记录搜索历史
    await supabase
      .from('user_search_history')
      .upsert({
        user_id: user.id,
        word_id: word.id,
        search_count: 1,
        last_searched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,word_id',
        ignoreDuplicates: false
      })

    // 4. 返回结果
    if (mnemonic && !mnemonicError) {
      // 助记内容存在，立即返回
      return NextResponse.json({
        dictionaryData: word,
        mnemonicData: mnemonic
      })
    } else {
      // 助记内容不存在，返回pending状态并触发异步生成
      // TODO: 这里应该触发异步任务生成助记内容
      return NextResponse.json({
        dictionaryData: word,
        mnemonicStatus: 'pending',
        wordId: word.id
      })
    }

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}