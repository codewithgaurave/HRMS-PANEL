import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import payrollAPI from "../apis/payrollAPI";
import employeeAPI from "../apis/employeeAPI";
import { Plus, Edit, Trash2, DollarSign, Calendar, Users, Download } from "lucide-react";

const Payroll = () => {
  const { themeColors } = useTheme();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);

  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: "",
    page: 1,
    limit: 10
  });

  const [formData, setFormData] = useState({
    employee: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    allowances: {
      hra: "",
      transport: "",
      medical: "",
      other: ""
    },
    deductions: {
      tax: "",
      pf: "",
      insurance: "",
      other: ""
    },
    workingDays: 30,
    presentDays: 30,
    overtimeHours: 0,
    overtimeAmount: 0,
    status: "Pending"
  });

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
  }, [filters]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const { data } = await payrollAPI.getAll(filters);
      setPayrolls(data.payrolls || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching payrolls");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await employeeAPI.getAll({ limit: 100 });
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const calculateSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const totalAllowances = Object.values(formData.allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const totalDeductions = Object.values(formData.deductions).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const overtime = parseFloat(formData.overtimeAmount) || 0;
    
    const grossSalary = basic + totalAllowances + overtime;
    const netSalary = grossSalary - totalDeductions;
    
    return { grossSalary, netSalary };
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const { grossSalary, netSalary } = calculateSalary();
      const payrollData = { ...formData, grossSalary, netSalary };
      
      if (editingPayroll) {
        await payrollAPI.update(editingPayroll._id, payrollData);
      } else {
        await payrollAPI.create(payrollData);
      }
      
      setShowModal(false);
      fetchPayrolls();
      resetForm();
    } catch (err) {
      setError(err.response?.data?.message || "Error saving payroll");
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payroll?")) {
      try {
        await payrollAPI.delete(id);
        fetchPayrolls();
      } catch (err) {
        setError(err.response?.data?.message || "Error deleting payroll");
      }
    }
  };

  const handleGenerateAll = async () => {
    try {
      await payrollAPI.generateForAll({
        month: filters.month,
        year: filters.year
      });
      fetchPayrolls();
    } catch (err) {
      setError(err.response?.data?.message || "Error generating payrolls");
    }
  };

  const resetForm = () => {
    setFormData({
      employee: "",
      month: new Date().getMonth() + 1,
      year: new Date().getFullYear(),
      basicSalary: "",
      allowances: { hra: "", transport: "", medical: "", other: "" },
      deductions: { tax: "", pf: "", insurance: "", other: "" },
      workingDays: 30,
      presentDays: 30,
      overtimeHours: 0,
      overtimeAmount: 0,
      status: "Pending"
    });
    setEditingPayroll(null);
  };

  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employee: payroll.employee._id,
      month: payroll.month,
      year: payroll.year,
      basicSalary: payroll.basicSalary,
      allowances: payroll.allowances,
      deductions: payroll.deductions,
      workingDays: payroll.workingDays,
      presentDays: payroll.presentDays,
      overtimeHours: payroll.overtimeHours,
      overtimeAmount: payroll.overtimeAmount,
      status: payroll.status
    });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const colors = {
      Pending: "bg-yellow-100 text-yellow-800",
      Processed: "bg-blue-100 text-blue-800",
      Paid: "bg-green-100 text-green-800"
    };
    return `px-3 py-1 rounded-full text-xs font-medium ${colors[status] || "bg-gray-100 text-gray-800"}`;
  };

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
          <h1 className="text-2xl font-bold">Payroll Management</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            Manage employee salaries and payroll processing
          </p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={handleGenerateAll}
            className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2"
            style={{ backgroundColor: themeColors.success }}
          >
            <Users size={16} />
            Generate All
          </button>
          <button
            onClick={() => setShowModal(true)}
            className="px-4 py-2 rounded-lg font-medium text-white flex items-center gap-2"
            style={{ backgroundColor: themeColors.primary }}
          >
            <Plus size={16} />
            Add Payroll
          </button>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-4 p-4 rounded-lg" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <select
          value={filters.month}
          onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
        >
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>
              {new Date(0, i).toLocaleString('default', { month: 'long' })}
            </option>
          ))}
        </select>
        <select
          value={filters.year}
          onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={new Date().getFullYear() - i}>
              {new Date().getFullYear() - i}
            </option>
          ))}
        </select>
        <select
          value={filters.status}
          onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
        >
          <option value="">All Status</option>
          <option value="Pending">Pending</option>
          <option value="Processed">Processed</option>
          <option value="Paid">Paid</option>
        </select>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm font-medium">Dismiss</button>
          </div>
        </div>
      )}

      {/* Payroll Table */}
      <div className="p-6 rounded-lg shadow-sm overflow-x-auto" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <table className="w-full border-collapse">
          <thead>
            <tr style={{ backgroundColor: themeColors.background }}>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Employee</th>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Period</th>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Basic Salary</th>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Net Salary</th>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Status</th>
              <th className="p-3 text-left border-b text-sm font-medium" style={{ borderColor: themeColors.border }}>Actions</th>
            </tr>
          </thead>
          <tbody>
            {payrolls.map((payroll) => (
              <tr key={payroll._id} className="border-b" style={{ borderColor: themeColors.border }}>
                <td className="p-3 text-sm">
                  <div>
                    <div className="font-medium">{payroll.employee?.name?.first} {payroll.employee?.name?.last}</div>
                    <div className="text-xs" style={{ color: themeColors.textSecondary }}>{payroll.employee?.employeeId}</div>
                  </div>
                </td>
                <td className="p-3 text-sm">
                  {new Date(0, payroll.month - 1).toLocaleString('default', { month: 'long' })} {payroll.year}
                </td>
                <td className="p-3 text-sm">₹{payroll.basicSalary?.toLocaleString()}</td>
                <td className="p-3 text-sm font-medium">₹{payroll.netSalary?.toLocaleString()}</td>
                <td className="p-3">
                  <span className={getStatusBadge(payroll.status)}>{payroll.status}</span>
                </td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => openEditModal(payroll)}
                      className="p-2 rounded text-white"
                      style={{ backgroundColor: themeColors.primary }}
                      title="Edit"
                    >
                      <Edit size={14} />
                    </button>
                    <button
                      onClick={() => handleDelete(payroll._id)}
                      className="p-2 rounded text-white"
                      style={{ backgroundColor: themeColors.danger }}
                      title="Delete"
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="rounded-lg shadow-lg max-w-4xl w-full max-h-[90vh] overflow-y-auto" style={{ backgroundColor: themeColors.surface }}>
            <div className="p-6 border-b" style={{ borderColor: themeColors.border }}>
              <h2 className="text-xl font-semibold">{editingPayroll ? "Edit Payroll" : "Create New Payroll"}</h2>
            </div>
            
            <form onSubmit={handleSubmit} className="p-6 space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-2">Employee *</label>
                  <select
                    value={formData.employee}
                    onChange={(e) => {
                      const employee = employees.find(emp => emp._id === e.target.value);
                      setFormData(prev => ({ 
                        ...prev, 
                        employee: e.target.value,
                        basicSalary: employee?.salary || ""
                      }));
                    }}
                    className="w-full p-2 rounded-md border text-sm"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>
                        {emp.name?.first} {emp.name?.last} ({emp.employeeId})
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full p-2 rounded-md border text-sm"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>
                        {new Date(0, i).toLocaleString('default', { month: 'long' })}
                      </option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full p-2 rounded-md border text-sm"
                    style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    required
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>
                        {new Date().getFullYear() - i}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Salary & Allowances */}
                <div className="space-y-4">
                  <h3 className="font-medium">Salary & Allowances</h3>
                  <div>
                    <label className="block text-sm font-medium mb-2">Basic Salary *</label>
                    <input
                      type="number"
                      value={formData.basicSalary}
                      onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: e.target.value }))}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      required
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">HRA</label>
                      <input
                        type="number"
                        value={formData.allowances.hra}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          allowances: { ...prev.allowances, hra: e.target.value }
                        }))}
                        className="w-full p-2 rounded-md border text-sm"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">Transport</label>
                      <input
                        type="number"
                        value={formData.allowances.transport}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          allowances: { ...prev.allowances, transport: e.target.value }
                        }))}
                        className="w-full p-2 rounded-md border text-sm"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      />
                    </div>
                  </div>
                </div>

                {/* Deductions */}
                <div className="space-y-4">
                  <h3 className="font-medium">Deductions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-sm font-medium mb-2">Tax</label>
                      <input
                        type="number"
                        value={formData.deductions.tax}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, tax: e.target.value }
                        }))}
                        className="w-full p-2 rounded-md border text-sm"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-medium mb-2">PF</label>
                      <input
                        type="number"
                        value={formData.deductions.pf}
                        onChange={(e) => setFormData(prev => ({ 
                          ...prev, 
                          deductions: { ...prev.deductions, pf: e.target.value }
                        }))}
                        className="w-full p-2 rounded-md border text-sm"
                        style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                      />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-2">Status</label>
                    <select
                      value={formData.status}
                      onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))}
                      className="w-full p-2 rounded-md border text-sm"
                      style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                    >
                      <option value="Pending">Pending</option>
                      <option value="Processed">Processed</option>
                      <option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Salary Summary */}
              <div className="p-4 rounded border" style={{ backgroundColor: themeColors.background, borderColor: themeColors.border }}>
                <h3 className="font-medium mb-2">Salary Summary</h3>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Gross Salary: ₹{calculateSalary().grossSalary.toLocaleString()}</div>
                  <div className="font-medium">Net Salary: ₹{calculateSalary().netSalary.toLocaleString()}</div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button
                  type="button"
                  onClick={() => { setShowModal(false); resetForm(); }}
                  className="px-4 py-2 rounded-lg border font-medium"
                  style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 rounded-lg font-medium text-white"
                  style={{ backgroundColor: themeColors.primary }}
                >
                  {editingPayroll ? "Update" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;