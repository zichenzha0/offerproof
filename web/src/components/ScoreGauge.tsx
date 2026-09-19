import React from 'react';

interface ScoreGaugeProps {
  score: number;
  trustLevel: string;
  category?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, trustLevel }) => {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const summary =
    normalizedScore > 75
      ? 'High risk. Confirm the company independently before sharing documents or money.'
      : normalizedScore > 40
        ? 'Some details are unconfirmed. Review the evidence below before proceeding.'
        : 'No major red flags in this scan. Still verify the role on an official channel.';

  return (
    <section className="card p-6 sm:p-8">
      <p className="label-text text-[var(--color-muted)]">Risk score</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span className="text-[48px] sm:text-[56px] font-semibold tracking-tight leading-none text-[var(--color-ink)]">
          {normalizedScore}
        </span>
        <span className="label-text text-[var(--color-muted)] mb-1.5">{trustLevel}</span>
      </div>
      <p className="body-text text-[var(--color-muted)] mt-4 max-w-2xl">{summary}</p>
    </section>
  );
};
