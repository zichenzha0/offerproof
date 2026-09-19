import React, { useState, useEffect } from 'react';
import { PRESET_SAMPLES } from './samples';
import { PresetSample, RecruitmentAuditResult } from './types';
import { OpportunityCard } from './components/OpportunityCard';
import { ScoreGauge } from './components/ScoreGauge';
import { VerificationCard } from './components/VerificationCard';
import { PrivacyShield } from './components/PrivacyShield';
import { ApiInspector } from './components/ApiInspector';
import { CopilotChat } from './components/CopilotChat';
import { NewAuditModal } from './components/NewAuditModal';
import { SmallCompanyEmailScanner } from './components/SmallCompanyEmailScanner';
import {
  Sparkles,
  ShieldCheck,
  ShieldAlert,
  Search,
  Plus,
  ExternalLink,
  Code2,
  LayoutDashboard,
  Bot,
  FileText,
  Lock,
  RefreshCw,
  SlidersHorizontal,
  ChevronRight,
  AlertCircle,
  Building2,
  MapPin,
  DollarSign,
  Clock,
  Globe,
  ArrowRight,
  Loader2,
  GraduationCap,
} from 'lucide-react';

export default function App() {
  const [jobs, setJobs] = useState<PresetSample[]>(PRESET_SAMPLES);
  const [selectedJob, setSelectedJob] = useState<PresetSample>(PRESET_SAMPLES[0]);
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const [searchQuery, setSearchQuery] = useState<string>('');

  const [activeTab, setActiveTab] = useState<'vectors' | 'privacy' | 'copilot' | 'payload' | 'api' | 'small-company'>('vectors');
  const [isAuditModalOpen, setIsAuditModalOpen] = useState<boolean>(false);

  // Editable payload for current job
  const [currentPayload, setCurrentPayload] = useState<string>(PRESET_SAMPLES[0].content);

  // Audit state
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [loadingStage, setLoadingStage] = useState<string>('Scanning recruitment metadata...');
  const [error, setError] = useState<string | null>(null);
  const [auditResult, setAuditResult] = useState<RecruitmentAuditResult | null>(null);
  const [rawJsonResponse, setRawJsonResponse] = useState<string>('');

  // Cache audit results per job ID to make browsing instant while supporting on-demand re-audit
  const [resultsCache, setResultsCache] = useState<Record<string, { result: RecruitmentAuditResult; raw: string }>>({});

  // Direct URL Quick Verifier State
  const [quickUrlInput, setQuickUrlInput] = useState<string>('');
  const [isQuickUrlFetching, setIsQuickUrlFetching] = useState<boolean>(false);
  const [quickUrlError, setQuickUrlError] = useState<string | null>(null);

  // Execute Zero-Trust Audit on selected job or payload
  const runAuditForJob = async (jobToAudit: PresetSample, customText?: string) => {
    const textToAnalyze = customText || jobToAudit.content;
    if (!textToAnalyze.trim()) {
      setError('Please provide recruitment content to evaluate.');
      return;
    }

    setIsLoading(true);
    setError(null);

    const stages = [
      'Deconstructing message headers & routing hops...',
      'Evaluating domain for typosquatting & character swaps...',
      'Cross-referencing active role vs abandoned Ghost Job...',
      'Screening for advance check & equipment fraud vectors...',
      'Masking sensitive PII & quarantining outbound links...',
    ];

    let stageIdx = 0;
    setLoadingStage(stages[0]);
    const interval = setInterval(() => {
      stageIdx++;
      if (stageIdx < stages.length) {
        setLoadingStage(stages[stageIdx]);
      }
    }, 550);

    try {
      const res = await fetch('/api/audit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          text: textToAnalyze,
          category: jobToAudit.category.toLowerCase(),
        }),
      });

      if (!res.ok) {
        const errData = await res.json().catch(() => ({}));
        throw new Error(errData.message || errData.error || `Audit service error (${res.status})`);
      }

      const textOutput = await res.text();
      setRawJsonResponse(textOutput);

      const parsed: RecruitmentAuditResult = JSON.parse(textOutput);
      setAuditResult(parsed);

      // Save into cache
      setResultsCache((prev) => ({
        ...prev,
        [jobToAudit.id]: { result: parsed, raw: textOutput },
      }));
    } catch (err: unknown) {
      console.error('Audit execution error:', err);
      const msg = err instanceof Error ? err.message : 'Audit failed. Check backend logs.';
      setError(msg);
    } finally {
      clearInterval(interval);
      setIsLoading(false);
    }
  };

  // Initial load audit
  useEffect(() => {
    runAuditForJob(PRESET_SAMPLES[0]);
  }, []);

  // Handle job card selection
  const handleSelectJob = (job: PresetSample) => {
    setSelectedJob(job);
    setCurrentPayload(job.content);
    setError(null);

    // If already in cache, load immediately, else run audit
    if (resultsCache[job.id]) {
      setAuditResult(resultsCache[job.id].result);
      setRawJsonResponse(resultsCache[job.id].raw);
    } else {
      runAuditForJob(job);
    }
  };

  // Handle adding custom audit from modal or omnibar
  const handleAddCustomAudit = (newJob: PresetSample) => {
    setJobs((prev) => [newJob, ...prev]);
    setSelectedJob(newJob);
    setCurrentPayload(newJob.content);
    runAuditForJob(newJob);
  };

  // Direct Quick URL Verifier
  const handleQuickUrlVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!quickUrlInput.trim()) return;

    setIsQuickUrlFetching(true);
    setQuickUrlError(null);

    try {
      const res = await fetch('/api/parse-url', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url: quickUrlInput.trim() }),
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

      const newJob: PresetSample = {
        id: `url-${Date.now()}`,
        title: data.title || 'Parsed Requisition',
        company: data.company || 'Organization',
        location: data.location || 'Remote / Unspecified',
        salary: data.salary && data.salary !== 'Not disclosed in metadata' ? data.salary : 'To be audited',
        postedTime: 'Active ATS Listing • Just Parsed',
        category: 'Legitimate',
        subtitle: `Verified URL: ${hostname}`,
        threatSummary: 'Live requisition fetched directly from official ATS portal metadata.',
        tags: ['URL Verified', hostname.replace(/^jobs\./, '')],
        content: data.rawText || data.description || quickUrlInput,
        officialDomain: hostname,
      };

      setJobs((prev) => [newJob, ...prev]);
      setSelectedJob(newJob);
      setCurrentPayload(newJob.content);
      setQuickUrlInput('');
      runAuditForJob(newJob);
    } catch (err) {
      console.error('Quick URL Verify error:', err);
      setQuickUrlError(err instanceof Error ? err.message : 'Could not fetch and verify this URL.');
    } finally {
      setIsQuickUrlFetching(false);
    }
  };

  // Filter jobs
  const filteredJobs = jobs.filter((job) => {
    const matchesCategory =
      filterCategory === 'all'
        ? true
        : filterCategory === 'scams'
        ? job.category === 'Scam' || job.category === 'Identity Theft'
        : filterCategory === 'ghost'
        ? job.category === 'Ghost Job'
        : filterCategory === 'fresh-grad'
        ? job.tags.some(
            (t) =>
              t.toLowerCase().includes('fresh graduate') ||
              t.toLowerCase().includes('small co') ||
              t.toLowerCase().includes('direct email') ||
              t.toLowerCase().includes('direct portfolio')
          )
        : job.category === 'Legitimate';

    const matchesSearch =
      searchQuery.trim() === '' ||
      job.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.company.toLowerCase().includes(searchQuery.toLowerCase()) ||
      job.tags.some((t) => t.toLowerCase().includes(searchQuery.toLowerCase()));

    return matchesCategory && matchesSearch;
  });

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans antialiased flex flex-col selection:bg-blue-600 selection:text-white">
      {/* Top Header - Zero-Trust Recruitment Copilot Bar */}
      <header className="sticky top-0 z-40 border-b border-slate-200 bg-white/95 backdrop-blur-md">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between gap-4">
          {/* Logo & Brand */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 rounded-xl bg-blue-600 flex items-center justify-center text-white shadow-xs">
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-base font-extrabold tracking-tight text-slate-900 font-sans">
                  Offer<span className="text-blue-600">Proof</span>
                </span>
                <span className="text-[10px] font-mono px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 font-semibold uppercase">
                  Zero-Trust Copilot
                </span>
              </div>
              <p className="text-[11px] text-slate-500 hidden sm:block">
                AI Career Copilot • Ghost Job Radar & Offer Verification Shield
              </p>
            </div>
          </div>

          {/* Center: Omnibar Search & Quick Audit Input */}
          <div className="hidden md:flex items-center flex-1 max-w-lg mx-4">
            <div className="relative w-full">
              <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
              <input
                id="omnibar-search-input"
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search job requisitions, companies, or fraud tags..."
                className="w-full bg-slate-100 border border-slate-200 rounded-xl pl-9 pr-24 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <div className="absolute right-2.5 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <kbd className="hidden lg:inline text-[10px] font-mono px-1.5 py-0.5 rounded bg-white text-slate-500 border border-slate-200 shadow-xs">
                  ⌘K
                </kbd>
              </div>
            </div>
          </div>

          {/* Right Action Controls */}
          <div className="flex items-center gap-2.5 shrink-0">
            <div className="hidden sm:flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span>Guard Active</span>
            </div>

            <button
              id="btn-open-freshgrad-tab"
              onClick={() => setActiveTab('small-company')}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-purple-50 hover:bg-purple-100 text-purple-700 border border-purple-200 transition-colors shadow-xs font-medium"
            >
              <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
              <span className="hidden sm:inline">Fresh Grad</span> Direct Scanner
            </button>

            <button
              id="btn-open-api-tab"
              onClick={() => setActiveTab('api')}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs font-medium"
            >
              <Code2 className="w-3.5 h-3.5 text-blue-600" />
              <span className="hidden sm:inline">API</span> Middleware
            </button>

            <button
              id="btn-new-audit-header"
              onClick={() => setIsAuditModalOpen(true)}
              className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white shadow-xs transition-all"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>Audit New Job</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Split-Pane Workspace */}
      <div className="max-w-7xl mx-auto w-full px-4 sm:px-6 lg:px-8 py-6 flex-1 flex flex-col lg:flex-row gap-6 items-start">
        {/* ================= LEFT COLUMN: Job Feed & Requisitions ================= */}
        <aside
          id="opportunity-feed-column"
          className="w-full lg:w-[410px] shrink-0 flex flex-col gap-3.5"
        >
          {/* Feed Header & Filters */}
          <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-xs">
            <div className="flex items-center justify-between gap-2 mb-3">
              <div className="flex items-center gap-2">
                <SlidersHorizontal className="w-4 h-4 text-blue-600" />
                <h2 className="text-xs font-mono font-bold uppercase tracking-wider text-slate-700">
                  Job Requisitions Feed
                </h2>
              </div>
              <span className="text-[11px] font-mono text-slate-500">
                {filteredJobs.length} tracked
              </span>
            </div>

            {/* Category Filter Pills */}
            <div className="flex flex-wrap gap-1.5">
              <button
                type="button"
                onClick={() => setFilterCategory('all')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCategory === 'all'
                    ? 'bg-blue-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-slate-900 hover:bg-slate-200 border border-slate-200'
                }`}
              >
                All Roles
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('fresh-grad')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCategory === 'fresh-grad'
                    ? 'bg-purple-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-purple-700 hover:bg-purple-50 border border-slate-200'
                }`}
              >
                🎓 Fresh Grad / Small Co
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('scams')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCategory === 'scams'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-rose-700 hover:bg-rose-50 border border-slate-200'
                }`}
              >
                🚨 Scams & Fraud
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('ghost')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCategory === 'ghost'
                    ? 'bg-amber-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-amber-800 hover:bg-amber-50 border border-slate-200'
                }`}
              >
                👻 Ghost Jobs
              </button>
              <button
                type="button"
                onClick={() => setFilterCategory('legit')}
                className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-all ${
                  filterCategory === 'legit'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'bg-slate-100 text-slate-600 hover:text-emerald-700 hover:bg-emerald-50 border border-slate-200'
                }`}
              >
                🛡️ Verified
              </button>
            </div>

            {/* Mobile search */}
            <div className="mt-3 md:hidden">
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search requisitions..."
                className="w-full bg-slate-50 border border-slate-200 rounded-lg px-3 py-1.5 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
              />
            </div>
          </div>

          {/* Quick Job URL Verifier Card */}
          <div className="rounded-2xl border border-blue-200 bg-blue-50/50 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-blue-900">
                <Globe className="w-3.5 h-3.5 text-blue-600" />
                <span>Verify Direct Job URL</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-blue-100 text-blue-800 border border-blue-200 font-medium">
                Ashby • Greenhouse • Lever
              </span>
            </div>
            <form onSubmit={handleQuickUrlVerify} className="flex gap-1.5">
              <input
                type="url"
                value={quickUrlInput}
                onChange={(e) => setQuickUrlInput(e.target.value)}
                placeholder="Paste job link: https://jobs.ashbyhq.com/..."
                className="flex-1 min-w-0 bg-white border border-slate-300 rounded-xl px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600 focus:ring-1 focus:ring-blue-600"
              />
              <button
                type="submit"
                disabled={isQuickUrlFetching || !quickUrlInput.trim()}
                className="px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white text-xs font-semibold flex items-center gap-1 shrink-0 transition-colors shadow-xs"
              >
                {isQuickUrlFetching ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <>
                    <span>Verify</span>
                    <ArrowRight className="w-3 h-3" />
                  </>
                )}
              </button>
            </form>
            {quickUrlError && (
              <p className="text-[11px] text-rose-600 font-sans">{quickUrlError}</p>
            )}
          </div>

          {/* Fresh Grad Direct Outreach Scanner Card */}
          <div className="rounded-2xl border border-purple-200 bg-purple-50/50 p-3.5 space-y-2.5 shadow-xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-xs font-semibold text-purple-900">
                <GraduationCap className="w-4 h-4 text-purple-600" />
                <span>Small Co Direct Email Scanner</span>
              </div>
              <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-100 text-purple-800 border border-purple-200 font-medium">
                Fresh Grad Tool
              </span>
            </div>
            <p className="text-[11px] text-slate-600 leading-relaxed">
              Contacted directly by a small agency or seed startup without a public job board? Scan their recruiter email, verify domain integrity, and spot equipment check fraud.
            </p>
            <button
              type="button"
              onClick={() => setActiveTab('small-company')}
              className="w-full py-2 px-3 rounded-xl bg-purple-600 hover:bg-purple-700 active:bg-purple-800 text-white text-xs font-semibold flex items-center justify-center gap-1.5 shadow-xs transition-colors"
            >
              <GraduationCap className="w-3.5 h-3.5" />
              <span>Open Direct Email Scanner</span>
            </button>
          </div>

          {/* Job Card List */}
          <div className="space-y-2.5">
            {filteredJobs.length === 0 ? (
              <div className="rounded-2xl border border-slate-200 bg-white p-6 text-center text-xs text-slate-500 shadow-xs">
                No job postings found matching your filter criteria.
              </div>
            ) : (
              filteredJobs.map((job) => (
                <OpportunityCard
                  key={job.id}
                  job={job}
                  isSelected={selectedJob.id === job.id}
                  onSelect={handleSelectJob}
                  currentGhostScore={resultsCache[job.id]?.result?.ghost_score}
                  currentTrustLevel={resultsCache[job.id]?.result?.trust_level}
                />
              ))
            )}
          </div>

          {/* Quick Paste Requisition Button */}
          <button
            type="button"
            onClick={() => setIsAuditModalOpen(true)}
            className="w-full py-3 px-4 rounded-xl border border-dashed border-slate-300 hover:border-blue-500 bg-white hover:bg-blue-50/50 text-xs text-slate-600 hover:text-blue-700 flex items-center justify-center gap-2 transition-all font-medium shadow-xs"
          >
            <Plus className="w-4 h-4 text-blue-600" />
            <span>+ Paste Custom Requisition / Email Header</span>
          </button>
        </aside>

        {/* ================= RIGHT COLUMN: Orion Copilot Deep Inspection ================= */}
        <main
          id="jobright-inspection-column"
          className="flex-1 w-full flex flex-col gap-4 min-w-0"
        >
          {/* Active Job Hero Banner (Jobright style) */}
          <section className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
              <div className="flex items-start gap-3.5 min-w-0">
                <div className="w-12 h-12 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-700 font-extrabold text-lg shrink-0">
                  {selectedJob.company ? selectedJob.company.charAt(0).toUpperCase() : 'J'}
                </div>

                <div className="min-w-0">
                  <div className="flex flex-wrap items-center gap-2">
                    <h1 className="text-lg font-bold text-slate-900 tracking-tight">
                      {selectedJob.title}
                    </h1>
                    <span
                      className={`text-[10px] font-mono px-2 py-0.5 rounded-full border font-semibold ${
                        selectedJob.category === 'Scam'
                          ? 'bg-rose-50 text-rose-700 border-rose-200'
                          : selectedJob.category === 'Ghost Job'
                          ? 'bg-amber-50 text-amber-800 border-amber-200'
                          : selectedJob.category === 'Identity Theft'
                          ? 'bg-purple-50 text-purple-700 border-purple-200'
                          : 'bg-emerald-50 text-emerald-700 border-emerald-200'
                      }`}
                    >
                      {selectedJob.category}
                    </span>
                  </div>

                  <div className="flex flex-wrap items-center gap-3 text-xs text-slate-500 mt-1">
                    <span className="flex items-center gap-1 font-semibold text-slate-800">
                      <Building2 className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      {selectedJob.company}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1">
                      <MapPin className="w-3.5 h-3.5 shrink-0" />
                      {selectedJob.location}
                    </span>
                    <span>•</span>
                    <span className="flex items-center gap-1 text-emerald-700 font-semibold font-mono">
                      <DollarSign className="w-3.5 h-3.5 shrink-0" />
                      {selectedJob.salary}
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 self-end sm:self-auto shrink-0">
                {selectedJob.officialDomain && (
                  <a
                    href={`https://${selectedJob.officialDomain}`}
                    target="_blank"
                    rel="noreferrer noopener"
                    className="inline-flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-xl bg-white hover:bg-slate-50 text-slate-700 border border-slate-200 transition-colors shadow-xs font-medium"
                  >
                    <span>Official Portal</span>
                    <ExternalLink className="w-3 h-3 text-slate-400" />
                  </a>
                )}

                <button
                  type="button"
                  onClick={() => runAuditForJob(selectedJob, currentPayload)}
                  disabled={isLoading}
                  className="inline-flex items-center gap-1.5 text-xs font-semibold px-3.5 py-1.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white transition-all shadow-xs disabled:opacity-50"
                >
                  <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  <span>{isLoading ? 'Scanning...' : 'Re-run Audit'}</span>
                </button>
              </div>
            </div>

            {/* Fresh Graduate Direct Email Advisory Banner */}
            {selectedJob.tags.some((t) => t.toLowerCase().includes('fresh graduate') || t.toLowerCase().includes('no public job board') || t.toLowerCase().includes('fresh grad')) && (
              <div className="mt-4 rounded-xl border border-purple-200 bg-purple-50/70 p-3.5 flex items-start gap-3 text-xs text-purple-950">
                <GraduationCap className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-semibold text-purple-900">Fresh Graduate Direct Outreach Scenario</span>
                    <span className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-purple-200/60 text-purple-800 font-medium">No ATS / Public Job Board</span>
                  </div>
                  <p className="text-slate-600 leading-relaxed">
                    Fresh graduates frequently discover small design agencies, indie game studios, and seed-stage startups through cold outreach or portfolio inquiries where no public job board exists. OfferProof runs domain MX authentication, Secretary of State registry cross-checks, and scans for fake cashier check equipment fraud or advance software license fee traps.
                  </p>
                </div>
              </div>
            )}

            {/* Error Callout */}
            {error && (
              <div className="mt-4 rounded-xl border border-rose-200 bg-rose-50 p-3.5 flex items-start gap-3 text-xs text-rose-700">
                <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
                <div>
                  <strong className="font-semibold">Audit Warning: </strong>
                  {error}
                </div>
              </div>
            )}
          </section>

          {/* Loading Animation */}
          {isLoading && (
            <div className="rounded-2xl border border-slate-200 bg-white p-8 flex flex-col items-center justify-center text-center gap-4 shadow-xs">
              <div className="relative">
                <div className="w-12 h-12 rounded-full border-2 border-blue-200 border-t-blue-600 animate-spin" />
                <Sparkles className="w-5 h-5 text-blue-600 absolute inset-0 m-auto" />
              </div>
              <div>
                <h3 className="text-sm font-semibold text-slate-900">
                  Zero-Trust Copilot is Evaluating Recruitment Vectors
                </h3>
                <p className="text-xs font-mono text-blue-600 mt-1 animate-pulse font-medium">
                  {loadingStage}
                </p>
              </div>
            </div>
          )}

          {/* Main Inspection View */}
          {!isLoading && auditResult && (
            <div className="space-y-4">
              {/* Score Gauge & Copilot Summary */}
              <ScoreGauge
                score={auditResult.ghost_score}
                trustLevel={auditResult.trust_level}
                category={selectedJob.category}
              />

              {/* Navigation Tabs */}
              <div className="flex flex-wrap items-center justify-between gap-2 border-b border-slate-200 pb-2">
                <div className="flex flex-wrap items-center gap-1.5">
                  <button
                    id="tab-btn-vectors"
                    type="button"
                    onClick={() => setActiveTab('vectors')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'vectors'
                        ? 'bg-white text-blue-700 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
                    Trust Vectors (5)
                  </button>

                  <button
                    id="tab-btn-small-company"
                    type="button"
                    onClick={() => setActiveTab('small-company')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'small-company'
                        ? 'bg-white text-purple-700 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-purple-700 hover:bg-purple-50'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5 text-purple-600" />
                    Fresh Grad Scanner
                  </button>

                  <button
                    id="tab-btn-privacy"
                    type="button"
                    onClick={() => setActiveTab('privacy')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'privacy'
                        ? 'bg-white text-emerald-800 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Lock className="w-3.5 h-3.5 text-emerald-600" />
                    Privacy & Quarantine
                  </button>

                  <button
                    id="tab-btn-copilot"
                    type="button"
                    onClick={() => setActiveTab('copilot')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'copilot'
                        ? 'bg-white text-purple-800 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Bot className="w-3.5 h-3.5 text-purple-600" />
                    AI Copilot Q&A
                  </button>

                  <button
                    id="tab-btn-payload"
                    type="button"
                    onClick={() => setActiveTab('payload')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'payload'
                        ? 'bg-white text-slate-900 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5 text-slate-600" />
                    Requisition Payload
                  </button>

                  <button
                    id="tab-btn-api"
                    type="button"
                    onClick={() => setActiveTab('api')}
                    className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                      activeTab === 'api'
                        ? 'bg-white text-blue-700 font-semibold border border-slate-300 shadow-xs'
                        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                    }`}
                  >
                    <Code2 className="w-3.5 h-3.5 text-blue-600" />
                    API Middleware / Raw JSON
                  </button>
                </div>

                <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
                  RFC 8259 Standard • POST /api/audit
                </div>
              </div>

              {/* Tab Content 0: Fresh Grad Small Company Direct Email Scanner */}
              {activeTab === 'small-company' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs">
                  <SmallCompanyEmailScanner
                    onAuditSubmission={(newSample) => {
                      handleAddCustomAudit(newSample);
                      setActiveTab('vectors');
                    }}
                  />
                </div>
              )}

              {/* Tab Content 1: Trust Vectors */}
              {activeTab === 'vectors' && (
                <div className="grid grid-cols-1 gap-3">
                  <VerificationCard
                    id="card-company-verification"
                    category="company"
                    title="1. Company Verification"
                    subtitle="Corporate existence & registered corporate identity"
                    data={auditResult.verifications.company_verification}
                  />

                  <VerificationCard
                    id="card-job-verification"
                    category="job"
                    title="1b. Job & Requisition Verification"
                    subtitle="Active hiring role vs abandoned/auto-renewed 'Ghost Job'"
                    data={auditResult.verifications.job_verification}
                  />

                  <VerificationCard
                    id="card-recruiter-verification"
                    category="recruiter"
                    title="2. Recruiter Verification"
                    subtitle="Recruiter outreach channel & authentic corporate staffing profile"
                    data={auditResult.verifications.recruiter_verification}
                  />

                  <VerificationCard
                    id="card-domain-detection"
                    category="domain"
                    title="2b. Recruiter & Domain Detection"
                    subtitle="Typosquatting checks (e.g. g00gle.com) & unverified MX mail relays"
                    data={auditResult.verifications.domain_detection}
                  />

                  <VerificationCard
                    id="card-offer-verification"
                    category="offer"
                    title="3. Offer & Financial Fraud Vulnerabilities"
                    subtitle="Advance fee demands, fake equipment checks, or premature SSN/Passport requests"
                    data={auditResult.verifications.offer_verification}
                  />
                </div>
              )}

              {/* Tab Content 2: Privacy Shield */}
              {activeTab === 'privacy' && (
                <PrivacyShield
                  sensitiveData={auditResult.privacy_and_safety.sensitive_data_hidden}
                  maliciousLinks={auditResult.privacy_and_safety.malicious_links_blocked}
                  officialHrContact={auditResult.action_and_reporting.official_hr_contact}
                />
              )}

              {/* Tab Content 3: Copilot Chat */}
              {activeTab === 'copilot' && (
                <CopilotChat
                  auditResult={auditResult}
                  selectedJob={selectedJob}
                />
              )}

              {/* Tab Content 4: Raw Requisition Payload Editor */}
              {activeTab === 'payload' && (
                <div className="rounded-2xl border border-slate-200 bg-white p-4 space-y-3 shadow-xs">
                  <div className="flex items-center justify-between">
                    <div>
                      <h3 className="text-xs font-mono font-bold uppercase text-slate-700">
                        Raw Requisition & Header Payload
                      </h3>
                      <p className="text-[11px] text-slate-500">
                        Modify payload text below and re-evaluate to test custom variations
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => runAuditForJob(selectedJob, currentPayload)}
                      disabled={isLoading}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-xs"
                    >
                      <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                      <span>Re-Audit This Payload</span>
                    </button>
                  </div>

                  <textarea
                    rows={14}
                    value={currentPayload}
                    onChange={(e) => setCurrentPayload(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 resize-y leading-relaxed"
                  />
                </div>
              )}

              {/* Tab Content 5: API Inspector */}
              {activeTab === 'api' && (
                <ApiInspector
                  rawJson={rawJsonResponse}
                  auditResult={auditResult}
                />
              )}
            </div>
          )}
        </main>
      </div>

      {/* Modal for adding custom audit */}
      <NewAuditModal
        isOpen={isAuditModalOpen}
        onClose={() => setIsAuditModalOpen(false)}
        onSubmit={handleAddCustomAudit}
      />

      {/* Footer */}
      <footer className="border-t border-slate-200 bg-white py-4 mt-auto">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-4 h-4 text-blue-600" />
            <span className="font-medium">OfferProof • Zero-Trust Career Copilot & Recruitment Verification Middleware</span>
          </div>
          <div className="font-mono text-[11px] text-slate-500">
            Powered by Gemini AI • Real-Time Ghost Job & Recruitment Fraud Radar
          </div>
        </div>
      </footer>
    </div>
  );
}
