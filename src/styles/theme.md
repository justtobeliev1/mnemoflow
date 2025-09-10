# Mnemoflow 主题色方案

## 设计理念
基于用户偏好创建的精致黑白主题，保留了高品质的蓝灰色文字和特殊渐变效果。

## 配色系统

### 🎨 基础色彩
```css
/* 背景层 */
--background: #030303     /* 深黑背景 - 营造专注氛围 */
--surface: #1A1A1A        /* 深灰表面 - 磨砂玻璃组件背景 */

/* 文字层 */
--foreground: #FFFFFF     /* 纯白前景 - 主要文字颜色 */
--muted: #6B7280          /* 蓝灰色 - 次要文字，优雅而不突兀 */
--muted-foreground: #9CA3AF /* 浅蓝灰 - 辅助文字 */
```

### 🤍 主题色系
```css
/* 主色调 - 以白色为主 */
--primary: #FFFFFF        /* 纯白主色 - 按钮、强调元素 */
--primary-foreground: #030303 /* 黑色文字 - 白色背景上的文字 */

/* 辅助色 */
--secondary: #374151      /* 深灰 - 次要元素 */
--accent: #4B5563         /* 中灰 - 装饰元素 */
```

### 🌈 特殊渐变色 (仅用于装饰效果)
```css
/* 靛紫→白色→玫瑰色渐变 - 用于特殊悬停效果 */
gradient-indigo: #A5B4FC
gradient-white: #FFFFFF  
gradient-rose: #FDA4AF

/* 应用示例 */
.gradient-hover {
  background: linear-gradient(to right, #A5B4FC, #FFFFFF, #FDA4AF);
}
```

### 🔗 系统色
```css
--border: rgba(255, 255, 255, 0.08) /* 半透明边框 */
--input: #1A1A1A          /* 输入框背景 */
--ring: #FFFFFF           /* 焦点环颜色 */
```

## 使用指南

### ✅ 推荐用法
1. **主要文字**: 使用 `text-foreground` (纯白)
2. **次要文字**: 使用 `text-muted` (蓝灰色)
3. **按钮**: 使用 `bg-primary` (白色) + `text-primary-foreground` (黑色)
4. **组件背景**: 使用 `glass-surface` 类 (磨砂玻璃效果)
5. **特殊悬停**: 使用渐变色 `from-indigo-300 via-white to-rose-300`

### 🎯 设计原则
1. **主色调**: 以白色为主，营造简洁专业感
2. **文字层次**: 蓝灰色系文字，优雅而有层次
3. **装饰点缀**: 适度使用靛紫-玫瑰渐变作为视觉亮点
4. **磨砂玻璃**: 所有组件使用统一的玻璃拟态效果

### 🚫 避免使用
- 纯紫色作为主色调
- 过多彩色元素
- 高饱和度颜色
- 与主题不符的鲜艳颜色

## 组件应用示例

### 按钮
```tsx
// 主按钮
<button className="bg-primary text-primary-foreground hover:bg-gradient-to-r hover:from-indigo-300 hover:via-white hover:to-rose-300">

// 次要按钮  
<button className="bg-secondary text-secondary-foreground">
```

### 文字
```tsx
// 标题
<h1 className="text-foreground">

// 正文
<p className="text-muted">

// 辅助文字
<span className="text-muted-foreground">
```

### 组件背景
```tsx
// 卡片/模态框
<div className="glass-surface">
```

这套主题色方案确保了整个应用的视觉一致性，既保持了简洁专业的黑白基调，又通过精心选择的蓝灰色文字和特殊渐变效果增加了视觉层次和品质感。
