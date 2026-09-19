import React from 'react';
import { PresetSample } from '../types';
import { MapPin, DollarSign, Clock, ShieldAlert, ShieldCheck, AlertTriangle, Ghost } from 'lucide-react';

interface OpportunityCardProps {
  job: PresetSample;
  isSelected: boolean;
  onSelect: (job: PresetSample) => void;
  currentGhostScore?: number;
  currentTrustLevel?: string;
}

export const OpportunityCard: React.FC<OpportunityCardProps> = ({
  job,
  isSelected,
  onSelect,
  currentGhostScore,
  currentTrustLevel,
}) => {
  const score = currentGhostScore !== undefined ? currentGhostScore : job.initialGhostScore ?? 50;
  const trust = currentTrustLevel || job.initialTrustLevel || 'Caution';

  // Determine badge styling based on score & category
  const getBadgeStyle = () => {
    if (score >= 80 || trust === 'Danger') {
      return {
        bg: 'bg-rose-50 text-rose-700 border-rose-200',
        icon: <ShieldAlert className="w-3 h-3 text-rose-600" />,
        label: `${score}% Threat • ${trust}`,
      };
    }
    if (score >= 50 || job.category === 'Ghost Job' || trust === 'Suspicious') {
      return {
        bg: 'bg-amber-50 text-amber-800 border-amber-200',
        icon: <Ghost className="w-3 h-3 text-amber-600" />,
        label: `${score}% Ghost Risk`,
      };
    }
    if (score > 20 || trust === 'Caution') {
      return {
        bg: 'bg-orange-50 text-orange-800 border-orange-200',
        icon: <AlertTriangle className="w-3 h-3 text-orange-600" />,
        label: `${score}% Caution`,
      };
    }
    return {
      bg: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      icon: <ShieldCheck className="w-3 h-3 text-emerald-600" />,
      label: `Verified Safe`,
    };
  };

  const badge = getBadgeStyle();

  // Company avatar letter & styling
  const companyInitial = job.company ? job.company.charAt(0).toUpperCase() : 'R';
  const getAvatarBg = () => {
    if (job.company.toLowerCase().includes('kalshi')) return 'bg-purple-50 text-purple-700 border-purple-200';
    if (job.company.toLowerCase().includes('google')) return 'bg-blue-50 text-blue-700 border-blue-200';
    if (job.company.toLowerCase().includes('microsoft')) return 'bg-cyan-50 text-cyan-800 border-cyan-200';
    if (job.company.toLowerCase().includes('apex')) return 'bg-violet-50 text-violet-700 border-violet-200';
    return 'bg-slate-100 text-slate-700 border-slate-200';
  };

  return (
    <div
      id={`opportunity-card-${job.id}`}
      onClick={() => onSelect(job)}
      className={`group cursor-pointer rounded-xl p-4 transition-all duration-150 border text-left ${
        isSelected
          ? 'bg-blue-50/40 border-blue-600 shadow-sm ring-1 ring-blue-600/30'
          : 'bg-white border-slate-200 hover:border-slate-300 hover:bg-slate-50/50 hover:shadow-xs'
      }`}
    >
      {/* Top Row: Avatar + Title + Threat Badge */}
      <div className="flex items-start justify-between gap-3">
        <div className="flex items-start gap-3 min-w-0">
          <div
            className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-sm border ${getAvatarBg()}`}
          >
            {companyInitial}
          </div>
          <div className="min-w-0">
            <h3 className="text-sm font-semibold text-slate-900 group-hover:text-blue-600 transition-colors line-clamp-1">
              {job.title}
            </h3>
            <div className="flex items-center gap-1.5 text-xs text-slate-500 mt-0.5">
              <span className="font-medium text-slate-700 truncate max-w-[140px]">
                {job.company.split('(')[0].trim()}
              </span>
              <span>•</span>
              <span className="flex items-center gap-0.5 text-slate-500 truncate">
                <MapPin className="w-3 h-3 shrink-0 text-slate-400" />
                {job.location}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Salary & Posted Metadata */}
      <div className="flex flex-wrap items-center justify-between gap-2 mt-3 pt-2.5 border-t border-slate-100 text-xs">
        <div className="flex items-center gap-1 text-emerald-700 font-medium font-mono text-[11px]">
          <DollarSign className="w-3 h-3 text-emerald-600 shrink-0" />
          <span>{job.salary}</span>
        </div>
        <div className="flex items-center gap-1 text-slate-500 text-[11px]">
          <Clock className="w-3 h-3 shrink-0 text-slate-400" />
          <span>{job.postedTime}</span>
        </div>
      </div>

      {/* Tags & Copilot Threat Assessment */}
      <div className="mt-3 flex flex-wrap items-center justify-between gap-2">
        <div className="flex flex-wrap gap-1">
          {job.tags.slice(0, 2).map((tag, idx) => (
            <span
              key={idx}
              className="text-[10px] px-2 py-0.5 rounded-md bg-slate-100 border border-slate-200 text-slate-600 font-mono"
            >
              #{tag}
            </span>
          ))}
        </div>

        {/* Status Radar Badge */}
        <span
          className={`inline-flex items-center gap-1.5 text-[11px] font-mono font-semibold px-2 py-0.5 rounded-full border ${badge.bg}`}
        >
          {badge.icon}
          {badge.label}
        </span>
      </div>
    </div>
  );
};
