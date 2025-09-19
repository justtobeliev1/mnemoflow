'use client';

import { useEffect, useState } from 'react';

export default function LearnByNamePage({ params }: { params: { name: string } }) {
  const name = decodeURIComponent(params.name);
  const [redirecting, setRedirecting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    (async () => {
      try {
        // 假设后端支持通过名称查询单词本 ID 的接口 /api/word-lists/by-name/[name]
        const res = await fetch(`/api/word-lists/by-name/${encodeURIComponent(name)}`, { cache: 'no-store' });
        if (!mounted) return;
        if (res.ok) {
          const body = await res.json();
          const id = body?.id || body?.list?.id;
          if (id) {
            setRedirecting(true);
            window.location.replace(`/learn/list/${id}`);
          } else {
            setError('未找到同名的单词本');
          }
        } else {
          setError((await res.text()) || '查询失败');
        }
      } catch (e: any) {
        setError(e?.message || '网络错误');
      }
    })();
    return () => { mounted = false; };
  }, [name]);

  return (
    <div className="min-h-screen bg-background text-center flex items-center justify-center">
      <div>
        <h2 className="text-2xl font-bold text-foreground">正在查找单词本：{name}</h2>
        {redirecting && <p className="text-muted mt-2">即将跳转…</p>}
        {error && <p className="text-rose-400 mt-2">{error}</p>}
      </div>
    </div>
  );
}


