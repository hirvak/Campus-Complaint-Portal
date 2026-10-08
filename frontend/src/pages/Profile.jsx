import React from 'react';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { Mail, Building, Phone, GraduationCap, ShieldCheck, LogOut, UserCheck } from 'lucide-react';

export function Profile() {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-4xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex items-center justify-between shadow-2xs">
          <div>
            <h1 className="text-2xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              MY PROFILE
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              System credentials, role permissions, and department assignment
            </p>
          </div>

          <Button variant="secondary" size="sm" onClick={logout}>
            <LogOut className="w-4 h-4 mr-1.5 text-[#60708A] dark:text-[#AEB9C9]" />
            Logout
          </Button>
        </div>

        {/* MAIN PROFILE WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 sm:p-8 text-left space-y-8 shadow-2xs">
          
          {/* User Identity Banner */}
          <div className="flex items-center gap-4 pb-6 border-b border-[#DED8CC] dark:border-[#344155]">
            <div className="w-14 h-14 rounded-[8px] bg-[#B51232] dark:bg-[#C51F3D] text-white flex items-center justify-center font-bold text-xl font-heading shadow-2xs">
              {user?.full_name ? user.full_name.charAt(0).toUpperCase() : 'U'}
            </div>
            <div>
              <h2 className="text-xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
                {user?.full_name}
              </h2>
              <p className="text-xs text-[#B51232] dark:text-[#C51F3D] font-extrabold uppercase tracking-wider mt-0.5">
                {user?.role}
              </p>
            </div>
          </div>

          {/* Personal Information Rows */}
          <div className="space-y-4 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
              Personal Information
            </h3>

            <div className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                  <Mail className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Email Address
                </span>
                <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{user?.email}</span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                  <Building className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Department
                </span>
                <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{user?.department || 'N/A'}</span>
              </div>

              <div className="py-3 flex justify-between items-center">
                <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                  <Phone className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Phone Contact
                </span>
                <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{user?.phone || 'Not provided'}</span>
              </div>

              {user?.student_type && (
                <div className="py-3 flex justify-between items-center">
                  <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                    <GraduationCap className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Student Type
                  </span>
                  <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{user.student_type} Student</span>
                </div>
              )}

              <div className="py-3 flex justify-between items-center">
                <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                  <UserCheck className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> System Role
                </span>
                <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{user?.role}</span>
              </div>
            </div>
          </div>

          {/* Account Information Rows */}
          <div className="space-y-4">
            <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
              Account Information
            </h3>

            <div className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
              <div className="py-3 flex justify-between items-center">
                <span className="text-[#60708A] dark:text-[#AEB9C9] font-medium flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-[#008A4A] dark:text-[#22A06B]" /> Account Status
                </span>
                <span className="font-bold text-[#008A4A] dark:text-[#22A06B]">
                  {user?.is_active ? '● Active' : '● Inactive'}
                </span>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

export default Profile;
