import React, { useState, useMemo } from 'react';
import {
  GraduationCap,
  Mail,
  Globe,
  Building2,
  AlertTriangle,
  CheckCircle2,
  ExternalLink,
  Copy,
  Check,
  ShieldCheck,
  Search,
  HelpCircle,
  Video,
  FileCheck2,
  Sparkles,
} from 'lucide-react';
import { PresetSample } from '../types';

interface SmallCompanyEmailScannerProps {
  onAuditSubmission: (sample: PresetSample) => void;
}

export const SmallCompanyEmailScanner: React.FC<SmallCompanyEmailScannerProps> = ({
  onAuditSubmission,
}) => {
  const [recruiterEmail, setRecruiterEmail] = useState('');
  const [companyName, setCompanyName] = useState('');
  const [companyWebsite, setCompanyWebsite] = useState('');
  const [roleTitle, setRoleTitle] = useState('Junior Software Engineer / Designer');
  const [emailBody, setEmailBody] = useState('');
  const [copiedTemplate, setCopiedTemplate] = useState(false);

  // Parse email domain
  const emailDomain = useMemo(() => {
    const parts = recruiterEmail.trim().toLowerCase().split('@');
    return parts.length === 2 ? parts[1] : '';
  }, [recruiterEmail]);

  // Check if free webmail
  const isFreeWebmail = useMemo(() => {
    const freeDomains = [
      'gmail.com',
      'yahoo.com',
      'outlook.com',
      'hotmail.com',
      'proton.me',
      'protonmail.com',
      'aol.com',
      'icloud.com',
      'mail.com',
      'zoho.com',
    ];
    return freeDomains.includes(emailDomain);
  }, [emailDomain]);

  // Parse website domain
  const websiteDomain = useMemo(() => {
    if (!companyWebsite.trim()) return '';
    try {
      let urlStr = companyWebsite.trim();
      if (!/^https?:\/\//i.test(urlStr)) {
        urlStr = 'https://' + urlStr;
      }
      const parsed = new URL(urlStr);
      return parsed.hostname.replace(/^www\./, '');
    } catch {
      return '';
    }
  }, [companyWebsite]);

  // Domain mismatch detection
  const domainMismatch = useMemo(() => {
    if (!emailDomain || !websiteDomain) return false;
    if (isFreeWebmail) return true;
    return !emailDomain.endsWith(websiteDomain) && !websiteDomain.endsWith(emailDomain);
  }, [emailDomain, websiteDomain, isFreeWebmail]);

  // Real-time keyword red flags
  const redFlags = useMemo(() => {
    const flags: { id: string; title: string; desc: string; severity: 'high' | 'caution' }[] = [];
    const text = (emailBody + ' ' + recruiterEmail).toLowerCase();

    if (isFreeWebmail) {
      flags.push({
        id: 'free-mail',
        title: 'Free Webmail Address (@' + emailDomain + ')',
        desc: 'Established companies—even 3-person boutique studios—use business email domains matching their website.',
        severity: 'high',
      });
    } else if (domainMismatch && websiteDomain) {
      flags.push({
        id: 'domain-mismatch',
        title: `Domain Mismatch (@${emailDomain} vs ${websiteDomain})`,
        desc: `Sender email domain does not match the company website. Attackers often register lookalike domains.`,
        severity: 'high',
      });
    }

    if (
      text.includes('check') ||
      text.includes('wire') ||
      text.includes('zelle') ||
      text.includes('western union') ||
      text.includes('cashier') ||
      text.includes('vendor') ||
      text.includes('equipment fee') ||
      text.includes('software license') ||
      text.includes('training fee') ||
      text.includes('ide license')
    ) {
      flags.push({
        id: 'fees-check',
        title: 'Financial Transfer / Equipment / License Fee Demanded',
        desc: 'Legitimate employers NEVER ask candidates to purchase software licenses, cash checks, or wire funds for home office equipment.',
        severity: 'high',
      });
    }

    if (
      text.includes('telegram') ||
      text.includes('whatsapp') ||
      text.includes('signal') ||
      text.includes('text questionnaire') ||
      text.includes('no video') ||
      text.includes('chat interview')
    ) {
      flags.push({
        id: 'chat-only',
        title: 'Chat-Only / Messaging App Interview (No Video Call)',
        desc: 'Conducting an entire hiring process via Telegram, WhatsApp, or text questionnaires without a live video call is a hallmark of employment fraud.',
        severity: 'high',
      });
    }

    if (
      text.includes('ssn') ||
      text.includes('social security') ||
      text.includes('passport') ||
      text.includes('driver\'s license') ||
      text.includes('bank routing')
    ) {
      flags.push({
        id: 'pii',
        title: 'Premature Identity Document Request',
        desc: 'Asking for SSN, photo ID, or banking routing info before an offer is officially signed and verified is an identity theft vector.',
        severity: 'high',
      });
    }

    if (
      text.includes('unpaid test') ||
      text.includes('build this full feature') ||
      text.includes('production app for our client')
    ) {
      flags.push({
        id: 'spec-work',
        title: 'Unpaid Spec Work / Production Deliverable',
        desc: 'Small studios sometimes exploit fresh grads to build client production deliverables for free under the guise of an "interview assignment".',
        severity: 'caution',
      });
    }

    return flags;
  }, [emailBody, recruiterEmail, emailDomain, isFreeWebmail, domainMismatch, websiteDomain]);

  // Safe reply template for fresh graduates
  const safeReplyTemplate = useMemo(() => {
    const cName = companyName.trim() || 'your team';
    const rName = roleTitle.trim() || 'the open role';
    return `Subject: Re: Inquiry regarding ${rName} - Introductory Video Call

Dear Hiring Team at ${cName},

Thank you for reaching out regarding the ${rName} opportunity. As a recent graduate, I am very enthusiastic about ${cName}'s work and would welcome the chance to discuss how my skill set aligns with your projects.

Before proceeding with any onboarding questionnaires or technical assessments, I would appreciate scheduling a brief 15–20 minute introductory video call (via Google Meet, Zoom, or Microsoft Teams) to meet the hiring manager, learn more about your current client initiatives, and ask a few questions about your engineering culture.

Please let me know if you have availability later this week, or feel free to share a calendar link that works for your team.

(Note: As a security standard, my university career advisory encourages candidates to confirm that all technical equipment and software licenses are provisioned directly by the hiring organization and that no personal financial transactions or checks will be exchanged.)

Looking forward to connecting,

[Your Full Legal Name]
[Your Phone Number]
[Your Portfolio / GitHub Link]`;
  }, [companyName, roleTitle]);

  const copyTemplate = () => {
    navigator.clipboard.writeText(safeReplyTemplate);
    setCopiedTemplate(true);
    setTimeout(() => setCopiedTemplate(false), 2000);
  };

  const handleLaunchAudit = () => {
    const cleanCompany = companyName.trim() || 'Small Company / Direct Email Inquirer';
    const cleanTitle = roleTitle.trim() || 'Junior Direct Opportunity';

    const compiledContent = `Candidate Profile: Fresh Graduate evaluating direct email outreach from small business
Scenario: Small company direct email inquiry (No public job board / ATS posting)
Company Name: ${cleanCompany}
Company Website: ${companyWebsite.trim() || 'Not specified'}
Sender Email Address: ${recruiterEmail.trim() || 'Not specified'}
Role / Position: ${cleanTitle}

Email Message / Communication Content:
${emailBody.trim() || 'No email body provided. Evaluating email domain and company details.'}`;

    const newSample: PresetSample = {
      id: `fresh-grad-${Date.now()}`,
      title: cleanTitle,
      company: `${cleanCompany} (Direct Email: ${recruiterEmail || 'Unverified'})`,
      location: 'Remote / Small Business Direct',
      salary: 'Direct Inquiry / In Review',
      postedTime: 'Direct Email Outreach • Fresh Grad Scan',
      category: redFlags.some((f) => f.severity === 'high') ? 'Scam' : 'Legitimate',
      subtitle: `Direct email to ${recruiterEmail || 'recruiter'} • No public job board`,
      threatSummary:
        redFlags.length > 0
          ? `Detected ${redFlags.length} risk vectors for fresh graduate direct contact: ${redFlags
              .map((f) => f.title)
              .join(', ')}.`
          : 'Direct small company contact analyzed for domain integrity, corporate registration, and safe video interview protocols.',
      tags: [
        'Fresh Graduate',
        'Direct Email',
        isFreeWebmail ? 'Free Webmail' : 'Custom Domain',
        websiteDomain ? 'Website Provided' : 'No Website',
      ],
      content: compiledContent,
      officialDomain: websiteDomain || undefined,
    };

    onAuditSubmission(newSample);
  };

  // Pre-fill sample button for demonstration
  const handleLoadSampleScam = () => {
    setRecruiterEmail('apexstudio.recruitment@gmail.com');
    setCompanyName('Apex Studio Interactive');
    setCompanyWebsite('https://apexstudio-interactive.xyz');
    setRoleTitle('Junior React Developer');
    setEmailBody(`Hello, we reviewed your student portfolio and GitHub projects. We are a boutique design agency with 8 staff. We do not post public job ads to avoid recruiter spam.

We are offering you the Junior React Developer position at $48/hour. 
Due to our project schedule, there will be no video interview. We will conduct all onboarding via Telegram chat (@Apex_Talent_Director).
Before your first day on Monday, we will courier you a certified cashier check for $3,200 to purchase your MacBook and development software from our certified vendor. Reply with your full legal name, home address, and phone number.`);
  };

  const handleLoadSampleVerified = () => {
    setRecruiterEmail('elena@craftwork-studios.com');
    setCompanyName('Craftwork Studios');
    setCompanyWebsite('https://craftwork-studios.com');
    setRoleTitle('Junior UI/UX Designer');
    setEmailBody(`Hi there,

I saw your recent design case study on your portfolio. We are Craftwork Studios, a 10-person product design consultancy based in Seattle. We don't maintain a formal public job board, but we hire 1-2 junior designers a year through portfolio reviews.

We'd love to invite you to a 30-minute Google Meet video chat next Tuesday to walk through your portfolio and answer any questions you have about our studio. 

Craftwork provides all hardware (M3 MacBook Pro) and software licenses (Figma, Adobe CC) directly to all staff. We never ask candidates to purchase equipment or exchange checks.

Let me know if Tuesday at 2pm PT works for you!
Elena Rostova, Partner & Design Director`);
  };

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-6 shadow-xs space-y-6">
      {/* Header Banner */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 pb-4 border-b border-slate-200">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600 shrink-0">
            <GraduationCap className="w-5 h-5" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-base font-bold text-slate-900">
                Fresh Graduate & Small Company Direct Email Shield
              </h3>
              <span className="text-[10px] font-mono font-semibold px-2 py-0.5 rounded-full bg-blue-50 text-blue-700 border border-blue-200 uppercase">
                No Job Board Vector
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Small agencies and startups often have no public job postings. Scan direct emails, inspect domain authenticity, and verify company legitimacy before replying.
            </p>
          </div>
        </div>

        {/* Demo Quick Fills */}
        <div className="flex items-center gap-2 shrink-0">
          <span className="text-[11px] text-slate-400 font-medium">Test Scenarios:</span>
          <button
            type="button"
            onClick={handleLoadSampleScam}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-rose-50 hover:bg-rose-100 text-rose-700 border border-rose-200 transition-colors"
          >
            ⚠️ Free Gmail Scam
          </button>
          <button
            type="button"
            onClick={handleLoadSampleVerified}
            className="text-[11px] font-medium px-2.5 py-1 rounded-lg bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border border-emerald-200 transition-colors"
          >
            🛡️ Verified Studio
          </button>
        </div>
      </div>

      {/* Input Form Fields */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Recruiter Email */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Mail className="w-3.5 h-3.5 text-blue-600" />
              Recruiter / Sender Email Address
            </span>
            {isFreeWebmail && (
              <span className="text-[11px] text-rose-600 font-medium flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> Free Webmail
              </span>
            )}
          </label>
          <input
            type="email"
            value={recruiterEmail}
            onChange={(e) => setRecruiterEmail(e.target.value)}
            placeholder="e.g. founder@smallstudio.io or studio.hiring@gmail.com"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Company Website */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center justify-between">
            <span className="flex items-center gap-1.5">
              <Globe className="w-3.5 h-3.5 text-blue-600" />
              Company Website (if mentioned)
            </span>
            {websiteDomain && (
              <span className="text-[11px] text-slate-500 font-mono">
                Host: {websiteDomain}
              </span>
            )}
          </label>
          <input
            type="text"
            value={companyWebsite}
            onChange={(e) => setCompanyWebsite(e.target.value)}
            placeholder="e.g. https://smallstudio.io"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Company Name */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <Building2 className="w-3.5 h-3.5 text-blue-600" />
            Company / Studio Name
          </label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="e.g. Craftwork Studios LLC"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>

        {/* Role Title */}
        <div>
          <label className="block text-xs font-semibold text-slate-700 mb-1 flex items-center gap-1.5">
            <FileCheck2 className="w-3.5 h-3.5 text-blue-600" />
            Position Discussed
          </label>
          <input
            type="text"
            value={roleTitle}
            onChange={(e) => setRoleTitle(e.target.value)}
            placeholder="e.g. Junior Frontend Developer"
            className="w-full bg-white border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:outline-none focus:border-blue-600"
          />
        </div>
      </div>

      {/* Email Body / Communication Content */}
      <div>
        <label className="block text-xs font-semibold text-slate-700 mb-1">
          Direct Email / Message Content Received (or your draft inquiry)
        </label>
        <textarea
          rows={5}
          value={emailBody}
          onChange={(e) => setEmailBody(e.target.value)}
          placeholder="Paste the email message received from the recruiter, offer letter details, or the outreach conversation here..."
          className="w-full bg-slate-50 border border-slate-300 rounded-xl p-3 text-xs font-mono text-slate-900 focus:bg-white focus:outline-none focus:border-blue-600 resize-y leading-relaxed"
        />
      </div>

      {/* Live Pre-Scan Red Flag Findings */}
      {redFlags.length > 0 ? (
        <div className="rounded-xl border border-rose-200 bg-rose-50/50 p-4 space-y-3">
          <div className="flex items-center gap-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <h4 className="text-xs font-bold text-rose-900 uppercase tracking-wider font-mono">
              Immediate Red Flags Detected ({redFlags.length})
            </h4>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
            {redFlags.map((flag) => (
              <div
                key={flag.id}
                className={`rounded-lg p-3 text-xs border ${
                  flag.severity === 'high'
                    ? 'bg-white border-rose-200 text-rose-900'
                    : 'bg-white border-amber-200 text-amber-900'
                }`}
              >
                <div className="font-semibold flex items-center gap-1.5 mb-1">
                  <span
                    className={`w-2 h-2 rounded-full ${
                      flag.severity === 'high' ? 'bg-rose-600' : 'bg-amber-600'
                    }`}
                  />
                  <span>{flag.title}</span>
                </div>
                <p className="text-[11px] text-slate-600">{flag.desc}</p>
              </div>
            ))}
          </div>
        </div>
      ) : recruiterEmail || emailBody ? (
        <div className="rounded-xl border border-emerald-200 bg-emerald-50/40 p-3.5 flex items-center gap-2.5 text-xs text-emerald-800">
          <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
          <span>
            Initial vector check: Email domain appears custom, and no overt check scams or telegram text-only interview demands were detected in the immediate text. Run full audit to verify registry records.
          </span>
        </div>
      ) : null}

      {/* Quick Small Company Verification Toolkit */}
      <div className="rounded-xl border border-slate-200 bg-slate-50/70 p-4 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Search className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold font-mono uppercase tracking-wider text-slate-800">
              Small Company Verification Toolkit
            </h4>
          </div>
          <span className="text-[11px] text-slate-500">How fresh grads confirm a real business</span>
        </div>

        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 text-xs">
          {/* OpenCorporates Search */}
          <a
            href={`https://opencorporates.com/companies?q=${encodeURIComponent(companyName || 'company')}`}
            target="_blank"
            rel="noreferrer noopener"
            className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>1. State Business Registry</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Check Secretary of State / OpenCorporates filing to confirm active legal entity.
              </p>
            </div>
            <span className="text-[10px] text-blue-600 font-medium mt-2 font-mono">
              Search OpenCorporates →
            </span>
          </a>

          {/* LinkedIn Staff Count */}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `site:linkedin.com/company "${companyName || 'company'}"`
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>2. Employee Footprint</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Search Google for company page on LinkedIn to verify real staff and founder profiles.
              </p>
            </div>
            <span className="text-[10px] text-blue-600 font-medium mt-2 font-mono">
              Find LinkedIn Profile →
            </span>
          </a>

          {/* Google Scam / Fraud Check */}
          <a
            href={`https://www.google.com/search?q=${encodeURIComponent(
              `"${companyName || 'company'}" (scam OR fraud OR "fake job" OR "check" OR "complaint")`
            )}`}
            target="_blank"
            rel="noreferrer noopener"
            className="p-3 rounded-lg bg-white border border-slate-200 hover:border-blue-400 hover:bg-blue-50/30 transition-all flex flex-col justify-between group shadow-2xs"
          >
            <div>
              <div className="font-semibold text-slate-900 flex items-center justify-between">
                <span>3. Scam & Fraud Reports</span>
                <ExternalLink className="w-3.5 h-3.5 text-slate-400 group-hover:text-blue-600" />
              </div>
              <p className="text-[11px] text-slate-500 mt-1">
                Search Reddit, Glassdoor, and Better Business Bureau for prior candidate reports.
              </p>
            </div>
            <span className="text-[10px] text-blue-600 font-medium mt-2 font-mono">
              Search Scam Reports →
            </span>
          </a>
        </div>
      </div>

      {/* Safe Candidate Reply Generator */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Video className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-bold text-slate-900">
              Safe Fresh Graduate Reply Template (Insist on Video Interview)
            </h4>
          </div>
          <button
            type="button"
            onClick={copyTemplate}
            className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold bg-slate-100 hover:bg-slate-200 text-slate-700 transition-colors"
          >
            {copiedTemplate ? (
              <>
                <Check className="w-3.5 h-3.5 text-emerald-600" />
                <span className="text-emerald-700">Copied to Clipboard!</span>
              </>
            ) : (
              <>
                <Copy className="w-3.5 h-3.5" />
                <span>Copy Safe Reply</span>
              </>
            )}
          </button>
        </div>
        <p className="text-[11px] text-slate-500">
          Send this safe response to any recruiter or small business owner. Scammers will disappear when you insist on a live video call and reject financial checks, while legitimate small studio founders will happily jump on Google Meet.
        </p>
        <pre className="p-3 bg-slate-50 border border-slate-200 rounded-lg text-[11px] font-mono text-slate-800 whitespace-pre-wrap leading-relaxed overflow-x-auto">
          {safeReplyTemplate}
        </pre>
      </div>

      {/* Launch Audit Action Button */}
      <div className="flex items-center justify-between pt-2 border-t border-slate-200">
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <ShieldCheck className="w-4 h-4 text-blue-600" />
          <span>Zero-Trust Middleware will evaluate domain DNS records, MX health, and offer vectors.</span>
        </div>

        <button
          type="button"
          onClick={handleLaunchAudit}
          disabled={!recruiterEmail.trim() && !emailBody.trim()}
          className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 active:bg-blue-800 disabled:opacity-40 text-white text-xs font-semibold shadow-xs transition-all"
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>Audit This Direct Email Outreach</span>
        </button>
      </div>
    </div>
  );
};
