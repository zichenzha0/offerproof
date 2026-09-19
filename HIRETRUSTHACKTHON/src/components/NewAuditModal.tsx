import React, { useState } from 'react';
import {
  X,
  Sparkles,
  Mail,
  FileText,
  FileCheck2,
  ArrowRight,
  Globe,
  Loader2,
  CheckCircle2,
  AlertCircle,
  GraduationCap,
  Building2,
  Briefcase,
  Link2,
} from 'lucide-react';
import { PresetSample } from '../types';

interface NewAuditModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (newJob: PresetSample) => void;
}

export const NewAuditModal: React.FC<NewAuditModalProps> = ({
  isOpen,
  onClose,
  onSubmit,
}) => {
  const [auditMode, setAuditMode] = useState<'company' | 'job' | 'both' | 'text'>('company');

  // Separated links
  const [companyUrl, setCompanyUrl] = useState('');
  const [jobUrl, setJobUrl] = useState('');

  // Fetching state
  const [isFetchingUrl, setIsFetchingUrl] = useState(false);
  const [fetchError, setFetchError] = useState<string | null>(null);
  const [fetchSuccess, setFetchSuccess] = useState<string | null>(null);

  // Form fields
  const [title, setTitle] = useState('');
  const [company, setCompany] = useState('');
  const [category, setCategory] = useState<'job' | 'email' | 'offer' | 'small-company'>('job');
  const [content, setContent] = useState('');
  const [salary, setSalary] = useState('');
  const [location, setLocation] = useState('');

  if (!isOpen) return null;

  const handleFetchLinks = async () => {
    const targetUrl = auditMode === 'company' ? companyUrl.trim() : (jobUrl.trim() || companyUrl.trim());
    if (!targetUrl) {
      setFetchError('Please enter a URL to inspect.');
      return;
    }

    setIsFetchingUrl(true);
    setFetchError(null);
    setFetchSuccess(null);

    try {
      const res = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          url: targetUrl,
          mode: auditMode === 'company' ? 'company' : 'job',
        }),
      });

      if (!res.ok) {
        const errorData = await res.json().catch(() => ({}));
        throw new Error(errorData.error || `HTTP ${res.status}: Failed to retrieve URL.`);
      }

      const data = await res.json();
      setTitle(data.title || '');
      setCompany(data.company || '');
      setLocation(data.location || (auditMode === 'company' ? 'Corporate Headquarters' : 'Remote / Unspecified'));
      setSalary(data.salary && data.salary !== 'Not disclosed in metadata' ? data.salary : (auditMode === 'company' ? 'N/A (Firm Substance Audit)' : ''));
      setContent(data.rawText || data.description || '');

      if (data.isCompanyOnly) {
        setFetchSuccess('Company domain & substance metadata extracted. Ready for Screenshot 5-Block Scam Verification.');
      } else {
        setFetchSuccess('Job requisition parsed successfully.');
      }
    } catch (err) {
      console.error('URL Fetch failed:', err);
      setFetchError(err instanceof Error ? err.message : 'Could not fetch URL metadata');
    } finally {
      setIsFetchingUrl(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!content.trim() && !companyUrl.trim() && !jobUrl.trim()) return;

    const isCompOnly = auditMode === 'company' || (Boolean(companyUrl.trim()) && !jobUrl.trim());

    const detectedCompany =
      company.trim() ||
      (companyUrl ? new URL(companyUrl.startsWith('http') ? companyUrl : `https://${companyUrl}`).hostname.replace(/^www\./, '') : 'Target Company');

    const detectedTitle =
      title.trim() ||
      (isCompOnly ? `${detectedCompany} — Company Legitimacy & Substance Audit` : 'Inspected Requisition');

    let finalContent = content.trim();
    if (!finalContent) {
      if (isCompOnly) {
        finalContent = `AUDIT TARGET: Company Website Legitimacy & Scam Audit (Real vs Scam)
Company Website: ${companyUrl.trim()}
Company Entity: ${detectedCompany}
Audit Directive: Follow Screenshot 5-Block Rule to verify firm substance, leadership credibility, and risk signals.`;
      } else {
        finalContent = `Job URL: ${jobUrl.trim()}
Company: ${detectedCompany}
Company Website: ${companyUrl.trim() || 'Not provided'}
Role: ${detectedTitle}`;
      }
    }

    let officialHost: string | undefined;
    try {
      if (companyUrl.trim()) {
        officialHost = new URL(companyUrl.trim().startsWith('http') ? companyUrl.trim() : `https://${companyUrl.trim()}`).hostname;
      } else if (jobUrl.trim()) {
        officialHost = new URL(jobUrl.trim().startsWith('http') ? jobUrl.trim() : `https://${jobUrl.trim()}`).hostname;
      }
    } catch {
      // ignore parse error
    }

    const newJob: PresetSample = {
      id: `custom-${Date.now()}`,
      title: detectedTitle,
      company: detectedCompany,
      location: location.trim() || (isCompOnly ? 'Corporate Headquarters / Domain' : 'Remote / Unspecified'),
      salary: salary.trim() || (isCompOnly ? 'N/A (Firm Substance Audit)' : 'To be audited'),
      postedTime: isCompOnly ? 'Domain Active • Website Only (No Job Details)' : 'Just submitted for audit',
      category: isCompOnly ? 'Scam' : category === 'offer' ? 'Scam' : category === 'job' ? 'Ghost Job' : 'Identity Theft',
      subtitle: isCompOnly
        ? `Company-Only Verification: Evaluates whether ${detectedCompany} is real or a scam front`
        : `Custom audit: ${detectedTitle}`,
      threatSummary: isCompOnly
        ? 'Website-Only Verification: Evaluates firm substance, leadership credibility, and risk signals without a job posting.'
        : 'Custom user submission currently under Zero-Trust analysis.',
      tags: isCompOnly
        ? ['Website Only', 'Company Scam Radar', '5-Block Verified', 'Screenshot Rule']
        : ['Custom Audit', 'User Submitted', jobUrl ? 'Job URL' : 'Pasted Text'],
      content: finalContent,
      officialDomain: officialHost,
    };

    onSubmit(newJob);
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="w-full max-w-2xl bg-white border border-slate-200 rounded-2xl shadow-xl overflow-hidden text-slate-900 flex flex-col max-h-[90vh]">
        {/* Modal Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 bg-slate-50/70 shrink-0">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Sparkles className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-slate-900">
                Audit Recruitment Opportunity or Company Website
              </h3>
              <p className="text-[11px] text-slate-500">
                Separated Company Link & Job Link Verification • Screenshot 5-Block Standard
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Modal Body Form */}
        <form onSubmit={handleSubmit} className="p-6 space-y-4 overflow-y-auto">
          {/* Mode Selector Tabs */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1.5 font-medium">
              Verification Mode
            </label>
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
              <button
                type="button"
                onClick={() => {
                  setAuditMode('company');
                  setFetchError(null);
                  setFetchSuccess(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  auditMode === 'company'
                    ? 'bg-purple-50 border-purple-500 text-purple-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Building2 className="w-3.5 h-3.5" />
                <span>🏢 Company Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditMode('job');
                  setFetchError(null);
                  setFetchSuccess(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  auditMode === 'job'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Briefcase className="w-3.5 h-3.5" />
                <span>📄 Job Link</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditMode('both');
                  setFetchError(null);
                  setFetchSuccess(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  auditMode === 'both'
                    ? 'bg-blue-50 border-blue-500 text-blue-700 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <Link2 className="w-3.5 h-3.5" />
                <span>🔗 Both Links</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setAuditMode('text');
                  setFetchError(null);
                  setFetchSuccess(null);
                }}
                className={`flex items-center justify-center gap-1.5 py-2 px-2.5 rounded-xl border text-xs font-medium transition-all ${
                  auditMode === 'text'
                    ? 'bg-slate-100 border-slate-400 text-slate-900 font-semibold shadow-xs'
                    : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50'
                }`}
              >
                <FileText className="w-3.5 h-3.5" />
                <span>📝 Text / Email</span>
              </button>
            </div>
          </div>

          {/* Mode Guidance Box */}
          {auditMode === 'company' && (
            <div className="rounded-xl border border-purple-200 bg-purple-50/60 p-3 text-xs text-purple-900 flex items-start gap-2.5">
              <Building2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Company Website Verification (No Job Details Needed):</span> Enter the company website URL. OfferProof will follow the Screenshot Rule to evaluate firm substance, founder credibility, corporate registry, and scam front risk signals.
              </div>
            </div>
          )}

          {auditMode === 'job' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2.5">
              <Briefcase className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Job Requisition Verification:</span> Enter an ATS job link (Ashby, Greenhouse, Lever, Workday) to verify active requisition status, recruiter domain integrity, and compensation transparency.
              </div>
            </div>
          )}

          {auditMode === 'both' && (
            <div className="rounded-xl border border-blue-200 bg-blue-50/60 p-3 text-xs text-blue-900 flex items-start gap-2.5">
              <Link2 className="w-4 h-4 text-blue-700 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold">Dual Link Cross-Examination:</span> Enter both the company website and the job requisition URL to audit the firm's genuine business legitimacy alongside the role's substantive technical duties.
              </div>
            </div>
          )}

          {/* Separated URL Inputs */}
          {auditMode !== 'text' && (
            <div className="rounded-xl border border-slate-200 bg-slate-50/60 p-4 space-y-3">
              {(auditMode === 'company' || auditMode === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Building2 className="w-3.5 h-3.5 text-purple-600" />
                    <span>Company Website URL</span>
                    <span className="text-[10px] font-mono font-normal text-purple-700 bg-purple-100 px-1.5 py-0.2 rounded">
                      Real vs Scam Check
                    </span>
                  </label>
                  <input
                    type="url"
                    value={companyUrl}
                    onChange={(e) => setCompanyUrl(e.target.value)}
                    placeholder="e.g. https://xyzcapital.com or https://boutiquestudio.io"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              {(auditMode === 'job' || auditMode === 'both') && (
                <div>
                  <label className="block text-xs font-semibold text-slate-800 mb-1 flex items-center gap-1.5">
                    <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                    <span>Job Requisition URL</span>
                    <span className="text-[10px] font-mono font-normal text-slate-500">
                      (ATS / LinkedIn / Handshake)
                    </span>
                  </label>
                  <input
                    type="url"
                    value={jobUrl}
                    onChange={(e) => setJobUrl(e.target.value)}
                    placeholder="e.g. https://jobs.ashbyhq.com/kalshi/... or https://xyzcapital.com/careers/ib-intern"
                    className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
                  />
                </div>
              )}

              <div className="flex items-center justify-between pt-1">
                <button
                  type="button"
                  onClick={handleFetchLinks}
                  disabled={isFetchingUrl || (!companyUrl.trim() && !jobUrl.trim())}
                  className="px-3.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-900 active:bg-black disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors shadow-xs"
                >
                  {isFetchingUrl ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>Fetching Domain Metadata...</span>
                    </>
                  ) : (
                    <>
                      <Globe className="w-3.5 h-3.5" />
                      <span>Fetch & Auto-Populate Details</span>
                    </>
                  )}
                </button>

                {fetchSuccess && (
                  <span className="text-[11px] text-emerald-700 flex items-center gap-1 font-medium">
                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" /> {fetchSuccess}
                  </span>
                )}
              </div>

              {fetchError && (
                <div className="text-[11px] text-rose-600 flex items-center gap-1.5 bg-rose-50 border border-rose-200 p-2 rounded-lg">
                  <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                  <span>{fetchError}</span>
                </div>
              )}
            </div>
          )}

          {/* Optional Entity Fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-medium">
                Company Name
              </label>
              <input
                type="text"
                value={company}
                onChange={(e) => setCompany(e.target.value)}
                placeholder="e.g. XYZ Capital or Nexus Creative"
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>

            <div>
              <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-medium">
                {auditMode === 'company' ? 'Audit Objective' : 'Job Title / Role'}
              </label>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder={auditMode === 'company' ? "Company Legitimacy & Scam Radar" : "e.g. Investment Banking Intern"}
                className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Raw / Custom Content */}
          <div>
            <label className="block text-xs font-mono uppercase text-slate-500 mb-1 font-medium flex items-center justify-between">
              <span>{auditMode === 'company' ? 'Company Details / Observations (Optional)' : 'Requisition / Communication Details'}</span>
              <span className="text-[11px] text-slate-400 lowercase font-normal">
                {content.length} characters
              </span>
            </label>
            <textarea
              rows={5}
              value={content}
              onChange={(e) => setContent(e.target.value)}
              placeholder={
                auditMode === 'company'
                  ? "Optional: Notes on company website, founder names, claimed deals, or domain registration..."
                  : "Paste job description, email outreach, or interview communications..."
              }
              className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 resize-y leading-relaxed"
            />
          </div>

          {/* Modal Footer */}
          <div className="flex items-center justify-between pt-2 border-t border-slate-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100 rounded-lg transition-colors"
            >
              Cancel
            </button>

            <button
              type="submit"
              disabled={!content.trim() && !companyUrl.trim() && !jobUrl.trim()}
              className="px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1.5 shadow-xs transition-colors"
            >
              <Sparkles className="w-3.5 h-3.5" />
              <span>
                {auditMode === 'company'
                  ? 'Run 5-Block Company Scam Audit'
                  : 'Submit for Zero-Trust Audit'}
              </span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
