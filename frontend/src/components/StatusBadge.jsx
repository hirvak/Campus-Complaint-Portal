import React from 'react';

export function StatusBadge({ status, className = '' }) {
  const getStatusConfig = (str) => {
    switch (str) {
      case 'New':
        return { color: 'text-[#10213A] dark:text-[#F8FAFC] bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155]', dot: 'bg-[#10213A] dark:bg-[#F8FAFC]' };
      case 'Assigned':
        return { color: 'text-[#B51232] dark:text-[#C51F3D] bg-[#FDF2F4] dark:bg-[#C51F3D]/15 border-[#F8D7DA] dark:border-[#C51F3D]/30', dot: 'bg-[#B51232] dark:bg-[#C51F3D]' };
      case 'In Progress':
        return { color: 'text-[#B66A00] dark:text-[#D18A16] bg-[#FEF3C7] dark:bg-[#D18A16]/15 border-[#FDE68A] dark:border-[#D18A16]/30', dot: 'bg-[#B66A00] dark:bg-[#D18A16]' };
      case 'Resolved':
        return { color: 'text-[#008A4A] dark:text-[#22A06B] bg-[#E8F5EC] dark:bg-[#22A06B]/15 border-[#A7F3D0] dark:border-[#22A06B]/30', dot: 'bg-[#008A4A] dark:bg-[#22A06B]' };
      case 'Closed':
        return { color: 'text-[#60708A] dark:text-[#AEB9C9] bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155]', dot: 'bg-[#60708A] dark:bg-[#AEB9C9]' };
      case 'Reopened':
        return { color: 'text-[#94102A] dark:text-[#D6455D] bg-[#FDF2F4] dark:bg-[#D6455D]/15 border-[#F8D7DA] dark:border-[#D6455D]/30', dot: 'bg-[#94102A] dark:bg-[#D6455D]' };
      default:
        return { color: 'text-[#10213A] dark:text-[#F8FAFC] bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155]', dot: 'bg-[#60708A] dark:bg-[#AEB9C9]' };
    }
  };

  const config = getStatusConfig(status);

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2.5 py-0.5 text-[10px] font-label font-semibold uppercase tracking-wider border rounded-[4px] ${config.color} ${className}`}
    >
      <span className={`w-1.5 h-1.5 rounded-full ${config.dot}`} />
      <span>{status || 'NEW'}</span>
    </span>
  );
}

export default StatusBadge;
