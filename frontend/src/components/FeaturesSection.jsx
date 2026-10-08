import React from 'react';
import { Send, Clock, GitPullRequest, Shield, Bell, History } from 'lucide-react';

export function FeaturesSection() {
  const features = [
    {
      title: 'Easy Complaint Reporting',
      description: 'Submit issues quickly with all relevant details and location.',
      icon: Send,
    },
    {
      title: 'Real-Time Status Tracking',
      description: 'Know exactly where your complaint stands in the resolution lifecycle.',
      icon: Clock,
    },
    {
      title: 'Smart Assignment',
      description: 'Automatically map complaints to the appropriate campus department.',
      icon: GitPullRequest,
    },
    {
      title: 'Role-Based Access',
      description: 'Tailored experiences for students, faculty, facility officers, and maintenance.',
      icon: Shield,
    },
    {
      title: 'Notifications',
      description: 'Receive updates when complaint status changes or work progresses.',
      icon: Bell,
    },
    {
      title: 'Complaint History',
      description: 'Maintain a transparent audit record of all complaint activity.',
      icon: History,
    },
  ];

  return (
    <section id="features" className="py-16 md:py-20 bg-[#F5F0E7] dark:bg-[#111827] border-b border-[#DED8CC] dark:border-[#344155]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-12">
          <p className="text-[11px] font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-2">
            CAPABILITIES
          </p>
          <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
            Everything your campus needs.
          </h2>
          <p className="mt-2 text-xs sm:text-sm text-[#60708A] dark:text-[#AEB9C9]">
            Built directly around campus operational workflows with end-to-end transparency.
          </p>
        </div>

        {/* Features Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {features.map((feature, idx) => {
            const Icon = feature.icon;
            return (
              <div
                key={idx}
                className="bg-[#FAF7F0] dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] p-5 text-left space-y-3"
              >
                <div className="w-8 h-8 rounded-[4px] bg-[#FDF2F4] dark:bg-[#202B3D] text-[#B51232] dark:text-[#C51F3D] flex items-center justify-center">
                  <Icon className="w-4 h-4 stroke-[2]" />
                </div>
                <h3 className="text-sm font-bold font-heading text-[#10213A] dark:text-[#F8FAFC]">
                  {feature.title}
                </h3>
                <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] leading-relaxed">
                  {feature.description}
                </p>
              </div>
            );
          })}
        </div>

      </div>
    </section>
  );
}

export default FeaturesSection;
