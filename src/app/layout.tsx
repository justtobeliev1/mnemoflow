import type { Metadata } from "next";
import "./globals.css";
import { AuthProvider } from "@/contexts/AuthContext";
import { ToastContainer } from "@/components/ui/toast-notification";
import dynamic from 'next/dynamic';
import { QueryClientProvider } from '@/contexts/QueryClientProvider';
import { SpeedInsights } from "@vercel/speed-insights/next"; // <--- 1. 在这里导入

// 动态加载背景动画组件，仅在客户端渲染，避免与服务端 HTML 不匹配
const AnimatedBackground = dynamic(() => import('@/components/ui/animated-background').then(m => m.AnimatedBackground), { ssr: false });

export const metadata: Metadata = {
  title: "Mnemoflow - 智能英语学习助手",
  description: "基于认知科学理论的智能化英语词汇学习应用",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN">
      <body className="font-sans antialiased">
        <AuthProvider>
          <QueryClientProvider>
            <div className="min-h-screen bg-background relative">
              <AnimatedBackground />
              <div className="relative z-10">
                {children}
                <SpeedInsights /> {/* <--- 2. 在这里添加组件 */}
              </div>
            </div>
            <ToastContainer />
          </QueryClientProvider>
        </AuthProvider>
      </body>
    </html>
  );
}