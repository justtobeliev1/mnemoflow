import { NextRequest, NextResponse } from 'next/server'
import { createServerSupabaseClient } from '@/lib/supabase-server'

// 获取当前用户资料
export async function GET(request: NextRequest) {
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

    // 查询用户资料
    const { data: profile, error } = await supabase
      .from('profiles')
      .select(`
        *,
        default_word_list:word_lists(*)
      `)
      .eq('id', user.id)
      .single()

    if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
      console.error('获取用户资料时出错:', error)
      return NextResponse.json(
        { error: '获取用户资料失败' },
        { status: 500 }
      )
    }

    // 如果用户资料不存在，创建一个
    if (!profile) {
      const { data: newProfile, error: createError } = await supabase
        .from('profiles')
        .insert({
          id: user.id,
          email: user.email
        })
        .select()
        .single()

      if (createError) {
        console.error('创建用户资料时出错:', createError)
        return NextResponse.json(
          { error: '创建用户资料失败' },
          { status: 500 }
        )
      }

      return NextResponse.json(newProfile)
    }

    return NextResponse.json(profile)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}

// 更新用户资料
export async function PATCH(request: NextRequest) {
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
    const { default_word_list_id } = body

    // 更新用户资料
    const { data: updatedProfile, error } = await supabase
      .from('profiles')
      .update({
        default_word_list_id,
        updated_at: new Date().toISOString()
      })
      .eq('id', user.id)
      .select(`
        *,
        default_word_list:word_lists(*)
      `)
      .single()

    if (error) {
      console.error('更新用户资料时出错:', error)
      return NextResponse.json(
        { error: '更新用户资料失败' },
        { status: 500 }
      )
    }

    return NextResponse.json(updatedProfile)

  } catch (error) {
    console.error('API错误:', error)
    return NextResponse.json(
      { error: '服务器内部错误' },
      { status: 500 }
    )
  }
}