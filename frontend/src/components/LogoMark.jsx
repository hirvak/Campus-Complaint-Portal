import React from 'react';

export function LogoMark({ className = "w-6 h-6", textClassName = "text-lg" }) {
  return (
    <div className="inline-flex items-center gap-2.5 group cursor-pointer select-none">
      <div className={`relative flex items-center justify-center rounded-[6px] bg-[#B51232] text-white p-1.5 ${className}`}>
        {/* Institutional geometric crest logo mark */}
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="square" strokeLinejoin="miter" className="w-full h-full">
          <rect x="3" y="3" width="7" height="7" />
          <rect x="14" y="3" width="7" height="7" />
          <rect x="14" y="14" width="7" height="7" />
          <rect x="3" y="14" width="7" height="7" fill="#FFFFFF" stroke="#FFFFFF" />
        </svg>
      </div>
      <div className="flex flex-col text-left">
        <span className={`font-heading font-extrabold tracking-tight text-[#10213A] ${textClassName}`}>
          Campus<span className="text-[#B51232]">Care</span>
        </span>
      </div>
    </div>
  );
}

export default LogoMark;
