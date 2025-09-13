/**
 * 音标解析工具
 */

export interface PhoneticData {
  uk: string | null;
  us: string | null;
}

/**
 * 解析音标数据
 * @param phonetic 音标字符串，可能包含英美式分离的格式
 * @returns 解析后的英美音标对象
 */
export function parsePhonetic(phonetic: string | null): PhoneticData {
  if (!phonetic || phonetic.trim() === '') {
    return { uk: null, us: null };
  }
  
  const cleanPhonetic = phonetic.trim();
  
  // 处理英美式分离的情况：,æbə'mei; ə'bɔmi
  if (cleanPhonetic.includes(';')) {
    const parts = cleanPhonetic.split(';').map(p => p.trim());
    if (parts.length >= 2) {
      let uk = parts[0];
      let us = parts[1];
      
      // 去掉开头的逗号
      if (uk.startsWith(',')) {
        uk = uk.substring(1).trim();
      }
      
      return {
        uk: uk || null,
        us: us || null
      };
    }
  }
  
  // 只有英式音标的情况：ә'bɒminәbl
  return {
    uk: cleanPhonetic,
    us: null
  };
}

/**
 * 格式化音标显示
 * @param phonetic 音标字符串
 * @returns 格式化后的音标（添加斜杠）
 */
export function formatPhonetic(phonetic: string | null): string {
  if (!phonetic) return '';
  
  const clean = phonetic.trim();
  if (!clean) return '';
  
  // 如果已经有斜杠，直接返回
  if (clean.startsWith('/') && clean.endsWith('/')) {
    return clean;
  }
  
  // 添加斜杠
  return `/${clean}/`;
}