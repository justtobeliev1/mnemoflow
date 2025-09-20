"use client";

import { ArrowRight } from 'lucide-react';

export interface NextArrowButtonProps {
  onClick?: () => void;
  label?: string;
  disabled?: boolean;
}

export function NextArrowButton({ onClick, label, disabled }: NextArrowButtonProps) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className="p-2 text-white/80 hover:text-white transition-colors rounded-full focus:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 ring-offset-background disabled:opacity-50 disabled:pointer-events-none"
      title={label}
    >
      <svg t="1758350352369" className="w-10 h-10" viewBox="0 0 1024 1024" version="1.1" xmlns="http://www.w3.org/2000/svg"><path d="M825.6 544H128.7168a32 32 0 1 1 0-64h696.8832a32 32 0 0 1 0 64z" fill="currentColor"></path><path d="M597.4528 798.72a32 32 0 0 1-22.6304-54.6304L806.656 512l-231.8336-231.8336a32 32 0 1 1 45.2608-45.2608L897.1264 512l-277.0432 277.0944a31.8976 31.8976 0 0 1-22.6304 9.6256z" fill="currentColor"></path></svg>
    </button>
  );
}


