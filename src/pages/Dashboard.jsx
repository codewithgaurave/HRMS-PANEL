// src/pages/Dashboard.jsx
import React, { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import dashboardAPI from "../apis/dashboardAPI";
import enhancedDashboardAPI from "../apis/enhancedDashboardAPI";
import hrAnalyticsAPI from "../apis/hrAnalyticsAPI";
import hrSummaryAPI from "../apis/hrSummaryAPI";
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
  LogOut,
  Package,
  IndianRupee,
  AlertTriangle,
  CheckCircle
} from "lucide-react";

// Highcharts components
import Highcharts from 'highcharts';
import HighchartsReact from 'highcharts-react-official';

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
      
      // Try HR Summary API first for HR Manager role
      try {
        const hrSummaryResponse = await hrSummaryAPI.getHRSummary();
        console.log('HR Summary response:', hrSummaryResponse);
        
        if (hrSummaryResponse.data.success && hrSummaryResponse.data.data) {
          console.log('✅ HR Summary data received:', hrSummaryResponse.data.data);
          
          const summaryData = hrSummaryResponse.data.data;
          
          // Transform HR summary data to dashboard format
          const transformedStats = {
            data: {
              overview: {
                totalEmployees: summaryData.teamSize || 1,
                activeEmployees: summaryData.teamSize || 1,
                inactiveEmployees: 0,
                newEmployeesThisMonth: 0,
                pendingLeaves: summaryData.pendingLeaves || 0,
                employeeGrowth: 0,
                totalAssets: 0,
                assignedAssets: 0,
                availableAssets: 0,
                teamSize: summaryData.teamSize || 1,
                totalSalaryBudget: summaryData.teamSalaryBudget || 0
              },
              attendance: {
                today: {
                  present: summaryData.todayAttendance?.present || 0,
                  absent: Math.max(0, (summaryData.teamSize || 1) - (summaryData.todayAttendance?.present || 0)),
                  late: 0,
                  halfDay: 0,
                  rate: summaryData.todayAttendance?.percentage || 0,
                  totalEmployees: summaryData.teamSize || 1
                },
                week: {
                  present: summaryData.todayAttendance?.present || 0,
                  absent: 0,
                  late: 0,
                  halfDay: 0,
                  rate: summaryData.todayAttendance?.percentage || 0,
                  totalEmployees: summaryData.teamSize || 1
                },
                month: {
                  present: summaryData.todayAttendance?.present || 0,
                  absent: 0,
                  late: 0,
                  halfDay: 0,
                  rate: summaryData.todayAttendance?.percentage || 0,
                  totalEmployees: summaryData.teamSize || 1
                },
                trends: []
              },
              leaves: {
                pending: summaryData.pendingLeaves || 0,
                approvedThisMonth: 0,
                rejectedThisMonth: 0,
                byType: [],
                trends: [],
                approvalRate: 0
              },
              assets: {
                total: 0,
                assigned: 0,
                available: 0,
                pendingRequests: 0,
                byCategory: [],
                utilizationRate: 0
              },
              payroll: {
                totalThisMonth: summaryData.teamSalaryBudget || 0,
                avgSalary: summaryData.teamSalaryBudget && summaryData.teamSize 
                  ? Math.round(summaryData.teamSalaryBudget / summaryData.teamSize) 
                  : 0,
                salaryDistribution: []
              },
              departments: {
                stats: [],
                topPerforming: [],
                attendanceByDept: []
              },
              workforce: {
                roleDistribution: [],
                designationStats: [],
                locationStats: [],
                shiftStats: []
              },
              performance: {
                overtimeStats: { totalOvertime: 0, avgOvertime: 0, employeesWithOvertime: 0 },
                avgWorkHours: 0,
                productivityScore: 0
              },
              recentActivities: {
                newEmployees: [],
                recentLeaves: [],
                upcomingEvents: [],
                recentAnnouncements: []
              },
              alerts: []
            }
          };
          
          console.log('✅ Transformed HR Summary stats:', transformedStats.data.overview);
          setStats(transformedStats);
          setAnalytics({});
          return;
        }
      } catch (hrSummaryError) {
        console.log('HR Summary failed, trying HR Analytics:', hrSummaryError);
      }
      
      // Try HR Analytics API for comprehensive data
      try {
        const hrAnalyticsResponse = await hrAnalyticsAPI.getHRAnalytics();
        console.log('HR Analytics response:', hrAnalyticsResponse);
        
        if (hrAnalyticsResponse.success && hrAnalyticsResponse.data) {
          console.log('✅ HR Analytics data received:', hrAnalyticsResponse.data);
          
          // Use HR analytics data directly - it's already properly structured
          const transformedStats = {
            data: {
              overview: {
                totalEmployees: hrAnalyticsResponse.data.employees.total || 1,
                activeEmployees: hrAnalyticsResponse.data.employees.active || 1,
                inactiveEmployees: hrAnalyticsResponse.data.employees.inactive || 0,
                newEmployeesThisMonth: hrAnalyticsResponse.data.employees.newThisMonth || 0,
                pendingLeaves: hrAnalyticsResponse.data.leaves.totalPending || 0,
                employeeGrowth: hrAnalyticsResponse.data.employees.newThisMonth || 0,
                totalAssets: hrAnalyticsResponse.data.assets.total || 0,
                assignedAssets: hrAnalyticsResponse.data.assets.assigned || 0,
                availableAssets: hrAnalyticsResponse.data.assets.available || 0
              },
              attendance: {
                today: {
                  present: hrAnalyticsResponse.data.attendance.todayPresent || 0,
                  absent: Math.max(0, (hrAnalyticsResponse.data.employees.total || 1) - (hrAnalyticsResponse.data.attendance.todayPresent || 0)),
                  late: hrAnalyticsResponse.data.attendance.monthlyStats.lateCount || 0,
                  halfDay: 0,
                  rate: parseFloat(hrAnalyticsResponse.data.attendance.attendanceRate) || 0,
                  totalEmployees: hrAnalyticsResponse.data.employees.total || 1
                },
                week: {
                  present: hrAnalyticsResponse.data.attendance.monthlyStats.presentCount || 0,
                  absent: 0,
                  late: hrAnalyticsResponse.data.attendance.monthlyStats.lateCount || 0,
                  halfDay: 0,
                  rate: parseFloat(hrAnalyticsResponse.data.attendance.attendanceRate) || 0,
                  totalEmployees: hrAnalyticsResponse.data.employees.total || 1
                },
                month: {
                  present: hrAnalyticsResponse.data.attendance.monthlyStats.presentCount || 0,
                  absent: 0,
                  late: hrAnalyticsResponse.data.attendance.monthlyStats.lateCount || 0,
                  halfDay: 0,
                  rate: parseFloat(hrAnalyticsResponse.data.attendance.attendanceRate) || 0,
                  totalEmployees: hrAnalyticsResponse.data.employees.total || 1
                },
                trends: hrAnalyticsResponse.data.attendance.trend || []
              },
              leaves: {
                pending: hrAnalyticsResponse.data.leaves.totalPending || 0,
                approvedThisMonth: hrAnalyticsResponse.data.leaves.totalApproved || 0,
                rejectedThisMonth: hrAnalyticsResponse.data.leaves.totalRejected || 0,
                byType: hrAnalyticsResponse.data.leaves.byType || [],
                trends: hrAnalyticsResponse.data.leaves.monthlyTrend || [],
                approvalRate: hrAnalyticsResponse.data.performance.leaveApprovalRate || 0
              },
              assets: {
                total: hrAnalyticsResponse.data.assets.total || 0,
                assigned: hrAnalyticsResponse.data.assets.assigned || 0,
                available: hrAnalyticsResponse.data.assets.available || 0,
                pendingRequests: hrAnalyticsResponse.data.assets.pendingRequests || 0,
                byCategory: hrAnalyticsResponse.data.assets.byCategory || [],
                utilizationRate: hrAnalyticsResponse.data.assets.total > 0 
                  ? ((hrAnalyticsResponse.data.assets.assigned / hrAnalyticsResponse.data.assets.total) * 100).toFixed(1)
                  : 0
              },
              payroll: {
                totalThisMonth: hrAnalyticsResponse.data.payroll.monthlyAmount || 0,
                avgSalary: hrAnalyticsResponse.data.payroll.avgSalary || 0,
                salaryDistribution: hrAnalyticsResponse.data.employees.salaryDistribution || []
              },
              departments: {
                stats: hrAnalyticsResponse.data.employees.byDepartment || [],
                topPerforming: hrAnalyticsResponse.data.employees.byDepartment?.slice(0, 5) || [],
                attendanceByDept: []
              },
              workforce: {
                roleDistribution: hrAnalyticsResponse.data.employees.byRole || [],
                designationStats: hrAnalyticsResponse.data.employees.byDesignation || [],
                locationStats: [],
                shiftStats: []
              },
              performance: {
                overtimeStats: { totalOvertime: 0, avgOvertime: 0, employeesWithOvertime: 0 },
                avgWorkHours: hrAnalyticsResponse.data.attendance.monthlyStats.avgHours || 0,
                productivityScore: hrAnalyticsResponse.data.performance.taskCompletionRate || 46
              },
              recentActivities: {
                newEmployees: [],
                recentLeaves: [],
                upcomingEvents: [],
                recentAnnouncements: []
              },
              alerts: []
            }
          };
          
          console.log('✅ Transformed stats:', transformedStats.data.overview);
          setStats(transformedStats);
          setAnalytics(hrAnalyticsResponse.data);
          return;
        }
      } catch (hrError) {
        console.log('HR Analytics failed, trying enhanced dashboard:', hrError);
      }
      
      // Fallback to enhanced dashboard for HR, regular dashboard for others
      try {
        const enhancedResponse = await enhancedDashboardAPI.getEnhancedHRStats();
        console.log('Enhanced HR stats response:', enhancedResponse);
        setStats(enhancedResponse);
        
        // Also get analytics for charts
        const analyticsResponse = await dashboardAPI.getDashboardAnalytics('month').catch(() => ({ data: { analytics: {} } }));
        setAnalytics(analyticsResponse.data.analytics || {});
      } catch (enhancedError) {
        console.log('Enhanced dashboard failed, using regular dashboard:', enhancedError);
        
        // Fallback to regular dashboard for role-based data
        const [statsResponse, analyticsResponse] = await Promise.all([
          dashboardAPI.getDashboardStats(),
          dashboardAPI.getDashboardAnalytics('month').catch(() => ({ data: { analytics: {} } }))
        ]);
        
        console.log('Regular dashboard stats response:', statsResponse.data);
        console.log('User role:', statsResponse.data.userRole);
        
        setStats(statsResponse.data.stats);
        setAnalytics(analyticsResponse.data.analytics || {});
      }
      
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

  if (!stats) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  // Prepare chart data from API with safe defaults
  const attendanceTrendData = analytics?.attendanceTrend || [];
  const departmentDistributionData = analytics?.departmentDistribution || [];
  const leaveTrendData = analytics?.leaveTrend || [];

  // Safe access to stats with defaults - handle enhanced dashboard structure
  const safeStats = {
    overview: {
      totalEmployees: stats.data?.overview?.totalEmployees || stats.overview?.totalEmployees || stats.overview?.teamSize || stats.data?.overview?.teamSize || 1,
      activeEmployees: stats.data?.overview?.activeEmployees || stats.overview?.activeEmployees || stats.overview?.activeTeamMembers || stats.data?.overview?.teamSize || 1,
      inactiveEmployees: stats.data?.overview?.inactiveEmployees || stats.overview?.inactiveEmployees || 0,
      newEmployeesThisMonth: stats.data?.overview?.newEmployeesThisMonth || stats.overview?.newEmployeesThisMonth || 0,
      pendingLeaves: stats.data?.overview?.pendingLeaves || stats.overview?.pendingLeaves || stats.data?.leaves?.pending || 0,
      employeeGrowth: stats.data?.overview?.employeeGrowth || stats.overview?.employeeGrowth || 0,
      totalAssets: stats.data?.overview?.totalAssets || stats.overview?.totalAssets || 0,
      assignedAssets: stats.data?.overview?.assignedAssets || stats.overview?.assignedAssets || 0,
      availableAssets: stats.data?.overview?.availableAssets || stats.overview?.availableAssets || 0,
      // Team Leader specific fields
      teamSize: Math.max(stats.data?.overview?.teamSize || stats.overview?.teamSize || stats.data?.overview?.totalEmployees || 0, 1),
      activeTeamMembers: Math.max(stats.overview?.activeTeamMembers || stats.data?.overview?.activeEmployees || 0, 1),
      todayPresent: stats.overview?.todayPresent || stats.data?.attendance?.today?.present || 0,
      todayAbsent: stats.overview?.todayAbsent || stats.data?.attendance?.today?.absent || 0,
      approvedLeaves: stats.overview?.approvedLeaves || 0,
      rejectedLeaves: stats.overview?.rejectedLeaves || 0,
      totalSalaryBudget: stats.data?.overview?.totalSalaryBudget || stats.overview?.totalSalaryBudget || stats.data?.payroll?.totalThisMonth || 0,
      avgTeamSalary: stats.overview?.avgTeamSalary || stats.data?.payroll?.avgSalary || 0
    },
    attendance: {
      today: {
        present: stats.data?.attendance?.today?.present || stats.attendance?.today?.present || 0,
        absent: stats.data?.attendance?.today?.absent || stats.attendance?.today?.absent || 0,
        late: stats.data?.attendance?.today?.late || stats.attendance?.today?.late || 0,
        halfDay: stats.data?.attendance?.today?.halfDay || stats.attendance?.today?.halfDay || 0,
        rate: stats.data?.attendance?.today?.rate || stats.attendance?.today?.rate || 0,
        totalEmployees: stats.data?.attendance?.today?.totalEmployees || stats.attendance?.today?.totalEmployees || 0
      },
      week: {
        present: stats.data?.attendance?.week?.present || stats.attendance?.week?.present || 0,
        absent: stats.data?.attendance?.week?.absent || stats.attendance?.week?.absent || 0,
        late: stats.data?.attendance?.week?.late || stats.attendance?.week?.late || 0,
        halfDay: stats.data?.attendance?.week?.halfDay || stats.attendance?.week?.halfDay || 0,
        rate: stats.data?.attendance?.week?.rate || stats.attendance?.week?.rate || 0,
        totalEmployees: stats.data?.attendance?.week?.totalEmployees || stats.attendance?.week?.totalEmployees || 0
      },
      month: {
        present: stats.data?.attendance?.month?.present || stats.attendance?.month?.present || 0,
        absent: stats.data?.attendance?.month?.absent || stats.attendance?.month?.absent || 0,
        late: stats.data?.attendance?.month?.late || stats.attendance?.month?.late || 0,
        halfDay: stats.data?.attendance?.month?.halfDay || stats.attendance?.month?.halfDay || 0,
        rate: stats.data?.attendance?.month?.rate || stats.attendance?.month?.rate || 0,
        totalEmployees: stats.data?.attendance?.month?.totalEmployees || stats.attendance?.month?.totalEmployees || 0
      },
      trends: stats.data?.attendance?.trends || stats.attendance?.trends || []
    },
    leaves: {
      pending: stats.data?.leaves?.pending || stats.leaves?.pending || 0,
      approvedThisMonth: stats.data?.leaves?.approvedThisMonth || stats.leaves?.approvedThisMonth || 0,
      rejectedThisMonth: stats.data?.leaves?.rejectedThisMonth || stats.leaves?.rejectedThisMonth || 0,
      byType: stats.data?.leaves?.byType || stats.leaves?.byType || [],
      trends: stats.data?.leaves?.trends || stats.leaves?.trends || [],
      approvalRate: stats.data?.leaves?.approvalRate || stats.leaves?.approvalRate || 0
    },
    assets: {
      total: stats.data?.assets?.total || stats.assets?.total || 0,
      assigned: stats.data?.assets?.assigned || stats.assets?.assigned || 0,
      available: stats.data?.assets?.available || stats.assets?.available || 0,
      pendingRequests: stats.data?.assets?.pendingRequests || stats.assets?.pendingRequests || 0,
      byCategory: stats.data?.assets?.byCategory || stats.assets?.byCategory || [],
      utilizationRate: stats.data?.assets?.utilizationRate || stats.assets?.utilizationRate || 0
    },
    payroll: {
      totalThisMonth: stats.data?.payroll?.totalThisMonth || stats.payroll?.totalThisMonth || 0,
      avgSalary: stats.data?.payroll?.avgSalary || stats.payroll?.avgSalary || 0,
      salaryDistribution: stats.data?.payroll?.salaryDistribution || stats.payroll?.salaryDistribution || []
    },
    departments: {
      stats: stats.data?.departments?.stats || stats.departments?.stats || [],
      topPerforming: stats.data?.departments?.topPerforming || stats.departments?.topPerforming || [],
      attendanceByDept: stats.data?.departments?.attendanceByDept || stats.departments?.attendanceByDept || []
    },
    workforce: {
      roleDistribution: stats.data?.workforce?.roleDistribution || stats.workforce?.roleDistribution || [],
      designationStats: stats.data?.workforce?.designationStats || stats.workforce?.designationStats || [],
      locationStats: stats.data?.workforce?.locationStats || stats.workforce?.locationStats || [],
      shiftStats: stats.data?.workforce?.shiftStats || stats.workforce?.shiftStats || []
    },
    performance: {
      overtimeStats: stats.data?.performance?.overtimeStats || stats.performance?.overtimeStats || { totalOvertime: 0, avgOvertime: 0, employeesWithOvertime: 0 },
      avgWorkHours: stats.data?.performance?.avgWorkHours || stats.performance?.avgWorkHours || 0,
      productivityScore: stats.data?.performance?.productivityScore || stats.performance?.productivityScore || 0
    },
    recentActivities: {
      newEmployees: stats.data?.recentActivities?.newEmployees || stats.recentActivities?.newEmployees || [],
      recentLeaves: stats.data?.recentActivities?.recentLeaves || stats.recentActivities?.recentLeaves || [],
      upcomingEvents: stats.data?.recentActivities?.upcomingEvents || stats.recentActivities?.upcomingEvents || [],
      recentAnnouncements: stats.data?.recentActivities?.recentAnnouncements || stats.recentActivities?.recentAnnouncements || []
    },
    alerts: stats.data?.alerts || stats.alerts || [],
    // Team Leader specific data
    teamMembers: stats.teamMembers || [],
    teamStats: stats.teamStats || {
      totalMembers: 0,
      activeMembers: 0,
      departments: 0,
      designations: 0,
      salaryBudget: 0,
      avgSalary: 0,
      salaryRange: { min: 0, max: 0 }
    }
  };

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
        <div className="flex items-center gap-4 mt-2 md:mt-0">
          <button
            onClick={async () => {
              try {
                const debugResponse = await dashboardAPI.debugDashboardData();
                console.log('🔍 Debug Response:', debugResponse.data);
                toast.success('Debug data logged to console');
              } catch (err) {
                console.error('Debug failed:', err);
                toast.error('Debug failed');
              }
            }}
            className="px-3 py-1 text-xs rounded border"
            style={{ 
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            🔍 Debug
          </button>
          <div className="text-lg font-medium" style={{ color: themeColors.primary }}>
            {time.toLocaleTimeString('en-US', { 
              hour: '2-digit', 
              minute: '2-digit',
              second: '2-digit'
            })}
          </div>
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

      {/* Enhanced Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-6">
        <StatCard
          icon={<Users size={24} />}
          title={safeStats.overview.teamSize > 0 ? "Team Size" : "Total Employees"}
          value={safeStats.overview.teamSize > 0 ? safeStats.overview.teamSize : safeStats.overview.totalEmployees}
          change={safeStats.overview.employeeGrowth}
          subtitle={safeStats.overview.teamSize > 0 
            ? `${safeStats.overview.activeTeamMembers} active members` 
            : `${safeStats.overview.activeEmployees} active, ${safeStats.overview.inactiveEmployees} inactive`}
          color="blue"
        />
        <StatCard
          icon={<Calendar size={24} />}
          title="Today's Attendance"
          value={`${safeStats.attendance.today.rate}%`}
          change={0}
          subtitle={`${safeStats.attendance.today.present} present, ${safeStats.attendance.today.late} late`}
          color="green"
        />
        <StatCard
          icon={<Building size={24} />}
          title="Pending Leaves"
          value={safeStats.leaves.pending}
          change={0}
          subtitle={safeStats.overview.teamSize > 0 
            ? `Team leave requests` 
            : `${safeStats.leaves.approvalRate}% approval rate`}
          color="orange"
        />
        <StatCard
          icon={<Package size={24} />}
          title="Assets"
          value={safeStats.assets.total}
          change={safeStats.assets.utilizationRate}
          subtitle={`${safeStats.assets.assigned} assigned, ${safeStats.assets.available} available`}
          color="purple"
        />
        <StatCard
          icon={<IndianRupee size={24} />}
          title={safeStats.overview.teamSize > 0 ? "Team Salary Budget" : "Avg Salary"}
          value={safeStats.overview.teamSize > 0 
            ? `₹${Math.round(safeStats.overview.totalSalaryBudget || 0).toLocaleString()}` 
            : `₹${Math.round(safeStats.payroll.avgSalary).toLocaleString()}`}
          change={0}
          subtitle={safeStats.overview.teamSize > 0 
            ? `₹${Math.round(safeStats.overview.avgTeamSalary || 0).toLocaleString()} avg` 
            : `₹${Math.round(safeStats.payroll.totalThisMonth).toLocaleString()} total`}
          color="green"
        />
      </div>

      {/* Enhanced Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <QuickStatCard
          title="Monthly Attendance"
          value={`${safeStats.attendance.month.rate}%`}
          change={0}
          icon={<TrendingUp size={20} />}
          color={themeColors.success}
        />
        <QuickStatCard
          title="Avg Work Hours"
          value={`${safeStats.performance.avgWorkHours}h`}
          change={0}
          icon={<Clock size={20} />}
          color={themeColors.info}
        />
        <QuickStatCard
          title="Overtime Hours"
          value={`${safeStats.performance.overtimeStats.totalOvertime}h`}
          change={0}
          icon={<BarChart3 size={20} />}
          color={themeColors.warning}
        />
        <QuickStatCard
          title="Productivity Score"
          value={`${safeStats.performance.productivityScore}%`}
          change={0}
          icon={<CheckCircle size={20} />}
          color={themeColors.primary}
        />
      </div>

      {/* Enhanced Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Attendance Trend Chart */}
        <ChartCard 
          title="Attendance Trend (Last 30 Days)"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div style={{ height: '300px' }}>
            {safeStats.attendance.trends && safeStats.attendance.trends.length > 0 ? (
              <AttendanceTrendChart data={safeStats.attendance.trends} themeColors={themeColors} />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: themeColors.text }}>
                <p>No attendance trend data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Department Distribution */}
        <ChartCard 
          title="Department Distribution"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div style={{ height: '300px' }}>
            {safeStats.departments.stats && safeStats.departments.stats.length > 0 ? (
              <DepartmentDistributionChart data={safeStats.departments.stats} themeColors={themeColors} />
            ) : (
              <div className="flex flex-col items-center justify-center h-full" style={{ color: themeColors.text }}>
                <div className="text-center">
                  <div className="mb-4">
                    <Building size={48} style={{ color: themeColors.text, opacity: 0.5 }} className="mx-auto" />
                  </div>
                  <p className="text-lg font-medium mb-2">No Department Data</p>
                  <p className="text-sm opacity-75">Department distribution will appear here once employees are assigned to departments.</p>
                </div>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Leave Analytics Chart */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <ChartCard 
          title="Leave Trends (Last 6 Months)"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div style={{ height: '300px' }}>
            {safeStats.leaves.trends && safeStats.leaves.trends.length > 0 ? (
              <LeaveTrendChart data={safeStats.leaves.trends} themeColors={themeColors} />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: themeColors.text }}>
                <p>No leave trend data available</p>
              </div>
            )}
          </div>
        </ChartCard>

        {/* Asset Distribution */}
        <ChartCard 
          title="Asset Distribution by Category"
          style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}
        >
          <div style={{ height: '300px' }}>
            {safeStats.assets.byCategory && safeStats.assets.byCategory.length > 0 ? (
              <AssetDistributionChart data={safeStats.assets.byCategory} themeColors={themeColors} />
            ) : (
              <div className="flex items-center justify-center h-full" style={{ color: themeColors.text }}>
                <p>No asset data available</p>
              </div>
            )}
          </div>
        </ChartCard>
      </div>

      {/* Enhanced Detailed Stats Section */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Attendance Breakdown */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Today's Attendance</h3>
          <div className="space-y-4">
            <AttendanceProgress 
              status="Present" 
              count={safeStats.attendance.today.present} 
              total={safeStats.attendance.today.totalEmployees}
              color={themeColors.success}
            />
            <AttendanceProgress 
              status="Absent" 
              count={safeStats.attendance.today.absent} 
              total={safeStats.attendance.today.totalEmployees}
              color={themeColors.danger}
            />
            <AttendanceProgress 
              status="Late" 
              count={safeStats.attendance.today.late} 
              total={safeStats.attendance.today.totalEmployees}
              color={themeColors.warning}
            />
            <AttendanceProgress 
              status="Half Day" 
              count={safeStats.attendance.today.halfDay} 
              total={safeStats.attendance.today.totalEmployees}
              color={themeColors.info}
            />
          </div>
        </div>

        {/* Department Performance */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Department Performance</h3>
          <div className="space-y-4">
            {safeStats.departments.topPerforming.slice(0, 4).map((dept, index) => (
              <DepartmentPerformance 
                key={dept.department} 
                department={dept}
                color={getDepartmentColor(index, themeColors)}
              />
            ))}
            {safeStats.departments.topPerforming.length === 0 && (
              <p className="text-sm text-center py-4" style={{ color: themeColors.text }}>
                No department performance data available
              </p>
            )}
          </div>
        </div>

        {/* Enhanced Quick Stats */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Performance Metrics</h3>
          <div className="space-y-4">
            <QuickStat 
              title="Average Work Hours" 
              value={`${safeStats.performance.avgWorkHours}h`}
              change={0}
            />
            <QuickStat 
              title="Total Overtime" 
              value={`${safeStats.performance.overtimeStats.totalOvertime}h`}
              change={0}
            />
            <QuickStat 
              title="Employees with Overtime" 
              value={safeStats.performance.overtimeStats.employeesWithOvertime}
              change={0}
            />
            <QuickStat 
              title="Productivity Score" 
              value={`${safeStats.performance.productivityScore}%`}
              change={0}
            />
          </div>
        </div>
      </div>

      {/* Enhanced Recent Activities */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <EnhancedRecentActivities 
          title="Recent Activities" 
          activities={[
            ...safeStats.recentActivities.newEmployees.map(emp => ({
              type: 'employee',
              title: `New Employee: ${emp.name?.first} ${emp.name?.last}`,
              subtitle: `${emp.department} - ${emp.designation}`,
              date: emp.dateOfJoining,
              icon: <Users size={16} />
            })),
            ...safeStats.recentActivities.recentLeaves.map(leave => ({
              type: 'leave',
              title: `Leave Request: ${leave.employee?.name?.first} ${leave.employee?.name?.last}`,
              subtitle: `${leave.leaveType} - ${leave.status}`,
              date: leave.startDate,
              icon: <Calendar size={16} />
            }))
          ].slice(0, 5)}
        />
        <EnhancedRecentActivities 
          title="System Alerts" 
          activities={safeStats.alerts.map(alert => ({
            type: alert.type,
            title: alert.message,
            subtitle: alert.action,
            date: alert.timestamp,
            severity: alert.severity,
            icon: <AlertTriangle size={16} />
          }))}
        />
      </div>

      {/* Data Tables Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Department Stats Table */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Department Statistics</h3>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b" style={{ borderColor: themeColors.border }}>
                  <th className="text-left py-2" style={{ color: themeColors.text }}>Department</th>
                  <th className="text-right py-2" style={{ color: themeColors.text }}>Employees</th>
                  <th className="text-right py-2" style={{ color: themeColors.text }}>Avg Salary</th>
                  <th className="text-right py-2" style={{ color: themeColors.text }}>Total Salary</th>
                </tr>
              </thead>
              <tbody>
                {safeStats.departments.stats.map((dept, index) => (
                  <tr key={index} className="border-b" style={{ borderColor: themeColors.border }}>
                    <td className="py-2" style={{ color: themeColors.text }}>{dept._id}</td>
                    <td className="text-right py-2" style={{ color: themeColors.text }}>{dept.count}</td>
                    <td className="text-right py-2" style={{ color: themeColors.text }}>₹{Math.round(dept.avgSalary || 0).toLocaleString()}</td>
                    <td className="text-right py-2" style={{ color: themeColors.text }}>₹{Math.round(dept.totalSalary || 0).toLocaleString()}</td>
                  </tr>
                ))}
              </tbody>
            </table>
            {safeStats.departments.stats.length === 0 && (
              <p className="text-center py-4" style={{ color: themeColors.text }}>No department data available</p>
            )}
          </div>
        </div>

        {/* Leave Statistics Table */}
        <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>Leave Statistics</h3>
          <div className="space-y-4">
            <div className="grid grid-cols-3 gap-4 text-center">
              <div className="p-3 rounded" style={{ backgroundColor: themeColors.background }}>
                <div className="text-lg font-bold" style={{ color: themeColors.text }}>{safeStats.leaves.pending}</div>
                <div className="text-xs" style={{ color: themeColors.text }}>Pending</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: themeColors.background }}>
                <div className="text-lg font-bold" style={{ color: themeColors.text }}>{safeStats.leaves.approvedThisMonth}</div>
                <div className="text-xs" style={{ color: themeColors.text }}>Approved</div>
              </div>
              <div className="p-3 rounded" style={{ backgroundColor: themeColors.background }}>
                <div className="text-lg font-bold" style={{ color: themeColors.text }}>{safeStats.leaves.rejectedThisMonth}</div>
                <div className="text-xs" style={{ color: themeColors.text }}>Rejected</div>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b" style={{ borderColor: themeColors.border }}>
                    <th className="text-left py-2" style={{ color: themeColors.text }}>Leave Type</th>
                    <th className="text-right py-2" style={{ color: themeColors.text }}>Count</th>
                  </tr>
                </thead>
                <tbody>
                  {safeStats.leaves.byType.map((leave, index) => (
                    <tr key={index} className="border-b" style={{ borderColor: themeColors.border }}>
                      <td className="py-2" style={{ color: themeColors.text }}>{leave._id}</td>
                      <td className="text-right py-2" style={{ color: themeColors.text }}>{leave.count}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Helper Components
const QuickStatCard = ({ title, value, change, icon, color }) => {
  const { themeColors } = useTheme();
  const isPositive = change && parseFloat(change) > 0;

  return (
    <div className="p-4 rounded-lg border" style={{ 
      backgroundColor: themeColors.surface, 
      borderColor: themeColors.border 
    }}>
      <div className="flex items-center justify-between mb-2">
        <div className="p-2 rounded-lg" style={{ backgroundColor: color + '20' }}>
          <div style={{ color: color }}>
            {icon}
          </div>
        </div>
        {change && (
          <div className={`flex items-center text-xs font-medium px-2 py-1 rounded-full`} style={{
            backgroundColor: isPositive ? themeColors.success + '20' : themeColors.danger + '20',
            color: isPositive ? themeColors.success : themeColors.danger,
          }}>
            {isPositive ? <ArrowUp size={10} /> : <ArrowDown size={10} />}
            {Math.abs(parseFloat(change))}%
          </div>
        )}
      </div>
      <div>
        <p className="text-lg font-bold" style={{ color: themeColors.text }}>{value}</p>
        <p className="text-sm" style={{ color: themeColors.textSecondary }}>{title}</p>
      </div>
    </div>
  );
};

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

// Memoized chart options to prevent re-renders
const AttendanceTrendChart = React.memo(({ data, themeColors }) => {
  const options = React.useMemo(() => {
    const categories = data.map(item => {
      const date = new Date(item._id);
      return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    });
    const presentData = data.map(item => item.present || 0);
    const absentData = data.map(item => item.absent || 0);
    const lateData = data.map(item => item.late || 0);

    return {
      chart: {
        type: 'line',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: null },
      xAxis: {
        categories: categories,
        labels: { style: { color: themeColors.text } },
        lineColor: themeColors.border,
        tickColor: themeColors.border
      },
      yAxis: {
        title: { text: 'Count', style: { color: themeColors.text } },
        labels: { style: { color: themeColors.text } },
        gridLineColor: themeColors.border
      },
      legend: { itemStyle: { color: themeColors.text } },
      tooltip: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        style: { color: themeColors.text }
      },
      series: [
        {
          name: 'Present',
          data: presentData,
          color: themeColors.success,
          lineWidth: 2
        },
        {
          name: 'Absent',
          data: absentData,
          color: themeColors.danger,
          lineWidth: 2
        },
        {
          name: 'Late',
          data: lateData,
          color: themeColors.warning,
          lineWidth: 2
        }
      ],
      accessibility: { enabled: false },
      credits: { enabled: false }
    };
  }, [data, themeColors]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
});

const DepartmentDistributionChart = React.memo(({ data, themeColors }) => {
  const options = React.useMemo(() => {
    const colors = [
      themeColors.primary, themeColors.success, themeColors.warning,
      themeColors.danger, themeColors.info, '#8B5CF6', '#06B6D4',
      '#84CC16', '#F97316', '#EC4899'
    ];

    const pieData = data.map((item, index) => ({
      name: item._id || `Department ${index + 1}`,
      y: item.count || 0,
      color: colors[index % colors.length]
    }));

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: null },
      tooltip: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        style: { color: themeColors.text },
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>Count: <b>{point.y}</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.percentage:.1f}%',
            style: { color: themeColors.text }
          },
          showInLegend: true
        }
      },
      legend: { itemStyle: { color: themeColors.text } },
      series: [{
        name: 'Employees',
        colorByPoint: true,
        data: pieData
      }],
      accessibility: { enabled: false },
      credits: { enabled: false }
    };
  }, [data, themeColors]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
});

const LeaveTrendChart = React.memo(({ data, themeColors }) => {
  const options = React.useMemo(() => {
    const categories = data.map(item => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
      return `${monthNames[item._id.month - 1]} ${item._id.year}`;
    });
    const pendingData = data.map(item => item.pending || 0);
    const approvedData = data.map(item => item.approved || 0);
    const rejectedData = data.map(item => item.rejected || 0);

    return {
      chart: {
        type: 'column',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: null },
      xAxis: {
        categories: categories,
        labels: { style: { color: themeColors.text } },
        lineColor: themeColors.border,
        tickColor: themeColors.border
      },
      yAxis: {
        title: { text: 'Leave Count', style: { color: themeColors.text } },
        labels: { style: { color: themeColors.text } },
        gridLineColor: themeColors.border
      },
      legend: { itemStyle: { color: themeColors.text } },
      tooltip: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        style: { color: themeColors.text }
      },
      series: [
        {
          name: 'Pending',
          data: pendingData,
          color: themeColors.warning
        },
        {
          name: 'Approved',
          data: approvedData,
          color: themeColors.success
        },
        {
          name: 'Rejected',
          data: rejectedData,
          color: themeColors.danger
        }
      ],
      accessibility: { enabled: false },
      credits: { enabled: false }
    };
  }, [data, themeColors]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
});

const AssetDistributionChart = React.memo(({ data, themeColors }) => {
  const options = React.useMemo(() => {
    const colors = [
      themeColors.primary, themeColors.success, themeColors.warning,
      themeColors.danger, themeColors.info, '#8B5CF6'
    ];

    const pieData = data.map((item, index) => ({
      name: item._id || `Category ${index + 1}`,
      y: item.count || 0,
      color: colors[index % colors.length]
    }));

    return {
      chart: {
        type: 'pie',
        backgroundColor: 'transparent',
        height: 300
      },
      title: { text: null },
      tooltip: {
        backgroundColor: themeColors.surface,
        borderColor: themeColors.border,
        style: { color: themeColors.text },
        pointFormat: '{series.name}: <b>{point.percentage:.1f}%</b><br/>Count: <b>{point.y}</b>'
      },
      plotOptions: {
        pie: {
          allowPointSelect: true,
          cursor: 'pointer',
          dataLabels: {
            enabled: true,
            format: '<b>{point.name}</b>: {point.y}',
            style: { color: themeColors.text }
          },
          showInLegend: true,
          innerSize: '50%'
        }
      },
      legend: { itemStyle: { color: themeColors.text } },
      series: [{
        name: 'Assets',
        colorByPoint: true,
        data: pieData
      }],
      accessibility: { enabled: false },
      credits: { enabled: false }
    };
  }, [data, themeColors]);

  return <HighchartsReact highcharts={Highcharts} options={options} />;
});

const EnhancedRecentActivities = ({ title, activities }) => {
  const { themeColors } = useTheme();

  const getActivityColor = (type, severity) => {
    if (severity) {
      switch (severity) {
        case 'high': return themeColors.danger;
        case 'medium': return themeColors.warning;
        case 'low': return themeColors.info;
        default: return themeColors.primary;
      }
    }
    
    switch (type) {
      case 'employee': return themeColors.success;
      case 'leave': return themeColors.warning;
      case 'attendance': return themeColors.danger;
      case 'assets': return themeColors.info;
      default: return themeColors.primary;
    }
  };

  return (
    <div className="p-6 rounded-lg border" style={{ backgroundColor: themeColors.surface, borderColor: themeColors.border }}>
      <h3 className="text-lg font-semibold mb-4" style={{ color: themeColors.text }}>{title}</h3>
      <div className="space-y-3">
        {activities.slice(0, 5).map((activity, index) => (
          <div key={index} className="flex items-start space-x-3 p-3 rounded" style={{ backgroundColor: themeColors.background }}>
            <div className="p-2 rounded-full" style={{ backgroundColor: getActivityColor(activity.type, activity.severity) + '20' }}>
              <div style={{ color: getActivityColor(activity.type, activity.severity) }}>
                {activity.icon}
              </div>
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium" style={{ color: themeColors.text }}>
                {activity.title}
              </p>
              <p className="text-xs mt-1" style={{ color: themeColors.text }}>
                {activity.subtitle}
              </p>
              <p className="text-xs mt-1 opacity-75" style={{ color: themeColors.text }}>
                {new Date(activity.date).toLocaleDateString()}
              </p>
            </div>
          </div>
        ))}
        {activities.length === 0 && (
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