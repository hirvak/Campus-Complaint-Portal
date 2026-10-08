import React, { useState, useEffect } from 'react';
import { api } from '../services/api';
import { useAuth } from '../context/AuthContext';
import ComplaintFilters from '../components/ComplaintFilters';
import ComplaintTable from '../components/ComplaintTable';
import Button from '../components/Button';
import { RotateCcw, AlertCircle, ChevronLeft, ChevronRight } from 'lucide-react';

export function AllComplaints() {
  const { user } = useAuth();

  const [complaints, setComplaints] = useState([]);
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [total, setTotal] = useState(0);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');

  // Search & Filter state
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [departmentFilter, setDepartmentFilter] = useState('');
  const [page, setPage] = useState(1);

  const rolePrefix = user?.role === 'Facility Officer' ? '/facility-officer' : '/admin';

  const fetchFilters = async () => {
    try {
      const [cats, depts] = await Promise.all([
        api.categories.getAll(),
        api.departments.getAll(),
      ]);
      setCategories(cats);
      setDepartments(depts);

      const cMap = {};
      cats.forEach((c) => (cMap[c.id] = c.name));
      setCategoriesMap(cMap);

      const dMap = {};
      depts.forEach((d) => (dMap[d.id] = d.name));
      setDepartmentsMap(dMap);
    } catch (e) {}
  };

  const fetchComplaints = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const res = await api.complaints.searchComplaints({
        search,
        status_filter: statusFilter,
        priority: priorityFilter,
        category_id: categoryFilter,
        department_id: departmentFilter,
        page,
        page_size: 10,
      });

      setComplaints(res.items || []);
      setTotal(res.total || 0);
      setTotalPages(res.total_pages || 1);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to search complaints.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchFilters();
  }, []);

  useEffect(() => {
    fetchComplaints();
  }, [search, statusFilter, priorityFilter, categoryFilter, departmentFilter, page]);

  const handleResetFilters = () => {
    setSearch('');
    setStatusFilter('');
    setPriorityFilter('');
    setCategoryFilter('');
    setDepartmentFilter('');
    setPage(1);
  };

  const getPageTitle = () => {
    if (user?.role === 'Facility Officer') return 'COMPLAINTS DIRECTORY';
    if (user?.role === 'Administrator') return 'ALL SYSTEM COMPLAINTS';
    return 'COMPLAINTS DIRECTORY';
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-0.5">
              Campus Complaint Portal • {user?.role || 'User'} Access Level
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              {getPageTitle()}
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Browse and manage campus complaints based on your access level.
            </p>
          </div>
          <Button variant="secondary" size="sm" onClick={fetchComplaints}>
            <RotateCcw className="w-3.5 h-3.5 mr-1" />
            Refresh
          </Button>
        </div>

        {/* FEEDBACK ERROR */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-4 py-3 rounded-[8px] text-xs flex items-center justify-between gap-2 text-left">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMsg}</span>
            </div>
            <Button variant="secondary" size="sm" onClick={fetchComplaints}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" /> Retry
            </Button>
          </div>
        )}

        {/* SEARCH & FILTERS TOOLBAR */}
        <ComplaintFilters
          search={search}
          onSearchChange={(val) => { setSearch(val); setPage(1); }}
          statusFilter={statusFilter}
          onStatusChange={(val) => { setStatusFilter(val); setPage(1); }}
          priorityFilter={priorityFilter}
          onPriorityChange={(val) => { setPriorityFilter(val); setPage(1); }}
          departmentFilter={departmentFilter}
          onDepartmentChange={(val) => { setDepartmentFilter(val); setPage(1); }}
          categoryFilter={categoryFilter}
          onCategoryChange={(val) => { setCategoryFilter(val); setPage(1); }}
          departments={departments}
          categories={categories}
          onResetFilters={handleResetFilters}
          showDepartmentFilter={true}
        />

        {/* COMPLAINTS TABLE SURFACE */}
        <div className="space-y-4">
          <ComplaintTable
            complaints={complaints}
            categoriesMap={categoriesMap}
            departmentsMap={departmentsMap}
            totalCount={total}
            loading={loading}
            rolePrefix={rolePrefix}
            userRole={user?.role}
            customTitle={getPageTitle()}
          />

          {/* SERVER PAGINATION CONTROL */}
          {total > 0 && (
            <div className="flex flex-col sm:flex-row items-center justify-between bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-4 text-xs shadow-2xs gap-3">
              <span className="text-[#60708A] dark:text-[#AEB9C9] font-semibold">
                Showing {total === 0 ? 0 : (page - 1) * 10 + 1}–{Math.min(page * 10, total)} of {total} complaints
              </span>
              <div className="flex items-center gap-2">
                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page <= 1 || loading}
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                >
                  <ChevronLeft className="w-3.5 h-3.5 mr-1" />
                  Previous
                </Button>

                {Array.from({ length: totalPages }, (_, i) => i + 1)
                  .filter((pNum) => pNum === 1 || pNum === totalPages || Math.abs(pNum - page) <= 1)
                  .map((pNum, idx, arr) => {
                    const prev = arr[idx - 1];
                    const showEllipsis = prev && pNum - prev > 1;
                    return (
                      <React.Fragment key={pNum}>
                        {showEllipsis && <span className="text-[#60708A] dark:text-[#7F8CA1] px-1">...</span>}
                        <button
                          type="button"
                          onClick={() => setPage(pNum)}
                          className={`px-2.5 py-1 rounded-[4px] font-bold text-xs transition-colors ${
                            page === pNum
                              ? 'bg-[#B51232] dark:bg-[#C51F3D] text-white'
                              : 'bg-[#FAF7F0] dark:bg-[#202B3D] text-[#10213A] dark:text-[#F8FAFC] border border-[#DED8CC] dark:border-[#344155] hover:bg-[#FDF2F4] dark:hover:bg-[#263246]'
                          }`}
                        >
                          {pNum}
                        </button>
                      </React.Fragment>
                    );
                  })}

                <Button
                  variant="secondary"
                  size="sm"
                  disabled={page >= totalPages || loading}
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                >
                  Next
                  <ChevronRight className="w-3.5 h-3.5 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </div>

      </div>
    </div>
  );
}

export default AllComplaints;
