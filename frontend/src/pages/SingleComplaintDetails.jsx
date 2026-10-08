import React, { useState, useEffect } from 'react';
import { useParams, Link } from 'react-router-dom';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from '../components/StatusBadge';
import Button from '../components/Button';
import {
  ArrowLeft,
  Clock,
  MapPin,
  Tag,
  Building,
  History,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Wrench,
  FileCheck
} from 'lucide-react';

export function SingleComplaintDetails() {
  const { complaintId } = useParams();
  const { user } = useAuth();

  const [complaint, setComplaint] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');
  const [categoryName, setCategoryName] = useState('');
  const [departmentName, setDepartmentName] = useState('');

  const loadData = async () => {
    if (!complaintId) return;
    setLoading(true);
    setErrorMessage('');
    try {
      const data = await api.complaints.getById(complaintId);
      setComplaint(data);

      try {
        const cat = await api.categories.getById(data.category_id);
        if (cat) {
          setCategoryName(cat.name);
          if (cat.department_id) {
            try {
              const dept = await api.departments.getById(cat.department_id);
              if (dept) setDepartmentName(dept.name);
            } catch (e) {}
          }
        }
      } catch (e) {}

      try {
        const logs = await api.complaints.getHistory(complaintId);
        setHistoryLogs(logs);
      } catch (e) {}
    } catch (err) {
      setErrorMessage(err.message || 'Failed to load complaint details.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, [complaintId]);

  const getRolePrefix = () => {
    if (!user) return '';
    switch (user.role) {
      case 'Student': return '/student';
      case 'Faculty': return '/faculty';
      case 'Facility Officer': return '/facility-officer';
      case 'Maintenance Team': return '/maintenance';
      case 'Administrator': return '/admin';
      default: return '';
    }
  };

  const rolePrefix = getRolePrefix();

  const handleClose = async () => {
    setActionLoading(true);
    try {
      await api.complaints.close(complaintId);
      setSuccessMessage('Complaint marked as Closed.');
      loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to close complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopen = async () => {
    setActionLoading(true);
    try {
      await api.complaints.reopen(complaintId);
      setSuccessMessage('Complaint reopened successfully.');
      loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (newStatus) => {
    setActionLoading(true);
    try {
      await api.complaints.updateStatus(complaintId, newStatus);
      setSuccessMessage(`Status updated to "${newStatus}".`);
      loadData();
      setTimeout(() => setSuccessMessage(''), 4000);
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-5xl mx-auto space-y-6 text-left">
        
        {/* NAVIGATION BACK & HEADER WHITE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left space-y-3 shadow-2xs">
          <Link to={`${rolePrefix}/complaints`} className="text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] inline-flex items-center gap-1">
            <ArrowLeft className="w-3.5 h-3.5" /> Back to Complaints List
          </Link>
          {complaint && (
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1 border-t border-[#DED8CC] dark:border-[#344155] pt-3">
              <div>
                <p className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D]">
                  COMPLAINT #{complaintId}
                </p>
                <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
                  {complaint.title}
                </h1>
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={complaint.status} />
                <span className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">Priority: {complaint.priority || 'Medium'}</span>
              </div>
            </div>
          )}
        </div>

        {/* Feedback Alerts */}
        {errorMessage && (
          <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] p-4 rounded-[8px] text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="bg-[#E8F5EC] dark:bg-[#22A06B]/15 border border-[#A7F3D0] dark:border-[#22A06B]/30 text-[#008A4A] dark:text-[#22A06B] p-4 rounded-[8px] text-xs flex items-center gap-2 font-bold">
            <CheckCircle2 className="w-4 h-4 shrink-0" />
            <span>{successMessage}</span>
          </div>
        )}

        {/* MAIN CONTENT WHITE SURFACE */}
        {loading ? (
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-12 text-center text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9] shadow-2xs">
            Loading complaint details...
          </div>
        ) : complaint ? (
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 sm:p-8 text-left space-y-8 shadow-2xs">
            
            {/* Description */}
            <div className="space-y-2 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
              <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
                Description
              </h3>
              <p className="text-sm text-[#10213A] dark:text-[#F8FAFC] bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] leading-relaxed">
                {complaint.description}
              </p>
            </div>

            {/* Complaint Information Strip */}
            <div className="space-y-3 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
              <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
                Complaint Information
              </h3>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3.5 rounded-[6px]">
                  <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <Tag className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" /> Category
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">{categoryName || `Category #${complaint.category_id}`}</p>
                </div>

                <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3.5 rounded-[6px]">
                  <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <MapPin className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" /> Location
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">{complaint.location}</p>
                </div>

                <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3.5 rounded-[6px]">
                  <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <Building className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" /> Department
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                    {departmentName || (complaint.department_id ? `Dept #${complaint.department_id}` : 'Auto-Assigned')}
                  </p>
                </div>

                <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3.5 rounded-[6px]">
                  <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <Clock className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" /> Created Date
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                    {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : '—'}
                  </p>
                </div>
              </div>
            </div>

            {/* Resolution Remarks if available */}
            {complaint.resolution_remarks && (
              <div className="space-y-2 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
                <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#008A4A] dark:text-[#22A06B] flex items-center gap-1.5">
                  <CheckCircle2 className="w-4 h-4 text-[#008A4A] dark:text-[#22A06B]" /> Resolution Remarks
                </h3>
                <p className="text-xs text-[#10213A] dark:text-[#F8FAFC] bg-[#E8F5EC] dark:bg-[#22A06B]/15 border border-[#A7F3D0] dark:border-[#22A06B]/30 p-4 rounded-[6px] leading-relaxed">
                  {complaint.resolution_remarks}
                </p>
              </div>
            )}

            {/* Role Actions */}
            <div className="space-y-3 border-b border-[#DED8CC] dark:border-[#344155] pb-6">
              <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
                Actions
              </h3>
              <div className="space-y-3">
                {(user?.role === 'Student' || user?.role === 'Faculty') && (
                  <div className="flex flex-wrap gap-3">
                    {complaint.status === 'Resolved' && (
                      <>
                        <Button variant="primary" size="sm" onClick={handleClose} isLoading={actionLoading}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Close Complaint
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleReopen} isLoading={actionLoading}>
                          <RotateCcw className="w-4 h-4 mr-1.5" /> Reopen Complaint
                        </Button>
                      </>
                    )}
                  </div>
                )}

                {user?.role === 'Maintenance Team' && (
                  <div className="space-y-3">
                    {complaint.status === 'Assigned' && (
                      <Button variant="primary" size="sm" onClick={() => handleUpdateStatus('In Progress')} isLoading={actionLoading}>
                        <Wrench className="w-4 h-4 mr-1.5" /> Start Work (Mark In Progress)
                      </Button>
                    )}

                    {complaint.status === 'In Progress' && (
                      <form
                        onSubmit={async (e) => {
                          e.preventDefault();
                          const remarks = e.target.elements.remarks.value;
                          if (!remarks || remarks.trim().length < 5) return;
                          setActionLoading(true);
                          setErrorMessage('');
                          try {
                            await api.complaints.resolve(complaintId, { resolution_remarks: remarks.trim() });
                            setSuccessMessage('Complaint marked as Resolved.');
                            loadData();
                            setTimeout(() => setSuccessMessage(''), 4000);
                          } catch (err) {
                            setErrorMessage(err.message || 'Failed to resolve complaint.');
                          } finally {
                            setActionLoading(false);
                          }
                        }}
                        className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] space-y-3"
                      >
                        <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">Submit Resolution Remarks</p>
                        <textarea
                          name="remarks"
                          required
                          minLength={5}
                          rows={2}
                          placeholder="Detail the repair/action completed (minimum 5 characters)..."
                          className="w-full text-xs p-2.5 bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] rounded-[4px]"
                        />
                        <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
                          Submit Resolution
                        </Button>
                      </form>
                    )}
                  </div>
                )}
              </div>
            </div>

            {/* Complaint Timeline Audit */}
            <div className="space-y-4">
              <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
                <History className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Complaint History Timeline
              </h3>

              {historyLogs.length === 0 ? (
                <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] py-2">No history recorded yet.</p>
              ) : (
                <div className="relative pl-6 space-y-4 before:absolute before:left-2 before:top-2 before:bottom-2 before:w-0.5 before:bg-[#DED8CC] dark:before:bg-[#344155]">
                  {historyLogs.map((log) => (
                    <div key={log.id} className="relative text-xs space-y-0.5">
                      <span className="absolute -left-[1.625rem] top-1 w-2.5 h-2.5 rounded-full bg-[#B51232] dark:bg-[#C51F3D] ring-4 ring-white dark:ring-[#182235]" />
                      <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{log.action}</p>
                      <p className="text-[#60708A] dark:text-[#AEB9C9]">{log.description || 'Action recorded'}</p>
                      <p className="text-[10px] text-[#60708A] dark:text-[#7F8CA1]">
                        {new Date(log.created_at).toLocaleDateString()} • {new Date(log.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </p>
                    </div>
                  ))}
                </div>
              )}
            </div>

          </div>
        ) : null}

      </div>
    </div>
  );
}

export default SingleComplaintDetails;
