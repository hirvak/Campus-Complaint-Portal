import React from 'react';
import { useNavigate } from 'react-router-dom';
import Button from '../components/Button';
import HeroMockup from '../components/HeroMockup';
import HowItWorksSection from '../components/HowItWorksSection';
import FeaturesSection from '../components/FeaturesSection';
import RolesSection from '../components/RolesSection';
import CtaSection from '../components/CtaSection';
import { useAuth } from '../context/AuthContext';
import { ArrowRight, CheckCircle2 } from 'lucide-react';

export function Landing() {
  const { isAuthenticated, user, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const handleReportIssueClick = () => {
    if (isAuthenticated && user) {
      navigate(getRoleDashboardPath(user.role));
    } else {
      navigate('/login');
    }
  };

  const handleHowItWorksClick = () => {
    const el = document.getElementById('how-it-works');
    if (el) {
      el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <div className="min-h-screen bg-[#F5F0E7] dark:bg-[#111827] text-[#10213A] dark:text-[#F8FAFC]">
      
      {/* HERO SECTION */}
      <section id="hero" className="relative pt-12 pb-16 md:pt-16 md:pb-24 border-b border-[#DED8CC] dark:border-[#344155]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 items-center">
            
            {/* HERO LEFT SIDE */}
            <div className="lg:col-span-6 space-y-5 text-left">
              
              {/* Eyebrow */}
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-[4px] bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#B51232]/30 dark:border-[#344155] text-[#B51232] dark:text-[#C51F3D]">
                <span className="text-[11px] font-extrabold uppercase tracking-widest">
                  CAMPUS COMPLAINT PORTAL
                </span>
              </div>

              {/* Headlines */}
              <div className="space-y-2">
                <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold font-heading tracking-tight leading-[1.15] text-[#10213A] dark:text-[#F8FAFC]">
                  Make campus issues <span className="text-[#B51232] dark:text-[#C51F3D]">heard.</span>
                </h1>
                <p className="text-xl sm:text-2xl font-bold font-heading text-[#B51232] dark:text-[#C51F3D] tracking-tight">
                  Report. Track. Resolve.
                </p>
              </div>

              {/* Supporting Paragraph */}
              <p className="text-sm sm:text-base text-[#60708A] dark:text-[#AEB9C9] leading-relaxed max-w-xl">
                A smarter way to report, track, and resolve everyday campus issues — all in one place.
              </p>

              {/* CTAs */}
              <div className="pt-2 flex flex-col sm:flex-row items-stretch sm:items-center gap-3">
                <Button
                  variant="primary"
                  size="lg"
                  onClick={handleReportIssueClick}
                >
                  Report an Issue
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>

                <Button
                  variant="secondary"
                  size="lg"
                  onClick={handleHowItWorksClick}
                >
                  How It Works
                </Button>
              </div>

              {/* Supporting Line */}
              <div className="pt-3 flex items-center gap-2 text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9]">
                <CheckCircle2 className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D] shrink-0" />
                <span>One platform for students, faculty and campus teams.</span>
              </div>

            </div>

            {/* HERO RIGHT SIDE (Clean Dashboard Preview - No Floating Cards) */}
            <div className="lg:col-span-6">
              <HeroMockup />
            </div>

          </div>
        </div>
      </section>

      {/* HOW IT WORKS SECTION */}
      <HowItWorksSection />

      {/* FEATURES SECTION */}
      <FeaturesSection />

      {/* ROLES SECTION */}
      <RolesSection />

      {/* CTA SECTION */}
      <CtaSection />

    </div>
  );
}

export default Landing;
