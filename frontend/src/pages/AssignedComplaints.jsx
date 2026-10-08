import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import ComplaintFilters from '../components/ComplaintFilters';
import ComplaintTable from '../components/ComplaintTable';
import Button from '../components/Button';
import { AlertCircle, RotateCcw, CheckCircle2 } from 'lucide-react';

export function AssignedComplaints() {
  const [assignedComplaints, setAssignedComplaints] = useState([]);
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

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const list = await api.complaints.getAssignedComplaints();
      setAssignedComplaints(list);

      try {
        const [cats, depts] = await Promise.all([
          api.categories.getAll(),
          api.departments.getAll(),
        ]);
        setCategoriesList(cats);
        setDepartmentsList(depts);

        const cMap = {};
        cats.forEach((c) => (cMap[c.id] = c.name));
        setCategoriesMap(cMap);

        const dMap = {};
        depts.forEach((d) => (dMap[d.id] = d.name));
        setDepartmentsMap(dMap);
      } catch (e) {}
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load assigned complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDepartmentFilter('');
  };

  const filteredComplaints = assignedComplaints.filter((c) => {
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
              Maintenance Team Portal • Assigned Work Orders
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              ASSIGNED COMPLAINTS
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Work orders assigned to your maintenance team for repair and resolution.
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

        {/* COMPLAINTS TABLE SURFACE */}
        <ComplaintTable
          complaints={filteredComplaints}
          categoriesMap={categoriesMap}
          departmentsMap={departmentsMap}
          totalCount={filteredComplaints.length}
          loading={loading}
          rolePrefix="/maintenance"
          userRole="Maintenance Team"
          customTitle="ASSIGNED WORK ORDERS"
        />

      </div>
    </div>
  );
}

export default AssignedComplaints;
