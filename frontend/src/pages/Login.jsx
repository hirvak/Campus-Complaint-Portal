import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import LogoMark from '../components/LogoMark';
import {
  Lock,
  Mail,
  AlertCircle,
  ArrowRight,
  Eye,
  EyeOff,
  ArrowLeft
} from 'lucide-react';

export function Login() {
  const { login, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both email and password.');
      return;
    }

    setLoading(true);
    try {
      const loggedUser = await login(email.trim(), password);
      const targetPath = getRoleDashboardPath(loggedUser.role);
      navigate(targetPath);
    } catch (err) {
      setErrorMessage(err.message || 'Invalid email or password.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-12 px-4 sm:px-6 lg:px-8 flex items-center justify-center transition-colors duration-150">
      <div className="max-w-4xl w-full grid grid-cols-1 md:grid-cols-12 gap-8 items-center">
        
        {/* LEFT SIDE: Branding / Welcome message */}
        <div className="md:col-span-5 text-left space-y-5 pr-0 md:pr-4">
          <Link to="/" className="inline-flex items-center gap-1.5 text-xs font-bold text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors mb-1">
            <ArrowLeft className="w-3.5 h-3.5" />
            Back to Home
          </Link>

          <div className="space-y-2">
            <LogoMark textClassName="text-3xl font-extrabold" />
            <span className="inline-block text-[10px] font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] bg-[#FDF2F4] dark:bg-[#C51F3D]/15 px-2.5 py-1 rounded-[4px] border border-[#B51232]/30 dark:border-[#C51F3D]/30">
              Campus Complaint Portal
            </span>
          </div>

          <div className="space-y-1.5 pt-1">
            <h1 className="text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight leading-tight">
              Make campus issues <span className="text-[#B51232] dark:text-[#C51F3D]">heard.</span>
            </h1>
            <p className="text-lg font-bold font-heading text-[#B51232] dark:text-[#C51F3D]">
              Report. Track. Resolve.
            </p>
          </div>

          <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] leading-relaxed">
            A smarter way to report, track, and resolve everyday campus issues — all in one place.
          </p>

          <div className="pt-2 border-t border-[#DED8CC] dark:border-[#344155] text-[11px] text-[#60708A] dark:text-[#AEB9C9] space-y-1">
            <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">Supported Campus Roles:</p>
            <p>• Student • Faculty • Admin • Facility Officer • Maintenance Team</p>
          </div>
        </div>

        {/* RIGHT SIDE: Login Card */}
        <div className="md:col-span-7">
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 sm:p-8 text-left space-y-5 shadow-2xs transition-colors duration-150">
            
            {/* Header */}
            <div className="space-y-0.5">
              <h2 className="text-xl font-bold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
                Welcome back
              </h2>
              <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
                Sign in to continue to CampusCare
              </p>
            </div>

            {/* Error Alert */}
            {errorMessage && (
              <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] px-3.5 py-2.5 rounded-[6px] text-xs flex items-start gap-2">
                <AlertCircle className="w-4 h-4 text-[#B51232] dark:text-[#D6455D] shrink-0 mt-0.5" />
                <span>{errorMessage}</span>
              </div>
            )}

            {/* Standard Login Form */}
            <form className="space-y-3.5" onSubmit={handleSubmit}>
              {/* Email */}
              <div>
                <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  Email Address
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                    <Mail className="w-4 h-4" />
                  </div>
                  <input
                    type="email"
                    required
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="student@university.edu"
                    className="block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
                  />
                </div>
              </div>

              {/* Password */}
              <div>
                <div className="flex items-center justify-between mb-1">
                  <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
                    Password
                  </label>
                </div>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                    <Lock className="w-4 h-4" />
                  </div>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="••••••••"
                    className="block w-full pl-9 pr-9 py-2 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#60708A] dark:text-[#7F8CA1] hover:text-[#10213A] dark:hover:text-[#F8FAFC]"
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </div>

              {/* Submit Button */}
              <Button
                type="submit"
                variant="primary"
                size="lg"
                isLoading={loading}
                className="w-full mt-1 font-bold text-xs"
              >
                {loading ? 'Logging in...' : 'Login'}
                <ArrowRight className="w-3.5 h-3.5 ml-1" />
              </Button>
            </form>

            {/* Footer Links */}
            <div className="pt-3 text-center border-t border-[#DED8CC] dark:border-[#344155] space-y-1.5">
              <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
                Don't have an account?{' '}
                <Link to="/register" className="font-bold text-[#B51232] dark:text-[#C51F3D] hover:underline">
                  Register
                </Link>
              </p>
              <div>
                <Link to="/" className="text-xs text-[#60708A] dark:text-[#AEB9C9] hover:text-[#10213A] dark:hover:text-[#F8FAFC] inline-flex items-center gap-1">
                  <ArrowLeft className="w-3 h-3" /> Back to Home
                </Link>
              </div>
            </div>

          </div>
        </div>

      </div>
    </div>
  );
}

export default Login;
