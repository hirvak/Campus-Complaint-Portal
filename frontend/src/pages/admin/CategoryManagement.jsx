import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import {
  Tag,
  Plus,
  Edit2,
  Trash2,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw
} from 'lucide-react';

export function CategoryManagement() {
  const [categories, setCategories] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [departmentsMap, setDepartmentsMap] = useState({});
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingCat, setEditingCat] = useState(null);
  const [catName, setCatName] = useState('');
  const [catDesc, setCatDesc] = useState('');
  const [departmentId, setDepartmentId] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [cats, depts] = await Promise.all([
        api.categories.getAll(),
        api.departments.getAll(),
      ]);
      setCategories(cats);
      setDepartments(depts);

      const dMap = {};
      depts.forEach((d) => (dMap[d.id] = d.name));
      setDepartmentsMap(dMap);

      if (depts.length > 0 && !departmentId) {
        setDepartmentId(depts[0].id);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch categories data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingCat(null);
    setCatName('');
    setCatDesc('');
    setDepartmentId(departments.length > 0 ? departments[0].id : '');
    setModalOpen(true);
  };

  const openEditModal = (cat) => {
    setEditingCat(cat);
    setCatName(cat.name);
    setCatDesc(cat.description || '');
    setDepartmentId(cat.department_id);
    setModalOpen(true);
  };

  const handleDelete = async (cat) => {
    if (!window.confirm(`Are you sure you want to delete category "${cat.name}"?`)) return;

    setErrorMsg('');
    try {
      await api.categories.delete(cat.id);
      setSuccessMsg(`Category "${cat.name}" deleted successfully.`);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to delete category.');
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!departmentId) {
      setErrorMsg('Please select a valid department.');
      return;
    }

    setSubmitting(true);
    setErrorMsg('');

    try {
      if (editingCat) {
        await api.categories.update(editingCat.id, {
          name: catName,
          description: catDesc || null,
          department_id: Number(departmentId),
          is_active: editingCat.is_active,
        });
        setSuccessMsg(`Category "${catName}" updated successfully.`);
      } else {
        await api.categories.create({
          name: catName,
          description: catDesc || null,
          department_id: Number(departmentId),
        });
        setSuccessMsg(`Category "${catName}" created successfully.`);
      }

      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Operation failed.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-0.5">
              System Administration
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              CATEGORY MANAGEMENT
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Organize campus issue types and map categories to responsible handling departments
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={openCreateModal}>
              <Plus className="w-4 h-4 mr-1" />
              Add Category
            </Button>
            <Button variant="secondary" size="sm" onClick={fetchData}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* FEEDBACK MESSAGES */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-4 py-3 rounded-[6px] text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#E8F5EC] dark:bg-[#202B3D] border border-[#A7F3D0] dark:border-[#22A06B]/40 text-[#008A4A] dark:text-[#22A06B] px-4 py-3 rounded-[6px] text-xs flex items-center gap-2 font-bold text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008A4A] dark:text-[#22A06B]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* MAIN CATEGORIES SURFACE CARD */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
            <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC]">
              COMPLAINT CATEGORIES ({categories.length})
            </h2>
          </div>

          {loading ? (
            <div className="py-12 text-center text-xs text-[#60708A] dark:text-[#AEB9C9] font-semibold flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#B51232] dark:text-[#C51F3D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading categories...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">CATEGORY NAME</th>
                    <th className="py-3 px-3">MAPPED DEPARTMENT</th>
                    <th className="py-3 px-3">DESCRIPTION</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                  {categories.map((c) => (
                    <tr key={c.id} className="hover:bg-[#FDF2F4]/50 dark:hover:bg-[#202B3D] transition-colors">
                      <td className="py-3.5 px-3 font-mono font-bold text-[#60708A] dark:text-[#7F8CA1]">#{c.id}</td>
                      <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC]">{c.name}</td>
                      <td className="py-3.5 px-3">
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] text-[11px] font-semibold text-[#10213A] dark:text-[#F8FAFC]">
                          {departmentsMap[c.department_id] || `Dept #${c.department_id}`}
                        </span>
                      </td>
                      <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                        {c.description || '—'}
                      </td>
                      <td className="py-3.5 px-3 text-right space-x-2">
                        <Button variant="secondary" size="sm" onClick={() => openEditModal(c)}>
                          <Edit2 className="w-3.5 h-3.5 mr-1" />
                          Edit
                        </Button>
                        <Button variant="secondary" size="sm" onClick={() => handleDelete(c)}>
                          <Trash2 className="w-3.5 h-3.5 text-red-600 dark:text-red-400" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      </div>

      {/* CREATE / EDIT MODAL */}
      {modalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213A]/40 dark:bg-black/60 backdrop-blur-xs p-4 text-left">
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#10213A] dark:text-[#F8FAFC] font-heading flex items-center gap-2">
                <Tag className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                {editingCat ? `EDIT CATEGORY #${editingCat.id}` : 'ADD NEW CATEGORY'}
              </h3>
              <button
                onClick={() => setModalOpen(false)}
                className="text-[#60708A] dark:text-[#7F8CA1] hover:text-[#10213A] dark:hover:text-[#F8FAFC] p-1 rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  CATEGORY NAME *
                </label>
                <input
                  type="text"
                  required
                  value={catName}
                  onChange={(e) => setCatName(e.target.value)}
                  placeholder="e.g. Wi-Fi & Network Connectivity"
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  MAPPED DEPARTMENT *
                </label>
                <select
                  value={departmentId}
                  onChange={(e) => setDepartmentId(e.target.value)}
                  required
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                >
                  {departments.map((d) => (
                    <option key={d.id} value={d.id}>
                      {d.name}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  DESCRIPTION (OPTIONAL)
                </label>
                <textarea
                  rows={3}
                  value={catDesc}
                  onChange={(e) => setCatDesc(e.target.value)}
                  placeholder="Details on what issues fall into this category..."
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] p-2.5 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED8CC] dark:border-[#344155]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Saving...' : editingCat ? 'Update Category' : 'Create Category'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

    </div>
  );
}

export default CategoryManagement;
