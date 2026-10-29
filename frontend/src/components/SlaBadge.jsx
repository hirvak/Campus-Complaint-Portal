import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  Clock,
  AlertTriangle,
  Flame,
  CheckCircle2,
  Minus
} from 'lucide-react';

/**
 * Format remaining or overdue time duration into readable human text
 */
function formatTimeRemaining(deadlineStr, isResolved) {
  if (isResolved) return null;
  if (!deadlineStr) return null;

  const target = new Date(deadlineStr).getTime();
  if (isNaN(target)) return null;

  const now = Date.now();
  const diffSec = Math.round((target - now) / 1000);

  if (diffSec < 0) {
    const abs = Math.abs(diffSec);
    const h = Math.floor(abs / 3600);
    const m = Math.floor((abs % 3600) / 60);
    if (h > 0) return `${h}h ${m}m overdue`;
    return `${m}m overdue`;
  } else {
    const h = Math.floor(diffSec / 3600);
    const m = Math.floor((diffSec % 3600) / 60);
    if (h > 24) {
      const days = Math.floor(h / 24);
      const remH = h % 24;
      return `${days}d ${remH}h left`;
    }
    if (h > 0) return `${h}h ${m}m left`;
    return `${m}m left`;
  }
}

export function SlaBadge({
  complaint,
  showCountdown = true,
  compact = false
}) {
  const [, setTick] = useState(0);

  // Local tick update every 15s to keep countdown fresh without network requests
  useEffect(() => {
    if (!complaint?.sla_deadline) return;
    const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
    if (isResolved) return;

    const interval = setInterval(() => {
      setTick((t) => t + 1);
    }, 15000);

    return () => clearInterval(interval);
  }, [complaint?.sla_deadline, complaint?.status]);

  if (!complaint) return null;

  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isEscalated = Boolean(complaint.is_escalated);
  const deadline = complaint.sla_deadline;

  // Compute state
  let state = 'NO_SLA';
  let label = 'NO SLA';
  let Icon = Minus;
  let colorClasses = 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155]';

  if (isResolved) {
    state = 'RESOLVED';
    label = 'RESOLVED';
    Icon = CheckCircle2;
    colorClasses = 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#475569] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155]';
  } else if (isEscalated) {
    state = 'ESCALATED';
    label = complaint.escalation_level > 1 ? `ESCALATED L${complaint.escalation_level}` : 'ESCALATED';
    Icon = Flame;
    colorClasses = 'bg-[#FEF2F2] dark:bg-[#B51232]/25 text-[#991B1B] dark:text-[#FF6B81] border-[#FECACA] dark:border-[#B51232]/50 font-bold';
  } else if (!deadline) {
    state = 'NO_SLA';
    label = 'NO SLA';
    Icon = Minus;
    colorClasses = 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border-[#CBD5E1] dark:border-[#334155]';
  } else {
    const isPastDeadline = new Date(deadline).getTime() < Date.now();
    const backendStatus = complaint.sla_status;

    if (backendStatus === 'OVERDUE' || isPastDeadline || complaint.is_grandfathered) {
      state = 'OVERDUE';
      label = 'OVERDUE';
      Icon = AlertTriangle;
      colorClasses = 'bg-[#FEF2F2] dark:bg-[#991B1B]/30 text-[#DC2626] dark:text-[#F87171] border-[#FCA5A5] dark:border-[#991B1B]/60 font-bold';
    } else if (backendStatus === 'APPROACHING_DEADLINE') {
      state = 'DUE_SOON';
      label = 'DUE SOON';
      Icon = Clock;
      colorClasses = 'bg-[#FFFBEB] dark:bg-[#78350F]/30 text-[#D97706] dark:text-[#FBBF24] border-[#FCD34D] dark:border-[#92400E]/50 font-bold';
    } else {
      state = 'ON_TRACK';
      label = 'ON TRACK';
      Icon = ShieldCheck;
      colorClasses = 'bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#059669] dark:text-[#34D399] border-[#6EE7B7] dark:border-[#065F46]/50';
    }
  }

  const countdownText = showCountdown ? formatTimeRemaining(deadline, isResolved) : null;

  return (
    <div
      className="inline-flex flex-col items-start gap-0.5"
      aria-label={`SLA Status: ${label}${countdownText ? ` (${countdownText})` : ''}`}
    >
      <span
        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] border text-[10px] font-heading font-extrabold uppercase tracking-wide leading-none select-none transition-colors duration-150 ${colorClasses}`}
      >
        <Icon className={`${compact ? 'w-2.5 h-2.5' : 'w-3 h-3'} shrink-0`} />
        <span>{label}</span>
      </span>

      {countdownText && !compact && (
        <span
          className={`text-[9px] font-mono tracking-tight font-bold pl-0.5 ${
            state === 'OVERDUE' || state === 'ESCALATED'
              ? 'text-[#DC2626] dark:text-[#F87171]'
              : state === 'DUE_SOON'
              ? 'text-[#D97706] dark:text-[#FBBF24]'
              : 'text-[#60708A] dark:text-[#94A3B8]'
          }`}
        >
          {countdownText}
        </span>
      )}
    </div>
  );
}

export default SlaBadge;
