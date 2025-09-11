import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url)
    const query = searchParams.get('q')
    const limit = parseInt(searchParams.get('limit') || '10')

    if (!query) {
      return NextResponse.json(
        { error: '查询参数不能为空' },
        { status: 400 }
      )
    }

    // 搜索单词（支持模糊匹配）
    const { data: words, error } = await supabase
      .from('words')
      .select('*')
      .or(`word.ilike.%${query}%,translation.ilike.%${query}%`)
      .order('word')
      .limit(limit)

    if (error) {
      console.error('搜索单词时出错:', error)
      return NextResponse.json(
        { error: '搜索失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      words: words || [],
      total: words?.length || 0
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
