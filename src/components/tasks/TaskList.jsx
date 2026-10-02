// src/components/tasks/TaskList.jsx
import React, { useState, useEffect, useMemo } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import taskAPI, { taskTypeAPI } from '../../apis/taskAPI';
import TaskHistory from './TaskHistory';
import { 
  Search, 
  Eye,
  Calendar,
  User,
  AlertCircle,
  RefreshCw,
  ClipboardList,
  Clock,
  AlertTriangle,
  CheckSquare,
  Grid,
  Table,
  SortAsc,
  SortDesc,
  RotateCcw,
  ThumbsUp,
  ThumbsDown,
  CheckCircle,
  PlayCircle,
  Trash2,
  Archive,
  ArchiveRestore,
  Filter,
  Download,
  CalendarDays,
  UserCheck,
  Tag,
  Layers,
  ChevronDown
} from 'lucide-react';

const TaskList = ({ isManager = false, refresh }) => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const isHR = user?.role === 'HR_Manager';

  const [tasks, setTasks] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [selectedTask, setSelectedTask] = useState(null);
  const [showHistory, setShowHistory] = useState(false);
  const [viewMode, setViewMode] = useState('grid');
  const [sortConfig, setSortConfig] = useState({ key: 'createdAt', direction: 'desc' });

  // Filter options data from backend
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [taskTypes, setTaskTypes] = useState([]);

  // Filter state
  const [period, setPeriod] = useState('all'); // 'all' | 'daily' | 'monthly' | 'custom'
  const [dailyPreset, setDailyPreset] = useState('today'); // 'today' | 'yesterday' | 'custom'
  const [monthlyPreset, setMonthlyPreset] = useState('this_month'); // 'this_month' | 'last_month' | 'custom'
  const [filters, setFilters] = useState({
    search: '',
    status: '',
    priority: '',
    deadlineStatus: '',
    assignedBy: '',
    assignedTo: '',
    taskType: '',
    dateField: 'createdAt',
    date: '',
    month: '',
    year: '',
    startDate: '',
    endDate: '',
    isActive: "true",
    page: 1,
    limit: 12,
  });

  const [pagination, setPagination] = useState({
    page: 1,
    totalPages: 1,
    totalTasks: 0
  });

  // Fetch dropdown options on mount
  useEffect(() => {
    fetchFilterOptions();
  }, []);

  const fetchFilterOptions = async () => {
    try {
      const [empRes, typesRes] = await Promise.all([
        taskAPI.getAssignableEmployees().catch(() => ({ data: { employees: [], teamLeaders: [] } })),
        taskTypeAPI.getAll().catch(() => ({ data: { taskTypes: [] } }))
      ]);

      if (empRes.data) {
        setEmployees(empRes.data.employees || []);
        setTeamLeaders(empRes.data.teamLeaders || []);
      }
      if (typesRes.data) {
        setTaskTypes(typesRes.data.taskTypes || []);
      }
    } catch (err) {
      console.error('Error fetching filter options:', err);
    }
  };

  // Helper date formatters
  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getYesterdayStr = () => {
    const d = new Date();
    d.setDate(d.getDate() - 1);
    return d.toISOString().split('T')[0];
  };
  const getThisMonthStr = () => {
    const d = new Date();
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  };
  const getLastMonthStr = () => {
    const d = new Date();
    d.setMonth(d.getMonth() - 1);
    const m = String(d.getMonth() + 1).padStart(2, '0');
    return `${d.getFullYear()}-${m}`;
  };

  // Synchronize period selection to filters
  const handlePeriodChange = (newPeriod) => {
    setPeriod(newPeriod);
    setFilters(prev => {
      const next = { ...prev, page: 1, date: '', month: '', year: '', startDate: '', endDate: '' };
      if (newPeriod === 'daily') {
        next.date = getTodayStr();
        setDailyPreset('today');
      } else if (newPeriod === 'monthly') {
        next.month = getThisMonthStr();
        setMonthlyPreset('this_month');
      }
      return next;
    });
  };

  const handleDailyPreset = (preset) => {
    setDailyPreset(preset);
    if (preset === 'today') {
      handleFilterChange('date', getTodayStr());
    } else if (preset === 'yesterday') {
      handleFilterChange('date', getYesterdayStr());
    }
  };

  const handleMonthlyPreset = (preset) => {
    setMonthlyPreset(preset);
    if (preset === 'this_month') {
      handleFilterChange('month', getThisMonthStr());
    } else if (preset === 'last_month') {
      handleFilterChange('month', getLastMonthStr());
    }
  };

  const fetchTasks = async () => {
    try {
      setLoading(true);
      setError('');
      const params = {
        ...filters,
        period: period !== 'all' ? period : undefined,
        sortBy: sortConfig.key,
        sortOrder: sortConfig.direction
      };

      // Clean empty params
      Object.keys(params).forEach(k => {
        if (params[k] === '' || params[k] === undefined || params[k] === null) {
          delete params[k];
        }
      });

      const response = (isManager || isHR)
        ? await taskAPI.getAll(params)
        : await taskAPI.getMyTasks(params);

      setTasks(response.data.tasks || []);
      const p = response.data.pagination || {};
      setPagination({
        page: p.currentPage || p.page || 1,
        totalPages: p.totalPages || 1,
        totalTasks: p.totalTasks || 0
      });
    } catch (err) {
      setError('Failed to fetch tasks: ' + (err.response?.data?.message || err.message));
      console.error('Error fetching tasks:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchTasks();
  }, [filters, period, refresh, sortConfig, isManager]);

  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  const handleResetFilters = () => {
    setPeriod('all');
    setDailyPreset('today');
    setMonthlyPreset('this_month');
    setFilters({
      search: '',
      status: '',
      priority: '',
      deadlineStatus: '',
      assignedBy: '',
      assignedTo: '',
      taskType: '',
      dateField: 'createdAt',
      date: '',
      month: '',
      year: '',
      startDate: '',
      endDate: '',
      isActive: "true",
      page: 1,
      limit: 12,
    });
  };

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'asc' ? 'desc' : 'asc'
    }));
  };

  const handleStatusUpdate = async (taskId, newStatus, remarks = '') => {
    try {
      await taskAPI.updateStatus(taskId, { status: newStatus, remarks });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to update task status');
    }
  };

  const handleReview = async (taskId, status, remarks = '') => {
    try {
      await taskAPI.reviewTask(taskId, { status, remarks });
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to review task');
    }
  };

  const handleDelete = async (taskId) => {
    if (window.confirm('Are you sure you want to delete this task?')) {
      try {
        await taskAPI.delete(taskId);
        fetchTasks();
      } catch (err) {
        setError(err.response?.data?.message || 'Failed to delete task');
      }
    }
  };

  const handleRestore = async (taskId) => {
    try {
      await taskAPI.restoreTask(taskId);
      fetchTasks();
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to restore task');
    }
  };

  // CSV Export Function
  const handleExportCSV = () => {
    if (!tasks.length) return;
    const headers = ['Task Title', 'Status', 'Priority', 'Assigned By (TL)', 'Assigned To', 'Task Type', 'Created Date', 'Deadline', 'Due Date'];
    const rows = tasks.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      t.status || '',
      t.priority || '',
      `"${t.assignedBy?.name ? `${t.assignedBy.name.first} ${t.assignedBy.name.last} (${t.assignedBy.employeeId || ''})` : ''}"`,
      `"${t.assignedTo?.name ? `${t.assignedTo.name.first} ${t.assignedTo.name.last} (${t.assignedTo.employeeId || ''})` : ''}"`,
      `"${t.taskType?.name || t.taskType || ''}"`,
      t.createdAt ? new Date(t.createdAt).toLocaleDateString() : '',
      t.deadline ? new Date(t.deadline).toLocaleDateString() : '',
      t.dueDate ? new Date(t.dueDate).toLocaleDateString() : '',
    ]);

    const csvContent = "data:text/csv;charset=utf-8," + [headers.join(','), ...rows.map(e => e.join(','))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `tasks_export_${new Date().toISOString().slice(0,10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Summary Metrics computed from current task list
  const metrics = useMemo(() => {
    const total = pagination.totalTasks || tasks.length;
    const completed = tasks.filter(t => t.status === 'Completed' || t.status === 'Approved').length;
    const inProgress = tasks.filter(t => t.status === 'In Progress').length;
    const pending = tasks.filter(t => ['Pending', 'Assigned', 'New'].includes(t.status)).length;
    const overdue = tasks.filter(t => {
      if (t.status === 'Completed' || t.status === 'Approved') return false;
      return t.deadline && new Date() > new Date(t.deadline);
    }).length;
    return { total, completed, inProgress, pending, overdue };
  }, [tasks, pagination.totalTasks]);

  const getStatusColor = (status) => {
    const colors = {
      'New': themeColors.textSecondary,
      'Assigned': themeColors.primary,
      'In Progress': themeColors.warning,
      'Pending': themeColors.accent || '#8b5cf6',
      'Completed': themeColors.success,
      'Approved': themeColors.success,
      'Rejected': themeColors.danger
    };
    return colors[status] || themeColors.textSecondary;
  };

  const getPriorityColor = (priority) => {
    const colors = {
      'Low': themeColors.success,
      'Medium': themeColors.accent || '#3b82f6',
      'High': themeColors.warning,
      'Urgent': themeColors.danger
    };
    return colors[priority] || themeColors.textSecondary;
  };

  const getDeadlineStatus = (task) => {
    if (task.status === 'Completed' || task.status === 'Approved') {
      return { status: 'completed', color: themeColors.success, label: 'Completed' };
    }
    
    if (!task.deadline) {
      return { status: 'normal', color: themeColors.textSecondary, label: 'No Deadline' };
    }

    const deadline = new Date(task.deadline);
    const now = new Date();
    const timeDiff = deadline.getTime() - now.getTime();
    const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));

    if (daysDiff < 0) {
      return { status: 'overdue', color: themeColors.danger, label: 'Overdue' };
    } else if (daysDiff === 0) {
      return { status: 'urgent', color: themeColors.warning, label: 'Due Today' };
    } else if (daysDiff <= 1) {
      return { status: 'urgent', color: themeColors.warning, label: 'Due Tomorrow' };
    } else if (daysDiff <= 3) {
      return { status: 'approaching', color: themeColors.accent || '#3b82f6', label: 'Due Soon' };
    } else {
      return { status: 'normal', color: themeColors.success, label: 'On Track' };
    }
  };

  const StatusBadge = ({ status }) => (
    <span 
      className="px-2.5 py-0.5 rounded-full text-xs font-semibold uppercase tracking-wider"
      style={{ 
        backgroundColor: getStatusColor(status) + '20',
        color: getStatusColor(status),
        border: `1px solid ${getStatusColor(status)}40`
      }}
    >
      {status}
    </span>
  );

  const PriorityBadge = ({ priority }) => (
    <span 
      className="px-2 py-0.5 rounded-md text-xs font-medium"
      style={{ 
        backgroundColor: getPriorityColor(priority) + '20',
        color: getPriorityColor(priority)
      }}
    >
      {priority}
    </span>
  );

  const DeadlineBadge = ({ task }) => {
    const deadlineInfo = getDeadlineStatus(task);
    return (
      <span 
        className="px-2 py-0.5 rounded-full text-xs font-medium flex items-center gap-1"
        style={{ 
          backgroundColor: deadlineInfo.color + '20',
          color: deadlineInfo.color
        }}
      >
        {deadlineInfo.status === 'overdue' && <AlertTriangle size={12} />}
        {deadlineInfo.status === 'urgent' && <Clock size={12} />}
        {deadlineInfo.status === 'completed' && <CheckSquare size={12} />}
        {deadlineInfo.label}
      </span>
    );
  };

  const GridView = () => (
    <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
      {tasks.map((task) => {
        const deadlineInfo = getDeadlineStatus(task);
        const isTaskActive = task.isActive;
        
        return (
          <div
            key={task._id}
            className={`p-5 rounded-2xl border transition-all hover:shadow-lg hover:border-primary/50 cursor-pointer flex flex-col justify-between ${
              deadlineInfo.status === 'overdue' ? 'border-l-4 border-l-red-500' : ''
            } ${!isTaskActive ? 'opacity-60 bg-gray-50 dark:bg-gray-800' : ''}`}
            style={{ 
              backgroundColor: !isTaskActive ? themeColors.background + '80' : themeColors.surface,
              borderColor: deadlineInfo.status === 'overdue' ? themeColors.danger : themeColors.border,
              color: themeColors.text
            }}
            onClick={() => {
              setSelectedTask(task);
              setShowHistory(true);
            }}
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between gap-2 mb-3">
                <h3 className="text-base font-bold line-clamp-2 leading-snug">{task.title}</h3>
                {!isTaskActive && (
                  <span className="px-2 py-0.5 bg-gray-500 text-white text-xs rounded-full flex items-center gap-1 shrink-0">
                    <Archive size={11} /> Deleted
                  </span>
                )}
              </div>

              {/* Badges */}
              <div className="flex flex-wrap gap-1.5 mb-3">
                <StatusBadge status={task.status} />
                <PriorityBadge priority={task.priority} />
                <DeadlineBadge task={task} />
                {task.taskType && (
                  <span
                    className="px-2 py-0.5 rounded-md text-xs font-medium flex items-center gap-1"
                    style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}
                  >
                    <Tag size={11} /> {task.taskType?.name || task.taskType}
                  </span>
                )}
              </div>

              {/* Description */}
              <p className="text-xs opacity-75 mb-4 line-clamp-3 leading-relaxed">
                {task.description || 'No description provided'}
              </p>

              {/* Details Box */}
              <div className="p-3 rounded-xl mb-4 space-y-2 text-xs" style={{ backgroundColor: themeColors.background }}>
                {/* Team Leader / Assigned By */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 opacity-70">
                    <UserCheck size={13} style={{ color: themeColors.primary }} /> Team Leader:
                  </span>
                  <span className="font-semibold text-right">
                    {task.assignedBy?.name ? `${task.assignedBy.name.first} ${task.assignedBy.name.last}` : 'N/A'}
                    {task.assignedBy?.employeeId && (
                      <span className="opacity-60 ml-1">({task.assignedBy.employeeId})</span>
                    )}
                  </span>
                </div>

                {/* Assigned To */}
                <div className="flex items-center justify-between">
                  <span className="flex items-center gap-1.5 opacity-70">
                    <User size={13} style={{ color: themeColors.accent || themeColors.primary }} /> Assigned To:
                  </span>
                  <span className="font-semibold text-right">
                    {task.assignedTo?.name ? `${task.assignedTo.name.first} ${task.assignedTo.name.last}` : 'Unassigned'}
                    {task.assignedTo?.employeeId && (
                      <span className="opacity-60 ml-1">({task.assignedTo.employeeId})</span>
                    )}
                  </span>
                </div>

                {/* Created Date */}
                {task.createdAt && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-70">
                      <CalendarDays size={13} /> Created:
                    </span>
                    <span>
                      {new Date(task.createdAt).toLocaleDateString()} {new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}

                {/* Deadline */}
                {task.deadline && (
                  <div className="flex items-center justify-between">
                    <span className="flex items-center gap-1.5 opacity-70">
                      <Clock size={13} /> Deadline:
                    </span>
                    <span className="font-medium" style={{ color: deadlineInfo.color }}>
                      {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </span>
                  </div>
                )}
              </div>
            </div>

            {/* Actions Bar */}
            <div className="flex flex-wrap items-center justify-between gap-2 pt-3 border-t" style={{ borderColor: themeColors.border }}>
              <button
                onClick={(e) => {
                  e.stopPropagation();
                  setSelectedTask(task);
                  setShowHistory(true);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-all hover:scale-105"
                style={{ 
                  backgroundColor: themeColors.background,
                  color: themeColors.text,
                  border: `1px solid ${themeColors.border}`
                }}
              >
                <Eye size={13} /> History
              </button>

              <div className="flex items-center gap-1.5">
                {isTaskActive && (
                  <>
                    {/* Employee Actions */}
                    {!isManager && !isHR && task.status !== 'Completed' && task.status !== 'Approved' && (
                      <>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            const remarks = prompt('Enter remarks for completing this task:');
                            if (remarks) handleStatusUpdate(task._id, 'Completed', remarks);
                          }}
                          className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                          style={{ backgroundColor: themeColors.success }}
                        >
                          <CheckCircle size={13} /> Complete
                        </button>

                        {task.status !== 'In Progress' && (
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              const remarks = prompt('Enter remarks for starting this task:');
                              if (remarks) handleStatusUpdate(task._id, 'In Progress', remarks);
                            }}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                            style={{ backgroundColor: themeColors.warning }}
                          >
                            <PlayCircle size={13} /> Start
                          </button>
                        )}
                      </>
                    )}

                    {/* Manager / HR Actions */}
                    {(isManager || isHR) && (
                      <>
                        {task.status === 'Completed' && (
                          <>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const remarks = prompt('Enter approval remarks:');
                                if (remarks) handleReview(task._id, 'Approved', remarks);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                              style={{ backgroundColor: themeColors.success }}
                              title="Approve Task"
                            >
                              <ThumbsUp size={13} /> Approve
                            </button>
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                const remarks = prompt('Enter rejection reason:');
                                if (remarks) handleReview(task._id, 'Rejected', remarks);
                              }}
                              className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                              style={{ backgroundColor: themeColors.danger }}
                              title="Reject Task"
                            >
                              <ThumbsDown size={13} /> Reject
                            </button>
                          </>
                        )}

                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDelete(task._id);
                          }}
                          className="p-1.5 rounded-lg text-xs transition-colors hover:bg-red-100 dark:hover:bg-red-900/30"
                          style={{ color: themeColors.danger }}
                          title="Delete Task"
                        >
                          <Trash2 size={15} />
                        </button>
                      </>
                    )}
                  </>
                )}

                {!isTaskActive && (isManager || isHR) && (
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleRestore(task._id);
                    }}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold text-white transition-all hover:opacity-90"
                    style={{ backgroundColor: themeColors.success }}
                  >
                    <ArchiveRestore size={13} /> Restore
                  </button>
                )}
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );

  const TableView = () => (
    <div className="overflow-x-auto rounded-2xl border" style={{ borderColor: themeColors.border, backgroundColor: themeColors.surface }}>
      <table className="w-full border-collapse text-left">
        <thead>
          <tr className="border-b text-xs font-bold uppercase tracking-wider" style={{ borderColor: themeColors.border, backgroundColor: themeColors.background }}>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('title')}>
              <div className="flex items-center gap-1">
                Task Title
                {sortConfig.key === 'title' && (sortConfig.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)}
              </div>
            </th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('status')}>
              <div className="flex items-center gap-1">
                Status
                {sortConfig.key === 'status' && (sortConfig.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)}
              </div>
            </th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('priority')}>
              <div className="flex items-center gap-1">
                Priority
                {sortConfig.key === 'priority' && (sortConfig.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)}
              </div>
            </th>
            <th className="p-4">Assigned By (TL)</th>
            <th className="p-4">Assigned To</th>
            <th className="p-4">Task Type</th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('createdAt')}>
              <div className="flex items-center gap-1">
                Created Date
                {sortConfig.key === 'createdAt' && (sortConfig.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)}
              </div>
            </th>
            <th className="p-4 cursor-pointer" onClick={() => handleSort('deadline')}>
              <div className="flex items-center gap-1">
                Deadline
                {sortConfig.key === 'deadline' && (sortConfig.direction === 'asc' ? <SortAsc size={13} /> : <SortDesc size={13} />)}
              </div>
            </th>
            <th className="p-4 text-center">Actions</th>
          </tr>
        </thead>
        <tbody className="divide-y text-xs" style={{ borderColor: themeColors.border }}>
          {tasks.map((task) => {
            const deadlineInfo = getDeadlineStatus(task);
            const isTaskActive = task.isActive;
            
            return (
              <tr 
                key={task._id}
                className={`transition-colors hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer ${
                  deadlineInfo.status === 'overdue' ? 'bg-red-50/50 dark:bg-red-950/20' : ''
                } ${!isTaskActive ? 'opacity-60 bg-gray-100/50 dark:bg-gray-800/50' : ''}`}
                onClick={() => {
                  setSelectedTask(task);
                  setShowHistory(true);
                }}
              >
                <td className="p-4 max-w-xs">
                  <div className="font-bold text-sm leading-snug">{task.title}</div>
                  <div className="text-xs opacity-70 mt-1 line-clamp-1">{task.description || 'No description'}</div>
                </td>
                <td className="p-4">
                  <StatusBadge status={task.status} />
                </td>
                <td className="p-4">
                  <PriorityBadge priority={task.priority} />
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="font-medium">
                    {task.assignedBy?.name ? `${task.assignedBy.name.first} ${task.assignedBy.name.last}` : 'N/A'}
                  </div>
                  {task.assignedBy?.employeeId && (
                    <div className="text-[11px] opacity-60">ID: {task.assignedBy.employeeId}</div>
                  )}
                </td>
                <td className="p-4 whitespace-nowrap">
                  <div className="font-medium">
                    {task.assignedTo?.name ? `${task.assignedTo.name.first} ${task.assignedTo.name.last}` : 'Unassigned'}
                  </div>
                  {task.assignedTo?.employeeId && (
                    <div className="text-[11px] opacity-60">ID: {task.assignedTo.employeeId}</div>
                  )}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {task.taskType ? (
                    <span className="px-2 py-0.5 rounded-md font-medium" style={{ backgroundColor: themeColors.primary + '15', color: themeColors.primary }}>
                      {task.taskType?.name || task.taskType}
                    </span>
                  ) : <span className="opacity-50">—</span>}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {task.createdAt ? (
                    <div>
                      <div>{new Date(task.createdAt).toLocaleDateString()}</div>
                      <div className="text-[11px] opacity-60">{new Date(task.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</div>
                    </div>
                  ) : '—'}
                </td>
                <td className="p-4 whitespace-nowrap">
                  {task.deadline ? (
                    <div className="flex flex-col gap-1">
                      <span className="font-medium" style={{ color: deadlineInfo.color }}>
                        {new Date(task.deadline).toLocaleDateString()} {new Date(task.deadline).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <DeadlineBadge task={task} />
                    </div>
                  ) : 'No deadline'}
                </td>
                <td className="p-4 text-center whitespace-nowrap" onClick={(e) => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1.5">
                    <button
                      onClick={() => {
                        setSelectedTask(task);
                        setShowHistory(true);
                      }}
                      className="p-1.5 rounded-lg border hover:opacity-80"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}
                      title="View History"
                    >
                      <Eye size={14} />
                    </button>

                    {isTaskActive && (isManager || isHR) && (
                      <>
                        {task.status === 'Completed' && (
                          <>
                            <button
                              onClick={() => {
                                const remarks = prompt('Enter approval remarks:');
                                if (remarks) handleReview(task._id, 'Approved', remarks);
                              }}
                              className="p-1.5 rounded-lg text-white hover:opacity-90"
                              style={{ backgroundColor: themeColors.success }}
                              title="Approve"
                            >
                              <ThumbsUp size={14} />
                            </button>
                            <button
                              onClick={() => {
                                const remarks = prompt('Enter rejection reason:');
                                if (remarks) handleReview(task._id, 'Rejected', remarks);
                              }}
                              className="p-1.5 rounded-lg text-white hover:opacity-90"
                              style={{ backgroundColor: themeColors.danger }}
                              title="Reject"
                            >
                              <ThumbsDown size={14} />
                            </button>
                          </>
                        )}

                        <button
                          onClick={() => handleDelete(task._id)}
                          className="p-1.5 rounded-lg hover:bg-red-100 dark:hover:bg-red-950/40"
                          style={{ color: themeColors.danger }}
                          title="Delete"
                        >
                          <Trash2 size={14} />
                        </button>
                      </>
                    )}

                    {!isTaskActive && (isManager || isHR) && (
                      <button
                        onClick={() => handleRestore(task._id)}
                        className="p-1.5 rounded-lg text-white hover:opacity-90"
                        style={{ backgroundColor: themeColors.success }}
                        title="Restore"
                      >
                        <ArchiveRestore size={14} />
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );

  return (
    <div className="space-y-6">
      {error && (
        <div 
          className="p-4 rounded-xl border flex items-center gap-3 text-sm"
          style={{ 
            backgroundColor: themeColors.danger + '20',
            borderColor: themeColors.danger,
            color: themeColors.danger
          }}
        >
          <AlertCircle size={18} />
          <span>{error}</span>
          <button onClick={() => setError('')} className="ml-auto font-bold">Dismiss</button>
        </div>
      )}

      {/* KPI Summary Bar */}
      <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-3 sm:gap-4">
        <div className="p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <p className="text-xs opacity-70 font-medium">Total Tasks</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: themeColors.text }}>{metrics.total}</p>
        </div>
        <div className="p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <p className="text-xs opacity-70 font-medium">In Progress</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: themeColors.warning }}>{metrics.inProgress}</p>
        </div>
        <div className="p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <p className="text-xs opacity-70 font-medium">Completed / Approved</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: themeColors.success }}>{metrics.completed}</p>
        </div>
        <div className="p-4 rounded-2xl border transition-all hover:scale-[1.02]" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <p className="text-xs opacity-70 font-medium">Pending / Assigned</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: themeColors.accent || '#8b5cf6' }}>{metrics.pending}</p>
        </div>
        <div className="p-4 rounded-2xl border transition-all hover:scale-[1.02] col-span-2 sm:col-span-1" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <p className="text-xs opacity-70 font-medium">Overdue</p>
          <p className="text-2xl font-extrabold mt-1" style={{ color: themeColors.danger }}>{metrics.overdue}</p>
        </div>
      </div>

      {/* Period Tabs & Main Controls Card */}
      <div className="p-5 rounded-2xl border space-y-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        {/* Top Filter Bar: Period Selector + Export & View Toggle */}
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          {/* Period View Pill Buttons */}
          <div className="flex items-center gap-1.5 p-1 rounded-xl border overflow-x-auto" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
            <button
              onClick={() => handlePeriodChange('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                period === 'all' ? 'shadow text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'all' ? themeColors.primary : 'transparent' }}
            >
              All Time
            </button>
            <button
              onClick={() => handlePeriodChange('daily')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                period === 'daily' ? 'shadow text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'daily' ? themeColors.primary : 'transparent' }}
            >
              📅 Daily Wise
            </button>
            <button
              onClick={() => handlePeriodChange('monthly')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                period === 'monthly' ? 'shadow text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'monthly' ? themeColors.primary : 'transparent' }}
            >
              📊 Monthly Wise
            </button>
            <button
              onClick={() => handlePeriodChange('custom')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all whitespace-nowrap ${
                period === 'custom' ? 'shadow text-white' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'custom' ? themeColors.primary : 'transparent' }}
            >
              📆 Date Range
            </button>
          </div>

          {/* Quick Actions */}
          <div className="flex items-center gap-2 self-end md:self-auto">
            <button
              onClick={handleExportCSV}
              disabled={tasks.length === 0}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105 disabled:opacity-50"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              title="Download CSV report"
            >
              <Download size={14} /> Export CSV
            </button>

            <button
              onClick={handleResetFilters}
              className="flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold transition-all hover:scale-105"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              title="Reset all filters"
            >
              <RotateCcw size={14} /> Reset
            </button>

            <div className="flex border rounded-xl overflow-hidden" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setViewMode('grid')}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === 'grid' ? themeColors.primary : themeColors.background,
                  color: viewMode === 'grid' ? 'white' : themeColors.text
                }}
              >
                <Grid size={16} />
              </button>
              <button
                onClick={() => setViewMode('table')}
                className="p-2 transition-colors"
                style={{
                  backgroundColor: viewMode === 'table' ? themeColors.primary : themeColors.background,
                  color: viewMode === 'table' ? 'white' : themeColors.text
                }}
              >
                <Table size={16} />
              </button>
            </div>

            <button
              onClick={fetchTasks}
              className="p-2 rounded-xl border transition-all hover:scale-105"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              title="Refresh"
            >
              <RefreshCw size={16} />
            </button>
          </div>
        </div>

        {/* Dynamic Period Date Controls */}
        {period === 'daily' && (
          <div className="p-3 rounded-xl border flex flex-wrap items-center gap-3 text-xs" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
            <span className="font-semibold opacity-70">Daily Preset:</span>
            <button
              onClick={() => handleDailyPreset('today')}
              className={`px-2.5 py-1 rounded-md font-medium border ${
                dailyPreset === 'today' ? 'bg-primary text-white border-transparent' : 'border-gray-300 dark:border-gray-700'
              }`}
              style={{ backgroundColor: dailyPreset === 'today' ? themeColors.primary : 'transparent', color: dailyPreset === 'today' ? 'white' : themeColors.text }}
            >
              Today
            </button>
            <button
              onClick={() => handleDailyPreset('yesterday')}
              className={`px-2.5 py-1 rounded-md font-medium border ${
                dailyPreset === 'yesterday' ? 'bg-primary text-white border-transparent' : 'border-gray-300 dark:border-gray-700'
              }`}
              style={{ backgroundColor: dailyPreset === 'yesterday' ? themeColors.primary : 'transparent', color: dailyPreset === 'yesterday' ? 'white' : themeColors.text }}
            >
              Yesterday
            </button>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="opacity-70">Select Date:</span>
              <input
                type="date"
                value={filters.date || getTodayStr()}
                onChange={(e) => {
                  setDailyPreset('custom');
                  handleFilterChange('date', e.target.value);
                }}
                className="p-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
          </div>
        )}

        {period === 'monthly' && (
          <div className="p-3 rounded-xl border flex flex-wrap items-center gap-3 text-xs" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
            <span className="font-semibold opacity-70">Monthly Preset:</span>
            <button
              onClick={() => handleMonthlyPreset('this_month')}
              className={`px-2.5 py-1 rounded-md font-medium border ${
                monthlyPreset === 'this_month' ? 'bg-primary text-white border-transparent' : 'border-gray-300 dark:border-gray-700'
              }`}
              style={{ backgroundColor: monthlyPreset === 'this_month' ? themeColors.primary : 'transparent', color: monthlyPreset === 'this_month' ? 'white' : themeColors.text }}
            >
              This Month
            </button>
            <button
              onClick={() => handleMonthlyPreset('last_month')}
              className={`px-2.5 py-1 rounded-md font-medium border ${
                monthlyPreset === 'last_month' ? 'bg-primary text-white border-transparent' : 'border-gray-300 dark:border-gray-700'
              }`}
              style={{ backgroundColor: monthlyPreset === 'last_month' ? themeColors.primary : 'transparent', color: monthlyPreset === 'last_month' ? 'white' : themeColors.text }}
            >
              Last Month
            </button>
            <div className="flex items-center gap-1.5 ml-auto">
              <span className="opacity-70">Select Month:</span>
              <input
                type="month"
                value={filters.month || getThisMonthStr()}
                onChange={(e) => {
                  setMonthlyPreset('custom');
                  handleFilterChange('month', e.target.value);
                }}
                className="p-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
          </div>
        )}

        {period === 'custom' && (
          <div className="p-3 rounded-xl border flex flex-wrap items-center gap-3 text-xs" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
            <span className="font-semibold opacity-70">Custom Date Range:</span>
            <div className="flex items-center gap-2">
              <span>From:</span>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="p-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
            <div className="flex items-center gap-2">
              <span>To:</span>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="p-1.5 rounded-lg border text-xs focus:outline-none"
                style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border, color: themeColors.text }}
              />
            </div>
          </div>
        )}

        {/* Detailed Filters Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-3 pt-2">
          {/* Search Box */}
          <div className="relative sm:col-span-2">
            <Search size={15} className="absolute left-3 top-1/2 -translate-y-1/2 opacity-50" />
            <input
              type="text"
              placeholder="Search title, TL, employee name..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="w-full pl-9 pr-3 py-2 rounded-xl border text-xs focus:outline-none focus:ring-1 focus:ring-primary"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          </div>

          {/* Team Leader Filter (HR/Manager) */}
          {(isManager || isHR) && (
            <select
              value={filters.assignedBy}
              onChange={(e) => handleFilterChange('assignedBy', e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="">All Team Leaders</option>
              {teamLeaders.map(tl => (
                <option key={tl._id} value={tl._id}>
                  TL: {tl.name?.first} {tl.name?.last} {tl.employeeId ? `(${tl.employeeId})` : ''}
                </option>
              ))}
            </select>
          )}

          {/* Assigned Employee Filter */}
          <select
            value={filters.assignedTo}
            onChange={(e) => handleFilterChange('assignedTo', e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Assignees</option>
            {employees.map(emp => (
              <option key={emp._id} value={emp._id}>
                {emp.name?.first} {emp.name?.last} {emp.employeeId ? `(${emp.employeeId})` : ''}
              </option>
            ))}
          </select>

          {/* Task Type Filter */}
          <select
            value={filters.taskType}
            onChange={(e) => handleFilterChange('taskType', e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Task Types</option>
            {taskTypes.map(t => (
              <option key={t._id} value={t._id}>{t.name}</option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Statuses</option>
            <option value="New">New</option>
            <option value="Assigned">Assigned</option>
            <option value="In Progress">In Progress</option>
            <option value="Pending">Pending</option>
            <option value="Completed">Completed</option>
            <option value="Approved">Approved</option>
            <option value="Rejected">Rejected</option>
          </select>

          {/* Priority Filter */}
          <select
            value={filters.priority}
            onChange={(e) => handleFilterChange('priority', e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Priorities</option>
            <option value="Low">Low</option>
            <option value="Medium">Medium</option>
            <option value="High">High</option>
            <option value="Urgent">Urgent</option>
          </select>

          {/* Deadline Filter */}
          <select
            value={filters.deadlineStatus}
            onChange={(e) => handleFilterChange('deadlineStatus', e.target.value)}
            className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Deadlines</option>
            <option value="overdue">Overdue</option>
            <option value="urgent">Urgent (&lt;24h)</option>
            <option value="approaching">Approaching (&lt;3d)</option>
            <option value="completed">Completed</option>
          </select>

          {/* Active / Deleted Filter */}
          {(isManager || isHR) && (
            <select
              value={filters.isActive}
              onChange={(e) => handleFilterChange('isActive', e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="true">Active Tasks</option>
              <option value="false">Deleted Tasks</option>
            </select>
          )}

          {/* Date Field Target */}
          {period !== 'all' && (
            <select
              value={filters.dateField}
              onChange={(e) => handleFilterChange('dateField', e.target.value)}
              className="px-3 py-2 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="createdAt">Filter by Created Date</option>
              <option value="deadline">Filter by Deadline</option>
              <option value="dueDate">Filter by Due Date</option>
            </select>
          )}
        </div>
      </div>

      {/* Results Header */}
      <div className="flex items-center justify-between text-xs opacity-80 px-1">
        <span>
          Showing <b>{tasks.length}</b> of <b>{pagination.totalTasks}</b> tasks
          {period === 'daily' && ` (Daily: ${filters.date || 'Today'})`}
          {period === 'monthly' && ` (Monthly: ${filters.month || 'This Month'})`}
          {period === 'custom' && ` (Range: ${filters.startDate || 'start'} to ${filters.endDate || 'end'})`}
        </span>
        <span>Sorted by: {sortConfig.key} ({sortConfig.direction})</span>
      </div>

      {/* Task Content Grid or Table */}
      <div>
        {loading ? (
          <div className="flex flex-col items-center justify-center h-48 gap-3">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: themeColors.primary }} />
            <p className="text-xs opacity-70">Fetching tasks...</p>
          </div>
        ) : tasks.length === 0 ? (
          <div 
            className="text-center py-16 rounded-2xl border"
            style={{ 
              backgroundColor: themeColors.surface,
              borderColor: themeColors.border,
              color: themeColors.textSecondary
            }}
          >
            <ClipboardList size={48} className="mx-auto mb-3 opacity-40" />
            <p className="text-base font-bold mb-1" style={{ color: themeColors.text }}>No tasks found</p>
            <p className="text-xs max-w-sm mx-auto">
              {filters.isActive === 'false' 
                ? 'No deleted tasks match your current filters.' 
                : 'No tasks found for the selected team leader, date, or filters.'}
            </p>
            <button
              onClick={handleResetFilters}
              className="mt-4 px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
              style={{ backgroundColor: themeColors.primary }}
            >
              Clear Filters
            </button>
          </div>
        ) : viewMode === 'grid' ? (
          <GridView />
        ) : (
          <TableView />
        )}
      </div>

      {/* Pagination */}
      {pagination.totalPages > 1 && (
        <div className="flex justify-center items-center gap-2 pt-4">
          <button
            onClick={() => handleFilterChange('page', pagination.page - 1)}
            disabled={pagination.page === 1}
            className="px-3 py-1.5 rounded-xl border text-xs disabled:opacity-40 transition-all hover:scale-105"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            ← Previous
          </button>
          
          <span className="text-xs font-medium px-3">
            Page {pagination.page} of {pagination.totalPages}
          </span>

          <button
            onClick={() => handleFilterChange('page', pagination.page + 1)}
            disabled={pagination.page === pagination.totalPages}
            className="px-3 py-1.5 rounded-xl border text-xs disabled:opacity-40 transition-all hover:scale-105"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            Next →
          </button>
        </div>
      )}

      {/* Task History Modal */}
      {showHistory && selectedTask && (
        <div 
          className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn"
          onClick={() => setShowHistory(false)}
        >
          <div 
            className="rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto border"
            style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b flex items-start justify-between" style={{ borderColor: themeColors.border }}>
              <div>
                <h2 className="text-lg font-bold" style={{ color: themeColors.text }}>
                  Task History &amp; Audit Trail
                </h2>
                <p className="text-xs opacity-75 mt-1 font-medium">{selectedTask.title}</p>
              </div>
              <button 
                onClick={() => setShowHistory(false)}
                className="p-1.5 rounded-lg hover:opacity-75"
                style={{ backgroundColor: themeColors.background }}
              >
                ✕
              </button>
            </div>
            
            <div className="p-6">
              <TaskHistory task={selectedTask} />
            </div>

            <div className="p-5 border-t flex justify-end" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setShowHistory(false)}
                className="px-4 py-2 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105"
                style={{ backgroundColor: themeColors.primary }}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default TaskList;
