import React, { useState, useEffect } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import LogoMark from './LogoMark';
import { useAuth } from '../context/AuthContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';
import {
  LayoutDashboard,
  FileText,
  Bell,
  User,
  LogOut,
  Menu,
  X,
  Clock,
  CheckCircle2,
  Users,
  Building,
  Tag,
  BarChart3,
  Sliders,
  Sun,
  Moon
} from 'lucide-react';

export function Navbar() {
  const { user, logout, isAuthenticated } = useAuth();
  const { theme, toggleTheme } = useTheme();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (!isAuthenticated) return;
    const fetchUnread = async () => {
      try {
        const unread = await api.notifications.getUnread();
        setUnreadCount(Array.isArray(unread) ? unread.length : 0);
      } catch (e) {}
    };
    fetchUnread();

    const handleUpdate = () => fetchUnread();
    window.addEventListener('unread-notifications-updated', handleUpdate);
    return () => window.removeEventListener('unread-notifications-updated', handleUpdate);
  }, [isAuthenticated, location.pathname]);

  const handleNavClick = (id) => {
    setMobileMenuOpen(false);
    if (location.pathname !== '/') {
      navigate('/#' + id);
      setTimeout(() => {
        const el = document.getElementById(id);
        if (el) el.scrollIntoView({ behavior: 'smooth' });
      }, 100);
    } else {
      const el = document.getElementById(id);
      if (el) el.scrollIntoView({ behavior: 'smooth' });
    }
  };

  const getRoleNavLinks = () => {
    if (!user) return [];

    switch (user.role) {
      case 'Student':
      case 'Faculty': {
        const prefix = user.role === 'Student' ? '/student' : '/faculty';
        return [
          { name: 'Dashboard', path: `${prefix}/dashboard`, icon: LayoutDashboard },
          { name: 'My Complaints', path: `${prefix}/complaints`, icon: FileText },
          { name: 'Notifications', path: `${prefix}/notifications`, icon: Bell },
          { name: 'Profile', path: `${prefix}/profile`, icon: User },
        ];
      }
      case 'Facility Officer':
        return [
          { name: 'Dashboard', path: '/facility-officer/dashboard', icon: LayoutDashboard },
          { name: 'Pending Complaints', path: '/facility-officer/pending', icon: Clock },
          { name: 'All Complaints', path: '/facility-officer/complaints', icon: FileText },
          { name: 'Notifications', path: '/facility-officer/notifications', icon: Bell },
          { name: 'Profile', path: '/facility-officer/profile', icon: User },
        ];
      case 'Maintenance Team':
        return [
          { name: 'Dashboard', path: '/maintenance/dashboard', icon: LayoutDashboard },
          { name: 'Assigned Complaints', path: '/maintenance/complaints', icon: CheckCircle2 },
          { name: 'Notifications', path: '/maintenance/notifications', icon: Bell },
          { name: 'Profile', path: '/maintenance/profile', icon: User },
        ];
      case 'Administrator':
        return [
          { name: 'Dashboard', path: '/admin/dashboard', icon: LayoutDashboard },
          { name: 'Users', path: '/admin/users', icon: Users },
          { name: 'Departments', path: '/admin/departments', icon: Building },
          { name: 'Categories', path: '/admin/categories', icon: Tag },
          { name: 'SLA Targets', path: '/admin/sla', icon: Sliders },
          { name: 'Complaints', path: '/admin/complaints', icon: FileText },
          { name: 'Reports', path: '/admin/reports', icon: BarChart3 },
          { name: 'Notifications', path: '/admin/notifications', icon: Bell },
          { name: 'Profile', path: '/admin/profile', icon: User },
        ];
      default:
        return [
          { name: 'Dashboard', path: '/dashboard', icon: LayoutDashboard },
          { name: 'Complaints', path: '/complaints', icon: FileText },
          { name: 'Notifications', path: '/notifications', icon: Bell },
          { name: 'Profile', path: '/profile', icon: User },
        ];
    }
  };

  const getDashboardPath = () => {
    if (!user) return '/';
    switch (user.role) {
      case 'Student': return '/student/dashboard';
      case 'Faculty': return '/faculty/dashboard';
      case 'Facility Officer': return '/facility-officer/dashboard';
      case 'Maintenance Team': return '/maintenance/dashboard';
      case 'Administrator': return '/admin/dashboard';
      default: return '/dashboard';
    }
  };

  const authenticatedNavLinks = getRoleNavLinks();

  const ThemeToggleButton = () => (
    <button
      onClick={toggleTheme}
      type="button"
      className="p-2 rounded-[6px] text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] hover:bg-[#FDF2F4] dark:hover:bg-[#202B3D] transition-colors cursor-pointer border border-transparent hover:border-[#DED8CC] dark:hover:border-[#344155]"
      title={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
      aria-label={theme === 'light' ? 'Switch to dark mode' : 'Switch to light mode'}
    >
      {theme === 'light' ? (
        <Moon className="w-4 h-4 shrink-0 text-[#10213A]" />
      ) : (
        <Sun className="w-4 h-4 shrink-0 text-amber-400" />
      )}
    </button>
  );

  return (
    <header className="sticky top-0 z-50 bg-[#FFFFFF] dark:bg-[#111827] border-b border-[#DED8CC] dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] h-[72px] shadow-2xs transition-colors duration-150">
      <div className="max-w-[1400px] mx-auto px-4 sm:px-6 h-full flex items-center justify-between gap-4">
        
        {/* Left: Brand logo & descriptor */}
        <div className="flex items-center gap-3 shrink-0 whitespace-nowrap">
          <Link to={isAuthenticated ? getDashboardPath() : '/'} className="flex items-center gap-2">
            <LogoMark textClassName="text-xl font-extrabold" />
          </Link>
          <div className="hidden md:block h-5 w-[1px] bg-[#DED8CC] dark:bg-[#344155]" />
          <span className="hidden md:inline-block text-[11px] sm:text-[12px] font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9] whitespace-nowrap shrink-0">
            CAMPUS COMPLAINT PORTAL
          </span>
        </div>

        {/* Center: Navigation Links */}
        {isAuthenticated ? (
          <nav className="hidden lg:flex items-center justify-center gap-1.5 flex-1 whitespace-nowrap overflow-x-auto">
            {authenticatedNavLinks.map((link) => {
              const Icon = link.icon;
              const isActive = location.pathname === link.path;

              return (
                <Link
                  key={link.name}
                  to={link.path}
                  className={`px-3 py-2 rounded-[6px] text-xs font-heading font-semibold transition-colors flex items-center gap-1.5 shrink-0 whitespace-nowrap ${
                    isActive
                      ? 'bg-[#B51232] dark:bg-[#C51F3D] text-white font-bold shadow-2xs'
                      : 'text-[#10213A] dark:text-[#F8FAFC] hover:text-[#B51232] dark:hover:text-[#C51F3D] hover:bg-[#FDF2F4] dark:hover:bg-[#202B3D]'
                  }`}
                >
                  <Icon className="w-3.5 h-3.5 shrink-0" />
                  <span>{link.name}</span>
                  {link.name === 'Notifications' && unreadCount > 0 && (
                    <span className="ml-1 px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B51232] dark:bg-[#C51F3D] text-white leading-none">
                      {unreadCount}
                    </span>
                  )}
                </Link>
              );
            })}
          </nav>
        ) : (
          <nav className="hidden lg:flex items-center gap-6 whitespace-nowrap">
            <button
              onClick={() => handleNavClick('hero')}
              className="text-xs font-heading font-semibold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] cursor-pointer"
            >
              Home
            </button>
            <button
              onClick={() => handleNavClick('how-it-works')}
              className="text-xs font-heading font-semibold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] cursor-pointer"
            >
              How It Works
            </button>
            <button
              onClick={() => handleNavClick('features')}
              className="text-xs font-heading font-semibold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] cursor-pointer"
            >
              Features
            </button>
            <button
              onClick={() => handleNavClick('roles')}
              className="text-xs font-heading font-semibold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] cursor-pointer"
            >
              Roles
            </button>
          </nav>
        )}

        {/* Right: User status, actions & Theme Toggle */}
        <div className="hidden lg:flex items-center gap-3 shrink-0 whitespace-nowrap">
          <ThemeToggleButton />
          
          {isAuthenticated && user ? (
            <div className="flex items-center gap-3 whitespace-nowrap">
              <div className="text-right leading-tight">
                <p className="text-[13px] font-heading font-bold text-[#10213A] dark:text-[#F8FAFC] whitespace-nowrap">{user.full_name}</p>
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#B51232] dark:text-[#C51F3D] tracking-wider whitespace-nowrap">{user.role}</p>
              </div>
              <div className="h-5 w-[1px] bg-[#DED8CC] dark:bg-[#344155]" />
              <button
                onClick={() => {
                  logout();
                  navigate('/login');
                }}
                className="h-9 px-3.5 border border-[#DED8CC] dark:border-[#344155] rounded-[6px] bg-white dark:bg-[#202B3D] text-xs font-heading font-bold text-[#10213A] dark:text-[#F8FAFC] hover:bg-[#FDF2F4] dark:hover:bg-[#263246] hover:text-[#B51232] dark:hover:text-[#C51F3D] flex items-center gap-1.5 transition-colors cursor-pointer"
              >
                <LogOut className="w-3.5 h-3.5 text-[#60708A] dark:text-[#AEB9C9]" />
                <span>Logout</span>
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link to="/login">
                <button className="h-9 px-4 border border-[#DED8CC] dark:border-[#344155] rounded-[6px] bg-white dark:bg-[#202B3D] text-xs font-heading font-bold text-[#10213A] dark:text-[#F8FAFC] hover:bg-[#FDF2F4] dark:hover:bg-[#263246] transition-colors cursor-pointer">
                  Login
                </button>
              </Link>
              <Link to="/register">
                <button className="h-9 px-4 rounded-[6px] bg-[#B51232] dark:bg-[#C51F3D] text-white text-xs font-heading font-bold hover:bg-[#94102A] dark:hover:bg-[#A91531] transition-colors cursor-pointer">
                  Register
                </button>
              </Link>
            </div>
          )}
        </div>

        {/* Mobile menu toggle button */}
        <div className="lg:hidden flex items-center gap-2">
          <ThemeToggleButton />
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="p-2 text-[#10213A] dark:text-[#F8FAFC] hover:bg-[#FDF2F4] dark:hover:bg-[#202B3D] rounded-[6px]"
            aria-label="Toggle Navigation Menu"
          >
            {mobileMenuOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Drawer */}
      {mobileMenuOpen && (
        <div className="lg:hidden border-b border-[#DED8CC] dark:border-[#344155] bg-[#FFFFFF] dark:bg-[#182235] px-4 pt-2 pb-4 space-y-2 text-left shadow-md">
          {isAuthenticated ? (
            <>
              <nav className="flex flex-col space-y-1 pb-3 border-b border-[#DED8CC] dark:border-[#344155]">
                {authenticatedNavLinks.map((link) => {
                  const Icon = link.icon;
                  const isActive = location.pathname === link.path;
                  return (
                    <Link
                      key={link.name}
                      to={link.path}
                      onClick={() => setMobileMenuOpen(false)}
                      className={`px-3 py-2 rounded-[6px] text-xs font-heading font-bold flex items-center justify-between gap-2 ${
                        isActive
                          ? 'bg-[#B51232] dark:bg-[#C51F3D] text-white'
                          : 'text-[#10213A] dark:text-[#F8FAFC] hover:bg-[#FDF2F4] dark:hover:bg-[#202B3D] hover:text-[#B51232] dark:hover:text-[#C51F3D]'
                      }`}
                    >
                      <div className="flex items-center gap-2">
                        <Icon className="w-4 h-4" />
                        <span>{link.name}</span>
                      </div>
                      {link.name === 'Notifications' && unreadCount > 0 && (
                        <span className="px-1.5 py-0.5 rounded-full text-[10px] font-extrabold bg-[#B51232] dark:bg-[#C51F3D] text-white leading-none">
                          {unreadCount}
                        </span>
                      )}
                    </Link>
                  );
                })}
              </nav>
              <div className="pt-2 flex items-center justify-between">
                <div>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">{user?.full_name}</p>
                  <p className="text-[10px] text-[#B51232] dark:text-[#C51F3D] font-heading font-extrabold uppercase">{user?.role}</p>
                </div>
                <button
                  onClick={() => {
                    logout();
                    setMobileMenuOpen(false);
                    navigate('/login');
                  }}
                  className="h-8 px-3 border border-[#DED8CC] dark:border-[#344155] rounded-[6px] bg-white dark:bg-[#202B3D] text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] hover:bg-[#FDF2F4] dark:hover:bg-[#263246] flex items-center gap-1"
                >
                  <LogOut className="w-3.5 h-3.5 text-[#60708A] dark:text-[#AEB9C9]" />
                  Logout
                </button>
              </div>
            </>
          ) : (
            <div className="flex flex-col gap-2 pt-1">
              <nav className="flex flex-col space-y-1 pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
                <button
                  onClick={() => handleNavClick('hero')}
                  className="text-left px-3 py-1.5 text-xs font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]"
                >
                  Home
                </button>
                <button
                  onClick={() => handleNavClick('how-it-works')}
                  className="text-left px-3 py-1.5 text-xs font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]"
                >
                  How It Works
                </button>
                <button
                  onClick={() => handleNavClick('features')}
                  className="text-left px-3 py-1.5 text-xs font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]"
                >
                  Features
                </button>
                <button
                  onClick={() => handleNavClick('roles')}
                  className="text-left px-3 py-1.5 text-xs font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]"
                >
                  Roles
                </button>
              </nav>
              <Link to="/login" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2 border border-[#DED8CC] dark:border-[#344155] rounded-[6px] bg-white dark:bg-[#202B3D] text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">
                  Login
                </button>
              </Link>
              <Link to="/register" onClick={() => setMobileMenuOpen(false)}>
                <button className="w-full py-2 rounded-[6px] bg-[#B51232] dark:bg-[#C51F3D] text-white text-xs font-bold">
                  Register
                </button>
              </Link>
            </div>
          )}
        </div>
      )}
    </header>
  );
}

export default Navbar;
