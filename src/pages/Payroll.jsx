import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import payrollAPI from "../apis/payrollAPI";
import employeeAPI from "../apis/employeeAPI";
import { toast } from "sonner";
import { Plus, Edit, Trash2, DollarSign, Calendar, Users, Download, RefreshCw } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const Payroll = () => {
  const { themeColors } = useTheme();
  const [payrolls, setPayrolls] = useState([]);
  const [employees, setEmployees] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showModal, setShowModal] = useState(false);
  const [editingPayroll, setEditingPayroll] = useState(null);

  const [filters, setFilters] = useState({
    month: "", 
    year: new Date().getFullYear(),
    status: "",
    page: 1,
    limit: 10
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [formData, setFormData] = useState({
    employee: "",
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    basicSalary: "",
    allowances: { hra: "", transport: "", medical: "", other: "" },
    deductions: { tax: "", taxPercent: "", pf: "", pfPercent: "", insurance: "", other: "" },
    workingDays: 30,
    presentDays: 30,
    overtimeHours: 0,
    overtimeAmount: 0,
    status: "Pending"
  });

  useEffect(() => {
    fetchPayrolls();
    fetchEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      const { data } = await payrollAPI.getHRTeamPayrolls(filters);
      setPayrolls(data.payrolls || []);
    } catch (err) {
      setError(err.response?.data?.message || "Error fetching payrolls");
    } finally {
      setLoading(false);
    }
  };

  const fetchEmployees = async () => {
    try {
      const { data } = await employeeAPI.getEmployeesAddedByMe({ limit: 100 });
      setEmployees(data.employees || []);
    } catch (err) {
      console.error("Error fetching employees:", err);
    }
  };

  const getMonthName = (monthNumber) => {
    const months = [
      "January", "February", "March", "April", "May", "June",
      "July", "August", "September", "October", "November", "December"
    ];
    return months[monthNumber - 1] || "Unknown";
  };

  const loadImage = (url) => {
    return new Promise((resolve) => {
      const img = new Image();
      img.src = url;
      img.crossOrigin = 'Anonymous';
      img.onload = () => {
        const canvas = document.createElement('canvas');
        canvas.width = img.width;
        canvas.height = img.height;
        const ctx = canvas.getContext('2d');
        ctx.drawImage(img, 0, 0);
        resolve(canvas.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
    });
  };

  const handleDownloadSlip = async (payrollId) => {
    try {
      const response = await payrollAPI.getById(payrollId);
      const p = response.data.payroll;

      const numberToWords = (num) => {
        const a = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine', 'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen'];
        const b = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety'];
        const n = ('000000000' + Math.floor(num)).substr(-9).match(/^(\d{2})(\d{2})(\d{2})(\d{1})(\d{2})$/);
        if (!n) return '';
        let str = '';
        str += (n[1] != 0) ? (a[Number(n[1])] || b[n[1][0]] + ' ' + a[n[1][1]]) + ' Crore ' : '';
        str += (n[2] != 0) ? (a[Number(n[2])] || b[n[2][0]] + ' ' + a[n[2][1]]) + ' Lakh ' : '';
        str += (n[3] != 0) ? (a[Number(n[3])] || b[n[3][0]] + ' ' + a[n[3][1]]) + ' Thousand ' : '';
        str += (n[4] != 0) ? (a[Number(n[4])] || b[n[4][0]] + ' ' + a[n[4][1]]) + ' Hundred ' : '';
        str += (n[5] != 0) ? ((str != '') ? 'And ' : '') + (a[Number(n[5])] || b[n[5][0]] + ' ' + a[n[5][1]]) : '';
        return str ? 'Rupees ' + str + ' Only' : '';
      };

      const formatPDFCurrency = (num) => {
        return new Intl.NumberFormat('en-IN', {
          minimumFractionDigits: 2,
          maximumFractionDigits: 2
        }).format(num || 0);
      };

      const allowancesObj = p.allowances && !Array.isArray(p.allowances) ? p.allowances : {};
      const deductionsObj = p.deductions && !Array.isArray(p.deductions) ? p.deductions : {};
      const totalDeductions =
        (deductionsObj.tax || 0) + (deductionsObj.pf || 0) +
        (deductionsObj.insurance || 0) + (deductionsObj.other || 0);

      const tableData = [
        [1, 'Basic Salary', formatPDFCurrency(p.basicSalary)],
        [2, 'HRA', formatPDFCurrency(allowancesObj.hra || 0)],
        [3, 'Transport Allowance', formatPDFCurrency(allowancesObj.transport || 0)],
        [4, 'Medical Allowance', formatPDFCurrency(allowancesObj.medical || 0)],
        [5, 'Other Allowances', formatPDFCurrency(allowancesObj.other || 0)],
        [6, 'Overtime Amount', formatPDFCurrency(p.overtimeAmount || 0)],
      ];

      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const margin = 10;
      const logoUrl = `${window.location.origin}/hrms_logo.png`;
      const logoData = await loadImage(logoUrl);

      if (logoData) {
        const c = document.createElement('canvas');
        const src = new Image(); src.src = logoData;
        await new Promise(r => { src.onload = r; });
        c.width = src.width; c.height = src.height;
        const ctx = c.getContext('2d');
        ctx.globalAlpha = 0.08; 
        ctx.drawImage(src, 0, 0);
        doc.addImage(c.toDataURL('image/png'), 'PNG', (W - 140) / 2, (H - 140) / 2, 140, 140);
      }

      doc.setDrawColor(0); doc.setLineWidth(0.3);
      doc.rect(margin, margin, W - (margin * 2), H - (margin * 2));
      doc.line(margin, margin + 8, W - margin, margin + 8);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(10);
      doc.text('Salary Slip / Payment Advice', W / 2, margin + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal'); doc.setFontSize(8);
      doc.text('(Original for Employee)', W - margin - 2, margin + 5.5, { align: 'right' });

      const sec1H = 45;
      const colWidth = (W - (margin * 2)) / 3;
      doc.setFontSize(8); doc.text('Employer', margin + 2, margin + 12);
      
      if (logoData) {
        const imgProps = doc.getImageProperties(logoData);
        const maxW = colWidth * 1.3 - 10;
        const maxH = sec1H - 15;
        let imgW = imgProps.width; let imgH = imgProps.height;
        const ratio = Math.min(maxW / imgW, maxH / imgH);
        imgW *= ratio; imgH *= ratio;
        doc.addImage(logoData, 'PNG', margin + (colWidth * 1.3 - imgW) / 2, margin + 13 + (maxH - imgH) / 2, imgW, imgH);
      }

      doc.line(margin + colWidth * 1.3, margin + 8, margin + colWidth * 1.3, margin + 8 + sec1H);
      doc.line(margin + colWidth * 2.1, margin + 8, margin + colWidth * 2.1, margin + 8 + sec1H);

      const sx2 = margin + colWidth * 1.3 + 3;
      doc.text('Employee To', sx2, margin + 12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`Name: ${p.employee?.name?.first} ${p.employee?.name?.last}`, sx2, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee ID: ${p.employee?.employeeId}`, sx2, margin + 23);
      doc.text(`Department: ${p.employee?.department?.name || 'N/A'}`, sx2, margin + 27);
      doc.text(`Designation: ${p.employee?.designation?.title || 'N/A'}`, sx2, margin + 31);

      const sx3 = margin + colWidth * 2.1 + 3;
      doc.setFont('helvetica', 'bold'); doc.text(`Slip No: SLP-${p._id.substr(-8).toUpperCase()}`, sx3, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, sx3, margin + 23);
      doc.text(`Month: ${getMonthName(p.month)} ${p.year}`, sx3, margin + 27);
      doc.text(`Status: ${p.status}`, sx3, margin + 31);

      doc.line(margin, margin + 8 + sec1H, W - margin, margin + 8 + sec1H);

      autoTable(doc, {
        startY: margin + 8 + sec1H,
        head: [['SR', 'SALARY COMPONENT DESCRIPTION', 'AMOUNT (Rs.)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, cellPadding: 3, lineWidth: 0.1 },
        columnStyles: { 0: { halign: 'center', cellWidth: 15 }, 2: { halign: 'right', cellWidth: 40 } },
        margin: { left: margin, right: margin }
      });

      let netY = doc.lastAutoTable.finalY;
      const summH = 45;
      doc.line(margin, netY, W - margin, netY);
      const bw1 = (W - (margin * 2)) * 0.6;
      doc.line(margin + bw1, netY, margin + bw1, netY + summH);

      autoTable(doc, {
        startY: netY,
        head: [['DEDUCTION TYPE', 'AMOUNT (Rs.)']],
        body: [
          ['Income Tax', formatPDFCurrency(deductionsObj.tax || 0)],
          ['Provident Fund', formatPDFCurrency(deductionsObj.pf || 0)],
          ['Insurance', formatPDFCurrency(deductionsObj.insurance || 0)],
          ['Total Deductions', formatPDFCurrency(totalDeductions)]
        ],
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontSize: 7.5, halign: 'center' },
        bodyStyles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: margin },
        tableWidth: bw1,
      });

      const wordsY = doc.lastAutoTable.finalY + 3;
      doc.setFont('helvetica', 'bold'); doc.text('* All values in (Rs)', margin + 2, wordsY);
      doc.setFont('helvetica', 'normal'); doc.text('Amount in Words:', margin + 2, wordsY + 4);
      doc.setFont('helvetica', 'bolditalic'); doc.text(numberToWords(p.netSalary), margin + 2, wordsY + 8);
      doc.text('Terms & Conditions:', margin + 2, wordsY + 16);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('1. Compensation details are confidential between employee and employer.', margin + 4, wordsY + 20);
      doc.text('2. Discrepancies should be reported to HR within 3 working days.', margin + 4, wordsY + 23);
      doc.text('3. This is a computer generated document, no physical signature required.', margin + 4, wordsY + 26);

      const sxSumm = margin + bw1;
      doc.setFontSize(8); doc.text('GROSS SALARY (A):', sxSumm + 2, netY + 8);
      doc.setFont('helvetica', 'bold'); doc.text(`Rs. ${formatPDFCurrency(p.grossSalary)}`, W - margin - 2, netY + 8, { align: 'right' });
      doc.setFont('helvetica', 'normal'); doc.text('TOTAL DEDUCTIONS (B):', sxSumm + 2, netY + 16);
      doc.setFont('helvetica', 'bold'); doc.text(`Rs. ${formatPDFCurrency(totalDeductions)}`, W - margin - 2, netY + 16, { align: 'right' });

      doc.setFillColor(250, 250, 250); doc.rect(sxSumm, netY + summH - 12, W - margin - sxSumm, 12, 'F');
      doc.line(sxSumm, netY + summH - 12, W - margin, netY + summH - 12);
      doc.setFontSize(12); doc.text('NET PAYABLE:', sxSumm + 2, netY + summH - 4.5);
      doc.setFontSize(14); doc.text(`Rs. ${formatPDFCurrency(p.netSalary)}`, W - margin - 2, netY + summH - 4.5, { align: 'right' });

      const footerY = H - margin - 25;
      doc.line(margin, footerY, W - margin, footerY);
      doc.setFontSize(7); doc.setFont('helvetica', 'normal');
      doc.text('* Computer Generated Salary Slip.', margin + 2, footerY + 5);
      doc.text('Authorized Signatory', W - margin - 25, H - margin - 4, { align: 'center' });
      doc.line(W - margin - 45, H - margin - 8, W - margin - 5, H - margin - 8);

      doc.save(`Salary_Slip_${p.employee?.employeeId || 'EMP'}_${getMonthName(p.month)}_${p.year}.pdf`);
    } catch (err) {
      console.error('PDF error:', err);
      toast.error('Error generating PDF');
    }
  };

  const calculateSalary = () => {
    const basic = parseFloat(formData.basicSalary) || 0;
    const totalAllowances = Object.values(formData.allowances).reduce((sum, val) => sum + (parseFloat(val) || 0), 0);
    const totalDeductions = (
      (parseFloat(formData.deductions.tax) || 0) +
      (parseFloat(formData.deductions.pf) || 0) +
      (parseFloat(formData.deductions.insurance) || 0) +
      (parseFloat(formData.deductions.other) || 0)
    );
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
        toast.success("Payroll updated successfully!");
      } else {
        await payrollAPI.create(payrollData);
        toast.success("Payroll created successfully!");
      }
      setShowModal(false); fetchPayrolls(); resetForm();
    } catch (err) {
      if (err.response?.data?.message?.includes('duplicate key')) {
        const selectedEmployee = employees.find(emp => emp._id === formData.employee);
        const monthName = getMonthName(formData.month);
        toast.error(`Payroll already exists for ${selectedEmployee?.name?.first} for ${monthName} ${formData.year}`);
      } else {
        toast.error(err.response?.data?.message || "Error saving payroll");
      }
    }
  };

  const handleDelete = async (id) => {
    if (window.confirm("Are you sure you want to delete this payroll?")) {
      try {
        await payrollAPI.delete(id); fetchPayrolls();
      } catch (err) {
        setError(err.response?.data?.message || "Error deleting payroll");
      }
    }
  };

  const handleGenerateAll = async () => {
    if (!filters.month) { toast.error('Please select the month first'); return; }
    const monthName = getMonthName(filters.month);
    const existingPayrolls = payrolls.filter(p => p.month === parseInt(filters.month) && p.year === parseInt(filters.year));
    if (existingPayrolls.length > 0) {
      toast.error(`Payroll already generated for ${monthName} ${filters.year}`);
      return;
    }
    try {
      await payrollAPI.generateForAll({ month: filters.month, year: filters.year });
      toast.success(`Payrolls generated successfully!`); fetchPayrolls();
    } catch (err) {
      toast.error(err.response?.data?.message || "Error generating payrolls");
    }
  };

  const clearFilters = () => {
    setFilters({ month: "", year: new Date().getFullYear(), status: "", page: 1, limit: 10 });
    setCurrentPage(1);
  };

  const totalItems = payrolls.length;
  const totalPages = itemsPerPage === 'all' ? 1 : Math.ceil(totalItems / itemsPerPage);
  const startIndex = itemsPerPage === 'all' ? 0 : (currentPage - 1) * itemsPerPage;
  const endIndex = itemsPerPage === 'all' ? totalItems : startIndex + itemsPerPage;
  const paginatedPayrolls = payrolls.slice(startIndex, endIndex);

  const resetForm = () => {
    setFormData({
      employee: "", month: new Date().getMonth() + 1, year: new Date().getFullYear(), basicSalary: "",
      allowances: { hra: "", transport: "", medical: "", other: "" },
      deductions: { tax: "", taxPercent: "", pf: "", pfPercent: "", insurance: "", other: "" },
      workingDays: 30, presentDays: 30, overtimeHours: 0, overtimeAmount: 0, status: "Pending"
    });
    setEditingPayroll(null);
  };

  const openEditModal = (payroll) => {
    setEditingPayroll(payroll);
    setFormData({
      employee: payroll.employee._id, month: payroll.month, year: payroll.year,
      basicSalary: payroll.basicSalary, allowances: payroll.allowances,
      deductions: payroll.deductions, workingDays: payroll.workingDays,
      presentDays: payroll.presentDays, overtimeHours: payroll.overtimeHours,
      overtimeAmount: payroll.overtimeAmount, status: payroll.status
    });
    setShowModal(true);
  };

  const getStatusBadge = (status) => {
    const colors = { Pending: "bg-yellow-100 text-yellow-800", Processed: "bg-blue-100 text-blue-800", Paid: "bg-green-100 text-green-800" };
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

      <div className="flex gap-4 p-4 rounded-lg" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <select
          value={filters.month}
          onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
        >
          <option value="">All Months</option>
          {Array.from({ length: 12 }, (_, i) => (
            <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
          ))}
        </select>
        <select
          value={filters.year}
          onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
          className="px-3 py-2 rounded border"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
        >
          {Array.from({ length: 5 }, (_, i) => (
            <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
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
        <button
          onClick={clearFilters}
          className="px-4 py-2 rounded border font-medium flex items-center gap-2"
          style={{ backgroundColor: themeColors.background, borderColor: themeColors.warning, color: themeColors.warning }}
        >
          <RefreshCw size={16} /> Clear Filters
        </button>
      </div>

      {error && (
        <div className="p-4 rounded-lg border bg-red-50 border-red-200 text-red-700">
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button onClick={() => setError(null)} className="text-sm font-medium">Dismiss</button>
          </div>
        </div>
      )}

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
            {paginatedPayrolls.map((payroll) => (
              <tr key={payroll._id} className="border-b" style={{ borderColor: themeColors.border }}>
                <td className="p-3 text-sm">
                  <div className="font-medium">{payroll.employee?.name?.first} {payroll.employee?.name?.last}</div>
                  <div className="text-xs text-gray-500">{payroll.employee?.employeeId}</div>
                </td>
                <td className="p-3 text-sm">{getMonthName(payroll.month)} {payroll.year}</td>
                <td className="p-3 text-sm">₹{payroll.basicSalary?.toLocaleString()}</td>
                <td className="p-3 text-sm font-medium">₹{payroll.netSalary?.toLocaleString()}</td>
                <td className="p-3"><span className={getStatusBadge(payroll.status)}>{payroll.status}</span></td>
                <td className="p-3">
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleDownloadSlip(payroll._id)}
                      className="p-2 rounded text-white bg-indigo-600 hover:bg-indigo-700"
                      title="Download Slip"
                    >
                      <Download size={14} />
                    </button>
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

        <div className="flex flex-col md:flex-row justify-between items-center mt-4 gap-4">
          <div className="flex items-center gap-2">
            <span className="text-sm">Show</span>
            <select
              value={itemsPerPage}
              onChange={(e) => { setItemsPerPage(e.target.value === 'all' ? 'all' : parseInt(e.target.value)); setCurrentPage(1); }}
              className="px-3 py-1 rounded-md border text-sm"
              style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
            >
              <option value="10">10</option><option value="20">20</option><option value="all">All</option>
            </select>
            <span className="text-sm">entries</span>
          </div>
          <div className="text-sm text-gray-500">Showing {startIndex + 1} to {Math.min(endIndex, totalItems)} of {totalItems} entries</div>
          {itemsPerPage !== 'all' && (
            <div className="flex items-center gap-2">
              <button onClick={() => setCurrentPage(prev => prev - 1)} disabled={currentPage === 1} className="px-3 py-1 rounded border disabled:opacity-50">Previous</button>
              <span className="text-sm">Page {currentPage} of {totalPages}</span>
              <button onClick={() => setCurrentPage(prev => prev + 1)} disabled={currentPage === totalPages} className="px-3 py-1 rounded border disabled:opacity-50">Next</button>
            </div>
          )}
        </div>
      </div>

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
                      setFormData(prev => ({ ...prev, employee: e.target.value, basicSalary: employee?.salary || "" }));
                    }}
                    className="w-full p-2 border rounded" required
                  >
                    <option value="">Select Employee</option>
                    {employees.map(emp => (
                      <option key={emp._id} value={emp._id}>{emp.name?.first} {emp.name?.last} ({emp.employeeId})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Month *</label>
                  <select
                    value={formData.month}
                    onChange={(e) => setFormData(prev => ({ ...prev, month: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded" required
                  >
                    {Array.from({ length: 12 }, (_, i) => (
                      <option key={i + 1} value={i + 1}>{getMonthName(i + 1)}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium mb-2">Year *</label>
                  <select
                    value={formData.year}
                    onChange={(e) => setFormData(prev => ({ ...prev, year: parseInt(e.target.value) }))}
                    className="w-full p-2 border rounded" required
                  >
                    {Array.from({ length: 5 }, (_, i) => (
                      <option key={i} value={new Date().getFullYear() - i}>{new Date().getFullYear() - i}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-1">Salary & Allowances</h3>
                  <div>
                    <label className="block text-sm font-medium mb-1">Basic Salary *</label>
                    <input type="number" value={formData.basicSalary} onChange={(e) => setFormData(prev => ({ ...prev, basicSalary: e.target.value }))} className="w-full p-2 border rounded text-sm" required />
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    <div><label className="text-xs">HRA</label><input type="number" value={formData.allowances.hra} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, hra: e.target.value } }))} className="w-full p-2 border rounded text-xs" /></div>
                    <div><label className="text-xs">Transport</label><input type="number" value={formData.allowances.transport} onChange={(e) => setFormData(prev => ({ ...prev, allowances: { ...prev.allowances, transport: e.target.value } }))} className="w-full p-2 border rounded text-xs" /></div>
                  </div>
                </div>

                <div className="space-y-4">
                  <h3 className="font-medium border-b pb-1">Deductions</h3>
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="text-xs">Tax (%)</label>
                      <input type="number" step="0.01" value={formData.deductions.taxPercent} onChange={(e) => {
                        const percent = parseFloat(e.target.value) || 0;
                        const basicSalary = parseFloat(formData.basicSalary) || 0;
                        setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, taxPercent: e.target.value, tax: (basicSalary * percent) / 100 } }));
                      }} className="w-full p-2 border rounded text-xs" />
                    </div>
                    <div>
                      <label className="text-xs">PF (%)</label>
                      <input type="number" step="0.01" value={formData.deductions.pfPercent} onChange={(e) => {
                        const percent = parseFloat(e.target.value) || 0;
                        const basicSalary = parseFloat(formData.basicSalary) || 0;
                        setFormData(prev => ({ ...prev, deductions: { ...prev.deductions, pfPercent: e.target.value, pf: (basicSalary * percent) / 100 } }));
                      }} className="w-full p-2 border rounded text-xs" />
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium">Status</label>
                    <select value={formData.status} onChange={(e) => setFormData(prev => ({ ...prev, status: e.target.value }))} className="w-full p-2 border rounded text-sm">
                      <option value="Pending">Pending</option><option value="Processed">Processed</option><option value="Paid">Paid</option>
                    </select>
                  </div>
                </div>
              </div>

              <div className="p-4 rounded border bg-gray-50">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>Gross Salary: <span className="font-bold">₹{calculateSalary().grossSalary.toLocaleString()}</span></div>
                  <div>Net Salary: <span className="font-bold text-blue-600">₹{calculateSalary().netSalary.toLocaleString()}</span></div>
                </div>
              </div>
              
              <div className="flex justify-end gap-3 pt-4">
                <button type="button" onClick={() => { setShowModal(false); resetForm(); }} className="px-4 py-2 border rounded font-medium">Cancel</button>
                <button type="submit" className="px-4 py-2 rounded font-medium text-white" style={{ backgroundColor: themeColors.primary }}>{editingPayroll ? "Update" : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Payroll;