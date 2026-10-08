import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import {
  PieChart,
  TrendingUp,
  AlertCircle,
  RotateCcw,
  Building,
  Tag,
  Download
} from 'lucide-react';

export function ReportsAnalytics() {
  const [reportData, setReportData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [errorMsg, setErrorMsg] = useState('');
  const [exportingCsv, setExportingCsv] = useState(false);
  const [exportingPdf, setExportingPdf] = useState(false);

  const fetchReports = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const data = await api.reports.getComplete();
      setReportData(data);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to fetch administrative report data.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchReports();
  }, []);

  const handleExport = async (format) => {
    if (format === 'csv') setExportingCsv(true);
    if (format === 'pdf') setExportingPdf(true);
    setErrorMsg('');
    try {
      const { blob, filename } = await api.reports.export(format);
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = filename;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      setErrorMsg(err.message || `Failed to export ${format.toUpperCase()} report.`);
    } finally {
      setExportingCsv(false);
      setExportingPdf(false);
    }
  };

  const getPercentage = (count, total) => {
    if (!total || total === 0) return '0%';
    return `${Math.round((count / total) * 100)}%`;
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
              REPORTS & ANALYTICS
            </h1>
            <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-0.5">
              Comprehensive system health metrics, workload distribution, and resolution statistics
            </p>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Button
              variant="secondary"
              size="sm"
              disabled={exportingCsv || exportingPdf}
              onClick={() => handleExport('csv')}
              isLoading={exportingCsv}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              {exportingCsv ? 'Downloading CSV...' : 'Download CSV'}
            </Button>
            <Button
              variant="primary"
              size="sm"
              disabled={exportingCsv || exportingPdf}
              onClick={() => handleExport('pdf')}
              isLoading={exportingPdf}
            >
              <Download className="w-3.5 h-3.5 mr-1" />
              {exportingPdf ? 'Downloading PDF...' : 'Download PDF'}
            </Button>
            <Button variant="secondary" size="sm" onClick={fetchReports}>
              <RotateCcw className="w-3.5 h-3.5 mr-1" />
              Refresh Analytics
            </Button>
          </div>
        </div>

        {/* MESSAGES */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#202B3D] border border-[#F8D7DA] dark:border-[#D6455D]/40 text-[#94102A] dark:text-[#D6455D] px-4 py-3 rounded-[6px] text-xs flex items-center gap-2 text-left">
            <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* MAIN ANALYTICS DASHBOARD */}
        <div className="space-y-6 text-left">
          
          {loading ? (
            <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-12 text-center text-xs text-[#60708A] dark:text-[#AEB9C9] font-semibold flex items-center justify-center gap-2 shadow-2xs">
              <svg className="animate-spin h-4 w-4 text-[#B51232] dark:text-[#C51F3D]" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
              <span>Generating analytical breakdown...</span>
            </div>
          ) : reportData ? (
            <>
              {/* METRICS SUMMARY STRIP SURFACE */}
              <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs">
                <div className="grid grid-cols-2 md:grid-cols-4 divide-x divide-[#DED8CC] dark:divide-[#344155]">
                  <div className="px-4 first:pl-0 space-y-1">
                    <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                      TOTAL ISSUES
                    </p>
                    <p className="text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
                      {reportData.summary?.total_complaints || 0}
                    </p>
                  </div>

                  <div className="px-4 space-y-1">
                    <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#B66A00] dark:text-[#D18A16]">
                      ACTIVE / IN PROGRESS
                    </p>
                    <p className="text-3xl font-extrabold font-heading text-[#B66A00] dark:text-[#D18A16]">
                      {(reportData.summary?.assigned_complaints || 0) + (reportData.summary?.in_progress_complaints || 0)}
                    </p>
                  </div>

                  <div className="px-4 space-y-1">
                    <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#008A4A] dark:text-[#22A06B]">
                      RESOLVED & CLOSED
                    </p>
                    <p className="text-3xl font-extrabold font-heading text-[#008A4A] dark:text-[#22A06B]">
                      {(reportData.summary?.resolved_complaints || 0) + (reportData.summary?.closed_complaints || 0)}
                    </p>
                  </div>

                  <div className="px-4 space-y-1">
                    <p className="text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#B51232] dark:text-[#C51F3D]">
                      REOPENED
                    </p>
                    <p className="text-3xl font-extrabold font-heading text-[#B51232] dark:text-[#C51F3D]">
                      {reportData.summary?.reopened_complaints || 0}
                    </p>
                  </div>
                </div>
              </div>

              {/* STATUS & PRIORITY DISTRIBUTION SURFACES */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                
                {/* Status Breakdown Surface */}
                <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
                    <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
                      <PieChart className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                      STATUS DISTRIBUTION
                    </h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    {reportData.status_report?.map((st) => {
                      const pct = getPercentage(st.count, reportData.summary?.total_complaints);
                      return (
                        <div key={st.status} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">
                            <span>{st.status}</span>
                            <span className="text-[#60708A] dark:text-[#AEB9C9]">{st.count} ({pct})</span>
                          </div>
                          <div className="w-full bg-[#FAF7F0] dark:bg-[#202B3D] rounded-full h-2 overflow-hidden border border-[#DED8CC] dark:border-[#344155]">
                            <div
                              className="bg-[#B51232] dark:bg-[#C51F3D] h-2 rounded-full transition-all duration-500"
                              style={{ width: pct }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Priority Breakdown Surface */}
                <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
                  <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
                    <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
                      <TrendingUp className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                      PRIORITY BREAKDOWN
                    </h3>
                  </div>

                  <div className="space-y-3 pt-1">
                    {reportData.priority_report?.map((pr) => {
                      const pct = getPercentage(pr.count, reportData.summary?.total_complaints);
                      return (
                        <div key={pr.priority} className="space-y-1">
                          <div className="flex justify-between text-xs font-bold text-[#10213A] dark:text-[#F8FAFC]">
                            <span>{pr.priority} Priority</span>
                            <span className="text-[#60708A] dark:text-[#AEB9C9]">{pr.count} ({pct})</span>
                          </div>
                          <div className="w-full bg-[#FAF7F0] dark:bg-[#202B3D] rounded-full h-2 overflow-hidden border border-[#DED8CC] dark:border-[#344155]">
                            <div
                              className="bg-[#10213A] dark:bg-[#F8FAFC] h-2 rounded-full transition-all duration-500"
                              style={{ width: pct }}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>

              </div>

              {/* DEPARTMENT WORKLOAD SURFACE */}
              <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
                  <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
                    <Building className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                    DEPARTMENT WORKLOAD DISTRIBUTION
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                        <th className="py-3 px-3">DEPARTMENT NAME</th>
                        <th className="py-3 px-3">COMPLAINTS HANDLED</th>
                        <th className="py-3 px-3">SHARE OF TOTAL</th>
                        <th className="py-3 px-3 text-right">VOLUME BAR</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                      {reportData.department_report?.map((dept) => {
                        const pct = getPercentage(dept.count, reportData.summary?.total_complaints);
                        return (
                          <tr key={dept.department_id} className="hover:bg-[#FDF2F4]/50 dark:hover:bg-[#202B3D] transition-colors">
                            <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC]">{dept.department_name}</td>
                            <td className="py-3.5 px-3 font-mono font-bold text-[#60708A] dark:text-[#7F8CA1]">{dept.count}</td>
                            <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">{pct}</td>
                            <td className="py-3.5 px-3 text-right w-1/3">
                              <div className="w-full bg-[#FAF7F0] dark:bg-[#202B3D] rounded-full h-2 overflow-hidden border border-[#DED8CC] dark:border-[#344155]">
                                <div
                                  className="bg-[#B51232] dark:bg-[#C51F3D] h-2 rounded-full"
                                  style={{ width: pct }}
                                />
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>

              {/* CATEGORY VOLUME SURFACE */}
              <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
                <div className="flex items-center justify-between pb-2 border-b border-[#DED8CC] dark:border-[#344155]">
                  <h3 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC] flex items-center gap-2">
                    <Tag className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                    CATEGORY ISSUE VOLUME
                  </h3>
                </div>

                <div className="overflow-x-auto">
                  <table className="w-full text-left border-collapse">
                    <thead>
                      <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                        <th className="py-3 px-3">CATEGORY NAME</th>
                        <th className="py-3 px-3">ISSUES REPORTED</th>
                        <th className="py-3 px-3 text-right">PERCENTAGE SHARE</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155] text-xs">
                      {reportData.category_report?.map((cat) => (
                        <tr key={cat.category_id} className="hover:bg-[#FDF2F4]/50 dark:hover:bg-[#202B3D] transition-colors">
                          <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC]">{cat.category_name}</td>
                          <td className="py-3.5 px-3 font-mono font-bold text-[#60708A] dark:text-[#7F8CA1]">{cat.count}</td>
                          <td className="py-3.5 px-3 text-right text-[#60708A] dark:text-[#AEB9C9]">
                            {getPercentage(cat.count, reportData.summary?.total_complaints)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>

            </>
          ) : null}

        </div>

      </div>
    </div>
  );
}

export default ReportsAnalytics;
