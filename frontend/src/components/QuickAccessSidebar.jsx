import React from 'react';
import { Link, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export function QuickAccessSidebar() {
  const location = useLocation();
  const { user } = useAuth();

  const getRoleItems = () => {
    if (!user) return [];
    switch (user.role) {
      case 'Student':
      case 'Faculty': {
        const prefix = user.role === 'Student' ? '/student' : '/faculty';
        return [
          { title: 'DASHBOARD', path: `${prefix}/dashboard`, prefix: '[↗]' },
          { title: 'NEW COMPLAINT', path: `${prefix}/complaints/new`, prefix: '[+]' },
          { title: 'MY COMPLAINTS', path: `${prefix}/complaints`, prefix: '[↗]' },
          { title: 'NOTIFICATIONS', path: `${prefix}/notifications`, prefix: '[↗]' },
          { title: 'PROFILE', path: `${prefix}/profile`, prefix: '[↗]' },
        ];
      }
      case 'Facility Officer':
        return [
          { title: 'DASHBOARD', path: '/facility-officer/dashboard', prefix: '[↗]' },
          { title: 'PENDING ASSIGNMENT', path: '/facility-officer/pending', prefix: '[!]' },
          { title: 'ALL COMPLAINTS', path: '/facility-officer/complaints', prefix: '[↗]' },
          { title: 'NOTIFICATIONS', path: '/facility-officer/notifications', prefix: '[↗]' },
          { title: 'PROFILE', path: '/facility-officer/profile', prefix: '[↗]' },
        ];
      case 'Maintenance Team':
        return [
          { title: 'DASHBOARD', path: '/maintenance/dashboard', prefix: '[↗]' },
          { title: 'ASSIGNED COMPLAINTS', path: '/maintenance/complaints', prefix: '[↗]' },
          { title: 'NOTIFICATIONS', path: '/maintenance/notifications', prefix: '[↗]' },
          { title: 'PROFILE', path: '/maintenance/profile', prefix: '[↗]' },
        ];
      case 'Administrator':
        return [
          { title: 'DASHBOARD', path: '/admin/dashboard', prefix: '[↗]' },
          { title: 'ALL COMPLAINTS', path: '/admin/complaints', prefix: '[↗]' },
          { title: 'USER MANAGEMENT', path: '/admin/users', prefix: '[↗]' },
          { title: 'DEPARTMENTS', path: '/admin/departments', prefix: '[↗]' },
          { title: 'CATEGORIES', path: '/admin/categories', prefix: '[↗]' },
          { title: 'REPORTS & ANALYTICS', path: '/admin/reports', prefix: '[↗]' },
          { title: 'NOTIFICATIONS', path: '/admin/notifications', prefix: '[↗]' },
          { title: 'PROFILE', path: '/admin/profile', prefix: '[↗]' },
        ];
      default:
        return [];
    }
  };

  const items = getRoleItems();

  return (
    <aside className="w-full bg-[#172033] text-white rounded-[8px] p-5 space-y-4 text-left shadow-xs">
      <div className="border-b border-slate-700/60 pb-3">
        <h3 className="text-[11px] font-extrabold uppercase tracking-widest text-slate-400">
          QUICK ACCESS
        </h3>
      </div>

      <nav className="space-y-1.5">
        {items.map((item) => {
          const isActive = location.pathname === item.path;

          return (
            <Link
              key={item.title}
              to={item.path}
              className={`flex items-center justify-between px-3 py-2.5 rounded-[6px] text-xs font-bold tracking-wide transition-colors ${
                isActive
                  ? 'bg-[#16803C] text-white font-extrabold'
                  : 'text-slate-300 hover:text-white hover:bg-slate-800/80'
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="text-slate-400 text-[11px] font-mono">{item.prefix}</span>
                {item.title}
              </span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}

export default QuickAccessSidebar;
