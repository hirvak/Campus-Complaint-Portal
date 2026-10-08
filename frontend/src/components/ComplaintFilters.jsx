import React from 'react';
import { Search, Filter, RotateCcw } from 'lucide-react';

export function ComplaintFilters({
  search = '',
  onSearchChange,
  statusFilter = '',
  onStatusChange,
  priorityFilter = '',
  onPriorityChange,
  departmentFilter = '',
  onDepartmentChange,
  categoryFilter = '',
  onCategoryChange,
  departments = [],
  categories = [],
  onResetFilters,
  showDepartmentFilter = true
}) {
  return (
    <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 space-y-3 text-left shadow-2xs transition-colors duration-150">
      <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
        <span className="text-[11px] font-heading font-extrabold uppercase tracking-widest text-[#60708A] dark:text-[#AEB9C9] flex items-center gap-1.5">
          <Filter className="w-3.5 h-3.5 text-[#B51232] dark:text-[#C51F3D]" /> Search & Filter System Records
        </span>
        <button
          onClick={onResetFilters}
          type="button"
          className="text-xs font-bold text-[#B51232] dark:text-[#C51F3D] hover:underline flex items-center gap-1 cursor-pointer"
        >
          <RotateCcw className="w-3 h-3" /> Clear Filters
        </button>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3">
        {/* Search query */}
        <div className="relative lg:col-span-1">
          <Search className="w-3.5 h-3.5 absolute left-3 top-3 text-[#60708A] dark:text-[#7F8CA1]" />
          <input
            type="text"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search complaints..."
            className="w-full bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] pl-8 pr-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
          />
        </div>

        {/* Status Filter */}
        <select
          value={statusFilter}
          onChange={(e) => onStatusChange(e.target.value)}
          className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
        >
          <option value="">Status (All)</option>
          <option value="New">New</option>
          <option value="Assigned">Assigned</option>
          <option value="In Progress">In Progress</option>
          <option value="Resolved">Resolved</option>
          <option value="Closed">Closed</option>
          <option value="Reopened">Reopened</option>
        </select>

        {/* Priority Filter */}
        <select
          value={priorityFilter}
          onChange={(e) => onPriorityChange(e.target.value)}
          className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
        >
          <option value="">Priority (All)</option>
          <option value="Low">Low</option>
          <option value="Medium">Medium</option>
          <option value="High">High</option>
          <option value="Urgent">Urgent</option>
        </select>

        {/* Department Filter (Optional) */}
        {showDepartmentFilter ? (
          <select
            value={departmentFilter}
            onChange={(e) => onDepartmentChange(e.target.value)}
            className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
          >
            <option value="">Department (All)</option>
            {departments.map((d) => (
              <option key={d.id} value={d.id}>
                {d.name}
              </option>
            ))}
          </select>
        ) : null}

        {/* Category Filter */}
        <select
          value={categoryFilter}
          onChange={(e) => onCategoryChange(e.target.value)}
          className="bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] px-3 py-2 text-xs focus:ring-1 focus:ring-[#B51232] dark:focus:ring-[#C51F3D] focus:outline-none text-[#10213A] dark:text-[#F8FAFC]"
        >
          <option value="">Category (All)</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}

export default ComplaintFilters;
