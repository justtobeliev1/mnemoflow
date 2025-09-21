"use client";
import React, { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import { AnimatePresence, motion, LayoutGroup } from "framer-motion";
import { cn } from "@/lib/utils";

export const FlipWords = ({
  words,
  duration = 3000,
  className,
}: {
  words: string[];
  duration?: number;
  className?: string;
}) => {
  const [currentWord, setCurrentWord] = useState(words[0]);
  const [isAnimating, setIsAnimating] = useState<boolean>(false);
  const containerRef = useRef<HTMLDivElement | null>(null);

  // thanks for the fix Julian - https://github.com/Julian-AT
  const startAnimation = useCallback(() => {
    const word = words[words.indexOf(currentWord) + 1] || words[0];
    setCurrentWord(word);
    setIsAnimating(true);
  }, [currentWord, words]);

  useEffect(() => {
    if (!isAnimating)
      setTimeout(() => {
        startAnimation();
      }, duration);
  }, [isAnimating, duration, startAnimation]);

  // 让整个单词呈现连续的渐变：为每个字母计算相对偏移并定位同一条渐变
  const applyContinuousGradient = useCallback(() => {
    const container = containerRef.current;
    if (!container) return;

    const containerRect = container.getBoundingClientRect();
    const containerWidth = containerRect.width || 1;
    const letters = container.querySelectorAll<HTMLElement>('[data-flip-letter="true"]');

    letters.forEach((el) => {
      const rect = el.getBoundingClientRect();
      const offsetLeft = rect.left - containerRect.left;

      el.style.backgroundImage = "linear-gradient(90deg, #A5B4FC 0%, #FFFFFF 50%, #FDA4AF 100%)";
      el.style.backgroundRepeat = "no-repeat";
      el.style.backgroundSize = `${containerWidth}px 100%`;
      el.style.backgroundPosition = `${-offsetLeft}px 0px`;
      (el.style as any).webkitBackgroundClip = "text";
      el.style.backgroundClip = "text";
      el.style.color = "transparent";
    });
  }, []);

  useLayoutEffect(() => {
    applyContinuousGradient();
  }, [currentWord, applyContinuousGradient]);

  useEffect(() => {
    const onResize = () => applyContinuousGradient();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [applyContinuousGradient]);

  return (
    <AnimatePresence
      onExitComplete={() => {
        setIsAnimating(false);
      }}
    >
      <motion.div
        initial={{
          opacity: 0,
          y: 10,
        }}
        animate={{
          opacity: 1,
          y: 0,
        }}
        transition={{
          type: "spring",
          stiffness: 100,
          damping: 10,
        }}
        exit={{
          opacity: 0,
          y: -40,
          x: 40,
          filter: "blur(8px)",
          scale: 2,
          position: "absolute",
        }}
        className={cn(
          "z-10 inline-block relative text-left text-foreground px-2",
          className
        )}
        key={currentWord}
        ref={containerRef}
      >
        {/* edit suggested by Sajal: https://x.com/DewanganSajal */}
        {currentWord.split(" ").map((word, wordIndex) => (
          <motion.span
            key={word + wordIndex}
            initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
            animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
            transition={{
              delay: wordIndex * 0.3,
              duration: 0.3,
            }}
            className="inline-block whitespace-nowrap"
          >
            {word.split("").map((letter, letterIndex) => (
              <motion.span
                key={word + letterIndex}
                initial={{ opacity: 0, y: 10, filter: "blur(8px)" }}
                animate={{ opacity: 1, y: 0, filter: "blur(0px)" }}
                transition={{
                  delay: wordIndex * 0.3 + letterIndex * 0.05,
                  duration: 0.2,
                }}
                className="inline-block"
                data-flip-letter="true"
              >
                {letter}
              </motion.span>
            ))}
            <span className="inline-block">&nbsp;</span>
          </motion.span>
        ))}
      </motion.div>
    </AnimatePresence>
  );
};