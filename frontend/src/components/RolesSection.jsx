import React from 'react';
import { GraduationCap, UserCheck, ClipboardCheck, Wrench, ShieldCheck } from 'lucide-react';

export function RolesSection() {
  const roles = [
    {
      title: 'Student',
      description: 'Report and track campus issues.',
      icon: GraduationCap,
      badge: 'Public Registration',
    },
    {
      title: 'Faculty',
      description: 'Report issues and monitor resolution.',
      icon: UserCheck,
      badge: 'Public Registration',
    },
    {
      title: 'Facility Officer',
      description: 'Review and assign complaints.',
      icon: ClipboardCheck,
      badge: 'Admin Assigned',
    },
    {
      title: 'Maintenance Team',
      description: 'Work on assigned complaints and update progress.',
      icon: Wrench,
      badge: 'Admin Assigned',
    },
    {
      title: 'Admin',
      description: 'Manage users, categories, departments and reports.',
      icon: ShieldCheck,
      badge: 'Governance',
    },
  ];

  return (
    <section id="roles" className="py-16 md:py-20 bg-[#F5F0E7] dark:bg-[#111827] border-b border-[#DED8CC] dark:border-[#344155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-2">
            PORTAL ACCESS
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
            One platform. Different roles.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#60708A] dark:text-[#AEB9C9]">
            Structured permission boundaries matching exact backend user roles.
          </p>
        </div>

        {/* Roles Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4">
          {roles.map((role, idx) => {
            const Icon = role.icon;
            return (
              <div
                key={idx}
                className="bg-[#FAF7F0] dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] p-5 text-center flex flex-col justify-between"
              >
                <div>
                  <div className="w-10 h-10 rounded-[4px] bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#B51232]/30 dark:border-[#344155] text-[#B51232] dark:text-[#C51F3D] mx-auto flex items-center justify-center mb-3">
                    <Icon className="w-5 h-5 stroke-[2]" />
                  </div>
                  <h3 className="text-sm font-bold font-heading text-[#10213A] dark:text-[#F8FAFC] mb-1">
                    {role.title}
                  </h3>
                  <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] leading-relaxed mb-3">
                    {role.description}
                  </p>
                </div>
                <div className="pt-2 border-t border-[#DED8CC] dark:border-[#344155]">
                  <span className="text-[10px] font-extrabold uppercase tracking-wider text-[#B51232] dark:text-[#C51F3D] bg-[#FDF2F4] dark:bg-[#202B3D] px-2 py-0.5 rounded-[4px]">
                    {role.badge}
                  </span>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default RolesSection;
