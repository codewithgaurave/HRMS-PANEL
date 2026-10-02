// src/components/tasks/TaskDashboard.jsx
import React, { useState, useEffect } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { useAuth } from '../../context/AuthContext';
import taskAPI from '../../apis/taskAPI';
import { 
  ClipboardList, 
  Clock, 
  CheckCircle, 
  AlertCircle, 
  TrendingUp, 
  Users, 
  AlertTriangle, 
  Calendar,
  CalendarDays,
  UserCheck,
  RefreshCw,
  Award,
  Layers
} from 'lucide-react';

const TaskDashboard = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const isHR = user?.role === 'HR_Manager';

  const [stats, setStats] = useState(null);
  const [alerts, setAlerts] = useState({ overdue: [], upcoming: [] });
  const [teamLeaders, setTeamLeaders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Dashboard Filters
  const [period, setPeriod] = useState('all'); // 'all' | 'daily' | 'monthly' | 'custom'
  const [selectedTL, setSelectedTL] = useState('');
  const [customDate, setCustomDate] = useState('');
  const [customMonth, setCustomMonth] = useState('');

  const getTodayStr = () => new Date().toISOString().split('T')[0];
  const getThisMonthStr = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}`;
  };

  useEffect(() => {
    fetchAssignableOptions();
    fetchAlerts();
  }, []);

  useEffect(() => {
    fetchTaskStats();
  }, [period, selectedTL, customDate, customMonth]);

  const fetchAssignableOptions = async () => {
    try {
      const res = await taskAPI.getAssignableEmployees();
      if (res.data?.teamLeaders) {
        setTeamLeaders(res.data.teamLeaders);
      }
    } catch (err) {
      console.error('Error fetching TL options:', err);
    }
  };

  const fetchAlerts = async () => {
    try {
      const res = await taskAPI.getDeadlineAlerts();
      if (res.data?.alerts) {
        setAlerts(res.data.alerts);
      }
    } catch (err) {
      console.error('Error fetching alerts:', err);
    }
  };

  const fetchTaskStats = async () => {
    try {
      setLoading(true);
      setError('');

      const params = {};
      if (selectedTL) params.assignedBy = selectedTL;

      if (period === 'daily') {
        params.period = 'daily';
        params.date = customDate || getTodayStr();
      } else if (period === 'monthly') {
        params.period = 'monthly';
        params.month = customMonth || getThisMonthStr();
      }

      const response = await taskAPI.getStats(params);
      setStats(response.data.stats);
    } catch (err) {
      setError('Failed to fetch task statistics');
      console.error('Error fetching stats:', err);
    } finally {
      setLoading(false);
    }
  };

  const StatCard = ({ title, value, subtitle, icon, color, badge }) => (
    <div 
      className="p-5 rounded-2xl border transition-all hover:scale-[1.02] hover:shadow-md cursor-pointer flex flex-col justify-between"
      style={{ 
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        color: themeColors.text
      }}
    >
      <div className="flex items-center justify-between mb-2">
        <p className="text-xs font-bold uppercase tracking-wider opacity-70">{title}</p>
        <div 
          className="p-2.5 rounded-xl"
          style={{ backgroundColor: color + '20' }}
        >
          {React.cloneElement(icon, { size: 20, style: { color } })}
        </div>
      </div>
      <div>
        <div className="flex items-baseline gap-2">
          <p className="text-3xl font-extrabold">{value}</p>
          {badge && (
            <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full" style={{ backgroundColor: color + '20', color }}>
              {badge}
            </span>
          )}
        </div>
        {subtitle && (
          <p className="text-xs opacity-60 mt-1">{subtitle}</p>
        )}
      </div>
    </div>
  );

  const ProgressBar = ({ label, value, max, color }) => {
    const percentage = max > 0 ? Math.round((value / max) * 100) : 0;
    return (
      <div className="mb-3.5 last:mb-0">
        <div className="flex justify-between text-xs mb-1.5 font-medium">
          <span style={{ color: themeColors.text }}>{label}</span>
          <span style={{ color: themeColors.textSecondary }}>
            {value} / {max} <span className="opacity-60 ml-1">({percentage}%)</span>
          </span>
        </div>
        <div 
          className="h-2 rounded-full overflow-hidden"
          style={{ backgroundColor: themeColors.border + '50' }}
        >
          <div 
            className="h-full rounded-full transition-all duration-500"
            style={{ 
              backgroundColor: color,
              width: `${percentage}%`
            }}
          />
        </div>
      </div>
    );
  };

  const statusColors = {
    'New': themeColors.textSecondary,
    'Assigned': themeColors.primary,
    'In Progress': themeColors.warning,
    'Pending': themeColors.accent || '#8b5cf6',
    'Completed': themeColors.success,
    'Approved': themeColors.success,
    'Rejected': themeColors.danger
  };

  const priorityColors = {
    'Low': themeColors.success,
    'Medium': themeColors.accent || '#3b82f6',
    'High': themeColors.warning,
    'Urgent': themeColors.danger
  };

  const statusData = stats?.statusStats || [];
  const priorityData = stats?.priorityStats || [];
  const teamLeaderStats = stats?.teamLeaderStats || [];
  const totalTasks = stats?.totalTasks || 0;

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

      {/* Dashboard Top Filter Bar */}
      <div className="p-5 rounded-2xl border flex flex-col md:flex-row items-start md:items-center justify-between gap-4" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
        <div className="flex flex-wrap items-center gap-2">
          {/* Period Selection */}
          <div className="flex items-center gap-1 p-1 rounded-xl border" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
            <button
              onClick={() => setPeriod('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'all' ? 'text-white shadow' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'all' ? themeColors.primary : 'transparent' }}
            >
              All Time
            </button>
            <button
              onClick={() => {
                setPeriod('daily');
                if (!customDate) setCustomDate(getTodayStr());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'daily' ? 'text-white shadow' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'daily' ? themeColors.primary : 'transparent' }}
            >
              📅 Daily Wise
            </button>
            <button
              onClick={() => {
                setPeriod('monthly');
                if (!customMonth) setCustomMonth(getThisMonthStr());
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                period === 'monthly' ? 'text-white shadow' : 'opacity-70 hover:opacity-100'
              }`}
              style={{ backgroundColor: period === 'monthly' ? themeColors.primary : 'transparent' }}
            >
              📊 Monthly Wise
            </button>
          </div>

          {/* Daily Date Selector */}
          {period === 'daily' && (
            <input
              type="date"
              value={customDate || getTodayStr()}
              onChange={(e) => setCustomDate(e.target.value)}
              className="p-1.5 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          )}

          {/* Monthly Date Selector */}
          {period === 'monthly' && (
            <input
              type="month"
              value={customMonth || getThisMonthStr()}
              onChange={(e) => setCustomMonth(e.target.value)}
              className="p-1.5 rounded-xl border text-xs focus:outline-none"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            />
          )}
        </div>

        <div className="flex items-center gap-3 w-full md:w-auto justify-between md:justify-end">
          {/* Team Leader Filter for HR */}
          {isHR && (
            <div className="flex items-center gap-1.5">
              <span className="text-xs opacity-70">Team Leader:</span>
              <select
                value={selectedTL}
                onChange={(e) => setSelectedTL(e.target.value)}
                className="px-3 py-1.5 rounded-xl border text-xs focus:outline-none"
                style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
              >
                <option value="">All Team Leaders</option>
                {teamLeaders.map(tl => (
                  <option key={tl._id} value={tl._id}>
                    {tl.name?.first} {tl.name?.last}
                  </option>
                ))}
              </select>
            </div>
          )}

          <button
            onClick={fetchTaskStats}
            className="p-2 rounded-xl border transition-all hover:scale-105"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            title="Refresh Stats"
          >
            <RefreshCw size={15} />
          </button>
        </div>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center h-56 gap-3">
          <div className="animate-spin rounded-full h-10 w-10 border-b-2" style={{ borderColor: themeColors.primary }} />
          <p className="text-xs opacity-70">Loading task statistics...</p>
        </div>
      ) : (
        <>
          {/* Main KPI Stats Grid */}
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
            <StatCard
              title={period === 'daily' ? "Tasks (Selected Date)" : period === 'monthly' ? "Tasks (Selected Month)" : "Total Active Tasks"}
              value={stats?.totalTasks || 0}
              subtitle={selectedTL ? "Filtered by selected Team Leader" : "Across all teams"}
              icon={<ClipboardList />}
              color={themeColors.primary}
            />
            <StatCard
              title="Today's Tasks"
              value={stats?.todayTasks || 0}
              subtitle="Created today"
              icon={<CalendarDays />}
              color={themeColors.accent || '#3b82f6'}
              badge="Daily"
            />
            <StatCard
              title="This Month's Tasks"
              value={stats?.thisMonthTasks || 0}
              subtitle="Created in current month"
              icon={<Calendar />}
              color={themeColors.success}
              badge="Monthly"
            />
            <StatCard
              title="Overdue Tasks"
              value={stats?.overdueTasks || 0}
              subtitle="Passed deadline"
              icon={<AlertTriangle />}
              color={themeColors.danger}
              badge="Attention"
            />
          </div>

          {/* Breakdown Grids */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Breakdown */}
            <div 
              className="p-6 rounded-2xl border"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                <Layers size={18} style={{ color: themeColors.primary }} />
                Tasks by Status
              </h3>
              {statusData.length === 0 ? (
                <p className="text-xs opacity-60 text-center py-6">No tasks found for current period</p>
              ) : (
                <div className="space-y-1">
                  {statusData.map(item => (
                    <ProgressBar
                      key={item._id}
                      label={item._id}
                      value={item.count}
                      max={totalTasks}
                      color={statusColors[item._id] || themeColors.primary}
                    />
                  ))}
                </div>
              )}
            </div>

            {/* Priority Breakdown */}
            <div 
              className="p-6 rounded-2xl border"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <h3 className="text-base font-bold mb-4 flex items-center gap-2" style={{ color: themeColors.text }}>
                <Award size={18} style={{ color: themeColors.warning }} />
                Tasks by Priority
              </h3>
              {priorityData.length === 0 ? (
                <p className="text-xs opacity-60 text-center py-6">No tasks found for current period</p>
              ) : (
                <div className="space-y-1">
                  {priorityData.map(item => (
                    <ProgressBar
                      key={item._id}
                      label={item._id}
                      value={item.count}
                      max={totalTasks}
                      color={priorityColors[item._id] || themeColors.primary}
                    />
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* HR Only: Team Leader Breakdown Table */}
          {isHR && (
            <div 
              className="p-6 rounded-2xl border"
              style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
            >
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h3 className="text-base font-bold flex items-center gap-2" style={{ color: themeColors.text }}>
                    <UserCheck size={18} style={{ color: themeColors.primary }} />
                    Team Leader Task Assignment &amp; Performance
                  </h3>
                  <p className="text-xs opacity-70 mt-0.5">Tasks created and managed by each Team Leader</p>
                </div>
              </div>

              {teamLeaderStats.length === 0 ? (
                <p className="text-xs opacity-60 text-center py-6">No team leader data available</p>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead>
                      <tr className="border-b font-bold uppercase tracking-wider opacity-70" style={{ borderColor: themeColors.border }}>
                        <th className="py-3 px-4">Team Leader</th>
                        <th className="py-3 px-4 text-center">Total Assigned</th>
                        <th className="py-3 px-4 text-center">Completed</th>
                        <th className="py-3 px-4 text-center">In Progress</th>
                        <th className="py-3 px-4 text-center">Pending</th>
                        <th className="py-3 px-4 text-right">Completion Rate</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
                      {teamLeaderStats.map(tl => {
                        const compRate = tl.totalTasks > 0 ? Math.round((tl.completedTasks / tl.totalTasks) * 100) : 0;
                        return (
                          <tr key={tl._id} className="hover:bg-black/5 dark:hover:bg-white/5 transition-colors">
                            <td className="py-3.5 px-4 font-semibold">
                              <div className="text-sm">
                                {tl.name ? `${tl.name.first} ${tl.name.last}` : 'Direct HR / Admin'}
                              </div>
                              {tl.employeeId && (
                                <div className="text-[11px] opacity-60 font-normal">ID: {tl.employeeId}</div>
                              )}
                            </td>
                            <td className="py-3.5 px-4 text-center font-bold text-sm">{tl.totalTasks}</td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: themeColors.success + '20', color: themeColors.success }}>
                                {tl.completedTasks}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: themeColors.warning + '20', color: themeColors.warning }}>
                                {tl.inProgressTasks}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-center">
                              <span className="px-2 py-0.5 rounded-full font-semibold" style={{ backgroundColor: (themeColors.accent || '#8b5cf6') + '20', color: themeColors.accent || '#8b5cf6' }}>
                                {tl.pendingTasks}
                              </span>
                            </td>
                            <td className="py-3.5 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <div className="w-20 h-2 rounded-full overflow-hidden bg-gray-200 dark:bg-gray-700">
                                  <div className="h-full rounded-full" style={{ width: `${compRate}%`, backgroundColor: themeColors.success }} />
                                </div>
                                <span className="font-bold">{compRate}%</span>
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default TaskDashboard;