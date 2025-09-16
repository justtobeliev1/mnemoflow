import { NextRequest, NextResponse } from 'next/server';
import { z } from 'zod';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';

const BodySchema = z.object({
  rating: z.number().int().refine(v => v === 1 || v === -1, { message: 'rating must be 1 or -1' }),
  mnemonicId: z.number().int().optional(),
});

export async function POST(request: NextRequest, { params }: { params: { wordId: string } }) {
  try {
    const { supabase, user } = await validateAuth(request);

    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    const json = await request.json().catch(() => ({}));
    const { rating, mnemonicId } = BodySchema.parse(json);

    // 找到该单词最新的助记记录
    let mnemonic;
    if (mnemonicId) {
      const { data, error } = await (supabase as any)
        .from('word_mnemonics')
        .select('*')
        .eq('id', mnemonicId)
        .eq('word_id', wordId)
        .single();
      if (error || !data) return NextResponse.json({ error: '助记内容不存在' }, { status: 404 });
      mnemonic = data;
    } else {
      const { data, error } = await (supabase as any)
        .from('word_mnemonics')
        .select('*')
        .eq('word_id', wordId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return NextResponse.json({ error: '助记内容不存在' }, { status: 404 });
      mnemonic = data;
    }

    // mnemonic 已在上面校验，无需 mnErr（避免未定义变量）

    // 插入/更新反馈（同一用户对同一助记仅一条记录）
    const { error: insErr } = await (supabase as any)
      .from('mnemonic_feedback')
      .upsert({
        user_id: user.id,
        word_mnemonic_id: mnemonic.id,
        rating: rating,
      }, { onConflict: 'user_id,word_mnemonic_id' });

    if (insErr) {
      return NextResponse.json({ error: insErr.message }, { status: 500 });
    }

    return NextResponse.json({ ok: true }, { status: 201 });
  } catch (error) {
    return handleApiError(error);
  }
}

export async function GET(request: NextRequest, { params }: { params: { wordId: string } }) {
  try {
    const { supabase, user } = await validateAuth(request);
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    const { searchParams } = new URL(request.url);
    const mnemonicId = searchParams.get('mnemonicId');

    let mnemonic;
    if (mnemonicId) {
      const { data, error } = await (supabase as any)
        .from('word_mnemonics')
        .select('id, word_id')
        .eq('id', Number(mnemonicId))
        .eq('word_id', wordId)
        .single();
      if (error || !data) return NextResponse.json({ exists: false });
      mnemonic = data;
    } else {
      const { data, error } = await (supabase as any)
        .from('word_mnemonics')
        .select('id, word_id')
        .eq('word_id', wordId)
        .order('version', { ascending: false })
        .limit(1)
        .single();
      if (error || !data) return NextResponse.json({ exists: false });
      mnemonic = data;
    }

    const { data: fb } = await (supabase as any)
      .from('mnemonic_feedback')
      .select('rating')
      .eq('user_id', user.id)
      .eq('word_mnemonic_id', mnemonic.id)
      .single();

    if (!fb) return NextResponse.json({ exists: false });
    return NextResponse.json({ exists: true, rating: fb.rating });
  } catch (error) {
    return handleApiError(error);
  }
}


