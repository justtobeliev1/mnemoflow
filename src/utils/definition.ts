/**
 * 释义解析工具
 */

export interface DefinitionItem {
  pos: string;      // 词性，如 "n.", "vt.", "vi."
  meaning: string;  // 释义内容
}

/**
 * 词性映射表
 */
const POS_MAP: Record<string, string> = {
  'n.': '名词',
  'v.': '动词', 
  'vt.': '及物动词',
  'vi.': '不及物动词',
  'adj.': '形容词',
  'adv.': '副词',
  'prep.': '介词',
  'conj.': '连词',
  'pron.': '代词',
  'art.': '冠词',
  'num.': '数词',
  'int.': '感叹词',
  'aux.': '助动词',
  'modal.': '情态动词',
};

/**
 * 解析释义数据
 * @param definition 释义数据，可能是字符串或对象
 * @returns 解析后的释义数组
 */
export function parseDefinition(definition: any): DefinitionItem[] {
  if (!definition) return [];
  
  if (typeof definition === 'string') {
    // 处理字符串格式："n. 向后转, 大改变\\nvi. 向后转, 作重大改变"
    return definition
      .split('\\n')
      .map(line => line.trim())
      .filter(Boolean)
      .map(line => parseSingleDefinitionLine(line))
      .filter(item => item.meaning.length > 0);
  }
  
  if (typeof definition === 'object' && definition !== null) {
    // 处理可能的JSON格式
    if (Array.isArray(definition)) {
      return definition.map(item => {
        if (typeof item === 'string') {
          return parseSingleDefinitionLine(item);
        }
        return {
          pos: item.pos || '',
          meaning: item.meaning || item.definition || String(item)
        };
      });
    }
    
    // 处理对象格式
    if (definition.pos && definition.meaning) {
      return [{
        pos: definition.pos,
        meaning: definition.meaning
      }];
    }
  }
  
  // 兜底处理
  return [{
    pos: '',
    meaning: String(definition)
  }];
}

/**
 * 解析单行释义
 * @param line 单行释义文本
 * @returns 解析后的释义项
 */
function parseSingleDefinitionLine(line: string): DefinitionItem {
  const trimmedLine = line.trim();
  
  // 匹配词性模式：n. xxx, vt. xxx, adj. xxx 等
  const posMatch = trimmedLine.match(/^([a-z]+\.)\s+(.+)$/i);
  
  if (posMatch) {
    const [, pos, meaning] = posMatch;
    return {
      pos: pos.toLowerCase(),
      meaning: meaning.trim()
    };
  }
  
  // 没有匹配到词性，整行作为释义
  return {
    pos: '',
    meaning: trimmedLine
  };
}

/**
 * 获取词性的中文描述
 * @param pos 英文词性标记
 * @returns 中文词性描述
 */
export function getPosDescription(pos: string): string {
  return POS_MAP[pos.toLowerCase()] || pos;
}

/**
 * 格式化释义显示
 * @param definitions 释义数组
 * @returns 格式化后的释义文本
 */
export function formatDefinitions(definitions: DefinitionItem[]): string {
  return definitions
    .map(def => {
      if (def.pos) {
        return `${def.pos} ${def.meaning}`;
      }
      return def.meaning;
    })
    .join('\n');
}