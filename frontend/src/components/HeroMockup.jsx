import React from 'react';
import { ArrowUpRight } from 'lucide-react';
import StatusBadge from './StatusBadge';

export function HeroMockup() {
  return (
    <div className="w-full max-w-xl mx-auto lg:max-w-none text-left">
      {/* Clean Dashboard Preview Surface */}
      <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] overflow-hidden shadow-2xs transition-colors duration-150">
        
        {/* Mockup Header Bar */}
        <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border-b border-[#DED8CC] dark:border-[#344155] px-5 py-3.5 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="w-2 h-2 rounded-full bg-[#B51232] dark:bg-[#C51F3D]" />
            <span className="text-xs font-bold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
              CampusCare Preview
            </span>
          </div>
          <span className="text-[10px] font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9] bg-[#F5F0E7] dark:bg-[#111827] border border-[#DED8CC] dark:border-[#344155] px-2.5 py-1 rounded-[4px]">
            PORTAL OVERVIEW
          </span>
        </div>

        {/* Overview Metric Row */}
        <div className="p-5 sm:p-6 space-y-6">
          <div className="grid grid-cols-2 sm:grid-cols-4 border-y border-[#DED8CC] dark:border-[#344155] py-4 divide-x divide-[#DED8CC] dark:divide-[#344155]">
            <div className="px-3 first:pl-0 space-y-0.5">
              <p className="text-2xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">07</p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">TOTAL</p>
            </div>

            <div className="px-3 space-y-0.5">
              <p className="text-2xl font-extrabold font-heading text-[#B51232] dark:text-[#C51F3D]">01</p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">NEW</p>
            </div>

            <div className="px-3 space-y-0.5">
              <p className="text-2xl font-extrabold font-heading text-[#B66A00] dark:text-[#D18A16]">02</p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">IN PROGRESS</p>
            </div>

            <div className="px-3 space-y-0.5">
              <p className="text-2xl font-extrabold font-heading text-[#008A4A] dark:text-[#22A06B]">04</p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">RESOLVED</p>
            </div>
          </div>

          {/* Recent Complaints List */}
          <div className="space-y-3">
            <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-2">
              <h4 className="text-[11px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                RECENT COMPLAINTS
              </h4>
              <span className="text-[11px] font-bold text-[#B51232] dark:text-[#C51F3D] flex items-center gap-1">
                View all complaints <ArrowUpRight className="w-3 h-3" />
              </span>
            </div>

            <div className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
              {/* Item 1 */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">Wi-Fi not working</p>
                  <p className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">Computer Lab • IT</p>
                </div>
                <StatusBadge status="In Progress" />
              </div>

              {/* Item 2 */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">Broken classroom light</p>
                  <p className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">Block B • Electrical</p>
                </div>
                <StatusBadge status="Assigned" />
              </div>

              {/* Item 3 */}
              <div className="py-2.5 flex items-center justify-between gap-3">
                <div>
                  <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">Water leakage</p>
                  <p className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">Hostel Block C • Plumbing</p>
                </div>
                <StatusBadge status="Resolved" />
              </div>
            </div>
          </div>

        </div>
      </div>
    </div>
  );
}

export default HeroMockup;
