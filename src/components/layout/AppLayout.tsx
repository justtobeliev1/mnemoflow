"use client";

import React from 'react';
import { AnimatedBackground } from '@/components/ui/animated-background';

interface AppLayoutProps {
  children: React.ReactNode;
  showBackground?: boolean;
  className?: string;
}

export function AppLayout({ 
  children, 
  showBackground = true, 
  className = "min-h-screen bg-background relative" 
}: AppLayoutProps) {
  return (
    <div className={className}>
      {/* 动画背景 */}
      {showBackground && <AnimatedBackground />}
      
      {/* 页面内容 */}
      <div className="relative z-10">
        {children}
      </div>
    </div>
  );
}
