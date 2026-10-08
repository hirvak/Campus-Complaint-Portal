import React from 'react';
import { Link } from 'react-router-dom';
import LogoMark from './LogoMark';

export function Footer() {
  const scrollToTop = () => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  };

  return (
    <footer className="bg-[#FAF7F0] dark:bg-[#111827] border-t border-[#DED8CC] dark:border-[#344155] text-[#60708A] dark:text-[#AEB9C9] transition-colors duration-150">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10 md:py-12">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 pb-8 border-b border-[#DED8CC] dark:border-[#344155]">
          
          {/* Left Brand */}
          <div className="space-y-1.5">
            <Link to="/" onClick={scrollToTop}>
              <LogoMark textClassName="text-lg font-bold" />
            </Link>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] max-w-sm">
              Smart Campus Complaint Management platform designed for structured reporting, tracking, and resolution.
            </p>
          </div>

          {/* Nav Links */}
          <div className="flex flex-wrap gap-x-6 gap-y-2 text-xs font-label font-semibold tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
            <Link to="/" onClick={scrollToTop} className="hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors">
              Home
            </Link>
            <a href="#how-it-works" className="hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors">
              How It Works
            </a>
            <a href="#features" className="hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors">
              Features
            </a>
            <Link to="/login" className="hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors">
              Login
            </Link>
            <Link to="/register" className="hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors">
              Register
            </Link>
          </div>
        </div>

        {/* Bottom */}
        <div className="pt-6 flex flex-col sm:flex-row items-center justify-between text-[11px] text-[#60708A] dark:text-[#7F8CA1] gap-3">
          <p>© 2026 Campus Complaint Portal. All rights reserved.</p>
          <div className="flex gap-4">
            <span className="hover:text-[#10213A] dark:hover:text-[#F8FAFC] cursor-pointer">Privacy Policy</span>
            <span className="hover:text-[#10213A] dark:hover:text-[#F8FAFC] cursor-pointer">Terms of Service</span>
            <span className="hover:text-[#10213A] dark:hover:text-[#F8FAFC] cursor-pointer">Security</span>
          </div>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
