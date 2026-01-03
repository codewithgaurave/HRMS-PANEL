import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import { useAuth } from "../context/AuthContext";
import reportsAPI from "../apis/reportsAPI";
import apiRoutes from "../contants/api";
import { BarChart3, Users, DollarSign, Package, TrendingUp, Download, Calendar } from "lucide-react";

// Export utility functions
const exportToCSV = (data, filename) => {
  const csvContent = "data:text/csv;charset=utf-8," + data;
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${filename}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
};

const convertToCSV = (objArray, headers) => {
  const array = typeof objArray !== 'object' ? JSON.parse(objArray) : objArray;
  let str = headers.join(',') + '\r\n';
  
  for (let i = 0; i < array.length; i++) {
    let line = '';
    for (let index in headers) {
      if (line !== '') line += ',';
      const header = headers[index];
      const value = array[i][header] || '';
      line += typeof value === 'string' && value.includes(',') ? `"${value}"` : value;
    }
    str += line + '\r\n';
  }
  return str;
};

const Reports = () => {
  const { themeColors } = useTheme();
  const { user } = useAuth();
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);
  const [employeeReports, setEmployeeReports] = useState(null);
  const [payrollReports, setPayrollReports] = useState(null);
  const [assetReports, setAssetReports] = useState(null);
  const [attendanceReports, setAttendanceReports] = useState(null);
  const [leaveReports, setLeaveReports] = useState(null);
  const [departmentReports, setDepartmentReports] = useState(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  const handleExport = () => {
    const currentDate = new Date().toISOString().split('T')[0];
    
    switch (activeTab) {
      case 'employees':
        if (employeeReports) {
          const employeeData = [
            { Category: 'Total Employees', Count: employeeReports.summary.totalEmployees },
            { Category: 'Active Employees', Count: employeeReports.summary.activeEmployees },
            { Category: 'Inactive Employees', Count: employeeReports.summary.inactiveEmployees },
            ...employeeReports.departmentStats.map(dept => ({ Category: `Department - ${dept._id}`, Count: dept.count })),
            ...employeeReports.roleStats.map(role => ({ Category: `Role - ${role._id}`, Count: role.count }))
          ];
          const csv = convertToCSV(employeeData, ['Category', 'Count']);
          exportToCSV(csv, `employee-report-${currentDate}`);
        }
        break;
        
      case 'payroll':
        if (payrollReports && payrollReports.monthlyStats) {
          const payrollData = payrollReports.monthlyStats.map(month => ({
            Month: new Date(0, month._id - 1).toLocaleString('default', { month: 'long' }),
            'Total Payrolls': month.totalPayrolls,
            'Total Gross Salary': month.totalGrossSalary,
            'Total Net Salary': month.totalNetSalary,
            'Average Salary': Math.round(month.avgSalary)
          }));
          const csv = convertToCSV(payrollData, ['Month', 'Total Payrolls', 'Total Gross Salary', 'Total Net Salary', 'Average Salary']);
          exportToCSV(csv, `payroll-report-${selectedYear}-${currentDate}`);
        }
        break;
        
      case 'assets':
        if (assetReports) {
          const assetData = [
            { Category: 'Total Assets', Count: assetReports.totalAssets },
            ...assetReports.statusStats.map(status => ({ Category: `Status - ${status._id}`, Count: status.count })),
            ...assetReports.categoryStats.map(cat => ({ Category: `Category - ${cat._id}`, Count: cat.count, Assigned: cat.assigned }))
          ];
          const csv = convertToCSV(assetData, ['Category', 'Count', 'Assigned']);
          exportToCSV(csv, `asset-report-${currentDate}`);
        }
        break;
        
      case 'attendance':
        if (attendanceReports) {
          const attendanceData = [
            { Metric: 'Average Attendance', Value: `${attendanceReports.averageAttendance}%` },
            { Metric: 'Present Today', Value: attendanceReports.todayAttendance },
            { Metric: 'Late Today', Value: attendanceReports.lateToday },
            { Metric: 'Total Employees', Value: attendanceReports.totalEmployees },
            ...attendanceReports.monthlyStats.map(stat => {
              const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
              const attendance = Math.round((stat.present / (stat.present + stat.absent + stat.late)) * 100);
              return {
                Metric: `${monthNames[stat._id - 1]} Attendance`,
                Value: `${attendance}%`,
                Present: stat.present,
                Absent: stat.absent,
                Late: stat.late
              };
            })
          ];
          const csv = convertToCSV(attendanceData, ['Metric', 'Value', 'Present', 'Absent', 'Late']);
          exportToCSV(csv, `attendance-report-${currentDate}`);
        }
        break;
        
      case 'leaves':
        if (leaveReports) {
          const leaveData = [
            { Category: 'Total Leaves', Count: leaveReports.totalLeaves },
            ...(leaveReports.statusStats || []).map(status => ({ Category: `Status - ${status._id}`, Count: status.count })),
            ...(leaveReports.typeStats || []).map(type => ({ Category: `Type - ${type._id}`, Count: type.count }))
          ];
          const csv = convertToCSV(leaveData, ['Category', 'Count']);
          exportToCSV(csv, `leave-report-${currentDate}`);
        }
        break;
        
      case 'departments':
        if (departmentReports) {
          const deptData = departmentReports.departmentStats.map(dept => ({
            Department: dept._id,
            Employees: dept.employees,
            'Average Salary': Math.round(dept.avgSalary || 0),
            'Total Budget': Math.round(departmentReports.payrollByDept.find(p => p._id === dept._id)?.totalBudget || 0)
          }));
          const csv = convertToCSV(deptData, ['Department', 'Employees', 'Average Salary', 'Total Budget']);
          exportToCSV(csv, `department-report-${currentDate}`);
        }
        break;
        
      default:
        alert('No data available to export');
    }
  };

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      // Use HR team endpoints for HR managers
      const isHRManager = user?.role === 'HR_Manager';
      
      if (activeTab === 'employees') {
        const { data } = isHRManager 
          ? await reportsAPI.getHRTeamEmployeeReports()
          : await reportsAPI.getEmployeeReports();
        setEmployeeReports(data.data);
      } else if (activeTab === 'payroll') {
        const { data } = isHRManager
          ? await reportsAPI.getHRTeamPayrollReports({ year: selectedYear })
          : await reportsAPI.getPayrollReports({ year: selectedYear });
        setPayrollReports(data.data);
      } else if (activeTab === 'assets') {
        const { data } = await reportsAPI.getAssetReports();
        setAssetReports(data.data);
      } else if (activeTab === 'attendance') {
        console.log('=== ATTENDANCE REPORTS DEBUG ===');
        console.log('Current user:', user);
        console.log('User role:', user?.role);
        console.log('Is HR Manager:', isHRManager);
        console.log('Active tab:', activeTab);
        
        const baseURL = import.meta.env.VITE_BASE_API;
        const apiPrefix = import.meta.env.VITE_API_PREFIX || 'api';
        const endpoint = isHRManager ? 'team/attendance' : 'attendance';
        const fullURL = `${baseURL}/${apiPrefix}/reports/${endpoint}`;
        
        console.log('Base URL:', baseURL);
        console.log('API Prefix:', apiPrefix);
        console.log('Endpoint:', endpoint);
        console.log('Full URL:', fullURL);
        console.log('Auth token exists:', !!localStorage.getItem('hrms-token'));
        
        try {
          console.log('Making API call...');
          const response = isHRManager
            ? await reportsAPI.getHRTeamAttendanceReports()
            : await reportsAPI.getAttendanceReports();
            
          console.log('Raw response:', response);
          console.log('Response status:', response.status);
          console.log('Response headers:', response.headers);
          console.log('Response data:', response.data);
          
          if (response.data) {
            console.log('Data structure:', {
              success: response.data.success,
              message: response.data.message,
              data: response.data.data,
              dataKeys: response.data.data ? Object.keys(response.data.data) : 'No data object'
            });
          }
          
          setAttendanceReports(response.data.data);
          console.log('Attendance reports set successfully');
        } catch (apiError) {
          console.error('API call failed:', apiError);
          console.error('Error details:', {
            message: apiError.message,
            status: apiError.response?.status,
            statusText: apiError.response?.statusText,
            data: apiError.response?.data,
            config: apiError.config
          });
          throw apiError;
        }
        console.log('=== END ATTENDANCE DEBUG ===');
      } else if (activeTab === 'leaves') {
        const { data } = isHRManager
          ? await reportsAPI.getHRTeamLeaveReports()
          : await reportsAPI.getLeaveReports();
        setLeaveReports(data.data);
      } else if (activeTab === 'departments') {
        const { data } = await reportsAPI.getDepartmentReports();
        setDepartmentReports(data.data);
      }
    } catch (error) {
      console.error('Error fetching reports:', error);
      console.error('Error response:', error.response);
      console.error('Error message:', error.message);
      if (error.response) {
        console.error('Error status:', error.response.status);
        console.error('Error data:', error.response.data);
      }
    } finally {
      setLoading(false);
    }
  };

  const tabs = [
    { id: 'employees', name: 'Employee Reports', icon: Users },
    { id: 'payroll', name: 'Payroll Reports', icon: DollarSign },
    { id: 'assets', name: 'Asset Reports', icon: Package },
    { id: 'attendance', name: 'Attendance Reports', icon: Calendar },
    { id: 'leaves', name: 'Leave Reports', icon: TrendingUp },
    { id: 'departments', name: 'Department Reports', icon: BarChart3 },

  ];

  const StatCard = ({ title, value, icon: Icon, color = themeColors.primary }) => (
    <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm font-medium" style={{ color: themeColors.textSecondary }}>{title}</p>
          <p className="text-2xl font-bold mt-2">{value}</p>
        </div>
        <div className="p-3 rounded-full" style={{ backgroundColor: color + '20' }}>
          <Icon size={24} style={{ color }} />
        </div>
      </div>
    </div>
  );

  const ChartCard = ({ title, children }) => (
    <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
      <h3 className="text-lg font-semibold mb-4">{title}</h3>
      {children}
    </div>
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: themeColors.primary }}></div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-4" style={{ color: themeColors.text }}>
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reports & Analytics</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Comprehensive insights and analytics dashboard
          </p>
        </div>
        <div className="flex items-center gap-4">
          {activeTab === 'payroll' && (
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(parseInt(e.target.value))}
              className="px-3 py-2 rounded border"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              {Array.from({ length: 5 }, (_, i) => (
                <option key={i} value={new Date().getFullYear() - i}>
                  {new Date().getFullYear() - i}
                </option>
              ))}
            </select>
          )}
          <button
            onClick={handleExport}
            className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Download size={16} />
            Export
          </button>
        </div>
      </div>

      {/* Navigation Tabs */}
      <div className="border-b" style={{ borderColor: themeColors.border }}>
        <nav className="flex space-x-4 overflow-x-auto">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center py-4 px-3 border-b-2 font-medium text-sm transition-colors whitespace-nowrap ${
                  activeTab === tab.id
                    ? 'border-blue-500 text-blue-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
                style={{
                  borderBottomColor: activeTab === tab.id ? themeColors.primary : 'transparent',
                  color: activeTab === tab.id ? themeColors.primary : themeColors.textSecondary
                }}
              >
                <Icon size={16} className="mr-2" />
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Employee Reports */}
      {activeTab === 'employees' && employeeReports && (
        <div className="space-y-6">
          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <StatCard
              title="Total Employees"
              value={employeeReports.summary.totalEmployees}
              icon={Users}
              color={themeColors.primary}
            />
            <StatCard
              title="Active Employees"
              value={employeeReports.summary.activeEmployees}
              icon={TrendingUp}
              color={themeColors.success}
            />
            <StatCard
              title="Inactive Employees"
              value={employeeReports.summary.inactiveEmployees}
              icon={Users}
              color={themeColors.danger}
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Department Stats */}
            <ChartCard title="Department Distribution">
              <div className="space-y-3">
                {employeeReports.departmentStats.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{dept._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{dept.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: themeColors.primary,
                            width: `${(dept.count / employeeReports.summary.totalEmployees) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Role Stats */}
            <ChartCard title="Role Distribution">
              <div className="space-y-3">
                {employeeReports.roleStats.map((role, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{role._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{role.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: themeColors.success,
                            width: `${(role.count / employeeReports.summary.totalEmployees) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Payroll Reports */}
      {activeTab === 'payroll' && payrollReports && (
        <div className="space-y-6">
          {/* Monthly Stats */}
          <ChartCard title={`Monthly Payroll Summary - ${selectedYear}`}>
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: themeColors.background }}>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Month</th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Payrolls</th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Total Gross</th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Total Net</th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Avg Salary</th>
                  </tr>
                </thead>
                <tbody>
                  {payrollReports.monthlyStats && payrollReports.monthlyStats.map((month) => (
                    <tr key={month._id} className="border-b" style={{ borderColor: themeColors.border }}>
                      <td className="p-3 text-sm">
                        {new Date(0, month._id - 1).toLocaleString('default', { month: 'long' })}
                      </td>
                      <td className="p-3 text-sm">{month.totalPayrolls}</td>
                      <td className="p-3 text-sm">₹{month.totalGrossSalary?.toLocaleString()}</td>
                      <td className="p-3 text-sm font-medium">₹{month.totalNetSalary?.toLocaleString()}</td>
                      <td className="p-3 text-sm">₹{Math.round(month.avgSalary)?.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </ChartCard>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Status Stats */}
            <ChartCard title="Payroll Status">
              <div className="space-y-3">
                {payrollReports.statusStats && payrollReports.statusStats.map((status, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{status._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{status.count}</span>
                      <span className="text-xs" style={{ color: themeColors.textSecondary }}>
                        ₹{status.totalAmount?.toLocaleString()}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>

            {/* Department Payroll */}
            <ChartCard title="Department-wise Payroll">
              <div className="space-y-3">
                {payrollReports.departmentPayroll && payrollReports.departmentPayroll.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{dept._id}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">₹{dept.totalAmount?.toLocaleString()}</div>
                      <div className="text-xs" style={{ color: themeColors.textSecondary }}>
                        {dept.employeeCount} employees
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Asset Reports */}
      {activeTab === 'assets' && assetReports && (
        <div className="space-y-6">
          <StatCard
            title="Total Assets"
            value={assetReports.totalAssets}
            icon={Package}
            color={themeColors.primary}
          />
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Asset Status">
              <div className="space-y-3">
                {assetReports.statusStats.map((status, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{status._id}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{status.count}</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div
                          className="h-2 rounded-full"
                          style={{
                            backgroundColor: themeColors.primary,
                            width: `${(status.count / assetReports.totalAssets) * 100}%`
                          }}
                        ></div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Asset Categories">
              <div className="space-y-3">
                {assetReports.categoryStats.map((category, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{category._id}</span>
                    <div className="text-right">
                      <div className="text-sm font-medium">{category.count}</div>
                      <div className="text-xs" style={{ color: themeColors.textSecondary }}>
                        {category.assigned} assigned
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
          <ChartCard title="Top Asset Assignees">
            <div className="space-y-3">
              {assetReports.topAssignees.map((assignee, index) => (
                <div key={index} className="flex justify-between items-center">
                  <div>
                    <span className="text-sm font-medium">{assignee._id.first} {assignee._id.last}</span>
                    <span className="text-xs ml-2" style={{ color: themeColors.textSecondary }}>
                      ({assignee.employeeId})
                    </span>
                  </div>
                  <span className="text-sm font-medium">{assignee.assetCount} assets</span>
                </div>
              ))}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Attendance Reports */}
      {activeTab === 'attendance' && attendanceReports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Average Attendance" value={`${parseFloat(attendanceReports.averageAttendance || 0).toFixed(1)}%`} icon={Calendar} color={themeColors.success} />
            <StatCard title="Present Today" value={attendanceReports.todayAttendance || 0} icon={Users} color={themeColors.primary} />
            <StatCard title="Late Today" value={attendanceReports.lateToday || 0} icon={TrendingUp} color={themeColors.warning} />
            <StatCard title="Total Employees" value={attendanceReports.totalEmployees || attendanceReports.teamSize || 0} icon={Users} color={themeColors.primary} />
          </div>
          <ChartCard title="Monthly Attendance Trends">
            <div className="space-y-3">
              {attendanceReports.monthlyStats && attendanceReports.monthlyStats.length > 0 ? attendanceReports.monthlyStats.map((stat, index) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const totalDays = (stat.present || 0) + (stat.absent || 0) + (stat.late || 0);
                const attendance = totalDays > 0 ? Math.round(((stat.present || 0) / totalDays) * 100) : 0;
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{monthNames[stat._id - 1]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{attendance}%</span>
                      <span className="text-xs" style={{ color: themeColors.textSecondary }}>({stat.present || 0}P/{stat.late || 0}L/{stat.absent || 0}A)</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ backgroundColor: themeColors.success, width: `${attendance}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              }) : (
                <div className="text-center py-4" style={{ color: themeColors.textSecondary }}>
                  <p>No monthly attendance data available</p>
                  <p className="text-xs mt-1">Employees need to mark attendance to see data</p>
                </div>
              )}
            </div>
          </ChartCard>
          
          {/* Additional Info Card */}
          <ChartCard title="Attendance Summary">
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 rounded" style={{ backgroundColor: themeColors.background }}>
                <div className="text-2xl font-bold" style={{ color: themeColors.primary }}>{attendanceReports.teamSize || attendanceReports.totalEmployees || 0}</div>
                <div className="text-sm" style={{ color: themeColors.textSecondary }}>Team Size</div>
              </div>
              <div className="text-center p-4 rounded" style={{ backgroundColor: themeColors.background }}>
                <div className="text-2xl font-bold" style={{ color: themeColors.success }}>{parseFloat(attendanceReports.averageAttendance || 0).toFixed(1)}%</div>
                <div className="text-sm" style={{ color: themeColors.textSecondary }}>Overall Average</div>
              </div>
            </div>
            {parseFloat(attendanceReports.averageAttendance || 0) === 0 && (
              <div className="mt-4 p-3 rounded" style={{ backgroundColor: themeColors.warning + '20', color: themeColors.warning }}>
                <p className="text-sm">📝 No attendance data found. Employees need to start marking attendance to see reports.</p>
              </div>
            )}
          </ChartCard>
        </div>
      )}

      {/* Leave Reports */}
      {activeTab === 'leaves' && leaveReports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Leaves" value={leaveReports.totalLeaves} icon={Calendar} color={themeColors.primary} />
            {leaveReports.statusStats && leaveReports.statusStats.map((status, index) => (
              <StatCard 
                key={index}
                title={status._id} 
                value={status.count} 
                icon={Calendar} 
                color={status._id === 'Approved' ? themeColors.success : status._id === 'Pending' ? themeColors.warning : themeColors.danger} 
              />
            ))}
          </div>
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Leave Types">
              <div className="space-y-3">
                {leaveReports.typeStats && leaveReports.typeStats.map((leave, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{leave._id}</span>
                    <span className="text-sm font-medium">{leave.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Monthly Leave Requests">
              <div className="space-y-3">
                {leaveReports.monthlyStats && leaveReports.monthlyStats.map((stat, index) => {
                  const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                  return (
                    <div key={index} className="flex justify-between items-center">
                      <span className="text-sm">{monthNames[stat._id - 1]}</span>
                      <span className="text-sm font-medium">{stat.approved + stat.pending + stat.rejected}</span>
                    </div>
                  );
                })}
              </div>
            </ChartCard>
          </div>
        </div>
      )}

      {/* Department Reports */}
      {activeTab === 'departments' && departmentReports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <ChartCard title="Department Overview">
              <div className="space-y-3">
                {departmentReports.departmentStats.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: themeColors.background }}>
                    <div>
                      <h3 className="font-medium">{dept._id}</h3>
                      <p className="text-sm" style={{ color: themeColors.textSecondary }}>{dept.employees} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Math.round(dept.avgSalary || 0).toLocaleString()}</p>
                      <p className="text-xs" style={{ color: themeColors.textSecondary }}>Avg Salary</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Department Payroll">
              <div className="space-y-3">
                {departmentReports.payrollByDept.map((dept, index) => (
                  <div key={index} className="flex justify-between items-center p-3 rounded" style={{ backgroundColor: themeColors.background }}>
                    <div>
                      <h3 className="font-medium">{dept._id}</h3>
                      <p className="text-sm" style={{ color: themeColors.textSecondary }}>{dept.employeeCount} employees</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium">₹{Math.round(dept.totalBudget).toLocaleString()}</p>
                      <p className="text-xs" style={{ color: themeColors.textSecondary }}>Total Budget</p>
                    </div>
                  </div>
                ))}
              </div>
            </ChartCard>
          </div>
        </div>
      )}


    </div>
  );
};

export default Reports;