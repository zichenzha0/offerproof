import React from 'react';
import { VerificationItem, VerificationStatus } from '../types';
import { Building2, UserCheck, Globe, Briefcase, FileCheck, CheckCircle2, XCircle, AlertCircle, HelpCircle } from 'lucide-react';

interface VerificationCardProps {
  id: string;
  category: 'company' | 'recruiter' | 'domain' | 'job' | 'offer';
  title: string;
  subtitle: string;
  data: VerificationItem;
}

export const VerificationCard: React.FC<VerificationCardProps> = ({
  id,
  category,
  title,
  subtitle,
  data,
}) => {
  const getIcon = () => {
    switch (category) {
      case 'company':
        return <Building2 className="w-4 h-4 text-sky-600" />;
      case 'recruiter':
        return <UserCheck className="w-4 h-4 text-blue-600" />;
      case 'domain':
        return <Globe className="w-4 h-4 text-indigo-600" />;
      case 'job':
        return <Briefcase className="w-4 h-4 text-violet-600" />;
      case 'offer':
        return <FileCheck className="w-4 h-4 text-amber-600" />;
    }
  };

  const getStatusBadge = (status: VerificationStatus) => {
    switch (status) {
      case 'VERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border bg-emerald-50 text-emerald-700 border-emerald-200">
            <CheckCircle2 className="w-3 h-3 text-emerald-600" />
            VERIFIED
          </span>
        );
      case 'FLAGGED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border bg-rose-50 text-rose-700 border-rose-200">
            <XCircle className="w-3 h-3 text-rose-600" />
            FLAGGED
          </span>
        );
      case 'UNVERIFIED':
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-semibold px-2 py-0.5 rounded border bg-amber-50 text-amber-800 border-amber-200">
            <AlertCircle className="w-3 h-3 text-amber-600" />
            UNVERIFIED
          </span>
        );
      case 'NOT_APPLICABLE':
      default:
        return (
          <span className="inline-flex items-center gap-1 text-[11px] font-mono font-medium px-2 py-0.5 rounded border bg-slate-100 text-slate-600 border-slate-200">
            <HelpCircle className="w-3 h-3 text-slate-400" />
            N/A
          </span>
        );
    }
  };

  return (
    <div id={id} className="rounded-xl border border-slate-200 bg-white p-4 transition-colors hover:border-slate-300 shadow-xs">
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2.5">
          <div className="p-2 rounded-lg bg-slate-100 border border-slate-200">
            {getIcon()}
          </div>
          <div>
            <h3 className="text-sm font-semibold text-slate-900">{title}</h3>
            <p className="text-[11px] text-slate-500">{subtitle}</p>
          </div>
        </div>
        <div>{getStatusBadge(data?.status || 'UNVERIFIED')}</div>
      </div>

      <div className="mt-3 rounded-lg bg-slate-50 border border-slate-200/80 p-3">
        <p className="text-xs leading-relaxed text-slate-700 font-sans whitespace-pre-line">
          {data?.details || 'No specific telemetry details available for this trust vector.'}
        </p>
      </div>
    </div>
  );
};
