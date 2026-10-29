import React, { useState, useEffect } from 'react';
import { api } from '../../services/api';
import Button from '../../components/Button';
import {
  ShieldAlert,
  Clock,
  Plus,
  Edit2,
  RefreshCw,
  AlertCircle,
  CheckCircle2,
  X,
  Play,
  Activity,
  Layers,
  Tag,
  AlertTriangle,
  Flame,
  HelpCircle
} from 'lucide-react';

export function SlaManagement() {
  const [configs, setConfigs] = useState([]);
  const [categories, setCategories] = useState([]);
  const [workerStatus, setWorkerStatus] = useState(null);
  const [loading, setLoading] = useState(true);
  const [workerLoading, setWorkerLoading] = useState(false);
  const [checkingNow, setCheckingNow] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [successMsg, setSuccessMsg] = useState('');

  // Modal State
  const [modalOpen, setModalOpen] = useState(false);
  const [editingConfig, setEditingConfig] = useState(null);
  const [ruleType, setRuleType] = useState('category'); // 'category' | 'priority'
  const [selectedCategoryId, setSelectedCategoryId] = useState('');
  const [selectedPriority, setSelectedPriority] = useState('Medium');
  const [targetHours, setTargetHours] = useState(24);
  const [warningHours, setWarningHours] = useState(4);
  const [isActive, setIsActive] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [modalError, setModalError] = useState('');

  // Fetch configs, worker status, categories
  const fetchData = async () => {
    setLoading(true);
    setErrorMsg('');
    try {
      const [configsData, catsData, statusData] = await Promise.all([
        api.sla.getConfigs(),
        api.categories.getAll(),
        api.sla.getWorkerStatus().catch(() => null),
      ]);
      setConfigs(configsData || []);
      setCategories(catsData || []);
      setWorkerStatus(statusData);

      if (catsData?.length > 0 && !selectedCategoryId) {
        setSelectedCategoryId(catsData[0].id);
      }
    } catch (err) {
      setErrorMsg(err.message || 'Failed to load SLA configurations.');
    } finally {
      setLoading(false);
    }
  };

  const refreshWorkerStatus = async () => {
    setWorkerLoading(true);
    try {
      const status = await api.sla.getWorkerStatus();
      setWorkerStatus(status);
    } catch (e) {
      // non-blocking
    } finally {
      setWorkerLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  const openCreateModal = () => {
    setEditingConfig(null);
    setRuleType('category');
    setSelectedCategoryId(categories.length > 0 ? categories[0].id : '');
    setSelectedPriority('Medium');
    setTargetHours(24);
    setWarningHours(4);
    setIsActive(true);
    setModalError('');
    setModalOpen(true);
  };

  const openEditModal = (cfg) => {
    setEditingConfig(cfg);
    setRuleType(cfg.category_id ? 'category' : 'priority');
    setSelectedCategoryId(cfg.category_id || '');
    setSelectedPriority(cfg.priority || 'Medium');
    setTargetHours(cfg.target_hours);
    setWarningHours(cfg.warning_hours);
    setIsActive(cfg.is_active);
    setModalError('');
    setModalOpen(true);
  };

  const handleCheckNow = async () => {
    setCheckingNow(true);
    setErrorMsg('');
    try {
      const result = await api.sla.checkNow();
      setSuccessMsg(
        `On-demand check completed: ${result.overdue_detected} overdue complaints detected, ${result.escalated_count} escalated.`
      );
      refreshWorkerStatus();
      setTimeout(() => setSuccessMsg(''), 5000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to execute on-demand SLA escalation check.');
    } finally {
      setCheckingNow(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setModalError('');

    const target = Number(targetHours);
    const warn = Number(warningHours);

    if (isNaN(target) || target <= 0) {
      setModalError('Target hours must be a positive integer greater than 0.');
      return;
    }

    if (isNaN(warn) || warn <= 0) {
      setModalError('Warning threshold must be a positive integer greater than 0.');
      return;
    }

    if (warn >= target) {
      setModalError(`Warning threshold (${warn}h) must be strictly less than target resolution duration (${target}h).`);
      return;
    }

    setSubmitting(true);
    try {
      if (editingConfig) {
        // Update existing configuration
        await api.sla.updateConfig(editingConfig.id, {
          target_hours: target,
          warning_hours: warn,
          is_active: isActive,
        });
        setSuccessMsg(`SLA configuration updated successfully.`);
      } else {
        // Create new configuration
        const payload = {
          target_hours: target,
          warning_hours: warn,
          is_active: isActive,
        };

        if (ruleType === 'category') {
          if (!selectedCategoryId) {
            setModalError('Please select a complaint category.');
            setSubmitting(false);
            return;
          }
          payload.category_id = Number(selectedCategoryId);
          payload.priority = null;
        } else {
          payload.priority = selectedPriority;
          payload.category_id = null;
        }

        await api.sla.createConfig(payload);
        setSuccessMsg(`New SLA rule configured successfully.`);
      }

      setModalOpen(false);
      fetchData();
      setTimeout(() => setSuccessMsg(''), 4000);
    } catch (err) {
      setModalError(err.message || 'Failed to save SLA configuration.');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="min-h-[calc(100vh-4.5rem)] bg-[#F5F0E7] dark:bg-[#111827] py-8 px-4 sm:px-6 lg:px-8 transition-colors duration-150">
      <div className="max-w-6xl mx-auto space-y-6 text-left">
        
        {/* HEADER BAR */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-6 text-left space-y-3 shadow-2xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <p className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#B51232] dark:text-[#C51F3D]">
                ADMINISTRATION & GOVERNANCE
              </p>
              <h1 className="text-2xl sm:text-3xl font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC] tracking-tight">
                SLA Targets & Escalation Engine
              </h1>
              <p className="text-xs text-[#60708A] dark:text-[#AEB9C9] mt-1 max-w-2xl">
                Configure resolution deadlines by category and priority. Category-specific rules automatically override general priority targets.
              </p>
            </div>

            <div className="flex flex-wrap items-center gap-2.5">
              <Button
                variant="secondary"
                size="sm"
                onClick={handleCheckNow}
                isLoading={checkingNow}
                title="Immediately run deadline check across all active complaints"
              >
                <Play className="w-3.5 h-3.5 mr-1 text-[#B51232] dark:text-[#C51F3D]" />
                Run Check Now
              </Button>
              <Button
                variant="primary"
                size="sm"
                onClick={openCreateModal}
              >
                <Plus className="w-4 h-4 mr-1" />
                Add SLA Rule
              </Button>
            </div>
          </div>
        </div>

        {/* FEEDBACK ALERTS */}
        {errorMsg && (
          <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] p-4 rounded-[8px] text-xs flex items-center justify-between">
            <div className="flex items-center gap-2">
              <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
              <span>{errorMsg}</span>
            </div>
            <button onClick={() => setErrorMsg('')} className="text-[#94102A] hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {successMsg && (
          <div className="bg-[#E8F5EC] dark:bg-[#22A06B]/15 border border-[#A7F3D0] dark:border-[#22A06B]/30 text-[#008A4A] dark:text-[#22A06B] p-4 rounded-[8px] text-xs flex items-center justify-between font-bold">
            <div className="flex items-center gap-2">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{successMsg}</span>
            </div>
            <button onClick={() => setSuccessMsg('')} className="hover:opacity-70">
              <X className="w-4 h-4" />
            </button>
          </div>
        )}

        {/* SECTION 1: WORKER STATUS MONITORING PANEL */}
        {workerStatus && (
          <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
            <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
              <div className="flex items-center gap-2">
                <Activity className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
                <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC]">
                  Background Escalation Worker Status
                </h2>
              </div>
              <button
                onClick={refreshWorkerStatus}
                disabled={workerLoading}
                className="text-xs text-[#60708A] dark:text-[#AEB9C9] hover:text-[#B51232] dark:hover:text-[#C51F3D] inline-flex items-center gap-1 font-semibold disabled:opacity-50"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${workerLoading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5 text-left">
              <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                  Engine State
                </p>
                <div className="flex items-center gap-1.5 mt-1">
                  <span className={`w-2 h-2 rounded-full ${workerStatus.is_running ? 'bg-[#059669] animate-pulse' : 'bg-[#DC2626]'}`}></span>
                  <span className={`text-xs font-bold uppercase ${workerStatus.is_running ? 'text-[#059669] dark:text-[#34D399]' : 'text-[#DC2626]'}`}>
                    {workerStatus.is_running ? 'Active (Monitoring)' : 'Inactive'}
                  </span>
                </div>
              </div>

              <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                  Periodic Interval
                </p>
                <p className="text-xs font-mono font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                  Every {workerStatus.interval_seconds || 60} seconds
                </p>
              </div>

              <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                  Last Execution
                </p>
                <p className="text-xs font-mono font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                  {workerStatus.last_run_time
                    ? new Date(workerStatus.last_run_time).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' })
                    : 'Pending initial tick'}
                </p>
              </div>

              <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                  Scan Cycles
                </p>
                <p className="text-xs font-mono font-bold text-[#10213A] dark:text-[#F8FAFC] mt-1">
                  {workerStatus.run_count || 0} checks completed
                </p>
              </div>

              <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px] col-span-2 sm:col-span-1">
                <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                  Escalated Count
                </p>
                <p className="text-xs font-mono font-extrabold text-[#B51232] dark:text-[#FF6B81] mt-1 flex items-center gap-1">
                  <Flame className="w-3.5 h-3.5" />
                  {workerStatus.escalated_total || 0} complaints
                </p>
              </div>
            </div>
          </div>
        )}

        {/* SECTION 2: SLA CONFIGURATIONS TABLE */}
        <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] p-5 sm:p-6 shadow-2xs space-y-4">
          <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
            <div className="flex items-center gap-2">
              <Layers className="w-4 h-4 text-[#B51232] dark:text-[#C51F3D]" />
              <h2 className="text-xs font-heading font-extrabold uppercase tracking-widest text-[#10213A] dark:text-[#F8FAFC]">
                Active Resolution Rules ({configs.length})
              </h2>
            </div>
            <span className="text-[11px] text-[#60708A] dark:text-[#AEB9C9]">
              Precedence: <strong>Category Override &gt; Priority Default</strong>
            </span>
          </div>

          {loading ? (
            <div className="py-10 text-center text-xs text-[#60708A] dark:text-[#AEB9C9]">
              Loading SLA configurations...
            </div>
          ) : configs.length === 0 ? (
            <div className="py-8 text-center text-xs text-[#60708A] dark:text-[#AEB9C9]">
              No SLA rules configured. Click "Add SLA Rule" above to create targets.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse text-xs">
                <thead>
                  <tr className="border-b border-[#DED8CC] dark:border-[#344155] text-[10px] font-heading font-extrabold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                    <th className="py-3 px-3">RULE SCOPE</th>
                    <th className="py-3 px-3">TARGET IDENTIFIER</th>
                    <th className="py-3 px-3">RESOLUTION TARGET</th>
                    <th className="py-3 px-3">WARNING THRESHOLD</th>
                    <th className="py-3 px-3">STATUS</th>
                    <th className="py-3 px-3 text-right">ACTION</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[#DED8CC] dark:divide-[#344155]">
                  {configs.map((cfg) => {
                    const isCat = Boolean(cfg.category_id);
                    return (
                      <tr key={cfg.id} className="hover:bg-[#FAF7F0]/60 dark:hover:bg-[#202B3D] transition-colors">
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase tracking-wider ${
                            isCat
                              ? 'bg-[#FEF2F2] dark:bg-[#B51232]/20 text-[#B51232] dark:text-[#FF6B81] border border-[#FECACA] dark:border-[#B51232]/40'
                              : 'bg-[#EFF6FF] dark:bg-[#1E3A8A]/25 text-[#1D4ED8] dark:text-[#93C5FD] border border-[#BFDBFE] dark:border-[#1E3A8A]/40'
                          }`}>
                            {isCat ? <Tag className="w-3 h-3" /> : <ShieldAlert className="w-3 h-3" />}
                            {isCat ? 'Category Override' : 'Priority Level'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 font-bold text-[#10213A] dark:text-[#F8FAFC]">
                          {isCat ? (
                            <span>{cfg.category_name || `Category #${cfg.category_id}`}</span>
                          ) : (
                            <span className="font-mono">{cfg.priority} Priority</span>
                          )}
                        </td>
                        <td className="py-3.5 px-3 font-mono font-bold text-[#10213A] dark:text-[#F8FAFC]">
                          {cfg.target_hours} hour{cfg.target_hours === 1 ? '' : 's'}
                        </td>
                        <td className="py-3.5 px-3 text-[#60708A] dark:text-[#AEB9C9]">
                          {cfg.warning_hours} hour{cfg.warning_hours === 1 ? '' : 's'} before breach
                        </td>
                        <td className="py-3.5 px-3">
                          <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-heading font-bold uppercase ${
                            cfg.is_active
                              ? 'bg-[#ECFDF5] dark:bg-[#064E3B]/30 text-[#059669] dark:text-[#34D399] border border-[#A7F3D0] dark:border-[#065F46]/50'
                              : 'bg-[#F1F5F9] dark:bg-[#1E293B] text-[#64748B] dark:text-[#94A3B8] border border-[#CBD5E1] dark:border-[#334155]'
                          }`}>
                            {cfg.is_active ? 'Active' : 'Disabled'}
                          </span>
                        </td>
                        <td className="py-3.5 px-3 text-right">
                          <Button
                            variant="secondary"
                            size="sm"
                            onClick={() => openEditModal(cfg)}
                          >
                            <Edit2 className="w-3.5 h-3.5 mr-1" />
                            Edit
                          </Button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* MODAL: CREATE OR EDIT SLA CONFIGURATION */}
        {modalOpen && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
            <div className="bg-white dark:bg-[#182235] border border-[#DED8CC] dark:border-[#344155] rounded-[12px] max-w-lg w-full p-6 text-left shadow-xl space-y-4">
              <div className="flex items-center justify-between border-b border-[#DED8CC] dark:border-[#344155] pb-3">
                <h3 className="text-base font-extrabold font-heading text-[#10213A] dark:text-[#F8FAFC]">
                  {editingConfig ? 'Edit SLA Configuration' : 'Configure New SLA Target'}
                </h3>
                <button
                  onClick={() => setModalOpen(false)}
                  className="text-[#60708A] dark:text-[#AEB9C9] hover:text-[#10213A] dark:hover:text-[#F8FAFC]"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              {modalError && (
                <div className="bg-[#FDF2F4] dark:bg-[#D6455D]/15 border border-[#F8D7DA] dark:border-[#D6455D]/30 text-[#94102A] dark:text-[#D6455D] p-3 rounded-[6px] text-xs flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 shrink-0 text-[#B51232] dark:text-[#D6455D]" />
                  <span>{modalError}</span>
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                {!editingConfig ? (
                  /* Rule Scope Selection (Only for Create) */
                  <div className="space-y-2">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                      Target Scope
                    </label>
                    <div className="grid grid-cols-2 gap-3">
                      <button
                        type="button"
                        onClick={() => setRuleType('category')}
                        className={`p-3 rounded-[6px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          ruleType === 'category'
                            ? 'bg-[#FDF2F4] dark:bg-[#B51232]/20 border-[#B51232] text-[#B51232] dark:text-[#FF6B81]'
                            : 'bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155] text-[#60708A] dark:text-[#AEB9C9]'
                        }`}
                      >
                        <Tag className="w-4 h-4" /> Category Override
                      </button>
                      <button
                        type="button"
                        onClick={() => setRuleType('priority')}
                        className={`p-3 rounded-[6px] border text-xs font-bold flex items-center justify-center gap-1.5 transition-colors ${
                          ruleType === 'priority'
                            ? 'bg-[#FDF2F4] dark:bg-[#B51232]/20 border-[#B51232] text-[#B51232] dark:text-[#FF6B81]'
                            : 'bg-[#FAF7F0] dark:bg-[#202B3D] border-[#DED8CC] dark:border-[#344155] text-[#60708A] dark:text-[#AEB9C9]'
                        }`}
                      >
                        <ShieldAlert className="w-4 h-4" /> Priority Level
                      </button>
                    </div>

                    {ruleType === 'category' ? (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-semibold text-[#10213A] dark:text-[#F8FAFC]">
                          Select Category
                        </label>
                        <select
                          value={selectedCategoryId}
                          onChange={(e) => setSelectedCategoryId(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC]"
                        >
                          {categories.map((c) => (
                            <option key={c.id} value={c.id}>
                              {c.name}
                            </option>
                          ))}
                        </select>
                      </div>
                    ) : (
                      <div className="space-y-1 pt-1">
                        <label className="text-xs font-semibold text-[#10213A] dark:text-[#F8FAFC]">
                          Select Priority
                        </label>
                        <select
                          value={selectedPriority}
                          onChange={(e) => setSelectedPriority(e.target.value)}
                          className="w-full text-xs p-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC]"
                        >
                          <option value="Critical">Critical</option>
                          <option value="High">High</option>
                          <option value="Medium">Medium</option>
                          <option value="Low">Low</option>
                        </select>
                      </div>
                    )}
                  </div>
                ) : (
                  /* Display Fixed Identifier in Edit mode */
                  <div className="bg-[#FAF7F0] dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] p-3 rounded-[6px]">
                    <p className="text-[10px] font-heading font-extrabold uppercase text-[#60708A] dark:text-[#AEB9C9]">
                      Editing Target
                    </p>
                    <p className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] mt-0.5">
                      {editingConfig.category_id
                        ? `Category: ${editingConfig.category_name || `Category #${editingConfig.category_id}`}`
                        : `Priority: ${editingConfig.priority}`}
                    </p>
                  </div>
                )}

                {/* Duration Inputs */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                      Resolution Target (Hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={720}
                      value={targetHours}
                      onChange={(e) => setTargetHours(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC]"
                    />
                    <p className="text-[10px] text-[#60708A] dark:text-[#AEB9C9]">e.g. 4 for leakages, 24 for standard</p>
                  </div>

                  <div className="space-y-1">
                    <label className="text-xs font-bold uppercase tracking-wider text-[#60708A] dark:text-[#AEB9C9]">
                      Warning Threshold (Hours)
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      max={719}
                      value={warningHours}
                      onChange={(e) => setWarningHours(e.target.value)}
                      className="w-full text-xs font-mono p-2.5 bg-white dark:bg-[#202B3D] border border-[#DED8CC] dark:border-[#344155] rounded-[6px] text-[#10213A] dark:text-[#F8FAFC]"
                    />
                    <p className="text-[10px] text-[#60708A] dark:text-[#AEB9C9]">Hours before breach to alert (must be &lt; target)</p>
                  </div>
                </div>

                {/* Active Checkbox */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={isActive}
                    onChange={(e) => setIsActive(e.target.checked)}
                    className="w-4 h-4 rounded text-[#B51232] focus:ring-[#B51232]"
                  />
                  <label htmlFor="isActive" className="text-xs font-bold text-[#10213A] dark:text-[#F8FAFC] cursor-pointer">
                    Rule is Active and Monitored
                  </label>
                </div>

                <div className="flex items-center justify-end gap-2 pt-3 border-t border-[#DED8CC] dark:border-[#344155]">
                  <Button
                    type="button"
                    variant="secondary"
                    size="sm"
                    onClick={() => setModalOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    variant="primary"
                    size="sm"
                    isLoading={submitting}
                  >
                    {editingConfig ? 'Save Changes' : 'Create Configuration'}
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

export default SlaManagement;
