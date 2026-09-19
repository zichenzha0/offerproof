import React from 'react';
import { ShieldCheck, ShieldAlert, AlertTriangle, ShieldX, Sparkles, AlertCircle } from 'lucide-react';

interface ScoreGaugeProps {
  score: number;
  trustLevel: string;
  category?: string;
}

export const ScoreGauge: React.FC<ScoreGaugeProps> = ({ score, trustLevel, category }) => {
  const normalizedScore = Math.max(0, Math.min(100, score || 0));

  const getLevelConfig = (level: string) => {
    const l = (level || '').toLowerCase();
    if (l.includes('safe') || l.includes('low risk')) {
      return {
        badgeBg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
        ringColor: '#059669',
        barColor: 'bg-emerald-600',
        textColor: 'text-emerald-700',
        icon: <ShieldCheck className="w-4 h-4 text-emerald-600" />,
        label: 'VERIFIED LOW RISK • SAFE ROLE',
        summary:
          'Zero-Trust Copilot has verified valid corporate origin, legitimate email headers (DKIM/SPF passing), and official enterprise career paths. No advance financial fees or unauthorized equipment demands detected.',
      };
    }
    if (l.includes('caution')) {
      return {
        badgeBg: 'bg-amber-50 text-amber-800 border-amber-200',
        ringColor: '#d97706',
        barColor: 'bg-amber-600',
        textColor: 'text-amber-800',
        icon: <AlertTriangle className="w-4 h-4 text-amber-600" />,
        label: 'ELEVATED CAUTION • UNCONFIRMED METADATA',
        summary:
          'Certain fields or recruiter vectors could not be fully verified against public records. Proceed with standard caution: do not send sensitive identity documents prior to formal authenticated portal access.',
      };
    }
    if (l.includes('suspicious')) {
      return {
        badgeBg: 'bg-orange-50 text-orange-800 border-orange-200',
        ringColor: '#ea580c',
        barColor: 'bg-orange-600',
        textColor: 'text-orange-800',
        icon: <AlertCircle className="w-4 h-4 text-orange-600" />,
        label: 'GHOST JOB / SUSPICIOUS REQUISITION',
        summary:
          'Stale auto-renewed requisition detected. Data suggests this opening may be an abandoned "Ghost Job" or passive talent reservoir with no active hiring headcount or recruiter activity.',
      };
    }
    // Danger / Scam
    return {
      badgeBg: 'bg-rose-50 text-rose-700 border-rose-200',
      ringColor: '#e11d48',
      barColor: 'bg-rose-600',
      textColor: 'text-rose-700',
      icon: <ShieldX className="w-4 h-4 text-rose-600" />,
      label: 'CRITICAL FRAUD / ACTIVE SCAM DETECTED',
      summary:
        'High-severity risk triggers: typosquatted domain impersonation, counterfeit equipment cashier check scheme, or unauthorized premature harvesting of sensitive biometric/SSN credentials.',
    };
  };

  const config = getLevelConfig(trustLevel);

  // SVG Circular Meter calculations
  const radius = 38;
  const circumference = 2 * Math.PI * radius;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  return (
    <div
      id="score-gauge-container"
      className="rounded-2xl border border-slate-200 bg-white p-5 shadow-xs"
    >
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-5">
        {/* Left: Score Gauge Dial & Status */}
        <div className="flex items-center gap-4">
          <div className="relative w-20 h-20 shrink-0 flex items-center justify-center">
            <svg className="w-20 h-20 -rotate-90 transform" viewBox="0 0 100 100">
              <circle
                cx="50"
                cy="50"
                r={radius}
                className="stroke-slate-100"
                strokeWidth="8"
                fill="transparent"
              />
              <circle
                cx="50"
                cy="50"
                r={radius}
                stroke={config.ringColor}
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                strokeLinecap="round"
                fill="transparent"
                className="transition-all duration-1000 ease-out"
              />
            </svg>
            <div className="absolute inset-0 flex flex-col items-center justify-center text-center">
              <span className={`text-xl font-extrabold font-mono leading-none ${config.textColor}`}>
                {normalizedScore}
              </span>
              <span className="text-[9px] font-mono text-slate-500 uppercase mt-0.5">Risk</span>
            </div>
          </div>

          <div>
            <div className="flex items-center gap-2 mb-1">
              <span className="text-xs font-mono tracking-wider text-slate-500 uppercase">
                Zero-Trust Verification Status
              </span>
              <span
                className={`inline-flex items-center gap-1 text-[11px] font-semibold font-mono px-2 py-0.5 rounded-full border ${config.badgeBg}`}
              >
                {config.icon}
                {trustLevel}
              </span>
            </div>
            <h2 className="text-base font-bold text-slate-900 tracking-tight">
              {config.label}
            </h2>
            <div className="text-xs text-slate-500 mt-0.5 flex items-center gap-2 font-mono">
              <span>Ghost Score: {normalizedScore}/100</span>
              <span>•</span>
              <span className="font-semibold text-slate-700">
                {normalizedScore > 75
                  ? 'Severe Hazard'
                  : normalizedScore > 40
                  ? 'Review Needed'
                  : 'Cleared'}
              </span>
            </div>
          </div>
        </div>

        {/* Right: Quick Action Metric */}
        <div className="bg-slate-50 border border-slate-200 px-4 py-2.5 rounded-xl flex items-center gap-3 shrink-0">
          <div className="p-2 rounded-lg bg-blue-50 text-blue-700 border border-blue-200">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="text-[10px] font-mono uppercase text-slate-500">Zero-Trust Matrix</div>
            <div className="text-xs font-bold text-slate-900">5 Vectors Evaluated</div>
          </div>
        </div>
      </div>

      {/* Zero-Trust Copilot Briefing Box */}
      <div className="mt-4 rounded-xl bg-slate-50 border border-slate-200 p-3.5 flex items-start gap-3">
        <div className="w-5 h-5 rounded-md bg-blue-100 border border-blue-200 flex items-center justify-center shrink-0 mt-0.5 text-blue-700">
          <Sparkles className="w-3 h-3" />
        </div>
        <p className="text-xs text-slate-700 leading-relaxed">
          <strong className="text-slate-900 font-semibold">Copilot Briefing: </strong>
          {config.summary}
        </p>
      </div>
    </div>
  );
};
