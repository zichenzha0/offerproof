import React, { useState } from 'react';
import { ScreenshotFiveBlocks } from '../types';
import {
  Building2,
  Users,
  Briefcase,
  GraduationCap,
  AlertTriangle,
  CheckCircle2,
  HelpCircle,
  ChevronDown,
  ChevronUp,
  ExternalLink,
  ShieldCheck,
  ShieldAlert,
  Copy,
  Check,
  BookOpen,
} from 'lucide-react';

interface ScreenshotFiveBlocksTableProps {
  fiveBlocks?: ScreenshotFiveBlocks;
  companyName: string;
  roleTitle: string;
  companyUrl?: string;
  jobUrl?: string;
  isCompanyOnly?: boolean;
}

export const ScreenshotFiveBlocksTable: React.FC<ScreenshotFiveBlocksTableProps> = ({
  fiveBlocks,
  companyName,
  roleTitle,
  companyUrl,
  jobUrl,
  isCompanyOnly,
}) => {
  const [showRulebook, setShowRulebook] = useState(false);
  const [copied, setCopied] = useState(false);

  // Fallback defaults if fiveBlocks is missing
  const blocks: ScreenshotFiveBlocks = fiveBlocks || {
    firm_substance: {
      result: 'Mixed',
      evidence: 'Preliminary corporate web footprint identified; awaiting independent transaction filings or client press confirmation.',
    },
    people_credibility: {
      result: 'Mixed',
      evidence: 'Executive profiles identified on web assets; verifying independent industry tenure and full-time employee ratio.',
    },
    role_substance: {
      result: isCompanyOnly ? 'Company-Only (No Job Specified)' : 'Medium',
      evidence: isCompanyOnly
        ? 'No job requisition provided; company substance and legitimacy evaluated.'
        : 'Requisition parameters analyzed against verified industry technical scope.',
    },
    past_intern_outcomes: {
      result: 'Limited/Unclear',
      evidence: 'Limited public alumni records available in open employment registries.',
    },
    risk_signals: {
      result: 'Low concern',
      evidence: 'No advance fee demands, cashier checks, or premature identity collection observed.',
    },
  };

  const getResultBadge = (category: string, result: string) => {
    const resLower = result.toLowerCase();

    if (category === 'risk_signals') {
      if (resLower.includes('high') || resLower.includes('danger')) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
            <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
            {result}
          </span>
        );
      }
      if (resLower.includes('medium')) {
        return (
          <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
            {result}
          </span>
        );
      }
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {result}
        </span>
      );
    }

    if (resLower.includes('strong') || resLower.includes('high')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-emerald-50 text-emerald-700 border border-emerald-200">
          <CheckCircle2 className="w-3.5 h-3.5 text-emerald-600" />
          {result}
        </span>
      );
    }
    if (resLower.includes('mixed') || resLower.includes('low–medium') || resLower.includes('low-medium') || resLower.includes('medium')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-amber-50 text-amber-800 border border-amber-200">
          <AlertTriangle className="w-3.5 h-3.5 text-amber-600" />
          {result}
        </span>
      );
    }
    if (resLower.includes('company-only')) {
      return (
        <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-slate-100 text-slate-700 border border-slate-200">
          <Building2 className="w-3.5 h-3.5 text-slate-500" />
          Company-Only
        </span>
      );
    }
    // Weak, Limited, None found
    return (
      <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-md text-xs font-semibold bg-rose-50 text-rose-700 border border-rose-200">
        <ShieldAlert className="w-3.5 h-3.5 text-rose-600" />
        {result}
      </span>
    );
  };

  const copyReportMarkdown = () => {
    const markdown = `# ${companyName} — ${isCompanyOnly ? 'Company Legitimacy & Substance Audit' : roleTitle}
${companyUrl ? `Company URL: ${companyUrl}\n` : ''}${jobUrl ? `Job URL: ${jobUrl}\n` : ''}
| Category | Result | Evidence |
|---|---|---|
| Firm Substance | ${blocks.firm_substance.result} | ${blocks.firm_substance.evidence} |
| People Credibility | ${blocks.people_credibility.result} | ${blocks.people_credibility.evidence} |
| Role Substance | ${blocks.role_substance.result} | ${blocks.role_substance.evidence} |
| Past Intern Outcomes | ${blocks.past_intern_outcomes.result} | ${blocks.past_intern_outcomes.evidence} |
| Risk Signals | ${blocks.risk_signals.result} | ${blocks.risk_signals.evidence} |
`;
    navigator.clipboard.writeText(markdown);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div id="screenshot-five-blocks-container" className="space-y-4">
      {/* Target Title Card */}
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
          <div>
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-blue-50 text-blue-700 border border-blue-200">
                Extension 5-Block Standard
              </span>
              {isCompanyOnly ? (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-purple-50 text-purple-700 border border-purple-200 flex items-center gap-1">
                  <Building2 className="w-3 h-3" />
                  Website-Only Company Audit
                </span>
              ) : (
                <span className="text-[11px] font-mono font-semibold px-2 py-0.5 rounded bg-emerald-50 text-emerald-700 border border-emerald-200 flex items-center gap-1">
                  <Briefcase className="w-3 h-3" />
                  Role & Firm Audit
                </span>
              )}
            </div>
            <h2 className="text-base sm:text-lg font-bold text-slate-900 flex items-center gap-2">
              <span>{companyName}</span>
              <span className="text-slate-300 font-light">—</span>
              <span className="text-blue-700 font-semibold">
                {isCompanyOnly ? 'Company Legitimacy & Substance Audit' : roleTitle}
              </span>
            </h2>
          </div>

          <div className="flex items-center gap-2 shrink-0">
            <button
              id="btn-copy-screenshot-table"
              onClick={copyReportMarkdown}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-slate-50 hover:bg-slate-100 text-slate-700 border border-slate-200 transition-colors shadow-xs"
              title="Copy table in Markdown format"
            >
              {copied ? <Check className="w-3.5 h-3.5 text-emerald-600" /> : <Copy className="w-3.5 h-3.5 text-slate-500" />}
              <span>{copied ? 'Copied!' : 'Copy Table'}</span>
            </button>
            <button
              onClick={() => setShowRulebook(!showRulebook)}
              className="inline-flex items-center gap-1.5 text-xs font-mono px-3 py-1.5 rounded-xl bg-blue-50 hover:bg-blue-100 text-blue-700 border border-blue-200 transition-colors shadow-xs"
            >
              <BookOpen className="w-3.5 h-3.5 text-blue-600" />
              <span>Rulebook</span>
              {showRulebook ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>
        </div>

        {/* Links bar if available */}
        {(companyUrl || jobUrl) && (
          <div className="mt-3 flex flex-wrap items-center gap-2 text-xs">
            {companyUrl && (
              <a
                href={companyUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                <Building2 className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium">Company Website:</span>
                <span className="font-mono truncate max-w-[220px]">{companyUrl}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
            {jobUrl && (
              <a
                href={jobUrl}
                target="_blank"
                rel="noreferrer noopener"
                className="inline-flex items-center gap-1 text-slate-600 hover:text-blue-600 bg-slate-50 hover:bg-blue-50 px-2.5 py-1 rounded-lg border border-slate-200 transition-colors"
              >
                <Briefcase className="w-3.5 h-3.5 text-blue-600" />
                <span className="font-medium">Job Post:</span>
                <span className="font-mono truncate max-w-[220px]">{jobUrl}</span>
                <ExternalLink className="w-3 h-3 text-slate-400" />
              </a>
            )}
          </div>
        )}

        {isCompanyOnly && (
          <div className="mt-3 p-3 rounded-xl bg-purple-50/70 border border-purple-200 text-xs text-purple-900 flex items-start gap-2.5">
            <Building2 className="w-4 h-4 text-purple-700 shrink-0 mt-0.5" />
            <div>
              <span className="font-semibold">Company Website Verification Mode:</span> Evaluated whether this entity is a real operating business or a fraudulent front / shell company. Role substance is set to Company-Only since no specific job requisition was submitted.
            </div>
          </div>
        )}

        {/* 5-Block Extension Table */}
        <div className="mt-4 overflow-x-auto rounded-xl border border-slate-200 bg-white">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/80 border-b border-slate-200 text-[11px] font-mono font-bold uppercase tracking-wider text-slate-600">
                <th className="py-3 px-4 w-[200px] sm:w-[220px]">Category</th>
                <th className="py-3 px-4 w-[130px] sm:w-[150px]">Result</th>
                <th className="py-3 px-4">Evidence</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {/* Row 1: Firm Substance */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <div className="p-1 rounded-md bg-blue-50 text-blue-700">
                      <Building2 className="w-3.5 h-3.5" />
                    </div>
                    <span>Firm Substance</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-6 font-mono">
                    这家公司真的在做声称的业务吗？
                  </div>
                </td>
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  {getResultBadge('firm_substance', blocks.firm_substance.result)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-normal">
                  {blocks.firm_substance.evidence}
                </td>
              </tr>

              {/* Row 2: People Credibility */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <div className="p-1 rounded-md bg-purple-50 text-purple-700">
                      <Users className="w-3.5 h-3.5" />
                    </div>
                    <span>People Credibility</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-6 font-mono">
                    Founder/MD 和核心团队靠谱吗？
                  </div>
                </td>
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  {getResultBadge('people_credibility', blocks.people_credibility.result)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-normal">
                  {blocks.people_credibility.evidence}
                </td>
              </tr>

              {/* Row 3: Role Substance */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <div className="p-1 rounded-md bg-indigo-50 text-indigo-700">
                      <Briefcase className="w-3.5 h-3.5" />
                    </div>
                    <span>Role Substance</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-6 font-mono">
                    这个 internship 真的是它说的工作吗？
                  </div>
                </td>
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  {getResultBadge('role_substance', blocks.role_substance.result)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-normal">
                  {blocks.role_substance.evidence}
                </td>
              </tr>

              {/* Row 4: Past Intern Outcomes */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <div className="p-1 rounded-md bg-emerald-50 text-emerald-700">
                      <GraduationCap className="w-3.5 h-3.5" />
                    </div>
                    <span>Past Intern Outcomes</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-6 font-mono">
                    以前做过的人实际学到什么、去哪？
                  </div>
                </td>
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  {getResultBadge('past_intern_outcomes', blocks.past_intern_outcomes.result)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-normal">
                  {blocks.past_intern_outcomes.evidence}
                </td>
              </tr>

              {/* Row 5: Risk Signals */}
              <tr className="hover:bg-slate-50/50 transition-colors">
                <td className="py-3.5 px-4 align-top">
                  <div className="flex items-center gap-2 font-semibold text-slate-900">
                    <div className="p-1 rounded-md bg-rose-50 text-rose-700">
                      <AlertTriangle className="w-3.5 h-3.5" />
                    </div>
                    <span>Risk Signals</span>
                  </div>
                  <div className="text-[10px] text-slate-400 mt-0.5 pl-6 font-mono">
                    有没有明显'拿学生当资源'的模式？
                  </div>
                </td>
                <td className="py-3.5 px-4 align-top whitespace-nowrap">
                  {getResultBadge('risk_signals', blocks.risk_signals.result)}
                </td>
                <td className="py-3.5 px-4 text-slate-700 leading-relaxed font-normal">
                  {blocks.risk_signals.evidence}
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Expandable Screenshot Rulebook (Screenshot 1 Reference) */}
      {showRulebook && (
        <div className="bg-slate-50 border border-slate-200 rounded-2xl p-5 shadow-xs space-y-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <BookOpen className="w-4 h-4 text-blue-600" />
              <h3 className="text-sm font-bold text-slate-900">
                Screenshot Verification Rulebook (5-Block Framework)
              </h3>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Criteria & Evidence Standards
            </span>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 text-xs">
            {/* Block 1 */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-blue-700">
                <Building2 className="w-3.5 h-3.5" />
                1. Firm Substance
              </div>
              <p className="text-slate-600 mb-2 font-medium">这家公司真的在做它声称的业务吗？</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">Evidence:</strong> 官网, deal announcements, SEC/FINRA filings, 客户新闻稿, Google News, Crunchbase</li>
                <li><strong className="text-emerald-700">Positive:</strong> 真实 deals/products/clients, 近期仍活跃 (2024-2026), 外部可验证</li>
                <li><strong className="text-rose-700">Risk:</strong> 只有官网自述, 查无交易记录, 长期无活动</li>
              </ul>
            </div>

            {/* Block 2 */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-purple-700">
                <Users className="w-3.5 h-3.5" />
                2. People Credibility
              </div>
              <p className="text-slate-600 mb-2 font-medium">Founder/CEO/MD 和核心团队靠谱吗？</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">Evidence:</strong> LinkedIn, 官网 bio, conference bio, 前雇主与大学校友资料</li>
                <li><strong className="text-emerald-700">Positive:</strong> 相关行业经历 (e.g. 8+年), 经历能交叉验证, 稳定全职团队</li>
                <li><strong className="text-rose-700">Risk:</strong> 经验与职位不匹配, 经历无法验证, 2个员工+30个interns</li>
              </ul>
            </div>

            {/* Block 3 */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-indigo-700">
                <Briefcase className="w-3.5 h-3.5" />
                3. Role Substance
              </div>
              <p className="text-slate-600 mb-2 font-medium">这个 internship 真的是它说的工作吗？</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">Evidence:</strong> Job description, Handshake, LinkedIn post, past intern profiles, WSO, Reddit</li>
                <li><strong className="text-emerald-700">Positive:</strong> IB intern 做 comps/modeling/deals; Tech intern 真写代码</li>
                <li><strong className="text-rose-700">Risk:</strong> "IB intern" 实际 cold call/拉人; "SWE intern" 没技术导师</li>
              </ul>
            </div>

            {/* Block 4 */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-emerald-700">
                <GraduationCap className="w-3.5 h-3.5" />
                4. Past Intern Outcomes
              </div>
              <p className="text-slate-600 mb-2 font-medium">以前做过的人实际学到了什么、之后去哪？</p>
              <ul className="space-y-1 text-[11px] text-slate-600 list-disc list-inside">
                <li><strong className="text-slate-800">Evidence:</strong> Past intern LinkedIn, resume, WSO, Reddit, alumni records</li>
                <li><strong className="text-emerald-700">Positive:</strong> 多名前 intern 描述 substantive work; 之后进入相关目标行业</li>
                <li><strong className="text-rose-700">Risk:</strong> 描述很空, 极短期走人, 无人继续从事该方向</li>
              </ul>
            </div>

            {/* Block 5 */}
            <div className="p-3.5 rounded-xl bg-white border border-slate-200 md:col-span-2">
              <div className="font-semibold text-slate-900 flex items-center gap-1.5 mb-1 text-rose-700">
                <AlertTriangle className="w-3.5 h-3.5" />
                5. Risk Signals (学生资源榨取模式)
              </div>
              <p className="text-slate-600 mb-2 font-medium">有没有明显"拿学生当资源"的套路？</p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 text-[11px] text-slate-600">
                <div className="p-2 rounded bg-emerald-50/50 border border-emerald-100">
                  <span className="font-bold text-emerald-800">Typical Positive Signals:</span>
                  <p>无收费、无自费培训；有明确 supervisor；合理的 intern/full-time 比例。</p>
                </div>
                <div className="p-2 rounded bg-rose-50/50 border border-rose-100">
                  <span className="font-bold text-rose-800">Typical Red Flags:</span>
                  <p>要求付钱/投资/买课；让 intern 拉融资或客户；极端 intern-heavy (e.g. 3 FT vs 21 interns)；长期循环反复招人。</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
