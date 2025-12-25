import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import attendanceAPI from "../apis/attendanceAPI";
import { getCurrentLocation } from "../utils/locationUtils";
import { 
  Clock, 
  MapPin, 
  Calendar, 
  Users, 
  User, 
  Grid, 
  List, 
  CheckCircle,
  XCircle,
  AlertCircle,
  TrendingUp,
  Filter,
  RefreshCw,
  Building,
  Users as DepartmentsIcon,
  Briefcase,
  Navigation
} from "lucide-react";

const Attendance = () => {
  const { themeColors } = useTheme();
  const [activeTab, setActiveTab] = useState("myAttendance");
  const [viewMode, setViewMode] = useState("list");
  const [loading, setLoading] = useState(false);
  const [locationLoading, setLocationLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  // Data states
  const [todayAttendance, setTodayAttendance] = useState(null);
  const [myAttendance, setMyAttendance] = useState([]);
  const [allAttendance, setAllAttendance] = useState([]);
  const [attendanceSummary, setAttendanceSummary] = useState(null);
  const [filtersData, setFiltersData] = useState({
    departments: [],
    designations: [],
    officeLocations: [],
    shifts: [],
    statusCounts: {}
  });

  // Enhanced Filter states
  const [filters, setFilters] = useState({
    search: "",
    status: "All",
    department: "All",
    designation: "All",
    officeLocation: "All",
    shift: "All",
    startDate: "",
    endDate: "",
    page: 1,
    limit: 10,
    sortBy: "date",
    sortOrder: "desc"
  });

  // Location state
  const [currentLocation, setCurrentLocation] = useState(null);

  // Fetch current location
  const fetchCurrentLocation = async () => {
    try {
      setLocationLoading(true);
      setError(null);
      
      const location = await getCurrentLocation();
      setCurrentLocation(location);
      
      return location;
    } catch (err) {
      setError(`Location Error: ${err.message}`);
      return null;
    } finally {
      setLocationLoading(false);
    }
  };

  // Fetch filters data
  const fetchFiltersData = async () => {
    try {
      const { data } = await attendanceAPI.getAttendanceFilters();
      setFiltersData(data.filters);
    } catch (err) {
      console.error("Error fetching filters data:", err);
    }
  };

  // Punch In handler
  const handlePunchIn = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await fetchCurrentLocation();
      if (!location) {
        setError("Unable to get your location. Please enable location services.");
        return;
      }

      const punchInData = {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      const { data } = await attendanceAPI.punchIn(punchInData);
      
      setTodayAttendance(data.attendance);
      setSuccess("Punch in successful!");
      
      // Refresh today's attendance
      fetchTodayAttendance();
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Punch in failed");
    } finally {
      setLoading(false);
    }
  };

  // Punch Out handler
  const handlePunchOut = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const location = await fetchCurrentLocation();
      if (!location) {
        setError("Unable to get your location. Please enable location services.");
        return;
      }

      const punchOutData = {
        coordinates: {
          latitude: location.latitude,
          longitude: location.longitude
        }
      };

      const { data } = await attendanceAPI.punchOut(punchOutData);
      
      setTodayAttendance(data.attendance);
      setSuccess("Punch out successful!");
      
      // Refresh today's attendance and summary
      fetchTodayAttendance();
      fetchAttendanceSummary();
      
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Punch out failed");
    } finally {
      setLoading(false);
    }
  };

  // Fetch today's attendance
  const fetchTodayAttendance = async () => {
    try {
      const { data } = await attendanceAPI.getTodayAttendance();
      setTodayAttendance(data.attendance);
    } catch (err) {
      console.error("Error fetching today's attendance:", err);
    }
  };

  // Fetch my attendance records
  const fetchMyAttendance = async () => {
    try {
      setLoading(true);
      const { data } = await attendanceAPI.getMyAttendance(filters);
      setMyAttendance(data.attendances || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching attendance records");
    } finally {
      setLoading(false);
    }
  };

  // Fetch all attendance (for managers/HR)
  const fetchAllAttendance = async () => {
    try {
      setLoading(true);
      const { data } = await attendanceAPI.getAttendance({
        ...filters,
        employeeId: "" // Empty to get all
      });
      setAllAttendance(data.attendance || []);
    } catch (err) {
      setError(err.response?.data?.message || err.message || "Error fetching all attendance");
    } finally {
      setLoading(false);
    }
  };

  // Fetch attendance summary
  const fetchAttendanceSummary = async () => {
    try {
      const { data } = await attendanceAPI.getAttendanceSummary();
      setAttendanceSummary(data.summary);
    } catch (err) {
      console.error("Error fetching attendance summary:", err);
    }
  };

  // Handle filter changes
  const handleFilterChange = (key, value) => {
    setFilters(prev => ({
      ...prev,
      [key]: value,
      page: 1
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: "",
      status: "All",
      department: "All",
      designation: "All",
      officeLocation: "All",
      shift: "All",
      startDate: "",
      endDate: "",
      page: 1,
      limit: 10,
      sortBy: "date",
      sortOrder: "desc"
    });
  };

  const handlePageRefresh = async () => {
    setLoading(true);
    await Promise.all([
      fetchAllAttendance(),
      fetchAttendanceSummary(),
      fetchMyAttendance(),
      fetchTodayAttendance(),
      fetchFiltersData()
    ]);
    clearFilters();
    setLoading(false);
  };

  // Format time
  const formatTime = (dateString) => {
    if (!dateString) return '--:--';
    return new Date(dateString).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-US', {
      weekday: 'short',
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  // Format employee name
  const formatEmployeeName = (employee) => {
    if (!employee) return 'N/A';
    
    if (typeof employee.name === 'string') {
      return employee.name;
    }
    
    if (employee.name && typeof employee.name === 'object') {
      const { first, last } = employee.name;
      return `${first || ''} ${last || ''}`.trim() || 'N/A';
    }
    
    return 'N/A';
  };

  // Get status badge style
  const getStatusBadge = (status) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    
    switch (status) {
      case "Present":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "Late":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
      case "Early Departure":
        return `${baseClasses} bg-orange-100 text-orange-800`;
      case "Half Day":
        return `${baseClasses} bg-blue-100 text-blue-800`;
      case "Absent":
        return `${baseClasses} bg-red-100 text-red-800`;
      case "On Leave":
        return `${baseClasses} bg-purple-100 text-purple-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  // Get status icon
  const getStatusIcon = (status) => {
    switch (status) {
      case "Present":
        return <CheckCircle size={16} className="text-green-500" />;
      case "Late":
      case "Early Departure":
        return <AlertCircle size={16} className="text-yellow-500" />;
      case "Absent":
        return <XCircle size={16} className="text-red-500" />;
      default:
        return <Clock size={16} className="text-gray-500" />;
    }
  };

  // Get filter count badge
  const getFilterCount = (status) => {
    return filtersData.statusCounts[status] || 0;
  };

  // Initialize component
  useEffect(() => {
    fetchCurrentLocation();
    fetchTodayAttendance();
    fetchAttendanceSummary();
    fetchFiltersData();
  }, []);

  // Fetch data when filters or active tab changes
  useEffect(() => {
    if (activeTab === "myAttendance") {
      fetchMyAttendance();
    } else if (activeTab === "allAttendance") {
      fetchAllAttendance();
    }
  }, [filters, activeTab]);

  // Clear messages after 5 seconds
  useEffect(() => {
    if (error || success) {
      const timer = setTimeout(() => {
        setError(null);
        setSuccess(null);
      }, 5000);
      return () => clearTimeout(timer);
    }
  }, [error, success]);

  const currentAttendance = activeTab === "myAttendance" ? myAttendance : allAttendance;

  return (
    <div className="space-y-6 p-4" style={{ color: themeColors.text }}>
      
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Attendance Management</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Track and manage employee attendance
          </p>
        </div>
        <div className="flex gap-3 mt-4 md:mt-0">
          <button
            onClick={clearFilters}
            className="px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-90 flex items-center gap-2"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            <Filter size={16} />
            Clear Filters
          </button>
          <button
            onClick={handlePageRefresh}
            disabled={loading}
            className="px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-90 flex items-center gap-2"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            <RefreshCw size={16} className={loading ? "animate-spin" : ""} />
            Refresh 
          </button>
          <button
            onClick={fetchCurrentLocation}
            disabled={locationLoading}
            className="px-4 py-2 rounded-lg border font-medium transition-colors hover:opacity-90 flex items-center gap-2"
            style={{
              backgroundColor: themeColors.background,
              borderColor: themeColors.border,
              color: themeColors.text
            }}
          >
            <Navigation size={16} className={locationLoading ? "animate-spin" : ""} />
            Location
          </button>
        </div>
      </div>

      {/* Messages */}
      {error && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: themeColors.danger + '20', 
          borderColor: themeColors.danger,
          color: themeColors.danger
        }}>
          <div className="flex items-center gap-2">
            <AlertCircle size={16} />
            <span>{error}</span>
          </div>
        </div>
      )}

      {success && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: themeColors.success + '20', 
          borderColor: themeColors.success,
          color: themeColors.success
        }}>
          <div className="flex items-center gap-2">
            <CheckCircle size={16} />
            <span>{success}</span>
          </div>
        </div>
      )}

      {/* Location Display */}
      {currentLocation && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: themeColors.info + '10', 
          borderColor: themeColors.info,
          color: themeColors.info
        }}>
          <div className="flex items-center gap-2">
            <MapPin size={16} />
            <span>Current Location: {currentLocation.address}</span>
          </div>
          <div className="text-xs mt-1 opacity-75">
            Accuracy: ±{currentLocation.accuracy?.toFixed(1)} meters
          </div>
        </div>
      )}

      {/* Punch In/Out Section */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Today's Status Card */}
        <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <Calendar size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold">Today's Status</h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                {new Date().toLocaleDateString('en-US', { 
                  weekday: 'long', 
                  year: 'numeric', 
                  month: 'long', 
                  day: 'numeric' 
                })}
              </p>
            </div>
          </div>
          
          {todayAttendance ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Punch In:</span>
                <span className="font-medium">{formatTime(todayAttendance.punchIn?.timestamp)}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Punch Out:</span>
                <span className="font-medium">
                  {todayAttendance.punchOut?.timestamp 
                    ? formatTime(todayAttendance.punchOut.timestamp)
                    : '--:--'
                  }
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Status:</span>
                <span className={getStatusBadge(todayAttendance.status)}>
                  {todayAttendance.status}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Work Hours:</span>
                <span className="font-medium">{todayAttendance.totalWorkHours?.toFixed(2)}h</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: themeColors.textSecondary }}>
              <p>No attendance recorded for today</p>
            </div>
          )}
        </div>

        {/* Quick Actions Card */}
        <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <Clock size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold">Quick Actions</h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                Mark your attendance
              </p>
            </div>
          </div>
          
          <div className="space-y-3">
            <button
              onClick={handlePunchIn}
              disabled={loading || locationLoading || (todayAttendance && todayAttendance.punchIn)}
              className="w-full py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColors.success }}
            >
              <Clock size={18} />
              {todayAttendance?.punchIn ? 'Already Punched In' : 'Punch In'}
            </button>
            
            <button
              onClick={handlePunchOut}
              disabled={loading || locationLoading || !todayAttendance?.punchIn || todayAttendance?.punchOut}
              className="w-full py-3 rounded-lg font-medium text-white transition-colors hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
              style={{ backgroundColor: themeColors.danger }}
            >
              <Clock size={18} />
              {todayAttendance?.punchOut ? 'Already Punched Out' : 'Punch Out'}
            </button>
          </div>
        </div>

        {/* Summary Card */}
        <div className="p-6 rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="flex items-center gap-3 mb-4">
            <TrendingUp size={24} style={{ color: themeColors.primary }} />
            <div>
              <h3 className="font-semibold">This Month</h3>
              <p className="text-sm" style={{ color: themeColors.textSecondary }}>
                Attendance Summary
              </p>
            </div>
          </div>
          
          {attendanceSummary ? (
            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-sm">Present:</span>
                <span className="font-medium text-green-600">{attendanceSummary.stats.present}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Late:</span>
                <span className="font-medium text-yellow-600">{attendanceSummary.stats.late}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Absent:</span>
                <span className="font-medium text-red-600">{attendanceSummary.stats.absent}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-sm">Percentage:</span>
                <span className="font-medium">{attendanceSummary.performance.attendancePercentage}%</span>
              </div>
            </div>
          ) : (
            <div className="text-center py-4" style={{ color: themeColors.textSecondary }}>
              <p>Loading summary...</p>
            </div>
          )}
        </div>
      </div>

      {/* Main Content Tabs */}
      <div className="bg-white rounded-lg shadow-sm" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        
        {/* Tabs Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between p-4 border-b" style={{ borderColor: themeColors.border }}>
          <div className="flex space-x-1 mb-4 md:mb-0">
            <button
              onClick={() => setActiveTab("myAttendance")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "myAttendance" 
                  ? "text-white" 
                  : "hover:opacity-90"
              }`}
              style={{
                backgroundColor: activeTab === "myAttendance" ? themeColors.primary : themeColors.background,
                color: activeTab === "myAttendance" ? 'white' : themeColors.text
              }}
            >
              <User size={16} className="inline mr-2" />
              My Attendance
            </button>
            <button
              onClick={() => setActiveTab("allAttendance")}
              className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                activeTab === "allAttendance" 
                  ? "text-white" 
                  : "hover:opacity-90"
              }`}
              style={{
                backgroundColor: activeTab === "allAttendance" ? themeColors.primary : themeColors.background,
                color: activeTab === "allAttendance" ? 'white' : themeColors.text
              }}
            >
              <Users size={16} className="inline mr-2" />
              All Attendance
            </button>
          </div>

          {/* View Mode Toggle */}
          <div className="flex items-center gap-2">
            <span className="text-sm" style={{ color: themeColors.textSecondary }}>View:</span>
            <div className="flex border rounded-lg" style={{ borderColor: themeColors.border }}>
              <button
                onClick={() => setViewMode("list")}
                className={`p-2 ${viewMode === "list" ? "text-white" : ""}`}
                style={{
                  backgroundColor: viewMode === "list" ? themeColors.primary : themeColors.background,
                  color: viewMode === "list" ? 'white' : themeColors.text
                }}
              >
                <List size={16} />
              </button>
              <button
                onClick={() => setViewMode("grid")}
                className={`p-2 ${viewMode === "grid" ? "text-white" : ""}`}
                style={{
                  backgroundColor: viewMode === "grid" ? themeColors.primary : themeColors.background,
                  color: viewMode === "grid" ? 'white' : themeColors.text
                }}
              >
                <Grid size={16} />
              </button>
            </div>
          </div>
        </div>

        {/* Enhanced Filters Section */}
        <div className="p-4 border-b" style={{ borderColor: themeColors.border }}>
          <h3 className="text-lg font-semibold mb-4">Filters</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {/* Search */}
            <div>
              <label className="block text-sm font-medium mb-2">Search Employee</label>
              <input
                type="text"
                placeholder="Search by name or ID..."
                value={filters.search}
                onChange={(e) => handleFilterChange('search', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              />
            </div>

            {/* Status Filter with Counts */}
            <div>
              <label className="block text-sm font-medium mb-2">Status</label>
              <select
                value={filters.status}
                onChange={(e) => handleFilterChange('status', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                <option value="All">All Status</option>
                <option value="Present">Present ({getFilterCount('Present')})</option>
                <option value="Late">Late ({getFilterCount('Late')})</option>
                <option value="Early Departure">Early Departure ({getFilterCount('Early Departure')})</option>
                <option value="Half Day">Half Day ({getFilterCount('Half Day')})</option>
                <option value="Absent">Absent ({getFilterCount('Absent')})</option>
                <option value="On Leave">On Leave ({getFilterCount('On Leave')})</option>
              </select>
            </div>

            {/* Department Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <DepartmentsIcon size={14} className="inline mr-1" />
                Department
              </label>
              <select
                value={filters.department}
                onChange={(e) => handleFilterChange('department', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                <option value="All">All Departments</option>
                {filtersData.departments.map(dept => (
                  <option key={dept._id} value={dept._id}>
                    {dept.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Designation Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Briefcase size={14} className="inline mr-1" />
                Designation
              </label>
              <select
                value={filters.designation}
                onChange={(e) => handleFilterChange('designation', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                <option value="All">All Designations</option>
                {filtersData.designations.map(desig => (
                  <option key={desig._id} value={desig._id}>
                    {desig.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Office Location Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Building size={14} className="inline mr-1" />
                Office Location
              </label>
              <select
                value={filters.officeLocation}
                onChange={(e) => handleFilterChange('officeLocation', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                <option value="All">All Locations</option>
                {filtersData.officeLocations.map(loc => (
                  <option key={loc._id} value={loc._id}>
                    {loc.officeName}
                  </option>
                ))}
              </select>
            </div>

            {/* Shift Filter */}
            <div>
              <label className="block text-sm font-medium mb-2">
                <Clock size={14} className="inline mr-1" />
                Work Shift
              </label>
              <select
                value={filters.shift}
                onChange={(e) => handleFilterChange('shift', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              >
                <option value="All">All Shifts</option>
                {filtersData.shifts.map(shift => (
                  <option key={shift._id} value={shift._id}>
                    {shift.name}
                  </option>
                ))}
              </select>
            </div>

            {/* Date Range Filters */}
            <div>
              <label className="block text-sm font-medium mb-2">Start Date</label>
              <input
                type="date"
                value={filters.startDate}
                onChange={(e) => handleFilterChange('startDate', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2">End Date</label>
              <input
                type="date"
                value={filters.endDate}
                onChange={(e) => handleFilterChange('endDate', e.target.value)}
                className="w-full p-2 rounded-md border text-sm"
                style={{ 
                  backgroundColor: themeColors.background, 
                  borderColor: themeColors.border, 
                  color: themeColors.text 
                }}
              />
            </div>
          </div>
        </div>

        {/* Content Area */}
        <div className="p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2" style={{ borderColor: themeColors.primary }}></div>
            </div>
          ) : currentAttendance.length === 0 ? (
            <div className="text-center py-8" style={{ color: themeColors.textSecondary }}>
              <Clock size={48} className="mx-auto mb-4 opacity-50" />
              <p>No attendance records found</p>
              <p className="text-sm mt-1">Try adjusting your filters</p>
            </div>
          ) : viewMode === "list" ? (
            /* List View */
            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr style={{ backgroundColor: themeColors.background }}>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Date
                    </th>
                        <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                          Employee
                        </th>
                    {activeTab === "allAttendance" && (
                      <>
                        <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                          Department
                        </th>
                        <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                          Designation
                        </th>
                      </>
                    )}
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Punch In
                    </th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Punch Out
                    </th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Work Hours
                    </th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Status
                    </th>
                    <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>
                      Location
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {currentAttendance.map((attendance) => (
                    <tr key={attendance._id} className="border-b" style={{ borderColor: themeColors.border }}>
                      <td className="p-3 text-sm">
                        {formatDate(attendance.date)}
                      </td>
                          <td className="p-3 text-sm">
                            <div className="font-medium">
                              {formatEmployeeName(attendance.employee)}
                            </div>
                            <div className="text-xs" style={{ color: themeColors.textSecondary }}>
                              {attendance.employee?.employeeId || ''}
                            </div>
                          </td>
                      {activeTab === "allAttendance" && (
                        <>
                          <td className="p-3 text-sm">
                            {attendance.employee?.department?.name || 'N/A'}
                          </td>
                          <td className="p-3 text-sm">
                            {attendance.employee?.designation?.title || 'N/A'}
                          </td>
                        </>
                      )}
                      <td className="p-3 text-sm">
                        <div className="font-medium">{formatTime(attendance.punchIn?.timestamp)}</div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">
                          {attendance.punchOut?.timestamp 
                            ? formatTime(attendance.punchOut.timestamp)
                            : '--:--'
                          }
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="font-medium">{attendance.totalWorkHours?.toFixed(2)}h</div>
                        {attendance.overtimeHours > 0 && (
                          <div className="text-xs text-green-600">
                            OT: {attendance.overtimeHours.toFixed(2)}h
                          </div>
                        )}
                      </td>
                      <td className="p-3">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(attendance.status)}
                          <span className={getStatusBadge(attendance.status)}>
                            {attendance.status}
                          </span>
                        </div>
                      </td>
                      <td className="p-3 text-sm">
                        <div className="flex items-center gap-1">
                          <MapPin size={14} className={attendance.isWithinOfficeLocation ? "text-green-500" : "text-red-500"} />
                          <span className={attendance.isWithinOfficeLocation ? "text-green-600" : "text-red-600"}>
                            {attendance.isWithinOfficeLocation ? "Within Office" : "Outside Office"}
                          </span>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            /* Grid View */
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {currentAttendance.map((attendance) => (
                <div 
                  key={attendance._id} 
                  className="p-4 rounded-lg border transition-colors hover:shadow-md"
                  style={{ 
                    backgroundColor: themeColors.background, 
                    borderColor: themeColors.border 
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h4 className="font-semibold">{formatDate(attendance.date)}</h4>
                      {activeTab === "allAttendance" && (
                        <div className="space-y-1">
                          <p className="text-sm font-medium">{formatEmployeeName(attendance.employee)}</p>
                          <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                            {attendance.employee?.employeeId} • {attendance.employee?.department?.name}
                          </p>
                          <p className="text-xs" style={{ color: themeColors.textSecondary }}>
                            {attendance.employee?.designation?.title}
                          </p>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      {getStatusIcon(attendance.status)}
                      <span className={getStatusBadge(attendance.status)}>
                        {attendance.status}
                      </span>
                    </div>
                  </div>

                  <div className="space-y-2 text-sm">
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>Punch In:</span>
                      <span className="font-medium">{formatTime(attendance.punchIn?.timestamp)}</span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>Punch Out:</span>
                      <span className="font-medium">
                        {attendance.punchOut?.timestamp 
                          ? formatTime(attendance.punchOut.timestamp)
                          : '--:--'
                        }
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span style={{ color: themeColors.textSecondary }}>Work Hours:</span>
                      <span className="font-medium">{attendance.totalWorkHours?.toFixed(2)}h</span>
                    </div>
                    {attendance.overtimeHours > 0 && (
                      <div className="flex justify-between">
                        <span style={{ color: themeColors.textSecondary }}>Overtime:</span>
                        <span className="font-medium text-green-600">{attendance.overtimeHours.toFixed(2)}h</span>
                      </div>
                    )}
                    <div className="flex justify-between items-center">
                      <span style={{ color: themeColors.textSecondary }}>Location:</span>
                      <div className="flex items-center gap-1">
                        <MapPin size={14} className={attendance.isWithinOfficeLocation ? "text-green-500" : "text-red-500"} />
                        <span className={`text-xs ${attendance.isWithinOfficeLocation ? "text-green-600" : "text-red-600"}`}>
                          {attendance.isWithinOfficeLocation ? "In Office" : "Outside"}
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Attendance;