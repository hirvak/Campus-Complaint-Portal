import React, { useState, useEffect } from 'react';
import SlaBadge from './SlaBadge';
import {
  ShieldAlert,
  Clock,
  Calendar,
  AlertTriangle,
  Flame,
  CheckCircle2,
  RotateCcw,
  Info
} from 'lucide-react';

/**
 * Format timestamp cleanly in user's locale with fallback
 */
function formatDateTime(isoString) {
  if (!isoString) return 'Not configured';
  const d = new Date(isoString);
  if (isNaN(d.getTime())) return 'Invalid date';
  return `${d.toLocaleDateString()} at ${d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: true })}`;
}

export function SlaTracker({
  complaint,
  historyLogs = [],
  loading = false
}) {
  const [, setTick] = useState(0);

  // Re-render countdown every 10 seconds locally
  useEffect(() => {
    if (!complaint?.sla_deadline) return;
    const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
    if (isResolved) return;

    const interval = setInterval(() => setTick((t) => t + 1), 10000);
    return () => clearInterval(interval);
  }, [complaint?.sla_deadline, complaint?.status]);

  if (loading) {
    return (
      <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-5 rounded-[8px] animate-pulse">
        <div className="h-4 bg-[#DED8CC] dark:bg-[#344155] rounded w-1/3 mb-3"></div>
        <div className="h-8 bg-[#DED8CC] dark:bg-[#344155] rounded w-2/3"></div>
      </div>
    );
  }

  if (!complaint) return null;

  const deadline = complaint.sla_deadline;
  const isResolved = complaint.status === 'Resolved' || complaint.status === 'Closed';
  const isEscalated = Boolean(complaint.is_escalated);
  const slaCycle = complaint.sla_cycle || 1;
  const isGrandfathered = Boolean(complaint.is_grandfathered);

  // Compute countdown details
  let countdownText = 'No target deadline';
  let isOverdue = false;
  if (isResolved) {
    countdownText = 'Resolved';
  } else if (deadline) {
    const target = new Date(deadline).getTime();
    const diffSec = Math.round((target - Date.now()) / 1000);
    if (diffSec < 0) {
      isOverdue = true;
      const abs = Math.abs(diffSec);
      const h = Math.floor(abs / 3600);
      const m = Math.floor((abs % 3600) / 60);
      countdownText = `${h}h ${m}m overdue`;
    } else {
      const h = Math.floor(diffSec / 3600);
      const m = Math.floor((diffSec % 3600) / 60);
      if (h > 24) {
        const d = Math.floor(h / 24);
        countdownText = `${d}d ${h % 24}h remaining`;
      } else {
        countdownText = `${h}h ${m}m remaining`;
      }
    }
  }

  // Filter relevant history logs for SLA & Escalation
  const slaLogs = historyLogs.filter((log) => {
    const act = (log.action || '').toLowerCase();
    return act.includes('escalat') || act.includes('sla') || act.includes('reopen');
  });

  return (
    <div className="space-y-4 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2">
        <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1.5">
          <ShieldAlert className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
          SLA Resolution & Escalation Tracker
        </h3>
        <div className="flex items-center gap-2">
          {slaCycle > 1 && (
            <span className="text-[10px] font-mono font-bold uppercase tracking-wide px-2 py-0.5 rounded bg-[#FAF7F0] dark:bg-[#202B3D] text-[#60708A] dark:text-[#AEB9C9] border border-[#DED8CC] dark:border-[#344155]">
              Cycle #{slaCycle} (Reopened)
            </span>
          )}
          <SlaBadge complaint={complaint} showCountdown={false} />
        </div>
      </div>

      {/* Main SLA Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-3.5">
        {/* Deadline Card */}
        <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3.5 rounded-[6px]">
          <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
            <Calendar className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" />
            Target Deadline
          </p>
          <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
            {formatDateTime(deadline)}
          </p>
        </div>

        {/* Remaining Time / Overdue Duration Card */}
        <div className={`border p-3.5 rounded-[6px] transition-colors ${
          isResolved
            ? 'bg-[#E8F5EC] dark:bg-[#22A06B]/15 border-[#A7F3D0] dark:border-[#22A06B]/30'
            : isOverdue || isEscalated
            ? 'bg-[#FEF2F2] dark:bg-[#991B1B]/20 border-[#FCA5A5] dark:border-[#991B1B]/40'
            : 'bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155]'
        }`}>
          <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
            <Clock className={`w-3.5 h-3.5 ${
              isResolved ? 'text-[#059669]' : isOverdue ? 'text-[#DC2626]' : 'text-[#B51232]'
            }`} />
            {isResolved ? 'Resolution Status' : isOverdue ? 'Overdue By' : 'Time Remaining'}
          </p>
          <p className={`text-xs font-mono font-extrabold mt-1 ${
            isResolved
              ? 'text-[#059669] dark:text-[#34D399]'
              : isOverdue
              ? 'text-[#DC2626] dark:text-[#F87171]'
              : 'text-[#10213A] dark:text-[#F8FAFC]'
          }`}>
            {countdownText}
          </p>
        </div>

        {/* Escalation Status Card */}
        <div className={`border p-3.5 rounded-[6px] transition-colors ${
          isEscalated
            ? 'bg-[#FDF2F4] dark:bg-[#B51232]/20 border-[#F8D7DA] dark:border-[#B51232]/40'
            : 'bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155]'
        }`}>
          <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
            {isEscalated ? (
              <Flame className="w-3.5 h-3.5 text-[#B51232] dark:text-[#FF6B81]" />
            ) : (
              <CheckCircle2 className="w-3.5 h-3.5 text-[#059669] dark:text-[#34D399]" />
            )}
            Escalation Level
          </p>
          <p className={`text-xs font-bold mt-1 ${
            isEscalated
              ? 'text-[#B51232] dark:text-[#FF6B81]'
              : 'text-[#10213A] dark:text-[#F8FAFC]'
          }`}>
            {isEscalated ? `Level ${complaint.escalation_level || 1} — Facility Officer` : 'Standard (Unescalated)'}
          </p>
        </div>
      </div>

      {/* Grandfathered Notice */}
      {isGrandfathered && (
        <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px] text-xs text-[#60708A] dark:text-[#AEB9C9] flex items-start gap-2">
          <Info className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#C51F3D] mt-0.5" />
          <span>
            <strong>Historical Record:</strong> This complaint predates active SLA monitoring. It has been grandfathered to prevent retro-active alert storms while maintaining accurate audit records.
          </span>
        </div>
      )}

      {/* Escalated Alert Banner if Escalated */}
      {isEscalated && (
        <div className="bg-[#FEF2F2] dark:bg-[#B51232]/25 border border-[#FCA5A5] dark:border-[#B51232]/50 p-3.5 rounded-[6px] text-xs space-y-1">
          <div className="flex items-center gap-1.5 font-bold text-[#991B1B] dark:text-[#FF6B81]">
            <Flame className="w-4 h-4" />
            <span>Escalated to Facility Officer</span>
          </div>
          <p className="text-[#7F1D1D] dark:text-[#FECDD3]">
            This complaint exceeded its resolution SLA target and has been automatically escalated for immediate administrative attention.
            {complaint.escalated_at && ` (Escalated on ${formatDateTime(complaint.escalated_at)})`}
          </p>
        </div>
      )}

      {/* Specific SLA & Escalation History Events */}
      {slaLogs.length > 0 && (
        <div className="space-y-2 pt-1">
          <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
            Escalation Audit Log
          </p>
          <div className="space-y-1.5">
            {slaLogs.map((log) => (
              <div
                key={log.id}
                className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] px-3 py-2 rounded-[4px] text-xs flex flex-col sm:flex-row sm:items-center justify-between gap-1"
              >
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#B51232] dark:bg-[#C51F3D]"></span>
                  <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{log.action}:</span>
                  <span className="text-[#60708A] dark:text-[#AEB9C9]">{log.description}</span>
                </div>
                <span className="text-[10px] text-[#60708A] dark:text-[#7F8CA1] shrink-0 font-mono">
                  {new Date(log.created_at).toLocaleDateString()} {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

export default SlaTracker;
