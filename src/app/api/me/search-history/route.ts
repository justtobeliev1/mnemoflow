import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取用户搜索历史
export async function GET(request: NextRequest) {
  try {
    // 从请求头获取授权信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    // 设置Supabase客户端的访问令牌
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const { searchParams } = new URL(request.url)
    const limit = parseInt(searchParams.get('limit') || '10')

    // 获取最近的搜索历史
    const { data: searchHistory, error } = await supabase
      .from('user_search_history')
      .select(`
        *,
        word:words(*)
      `)
      .eq('user_id', user.id)
      .order('last_searched_at', { ascending: false })
      .limit(limit)

    if (error) {
      console.error('获取搜索历史时出错:', error)
      return NextResponse.json(
        { error: '获取搜索历史失败' },
        { status: 500 }
      )
    }

    return NextResponse.json({
      history: searchHistory || []
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 添加搜索记录
export async function POST(request: NextRequest) {
  try {
    // 从请求头获取授权信息
    const authHeader = request.headers.get('authorization')
    if (!authHeader) {
      return NextResponse.json(
        { error: '需要登录' },
        { status: 401 }
      )
    }

    // 设置Supabase客户端的访问令牌
    const token = authHeader.replace('Bearer ', '')
    const { data: { user }, error: authError } = await supabase.auth.getUser(token)

    if (authError || !user) {
      console.error('认证错误:', authError)
      return NextResponse.json(
        { error: '用户认证失败' },
        { status: 401 }
      )
    }

    const body = await request.json()
    const { word_id } = body

    if (!word_id) {
      return NextResponse.json(
        { error: '单词ID不能为空' },
        { status: 400 }
      )
    }

    // 使用upsert更新搜索记录
    const { error } = await supabase
      .from('user_search_history')
      .upsert({
        user_id: user.id,
        word_id: word_id,
        search_count: 1,
        last_searched_at: new Date().toISOString()
      }, {
        onConflict: 'user_id,word_id',
        ignoreDuplicates: false
      })

    if (error) {
      console.error('添加搜索历史时出错:', error)
      return NextResponse.json(
        { error: '添加搜索历史失败' },
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
