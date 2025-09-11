const { createClient } = require('@supabase/supabase-js');
require('dotenv').config({ path: '.env.local' });  // 指定加载 .env.local

const supabaseUrl = process.env.SUPABASE_URL;
const supabaseKey = process.env.SUPABASE_SERVICE_ROLE_KEY; // 使用 service_role key 以获取 schema 访问权限

// 调试输出（匿名化密钥）
console.log('调试: SUPABASE_URL 已设置:', !!supabaseUrl);
console.log('调试: SUPABASE_SERVICE_ROLE_KEY 已设置:', !!supabaseKey ? '是（长度: ' + supabaseKey.length + ')' : '否');

if (!supabaseUrl || !supabaseKey) {
  console.error('错误: 未找到 SUPABASE_URL 或 SUPABASE_SERVICE_ROLE_KEY。请检查 .env.local 文件，确保它们已正确设置。');
  console.error('提示: 文件应在项目根目录，格式如: SUPABASE_URL=https://yourproject.supabase.co');
  process.exit(1);
}

const supabase = createClient(supabaseUrl, supabaseKey, {
  auth: { autoRefreshToken: false, persistSession: false }
});

// 先在 Supabase 创建 RPC 函数（如果需要，用户手动）
console.log('注意: 如果 RPC \'get_table_columns\' 不存在，请在 Supabase SQL 编辑器运行: CREATE FUNCTION get_table_columns(table_name text) RETURNS SETOF text AS $$ SELECT column_name FROM information_schema.columns WHERE table_name = $1 AND table_schema = \'public\'; $$ LANGUAGE sql;');  // 只打印一次，在循环外

const expectedSchema = {
  profiles: ['id', 'email', 'default_word_list_id', 'updated_at'],
  word_lists: ['id', 'user_id', 'name', 'is_default', 'created_at'],  // 移除 updated_at
  user_search_history: ['id', 'user_id', 'word_id', 'search_count', 'last_searched_at'],  // 移除 query, 添加 word_id
  words: ['id', 'word', 'phonetic', 'definition', 'translation', 'pos', 'collins', 'oxford', 'tag', 'bnc', 'frq', 'exchange', 'detail', 'audio', 'created_at'],  // 新添加
  user_word_progress: ['id', 'user_id', 'word_id', 'word_list_id', 'state', 'stability', 'difficulty', 'elapsed_days', 'scheduled_days', 'reps', 'lapses', 'last_review', 'due', 'created_at', 'updated_at'],  // 新添加
  word_mnemonics: ['id', 'word_id', 'user_id', 'content', 'type', 'created_at', 'updated_at'],  // 新添加
  // 添加更多如果需要
};

async function checkSchema() {
  console.log('开始检查数据库结构一致性...');

  for (const [table, expectedColumns] of Object.entries(expectedSchema)) {
    let attempts = 0;
    let success = false;
    while (attempts < 3 && !success) {
      attempts++;
      try {
        // 尝试 RPC
        const { data, error } = await supabase.rpc('get_table_columns', { table_name: table });

        if (error) throw error;

        console.log(`调试: 对于 ${table}, 原始返回数据:`, data);

        let actualColumns = [];
        if (Array.isArray(data) && data.length > 0) {
          if (typeof data[0] === 'object') {
            actualColumns = data.map(row => row.column_name || Object.values(row)[0]).sort();
          } else {
            actualColumns = [...data].sort();
          }
        } else {
          console.warn(`⚠️ 警告: ${table} 表无列或不存在`);
          continue;
        }

        const expectedSorted = [...expectedColumns].sort();
        const missingColumns = expectedSorted.filter(col => !actualColumns.includes(col));
        const extraColumns = actualColumns.filter(col => !expectedSorted.includes(col));

        if (missingColumns.length > 0) {
          console.warn(`⚠️ 警告: ${table} 表缺少列: ${missingColumns.join(', ')}`);
        }
        if (extraColumns.length > 0) {
          console.info(`ℹ️ 信息: ${table} 表有额外列: ${extraColumns.join(', ')} (预期外)`);
        }
        if (missingColumns.length === 0 && extraColumns.length === 0) {
          console.log(`✅ ${table} 表结构匹配。`);
        }
        success = true;
      } catch (err) {
        console.error(`错误: RPC 查询 ${table} 失败 (尝试 ${attempts}/3) - ${err.message}`);
        
        // Fallback 到直接 SQL
        try {
          const { data: fallbackData, error: fallbackError } = await supabase.from('').select(`*`, { head: true }).sql(`
            SELECT column_name FROM information_schema.columns WHERE table_name = '${table}' AND table_schema = 'public'
          `);

          if (fallbackError) throw fallbackError;

          console.log(`调试: Fallback 返回数据:`, fallbackData);
          const actualColumns = fallbackData.map(row => row.column_name);
          const missingColumns = expectedColumns.filter(col => !actualColumns.includes(col));

          if (missingColumns.length > 0) {
            console.warn(`⚠️ 警告: ${table} 表缺少列: ${missingColumns.join(', ')}`);
          } else {
            console.log(`✅ ${table} 表结构匹配。`);
          }
        } catch (fallbackErr) {
          console.error(`错误: Fallback 查询失败 - ${fallbackErr.message}`);
        }

        if (attempts === 3) {
          console.error('提示: 确保 RPC 函数存在且 service_role 有权限。测试 SQL: SELECT * FROM get_table_columns(\'profiles\');');
          console.error('参考: https://supabase.com/docs/guides/database/functions');
        }
        await new Promise(resolve => setTimeout(resolve, 1000));
      }
    }
  }

  console.log('检查完成！');
}

checkSchema().catch(console.error);
