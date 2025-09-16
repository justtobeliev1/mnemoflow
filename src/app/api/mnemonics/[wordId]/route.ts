import { NextRequest, NextResponse } from 'next/server';
import { validateAuth } from '@/lib/supabase-server';
import { getMnemonicForWord, createMnemonicForWord, regenerateMnemonicForWord } from '@/services/mnemonic.service';
import { MnemonicGenerateRequestSchema, MnemonicPollQuerySchema } from '@/lib/validators/mnemonic.schemas';
import { handleApiError, createValidationError, createNotFoundError } from '@/lib/errors';

/**
 * GET /api/mnemonics/{wordId}
 * 
 * 获取单词的助记内容
 * 支持轮询机制，当内容正在生成时会等待完成
 * 
 * @param request - 包含查询参数的请求
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 返回助记内容
 * @returns 202 Accepted - 内容正在生成中（轮询超时时）
 * @returns 400 Bad Request - wordId参数无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 助记内容不存在
 * @returns 500 Internal Server Error - 数据库查询失败
 */
export async function GET(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析wordId参数
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    // 3. 解析查询参数
    const { searchParams } = new URL(request.url);
    const queryParams = {
      timeout: searchParams.get('timeout') || undefined,
      version: searchParams.get('version') || undefined,
    } as any;
    const validatedQuery = MnemonicPollQuerySchema.parse(queryParams);

    // 4. 获取助记内容
    let mnemonic = await getMnemonicForWord({
      supabase,
      userId: user.id,
      wordId,
    });

    if (!mnemonic) {
      throw createNotFoundError('助记内容');
    }

    // 5. 如果内容正在生成中，进行轮询等待（兼容 content.status）
    const isGenerating = (m: any) => {
      const c = m?.content;
      return c && typeof c === 'object' && c.status === 'generating';
    };

    if (isGenerating(mnemonic)) {
      const startTime = Date.now();
      const timeout = validatedQuery.timeout;

      while (Date.now() - startTime < timeout && isGenerating(mnemonic)) {
        // 等待1秒后重新查询
        await new Promise(resolve => setTimeout(resolve, 1000));
        
        mnemonic = await getMnemonicForWord({
          supabase,
          userId: user.id,
          wordId,
        });

        if (!mnemonic) {
          throw createNotFoundError('助记内容');
        }
      }

      // 如果超时后仍在生成中，返回202状态
      if (isGenerating(mnemonic)) {
        return NextResponse.json({
          message: '助记内容正在生成中，请稍后再试',
          mnemonic: {
            id: mnemonic.id,
            word_id: mnemonic.word_id,
            type: mnemonic.type,
            status: 'generating',
            version: mnemonic.version,
            created_at: mnemonic.created_at,
          }
        }, { status: 202 });
      }
    }

    // 6. 成功返回助记内容
    return NextResponse.json({
      mnemonic: {
        id: mnemonic.id,
        word_id: mnemonic.word_id,
        type: mnemonic.type,
        content: mnemonic.content,
        status: mnemonic.status,
        version: mnemonic.version,
        generation_time: mnemonic.generation_time,
        user_context: mnemonic.user_context,
        created_at: mnemonic.created_at,
        updated_at: mnemonic.updated_at,
        word: mnemonic.words,
      }
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * POST /api/mnemonics/{wordId}
 *
 * 创建助记内容生成任务（用于首次收藏后触发）
 */
export async function POST(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    const { supabase, user } = await validateAuth();
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    // 允许带可选的 type 与 user_context
    let body: any = {};
    try {
      const txt = await request.text();
      if (txt.trim()) body = JSON.parse(txt);
    } catch {}

    const payload = MnemonicGenerateRequestSchema.parse({
      word_id: wordId,
      type: body?.type,
      user_context: body?.user_context,
    });

    const task = await createMnemonicForWord({ supabase, userId: user.id, data: payload });
    return NextResponse.json({ message: '助记任务已创建', mnemonic: { id: task.id, status: task.status } }, { status: 202 });
  } catch (error) {
    return handleApiError(error);
  }
}

/**
 * PUT /api/mnemonics/{wordId}
 * 
 * 重新生成单词的助记内容
 * 
 * @param request - 包含重新生成参数的请求体
 * @param params - 路由参数，包含wordId
 * @returns 200 OK - 返回重新生成的助记内容记录
 * @returns 400 Bad Request - 请求数据验证失败或wordId无效
 * @returns 401 Unauthorized - 用户未登录
 * @returns 404 Not Found - 助记内容不存在
 * @returns 500 Internal Server Error - 数据库操作失败
 */
export async function PUT(
  request: NextRequest,
  { params }: { params: { wordId: string } }
) {
  try {
    // 1. 验证用户认证状态
    const { supabase, user } = await validateAuth();

    // 2. 验证和解析wordId参数
    const wordId = parseInt(params.wordId, 10);
    if (isNaN(wordId) || wordId <= 0) {
      throw createValidationError('无效的单词ID', 'wordId必须是正整数');
    }

    // 3. 解析请求体（可选参数）
    let requestData = {};
    try {
      const body = await request.text();
      if (body.trim()) {
        requestData = JSON.parse(body);
      }
    } catch (parseError) {
      // 忽略JSON解析错误，使用默认参数
    }

    // 4. 重新生成助记内容
    const updatedMnemonic = await regenerateMnemonicForWord({
      supabase,
      userId: user.id,
      wordId,
      type: (requestData as any).type,
      userContext: (requestData as any).user_context,
    });

    // 5. 成功返回更新后的助记内容记录
    return NextResponse.json({
      message: '助记内容重新生成已开始',
      mnemonic: {
        id: updatedMnemonic?.id,
        word_id: updatedMnemonic?.word_id,
        type: updatedMnemonic?.type,
        status: updatedMnemonic?.status,
        user_context: updatedMnemonic?.user_context,
        created_at: updatedMnemonic?.created_at,
        updated_at: updatedMnemonic?.updated_at,
        word: updatedMnemonic?.words,
      }
    }, { status: 200 });

  } catch (error) {
    return handleApiError(error);
  }
}