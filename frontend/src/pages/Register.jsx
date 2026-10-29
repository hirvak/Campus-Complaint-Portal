import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import Button from '../components/Button';
import LogoMark from '../components/LogoMark';
import {
  User,
  Mail,
  Lock,
  Building2,
  Phone,
  GraduationCap,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Info,
  Eye,
  EyeOff,
  ArrowLeft,
  UserCheck
} from 'lucide-react';

export function Register() {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [role, setRole] = useState('Student');
  const [formData, setFormData] = useState({
    full_name: '',
    email: '',
    password: '',
    confirmPassword: '',
    department: '',
    phone: '',
    student_type: 'Campus',
  });

  const [touched, setTouched] = useState({});
  const [departmentsList, setDepartmentsList] = useState([]);
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  useEffect(() => {
    async function loadDepartments() {
      try {
        const depts = await api.departments.getAll();
        if (Array.isArray(depts) && depts.length > 0) {
          setDepartmentsList(depts);
        }
      } catch (err) {}
    }
    loadDepartments();
  }, []);

  // Validation logic per field
  const validateField = (name, value, currentFormData = formData, currentRole = role) => {
    switch (name) {
      case 'full_name': {
        const val = (value || '').trim();
        if (!val) return 'Full Name is required.';
        if (val.length < 2) return 'Full Name must be at least 2 characters.';
        if (!/^[A-Za-z\s]+$/.test(val)) return 'Full Name can only contain alphabets and spaces.';
        return '';
      }
      case 'email': {
        const val = (value || '').trim();
        if (!val) return 'Email address is required.';
        if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) return 'Please enter a valid email address (e.g. user@domain.com).';
        return '';
      }
      case 'phone': {
        const val = (value || '').trim();
        if (val && !/^[6-9]\d{9}$/.test(val)) {
          return 'Phone number must be exactly 10 digits starting with 6-9.';
        }
        return '';
      }
      case 'password': {
        if (!value) return 'Password is required.';
        if (value.length < 8) return 'Password must be at least 8 characters long.';
        if (!/[A-Z]/.test(value)) return 'Password must contain at least one uppercase letter.';
        if (!/[a-z]/.test(value)) return 'Password must contain at least one lowercase letter.';
        if (!/[0-9]/.test(value)) return 'Password must contain at least one number.';
        if (!/[^A-Za-z0-9]/.test(value)) return 'Password must contain at least one special character.';
        return '';
      }
      case 'confirmPassword': {
        if (!value) return 'Please confirm your password.';
        if (value !== currentFormData.password) return 'Passwords do not match.';
        return '';
      }
      case 'department': {
        const val = (value || '').trim();
        if (!val) return 'Department is required.';
        if (val.length < 2) return 'Department must be at least 2 characters.';
        return '';
      }
      case 'student_type': {
        if (currentRole === 'Student' && !value) return 'Student Type is required for students.';
        return '';
      }
      default:
        return '';
    }
  };

  const getFormErrors = () => {
    const errs = {};
    errs.full_name = validateField('full_name', formData.full_name);
    errs.email = validateField('email', formData.email);
    errs.phone = validateField('phone', formData.phone);
    errs.password = validateField('password', formData.password);
    errs.confirmPassword = validateField('confirmPassword', formData.confirmPassword);
    errs.department = validateField('department', formData.department);
    if (role === 'Student') {
      errs.student_type = validateField('student_type', formData.student_type);
    }
    return errs;
  };

  const errors = getFormErrors();
  const isFormValid = !Object.values(errors).some((err) => err !== '');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleBlur = (e) => {
    const { name } = e.target;
    setTouched((prev) => ({ ...prev, [name]: true }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setSuccessMessage('');

    // Touch all fields to surface validation feedback
    setTouched({
      full_name: true,
      email: true,
      phone: true,
      password: true,
      confirmPassword: true,
      department: true,
      student_type: true,
    });

    if (!isFormValid) {
      setErrorMessage('Please resolve the highlighted validation errors before submitting.');
      return;
    }

    setLoading(true);
    try {
      const payload = {
        full_name: formData.full_name.trim(),
        email: formData.email.trim().toLowerCase(),
        password: formData.password,
        role: role,
        department: formData.department.trim(),
        phone: formData.phone.trim() || null,
        ...(role === 'Student' ? { student_type: formData.student_type } : {}),
      };

      await register(payload);
      setSuccessMessage('Account created successfully. Please sign in.');
      setTimeout(() => {
        navigate('/login');
      }, 2000);
    } catch (err) {
      setErrorMessage(err.message || 'Registration failed. Please verify your details.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-3.5rem)] flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8 bg-[#F5F0E7] dark:bg-[#111827]">
      
      {/* Container card */}
      <div className="max-w-lg w-full bg-white dark:bg-[#182235] p-8 border border-[#DED8CC] dark:border-[#344155] rounded-[8px] text-left space-y-5 shadow-xs">
        
        {/* Top Header */}
        <div className="text-center space-y-1.5">
          <Link to="/" className="inline-flex items-center gap-1 text-xs font-bold text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] transition-colors mb-0.5">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Home
          </Link>
          <div className="block">
            <LogoMark textClassName="text-xl font-extrabold" />
          </div>
          <h2 className="text-xl font-bold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
            Create your CampusCare account
          </h2>
          <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
            Register to report and track campus issues
          </p>
        </div>

        {/* Public Roles Info Banner */}
        <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#B51232]/30 dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] p-3 rounded-[6px] text-xs flex items-start gap-2">
          <Info className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D] shrink-0 mt-0.5" />
          <span>
            Public registration is available for <strong>Student</strong> and <strong>Faculty</strong> roles.
            Facility Officer and Maintenance Team accounts are provisioned by the Administrator.
          </span>
        </div>

        {/* Error / Success Alerts */}
        {errorMessage && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-3.5 py-2.5 rounded-[6px] text-xs flex items-start gap-2">
            <AlertCircle className="w-4 h-4 text-[#B51232] dark:text-[#D6455D] shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-[#E8F5EC] dark:bg-[#202B3D] border border-[#A7F3D0] dark:border-[#22A06B]/40 text-[#008A4A] dark:text-[#22A06B] px-3.5 py-2.5 rounded-[6px] text-xs flex items-start gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 text-[#008A4A] dark:text-[#22A06B] shrink-0 mt-0.5" />
            <span>{successMessage} Redirecting to login...</span>
          </div>
        )}

        {/* Role Selection */}
        <div className="space-y-1">
          <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
            I am a:
          </label>
          <div className="grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={() => setRole('Student')}
              className={`py-2.5 px-3 rounded-[6px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'Student'
                  ? 'bg-[#B51232] dark:bg-[#C51F3D] border-[#B51232] dark:border-[#C51F3D] text-white'
                  : 'bg-white dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155] text-[#60708A] dark:text-[#AEB9C9] hover:bg-[#FAF7F0] dark:hover:bg-[#263246]'
              }`}
            >
              <GraduationCap className="w-4 h-4" />
              Student
            </button>

            <button
              type="button"
              onClick={() => setRole('Faculty')}
              className={`py-2.5 px-3 rounded-[6px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-all ${
                role === 'Faculty'
                  ? 'bg-[#B51232] dark:bg-[#C51F3D] border-[#B51232] dark:border-[#C51F3D] text-white'
                  : 'bg-white dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155] text-[#60708A] dark:text-[#AEB9C9] hover:bg-[#FAF7F0] dark:hover:bg-[#263246]'
              }`}
            >
              <UserCheck className="w-4 h-4" />
              Faculty
            </button>
          </div>
        </div>

        {/* Student Type (Shown only for Student) */}
        {role === 'Student' && (
          <div className="bg-[#FAF7F0] dark:bg-[#202B3D] p-3 rounded-[6px] border border-[#DED8CC] dark:border-[#344155] space-y-1">
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">
              Student Type
            </label>
            <div className="grid grid-cols-2 gap-3 pt-0.5">
              <label className="flex items-center gap-2 text-xs text-[#10213A] dark:text-[#F8FAFC] font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="student_type"
                  value="Campus"
                  checked={formData.student_type === 'Campus'}
                  onChange={handleChange}
                  className="text-[#B51232] dark:text-[#C51F3D] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
                />
                Campus Student
              </label>
              <label className="flex items-center gap-2 text-xs text-[#10213A] dark:text-[#F8FAFC] font-semibold cursor-pointer">
                <input
                  type="radio"
                  name="student_type"
                  value="Hostel"
                  checked={formData.student_type === 'Hostel'}
                  onChange={handleChange}
                  className="text-[#B51232] dark:text-[#C51F3D] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]"
                />
                Hostel Student
              </label>
            </div>
          </div>
        )}

        {/* Registration Form */}
        <form className="space-y-3.5" onSubmit={handleSubmit} noValidate>
          {/* Full Name */}
          <div>
            <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
              Full Name
            </label>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                <User className="w-4 h-4" />
              </div>
              <input
                type="text"
                name="full_name"
                value={formData.full_name}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="e.g. Hirva Kansara"
                className={`block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                  touched.full_name && errors.full_name
                    ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                    : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                }`}
              />
            </div>
            {touched.full_name && errors.full_name && (
              <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                <span>{errors.full_name}</span>
              </p>
            )}
          </div>

          {/* Email Address */}
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
                name="email"
                value={formData.email}
                onChange={handleChange}
                onBlur={handleBlur}
                placeholder="hirva@gmail.com"
                className={`block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                  touched.email && errors.email
                    ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                    : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                }`}
              />
            </div>
            {touched.email && errors.email && (
              <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                <span>{errors.email}</span>
              </p>
            )}
          </div>

          {/* Department & Phone grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                Department
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                  <Building2 className="w-4 h-4" />
                </div>
                {departmentsList.length > 0 ? (
                  <select
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    className={`block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] focus:outline-none focus:ring-1 ${
                      touched.department && errors.department
                        ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                        : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                    }`}
                  >
                    <option value="">Select Department</option>
                    {departmentsList.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type="text"
                    name="department"
                    value={formData.department}
                    onChange={handleChange}
                    onBlur={handleBlur}
                    placeholder="e.g. Computer Science"
                    className={`block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                      touched.department && errors.department
                        ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                        : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                    }`}
                  />
                )}
              </div>
              {touched.department && errors.department && (
                <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                  <span>{errors.department}</span>
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                Phone (Optional - 10 Digits)
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                  <Phone className="w-4 h-4" />
                </div>
                <input
                  type="tel"
                  name="phone"
                  value={formData.phone}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="9876543210"
                  className={`block w-full pl-9 pr-3 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                    touched.phone && errors.phone
                      ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                      : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                  }`}
                />
              </div>
              {touched.phone && errors.phone && (
                <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                  <span>{errors.phone}</span>
                </p>
              )}
            </div>
          </div>

          {/* Password fields */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="password"
                  value={formData.password}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="e.g. Hirva@123"
                  className={`block w-full pl-9 pr-9 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                    touched.password && errors.password
                      ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                      : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                  }`}
                />
              </div>
              {touched.password && errors.password && (
                <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                  <span>{errors.password}</span>
                </p>
              )}
              {!touched.password && (
                <p className="text-[10px] text-[#60708A] dark:text-[#AEB9C9] mt-1">
                  Min 8 chars, 1 uppercase, 1 lowercase, 1 number & 1 special character.
                </p>
              )}
            </div>

            <div>
              <label className="block text-[10px] font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                Confirm Password
              </label>
              <div className="relative">
                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-[#60708A] dark:text-[#7F8CA1]">
                  <Lock className="w-4 h-4" />
                </div>
                <input
                  type={showPassword ? 'text' : 'password'}
                  name="confirmPassword"
                  value={formData.confirmPassword}
                  onChange={handleChange}
                  onBlur={handleBlur}
                  placeholder="Repeat password"
                  className={`block w-full pl-9 pr-9 py-2 bg-white dark:bg-[#202B3D] border rounded-[6px] text-xs text-[#10213A] dark:text-[#F8FAFC] placeholder-[#60708A]/60 dark:placeholder-[#7F8CA1] focus:outline-none focus:ring-1 ${
                    touched.confirmPassword && errors.confirmPassword
                      ? 'border-[#B51232] dark:border-[#D6455D] focus:ring-[#B51232] dark:focus:ring-[#D6455D]'
                      : 'border-[#DED8CC] dark:border-[#344155] focus:ring-[#B51232] dark:focus:ring-[#C51F3D]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-3 flex items-center text-[#60708A] dark:text-[#7F8CA1] hover:text-[#10213A] dark:hover:text-[#F8FAFC]"
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
              {touched.confirmPassword && errors.confirmPassword && (
                <p className="text-[11px] text-[#B51232] dark:text-[#D6455D] mt-1 flex items-center gap-1 font-semibold">
                  <AlertCircle className="w-3 h-3 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                  <span>{errors.confirmPassword}</span>
                </p>
              )}
            </div>
          </div>

          {/* Submit button */}
          <Button
            type="submit"
            variant="primary"
            size="lg"
            isLoading={loading}
            disabled={loading || (Object.keys(touched).length > 0 && !isFormValid)}
            className="w-full mt-2 font-bold text-xs"
          >
            {loading ? 'Creating account...' : 'Create Account'}
            <ArrowRight className="w-3.5 h-3.5 ml-1" />
          </Button>
        </form>

        {/* Footer Link to Login */}
        <div className="pt-2 text-center border-t border-[#DED8CC] dark:border-[#344155]">
          <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
            Already have an account?{' '}
            <Link to="/login" className="font-bold text-[#B51232] dark:text-[#C51F3D] hover:underline">
              Sign in
            </Link>
          </p>
        </div>

      </div>
    </div>
  );
}

export default Register;
