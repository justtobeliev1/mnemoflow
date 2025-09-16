"use client";

import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bookmark } from "lucide-react";
import { Button } from "@/components/ui/button";

const animations = {
  icon: {
    initial: { scale: 1, rotate: 0 },
    tapActive: { scale: 0.85, rotate: -10 },
    tapCompleted: { scale: 1, rotate: 0 },
  },
  burst: {
    initial: { scale: 0, opacity: 0 },
    animate: { scale: [0, 1.4, 1], opacity: [0, 0.4, 0] },
    transition: { duration: 0.7, ease: "easeOut" },
  },
  particles: (index: number) => {
    const angle = (index / 5) * (2 * Math.PI);
    const radius = 18 + Math.random() * 8;
    const scale = 0.8 + Math.random() * 0.4;
    const duration = 0.6 + Math.random() * 0.1;

    return {
      initial: { scale: 0, opacity: 0.3, x: 0, y: 0 },
      animate: {
        scale: [0, scale, 0],
        opacity: [0.3, 0.8, 0],
        x: [0, Math.cos(angle) * radius],
        y: [0, Math.sin(angle) * radius * 0.75],
      },
      transition: { duration, delay: index * 0.04, ease: "easeOut" },
    } as const;
  },
};

export interface BookmarkIconButtonProps {
  isSaved: boolean;
  onClick: () => void;
  /** 图标直径(px)，默认 48 */
  size?: number;
}

export function BookmarkIconButton({ isSaved, onClick, size = 58 }: BookmarkIconButtonProps) {
  const svgSize = size * 0.5; // bookmark icon尺寸
  const particleBase = size * 0.31; // 粒子运动半径基准
  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size }}>
      <Button
        variant="ghost"
        size="icon"
        onClick={onClick}
        aria-pressed={isSaved}
        className="text-white h-full w-full p-0 hover:bg-transparent focus-visible:ring-0"
      >
        <motion.div
          initial={{ scale: 1 }}
          animate={{ scale: isSaved ? 1.1 : 1 }}
          whileTap={
            isSaved ? animations.icon.tapCompleted : animations.icon.tapActive
          }
          transition={{ type: "spring", stiffness: 300, damping: 15 }}
          className="relative flex items-center justify-center"
        >
          <Bookmark className="opacity-60" size={svgSize} aria-hidden="true" />

          <Bookmark
            className="absolute inset-0 text-white fill-white transition-all duration-300"
            size={svgSize}
            aria-hidden="true"
            style={{ opacity: isSaved ? 1 : 0 }}
          />

          <AnimatePresence>
            {isSaved && (
              <motion.div
                className="absolute inset-0 rounded-full"
                style={{
                  background:
                    "radial-gradient(circle, rgba(255,255,255,0.4) 0%, rgba(255,255,255,0) 80%)",
                }}
                initial={animations.burst.initial as any}
                animate={animations.burst.animate as any}
                transition={animations.burst.transition as any}
              />
            )}
          </AnimatePresence>
        </motion.div>
      </Button>

      <AnimatePresence>
        {isSaved && (
          <motion.div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            {[...Array(5)].map((_, i) => (
              <motion.div
                key={i}
                className="absolute rounded-full bg-white"
                style={{
                  width: `${size * 0.08 + Math.random() * size * 0.02}px`,
                  height: `${size * 0.08 + Math.random() * size * 0.02}px`,
                  filter: "blur(1px)",
                  transform: "translate(-50%, -50%)",
                }}
                initial={animations.particles(i).initial as any}
                animate={{
                  ...animations.particles(i).animate,
                  x: animations.particles(i).animate.x.map((v:any)=> v*(size/48)) as any,
                  y: animations.particles(i).animate.y.map((v:any)=> v*(size/48)) as any,
                } as any}
                transition={animations.particles(i).transition as any}
              />
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
