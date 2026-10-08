import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  X,
  RotateCcw,
  Check,
  Ban,
  Search,
  Filter
} from 'lucide-react';

export function UserManagement() {
  const [users, setUsers] = useState([]);
  const [departments, setDepartments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Filters
  const [search, setSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');

  // Create User Modal State
  const [createModalOpen, setCreateModalOpen] = useState(false);
  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [role, setRole] = useState('Facility Officer');
  const [department, setDepartment] = useState('');
  const [phone, setPhone] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const fetchUsersAndDepts = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [uList, dList] = await Promise.all([
        api.users.getAll(),
        api.departments.getAll(),
      ]);
      setUsers(uList);
      setDepartments(dList);
      if (dList.length > 0 && !department) {
        setDepartment(dList[0].name);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load user management data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsersAndDepts();
  }, []);

  const handleToggleStatus = async (userObj) => {
    const newStatus = !userObj.is_active;
    setErrorMsg('');
    try {
      await api.users.updateStatus(userObj.id, newStatus);
      setSuccessMsg(
        `User "${userObj.full_name}" is now ${newStatus ? 'ACTIVATED' : 'DEACTIVATED'}.`
      );
      fetchUsersAndDepts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to change user status.');
    }
  };

  const handleCreateUserSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setErrorMsg('');
    try {
      await api.users.createByAdmin({
        full_name: fullName,
        email,
        password,
        role,
        department: department || 'General Administration',
        phone: phone || null,
      });

      setSuccessMsg(`Account for "${fullName}" (${role}) created successfully!`);
      setCreateModalOpen(false);
      setFullName('');
      setEmail('');
      setPassword('');
      setRole('Facility Officer');
      setPhone('');
      fetchUsersAndDepts();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to create user account.');
    } finally {
      setSubmitting(false);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.full_name.toLowerCase().includes(search.toLowerCase()) ||
      u.email.toLowerCase().includes(search.toLowerCase());
    const matchesRole = roleFilter ? u.role === roleFilter : true;
    return matchesSearch && matchesRole;
  });

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-6 text-left">
        
        {/* HEADER SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
          <div>
            <p className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D] mb-0.5">
              System Administration
            </p>
            <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
              USER MANAGEMENT
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Manage accounts, roles, access permissions, and create administrative staff accounts.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="primary" size="sm" onClick={() => setCreateModalOpen(true)}>
              <UserPlus className="w-4 h-4 mr-1" />
              Create Staff Account
            </Button>
            <Button variant="secondary" size="sm" onClick={fetchUsersAndDepts}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Refresh
            </Button>
          </div>
        </div>

        {/* MESSAGES */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-4 py-3 rounded-[8px] text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#E8F5EC] dark:bg-[#202B3D] border border-[#A7F3D0] dark:border-[#22A06B]/40 text-[#008A4A] dark:text-[#22A06B] px-4 py-3 rounded-[8px] text-xs flex items-center gap-2 font-bold text-left">
            <CheckCircle2 className="w-4 h-4 shrink-0 text-[#008A4A] dark:text-[#22A06B]" />
            <span>{successMsg}</span>
          </div>
        )}

        {/* FILTERS TOOLBAR SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 text-left shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <span className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC]">
            REGISTERED USERS ({filteredUsers.length})
          </span>

          <div className="flex items-center gap-3">
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3 top-2.5 text-[#60708A] dark:text-[#7F8CA1]" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search name, email..."
                className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] pl-8 pr-3 py-1.5 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
              />
            </div>

            <select
              value={roleFilter}
              onChange={(e) => setRoleFilter(e.target.value)}
              className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-1.5 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
            >
              <option value="">All Roles</option>
              <option value="Student">Student</option>
              <option value="Faculty">Faculty</option>
              <option value="Facility Officer">Facility Officer</option>
              <option value="Maintenance Team">Maintenance Team</option>
              <option value="Administrator">Administrator</option>
            </select>
          </div>
        </div>

        {/* MAIN DATA TABLE SURFACE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left shadow-2xs space-y-4">
          {loading ? (
            <div className="py-12 text-center text-xs text-[#60708A] dark:text-[#AEB9C9] font-semibold flex items-center justify-center gap-2">
              <svg className="animate-spin h-4 w-4 text-[#B51232] dark:text-[#C51F3D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Loading user accounts...</span>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                    <th className="py-3 px-3">ID</th>
                    <th className="py-3 px-3">FULL NAME & EMAIL</th>
                    <th className="py-3 px-3">ROLE</th>
                    <th className="py-3 px-3">DEPARTMENT</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                  {filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-[#FAF7F0] dark:hover:bg-[#202B3D] transition-colors">
                      <td className="py-3 px-3 font-mono font-bold text-[#60708A] dark:text-[#7F8CA1]">#{u.id}</td>
                      <td className="py-3 px-3">
                        <span className="font-bold text-[#10213A] dark:text-[#F8FAFC] block">{u.full_name}</span>
                        <span className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">{u.email}</span>
                      </td>
                      <td className="py-3 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC]">
                        <span className="px-2 py-0.5 rounded-[4px] bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] text-[11px]">
                          {u.role}
                        </span>
                      </td>
                      <td className="py-3 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                        {u.department}
                        {u.student_type ? ` (${u.student_type})` : ''}
                      </td>
                      <td className="py-3 px-3">
                        {u.is_active ? (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-[#E8F5EC] dark:bg-[#202B3D] text-[#008A4A] dark:text-[#22A06B] border border-[#A7F3D0] dark:border-[#22A06B]/40">
                            <Check className="w-3 h-3" /> Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-[4px] text-[10px] font-bold uppercase bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400 border border-red-200 dark:border-red-900/40">
                            <Ban className="w-3 h-3" /> Inactive
                          </span>
                        )}
                      </td>
                      <td className="py-3 px-3 text-right">
                        {u.role !== 'Administrator' && (
                          <Button
                            variant={u.is_active ? 'secondary' : 'primary'}
                            size="sm"
                            onClick={() => handleToggleStatus(u)}
                          >
                            {u.is_active ? 'Deactivate' : 'Activate'}
                          </Button>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

      {/* CREATE STAFF MODAL */}
      {createModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-[#10213A]/40 dark:bg-black/60 backdrop-blur-xs p-4 text-left">
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[8px] max-w-lg w-full p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
              <h3 className="text-sm font-extrabold uppercase tracking-wide text-[#10213A] dark:text-[#F8FAFC] font-heading flex items-center gap-2">
                <UserPlus className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                CREATE STAFF ACCOUNT
              </h3>
              <button
                onClick={() => setCreateModalOpen(false)}
                className="text-[#60708A] dark:text-[#7F8CA1] hover:text-[#10213A] dark:hover:text-[#F8FAFC] p-1 rounded-[4px]"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleCreateUserSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  FULL NAME *
                </label>
                <input
                  type="text"
                  required
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  placeholder="Officer Name"
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  EMAIL ADDRESS *
                </label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="officer@campus.edu"
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  PASSWORD *
                </label>
                <input
                  type="password"
                  required
                  minLength={8}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="Minimum 8 characters"
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                    ROLE *
                  </label>
                  <select
                    value={role}
                    onChange={(e) => setRole(e.target.value)}
                    className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                  >
                    <option value="Facility Officer">Facility Officer</option>
                    <option value="Maintenance Team">Maintenance Team</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                    DEPARTMENT *
                  </label>
                  <select
                    value={department}
                    onChange={(e) => setDepartment(e.target.value)}
                    className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                  >
                    {departments.map((d) => (
                      <option key={d.id} value={d.name}>
                        {d.name}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-xs font-heading font-extrabold uppercase tracking-wider text-[#10213A] dark:text-[#F8FAFC] mb-1">
                  PHONE NUMBER (OPTIONAL)
                </label>
                <input
                  type="text"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  placeholder="+1 (555) 000-0000"
                  className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] text-[#10213A] dark:text-[#F8FAFC]"
                />
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED8CC] dark:border-[#344155]">
                <Button variant="secondary" size="sm" type="button" onClick={() => setCreateModalOpen(false)}>
                  Cancel
                </Button>
                <Button variant="primary" size="sm" type="submit" disabled={submitting}>
                  {submitting ? 'Creating Account...' : 'Create Account'}
                </Button>
              </div>
            </form>
          </div>
        </div>
      )}

      </div>
    </div>
  );
}

export default UserManagement;
