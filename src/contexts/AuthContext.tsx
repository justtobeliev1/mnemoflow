"use client";

import React, { createContext, useContext, useEffect, useState } from 'react';
import { User, Session, AuthError } from '@supabase/supabase-js';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';

interface AuthContextType {
  user: User | null;
  session: Session | null;
  loading: boolean;
  signIn: (email: string, password: string) => Promise<{ error: AuthError | null }>;
  signOut: () => Promise<{ error: AuthError | null }>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  useEffect(() => {
    // 获取初始会话
    const getInitialSession = async () => {
      const { data: { session }, error } = await supabase.auth.getSession();
      if (error) {
        console.error('获取会话时出错:', error);
      } else {
        setSession(session);
        setUser(session?.user ?? null);
        
        // 如果有有效会话，初始化用户数据
        if (session?.access_token) {
          await initializeUserData(session.access_token);
        }
      }
      setLoading(false);
    };

    getInitialSession();

    // 监听认证状态变化
    const { data: authListener } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      setSession(newSession);
      setUser(newSession?.user ?? null);

      if (event === 'SIGNED_IN' && newSession?.access_token) {
        // 登录后初始化（静默失败不阻塞）
        initializeUserData(newSession.access_token).catch(err => console.error('初始化失败:', err));
      }

      if (event === 'SIGNED_OUT') {
        setUser(null);
        setSession(null);
        // 跳转到登录页
        router.replace('/login');
      }
    });

    return () => authListener.subscription.unsubscribe();
  }, []);

  // 初始化用户数据
  const initializeUserData = async (accessToken: string) => {
    try {
      const res = await fetch('/api/me/profile/initialize', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`
        }
      });
      // 401 时静默忽略（例如会话刚失效）
      if (!res.ok && res.status !== 401) {
        const text = await res.text().catch(() => '');
        console.error('初始化用户数据失败: ', res.status, text);
      }
    } catch (error) {
      console.error('初始化用户数据失败:', error);
    }
  };

  const signIn = async (email: string, password: string) => {
    try {
      const { data, error } = await supabase.auth.signInWithPassword({ email, password });
      if (error) {
        console.error('登录失败:', error.message);  // 日志细节
        throw error;
      }
      setSession(data.session);
      setUser(data.user);

      // 异步初始化，不阻塞登录
      if (data.session?.access_token) {
        initializeUserData(data.session.access_token).catch(err => console.error('初始化失败，但登录成功:', err));
      }
      return data;
    } catch (err) {
      console.error('登录错误:', err);
      throw err;
    }
  };

  const signOut = async () => {
    const { error } = await supabase.auth.signOut();
    setUser(null);
    setSession(null);
    router.replace('/login');
    return { error };
  };

  const value = {
    user,
    session,
    loading,
    signIn,
    signOut,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth 必须在 AuthProvider 内使用');
  }
  return context;
}
