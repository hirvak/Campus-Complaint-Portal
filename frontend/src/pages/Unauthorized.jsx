import React from 'react';
import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/Button';
import { ShieldAlert, ArrowLeft, LayoutDashboard } from 'lucide-react';

export function Unauthorized() {
  const { user, getRoleDashboardPath } = useAuth();

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-[#FAF9F6] py-16 px-4 sm:px-6 lg:px-8 flex items-center justify-center text-left">
      <div className="max-w-md w-full bg-white border border-[#E8E5DF] rounded-[20px] p-8 shadow-[0_8px_30px_rgb(0,0,0,0.04)] space-y-6">
        
        <div className="w-12 h-12 rounded-2xl bg-amber-50 text-amber-600 border border-amber-200 flex items-center justify-center">
          <ShieldAlert className="w-6 h-6" />
        </div>

        <div className="space-y-2">
          <h2 className="text-2xl font-extrabold text-[#172033]">
            Access Restricted
          </h2>
          <p className="text-sm text-[#667085] leading-relaxed">
            You do not have permission to view this section. Your account is assigned to the <strong>{user?.role || 'Guest'}</strong> role.
          </p>
        </div>

        <div className="pt-2 flex flex-col gap-3">
          {user && (
            <Link to={getRoleDashboardPath(user.role)}>
              <Button variant="primary" className="w-full">
                <LayoutDashboard className="w-4 h-4 mr-2" />
                Return to {user.role} Dashboard
              </Button>
            </Link>
          )}

          <Link to="/">
            <Button variant="secondary" className="w-full">
              <ArrowLeft className="w-4 h-4 mr-2" />
              Go to Landing Page
            </Button>
          </Link>
        </div>

      </div>
    </div>
  );
}

export default Unauthorized;
