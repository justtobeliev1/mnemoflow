"use client";

export interface BreakScreenProps {
  title?: string;
  description?: string;
  onContinue?: () => void;
  onExit?: () => void;
  primaryLabel?: string;
  secondaryLabel?: string;
}

export function BreakScreen({
  title = 'Congrats！本轮已完成。',
  description,
  onContinue,
  onExit,
  primaryLabel = '开始下一轮',
  secondaryLabel = '返回首页',
}: BreakScreenProps) {
  return (
    <div className="w-full flex flex-col items-center justify-center text-center gap-6 py-16">
      <h2 className="text-2xl md:text-3xl font-extrabold text-foreground">{title}</h2>
      {description && <p className="text-muted max-w-2xl whitespace-pre-line">{description}</p>}
      <div className="flex gap-3">
        {onContinue && (
          <button className="px-5 py-2 rounded-lg bg-primary text-primary-foreground" onClick={onContinue}>{primaryLabel}</button>
        )}
        {onExit && (
          <button className="px-5 py-2 rounded-lg border border-border" onClick={onExit}>{secondaryLabel}</button>
        )}
      </div>
    </div>
  );
}

export default BreakScreen;
