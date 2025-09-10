import type { Config } from "tailwindcss"

const config: Config = {
  darkMode: ["class"],
  content: [
    './pages/**/*.{ts,tsx}',
    './components/**/*.{ts,tsx}',
    './app/**/*.{ts,tsx}',
    './src/**/*.{ts,tsx}',
  ],
  prefix: "",
  theme: {
    container: {
      center: true,
      padding: "2rem",
      screens: {
        "2xl": "1400px",
      },
    },
    extend: {
      fontFamily: {
        sans: [
          'system-ui',
          '-apple-system',
          'BlinkMacSystemFont',
          'Segoe UI',
          'Roboto',
          'Helvetica Neue',
          'Arial',
          'Noto Sans',
          'sans-serif',
          'PingFang SC',
          'Microsoft YaHei',
        ],
      },
      colors: {
        // 精致黑白主题色方案
        background: "#030303", // 深黑背景
        surface: "#1A1A1A",    // 深灰表面
        foreground: "#FFFFFF", // 纯白前景
        muted: {
          DEFAULT: "#6B7280",   // 蓝灰色文字
          foreground: "#9CA3AF", // 浅蓝灰色
        },
        // 主题色系 - 以白色为主，保留渐变色用于特殊效果
        primary: {
          DEFAULT: "#FFFFFF",   // 纯白主色
          foreground: "#030303", // 黑色文字
        },
        secondary: {
          DEFAULT: "#374151",   // 深灰
          foreground: "#FFFFFF",
        },
        accent: {
          DEFAULT: "#4B5563",   // 中灰
          foreground: "#FFFFFF",
        },
        // 渐变色系 - 仅用于特殊装饰效果
        gradient: {
          indigo: "#A5B4FC",
          white: "#FFFFFF", 
          rose: "#FDA4AF",
        },
        // 保留原有的indigo/rose用于渐变
        indigo: {
          DEFAULT: "#6366F1",
          300: "#A5B4FC",
          500: "#6366F1",
        },
        rose: {
          DEFAULT: "#F43F5E", 
          300: "#FDA4AF",
          500: "#F43F5E",
        },
        violet: {
          DEFAULT: "#8B5CF6",
          500: "#8B5CF6",
        },
        border: "rgba(255, 255, 255, 0.08)",
        input: "#1A1A1A",
        ring: "#FFFFFF",
      },
      borderRadius: {
        lg: "16px",
        md: "12px",
        sm: "8px",
      },
      keyframes: {
        "accordion-down": {
          from: { height: "0" },
          to: { height: "var(--radix-accordion-content-height)" },
        },
        "accordion-up": {
          from: { height: "var(--radix-accordion-content-height)" },
          to: { height: "0" },
        },
      },
      animation: {
        "accordion-down": "accordion-down 0.2s ease-out",
        "accordion-up": "accordion-up 0.2s ease-out",
      },
      backdropBlur: {
        xs: '2px',
      },
    },
  },
  plugins: [require("tailwindcss-animate")],
} satisfies Config

export default config
