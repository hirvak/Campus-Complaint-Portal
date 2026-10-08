import React from 'react';
import { FilePlus2, Activity, CheckCircle2 } from 'lucide-react';

export function HowItWorksSection() {
  const steps = [
    {
      number: '01',
      title: 'REPORT',
      description: 'Describe the campus issue and select its relevant category and location.',
      icon: FilePlus2,
    },
    {
      number: '02',
      title: 'TRACK',
      description: 'Follow the complaint status from submission to assignment and active progress.',
      icon: Activity,
    },
    {
      number: '03',
      title: 'RESOLVE',
      description: 'The maintenance team resolves the issue and the student/faculty member can close or reopen it.',
      icon: CheckCircle2,
    },
  ];

  return (
    <section id="how-it-works" className="py-16 md:py-20 bg-[#F5F0E7] dark:bg-[#111827] border-b border-[#DED8CC] dark:border-[#344155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-2">
            WORKFLOW
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
            From issue to resolution.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#60708A] dark:text-[#AEB9C9]">
            Simple for students and faculty. Efficient for campus support teams.
          </p>
        </div>

        {/* Steps Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {steps.map((step, index) => {
            const Icon = step.icon;
            return (
              <div
                key={index}
                className="bg-[#FAF7F0] dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] p-6 text-left flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <span className="text-xs font-extrabold tracking-wider text-[#B51232] dark:text-[#C51F3D] bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#B51232]/30 dark:border-[#344155] px-2.5 py-1 rounded-[4px]">
                      {step.number}
                    </span>
                    <div className="w-8 h-8 rounded-[4px] bg-[#FDF2F4] dark:bg-[#202B3D] text-[#B51232] dark:text-[#C51F3D] flex items-center justify-center">
                      <Icon className="w-4 h-4 stroke-[2]" />
                    </div>
                  </div>

                  <h3 className="text-sm font-bold font-heading text-[#10213A] dark:text-[#F8FAFC] mb-2 uppercase tracking-wide">
                    {step.title}
                  </h3>

                  <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] leading-relaxed">
                    {step.description}
                  </p>
                </div>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default HowItWorksSection;
