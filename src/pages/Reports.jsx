import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import reportsAPI from "../apis/reportsAPI";
import { BarChart3, Users, DollarSign, Package, TrendingUp, Download, Calendar } from "lucide-react";

const Reports = () => {
  const { themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState('employees');
  const [loading, setLoading] = useState(true);
  const [employeeReports, setEmployeeReports] = useState(null);
  const [payrollReports, setPayrollReports] = useState(null);
  const [assetReports, setAssetReports] = useState(null);
  const [attendanceReports, setAttendanceReports] = useState(null);
  const [leaveReports, setLeaveReports] = useState(null);
  const [departmentReports, setDepartmentReports] = useState(null);

  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  useEffect(() => {
    fetchReports();
  }, [activeTab, selectedYear]);

  const fetchReports = async () => {
    try {
      setLoading(true);
      
      if (activeTab === 'employees') {
        const { data } = await reportsAPI.getEmployeeReports();
        setEmployeeReports(data.data);
      } else if (activeTab === 'payroll') {
        const { data } = await reportsAPI.getPayrollReports({ year: selectedYear });
        setPayrollReports(data.data);
      } else if (activeTab === 'assets') {
        const { data } = await reportsAPI.getAssetReports();
        setAssetReports(data.data);
      } else if (activeTab === 'attendance') {
        const { data } = await reportsAPI.getAttendanceReports();
        setAttendanceReports(data.data);
      } else if (activeTab === 'leaves') {
        const { data } = await reportsAPI.getLeaveReports();
        setLeaveReports(data.data);
      } else if (activeTab === 'departments') {
        const { data } = await reportsAPI.getDepartmentReports();
        setDepartmentReports(data.data);

      }
    } catch (error) {
      console.error('Error fetching reports:', error);
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
                  {payrollReports.monthlyStats.map((month) => (
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
                {payrollReports.statusStats.map((status, index) => (
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
                {payrollReports.departmentPayroll.map((dept, index) => (
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
            <StatCard title="Average Attendance" value={`${attendanceReports.averageAttendance}%`} icon={Calendar} color={themeColors.success} />
            <StatCard title="Present Today" value={attendanceReports.todayAttendance} icon={Users} color={themeColors.primary} />
            <StatCard title="Late Today" value={attendanceReports.lateToday} icon={TrendingUp} color={themeColors.warning} />
            <StatCard title="Total Employees" value={attendanceReports.totalEmployees} icon={Users} color={themeColors.primary} />
          </div>
          <ChartCard title="Monthly Attendance Trends">
            <div className="space-y-3">
              {attendanceReports.monthlyStats.map((stat, index) => {
                const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
                const attendance = Math.round((stat.present / (stat.present + stat.absent + stat.late)) * 100);
                return (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{monthNames[stat._id - 1]}</span>
                    <div className="flex items-center gap-2">
                      <span className="text-sm font-medium">{attendance}%</span>
                      <div className="w-20 bg-gray-200 rounded-full h-2">
                        <div className="h-2 rounded-full" style={{ backgroundColor: themeColors.success, width: `${attendance}%` }}></div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ChartCard>
        </div>
      )}

      {/* Leave Reports */}
      {activeTab === 'leaves' && leaveReports && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <StatCard title="Total Leaves" value={leaveReports.totalLeaves} icon={Calendar} color={themeColors.primary} />
            {leaveReports.statusStats.map((status, index) => (
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
                {leaveReports.typeStats.map((leave, index) => (
                  <div key={index} className="flex justify-between items-center">
                    <span className="text-sm">{leave._id}</span>
                    <span className="text-sm font-medium">{leave.count}</span>
                  </div>
                ))}
              </div>
            </ChartCard>
            <ChartCard title="Monthly Leave Requests">
              <div className="space-y-3">
                {leaveReports.monthlyStats.map((stat, index) => {
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