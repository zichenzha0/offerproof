import { PresetSample, RecruitmentAuditResult } from './types';

export type CachedReport = {
  job: PresetSample;
  result: RecruitmentAuditResult;
};

const cache = new Map<string, CachedReport>();

export function reportKeyFromSearch(search: URLSearchParams): string | null {
  const url = (search.get('url') || '').trim();
  if (url) return `url:${url}`;
  const company = (search.get('company') || '').trim();
  const domain = (search.get('domain') || '').trim();
  if (company || domain) return `ext:${domain}:${company}`;
  return null;
}

export function normalizeTargetUrl(raw: string): string {
  const rawInput = raw.trim();
  if (!rawInput) return '';
  if (/^https?:\/\//i.test(rawInput)) return rawInput;
  if (rawInput.startsWith('/')) return rawInput;
  return `https://${rawInput}`;
}

export function reportPathForUrl(raw: string): string {
  return `/report?url=${encodeURIComponent(normalizeTargetUrl(raw))}`;
}

export function getCachedReport(key: string): CachedReport | undefined {
  return cache.get(key);
}

export function setCachedReport(key: string, value: CachedReport): void {
  cache.set(key, value);
}
