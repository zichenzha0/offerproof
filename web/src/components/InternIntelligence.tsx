import React, { useMemo, useState } from 'react';
import { InternIntel, InternIntelReview } from '../types';
import { ExternalLink, Lock, MessageSquareQuote } from 'lucide-react';
import { STATUS, StatusKey, badgeStyle, riskStatus } from '../statusColors';

interface InternIntelligenceProps {
  intel: InternIntel;
  companyRiskScore: number; // ghost_score (firm legitimacy risk, higher = worse)
  companyTrustLevel: string;
}

// Risk score -> status text color, from the shared evidence palette.
// Meaning is always paired with a text label so it never depends on color alone.
function riskColor(score: number): string {
  return STATUS[riskStatus(score)].text;
}

function isUnpaid(comp: string): boolean {
  const c = (comp || '').toLowerCase();
  return c.includes('unpaid') || c.includes('$0') || c.includes('no pay');
}

const SENTIMENT_STATUS: Record<string, { label: string; status: StatusKey }> = {
  positive: { label: 'Positive', status: 'strong' },
  mixed: { label: 'Mixed', status: 'mixed' },
  negative: { label: 'Negative', status: 'high' },
};

const WORK_TYPE_LABEL: Record<string, string> = {
  modeling: 'Modeling',
  sourcing: 'Sourcing',
  cold_calling: 'Cold calling',
  admin: 'Admin',
  other: 'Core work',
};

export const InternIntelligence: React.FC<InternIntelligenceProps> = ({
  intel,
  companyRiskScore,
  companyTrustLevel,
}) => {
  const [payFilter, setPayFilter] = useState<'all' | 'paid' | 'unpaid'>('all');

  const reviews = useMemo<InternIntelReview[]>(() => {
    if (payFilter === 'all') return intel.reviews;
    return intel.reviews.filter((r) =>
      payFilter === 'paid' ? !isUnpaid(r.comp) : isUnpaid(r.comp),
    );
  }, [intel.reviews, payFilter]);

  if (!intel.matched) {
    return (
      <section className="card p-6 sm:p-8">
        <p className="label-text text-[var(--color-muted)]">Intern intelligence · via WSO forum</p>
        <p className="body-text text-[var(--color-muted)] mt-3">
          {intel.message || 'No Wall Street Oasis intern reports matched this company yet.'}
        </p>
      </section>
    );
  }

  const roleRisk = intel.role_risk_score ?? 0;
  const stats = intel.stats;

  return (
    <section className="card overflow-hidden">
      <div className="px-6 sm:px-8 pt-6 sm:pt-8 pb-2">
        <p className="label-text text-[var(--color-muted)]">Intern intelligence · via WSO forum</p>

        {/* Dual score: firm legitimacy vs internship risk */}
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 gap-3">
          <div className="rounded-[14px] border border-[var(--color-line)] p-5">
            <div className="label-text text-[var(--color-muted)]">Firm legitimacy risk</div>
            <div className="mt-2 flex items-end gap-2">
              <span
                className="text-[40px] font-semibold leading-none"
                style={{ color: riskColor(companyRiskScore) }}
              >
                {Math.max(0, Math.min(100, Math.round(companyRiskScore || 0)))}
              </span>
              {companyTrustLevel && (
                <span className="badge mb-1.5" style={badgeStyle(riskStatus(companyRiskScore))}>
                  {companyTrustLevel}
                </span>
              )}
            </div>
            <div className="body-text text-[var(--color-muted)] mt-2">Is the company real?</div>
          </div>

          <div className="rounded-[14px] border border-[var(--color-line)] p-5">
            <div className="label-text text-[var(--color-muted)]">Internship risk</div>
            <div className="mt-2 flex items-end gap-2">
              <span className="text-[40px] font-semibold leading-none" style={{ color: riskColor(roleRisk) }}>
                {roleRisk}
              </span>
              <span className="badge mb-1.5" style={badgeStyle(riskStatus(roleRisk))}>
                {intel.risk_level}
              </span>
            </div>
            <div className="body-text text-[var(--color-muted)] mt-2">Is the role worth it?</div>
          </div>
        </div>

        {intel.verdict && (
          <p className="body-text text-[var(--color-ink)] mt-4 font-medium">{intel.verdict}</p>
        )}

        {/* Aggregate stat chips */}
        {stats && (
          <div className="mt-4 flex flex-wrap gap-2">
            {stats.avg_hours_per_week != null && (
              <Chip label={`~${stats.avg_hours_per_week}h / week`} />
            )}
            {stats.unpaid_share != null && (
              <Chip label={stats.unpaid_share >= 0.5 ? 'Mostly unpaid' : 'Mostly paid'} />
            )}
            {stats.intern_to_ft_ratio && <Chip label={`${stats.intern_to_ft_ratio} intern-to-staff`} />}
            {stats.return_offer_rate != null && (
              <Chip label={`${Math.round(stats.return_offer_rate * 100)}% return offers`} />
            )}
            <Chip label={`${stats.review_count} WSO reports`} muted />
          </div>
        )}
      </div>

      {/* Vector breakdown */}
      <div className="px-6 sm:px-8 pt-5 pb-2">
        <div className="label-text text-[var(--color-muted)] mb-3">Role / intern risk breakdown</div>
        <div className="flex flex-col gap-4">
          {(intel.vectors || []).map((v) => (
            <div key={v.key}>
              <div className="flex items-center justify-between gap-3">
                <span className="text-[15px] font-medium text-[var(--color-ink)]">{v.label}</span>
                <span className="label-text" style={{ color: riskColor(v.score) }}>
                  {v.level}
                </span>
              </div>
              <div className="mt-1.5 h-2 rounded-full bg-[var(--color-line)] overflow-hidden">
                <div
                  className="h-full rounded-full"
                  style={{ width: `${v.score}%`, backgroundColor: STATUS[riskStatus(v.score)].border }}
                />
              </div>
              <p className="body-text text-[var(--color-muted)] mt-1.5 m-0">{v.evidence}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Filter bar (candidate conditions) */}
      <div className="px-6 sm:px-8 pt-5">
        <div className="label-text text-[var(--color-muted)] mb-2">Filter by your conditions</div>
        <div className="flex flex-wrap gap-2">
          <FilterChip active={payFilter === 'all'} onClick={() => setPayFilter('all')}>
            All
          </FilterChip>
          <FilterChip active={payFilter === 'paid'} onClick={() => setPayFilter('paid')}>
            Paid only
          </FilterChip>
          <FilterChip active={payFilter === 'unpaid'} onClick={() => setPayFilter('unpaid')}>
            Unpaid only
          </FilterChip>
          <ProChip>Class year</ProChip>
          <ProChip>Remote</ProChip>
          <ProChip>Off-season</ProChip>
        </div>
      </div>

      {/* Anonymous reviews feed */}
      <div className="px-6 sm:px-8 py-6 mt-4 border-t border-[var(--color-line)]">
        <div className="label-text text-[var(--color-muted)] mb-3">
          Anonymous intern reports ({reviews.length})
        </div>
        <div className="flex flex-col gap-4">
          {reviews.map((r, i) => {
            const s = SENTIMENT_STATUS[r.sentiment] || SENTIMENT_STATUS.mixed;
            return (
              <div key={i} className="rounded-[14px] border border-[var(--color-line)] p-4">
                <div className="flex items-start gap-2">
                  <MessageSquareQuote className="w-4 h-4 mt-1 shrink-0 text-[var(--color-muted)]" />
                  <p className="body-text text-[var(--color-ink)] m-0">{r.quote}</p>
                </div>
                <div className="mt-3 flex flex-wrap items-center gap-2">
                  <span className="badge" style={badgeStyle(s.status)}>
                    {s.label}
                  </span>
                  {r.work_type && <Chip label={WORK_TYPE_LABEL[r.work_type] || r.work_type} muted />}
                  {r.comp && <Chip label={r.comp} muted />}
                  {r.hours_per_week != null && <Chip label={`${r.hours_per_week}h/wk`} muted />}
                  {typeof r.return_offer === 'boolean' && (
                    <Chip label={r.return_offer ? 'Return offer' : 'No return offer'} muted />
                  )}
                  {r.source_url && (
                    <a
                      href={r.source_url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="label-text inline-flex items-center gap-1 text-[var(--color-accent)] hover:text-[var(--color-accent-hover)] ml-auto"
                    >
                      via WSO forum
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  )}
                </div>
              </div>
            );
          })}
          {reviews.length === 0 && (
            <p className="body-text text-[var(--color-muted)]">No reports match this filter.</p>
          )}
        </div>
      </div>
    </section>
  );
};

const Chip: React.FC<{ label: string; muted?: boolean }> = ({ label, muted }) => (
  <span
    className={`label-text px-2.5 py-1 rounded-full border border-[var(--color-line)] ${
      muted ? 'text-[var(--color-muted)]' : 'text-[var(--color-ink)]'
    }`}
  >
    {label}
  </span>
);

const FilterChip: React.FC<{ active: boolean; onClick: () => void; children: React.ReactNode }> = ({
  active,
  onClick,
  children,
}) => (
  <button
    type="button"
    onClick={onClick}
    className={`label-text px-3 py-1.5 rounded-full border transition-colors ${
      active
        ? 'bg-[var(--color-accent)] text-white border-[var(--color-accent)]'
        : 'border-[var(--color-line)] text-[var(--color-muted)] hover:text-[var(--color-ink)]'
    }`}
  >
    {children}
  </button>
);

const ProChip: React.FC<{ children: React.ReactNode }> = ({ children }) => (
  <span
    title="Premium filter"
    className="label-text px-3 py-1.5 rounded-full border border-dashed border-[var(--color-line)] text-[var(--color-muted)] inline-flex items-center gap-1 opacity-70"
  >
    <Lock className="w-3 h-3" />
    {children}
  </span>
);
