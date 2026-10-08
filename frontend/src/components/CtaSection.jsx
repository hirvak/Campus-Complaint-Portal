import React from 'react';
import { Link } from 'react-router-dom';
import Button from './Button';
import { useAuth } from '../context/AuthContext';
import { ArrowRight } from 'lucide-react';

export function CtaSection() {
  const { isAuthenticated, user, getRoleDashboardPath } = useAuth();

  return (
    <section className="py-16 md:py-20 bg-[#F5F0E7] dark:bg-[#111827] border-b border-[#DED8CC] dark:border-[#344155]">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 text-center space-y-4">
        <h2 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
          Help make your campus better.
        </h2>
        <p className="text-xs sm:text-sm text-[#60708A] dark:text-[#AEB9C9] max-w-xl mx-auto leading-relaxed">
          Report problems, follow progress and contribute to a smoother campus operational experience.
        </p>

        <div className="pt-3 flex flex-col sm:flex-row items-center justify-center gap-3">
          {isAuthenticated && user ? (
            <Link to={getRoleDashboardPath(user.role)}>
              <Button variant="primary" size="lg" className="w-full sm:w-auto">
                Go to Dashboard ({user.role})
                <ArrowRight className="w-4 h-4 ml-1" />
              </Button>
            </Link>
          ) : (
            <>
              <Link to="/register">
                <Button variant="primary" size="lg" className="w-full sm:w-auto">
                  Get Started
                  <ArrowRight className="w-4 h-4 ml-1" />
                </Button>
              </Link>
              <a href="#how-it-works">
                <Button variant="secondary" size="lg" className="w-full sm:w-auto">
                  Learn More
                </Button>
              </a>
            </>
          )}
        </div>
      </div>
    </section>
  );
}

export default CtaSection;
