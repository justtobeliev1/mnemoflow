/**
 * 标签解析工具
 */

/**
 * 标签映射表
 */
const TAG_MAP: Record<string, string> = {
  'ky': 'CET4',
  'zk': 'CET6',
  'gk': '高考',
  'toefl': 'TOEFL',
  'ielts': 'IELTS', 
  'gre': 'GRE',
  'sat': 'SAT',
  'bec': 'BEC',
  'tem4': 'TEM4',
  'tem8': 'TEM8',
  'kaoyan': '考研',
  'cet4': 'CET4',
  'cet6': 'CET6',
};

/**
 * 标签优先级（用于排序）
 */
const TAG_PRIORITY: Record<string, number> = {
  'CET4': 1,
  'CET6': 2,
  '高考': 3,
  '考研': 4,
  'TOEFL': 5,
  'IELTS': 6,
  'GRE': 7,
  'SAT': 8,
  'TEM4': 9,
  'TEM8': 10,
  'BEC': 11,
};

/**
 * 解析标签数据
 * @param tags 标签数组，格式如 ["ky toefl ielts gre"]
 * @returns 解析并排序后的标签数组
 */
export function parseTags(tags: string[] | null): string[] {
  if (!tags || tags.length === 0) return [];
  
  // 将所有标签字符串合并并分割
  const allTags = tags
    .join(' ')
    .toLowerCase()
    .split(/\s+/)
    .filter(Boolean);
  
  // 映射标签并去重
  const mappedTags = allTags
    .map(tag => TAG_MAP[tag] || tag.toUpperCase())
    .filter((tag, index, arr) => arr.indexOf(tag) === index);
  
  // 按优先级排序
  return mappedTags.sort((a, b) => {
    const priorityA = TAG_PRIORITY[a] || 999;
    const priorityB = TAG_PRIORITY[b] || 999;
    
    if (priorityA !== priorityB) {
      return priorityA - priorityB;
    }
    
    // 优先级相同时按字母排序
    return a.localeCompare(b);
  });
}

/**
 * 获取标签的显示颜色类名
 * @param tag 标签名
 * @returns CSS类名
 */
export function getTagColorClass(tag: string): string {
  const colorMap: Record<string, string> = {
    'CET4': 'tag-cet4',
    'CET6': 'tag-cet6',
    'TOEFL': 'tag-toefl',
    'IELTS': 'tag-ielts',
    'GRE': 'tag-gre',
    '高考': 'tag-gaokao',
    '考研': 'tag-kaoyan',
  };
  
  return colorMap[tag] || 'tag-default';
}