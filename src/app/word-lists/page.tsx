"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthGuard } from "@/components/auth/AuthGuard";
import { WordListCard } from "@/components/ui/word-list-card";
import { CreateWordListModal } from "@/components/ui/create-wordlist-modal";
import { RenameWordListModal } from "@/components/ui/rename-wordlist-modal";
import { ToastContainer, useToast } from "@/components/ui/toast-notification";
import { useWordLists } from "@/hooks/useWordLists";
import { ArrowLeft } from 'lucide-react';
import { ConfirmModal } from "@/components/ui/confirm-modal";

type WordListItem = {
  id: number;
  user_id: string;
  name: string;
  created_at: string;
  word_count: number;
};

function WordListsPageInner() {
  const router = useRouter();
  const { success, error } = useToast();
  const { lists, isLoading, create, rename, remove } = useWordLists();
  const [createOpen, setCreateOpen] = useState(false);
  const [renaming, setRenaming] = useState<{ id: number; name: string } | null>(null);
  const [busyId, setBusyId] = useState<number | null>(null);
  const [confirmDelete, setConfirmDelete] = useState<number | null>(null);

  useEffect(() => {
    // 页面可见性由 SWR revalidateOnFocus 处理
  }, []);

  const handleCreate = async (name: string) => {
    setCreateOpen(false); // 立即关闭
    try {
      await create(name);
      success('已创建单词本');
    } catch (e: any) {
      if (e?.message === 'WORDLIST_NAME_CONFLICT') error('单词本名称已存在');
      else error('创建失败');
      setCreateOpen(true); // 失败重新打开
    }
  };

  const handleOpen = (id: number) => router.push(`/word-lists/${id}`);

  const onMenuRename = (id: number, name: string) => setRenaming({ id, name });

  const doRename = async (name: string) => {
    if (!renaming) return;
    const { id } = renaming;
    setRenaming(null); // 立即关闭
    setBusyId(id);
    try {
      await rename(id, name);
      success('已重命名');
    } catch (e: any) {
      if (e?.message === 'WORDLIST_NAME_CONFLICT') error('单词本名称已存在');
      else error('重命名失败');
      // 失败重新打开
      setRenaming({ id, name });
    }
    setBusyId(null);
  };

  const doDelete = async (id: number) => {
    setBusyId(id);
    try {
      await remove(id);
      success('已删除');
    } catch {
      error('删除失败');
    }
    setBusyId(null);
  };

  return (
    <div className="min-h-screen">
      <div className="relative z-10 max-w-6xl mx-auto px-6 sm:px-8 lg:px-12 py-10">
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <button onClick={() => router.push('/')} className="p-2 rounded-lg hover:bg-surface/60 text-foreground" aria-label="返回主页">
              <ArrowLeft size={18} />
            </button>
            <h1 className="text-3xl font-bold text-foreground">单词本</h1>
          </div>
          <button
            onClick={() => setCreateOpen(true)}
            className="px-4 py-2 rounded-lg bg-primary text-primary-foreground hover:bg-gradient-to-r hover:from-indigo-200 hover:via-white hover:to-rose-200 hover:text-gray-800 transition-all font-semibold"
          >
            + 创建新单词本
          </button>
        </div>

        {isLoading ? (
          <div className="min-h-[40vh] flex items-center justify-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto" />
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-5">
            {lists.map((list) => (
              <div key={list.id} className="relative">
                <WordListCard
                  id={list.id}
                  name={list.name}
                  wordCount={list.word_count}
                  onClick={() => handleOpen(list.id)}
                  onMenuClick={(e) => {
                    // 轻量自研菜单：使用原生 context-like 弹层
                    const menu = document.createElement('div');
                    menu.className = 'absolute z-50 glass-surface border border-border rounded-lg shadow-xl py-1 text-sm';
                    menu.style.top = `${(e.currentTarget as HTMLElement).getBoundingClientRect().bottom + window.scrollY + 8}px`;
                    menu.style.left = `${(e.currentTarget as HTMLElement).getBoundingClientRect().right + window.scrollX - 140}px`;
                    menu.style.width = '140px';

                    const item = (label: string, onClick: () => void) => {
                      const el = document.createElement('button');
                      el.className = 'w-full text-left px-3 py-2 hover:bg-surface/70 text-foreground';
                      el.innerText = label;
                      el.onclick = () => { onClick(); cleanup(); };
                      return el;
                    };

                    menu.appendChild(item('重命名', () => onMenuRename(list.id, list.name)));
                    menu.appendChild(item('删除', () => setConfirmDelete(list.id)));

                    const cleanup = () => {
                      document.removeEventListener('click', handleOutside, true);
                      menu.remove();
                    };
                    const handleOutside = (ev: MouseEvent) => {
                      if (!menu.contains(ev.target as Node)) cleanup();
                    };
                    document.addEventListener('click', handleOutside, true);
                    document.body.appendChild(menu);
                  }}
                  className="h-32"
                />
                {busyId === list.id && (
                  <div className="absolute inset-0 rounded-xl bg-black/30 flex items-center justify-center">
                    <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-white"></div>
                  </div>
                )}
              </div>
            ))}

            <WordListCard
              isCreateNew
              name=""
              wordCount={0}
              onClick={() => setCreateOpen(true)}
              className="h-32"
            />
          </div>
        )}
      </div>

      <CreateWordListModal
        isOpen={createOpen}
        onClose={() => setCreateOpen(false)}
        onConfirm={handleCreate}
      />

      <RenameWordListModal
        isOpen={!!renaming}
        initialName={renaming?.name || ""}
        onClose={() => setRenaming(null)}
        onConfirm={doRename}
      />

      <ConfirmModal
        isOpen={confirmDelete !== null}
        title="删除单词本"
        description="此操作不可撤销，将删除列表实体但保留学习记录。"
        confirmText="删除"
        onConfirm={() => { const id = confirmDelete!; setConfirmDelete(null); doDelete(id); }}
        onClose={() => setConfirmDelete(null)}
      />
      <ToastContainer />
    </div>
  );
}

export default function WordListsPage() {
  return (
    <AuthGuard>
      <WordListsPageInner />
    </AuthGuard>
  );
}


