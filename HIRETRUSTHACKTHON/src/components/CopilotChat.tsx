import React, { useState } from 'react';
import { Sparkles, Send, Bot, User, CheckCircle2, ShieldAlert, MailCheck, AlertTriangle } from 'lucide-react';
import { RecruitmentAuditResult, PresetSample } from '../types';

interface CopilotChatProps {
  auditResult: RecruitmentAuditResult | null;
  selectedJob: PresetSample | null;
}

interface ChatMessage {
  id: string;
  sender: 'user' | 'copilot';
  text: string;
  timestamp: string;
}

export const CopilotChat: React.FC<CopilotChatProps> = ({
  auditResult,
  selectedJob,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([
    {
      id: '1',
      sender: 'copilot',
      text: `Hello! I'm your Zero-Trust Recruitment Copilot. I've audited "${
        selectedJob?.title || 'this role'
      }". You can ask me to explain detected fraud vectors, draft an inquiry to verified HR, check domain registration details, or evaluate offer safety.`,
      timestamp: 'Just now',
    },
  ]);
  const [inputQuery, setInputQuery] = useState('');
  const [isTyping, setIsTyping] = useState(false);

  const suggestedPrompts = [
    'How do fresh grads verify a small company with no job board?',
    'What if the recruiter uses a @gmail.com address?',
    'How does the fake check equipment scam work?',
    'Draft a verification email to official HR',
  ];

  const handleSendMessage = (textToSend?: string) => {
    const query = (textToSend || inputQuery).trim();
    if (!query) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: 'user',
      text: query,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputQuery('');
    setIsTyping(true);

    // Context-aware Zero-Trust Copilot responder
    setTimeout(() => {
      let replyText = '';
      const q = query.toLowerCase();

      if (q.includes('fresh grad') || q.includes('small company') || q.includes('no job board') || q.includes('no job posting') || q.includes('portfolio')) {
        replyText = `🎓 **Zero-Trust Playbook for Fresh Graduates Contacting Small Companies:**
Many boutique agencies, engineering consultancies, and seed startups never post on public job boards. To avoid scams when contacting or being contacted by them:

1. 🌐 **Domain Health Check:** Verify the recruiter's email domain matches their website (e.g., \`sarah@boutiquestudio.com\`). Even a 3-person firm will have a domain email. If they use \`@gmail.com\` or a lookalike domain, treat it as high risk.
2. 📹 **Mandatory Video Call (The 1-Minute Rule):** Always insist on an introductory 15-minute video call via Zoom or Google Meet with cameras on. Scammers impersonating companies will *always* decline or make excuses ("system migration", "text chat only on Telegram/WhatsApp").
3. 🏛️ **Secretary of State (SOS) Registration:** Search the company name on [OpenCorporates.com](https://opencorporates.com) or state SOS division to verify active legal registration and filing history.
4. 🚫 **Absolute Red Lines:**
   • *Never* deposit an equipment check or pay for "software license keys / IDE tools". Real studios provide company laptops or invite you to team software seats.
   • *Never* perform multi-day production deliverables for free (spec work). A reasonable technical test is 1-2 hours or paid pairing.`;
      } else if (q.includes('gmail') || q.includes('free mail') || q.includes('outlook.com') || q.includes('yahoo')) {
        replyText = `📧 **Why Free Webmail (@gmail.com) is a Red Flag for Small Businesses:**
• **Corporate Identity:** Even early-stage startups and small agencies purchase a $6/month Google Workspace or Microsoft 365 seat with their custom domain (e.g. \`founder@company.com\`) for credibility and client billing.
• **Impersonation Attack:** Scammers frequently create addresses like \`companyname.careers@gmail.com\` or \`recruiter.companyname@outlook.com\` to pose as legitimate executives.
• **When might it be innocent?** In rare cases, a 1-person solo freelancer might use Gmail, but for any real hiring, insist on verifying their LinkedIn profile and jumping on a live video call before disclosing your phone number or resume details.`;
      } else if (q.includes('check') || q.includes('equipment') || q.includes('cashier')) {
        replyText = `⚠️ **How the Fake Check Scam Operates:**
1. The scammer issues a forged or stolen cashier's check (e.g. $4,850) for home office setup.
2. Federal banking rules require banks to make funds accessible within 1-2 business days, well before the check fully clears the issuing institution.
3. They pressure you into immediately sending money via wire transfer, Zelle, or cryptocurrency to an "approved equipment vendor".
4. When the check is ultimately rejected days later as fraudulent, your bank withdraws the full amount from your personal account, leaving you with severe financial liability.
✅ **Standard Practice:** Legitimate enterprise employers ship physical hardware directly to candidates via corporate IT logistics (e.g., Apple Business Manager, corporate IT depots). They never require candidates to handle check-clearing transactions.`;
      } else if (q.includes('ghost') || q.includes('abandoned') || q.includes('stale')) {
        replyText = `👻 **Ghost Job Indicators in this Requisition:**
• **Automated Repost Cycle:** This requisition is auto-renewed on a 30-day cron without an active hiring manager or approved headcount budget.
• **Evergreen Reservoir:** The copy explicitly indicates passive pooling for indefinite future needs rather than immediate hiring.
• **No Active Staffing Assignment:** No specific recruiter or team member is actively reading applicant submissions.
✅ **Best Action:** Look for recently opened requisitions (< 14 days) with verifiable requisition numbers and direct employee referral connections.`;
      } else if (q.includes('draft') || q.includes('email') || q.includes('hr')) {
        const companyName = selectedJob?.company.split('(')[0].trim() || 'Company';
        const contact = auditResult?.action_and_reporting.official_hr_contact || 'careers@company.com';
        replyText = `📨 **Template to Verify With Official People Operations:**

**Subject:** Verification of Recruitment Outreach for Requisition: ${selectedJob?.title || 'Open Role'}

Dear ${companyName} Talent Acquisition & Security Team,

I recently received recruitment correspondence purporting to represent ${companyName} regarding the "${selectedJob?.title || 'Open Position'}" role.

Before submitting sensitive credentials or progressing further, I would appreciate your confirmation as to whether this outreach originated from your authorized hiring team:
- Sender address: ${selectedJob?.subtitle.split('From:')[1] || 'Recruiter address'}
- Requisition Reference: ${selectedJob?.title || 'Engineering Role'}

Could you please confirm if this represents an authentic requisition currently open for active recruitment?

Thank you for your guidance,
[Your Full Name]
[Your Contact Information]

*Recommended recipient:* \`${contact}\``;
      } else if (q.includes('typosquat') || q.includes('domain')) {
        replyText = `🔍 **Typosquatting Breakdown:**
• Attackers register lookalike domains using subtle character substitutions (e.g., digit '0' in place of letter 'o', such as \`g00gle-careers.net\`).
• They host email exchangers on unverified cloud VPS providers without legitimate enterprise cryptographic alignments (SPF/DKIM/DMARC).
✅ **Verification Rule:** Inspect the actual sender domain suffix, MX records, and the Return-Path header against the organization's verified canonical website.`;
      } else {
        replyText = `Audit Analysis Summary for this opportunity:
• **Trust Status:** ${auditResult?.trust_level || 'Caution'} (Ghost/Risk Score: ${auditResult?.ghost_score || 85}/100)
• **Key Concern:** ${auditResult?.verifications.offer_verification.details || 'Review details in the Trust Vectors tab'}
• **Next Step:** Do not submit unmasked SSN, passport photos, or financial data until authenticated via official enterprise portals.`;
      }

      const copilotMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: 'copilot',
        text: replyText,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      };

      setMessages((prev) => [...prev, copilotMsg]);
      setIsTyping(false);
    }, 600);
  };

  return (
    <div id="zero-trust-copilot-chat" className="rounded-xl border border-slate-200 bg-white flex flex-col h-[520px] shadow-xs">
      {/* Copilot Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-slate-200 bg-slate-50/70">
        <div className="flex items-center gap-2.5">
          <div className="w-8 h-8 rounded-lg bg-blue-600 flex items-center justify-center text-white shadow-xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h4 className="text-xs font-bold text-slate-900 uppercase tracking-wide">
                Zero-Trust Career Advisor
              </h4>
              <span className="text-[10px] font-mono px-2 py-0.2 rounded-full bg-blue-50 text-blue-700 border border-blue-200">
                Active
              </span>
            </div>
            <p className="text-[11px] text-slate-500">
              Interactive career fraud advisor & guidance assistant
            </p>
          </div>
        </div>

        <div className="text-[11px] font-mono text-slate-500 hidden sm:block">
          Grounded on Zero-Trust Matrix
        </div>
      </div>

      {/* Messages Thread */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3.5 text-xs bg-slate-50/40">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex gap-2.5 ${msg.sender === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            {msg.sender === 'copilot' && (
              <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-blue-600">
                <Bot className="w-3.5 h-3.5" />
              </div>
            )}

            <div
              className={`max-w-[85%] rounded-xl p-3 leading-relaxed whitespace-pre-wrap ${
                msg.sender === 'user'
                  ? 'bg-blue-600 text-white font-normal shadow-xs'
                  : 'bg-white border border-slate-200 text-slate-800 shadow-xs'
              }`}
            >
              {msg.text}
              <div
                className={`text-[9px] font-mono mt-1 ${
                  msg.sender === 'user' ? 'text-blue-100 text-right' : 'text-slate-400'
                }`}
              >
                {msg.timestamp}
              </div>
            </div>

            {msg.sender === 'user' && (
              <div className="w-6 h-6 rounded-md bg-slate-200 border border-slate-300 flex items-center justify-center shrink-0 mt-0.5 text-slate-700">
                <User className="w-3.5 h-3.5" />
              </div>
            )}
          </div>
        ))}

        {isTyping && (
          <div className="flex gap-2.5 items-center text-xs text-slate-500 font-mono">
            <div className="w-6 h-6 rounded-md bg-blue-50 border border-blue-200 flex items-center justify-center text-blue-600">
              <Bot className="w-3.5 h-3.5" />
            </div>
            <div className="flex gap-1 items-center bg-white border border-slate-200 px-3 py-1.5 rounded-lg shadow-xs">
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.2s]" />
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600 animate-bounce [animation-delay:0.4s]" />
              <span className="ml-1 text-[11px] text-slate-600">Analyzing recruitment vectors...</span>
            </div>
          </div>
        )}
      </div>

      {/* Suggested Chips */}
      <div className="px-4 py-2.5 border-t border-slate-200 bg-white">
        <div className="text-[10px] font-mono text-slate-500 mb-1.5 uppercase tracking-wider">
          Quick Inquiries:
        </div>
        <div className="flex flex-wrap gap-1.5">
          {suggestedPrompts.map((prompt, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => handleSendMessage(prompt)}
              className="text-[11px] px-2.5 py-1 rounded-full bg-slate-100 hover:bg-slate-200 text-slate-700 hover:text-slate-900 border border-slate-200 transition-colors text-left font-medium"
            >
              {prompt}
            </button>
          ))}
        </div>
      </div>

      {/* Input Bar */}
      <div className="p-3 border-t border-slate-200 bg-white">
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSendMessage();
          }}
          className="flex items-center gap-2"
        >
          <input
            id="copilot-input"
            type="text"
            value={inputQuery}
            onChange={(e) => setInputQuery(e.target.value)}
            placeholder="Ask about this recruiter, offer letter, or fraud vector..."
            className="flex-1 bg-slate-50 border border-slate-300 rounded-lg px-3 py-2 text-xs text-slate-900 placeholder-slate-400 focus:bg-white focus:outline-none focus:border-blue-600"
          />
          <button
            id="copilot-send-btn"
            type="submit"
            disabled={!inputQuery.trim() || isTyping}
            className="inline-flex items-center justify-center p-2 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-40 text-white transition-colors shadow-xs"
          >
            <Send className="w-4 h-4" />
          </button>
        </form>
      </div>
    </div>
  );
};
