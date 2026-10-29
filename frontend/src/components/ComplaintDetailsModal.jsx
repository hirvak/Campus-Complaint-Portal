import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import StatusBadge from './StatusBadge';
import Button from './Button';
import ComplaintPhoto from './ComplaintPhoto';
import SlaTracker from './SlaTracker';
import {
  X,
  Clock,
  MapPin,
  Building,
  Tag,
  UserCheck,
  History,
  CheckCircle2,
  RotateCcw,
  AlertCircle,
  Wrench,
  Send
} from 'lucide-react';

export function ComplaintDetailsModal({ complaintId, onClose, onRefresh }) {
  const { user } = useAuth();
  const [complaint, setComplaint] = useState(null);
  const [historyLogs, setHistoryLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  // Action form state
  const [resolutionRemarks, setResolutionRemarks] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [assignPriority, setAssignPriority] = useState('Medium');
  const [statusVal, setStatusVal] = useState('');
  const [maintenanceUsers, setMaintenanceUsers] = useState([]);

  useEffect(() => {
    async function loadData() {
      if (!complaintId) return;
      setLoading(true);
      setErrorMessage('');
      try {
        const data = await api.complaints.getById(complaintId);
        setComplaint(data);
        setStatusVal(data.status);

        // Fetch history
        try {
          const logs = await api.complaints.getHistory(complaintId);
          setHistoryLogs(logs);
        } catch (e) {
          // history might be restricted or empty
        }

        // Fetch maintenance team members if user is Facility Officer
        if (user?.role === 'Facility Officer' || user?.role === 'Administrator') {
          try {
            const users = await api.users.getAll();
            setMaintenanceUsers(users.filter((u) => u.role === 'Maintenance Team' && u.is_active));
          } catch (e) {}
        }
      } catch (err) {
        setErrorMessage(err.message || 'Failed to load complaint details.');
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, [complaintId, user]);

  const handleCloseComplaint = async () => {
    setActionLoading(true);
    try {
      await api.complaints.close(complaintId);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to close complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleReopenComplaint = async () => {
    setActionLoading(true);
    try {
      await api.complaints.reopen(complaintId);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to reopen complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleAssignComplaint = async (e) => {
    e.preventDefault();
    if (!assigneeId) return;
    setActionLoading(true);
    try {
      await api.complaints.assign(complaintId, {
        assigned_to: assigneeId,
        priority: assignPriority,
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to assign complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleUpdateStatus = async (e) => {
    e.preventDefault();
    setActionLoading(true);
    try {
      await api.complaints.updateStatus(complaintId, statusVal);
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to update status.');
    } finally {
      setActionLoading(false);
    }
  };

  const handleResolveComplaint = async (e) => {
    e.preventDefault();
    if (!resolutionRemarks.trim()) return;
    setActionLoading(true);
    try {
      await api.complaints.resolve(complaintId, {
        resolution_remarks: resolutionRemarks.trim(),
      });
      if (onRefresh) onRefresh();
      onClose();
    } catch (err) {
      setErrorMessage(err.message || 'Failed to resolve complaint.');
    } finally {
      setActionLoading(false);
    }
  };

  if (!complaintId) return null;

  return (
    <div className="fixed inset-0 z-50 bg-[#10213A]/40 dark:bg-black/60 backdrop-blur-xs flex items-center justify-center p-4">
      <div className="bg-[#FBF8F1] dark:bg-[#202B3D] border border-[#DED9CF] dark:border-[#344155] rounded-[12px] max-w-2xl w-full max-h-[90vh] overflow-y-auto text-left shadow-xl transition-colors duration-150">
        
        {/* Header */}
        <div className="px-6 py-4 border-b border-[#DED9CF] dark:border-[#344155] flex items-center justify-between bg-[#F5F0E6] dark:bg-[#182235]">
          <div>
            <span className="text-[10px] font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9]">
              COMPLAINT #{complaintId}
            </span>
            <h3 className="text-lg font-bold text-[#10213A] dark:text-[#F8FAFC] font-heading mt-0.5">
              {complaint?.title || 'Complaint Details'}
            </h3>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-[#60708A] dark:text-[#AEB9C9] hover:text-[#10213A] dark:hover:text-[#F8FAFC] hover:bg-[#DED8CC]/40 dark:hover:bg-[#344155] rounded-[4px]"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-6">
          {loading ? (
            <div className="py-12 text-center text-xs font-semibold text-[#60708A] dark:text-[#AEB9C9]">
              Loading details...
            </div>
          ) : errorMessage ? (
            <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#B51232] dark:text-[#D6455D] p-4 rounded-[6px] text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0" />
              <span>{errorMessage}</span>
            </div>
          ) : (
            <>
              {/* Status Header Bar */}
              <div className="flex flex-wrap items-center justify-between gap-4 p-3.5 bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[6px]">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-bold uppercase text-[#60708A] dark:text-[#AEB9C9]">Status:</span>
                  <StatusBadge status={complaint.status} />
                </div>
                <div className="text-xs text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1.5">
                  <Clock className="w-3.5 h-3.5" />
                  <span>Reported: {complaint.created_at ? new Date(complaint.created_at).toLocaleDateString() : 'N/A'}</span>
                </div>
              </div>

              {/* Description */}
              <div className="space-y-1.5">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                  Description
                </h4>
                <p className="text-sm text-[#10213A] dark:text-[#F8FAFC] bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] leading-relaxed">
                  {complaint.description}
                </p>
              </div>

              {/* Attached Photo */}
              {complaint.image_url && (
                <ComplaintPhoto imageUrl={complaint.image_url} title={complaint.title} />
              )}


              {/* Grid Metadata */}
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                  <p className="text-[10px] font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <MapPin className="w-3 h-3 text-[#B51232] dark:text-[#C51F3D]" /> Location
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">{complaint.location}</p>
                </div>

                <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                  <p className="text-[10px] font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <Tag className="w-3 h-3 text-[#B51232] dark:text-[#C51F3D]" /> Priority
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">{complaint.priority || 'Medium'}</p>
                </div>

                <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px] col-span-2 sm:col-span-1">
                  <p className="text-[10px] font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1">
                    <Building className="w-3 h-3 text-[#B51232] dark:text-[#C51F3D]" /> Assigned Officer
                  </p>
                  <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                    {complaint.assigned_to ? `User #${complaint.assigned_to}` : 'Unassigned'}
                  </p>
                </div>
              </div>

              {/* SLA Resolution & Escalation Tracker */}
              <SlaTracker complaint={complaint} historyLogs={historyLogs} loading={loading} />

              {/* Resolution Remarks if available */}
              {complaint.resolution_remarks && (
                <div className="bg-[#FDF2F4] dark:bg-[#C51F3D]/15 border border-[#B51232]/30 dark:border-[#C51F3D]/30 p-4 rounded-[6px] space-y-1">
                  <h4 className="text-xs font-bold text-[#B51232] dark:text-[#C51F3D] uppercase tracking-wider flex items-center gap-1.5">
                    <CheckCircle2 className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" /> Resolution Remarks
                  </h4>
                  <p className="text-xs text-[#10213A] dark:text-[#F8FAFC] leading-relaxed">
                    {complaint.resolution_remarks}
                  </p>
                </div>
              )}

              {/* Workflow Actions Section based on Role & Status */}
              <div className="pt-2 border-t border-[#DED8CC] dark:border-[#344155] space-y-3">
                <h4 className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                  Workflow Actions
                </h4>

                {/* Facility Officer Assign Form */}
                {(user?.role === 'Facility Officer' || user?.role === 'Administrator') &&
                  (complaint.status === 'New' || complaint.status === 'Reopened') && (
                    <form onSubmit={handleAssignComplaint} className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] space-y-3">
                      <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">Assign to Maintenance Member</p>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#60708A] dark:text-[#AEB9C9] mb-1">
                            Maintenance Member
                          </label>
                          <select
                            required
                            value={assigneeId}
                            onChange={(e) => setAssigneeId(e.target.value)}
                            className="w-full text-xs p-2 bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] rounded-[4px]"
                          >
                            <option value="">Select Member</option>
                            {maintenanceUsers.map((m) => (
                              <option key={m.id} value={m.id}>
                                {m.full_name} ({m.department})
                              </option>
                            ))}
                          </select>
                        </div>
                        <div>
                          <label className="block text-[10px] font-bold uppercase text-[#60708A] dark:text-[#AEB9C9] mb-1">
                            Set Priority
                          </label>
                          <select
                            value={assignPriority}
                            onChange={(e) => setAssignPriority(e.target.value)}
                            className="w-full text-xs p-2 bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] rounded-[4px]"
                          >
                            <option value="Low">Low</option>
                            <option value="Medium">Medium</option>
                            <option value="High">High</option>
                            <option value="Critical">Critical</option>
                          </select>
                        </div>
                      </div>
                      <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
                        Assign Complaint
                      </Button>
                    </form>
                  )}

                {/* Maintenance Team Update Status / Resolve */}
                {user?.role === 'Maintenance Team' && (
                  <div className="space-y-3">
                    {complaint.status === 'Assigned' && (
                      <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] space-y-2">
                        <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">Work Order Action</p>
                        <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">
                          This complaint is assigned to you. Click below to begin working on it.
                        </p>
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={async () => {
                            setActionLoading(true);
                            setErrorMessage('');
                            try {
                              await api.complaints.updateStatus(complaintId, 'In Progress');
                              if (onRefresh) onRefresh();
                              const updated = await api.complaints.getById(complaintId);
                              setComplaint(updated);
                              setStatusVal(updated.status);
                            } catch (err) {
                              setErrorMessage(err.message || 'Failed to update status.');
                            } finally {
                              setActionLoading(false);
                            }
                          }}
                          isLoading={actionLoading}
                        >
                          <Wrench className="w-4 h-4 mr-1.5" /> Start Work (Mark In Progress)
                        </Button>
                      </div>
                    )}

                    {complaint.status === 'In Progress' && (
                      <form onSubmit={handleResolveComplaint} className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] p-4 rounded-[6px] space-y-3">
                        <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">Mark as Resolved</p>
                        <textarea
                          required
                          minLength={5}
                          rows={2}
                          value={resolutionRemarks}
                          onChange={(e) => setResolutionRemarks(e.target.value)}
                          placeholder="Detail the work completed (minimum 5 characters)..."
                          className="w-full text-xs p-2.5 bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] text-[#10213A] dark:text-[#F8FAFC] rounded-[4px]"
                        />
                        <Button type="submit" variant="primary" size="sm" isLoading={actionLoading}>
                          Submit Resolution
                        </Button>
                      </form>
                    )}
                  </div>
                )}

                {/* Student / Faculty Close & Reopen Buttons */}
                {(user?.role === 'Student' || user?.role === 'Faculty') && (
                  <div className="flex flex-wrap gap-3">
                    {complaint.status === 'Resolved' && (
                      <>
                        <Button variant="primary" size="sm" onClick={handleCloseComplaint} isLoading={actionLoading}>
                          <CheckCircle2 className="w-4 h-4 mr-1.5" /> Close Complaint
                        </Button>
                        <Button variant="secondary" size="sm" onClick={handleReopenComplaint} isLoading={actionLoading}>
                          <RotateCcw className="w-4 h-4 mr-1.5" /> Reopen Complaint
                        </Button>
                      </>
                    )}
                  </div>
                )}
              </div>

              {/* History Timeline */}
              {historyLogs.length > 0 && (
                <div className="pt-2 border-t border-[#DED8CC] dark:border-[#344155] space-y-2">
                  <h4 className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1.5">
                    <History className="w-3.5 h-3.5" /> Complaint History Audit
                  </h4>
                  <div className="space-y-1.5">
                    {historyLogs.map((log) => (
                      <div key={log.id} className="text-xs p-2 bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[4px] flex justify-between items-center">
                        <div>
                          <span className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{log.action}: </span>
                          <span className="text-[#60708A] dark:text-[#AEB9C9]">{log.description || 'Action performed'}</span>
                        </div>
                        <span className="text-[10px] text-[#60708A] dark:text-[#7F8CA1]">
                          {new Date(log.created_at).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>
                </div>
              )}
            </>
          )}
        </div>

      </div>
    </div>
  );
}

export default ComplaintDetailsModal;
