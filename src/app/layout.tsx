import type { Metadata } from "next";
import "./globals.css";

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
      <body className="font-sans antialiased">{children}</body>
    </html>
  );
}
