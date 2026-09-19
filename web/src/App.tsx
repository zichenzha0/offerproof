import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate, useSearchParams } from 'react-router-dom';
import { PresetSample, RecruitmentAuditResult } from './types';
import { ScoreGauge } from './components/ScoreGauge';
import { ScreenshotFiveBlocksTable } from './components/ScreenshotFiveBlocksTable';
import {
  getCachedReport,
  normalizeTargetUrl,
  reportKeyFromSearch,
  reportPathForUrl,
  setCachedReport,
} from './reportCache';
import { ArrowRight, Loader2 } from 'lucide-react';

export default function App() {
  const navigate = useNavigate();
  const location = useLocation();
  const [searchParams] = useSearchParams();

  const reportKey = location.pathname === '/report' ? reportKeyFromSearch(searchParams) : null;
  const researchedUrl = (searchParams.get('url') || '').trim();

  const [selectedJob, setSelectedJob] = useState<PresetSample | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<RecruitmentAuditResult | null>(null);
  const [quickUrlInput, setQuickUrlInput] = useState<string>('');
  const [quickUrlError, setQuickUrlError] = useState<string | null>(null);

  useEffect(() => {
    if (location.pathname !== '/') return;
    const company = (searchParams.get('company') || '').trim();
    const domain = (searchParams.get('domain') || '').trim();
    const url = (searchParams.get('url') || '').trim();
    if (!company && !domain && !url) return;
    navigate({ pathname: '/report', search: location.search }, { replace: true });
  }, [location.pathname, location.search, navigate, searchParams]);

  useEffect(() => {
    if (location.pathname === '/report' && !reportKey) {
      navigate('/', { replace: true });
    }
  }, [location.pathname, reportKey, navigate]);

  useEffect(() => {
    setQuickUrlInput(researchedUrl);
    setQuickUrlError(null);

    if (!reportKey) {
      setSelectedJob(null);
      setAuditResult(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    const cached = getCachedReport(reportKey);
    if (cached) {
      setSelectedJob(cached.job);
      setAuditResult(cached.result);
      setError(null);
      setIsLoading(false);
      return;
    }

    const controller = new AbortController();
    void loadReport(reportKey, searchParams, controller.signal);
    return () => controller.abort();
  }, [reportKey, researchedUrl]);

  const runAuditForJob = async (
    jobToAudit: PresetSample,
    cacheKey: string,
    signal?: AbortSignal,
  ) => {
    const textToAnalyze = jobToAudit.content;
    if (!textToAnalyze.trim()) {
      setError('Please provide a URL to evaluate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToAnalyze,
          category: jobToAudit.category.toLowerCase(),
        }),
        signal,
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Audit service error (${res.status})`);
      }

      const parsed: RecruitmentAuditResult = await res.json();
      if (signal?.aborted) return;
      setAuditResult(parsed);
      setCachedReport(cacheKey, { job: jobToAudit, result: parsed });
    } catch (err: unknown) {
      if (signal?.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
      const msg = err instanceof Error ? err.message : 'Audit failed.';
      setError(msg);
    } finally {
      if (!signal?.aborted) setIsLoading(false);
    }
  };

  const loadReport = async (key: string, params: URLSearchParams, signal: AbortSignal) => {
    setIsLoading(true);
    setAuditResult(null);
    setError(null);
    setSelectedJob(null);

    try {
      const url = (params.get('url') || '').trim();
      let job: PresetSample;

      if (url) {
        const res = await fetch('/api/parse-url', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ url: normalizeTargetUrl(url) }),
          signal,
        });
        if (!res.ok) {
          const errorData = await res.json().catch(() => ({}));
          throw new Error(errorData.error || `HTTP ${res.status}: Failed to retrieve URL.`);
        }
        const data = await res.json();
        let hostname = 'portal';
        try {
          hostname = new URL(data.url).hostname;
        } catch {
          // fallback
        }
        job = {
          id: key,
          title: data.title || 'Parsed listing',
          company: data.company || 'Organization',
          location: data.location || 'Unspecified',
          salary: data.salary || 'To be audited',
          postedTime: 'Just parsed',
          category: 'Legitimate',
          subtitle: hostname,
          threatSummary: '',
          tags: [],
          content: data.rawText || data.description || url,
          officialDomain: hostname,
          companyUrl: data.companyUrl || url,
          jobUrl: data.jobUrl,
          isCompanyOnly: Boolean(data.isCompanyOnly),
        };
      } else {
        const company = (params.get('company') || '').trim();
        const domain = (params.get('domain') || '').trim();
        const hostname = domain || 'unknown-domain';
        job = {
          id: key,
          title: company ? `${company} scan` : `Domain scan · ${hostname}`,
          company: company || hostname,
          location: 'Captured from extension',
          salary: 'To be audited',
          postedTime: 'Opened from extension',
          category: 'Legitimate',
          subtitle: hostname,
          threatSummary: '',
          tags: [],
          content: `Company: ${company || hostname}\nDomain: ${hostname}\nSource: OfferProof Chrome extension`,
          officialDomain: hostname,
        };
      }

      if (signal.aborted) return;
      setSelectedJob(job);
      await runAuditForJob(job, key, signal);
    } catch (err) {
      if (signal.aborted || (err instanceof DOMException && err.name === 'AbortError')) return;
      const msg = err instanceof Error ? err.message : 'Could not verify this URL.';
      setQuickUrlError(msg);
      setError(msg);
      setIsLoading(false);
    }
  };

  const handleQuickUrlVerify = (e: React.FormEvent) => {
    e.preventDefault();
    const rawInput = quickUrlInput.trim();
    if (!rawInput) return;
    setQuickUrlError(null);
    navigate(reportPathForUrl(rawInput));
  };

  return (
    <div className="min-h-screen flex flex-col">
      <header className="sticky top-0 z-40 border-b border-[var(--color-line)] bg-[var(--color-page)]/90 backdrop-blur-sm">
        <div className="max-w-3xl mx-auto px-5 h-16 flex items-center justify-between gap-4">
          <Link to="/" className="text-[16px] font-semibold tracking-tight text-[var(--color-ink)]">
            OfferProof
          </Link>

          {reportKey && (
            <form onSubmit={handleQuickUrlVerify} className="hidden sm:flex items-center flex-1 max-w-md">
              <input
                type="text"
                value={quickUrlInput}
                onChange={(e) => setQuickUrlInput(e.target.value)}
                placeholder="Paste another URL"
                className="w-full bg-white border border-[var(--color-line)] rounded-[12px] px-3.5 py-2 text-[14px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
            </form>
          )}

          {reportKey && (
            <Link
              to="/"
              className="label-text text-[var(--color-muted)] hover:text-[var(--color-ink)]"
            >
              New search
            </Link>
          )}
        </div>
      </header>

      <div className="max-w-3xl mx-auto w-full px-5 py-10 flex-1 flex flex-col">
        {!reportKey && (
          <section className="flex-1 flex flex-col items-center justify-center py-20">
            <h1 className="hero-title text-center text-[var(--color-ink)]">
              Check a job or company
            </h1>
            <p className="body-text text-[var(--color-muted)] text-center mt-4 max-w-xl">
              Paste a careers page, listing, or company site. The report appears after the scan.
            </p>
            <form onSubmit={handleQuickUrlVerify} className="w-full max-w-xl mt-10 flex gap-2">
              <input
                type="text"
                value={quickUrlInput}
                onChange={(e) => setQuickUrlInput(e.target.value)}
                placeholder="https://company.com or a job URL"
                autoFocus
                className="flex-1 min-w-0 bg-white border border-[var(--color-line)] rounded-[14px] px-4 py-3.5 text-[16px] text-[var(--color-ink)] placeholder:text-[var(--color-muted)] focus:outline-none focus:border-[var(--color-accent)]"
              />
              <button
                type="submit"
                disabled={!quickUrlInput.trim()}
                className="px-5 py-3.5 rounded-[14px] bg-[var(--color-accent)] hover:bg-[var(--color-accent-hover)] disabled:opacity-40 text-white text-[16px] font-semibold inline-flex items-center gap-2"
              >
                <ArrowRight className="w-4 h-4" />
                Check
              </button>
            </form>
            {quickUrlError && <p className="label-text text-[var(--color-muted)] mt-4">{quickUrlError}</p>}
          </section>
        )}

        {reportKey && (
          <main className="flex-1 w-full flex flex-col gap-5">
            {error && (
              <div className="card px-6 py-4 body-text text-[var(--color-muted)]">{error}</div>
            )}

            {isLoading && (
              <div className="card px-6 py-16 flex flex-col items-center justify-center text-center gap-3">
                <Loader2 className="w-5 h-5 text-[var(--color-muted)] animate-spin" />
                <p className="body-text text-[var(--color-muted)]">Checking this URL…</p>
              </div>
            )}

            {!isLoading && auditResult && selectedJob && (
              <>
                <ScoreGauge
                  score={auditResult.ghost_score}
                  trustLevel={auditResult.trust_level}
                />
                {auditResult.five_blocks && (
                  <ScreenshotFiveBlocksTable
                    fiveBlocks={auditResult.five_blocks}
                    companyName={selectedJob.company}
                    roleTitle={selectedJob.title}
                    companyUrl={selectedJob.companyUrl}
                    jobUrl={selectedJob.jobUrl}
                    isCompanyOnly={selectedJob.isCompanyOnly || auditResult.is_company_only}
                  />
                )}
              </>
            )}
          </main>
        )}
      </div>
    </div>
  );
}
