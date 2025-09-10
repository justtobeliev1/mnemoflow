"use client";

import React from "react";
import { cn } from "@/lib/utils";

interface LearningStatsCardProps {
  title: string;
  count: number;
  unit: string;
  className?: string;
}

const LearningStatsCard: React.FC<LearningStatsCardProps> = ({
  title,
  count,
  unit,
  className,
}) => {
  return (
    <div className={cn("glass-surface rounded-xl p-6 text-center", className)}>
      <h3 className="text-sm text-muted mb-2">{title}</h3>
      <div className="flex items-baseline justify-center gap-1">
        <span className="text-3xl font-bold text-foreground">{count}</span>
        <span className="text-sm text-muted">{unit}</span>
      </div>
    </div>
  );
};

export { LearningStatsCard };
