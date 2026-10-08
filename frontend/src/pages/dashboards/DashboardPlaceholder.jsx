import React from 'react';
import { useAuth } from '../../context/AuthContext';
import Button from '../../components/Button';
import { Shield, User, GraduationCap, ClipboardCheck, Wrench, ShieldCheck, LogOut, FileText, Activity, AlertCircle } from 'lucide-react';

export function DashboardPlaceholder({ roleTitle, roleBadge, icon: RoleIcon }) {
  const { user, logout } = useAuth();

  return (
    <div className="min-h-screen bg-[#FAF9F6] py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-8">
        
        {/* Top welcome banner */}
        <div className="bg-white border border-[#E8E5DF] rounded-[20px] p-6 sm:p-8 shadow-2xs text-left flex flex-col md:flex-row justify-between items-start md:items-center gap-6">
          <div className="flex items-center gap-4">
            <div className="w-14 h-14 rounded-2xl bg-[#EFF6FF] border border-[#DBEAFE] text-[#2563EB] flex items-center justify-center shrink-0">
              <RoleIcon className="w-7 h-7" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <span className="text-xs font-bold uppercase tracking-wider text-[#2563EB] bg-[#DBEAFE]/40 px-2.5 py-0.5 rounded-full">
                  {roleBadge}
                </span>
              </div>
              <h1 className="text-2xl font-extrabold text-[#172033] mt-1">
                Welcome, {user?.full_name || roleTitle}!
              </h1>
              <p className="text-xs sm:text-sm text-[#667085] mt-0.5">
                {user?.email} • Department: {user?.department || 'N/A'} {user?.student_type ? `(${user.student_type})` : ''}
              </p>
            </div>
          </div>

          <Button variant="secondary" size="sm" onClick={logout} className="text-[#667085]">
            <LogOut className="w-4 h-4 mr-1.5" />
            Log Out
          </Button>
        </div>

        {/* Phase 2 Ready Card */}
        <div className="bg-[#EFF6FF] border border-[#DBEAFE] rounded-[20px] p-8 text-left space-y-4">
          <div className="flex items-center gap-2 text-[#2563EB] font-bold text-sm uppercase tracking-wider">
            <Activity className="w-4 h-4" />
            Phase 1 Completed — Phase 2 Ready
          </div>
          <h3 className="text-xl font-bold text-[#172033]">
            {roleTitle} Dashboard Interface Ready for Full Integration
          </h3>
          <p className="text-sm text-[#667085] leading-relaxed">
            The frontend layout, navigation, and authentication state pipeline are configured. The landing page, login page, and registration flow are operational and connected to FastAPI backend schemas.
          </p>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 pt-4">
            <div className="bg-white border border-[#E8E5DF] rounded-xl p-4">
              <p className="text-xs text-[#667085]">User Role</p>
              <p className="text-base font-bold text-[#172033] mt-1">{user?.role || roleTitle}</p>
            </div>
            <div className="bg-white border border-[#E8E5DF] rounded-xl p-4">
              <p className="text-xs text-[#667085]">Account Status</p>
              <p className="text-base font-bold text-emerald-600 mt-1">
                {user?.is_active ? 'Active' : 'Pending'}
              </p>
            </div>
            <div className="bg-white border border-[#E8E5DF] rounded-xl p-4">
              <p className="text-xs text-[#667085]">API Connection</p>
              <p className="text-base font-bold text-[#2563EB] mt-1">FastAPI REST</p>
            </div>
          </div>
        </div>

      </div>
    </div>
  );
}

export default DashboardPlaceholder;
