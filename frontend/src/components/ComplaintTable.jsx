import React from 'react';
import { useNavigate } from 'react-router-dom';
import ComplaintStatusBadge from './ComplaintStatusBadge';
import ComplaintPriorityBadge from './ComplaintPriorityBadge';
import { ArrowUpRight, CheckCircle2, UserCheck } from 'lucide-react';
import Button from './Button';

export function ComplaintTable({
  complaints = [],
  categoriesMap = {},
  departmentsMap = {},
  totalCount = 0,
  loading = false,
  rolePrefix = '',
  userRole = '',
  onAssignClick = null,
  customTitle = 'COMPLAINTS DIRECTORY'
}) {
  const navigate = useNavigate();

  return (
    <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 space-y-4 text-left shadow-2xs transition-colors duration-150">
      {/* Header bar */}
      <div className="flex items-center justify-between pb-3 border-b border-[#DED8CC] dark:border-[#344155]">
        <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC]">
          {customTitle} ({totalCount} {totalCount === 1 ? 'RECORD' : 'RECORDS'})
        </h2>
      </div>

      {loading ? (
        /* Skeleton loading lines */
        <div className="py-8 space-y-3">
          {[1, 2, 3, 4, 5].map((i) => (
            <div key={i} className="h-10 bg-[#FAF7F0] dark:bg-[#202B3D] rounded-[4px] animate-pulse w-full border border-[#DED8CC]/50 dark:border-[#344155]" />
          ))}
        </div>
      ) : complaints.length === 0 ? (
        /* Empty state */
        <div className="py-12 text-center space-y-2 border-b border-[#DED8CC] dark:border-[#344155]">
          <CheckCircle2 className="w-6 h-6 text-[#B51232] dark:text-[#C51F3D] mx-auto opacity-70" />
          <p className="text-xs font-heading font-bold uppercase text-[#10213A] dark:text-[#F8FAFC]">NO COMPLAINTS FOUND</p>
          <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">Try adjusting your search or filter criteria.</p>
        </div>
      ) : (
        <>
          {/* Desktop Table View (md+) */}
          <div className="hidden md:block overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                  <th className="py-3 px-3">ID</th>
                  <th className="py-3 px-3">COMPLAINT</th>
                  <th className="py-3 px-3">CATEGORY</th>
                  <th className="py-3 px-3">LOCATION</th>
                  <th className="py-3 px-3">PRIORITY</th>
                  <th className="py-3 px-3">STATUS</th>
                  <th className="py-3 px-3">CREATED</th>
                  <th className="py-3 px-3 text-right">ACTION</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                {complaints.map((c) => (
                  <tr
                    key={c.id}
                    className="hover:bg-[#FDF2F4]/50 dark:hover:bg-[#202B3D] transition-colors cursor-pointer group"
                    onClick={() => navigate(`${rolePrefix}/complaints/${c.id}`)}
                  >
                    <td className="py-3.5 px-3 font-mono font-bold text-[#60708A] dark:text-[#AEB9C9]">#{c.id}</td>
                    <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC] group-hover:text-[#B51232] dark:group-hover:text-[#C51F3D]">
                      {c.title}
                    </td>
                    <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                      {categoriesMap[c.category_id] || `Cat #${c.category_id}`}
                    </td>
                    <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">{c.location}</td>
                    <td className="py-3.5 px-3">
                      <ComplaintPriorityBadge priority={c.priority} />
                    </td>
                    <td className="py-3.5 px-3">
                      <ComplaintStatusBadge status={c.status} />
                    </td>
                    <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                      {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                    </td>
                    <td className="py-3.5 px-3 text-right space-x-2">
                      {userRole === 'Facility Officer' && onAssignClick && (c.status === 'New' || c.status === 'Reopened') ? (
                        <Button
                          variant="primary"
                          size="sm"
                          onClick={(e) => {
                            e.stopPropagation();
                            onAssignClick(c);
                          }}
                        >
                          <UserCheck className="w-3.5 h-3.5 mr-1" /> Assign
                        </Button>
                      ) : (
                        <span className="text-[11px] font-heading font-extrabold text-[#B51232] dark:text-[#C51F3D] group-hover:underline inline-flex items-center gap-0.5">
                          <span>View</span>
                          <ArrowUpRight className="w-3 h-3" />
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile Card Row View (<md) */}
          <div className="md:hidden divide-y divide-[#DED8CC] dark:divide-[#344155]">
            {complaints.map((c) => (
              <div
                key={c.id}
                className="py-4 space-y-2 cursor-pointer hover:bg-[#FDF2F4]/50 dark:hover:bg-[#202B3D] p-2 rounded-[6px] transition-colors text-left"
                onClick={() => navigate(`${rolePrefix}/complaints/${c.id}`)}
              >
                <div className="flex items-center justify-between">
                  <span className="font-mono text-xs font-bold text-[#60708A] dark:text-[#AEB9C9]">#{c.id}</span>
                  <ComplaintStatusBadge status={c.status} />
                </div>
                <h3 className="font-bold text-sm text-[#10213A] dark:text-[#F8FAFC] hover:text-[#B51232] dark:hover:text-[#C51F3D]">{c.title}</h3>
                <p className="text-xs text-[#60708A] dark:text-[#AEB9C9]">{c.location} • {categoriesMap[c.category_id] || `Cat #${c.category_id}`}</p>
                <div className="flex items-center justify-between pt-1 text-xs">
                  <span className="text-[#60708A] dark:text-[#AEB9C9]">
                    {c.created_at ? new Date(c.created_at).toLocaleDateString() : '—'}
                  </span>
                  <span className="font-bold text-[#B51232] dark:text-[#C51F3D] flex items-center gap-0.5">
                    <span>View</span>
                    <ArrowUpRight className="w-3 h-3" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        </>
      )}
    </div>
  );
}

export default ComplaintTable;
