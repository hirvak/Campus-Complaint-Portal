import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintFilters from '../components/ComplaintFilters';
import ComplaintTable from '../components/ComplaintTable';
import Button from '../components/Button';
import { Plus, AlertCircle, RotateCcw } from 'lucide-react';
import { Link } from 'react-router-dom';

export function MyComplaints() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [categoriesList, setCategoriesList] = useState([]);
  const [departmentsList, setDepartmentsList] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState('');

  // Search & Filter State
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);

  const fetchFilters = async () => {
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
  };

  const loadComplaints = async () => {
    setLoading(true);
    setErrorMessage('');
    try {
      const res = await api.complaints.searchComplaints({
        search: searchQuery,
        status_filter: statusFilter,
        priority: priorityFilter,
        category_id: categoryFilter,
        department_id: departmentFilter,
        page,
        page_size: 20,
      });

      setComplaints(res.items || []);
      setTotalCount(res.total || 0);
    } catch (err) {
      // Fallback to getMyComplaints if search fails
      try {
        const fallback = await api.complaints.getMyComplaints();
        setComplaints(fallback);
        setTotalCount(fallback.length);
      } catch (e) {
        setErrorMessage(err.message || 'Failed to fetch complaints.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    loadComplaints();
  }, [user, searchQuery, statusFilter, priorityFilter, categoryFilter, departmentFilter, page]);

  const handleResetFilters = () => {
    setSearchQuery('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDepartmentFilter('');
    setPage(1);
  };

  const rolePrefix = user?.role === 'Student' ? '/student' : (user?.role === 'Faculty' ? '/faculty' : '');

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* PAGE HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-0.5">
              Campus Complaint Portal • Personal Submissions
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              MY COMPLAINTS
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Track and manage the complaints you have submitted.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <Link to={`${rolePrefix}/complaints/new`}>
              <Button variant="primary" size="sm">
                <Plus className="w-4 h-4 mr-1" />
                Report Complaint
              </Button>
            </Link>
            <Button variant="secondary" size="sm" onClick={loadComplaints}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* SEARCH + FILTER TOOLBAR SURFACE */}
        <ComplaintFilters
          search={searchQuery}
          onSearchChange={(val) => { setSearchQuery(val); setPage(1); }}
          statusFilter={statusFilter}
          onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
          priorityFilter={priorityFilter}
          onPriorityChange={(val) => { setPriorityFilter(val); setPage(1); }}
          departmentFilter={departmentFilter}
          onDepartmentChange={(val) => { setDepartmentFilter(val); setPage(1); }}
          categoryFilter={categoryFilter}
          onCategoryChange={(val) => { setCategoryFilter(val); setPage(1); }}
          departments={departmentsList}
          categories={categoriesList}
          onResetFilters={handleResetFilters}
          showDepartmentFilter={true}
        />

        {/* ERROR STATE */}
        {errorMessage && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] p-4 rounded-[6px] text-xs flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMessage}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={loadComplaints}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* COMPLAINT DIRECTORY TABLE SURFACE */}
        <ComplaintTable
          complaints={complaints}
          categoriesMap={categoriesMap}
          departmentsMap={departmentsMap}
          totalCount={totalCount}
          loading={loading}
          rolePrefix={rolePrefix}
          userRole={user?.role}
          customTitle="MY SUBMITTED COMPLAINTS"
        />

      </div>
    </div>
  );
}

export default MyComplaints;
