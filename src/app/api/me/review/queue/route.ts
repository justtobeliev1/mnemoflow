import { NextRequest, NextResponse } from 'next/server'
import { supabase } from '@/lib/supabase'

// 获取用户的复习队列
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
    const type = searchParams.get('type') || 'review' // review | learn
    const limit = parseInt(searchParams.get('limit') || '20')

    let query = supabase
      .from('user_word_progress')
      .select(`
        *,
        word:words(*),
        word_list:word_lists(*)
      `)
      .eq('user_id', user.id)
      .limit(limit)

    if (type === 'review') {
      // 待复习的单词：到期且不是新学习状态 (假设状态是数字：0=new, 1=learning, 2=review)
      query = query
        .lte('due', new Date().toISOString())
        .neq('state', '0')
        .order('due', { ascending: true })
    } else if (type === 'learn') {
      // 待学习的新单词
      query = query
        .eq('state', '0')
        .order('created_at', { ascending: true })
    }

    const { data: reviewQueue, error } = await query

    if (error) {
      console.error('获取复习队列时出错:', error)
      return NextResponse.json(
        { error: '获取复习队列失败' },
        { status: 500 }
      )
    }

    // 统计数据
    const { data: stats, error: statsError } = await supabase
      .from('user_word_progress')
      .select('state, due')
      .eq('user_id', user.id)

    let reviewCount = 0
    let learnCount = 0
    const today = new Date().toDateString()

    if (!statsError && stats) {
      reviewCount = stats.filter(s => 
        s.state !== '0' && 
        new Date(s.due).toDateString() <= today
      ).length

      learnCount = stats.filter(s => s.state === '0').length
    }

    return NextResponse.json({
      queue: reviewQueue || [],
      stats: {
        dueForReview: reviewCount,
        newToLearn: learnCount,
        totalLearned: stats?.length || 0
      }
    })

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}
