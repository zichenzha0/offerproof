import React from 'react';
import { STATUS, badgeStyle, riskStatus } from '../statusColors';

interface ScoreGaugeProps {
  score: number;
  trustLevel: string;
  category?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, trustLevel }) => {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));
  const status = riskStatus(normalizedScore);
  const summary =
    normalizedScore > 75
      ? 'High concern. Confirm the company independently before sharing documents or money.'
      : normalizedScore > 40
        ? 'Some details are unconfirmed. Review the evidence below carefully before proceeding.'
        : 'No major red flags in this scan. Still verify the role on an official channel.';

  return (
    <section className="card p-6 sm:p-8">
      <p className="label-text text-[var(--color-muted)]">Company legitimacy risk</p>
      <div className="mt-2 flex flex-wrap items-end gap-3">
        <span
          className="text-[48px] sm:text-[56px] font-semibold tracking-tight leading-none"
          style={{ color: STATUS[status].text }}
        >
          {normalizedScore}
        </span>
        {trustLevel && (
          <span className="badge mb-2" style={badgeStyle(status)}>
            {trustLevel}
          </span>
        )}
      </div>
      <p className="body-text text-[var(--color-muted)] mt-4 max-w-2xl">{summary}</p>
    </section>
  );
};
