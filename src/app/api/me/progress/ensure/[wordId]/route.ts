import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { handleApiError, createValidationError } from '@/lib/errors';
import { ensureProgressForUserWord } from '@/services/word.service';

export async function POST(
  req: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const { supabase, user } = await validateAuth();
    const idNum = Number(params.wordId);
    if (!idNum || idNum <= 0) {
      throw createValidationError('无效的单词ID', 'wordId 必须为正整数');
    }
    const search = req.nextUrl.searchParams;
    const listId = search.get('listId') ? Number(search.get('listId')) : undefined;
    const data = await ensureProgressForUserWord({ supabase, userId: user.id, wordId: idNum, listId });
    return NextResponse.json({ ok: true, id: data?.id ?? null });
  } catch (e) {
    return handleApiError(e);
  }
}


