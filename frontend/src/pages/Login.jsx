import React, { useState, useEffect } from 'react';
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
  ArrowLeft,
  GraduationCap,
  User,
  Sparkles
} from 'lucide-react';

export function Login() {
  const { login, googleLogin, getRoleDashboardPath } = useAuth();
  const navigate = useNavigate();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);

  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // State for Google new-user role selection step
  const [pendingGoogleToken, setPendingGoogleToken] = useState(null);
  const [googleRole, setGoogleRole] = useState('Student');
  const [googleStudentType, setGoogleStudentType] = useState('Campus');
  const [googleDepartment, setGoogleDepartment] = useState('General');

  const googleClientId = import.meta.env.VITE_GOOGLE_CLIENT_ID || '';

  // Initialize Google Identity Services if client ID is provided
  useEffect(() => {
    if (!googleClientId || googleClientId === 'your-google-client-id') return;

    const script = document.createElement('script');
    script.src = 'https://accounts.google.com/gsi/client';
    script.async = true;
    script.defer = true;
    script.onload = () => {
      if (window.google) {
        window.google.accounts.id.initialize({
          client_id: googleClientId,
          callback: handleGoogleResponse,
        });
      }
    };
    document.body.appendChild(script);

    return () => {
      try {
        document.body.removeChild(script);
      } catch (e) {}
    };
  }, [googleClientId]);

  const handleGoogleResponse = async (response) => {
    if (!response.credential) return;
    setGoogleLoading(true);
    setErrorMessage('');

    try {
      const loggedUser = await googleLogin({
        id_token: response.credential,
      });
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err) {
      if (err.message && err.message.includes('Role selection required')) {
        setPendingGoogleToken(response.credential);
      } else {
        setErrorMessage(err.message || 'Google authentication failed.');
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const handleGoogleRoleSubmit = async (e) => {
    e.preventDefault();
    if (!pendingGoogleToken) return;

    setGoogleLoading(true);
    setErrorMessage('');
    try {
      const loggedUser = await googleLogin({
        id_token: pendingGoogleToken,
        role: googleRole,
        student_type: googleRole === 'Student' ? googleStudentType : null,
        department: googleDepartment,
      });
      setPendingGoogleToken(null);
      navigate(getRoleDashboardPath(loggedUser.role));
    } catch (err) {
      setErrorMessage(err.message || 'Failed to complete Google registration.');
    } finally {
      setGoogleLoading(false);
    }
  };

  const triggerGooglePrompt = () => {
    setErrorMessage('');
    if (window.google && googleClientId && googleClientId !== 'your-google-client-id') {
      window.google.accounts.id.prompt();
    } else {
      const mockToken = prompt(
        'Google Client ID is using placeholder.\nEnter a test Google ID token or email token:'
      );
      if (mockToken) {
        handleGoogleResponse({ credential: mockToken });
      } else {
        setErrorMessage(
          'Google Client ID is not configured. Please set VITE_GOOGLE_CLIENT_ID in your .env file.'
        );
      }
    }
  };

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

            {/* Google Role Selection Step for New Users */}
            {pendingGoogleToken ? (
              <form onSubmit={handleGoogleRoleSubmit} className="space-y-3.5 bg-[#FDF2F4] dark:bg-[#C51F3D]/15 p-4 rounded-[6px] border border-[#B51232]/30 dark:border-[#C51F3D]/30">
                <div className="space-y-0.5">
                  <h3 className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" />
                    Select Role to Complete Google Signup
                  </h3>
                  <p className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">
                    Public registration is available for Student or Faculty roles.
                  </p>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <button
                    type="button"
                    onClick={() => setGoogleRole('Student')}
                    className={`py-2 px-3 rounded-[4px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      googleRole === 'Student'
                        ? 'bg-[#B51232] dark:bg-[#C51F3D] text-white border-[#B51232] dark:border-[#C51F3D]'
                        : 'bg-white dark:bg-[#202B3D] text-[#10213A] dark:text-[#F8FAFC] border-[#DED8CC] dark:border-[#344155]'
                    }`}
                  >
                    <GraduationCap className="w-3.5 h-3.5" />
                    Student
                  </button>
                  <button
                    type="button"
                    onClick={() => setGoogleRole('Faculty')}
                    className={`py-2 px-3 rounded-[4px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                      googleRole === 'Faculty'
                        ? 'bg-[#B51232] dark:bg-[#C51F3D] text-white border-[#B51232] dark:border-[#C51F3D]'
                        : 'bg-white dark:bg-[#202B3D] text-[#10213A] dark:text-[#F8FAFC] border-[#DED8CC] dark:border-[#344155]'
                    }`}
                  >
                    <User className="w-3.5 h-3.5" />
                    Faculty
                  </button>
                </div>

                {googleRole === 'Student' && (
                  <div className="space-y-1">
                    <label className="block text-[10px] font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]">
                      Student Type
                    </label>
                    <select
                      value={googleStudentType}
                      onChange={(e) => setGoogleStudentType(e.target.value)}
                      className="w-full py-1.5 px-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[4px] text-xs text-[#10213A] dark:text-[#F8FAFC]"
                    >
                      <option value="Campus">Campus Student</option>
                      <option value="Hostel">Hostel Student</option>
                    </select>
                  </div>
                )}

                <div className="space-y-1">
                  <label className="block text-[10px] font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]">
                    Department
                  </label>
                  <input
                    type="text"
                    value={googleDepartment}
                    onChange={(e) => setGoogleDepartment(e.target.value)}
                    placeholder="e.g. Computer Science"
                    className="w-full py-1.5 px-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[4px] text-xs text-[#10213A] dark:text-[#F8FAFC]"
                  />
                </div>

                <div className="flex gap-2 pt-1">
                  <Button type="submit" variant="primary" size="sm" isLoading={googleLoading} className="w-full">
                    Complete Google Sign In
                  </Button>
                  <Button type="button" variant="secondary" size="sm" onClick={() => setPendingGoogleToken(null)}>
                    Cancel
                  </Button>
                </div>
              </form>
            ) : (
              <>
                {/* Google Sign In Button */}
                <button
                  type="button"
                  onClick={triggerGooglePrompt}
                  disabled={googleLoading}
                  className="w-full py-2 px-4 border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] bg-white dark:bg-[#202B3D] hover:bg-[#FAF7F0] dark:hover:bg-[#263246] transition-all flex items-center justify-center gap-2.5 cursor-pointer"
                >
                  <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
                    <path
                      fill="#4285F4"
                      d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
                    />
                    <path
                      fill="#34A853"
                      d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z"
                    />
                    <path
                      fill="#EA4335"
                      d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z"
                    />
                  </svg>
                  {googleLoading ? 'Connecting with Google...' : 'Continue with Google'}
                </button>

                {/* Divider */}
                <div className="relative flex items-center justify-center my-2">
                  <div className="border-t border-[#DED8CC] dark:border-[#344155] w-full"></div>
                  <span className="bg-white dark:bg-[#182235] px-3 text-[10px] font-extrabold text-[#60708A] dark:text-[#AEB9C9] uppercase tracking-wider shrink-0">
                    or continue with email
                  </span>
                </div>

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
              </>
            )}

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
