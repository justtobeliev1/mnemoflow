import { NextResponse } from 'next/server';
import { ZodError } from 'zod';

/**
 * 统一的API错误响应格式
 */
export interface ApiError {
  error: {
    statusCode: number;
    message: string;
    details?: string;
    error_code?: string;
  };
}

/**
 * 自定义应用错误类
 */
export class AppError extends Error {
  public statusCode: number;
  public details?: string;
  public errorCode?: string;

  constructor(message: string, statusCode: number = 500, details?: string, errorCode?: string) {
    super(message);
    this.name = 'AppError';
    this.statusCode = statusCode;
    this.details = details;
    this.errorCode = errorCode;
  }
}

/**
 * 统一的API错误处理函数
 * 将各种类型的错误转换为标准的API错误响应
 */
export function handleApiError(error: unknown): NextResponse<ApiError> {
  console.error('API Error:', error);

  // 自定义应用错误
  if (error instanceof AppError) {
    return NextResponse.json(
      {
        error: {
          statusCode: error.statusCode,
          message: error.message,
          details: error.details,
          error_code: error.errorCode,
        },
      },
      { status: error.statusCode }
    );
  }

  // Zod验证错误
  if (error instanceof ZodError) {
    const details = error.issues
      .map((err) => `${err.path.join('.')}: ${err.message}`)
      .join('; ');
    
    return NextResponse.json(
      {
        error: {
          statusCode: 400,
          message: '请求数据验证失败',
          details,
        },
      },
      { status: 400 }
    );
  }

  // Supabase错误
  if (error && typeof error === 'object' && 'code' in error) {
    const supabaseError = error as any;
    
    // 用户未找到
    if (supabaseError.code === 'PGRST116') {
      return NextResponse.json(
        {
          error: {
            statusCode: 404,
            message: '资源不存在',
            details: supabaseError.message,
          },
        },
        { status: 404 }
      );
    }

    // 权限错误
    if (supabaseError.code === 'PGRST301') {
      return NextResponse.json(
        {
          error: {
            statusCode: 403,
            message: '权限不足',
            details: '您没有权限访问此资源',
          },
        },
        { status: 403 }
      );
    }

    // 其他Supabase错误
    return NextResponse.json(
      {
        error: {
          statusCode: 500,
          message: '数据库操作失败',
          details: supabaseError.message,
        },
      },
      { status: 500 }
    );
  }

  // 认证错误
  if (error instanceof Error && error.message.includes('需要登录')) {
    return NextResponse.json(
      {
        error: {
          statusCode: 401,
          message: '需要登录',
          details: '请提供有效的认证token',
        },
      },
      { status: 401 }
    );
  }

  // 默认服务器错误
  return NextResponse.json(
    {
      error: {
        statusCode: 500,
        message: '服务器内部错误',
        details: error instanceof Error ? error.message : '未知错误',
      },
    },
    { status: 500 }
  );
}

/**
 * 创建认证错误
 */
export function createAuthError(message: string = '需要登录'): AppError {
  return new AppError(message, 401, '请提供有效的认证token');
}

/**
 * 创建验证错误
 */
export function createValidationError(message: string, details?: string): AppError {
  return new AppError(message, 400, details);
}

/**
 * 创建未找到错误
 */
export function createNotFoundError(resource: string = '资源'): AppError {
  return new AppError(`${resource}不存在`, 404);
}

/**
 * 创建权限错误
 */
export function createForbiddenError(message: string = '权限不足'): AppError {
  return new AppError(message, 403, '您没有权限执行此操作');
}