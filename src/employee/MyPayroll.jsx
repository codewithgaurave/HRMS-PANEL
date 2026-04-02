import { useState, useEffect } from 'react';
import { payrollAPI } from '../apis/payrollAPI';
import { useAuth } from '../context/AuthContext';
import { toast } from 'sonner';
import { Download, FileText } from 'lucide-react';
import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';

const MyPayroll = () => {
  const [payrolls, setPayrolls] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedPayroll, setSelectedPayroll] = useState(null);
  const { user } = useAuth();

  useEffect(() => {
    if (user && (user._id || user.id)) {
      fetchMyPayroll();
    } else {
      setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user]);

  const fetchMyPayroll = async () => {
    if (!user || (!user._id && !user.id)) {
      setLoading(false);
      return;
    }

    try {
      const response = await payrollAPI.getAllPayrolls();
      const myPayrolls = response.payrolls?.filter(p => p.employee._id === (user._id || user.id)) || [];
      setPayrolls(myPayrolls);
    } catch (error) {
      console.error('Fetch payroll error:', error);
      toast.error('Failed to fetch payroll data');
    } finally {
      setLoading(false);
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

  const formatCurrency = (amount) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR'
    }).format(amount);
  };

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

      // Data Normalization
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

      // Watermark
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

      // Outer Border
      doc.setDrawColor(0);
      doc.setLineWidth(0.3);
      doc.rect(margin, margin, W - (margin * 2), H - (margin * 2));

      // Header Row
      doc.line(margin, margin + 8, W - margin, margin + 8);
      doc.setFont('helvetica', 'bold');
      doc.setFontSize(10);
      doc.text('Salary Slip / Payment Advice', W / 2, margin + 5.5, { align: 'center' });
      doc.setFont('helvetica', 'normal');
      doc.setFontSize(8);
      doc.text('(Original for Employee)', W - margin - 2, margin + 5.5, { align: 'right' });

      // Info Section
      const sec1H = 45;
      const colWidth = (W - (margin * 2)) / 3;
      
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
        imgW *= ratio; imgH *= ratio;
        doc.addImage(logoData, 'PNG', margin + (colWidth * 1.3 - imgW) / 2, margin + 13 + (maxH - imgH) / 2, imgW, imgH);
      }

      doc.line(margin + colWidth * 1.3, margin + 8, margin + colWidth * 1.3, margin + 8 + sec1H);
      doc.line(margin + colWidth * 2.1, margin + 8, margin + colWidth * 2.1, margin + 8 + sec1H);

      // Employee Column
      const sx2 = margin + colWidth * 1.3 + 3;
      doc.text('Employee To', sx2, margin + 12);
      doc.setFont('helvetica', 'bold'); doc.setFontSize(9);
      doc.text(`Name: ${p.employee?.name?.first} ${p.employee?.name?.last}`, sx2, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Employee ID: ${p.employee?.employeeId}`, sx2, margin + 23);
      doc.text(`Department: ${p.employee?.department?.name || 'N/A'}`, sx2, margin + 27);
      doc.text(`Designation: ${p.employee?.designation?.title || 'N/A'}`, sx2, margin + 31);
      doc.text(`Pay Period: ${getMonthName(p.month)} ${p.year}`, sx2, margin + 35);

      // Stats Column
      const sx3 = margin + colWidth * 2.1 + 3;
      doc.setFont('helvetica', 'bold');
      doc.text(`Slip No: SLP-${p._id.substr(-8).toUpperCase()}`, sx3, margin + 18);
      doc.setFont('helvetica', 'normal');
      doc.text(`Date: ${new Date().toLocaleDateString()}`, sx3, margin + 23);
      doc.text(`Pres: ${p.presentDays || 0} / ${p.workingDays || 0} Days`, sx3, margin + 27);
      doc.text(`Status: ${p.status}`, sx3, margin + 31);

      doc.line(margin, margin + 8 + sec1H, W - margin, margin + 8 + sec1H);

      // Salary Table
      autoTable(doc, {
        startY: margin + 8 + sec1H,
        head: [['SR', 'SALARY COMPONENT DESCRIPTION', 'AMOUNT (Rs.)']],
        body: tableData,
        theme: 'grid',
        headStyles: { fillColor: [245, 245, 245], textColor: 0, fontStyle: 'bold', fontSize: 8, halign: 'center' },
        bodyStyles: { fontSize: 8, cellPadding: 3, textColor: 0 },
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

      doc.save(`Salary_Slip_${getMonthName(p.month)}_${p.year}.pdf`);
    } catch (error) {
      console.error('PDF Error:', error);
      toast.error('Error generating PDF');
    }
  };

  if (loading) return <div className="p-6">Loading...</div>;

  return (
    <div className="p-6 space-y-6">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold">My Payroll</h1>
        <div className="text-sm text-gray-600">
          Current Salary: {formatCurrency(user?.salary || 0)}
        </div>
      </div>

      <div className="bg-white rounded-lg shadow p-6 border-l-4 border-blue-600">
        <h2 className="text-lg font-semibold mb-4">Salary Information</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="text-center p-4 bg-blue-50 rounded-lg">
            <div className="text-2xl font-bold text-blue-600">{formatCurrency(user?.salary || 0)}</div>
            <div className="text-sm text-gray-600">Monthly Salary</div>
          </div>
          <div className="text-center p-4 bg-green-50 rounded-lg">
            <div className="text-2xl font-bold text-green-600">{formatCurrency((user?.salary || 0) * 12)}</div>
            <div className="text-sm text-gray-600">Annual Salary</div>
          </div>
          <div className="text-center p-4 bg-purple-50 rounded-lg">
            <div className="text-2xl font-bold text-purple-600">{user?.department?.name || 'N/A'}</div>
            <div className="text-sm text-gray-600">Department</div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="p-4 border-b bg-gray-50 flex justify-between items-center">
          <h2 className="text-lg font-semibold">Payroll History</h2>
          <button onClick={fetchMyPayroll} className="text-blue-600 text-sm hover:underline">Refresh</button>
        </div>
        
        {payrolls.length === 0 ? (
          <div className="p-12 text-center text-gray-500">
            <div className="text-gray-400 text-6xl mb-4">💰</div>
            <h3 className="text-lg font-semibold">No Payroll Records</h3>
            <p>Your salary slips will appear here once processed.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-100 text-gray-700">
                <tr>
                  <th className="px-6 py-4 text-left font-semibold">Pay Period</th>
                  <th className="px-6 py-4 text-left font-semibold">Basic Salary</th>
                  <th className="px-6 py-4 text-left font-semibold">Net Pay</th>
                  <th className="px-6 py-4 text-left font-semibold">Status</th>
                  <th className="px-6 py-4 text-center font-semibold">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {payrolls.map((payroll) => (
                  <tr key={payroll._id} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 font-medium">{getMonthName(payroll.month)} {payroll.year}</td>
                    <td className="px-6 py-4">{formatCurrency(payroll.basicSalary)}</td>
                    <td className="px-6 py-4 font-bold text-green-600">{formatCurrency(payroll.netSalary)}</td>
                    <td className="px-6 py-4">
                      <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                        payroll.status === 'Paid' ? 'bg-green-100 text-green-800' :
                        payroll.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' : 'bg-red-100 text-red-800'
                      }`}>
                        {payroll.status}
                      </span>
                    </td>
                    <td className="px-6 py-4 text-center space-x-3">
                      <button
                        onClick={() => setSelectedPayroll(payroll)}
                        className="text-blue-600 hover:text-blue-800 p-2 rounded-full hover:bg-blue-50 transition-colors"
                        title="View Details"
                      >
                        <FileText size={20} />
                      </button>
                      <button
                        onClick={() => handleDownloadSlip(payroll._id)}
                        className="text-indigo-600 hover:text-indigo-800 p-2 rounded-full hover:bg-indigo-50 transition-colors"
                        title="Download PDF"
                      >
                        <Download size={20} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {selectedPayroll && (
        <div className="fixed inset-0 bg-black bg-opacity-60 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-2xl overflow-hidden animate-in fade-in zoom-in duration-200">
            <div className="bg-blue-600 p-4 text-white flex justify-between items-center">
              <h2 className="text-xl font-bold">Payroll - {getMonthName(selectedPayroll.month)} {selectedPayroll.year}</h2>
              <button onClick={() => setSelectedPayroll(null)} className="hover:bg-blue-700 p-1 rounded">✕</button>
            </div>
            
            <div className="p-6 grid grid-cols-1 md:grid-cols-2 gap-6 max-h-[70vh] overflow-y-auto">
              <div>
                <h3 className="font-bold border-b pb-2 mb-3 text-green-600 flex items-center gap-2">
                  <span>💰</span> Earnings
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Basic Salary:</span><span className="font-medium">{formatCurrency(selectedPayroll.basicSalary)}</span></div>
                  <div className="flex justify-between"><span>HRA:</span><span>{formatCurrency(selectedPayroll.allowances.hra || 0)}</span></div>
                  <div className="flex justify-between"><span>Transport:</span><span>{formatCurrency(selectedPayroll.allowances.transport || 0)}</span></div>
                  <div className="flex justify-between"><span>Medical:</span><span>{formatCurrency(selectedPayroll.allowances.medical || 0)}</span></div>
                  <div className="flex justify-between"><span>Other:</span><span>{formatCurrency(selectedPayroll.allowances.other || 0)}</span></div>
                  <div className="border-t pt-2 font-bold flex justify-between"><span>Gross Salary:</span><span>{formatCurrency(selectedPayroll.grossSalary)}</span></div>
                </div>
              </div>
              
              <div>
                <h3 className="font-bold border-b pb-2 mb-3 text-red-600 flex items-center gap-2">
                  <span>📉</span> Deductions
                </h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between"><span>Income Tax:</span><span>{formatCurrency(selectedPayroll.deductions.tax || 0)}</span></div>
                  <div className="flex justify-between"><span>PF:</span><span>{formatCurrency(selectedPayroll.deductions.pf || 0)}</span></div>
                  <div className="flex justify-between"><span>Insurance:</span><span>{formatCurrency(selectedPayroll.deductions.insurance || 0)}</span></div>
                  <div className="flex justify-between"><span>Other:</span><span>{formatCurrency(selectedPayroll.deductions.other || 0)}</span></div>
                  <div className="border-t pt-2 font-bold flex justify-between"><span>Total Deductions:</span><span>{formatCurrency((selectedPayroll.deductions.tax || 0) + (selectedPayroll.deductions.pf || 0) + (selectedPayroll.deductions.insurance || 0) + (selectedPayroll.deductions.other || 0))}</span></div>
                </div>
              </div>

              <div className="md:col-span-2 bg-blue-50 p-4 rounded-lg border border-blue-100 flex justify-between items-center mt-2">
                <div>
                  <div className="text-sm text-gray-600">Net Payable Amount</div>
                  <div className="text-3xl font-black text-blue-700">{formatCurrency(selectedPayroll.netSalary)}</div>
                </div>
                <button 
                  onClick={() => handleDownloadSlip(selectedPayroll._id)}
                  className="bg-blue-600 text-white px-6 py-2 rounded-lg font-bold flex items-center gap-2 hover:bg-blue-700 transition"
                >
                  <Download size={18} /> Download Slip
                </button>
              </div>
            </div>
            <div className="p-4 bg-gray-50 text-right">
              <button onClick={() => setSelectedPayroll(null)} className="px-4 py-2 border rounded-lg hover:bg-gray-100">Close</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MyPayroll;