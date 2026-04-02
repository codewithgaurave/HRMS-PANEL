import { useState, useEffect } from "react";
import { useTheme } from "../context/ThemeContext";
import payrollAPI from "../apis/payrollAPI";
import { DollarSign, Download, Eye } from "lucide-react";
import PayrollDetailsModal from "../components/PayrollDetailsModal";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

const TeamPayroll = () => {
  const { themeColors } = useTheme();
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [filters, setFilters] = useState({
    month: new Date().getMonth() + 1,
    year: new Date().getFullYear(),
    status: ""
  });

  useEffect(() => {
    fetchPayrolls();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters]);

  const fetchPayrolls = async () => {
    try {
      setLoading(true);
      // Get all payrolls - backend will filter based on user role
      const { data } = await payrollAPI.getAll(filters);
      setPayrolls(data.payrolls || []);
    } catch (error) {
      setError(error.response?.data?.message || "Error fetching team payrolls");
    } finally {
      setLoading(false);
    }
  };

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

  const handleViewPayroll = async (payrollId) => {
    try {
      const { data } = await payrollAPI.getById(payrollId);
      setSelectedPayroll(data.payroll);
      setIsModalOpen(true);
    } catch {
      setError("Error viewing payroll details");
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedPayroll(null);
  };

  const getMonthName = (month) =>
    new Date(0, month - 1).toLocaleString('default', { month: 'long' });

  // Load image as base64 dataURL
  const loadImage = (url) =>
    new Promise((resolve) => {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      img.onload = () => {
        const c = document.createElement('canvas');
        c.width = img.width; c.height = img.height;
        c.getContext('2d').drawImage(img, 0, 0);
        resolve(c.toDataURL('image/png'));
      };
      img.onerror = () => resolve(null);
      img.src = url;
    });

  const handleDownloadSlip = async (payrollId) => {
    try {
      const response = await payrollAPI.getById(payrollId);
      const p = response.data.payroll;

      // ── Helper: Number to Words ────────────────────────────────
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

      // ── Data Normalization ─────────────────────────────────────
      const allowancesObj = p.allowances && !Array.isArray(p.allowances) ? p.allowances : {};
      const deductionsObj = p.deductions && !Array.isArray(p.deductions) ? p.deductions : {};
      
      const tableData = [
        [1, 'Basic Salary', formatPDFCurrency(p.basicSalary)],
        [2, 'HRA', formatPDFCurrency(allowancesObj.hra || 0)],
        [3, 'Transport Allowance', formatPDFCurrency(allowancesObj.transport || 0)],
        [4, 'Medical Allowance', formatPDFCurrency(allowancesObj.medical || 0)],
        [5, 'Other Allowances', formatPDFCurrency(allowancesObj.other || 0)],
        [6, 'Overtime Amount', formatPDFCurrency(p.overtimeAmount || 0)],
      ];

      const totalDeductions =
        (deductionsObj.tax || 0) + (deductionsObj.pf || 0) +
        (deductionsObj.insurance || 0) + (deductionsObj.other || 0);

      // ── Setup Doc ──────────────────────────────────────────────
      const doc = new jsPDF({ orientation: 'p', unit: 'mm', format: 'a4' });
      const W = doc.internal.pageSize.getWidth();
      const H = doc.internal.pageSize.getHeight();
      const margin = 10;
      const logoUrl = `${window.location.origin}/hrms_logo.png`;
      const logoData = await loadImage(logoUrl);

      // ── Watermark Implementation ──────────────────────────────
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

      // ── Outer Border ───────────────────────────────────────────
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, W - (margin * 2), H - (margin * 2));

      // ── Header Title Row ───────────────────────────────────────
      doc.line(margin, margin + 8, W - margin, margin + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Salary Slip / Payment Advice', W / 2, margin + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Original for Employee)', W - margin - 2, margin + 5.5, { align: 'right' });

      // ── Section 1: Logo & Info Boxes ───────────────────
      const sec1H = 45;
      const colWidth = (W - (margin * 2)) / 3;
      
      // Column 1: Logo Section
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Employer', margin + 2, margin + 12);
      
      if (logoData) {
        const imgProps = doc.getImageProperties(logoData);
        const maxW = colWidth * 1.3 - 10;
        const maxH = sec1H - 15;
        let imgW = imgProps.width;
        let imgH = imgProps.height;
        
        const ratio = Math.min(maxW / imgW, maxH / imgH);
        imgW *= ratio;
        imgH *= ratio;

        doc.addImage(logoData, 'PNG', margin + (colWidth * 1.3 - imgW) / 2, margin + 13 + (maxH - imgH) / 2, imgW, imgH);
      }

      // Vertical separators for header
      doc.line(margin + colWidth * 1.3, margin + 8, margin + colWidth * 1.3, margin + 8 + sec1H);
      doc.line(margin + colWidth * 2.1, margin + 8, margin + colWidth * 2.1, margin + 8 + sec1H);

      // Column 2: Employee Info
      const startX2 = margin + colWidth * 1.3 + 3;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('Employee To', startX2, margin + 12);
      
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(9);
      doc.text(`Name: ${p.employee?.name?.first} ${p.employee?.name?.last}`, startX2, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee ID: ${p.employee?.employeeId}`, startX2, margin + 23);
      doc.text(`Department: ${p.employee?.department?.name || 'N/A'}`, startX2, margin + 27);
      doc.text(`Designation: ${p.employee?.designation?.title || 'N/A'}`, startX2, margin + 31);
      doc.text(`Joined: ${p.employee?.dateOfJoining ? new Date(p.employee?.dateOfJoining).toLocaleDateString() : 'N/A'}`, startX2, margin + 35);

      // Column 3: Slip Stats
      const startX3 = margin + colWidth * 2.1 + 3;
      doc.setFont('helvetica', 'bold');
      doc.text(`Slip No: SLP-${p._id.substr(-8).toUpperCase()}`, startX3, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, startX3, margin + 23);
      doc.text(`Month: ${getMonthName(p.month)} ${p.year}`, startX3, margin + 27);
      doc.text(`Status: ${p.status}`, startX3, margin + 31);

      doc.line(margin, margin + 8 + sec1H, W - margin, margin + 8 + sec1H);

      // ── Section 2: Main Salary Table ───────────────────────────
      autoTable(doc, {
        startY: margin + 8 + sec1H,
        head: [['SR', 'SALARY COMPONENT DESCRIPTION', 'AMOUNT (Rs.)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 8, halign: 'center', lineWidth: 0.1 },
        bodyStyles: { fontSize: 8, cellPadding: 3, textColor: 0, lineWidth: 0.1 },
        columnStyles: {
          0: { halign: 'center', cellWidth: 15 },
          2: { halign: 'right', cellWidth: 40 }
        },
        margin: { left: margin, right: margin },
        tableLineColor: 0,
        tableLineWidth: 0.1,
      });

      let netY = doc.lastAutoTable.finalY;

      // ── Section 3: Calculations & Summary ──────────────────────
      const summH = 45;
      doc.line(margin, netY, W - margin, netY); // Top divider
      
      // Box 1: Deduction Breakdown (Grid style like image)
      const bw1 = (W - (margin * 2)) * 0.6;
      doc.line(margin + bw1, netY, margin + bw1, netY + summH); // Vertical divider
      
      // Deduction Table inside grid
      const dTable = [
        ['Income Tax', formatPDFCurrency(deductionsObj.tax || 0)],
        ['Provident Fund', formatPDFCurrency(deductionsObj.pf || 0)],
        ['Insurance', formatPDFCurrency(deductionsObj.insurance || 0)],
        ['Total Deductions', formatPDFCurrency(totalDeductions)]
      ];
      
      autoTable(doc, {
        startY: netY,
        head: [['DEDUCTION TYPE', 'AMOUNT (Rs.)']],
        body: dTable,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontSize: 7.5, halign: 'center' },
        bodyStyles: { fontSize: 7.5, cellPadding: 1.5 },
        columnStyles: { 1: { halign: 'right' } },
        margin: { left: margin },
        tableWidth: bw1,
      });

      // Words & Terms section
      let wordsY = doc.lastAutoTable.finalY + 3;
      doc.setFont('helvetica', 'bold');
      doc.text('* All values in (Rs)', margin + 2, wordsY);
      doc.setFont('helvetica', 'normal');
      doc.text('Amount in Words:', margin + 2, wordsY + 4);
      doc.setFont('helvetica', 'bolditalic');
      doc.text(numberToWords(p.netSalary), margin + 2, wordsY + 8);
      
      doc.setFont('helvetica', 'bold');
      doc.text('Terms & Conditions:', margin + 2, wordsY + 16);
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(7);
      doc.text('1. Compensation details are confidential between employee and employer.', margin + 4, wordsY + 20);
      doc.text('2. Discrepancies should be reported to HR within 3 working days.', margin + 4, wordsY + 23);
      doc.text('3. This is a computer generated document, no physical signature required.', margin + 4, wordsY + 26);

      // RIGHT BOX: Totals
      const startXSumm = margin + bw1;
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      
      doc.text('WORK DAYS / ATTENDANCE:', startXSumm + 2, netY + 8);
      doc.setFont('helvetica', 'bold');
      doc.text(`${p.presentDays || 0} / ${p.workingDays || 0}`, W - margin - 2, netY + 8, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.text('GROSS SALARY (A):', startXSumm + 2, netY + 16);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${formatPDFCurrency(p.grossSalary)}`, W - margin - 2, netY + 16, { align: 'right' });
      
      doc.setFont('helvetica', 'normal');
      doc.text('TOTAL DEDUCTIONS (B):', startXSumm + 2, netY + 24);
      doc.setFont('helvetica', 'bold');
      doc.text(`Rs. ${formatPDFCurrency(totalDeductions)}`, W - margin - 2, netY + 24, { align: 'right' });

      // PAYABLE AMOUNT BIG BOX
      doc.setFillColor(250, 250, 250);
      doc.rect(startXSumm, netY + summH - 12, W - margin - startXSumm, 12, 'F');
      doc.line(startXSumm, netY + summH - 12, W - margin, netY + summH - 12);
      
      doc.setFontSize(12);
      doc.setFont('helvetica', 'bold');
      doc.text('NET PAYABLE:', startXSumm + 2, netY + summH - 4.5);
      doc.setFontSize(14);
      doc.text(`Rs. ${formatPDFCurrency(p.netSalary)}`, W - margin - 2, netY + summH - 4.5, { align: 'right' });

      // ── Footer ────────────────────────────────────────────────
      const footerY = H - margin - 25;
      doc.line(margin, footerY, W - margin, footerY);
      doc.setFontSize(7);
      doc.setFont('helvetica', 'normal');
      doc.text('* Indo-Pacific Payroll Standard Rules Applied.', margin + 2, footerY + 5);
      doc.text('All disputes subject to Lucknow Jurisdiction.', margin + 2, footerY + 8);
      doc.text('Computer Generated Salary Slip.', margin + 2, footerY + 11);

      doc.setFont('helvetica', 'bold');
      doc.text('Authorized Signatory', W - margin - 25, H - margin - 4, { align: 'center' });
      doc.line(W - margin - 45, H - margin - 8, W - margin - 5, H - margin - 8);

      doc.save(`Salary_Slip_${p.employee?.employeeId || 'EMP'}_${getMonthName(p.month)}_${p.year}.pdf`);
    } catch (error) {
      console.error('PDF error:', error);
      setError('Error generating PDF. Please try again.');
    }
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
          <h1 className="text-2xl font-bold">Team Payroll</h1>
          <p className="text-sm mt-1" style={{ color: themeColors.textSecondary }}>
            View payroll details for you and your team members only
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 p-4 rounded-lg" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <div>
          <label className="block text-sm font-medium mb-2">Month</label>
          <select
            value={filters.month}
            onChange={(e) => setFilters(prev => ({ ...prev, month: e.target.value }))}
            className="w-full p-2 rounded border"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            {Array.from({ length: 12 }, (_, i) => (
              <option key={i + 1} value={i + 1}>
                {new Date(0, i).toLocaleString('default', { month: 'long' })}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Year</label>
          <select
            value={filters.year}
            onChange={(e) => setFilters(prev => ({ ...prev, year: e.target.value }))}
            className="w-full p-2 rounded border"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            {Array.from({ length: 5 }, (_, i) => (
              <option key={i} value={new Date().getFullYear() - i}>
                {new Date().getFullYear() - i}
              </option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-sm font-medium mb-2">Status</label>
          <select
            value={filters.status}
            onChange={(e) => setFilters(prev => ({ ...prev, status: e.target.value }))}
            className="w-full p-2 rounded border"
            style={{ backgroundColor: themeColors.background, borderColor: themeColors.border, color: themeColors.text }}
          >
            <option value="">All Status</option>
            <option value="Generated">Generated</option>
            <option value="Paid">Paid</option>
            <option value="Pending">Pending</option>
          </select>
        </div>
      </div>

      {/* Error Display */}
      {error && (
        <div className="p-4 rounded-lg border" style={{ 
          backgroundColor: themeColors.danger + '20', 
          borderColor: themeColors.danger,
          color: themeColors.danger
        }}>
          <div className="flex justify-between items-center">
            <span>{error}</span>
            <button 
              onClick={() => setError(null)}
              className="text-sm font-medium"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.primary }}>{payrolls.length}</div>
          <div className="text-sm">Total Payrolls</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.success }}>
            {formatCurrency(payrolls.reduce((sum, p) => sum + (p.grossSalary || 0), 0))}
          </div>
          <div className="text-sm">Total Gross</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.info }}>
            {formatCurrency(payrolls.reduce((sum, p) => sum + (p.netSalary || 0), 0))}
          </div>
          <div className="text-sm">Total Net</div>
        </div>
        <div className="p-6 rounded-lg shadow-sm text-center" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
          <div className="text-3xl font-bold mb-2" style={{ color: themeColors.warning }}>
            {payrolls.filter(p => p.status === 'Paid').length}
          </div>
          <div className="text-sm">Paid</div>
        </div>
      </div>

      {/* Payroll Table */}
      <div className="rounded-lg shadow-sm overflow-hidden" style={{ backgroundColor: themeColors.surface, border: `1px solid ${themeColors.border}` }}>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead style={{ backgroundColor: themeColors.background }}>
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Employee</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Basic Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Gross Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Net Salary</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y" style={{ borderColor: themeColors.border }}>
              {payrolls.map((payroll) => (
                <tr key={payroll._id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="text-sm font-medium">
                        {payroll.employee?.name?.first} {payroll.employee?.name?.last}
                      </div>
                      <div className="text-sm" style={{ color: themeColors.textSecondary }}>
                        {payroll.employee?.employeeId}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(payroll.basicSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    {formatCurrency(payroll.grossSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {formatCurrency(payroll.netSalary)}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      payroll.status === 'Paid' ? 'bg-green-100 text-green-800' :
                      payroll.status === 'Generated' ? 'bg-blue-100 text-blue-800' :
                      'bg-yellow-100 text-yellow-800'
                    }`}>
                      {payroll.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm">
                    <div className="flex space-x-2">
                      <button
                        onClick={() => handleViewPayroll(payroll._id)}
                        className="p-2 rounded text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: themeColors.info }}
                        title="View Details"
                      >
                        <Eye size={14} />
                      </button>
                      <button
                        onClick={() => handleDownloadSlip(payroll._id)}
                        className="p-2 rounded text-white transition-colors hover:opacity-90"
                        style={{ backgroundColor: themeColors.success }}
                        title="Download Slip"
                      >
                        <Download size={14} />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {payrolls.length === 0 && (
        <div className="text-center py-12">
          <DollarSign size={48} style={{ color: themeColors.textSecondary }} className="mx-auto mb-4" />
          <p style={{ color: themeColors.textSecondary }}>No payroll records found for your team</p>
          <p className="text-xs mt-2" style={{ color: themeColors.textSecondary }}>Only your payroll and your team members' payroll will be displayed here</p>
        </div>
      )}

      {/* Payroll Details Modal */}
      <PayrollDetailsModal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        payroll={selectedPayroll}
      />
    </div>
  );
};

export default TeamPayroll;