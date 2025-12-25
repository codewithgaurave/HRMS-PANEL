// src/pages/Dashboard.jsx
import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import dashboardAPI from "../apis/dashboardAPI";
import attendanceAPI from "../apis/attendanceAPI";
import { getCurrentLocation } from "../utils/locationUtils";
import { toast } from "sonner";
import {
  Users,
  Calendar,
  TrendingUp,
  Clock,
  Building,
  Briefcase,
  BarChart3,
  ArrowUp,
  ArrowDown,
  MapPin,
  Navigation,
  LogIn,
  LogOut
} from "lucide-react";

// Chart components
import {
  LineChart,
  Line,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from 'recharts';

const Dashboard = () => {
  const { themeColors } = useTheme();
  const [stats, setStats] = useState(null);
  const [analytics, setAnalytics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [time, setTime] = useState(new Date());

  // Punch in/out states
  const [punchLoading, setPunchLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [currentLocation, setCurrentLocation] = useState(null);
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [showPunchConfirmation, setShowPunchConfirmation] = useState(null);

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  useEffect(() => {
    fetchDashboardData();
    fetchTodayAttendance();
    fetchCurrentLocation();
  }, []);

  const fetchDashboardData = async () => {
    try {
      setLoading(true);
      console.log('Fetching dashboard data...');
      const [statsResponse, analyticsResponse] = await Promise.all([
        dashboardAPI.getDashboardStats(),
        dashboardAPI.getDashboardAnalytics('month')
      ]);
      
      console.log('Stats response:', statsResponse.data);
      console.log('Analytics response:', analyticsResponse.data);
      
      setStats(statsResponse.data.stats);
      setAnalytics(analyticsResponse.data.analytics);
    } catch (err) {
      console.error('Dashboard fetch error:', err);
      setError(err.response?.data?.message || "Failed to fetch dashboard data");
      toast.error("Failed to load dashboard data");
    } finally {
      setLoading(false);
    }
  };

  const fetchTodayAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getTodayAttendance();
      setTodayAttendance(data.attendance);
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
    }
  };

  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      return location;
    } catch (err) {
      toast.error(`Location Error: ${err.message}`);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  const handlePunchAction = async (action) => {
    try {
      setPunchLoading(true);

      const location = await fetchCurrentLocation();
      if (!location) {
        toast.error("Unable to get your location. Please enable location services.");
        return;
      }

      const punchData = {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      let response;
      if (action === 'in') {
        response = await attendanceAPI.punchIn(punchData);
        toast.success("Punch in successful! Have a productive day.");
      } else {
        response = await attendanceAPI.punchOut(punchData);
        toast.success("Punch out successful! Have a great evening.");
      }

      setTodayAttendance(response.data.attendance);
      setShowPunchConfirmation(null);
      
      // Refresh dashboard data
      fetchDashboardData();
      
    } catch (err) {
      const errorMessage = err.response?.data?.message || err.message || `${action === 'in' ? 'Punch in' : 'Punch out'} failed`;
      toast.error(errorMessage);
    } finally {
      setPunchLoading(false);
    }
  };

  const confirmPunchAction = (action) => {
    setShowPunchConfirmation(action);
  };

  const cancelPunchAction = () => {
    setShowPunchConfirmation(null);
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-4 rounded-lg border" style={{ 
        backgroundColor: themeColors.danger + '20', 
        borderColor: themeColors.danger,
        color: themeColors.danger
      }}>
        {error}
      </div>
    );
  }

  if (!stats || !analytics) return null;

  // Prepare chart data from API
  const attendanceTrendData = analytics.attendanceTrend || [];
  const departmentDistributionData = analytics.departmentDistribution || [];
  const leaveTrendData = analytics.leaveTrend || [];

  // Format time for display
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  return (
    <div className="space-y-6 p-4">
      {/* Header with Date/Time */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold" style={{ color: themeColors.text }}>
            Dashboard Overview
          </h1>
          <p className="text-sm mt-1" style={{ color: themeColors.text }}>
            {time.toLocaleDateString('en-US', { 
              weekday: 'long', 
              year: 'numeric', 
              month: 'long', 
              day: 'numeric' 
            })}
          </p>
        </div>
        <div className="text-lg font-medium mt-2 md:mt-0" style={{ color: themeColors.primary }}>
          {time.toLocaleTimeString('en-US', { 
            hour: '2-digit', 
            minute: '2-digit',
            second: '2-digit'
          })}
        </div>
      </div>

      {/* Punch In/Out Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Status */}
        <div className="p-6 rounded-lg border" style={{ 
          backgroundColor: themeColors.surface, 
          borderColor: themeColors.border 
        }}>
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold" style={{ color: themeColors.text }}>Today's Status</h3>
              <p className="text-sm" style={{ color: themeColors.text }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'short', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {todayAttendance ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: themeColors.text }}>Punch In:</span>
                <span className="font-medium" style={{ color: themeColors.text }}>
                  {formatTime(todayAttendance.punchIn?.timestamp)}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: themeColors.text }}>Punch Out:</span>
                <span className="font-medium" style={{ color: themeColors.text }}>
                  {todayAttendance.punchOut?.timestamp 
                    ? formatTime(todayAttendance.punchOut.timestamp)
                    : '--:--'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: themeColors.text }}>Status:</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  todayAttendance.status === 'Present' ? 'bg-green-100 text-green-800' :
                  todayAttendance.status === 'Late' ? 'bg-yellow-100 text-yellow-800' :
                  todayAttendance.status === 'Absent' ? 'bg-red-100 text-red-800' :
                  'bg-gray-100 text-gray-800'
                }`}>
                  {todayAttendance.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm" style={{ color: themeColors.text }}>Work Hours:</span>
                <span className="font-medium" style={{ color: themeColors.text }}>
                  {todayAttendance.totalWorkHours?.toFixed(2) || '0'}h
                </span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: themeColors.text }}>
              <p>No attendance recorded for today</p>
            </div>
          )}
        </div>

        {/* Quick Actions */}
        <div className="p-6 rounded-lg border" style={{ 
          backgroundColor: themeColors.surface, 
          borderColor: themeColors.border 
        }}>
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold" style={{ color: themeColors.text }}>Quick Actions</h3>
              <p className="text-sm" style={{ color: themeColors.text }}>Mark your attendance</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={() => confirmPunchAction('in')}
              disabled={punchLoading || locationLoading || (todayAttendance && todayAttendance.punchIn)}
              className="w-full py-3 rounded-lg font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColors.success }}
            >
              <LogIn size={18} />
              {todayAttendance?.punchIn ? 'Already Punched In' : 'Punch In'}
            </button>
            
            <button
              onClick={() => confirmPunchAction('out')}
              disabled={punchLoading || locationLoading || !todayAttendance?.punchIn || todayAttendance?.punchOut}
              className="w-full py-3 rounded-lg font-medium text-white transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColors.danger }}
            >
              <LogOut size={18} />
              {todayAttendance?.punchOut ? 'Already Punched Out' : 'Punch Out'}
            </button>
          </div>

          {/* Location Status */}
          {currentLocation && (
            <div className="mt-4 p-3 rounded-lg flex items-center gap-2 text-sm" style={{ 
              backgroundColor: themeColors.info + '10',
              color: themeColors.info
            }}>
              <MapPin size={16} />
              <span>Location: {currentLocation.address}</span>
            </div>
          )}
        </div>

        {/* Location Actions */}
        <div className="p-6 rounded-lg border" style={{ 
          backgroundColor: themeColors.surface, 
          borderColor: themeColors.border 
        }}>
          <div className="flex items-center gap-3 mb-4">
            <Navigation size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold" style={{ color: themeColors.text }}>Location Services</h3>
              <p className="text-sm" style={{ color: themeColors.text }}>Manage your location</p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={fetchCurrentLocation}
              disabled={locationLoading}
              className="w-full py-3 rounded-lg font-medium transition-all hover:scale-105 disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:scale-100 flex items-center justify-center gap-2 border"
              style={{ 
                backgroundColor: themeColors.background,
                borderColor: themeColors.border,
                color: themeColors.text
              }}
            >
              <Navigation size={18} className={locationLoading ? "animate-spin" : ""} />
              {locationLoading ? 'Getting Location...' : 'Refresh Location'}
            </button>

            {/* Current Location Info */}
            {currentLocation && (
              <div className="p-3 rounded-lg text-xs space-y-1" style={{ 
                backgroundColor: themeColors.background,
                color: themeColors.text
              }}>
                <div className="flex justify-between">
                  <span>Latitude:</span>
                  <span>{currentLocation.latitude?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Longitude:</span>
                  <span>{currentLocation.longitude?.toFixed(6)}</span>
                </div>
                <div className="flex justify-between">
                  <span>Accuracy:</span>
                  <span>±{currentLocation.accuracy?.toFixed(1)}m</span>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Punch Confirmation Modal */}
      {showPunchConfirmation && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg p-6 max-w-md w-full" style={{ 
            backgroundColor: themeColors.surface,
            color: themeColors.text
          }}>
            <h3 className="text-lg font-semibold mb-4">
              Confirm {showPunchConfirmation === 'in' ? 'Punch In' : 'Punch Out'}
            </h3>
            
            <div className="space-y-3 mb-6">
              <p>Are you sure you want to {showPunchConfirmation === 'in' ? 'punch in' : 'punch out'}?</p>
              
              {currentLocation && (
                <div className="p-3 rounded-lg text-sm" style={{ 
                  backgroundColor: themeColors.background 
                }}>
                  <div className="flex items-center gap-2 mb-2">
                    <MapPin size={14} />
                    <span className="font-medium">Location:</span>
                  </div>
                  <p className="text-xs">{currentLocation.address}</p>
                  <p className="text-xs opacity-75 mt-1">
                    Coordinates: {currentLocation.latitude?.toFixed(4)}, {currentLocation.longitude?.toFixed(4)}
                  </p>
                </div>
              )}
              
              <div className="flex items-center gap-2 text-sm" style={{ color: themeColors.text }}>
                <Clock size={14} />
                <span>Time: {new Date().toLocaleTimeString()}</span>
              </div>
            </div>

            <div className="flex gap-3">
              <button
                onClick={cancelPunchAction}
                disabled={punchLoading}
                className="flex-1 py-2 rounded-lg border font-medium transition-colors disabled:opacity-50"
                style={{ 
                  backgroundColor: themeColors.background,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              >
                Cancel
              </button>
              <button
                onClick={() => handlePunchAction(showPunchConfirmation)}
                disabled={punchLoading}
                className="flex-1 py-2 rounded-lg font-medium text-white transition-colors disabled:opacity-50 flex items-center justify-center gap-2"
                style={{ 
                  backgroundColor: showPunchConfirmation === 'in' ? themeColors.success : themeColors.danger
                }}
              >
                {punchLoading ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                    Processing...
                  </>
                ) : (
                  <>
                    {showPunchConfirmation === 'in' ? <LogIn size={16} /> : <LogOut size={16} />}
                    Confirm {showPunchConfirmation === 'in' ? 'Punch In' : 'Punch Out'}
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <StatCard
          icon={<Users size={24} />}
          title="Total Employees"
          value={stats.overview.totalEmployees}
          change={stats.overview.employeeGrowth}
          subtitle={`${stats.overview.activeEmployees} active`}
          color="blue"
        />
        <StatCard
          icon={<Calendar size={24} />}
          title="Today's Attendance"
          value={`${stats.attendance.today.rate}%`}
          change={stats.attendance.today.change}
          subtitle={`${stats.attendance.today.present} present`}
          color="green"
        />
        <StatCard
          icon={<Building size={24} />}
          title="Pending Leaves"
          value={stats.overview.pendingLeaves}
          change={stats.overview.leaveChange}
          subtitle="Requires approval"
          color="orange"
        />
        <StatCard
          icon={<TrendingUp size={24} />}
          title="Monthly Average"
          value={`${stats.quickStats.averageAttendance}%`}
          change={stats.quickStats.attendanceChange}
          subtitle="Attendance rate"
          color="purple"
        />
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <ChartCard 
          title="Attendance Trend (Last 30 Days)"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={attendanceTrendData}>
              <CartesianGrid strokeDasharray="3 3" stroke={themeColors.border} />
              <XAxis 
                dataKey="date" 
                stroke={themeColors.textSecondary}
                fontSize={12}
              />
              <YAxis 
                stroke={themeColors.textSecondary}
                fontSize={12}
              />
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              />
              <Legend />
              <Line 
                type="monotone" 
                dataKey="present" 
                stroke={themeColors.success} 
                strokeWidth={2}
                name="Present"
              />
              <Line 
                type="monotone" 
                dataKey="absent" 
                stroke={themeColors.danger} 
                strokeWidth={2}
                name="Absent"
              />
            </LineChart>
          </ResponsiveContainer>
        </ChartCard>

        {/* Department Distribution */}
        <ChartCard 
          title="Department Distribution"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={departmentDistributionData}
                cx="50%"
                cy="50%"
                labelLine={false}
                label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {departmentDistributionData.map((entry, index) => (
                  <Cell key={`cell-${index}`} fill={getDepartmentColor(index, themeColors)} />
                ))}
              </Pie>
              <Tooltip 
                contentStyle={{ 
                  backgroundColor: themeColors.surface,
                  borderColor: themeColors.border,
                  color: themeColors.text
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </ChartCard>
      </div>

      {/* Detailed Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Breakdown */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Today's Attendance</h3>
          <div className="space-y-4">
            <AttendanceProgress 
              status="Present" 
              count={stats.attendance.today.present} 
              total={stats.overview.totalEmployees}
              color={themeColors.success}
            />
            <AttendanceProgress 
              status="Absent" 
              count={stats.attendance.today.absent} 
              total={stats.overview.totalEmployees}
              color={themeColors.danger}
            />
            <AttendanceProgress 
              status="Late" 
              count={stats.attendance.today.late} 
              total={stats.overview.totalEmployees}
              color={themeColors.warning}
            />
            <AttendanceProgress 
              status="Half Day" 
              count={stats.attendance.today.halfDay} 
              total={stats.overview.totalEmployees}
              color={themeColors.info}
            />
          </div>
        </div>

        {/* Department Performance */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Department Performance</h3>
          <div className="space-y-4">
            {(stats.analytics?.departmentStats || []).slice(0, 4).map((dept, index) => (
              <DepartmentPerformance 
                key={dept.department} 
                department={dept}
                color={getDepartmentColor(index, themeColors)}
              />
            ))}
          </div>
        </div>

        {/* Quick Stats */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Quick Stats</h3>
          <div className="space-y-4">
            <QuickStat 
              title="Average Hours Worked" 
              value={`${stats.quickStats.avgHoursWorked}h`}
              change={stats.quickStats.hoursChange}
            />
            <QuickStat 
              title="Overtime This Month" 
              value={`${stats.quickStats.overtimeHours}h`}
              change={stats.quickStats.overtimeChange}
            />
            <QuickStat 
              title="Leave Utilization" 
              value={`${stats.quickStats.leaveUtilization}%`}
              change={stats.quickStats.leaveUtilizationChange}
            />
            <QuickStat 
              title="Remote Workers" 
              value={stats.quickStats.remoteWorkers}
              change={stats.quickStats.remoteChange}
            />
          </div>
        </div>
      </div>

      {/* Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <RecentActivities 
          title="Pending Approvals" 
          activities={stats.recentActivities?.pendingLeaves || []} 
          type="leaves"
          maxItems={5}
        />
        <RecentActivities 
          title="System Alerts" 
          activities={stats.recentActivities?.systemAlerts || []} 
          type="alerts"
          maxItems={5}
        />
      </div>
    </div>
  );
};

// Helper Components
const StatCard = ({ icon, title, value, subtitle, change, color }) => {
  const { themeColors } = useTheme();
  
  const colorMap = {
    blue: themeColors.info,
    green: themeColors.success,
    orange: themeColors.warning,
    purple: themeColors.primary,
    red: themeColors.danger
  };

  const isPositive = change && parseFloat(change) > 0;

  return (
    <div className="p-6 rounded-lg border transition-all hover:shadow-lg" style={{ 
      backgroundColor: themeColors.surface, 
      borderColor: themeColors.border 
    }}>
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <p className="text-sm font-medium mb-1" style={{ color: themeColors.text }}>{title}</p>
          <div className="flex items-baseline gap-2">
            <p className="text-2xl font-bold" style={{ color: themeColors.text }}>{value}</p>
            {change && (
              <div className="flex items-center text-xs font-medium px-2 py-1 rounded-full" style={{
                backgroundColor: isPositive ? themeColors.success + '20' : themeColors.danger + '20',
                color: isPositive ? themeColors.success : themeColors.danger,
              }}>
                {isPositive ? <ArrowUp size={12} /> : <ArrowDown size={12} />}
                {Math.abs(parseFloat(change))}%
              </div>
            )}
          </div>
          <p className="text-xs mt-2" style={{ color: themeColors.text }}>{subtitle}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: colorMap[color] + '20' }}>
          <div style={{ color: colorMap[color] }}>
            {icon}
          </div>
        </div>
      </div>
    </div>
  );
};

const ChartCard = ({ title, children, style }) => {
  const { themeColors } = useTheme();

  return (
    <div className="p-6 rounded-lg border" style={style}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{title}</h3>
      {children}
    </div>
  );
};

const AttendanceProgress = ({ status, count, total, color }) => {
  const { themeColors } = useTheme();
  const percentage = total > 0 ? (count / total) * 100 : 0;

  return (
    <div className="space-y-2">
      <div className="flex justify-between items-center">
        <span className="text-sm font-medium" style={{ color: themeColors.text }}>{status}</span>
        <span className="text-sm font-semibold" style={{ color: themeColors.text }}>
          {count} <span style={{ color: themeColors.text }}>({percentage.toFixed(1)}%)</span>
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2" style={{ backgroundColor: themeColors.background }}>
        <div 
          className="h-2 rounded-full transition-all duration-500" 
          style={{ 
            width: `${percentage}%`,
            backgroundColor: color
          }}
        ></div>
      </div>
    </div>
  );
};

const DepartmentPerformance = ({ department, color }) => {
  const { themeColors } = useTheme();

  return (
    <div className="flex items-center justify-between p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
      <div className="flex items-center space-x-3">
        <div className="w-3 h-3 rounded-full" style={{ backgroundColor: color }}></div>
        <span className="text-sm font-medium" style={{ color: themeColors.text }}>
          {department.department}
        </span>
      </div>
      <div className="text-right">
        <div className="text-sm font-semibold" style={{ color: themeColors.text }}>
          {department.attendanceRate}%
        </div>
        <div className="text-xs" style={{ color: themeColors.text }}>
          {department.employeeCount} employees
        </div>
      </div>
    </div>
  );
};

const QuickStat = ({ title, value, change }) => {
  const { themeColors } = useTheme();
  const isPositive = change && parseFloat(change) > 0;

  return (
    <div className="flex justify-between items-center p-3 rounded-lg" style={{ backgroundColor: themeColors.background }}>
      <span className="text-sm font-medium" style={{ color: themeColors.text }}>{title}</span>
      <div className="text-right">
        <div className="text-sm font-semibold" style={{ color: themeColors.text }}>{value}</div>
        {change && (
          <div className={`text-xs flex items-center ${isPositive ? 'text-green-500' : 'text-red-500'}`}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(parseFloat(change))}%
          </div>
        )}
      </div>
    </div>
  );
};

const RecentActivities = ({ title, activities, type, maxItems = 3 }) => {
  const { themeColors } = useTheme();

  // Ensure activities is always an array
  const safeActivities = Array.isArray(activities) ? activities : [];

  const getActivityIcon = (type, activity) => {
    switch (type) {
      case 'leaves':
        return <Clock size={16} style={{ color: themeColors.warning }} />;
      case 'alerts':
        return <Briefcase size={16} style={{ color: themeColors.danger }} />;
      default:
        return <Calendar size={16} style={{ color: themeColors.info }} />;
    }
  };

  const formatActivity = (activity, type) => {
    switch (type) {
      case 'leaves':
        return `${activity.employee?.name?.first || 'Employee'} - ${activity.leaveType} (${activity.duration} days)`;
      case 'alerts':
        return `${activity.message} - ${activity.severity}`;
      default:
        return activity.title || activity.description;
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{title}</h3>
      <div className="space-y-3">
        {safeActivities.slice(0, maxItems).map((activity, index) => (
          <div key={index} className="flex items-center space-x-3 p-3 rounded" style={{ backgroundColor: themeColors.background }}>
            {getActivityIcon(type, activity)}
            <div className="flex-1">
              <p className="text-sm" style={{ color: themeColors.text }}>
                {formatActivity(activity, type)}
              </p>
              <p className="text-xs mt-1" style={{ color: themeColors.text }}>
                {new Date(activity.date || activity.createdAt).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {safeActivities.length === 0 && (
          <p className="text-sm text-center py-4" style={{ color: themeColors.text }}>
            No activities found
          </p>
        )}
      </div>
    </div>
  );
};

// Helper functions
const getDepartmentColor = (index, themeColors) => {
  const colors = [
    themeColors.primary,
    themeColors.success,
    themeColors.warning,
    themeColors.danger,
    themeColors.info,
    themeColors.accent
  ];
  return colors[index % colors.length];
};

export default Dashboard;