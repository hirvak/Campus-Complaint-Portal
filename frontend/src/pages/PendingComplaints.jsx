import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ComplaintFilters from '../components/ComplaintFilters';
import ComplaintTable from '../components/ComplaintTable';
import Button from '../components/Button';
import {
  AlertCircle,
  RotateCcw,
  CheckCircle2,
  X,
  UserCheck
} from 'lucide-react';

export function PendingComplaints() {
  const [pendingComplaints, setPendingComplaints] = useState([]);
  const [maintenanceUsers, setMaintenanceUsers] = useState([]);
  const [categoriesList, setCategoriesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Search & Filter State
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');

  // Assign Modal State
  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [selectedComplaint, setSelectedComplaint] = useState(null);
  const [assignedToId, setAssignedToId] = useState('');
  const [priorityVal, setPriorityVal] = useState('Medium');
  const [submittingAssign, setSubmittingAssign] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      // 1. Fetch pending complaints
      const list = await api.complaints.getPendingComplaints();
      setPendingComplaints(list);

      // 2. Fetch categories & departments
      try {
        const [cats, depts] = await Promise.all([
          api.categories.getAll(),
          api.departments.getAll(),
        ]);
        setCategoriesList(cats);
        setDepartmentsList(depts);

        const catMap = {};
        cats.forEach((c) => (catMap[c.id] = c.name));
        setCategoriesMap(catMap);

        const deptMap = {};
        depts.forEach((d) => (deptMap[d.id] = d.name));
        setDepartmentsMap(deptMap);
      } catch (e) {}

      // 3. Fetch all active Maintenance Team users
      try {
        const usersList = await api.users.getAll();
        const maintList = usersList.filter((u) => u.role === 'Maintenance Team' && u.is_active);
        setMaintenanceUsers(maintList);
      } catch (e) {}
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load pending complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openAssignModal = (complaint) => {
    setSelectedComplaint(complaint);
    setPriorityVal(complaint.priority || 'Medium');
    setAssignedToId(maintenanceUsers.length > 0 ? String(maintenanceUsers[0].id) : '');
    setAssignModalOpen(true);
  };

  const handleAssignSubmit = async (e) => {
    e.preventDefault();
    if (!assignedToId) {
      setErrorMsg('Please select a Maintenance Team member.');
      return;
    }

    setSubmittingAssign(true);
    setErrorMsg('');
    try {
      await api.complaints.assign(selectedComplaint.id, {
        assigned_to: Number(assignedToId),
        priority: priorityVal,
      });

      setSuccessMsg(`Complaint #${selectedComplaint.id} assigned successfully!`);
      setAssignModalOpen(false);
      setSelectedComplaint(null);
      fetchData();

      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to assign complaint.');
    } finally {
      setSubmittingAssign(false);
    }
  };

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDepartmentFilter('');
  };

  // Filter pending complaints on frontend if parameters selected
  const filteredPending = pendingComplaints.filter((c) => {
    const matchesSearch = search ? (c.title.toLowerCase().includes(search.toLowerCase()) || c.location.toLowerCase().includes(search.toLowerCase())) : true;
    const matchesStatus = statusFilter ? c.status === statusFilter : true;
    const matchesPriority = priorityFilter ? c.priority === priorityFilter : true;
    const matchesCategory = categoryFilter ? String(c.category_id) === String(categoryFilter) : true;
    const matchesDept = departmentFilter ? String(c.department_id) === String(departmentFilter) : true;
    return matchesSearch && matchesStatus && matchesPriority && matchesCategory && matchesDept;
  });

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-0.5">
              Facility Officer Portal • Assignment Queue
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              PENDING COMPLAINTS
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Complaints requiring assignment to specialized Maintenance Officers.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchData}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-4 py-3 rounded-[6px] text-xs flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMsg}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#E8F5EC] dark:bg-[#202B3D] border border-[#A7F3D0] dark:border-[#22A06B]/40 text-[#008A4A] dark:text-[#22A06B] px-4 py-3 rounded-[6px] text-xs flex items-center gap-2 font-bold text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008A4A] dark:text-[#22A06B]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* SEARCH & FILTERS TOOLBAR */}
        <ComplaintFilters
          search={search}
          onSearchChange={setSearch}
          statusFilter={statusFilter}
          onStatusChange={setStatusFilter}
          priorityFilter={priorityFilter}
          onPriorityChange={setPriorityFilter}
          departmentFilter={departmentFilter}
          onDepartmentChange={setDepartmentFilter}
          categoryFilter={categoryFilter}
          onCategoryChange={setCategoryFilter}
          departments={departmentsList}
          categories={categoriesList}
          onResetFilters={handleResetFilters}
          showDepartmentFilter={true}
        />

        {/* TABLE SURFACE */}
        <ComplaintTable
          complaints={filteredPending}
          categoriesMap={categoriesMap}
          departmentsMap={departmentsMap}
          totalCount={filteredPending.length}
          loading={loading}
          rolePrefix="/facility-officer"
          userRole="Facility Officer"
          onAssignClick={openAssignModal}
          customTitle="UNASSIGNED & REOPENED COMPLAINTS"
        />

      </div>

      {/* ASSIGNMENT MODAL */}
      {assignModalOpen && selectedComplaint && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213A]/40 dark:bg-black/60 backdrop-blur-xs p-4 text-left">
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[8px] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#10213A] dark:text-[#F8FAFC] font-heading flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                ASSIGN COMPLAINT #{selectedComplaint.id}
              </h3>
              <button
                onClick={() => setAssignModalOpen(false)}
                className="text-[#60708A] dark:text-[#7F8CA1] hover:text-[#10213A] dark:hover:text-[#F8FAFC] p-1 rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <div className="space-y-2 bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px] text-xs">
              <p className="font-bold text-[#10213A] dark:text-[#F8FAFC]">{selectedComplaint.title}</p>
              <p className="text-[#60708A] dark:text-[#AEB9C9] line-clamp-2">{selectedComplaint.description}</p>
              <p className="text-[11px] text-[#60708A] dark:text-[#7F8CA1]">Location: {selectedComplaint.location}</p>
            </div>

            <form onSubmit={handleAssignSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  MAINTENANCE TEAM MEMBER *
                </label>
                {maintenanceUsers.length === 0 ? (
                  <p className="text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-900/20 p-2 rounded-[4px]">
                    No active Maintenance Team members found. Create user accounts under User Management first.
                  </p>
                ) : (
                  <select
                    value={assignedToId}
                    onChange={(e) => setAssignedToId(e.target.value)}
                    required
                    className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
                  >
                    {maintenanceUsers.map((u) => (
                      <option key={u.id} value={u.id}>
                        {u.full_name} ({u.department} • {u.email})
                      </option>
                    ))}
                  </select>
                )}
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  SET PRIORITY LEVEL *
                </label>
                <select
                  value={priorityVal}
                  onChange={(e) => setPriorityVal(e.target.value)}
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
                >
                  <option value="Low">Low</option>
                  <option value="Medium">Medium</option>
                  <option value="High">High</option>
                  <option value="Critical">Critical</option>
                </select>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED8CC] dark:border-[#344155]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setAssignModalOpen(false)}>
                  Cancel
                </Button>
                <Button
                  variant="primary"
                  size="sm"
                  type="submit"
                  disabled={submittingAssign || maintenanceUsers.length === 0}
                >
                  {submittingAssign ? 'Assigning...' : 'Confirm Assignment'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default PendingComplaints;
