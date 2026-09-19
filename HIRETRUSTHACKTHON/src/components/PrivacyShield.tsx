import React from 'react';
import { EyeOff, ShieldBan, PhoneCall, Check, ExternalLink } from 'lucide-react';

interface PrivacyShieldProps {
  sensitiveData: string[];
  maliciousLinks: string[];
  officialHrContact: string;
}

export const PrivacyShield: React.FC<PrivacyShieldProps> = ({
  sensitiveData,
  maliciousLinks,
  officialHrContact,
}) => {
  const [copiedContact, setCopiedContact] = React.useState(false);

  const copyToClipboard = (text: string) => {
    navigator.clipboard.writeText(text);
    setCopiedContact(true);
    setTimeout(() => setCopiedContact(false), 2000);
  };

  return (
    <div id="privacy-safety-reporting" className="grid grid-cols-1 md:grid-cols-2 gap-4">
      {/* Privacy & Masking */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs">
        <div className="flex items-center gap-2 mb-3">
          <div className="p-1.5 rounded-lg bg-emerald-50 border border-emerald-100">
            <EyeOff className="w-4 h-4 text-emerald-600" />
          </div>
          <div>
            <h4 className="text-sm font-semibold text-slate-900">Sensitive Data Quarantine</h4>
            <p className="text-[11px] text-slate-500">Personally Identifiable Information (PII) auto-masked</p>
          </div>
        </div>

        {sensitiveData && sensitiveData.length > 0 ? (
          <div className="flex flex-wrap gap-1.5 mt-2">
            {sensitiveData.map((item, idx) => (
              <span
                key={idx}
                className="inline-flex items-center gap-1.5 text-xs font-mono px-2.5 py-1 rounded bg-emerald-50 border border-emerald-200 text-emerald-700 font-medium"
              >
                <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
                {item}
              </span>
            ))}
          </div>
        ) : (
          <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-3 text-xs text-slate-500 italic">
            No sensitive unmasked PII strings detected in this payload.
          </div>
        )}

        {/* Malicious links */}
        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="flex items-center gap-1.5 mb-2">
            <ShieldBan className="w-3.5 h-3.5 text-rose-600" />
            <span className="text-xs font-semibold text-slate-800">Quarantined / Malicious Outbound Links</span>
          </div>

          {maliciousLinks && maliciousLinks.length > 0 ? (
            <div className="space-y-1.5">
              {maliciousLinks.map((link, idx) => (
                <div
                  key={idx}
                  className="flex items-center justify-between text-xs font-mono px-2.5 py-1.5 rounded bg-rose-50 border border-rose-200 text-rose-700 break-all"
                >
                  <span className="line-through opacity-90">{link}</span>
                  <span className="shrink-0 text-[10px] uppercase font-bold text-rose-700 px-1.5 py-0.5 rounded bg-rose-100 ml-2">
                    Blocked
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-lg bg-slate-50 border border-slate-200/80 p-2.5 text-xs text-slate-500 italic">
              No dangerous external phishing or scam URLs detected.
            </div>
          )}
        </div>
      </div>

      {/* Action & Reporting */}
      <div className="rounded-xl border border-slate-200 bg-white p-4 shadow-xs flex flex-col justify-between">
        <div>
          <div className="flex items-center gap-2 mb-3">
            <div className="p-1.5 rounded-lg bg-blue-50 border border-blue-100">
              <PhoneCall className="w-4 h-4 text-blue-600" />
            </div>
            <div>
              <h4 className="text-sm font-semibold text-slate-900">Action & Official Reporting</h4>
              <p className="text-[11px] text-slate-500">Direct verified contacts & fraud escalation path</p>
            </div>
          </div>

          <div className="mt-2 rounded-lg bg-slate-50 border border-slate-200 p-3">
            <div className="text-[11px] font-mono text-slate-500 mb-1 uppercase tracking-wider">
              Verified HR / Security Channel:
            </div>
            <div className="flex items-center justify-between gap-2">
              <div className="text-xs font-mono text-blue-700 font-medium select-all break-all">
                {officialHrContact || 'Verify with official enterprise career portal (e.g. company.com/careers)'}
              </div>
              {officialHrContact && (
                <button
                  id="btn-copy-hr-contact"
                  type="button"
                  onClick={() => copyToClipboard(officialHrContact)}
                  className="shrink-0 inline-flex items-center gap-1 text-[11px] px-2 py-1 rounded bg-white hover:bg-slate-100 text-slate-700 transition-colors border border-slate-200 shadow-xs font-medium"
                  title="Copy Contact"
                >
                  {copiedContact ? <Check className="w-3 h-3 text-emerald-600" /> : 'Copy'}
                </button>
              )}
            </div>
          </div>
        </div>

        <div className="mt-4 pt-3 border-t border-slate-100">
          <div className="text-[11px] text-slate-500 leading-relaxed">
            <span className="font-semibold text-slate-700">Auditor Advisory:</span> Legitimate enterprise employers never require advance payments, cryptocurrency transfers, or software equipment purchases via personal accounts. Always verify requisition IDs directly on the company's authenticated career domain.
          </div>
        </div>
      </div>
    </div>
  );
};
