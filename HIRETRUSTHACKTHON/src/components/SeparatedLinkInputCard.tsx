import React, { useState } from 'react';
import { Building2, Briefcase, Link2, Search, ArrowRight, Sparkles, ShieldCheck, AlertCircle, RefreshCw } from 'lucide-react';

interface SeparatedLinkInputCardProps {
  onRunAudit: (params: {
    companyUrl?: string;
    jobUrl?: string;
    isCompanyOnly: boolean;
    customText?: string;
  }) => void;
  isLoading: boolean;
}

export const SeparatedLinkInputCard: React.FC<SeparatedLinkInputCardProps> = ({
  onRunAudit,
  isLoading,
}) => {
  const [activeMode, setActiveMode] = useState<'company' | 'job' | 'both'>('company');
  const [companyUrl, setCompanyUrl] = useState('');
  const [jobUrl, setJobUrl] = useState('');
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedComp = companyUrl.trim();
    const trimmedJob = jobUrl.trim();

    if (activeMode === 'company' && !trimmedComp) {
      setErrorMessage('Please enter a company website link to verify if the company is real or a scam.');
      return;
    }
    if (activeMode === 'job' && !trimmedJob) {
      setErrorMessage('Please enter a job requisition link to verify.');
      return;
    }
    if (activeMode === 'both' && !trimmedComp && !trimmedJob) {
      setErrorMessage('Please enter at least a company website link or job link.');
      return;
    }

    const isCompanyOnly = activeMode === 'company' || (Boolean(trimmedComp) && !trimmedJob);

    onRunAudit({
      companyUrl: trimmedComp || undefined,
      jobUrl: trimmedJob || undefined,
      isCompanyOnly,
    });
  };

  const handleApplyPreset = (preset: 'xyz' | 'nexus' | 'kalshi') => {
    setErrorMessage('');
    if (preset === 'xyz') {
      setActiveMode('both');
      setCompanyUrl('https://xyzcapital.com');
      setJobUrl('https://xyzcapital.com/careers/ib-intern-2026');
      onRunAudit({
        companyUrl: 'https://xyzcapital.com',
        jobUrl: 'https://xyzcapital.com/careers/ib-intern-2026',
        isCompanyOnly: false,
      });
    } else if (preset === 'nexus') {
      setActiveMode('company');
      setCompanyUrl('https://nexuscreativestudio.agency');
      setJobUrl('');
      onRunAudit({
        companyUrl: 'https://nexuscreativestudio.agency',
        isCompanyOnly: true,
      });
    } else {
      setActiveMode('job');
      setCompanyUrl('https://kalshi.com');
      setJobUrl('https://jobs.ashbyhq.com/kalshi/3dd97725-4a12-4963-b47a-cb5c562cfd1d');
      onRunAudit({
        companyUrl: 'https://kalshi.com',
        jobUrl: 'https://jobs.ashbyhq.com/kalshi/3dd97725-4a12-4963-b47a-cb5c562cfd1d',
        isCompanyOnly: false,
      });
    }
  };

  return (
    <div id="separated-link-input-card" className="rounded-2xl border border-blue-200 bg-white p-4 shadow-xs space-y-3.5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-blue-50 text-blue-600 border border-blue-100">
            <Link2 className="w-4 h-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-slate-900 uppercase tracking-wide font-mono">
              Target Link Auditor
            </h3>
            <p className="text-[11px] text-slate-500">
              Separated Company Website & Job Link Verification
            </p>
          </div>
        </div>
        <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold">
          Screenshot Rule
        </span>
      </div>

      {/* Mode Switcher Tabs */}
      <div className="grid grid-cols-3 gap-1 p-1 bg-slate-100 rounded-xl">
        <button
          type="button"
          onClick={() => {
            setActiveMode('company');
            setErrorMessage('');
          }}
          className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'company'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Building2 className="w-3.5 h-3.5" />
          <span className="truncate">🏢 Company Link</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('job');
            setErrorMessage('');
          }}
          className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'job'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Briefcase className="w-3.5 h-3.5" />
          <span className="truncate">📄 Job Link</span>
        </button>

        <button
          type="button"
          onClick={() => {
            setActiveMode('both');
            setErrorMessage('');
          }}
          className={`text-xs py-1.5 px-2 rounded-lg font-medium transition-all flex items-center justify-center gap-1.5 ${
            activeMode === 'both'
              ? 'bg-white text-blue-700 shadow-xs font-semibold'
              : 'text-slate-600 hover:text-slate-900'
          }`}
        >
          <Link2 className="w-3.5 h-3.5" />
          <span className="truncate">🔗 Both Links</span>
        </button>
      </div>

      {/* Mode Explanation Banner */}
      <div className="text-[11px] px-3 py-2 rounded-xl bg-slate-50 border border-slate-200/80 text-slate-600 flex items-start gap-2">
        <ShieldCheck className="w-3.5 h-3.5 text-blue-600 shrink-0 mt-0.5" />
        <div>
          {activeMode === 'company' && (
            <span>
              <strong>Website-Only Audit:</strong> Enter just a company link (e.g. boutique firm, agency, or startup). Verifies if the company is authentic or a scam/shell firm using the 5 Screenshot Blocks.
            </span>
          )}
          {activeMode === 'job' && (
            <span>
              <strong>Job Requisition Audit:</strong> Paste ATS job link (Ashby, Greenhouse, Lever, Workday) to detect ghost postings, compensation disclosure, and recruiter domains.
            </span>
          )}
          {activeMode === 'both' && (
            <span>
              <strong>Dual Verification:</strong> Enter both company website and job link to cross-examine corporate substance alongside specific role responsibilities.
            </span>
          )}
        </div>
      </div>

      {/* Input Form */}
      <form onSubmit={handleSubmit} className="space-y-2.5">
        {(activeMode === 'company' || activeMode === 'both') && (
          <div>
            <label className="block text-[11px] font-mono font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Building2 className="w-3 h-3 text-blue-600" />
                Company Website URL
              </span>
              {activeMode === 'company' && <span className="text-[10px] text-purple-600 font-normal">Real vs Scam Check</span>}
            </label>
            <input
              type="url"
              value={companyUrl}
              onChange={(e) => setCompanyUrl(e.target.value)}
              placeholder="e.g. https://xyzcapital.com or https://boutiquestudio.io"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        )}

        {(activeMode === 'job' || activeMode === 'both') && (
          <div>
            <label className="block text-[11px] font-mono font-semibold text-slate-700 mb-1 flex items-center justify-between">
              <span className="flex items-center gap-1">
                <Briefcase className="w-3 h-3 text-indigo-600" />
                Job Requisition URL
              </span>
              <span className="text-[10px] text-slate-400 font-normal">ATS / Handshake / LinkedIn</span>
            </label>
            <input
              type="url"
              value={jobUrl}
              onChange={(e) => setJobUrl(e.target.value)}
              placeholder="e.g. https://jobs.ashbyhq.com/... or https://xyzcapital.com/careers/ib-intern"
              className="w-full bg-slate-50 border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
            />
          </div>
        )}

        {errorMessage && (
          <div className="text-[11px] text-rose-600 flex items-center gap-1 bg-rose-50 border border-rose-200 px-2.5 py-1.5 rounded-lg">
            <AlertCircle className="w-3.5 h-3.5 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        <button
          type="submit"
          disabled={isLoading}
          className="w-full py-2 px-3 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-50 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
        >
          {isLoading ? (
            <>
              <RefreshCw className="w-3.5 h-3.5 animate-spin" />
              <span>Verifying Trust Vectors...</span>
            </>
          ) : (
            <>
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {activeMode === 'company'
                  ? 'Verify Company (Real vs Scam)'
                  : activeMode === 'job'
                  ? 'Verify Job Requisition'
                  : 'Verify Both Company & Role'}
              </span>
              <ArrowRight className="w-3.5 h-3.5 ml-0.5" />
            </>
          )}
        </button>
      </form>

      {/* Quick Screenshot Samples */}
      <div className="pt-2 border-t border-slate-100">
        <div className="text-[10px] font-mono text-slate-400 uppercase tracking-wider mb-1.5">
          Quick Screenshot Test Cases:
        </div>
        <div className="flex flex-wrap gap-1.5">
          <button
            type="button"
            onClick={() => handleApplyPreset('xyz')}
            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-blue-50 hover:text-blue-700 text-slate-700 border border-slate-200 transition-colors font-medium text-left"
          >
            📊 XYZ Capital (IB Intern)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('nexus')}
            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-purple-50 hover:text-purple-700 text-slate-700 border border-slate-200 transition-colors font-medium text-left"
          >
            🏢 Nexus Studio (Website Only)
          </button>
          <button
            type="button"
            onClick={() => handleApplyPreset('kalshi')}
            className="text-[11px] px-2 py-1 rounded-lg bg-slate-100 hover:bg-emerald-50 hover:text-emerald-700 text-slate-700 border border-slate-200 transition-colors font-medium text-left"
          >
            🛡️ Kalshi (Ashby ATS)
          </button>
        </div>
      </div>
    </div>
  );
};
