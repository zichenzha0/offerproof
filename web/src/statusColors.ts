import type { CSSProperties } from 'react';

// Central evidence/status color system — professional AI/research palette.
// Evidence-based philosophy: green = strong evidence, blue = mixed/neutral,
// slate = limited/unknown, amber = caution ("review carefully"),
// red = high concern ONLY. Never use red for ordinary uncertainty.

export type StatusKey = 'strong' | 'mixed' | 'limited' | 'caution' | 'high';

export interface StatusStyle {
  bg: string;
  text: string;
  border: string;
  label: string;
}

export const STATUS: Record<StatusKey, StatusStyle> = {
  strong: { bg: '#DCFCE7', text: '#166534', border: '#22C55E', label: 'Strong evidence' },
  mixed: { bg: '#DBEAFE', text: '#1E40AF', border: '#3B82F6', label: 'Mixed evidence' },
  limited: { bg: '#F1F5F9', text: '#475569', border: '#94A3B8', label: 'Limited evidence' },
  caution: { bg: '#FEF3C7', text: '#92400E', border: '#F59E0B', label: 'Caution' },
  high: { bg: '#FEE2E2', text: '#991B1B', border: '#EF4444', label: 'High concern' },
};

// Risk score (0-100, higher = worse). Only genuine high risk turns red;
// moderate uncertainty stays neutral slate, elevated is amber caution.
export function riskStatus(score: number): StatusKey {
  const s = Math.max(0, Math.min(100, score || 0));
  if (s >= 75) return 'high';
  if (s >= 55) return 'caution';
  if (s >= 35) return 'limited';
  return 'strong';
}

// Classify a five-block result string into an evidence status.
// `key` disambiguates rows where the same word means opposite things
// (e.g. role_substance "High" = real work = good; risk_signals "High concern" = bad).
export function evidenceStatus(result: string, key?: string): StatusKey {
  const r = (result || '').toLowerCase();

  if (key === 'role_substance') {
    if (r.includes('company-only')) return 'limited';
    if (r.includes('high')) return 'strong';
    if (r.includes('low–medium') || r.includes('low-medium') || r.includes('medium')) return 'mixed';
    if (r.includes('low')) return 'caution';
    return 'limited';
  }

  if (key === 'risk_signals') {
    if (r.includes('high concern')) return 'high';
    if (r.includes('medium') || r.includes('caution')) return 'caution';
    if (r.includes('low')) return 'strong';
    return 'limited';
  }

  // Generic rows: firm substance, people credibility, past outcomes.
  if (r.includes('high concern') || r.includes('danger')) return 'high';
  if (r.includes('strong')) return 'strong';
  if (r.includes('mixed')) return 'mixed';
  if (r.includes('weak') || r.includes('none found')) return 'caution';
  if (r.includes('limited') || r.includes('unclear') || r.includes('company-only') || r.includes('unknown'))
    return 'limited';
  return 'limited';
}

export function badgeStyle(status: StatusKey): CSSProperties {
  const s = STATUS[status];
  return { backgroundColor: s.bg, color: s.text, border: `1px solid ${s.border}` };
}
