import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ComplaintDetailsModal from '../components/ComplaintDetailsModal';
import Button from '../components/Button';
import {
  ArrowUpRight,
  AlertCircle,
  Clock,
  Plus,
  RotateCcw,
  CheckCircle2,
  Users,
  Activity,
  FileText
} from 'lucide-react';

export function Dashboard() {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [stats, setStats] = useState(null);
  const [complaints, setComplaints] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [recentHistory, setRecentHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedComplaintId, setSelectedComplaintId] = useState(null);
  const [errorMessage, setErrorMessage] = useState('');

  const fetchDashboardData = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      // 1. Fetch Categories
      try {
        const cats = await api.categories.getAll();
        const map = {};
        cats.forEach((c) => {
          map[c.id] = c.name;
        });
        setCategoriesMap(map);
      } catch (e) {}

      // 2. Fetch Complaints based on User Role
      let list = [];
      if (user?.role === 'Student' || user?.role === 'Faculty') {
        list = await api.complaints.getMyComplaints();
      } else if (user?.role === 'Maintenance Team') {
        list = await api.complaints.getAssignedComplaints();
      } else if (user?.role === 'Facility Officer') {
        list = await api.complaints.getPendingComplaints();
      } else {
        list = await api.complaints.getAllComplaints();
      }

      setComplaints(list);

      // 3. Fetch Real Statistics
      try {
        const dashRes = await api.dashboard.getStats();
        if (dashRes && dashRes.complaint_statistics) {
          const cs = dashRes.complaint_statistics;
          setStats({
            total_complaints: cs.total_complaints,
            new_complaints: cs.new_complaints,
            assigned_in_progress: (cs.assigned_complaints || 0) + (cs.in_progress_complaints || 0) + (cs.reopened_complaints || 0),
            resolved_complaints: (cs.resolved_complaints || 0) + (cs.closed_complaints || 0),
          });
        }
      } catch (e) {
        setStats({
          total_complaints: list.length,
          new_complaints: list.filter((c) => c.status === 'New').length,
          assigned_in_progress: list.filter(
            (c) => c.status === 'Assigned' || c.status === 'In Progress' || c.status === 'Reopened'
          ).length,
          resolved_complaints: list.filter((c) => c.status === 'Resolved' || c.status === 'Closed').length,
        });
      }

      // 4. Fetch recent history audit log if available
      if (list.length > 0) {
        try {
          const logs = await api.complaints.getHistory(list[0].id);
          setRecentHistory(logs.slice(0, 5));
        } catch (e) {}
      }
    } catch (err) {
      setErrorMessage(err.message || 'Unable to load complaints from backend server.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDashboardData();
  }, [user]);

  const getTimeOfDayGreeting = () => {
    const hour = new Date().getHours();
    if (hour < 12) return 'GOOD MORNING';
    if (hour < 18) return 'GOOD AFTERNOON';
    return 'GOOD EVENING';
  };

  const getRolePrefix = () => {
    switch (user?.role) {
      case 'Student': return '/student';
      case 'Faculty': return '/faculty';
      case 'Facility Officer': return '/facility-officer';
      case 'Maintenance Team': return '/maintenance';
      case 'Administrator': return '/admin';
      default: return '';
    }
  };

  const rolePrefix = getRolePrefix();

  const formatCount = (val) => {
    const num = val || 0;
    return num < 10 ? `0${num}` : `${num}`;
  };

  const renderContextualCTA = () => {
    if (user?.role === 'Student' || user?.role === 'Faculty') {
      return (
        <Link to={`${rolePrefix}/complaints/new`}>
          <Button variant="primary" size="md">
            <Plus className="w-4 h-4 mr-1.5" />
            Report Complaint
          </Button>
        </Link>
      );
    }
    if (user?.role === 'Facility Officer') {
      return (
        <Link to="/facility-officer/pending">
          <Button variant="primary" size="md">
            <Clock className="w-4 h-4 mr-1.5" />
            View Pending Assignments
          </Button>
        </Link>
      );
    }
    if (user?.role === 'Maintenance Team') {
      return (
        <Link to="/maintenance/complaints">
          <Button variant="primary" size="md">
            <CheckCircle2 className="w-4 h-4 mr-1.5" />
            View Work Orders
          </Button>
        </Link>
      );
    }
    if (user?.role === 'Administrator') {
      return (
        <Link to="/admin/users">
          <Button variant="primary" size="md">
            <Users className="w-4 h-4 mr-1.5" />
            User Management
          </Button>
        </Link>
      );
    }
    return null;
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-7xl mx-auto space-y-6">
        
        {/* DASHBOARD HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-1">
              {getTimeOfDayGreeting()}, {user?.full_name?.toUpperCase() || 'USER'}
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
              CAMPUS DASHBOARD
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-1 flex flex-wrap items-center gap-2">
              <span>{user?.email}</span>
              <span>·</span>
              <span>Department: <strong className="text-[#10213A] dark:text-[#F8FAFC] font-semibold">{user?.department || 'General'}</strong></span>
              {user?.student_type && (
                <>
                  <span>·</span>
                  <span>{user.student_type} Student</span>
                </>
              )}
              <span>·</span>
              <span className="text-[#B51232] dark:text-[#C51F3D] font-extrabold uppercase tracking-wider">{user?.role}</span>
            </p>
          </div>

          <div>
            {renderContextualCTA()}
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#B51232] dark:text-[#D6455D] p-4 rounded-[8px] text-xs flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMessage}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchDashboardData}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Retry
            </Button>
          </div>
        )}

        {/* OVERVIEW / STATISTICS WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left space-y-4 shadow-2xs">
          <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
            OVERVIEW
          </h2>
          <div className="grid grid-cols-2 sm:grid-cols-4 divide-x divide-[#DED8CC] dark:divide-[#344155] pt-1">
            <div className="px-4 first:pl-0 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
                {formatCount(stats?.total_complaints)}
              </p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                {user?.role === 'Maintenance Team' ? 'TOTAL ASSIGNED' : 'TOTAL COMPLAINTS'}
              </p>
            </div>

            <div className="px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-heading text-[#B51232] dark:text-[#C51F3D]">
                {formatCount(stats?.new_complaints)}
              </p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                NEW ISSUES
              </p>
            </div>

            <div className="px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-heading text-[#B66A00] dark:text-[#D18A16]">
                {formatCount(stats?.assigned_in_progress)}
              </p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                IN PROGRESS
              </p>
            </div>

            <div className="px-4 space-y-1">
              <p className="text-3xl sm:text-4xl font-extrabold font-heading text-[#008A4A] dark:text-[#22A06B]">
                {formatCount(stats?.resolved_complaints)}
              </p>
              <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                RESOLVED
              </p>
            </div>
          </div>
        </div>

        {/* RECENT COMPLAINTS WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left space-y-4 shadow-2xs">
          <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
            <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] font-heading flex items-center gap-2">
              <FileText className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
              {user?.role === 'Maintenance Team' ? 'ASSIGNED WORK ORDERS' : 'RECENT COMPLAINTS'}
            </h2>
            <Link
              to={`${rolePrefix}/complaints`}
              className="text-xs font-bold text-[#B51232] dark:text-[#C51F3D] hover:underline flex items-center gap-1"
            >
              <span>VIEW ALL</span>
              <ArrowUpRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#60708A] dark:text-[#AEB9C9] font-semibold flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#B51232] dark:text-[#C51F3D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading complaints...</span>
            </div>
          ) : complaints.length === 0 ? (
            <div className="py-10 text-center space-y-3">
              <h3 className="text-xs font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC]">NO COMPLAINTS FOUND</h3>
              <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
                {user?.role === 'Maintenance Team'
                  ? 'You currently have no work orders assigned to you.'
                  : 'There are no recent campus complaints registered.'}
              </p>
              {(user?.role === 'Student' || user?.role === 'Faculty') && (
                <Link to={`${rolePrefix}/complaints/new`}>
                  <Button variant="primary" size="sm">
                    <Plus className="w-4 h-4 mr-1" />
                    Report Your First Issue
                  </Button>
                </Link>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                    <th className="py-3 px-3">COMPLAINT</th>
                    <th className="py-3 px-3">CATEGORY</th>
                    <th className="py-3 px-3">LOCATION</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3">DATE</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                  {complaints.slice(0, 6).map((c) => (
                    <tr
                      key={c.id}
                      className="hover:bg-[#FAF7F0] dark:hover:bg-[#202B3D] transition-colors cursor-pointer group"
                      onClick={() => navigate(`${rolePrefix}/complaints/${c.id}`)}
                    >
                      <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC] group-hover:text-[#B51232] dark:group-hover:text-[#C51F3D]">
                        {c.title}
                      </td>
                      <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                        {categoriesMap[c.category_id] || `Cat #${c.category_id}`}
                      </td>
                      <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">{c.location}</td>
                      <td className="py-3.5 px-3">
                        <StatusBadge status={c.status} />
                      </td>
                      <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                        {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right">
                        <span className="text-xs font-bold text-[#B51232] dark:text-[#C51F3D] group-hover:underline">
                          View →
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* RECENT ACTIVITY TIMELINE WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left space-y-4 shadow-2xs">
          <h2 className="text-xs font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] font-heading flex items-center gap-2">
            <Activity className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
            RECENT ACTIVITY TIMELINE
          </h2>

          {recentHistory.length === 0 ? (
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] py-2 uppercase tracking-wider font-semibold">No recent activity recorded.</p>
          ) : (
            <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DED8CC] dark:before:bg-[#344155]">
              {recentHistory.map((log) => (
                <div key={log.id} className="relative text-xs space-y-0.5">
                  <span className="absolute -left-[1.625rem] top-1 w-2.5 h-2.5 rounded-full bg-[#B51232] dark:bg-[#C51F3D] ring-4 ring-white dark:ring-[#182235]" />
                  <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{log.action}</p>
                  <p className="text-[#60708A] dark:text-[#AEB9C9]">{log.description || 'Activity recorded'}</p>
                  <p className="text-[10px] text-[#60708A] dark:text-[#7F8CA1]">
                    {new Date(log.created_at).toLocaleDateString()} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>

      {/* Complaint Details Modal fallback */}
      {selectedComplaintId && (
        <ComplaintDetailsModal
          complaintId={selectedComplaintId}
          onClose={() => setSelectedComplaintId(null)}
          onRefresh={fetchDashboardData}
        />
      )}
    </div>
  );
}

export default Dashboard;
