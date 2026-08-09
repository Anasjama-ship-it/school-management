import React, { useState } from 'react';
import {
  CreditCard,
  Plus,
  Search,
  Filter,
  DollarSign,
  Printer,
  Download,
  CheckCircle2,
  AlertCircle,
  Clock,
  FileText,
  X,
  FileSpreadsheet,
  Trash2
} from 'lucide-react';
import {
  Student,
  FeeStructure,
  FeePayment,
  FeeSummary,
  PaymentMode
} from '../../types';
import { INITIAL_CLASSES } from '../../lib/seedData';
import { generatePaymentReceiptPDF, exportToExcel } from '../../lib/exportUtils';

interface FeesModuleProps {
  students: Student[];
  feeStructures: FeeStructure[];
  payments: FeePayment[];
  feeSummaries: FeeSummary[];
  onRecordPayment: (payment: Omit<FeePayment, 'id'>) => Promise<void>;
  onUpdateFeeStructure: (structure: FeeStructure) => Promise<void>;
  onDeletePayment?: (payment: FeePayment) => Promise<void>;
  onDeleteFeeStructure?: (structure: FeeStructure) => Promise<void>;
  canEdit: boolean;
  isRecordModalOpen: boolean;
  setIsRecordModalOpen: (open: boolean) => void;
}

export const FeesModule: React.FC<FeesModuleProps> = ({
  students,
  feeStructures,
  payments,
  feeSummaries,
  onRecordPayment,
  onUpdateFeeStructure,
  onDeletePayment,
  onDeleteFeeStructure,
  canEdit,
  isRecordModalOpen,
  setIsRecordModalOpen
}) => {
  const [activeTab, setActiveTab] = useState<'balances' | 'payments' | 'structures' | 'reports'>('balances');
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Receipt Modal State
  const [selectedPaymentForReceipt, setSelectedPaymentForReceipt] = useState<FeePayment | null>(null);

  // Form State for Record Payment
  const [paymentForm, setPaymentForm] = useState<{
    studentId: string;
    amountPaid: number;
    paymentDate: string;
    paymentMode: PaymentMode;
    feeType: string;
    transactionRef: string;
    remarks: string;
  }>({
    studentId: students[0]?.studentId || 'STU-2026-001',
    amountPaid: 500,
    paymentDate: new Date().toISOString().split('T')[0],
    paymentMode: 'Cash',
    feeType: 'Full Term Tuition',
    transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
    remarks: 'Fee payment receipt'
  });

  const selectedStudentObj = students.find((s) => s.studentId === paymentForm.studentId || s.id === paymentForm.studentId);

  // Filtered Summaries
  const filteredSummaries = feeSummaries.filter((s) => {
    const matchesSearch =
      s.studentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesClass = selectedClass === 'All' || s.gradeClass === selectedClass;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;
    return matchesSearch && matchesClass && matchesStatus;
  });

  // Financial Stats
  const totalCollected = payments.reduce((acc, p) => acc + p.amountPaid, 0);
  const totalOutstanding = feeSummaries.reduce((acc, s) => acc + s.balance, 0);

  const handleOpenRecordModal = () => {
    setPaymentForm({
      studentId: students[0]?.studentId || 'STU-2026-001',
      amountPaid: 500,
      paymentDate: new Date().toISOString().split('T')[0],
      paymentMode: 'Cash',
      feeType: 'Tuition Fee',
      transactionRef: `TRX-${Math.floor(100000 + Math.random() * 900000)}`,
      remarks: 'School fee payment'
    });
    setIsRecordModalOpen(true);
  };

  const handleRecordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedStudentObj) {
      alert('Please select a valid student');
      return;
    }

    const receiptNo = `RCP-2026-0${Math.floor(100 + Math.random() * 900)}`;

    const newPayment: Omit<FeePayment, 'id'> = {
      receiptNo,
      studentId: selectedStudentObj.studentId,
      studentName: selectedStudentObj.fullName,
      gradeClass: selectedStudentObj.gradeClass,
      amountPaid: Number(paymentForm.amountPaid),
      paymentDate: paymentForm.paymentDate,
      paymentMode: paymentForm.paymentMode,
      feeType: paymentForm.feeType,
      transactionRef: paymentForm.transactionRef,
      remarks: paymentForm.remarks,
      receivedBy: 'School Accountant'
    };

    await onRecordPayment(newPayment);
    setIsRecordModalOpen(false);

    // Auto open receipt preview
    setSelectedPaymentForReceipt({ ...newPayment, id: receiptNo });
  };

  const handleExportLedgerExcel = () => {
    const exportRows = filteredSummaries.map((s) => ({
      'Student ID': s.studentId,
      'Student Name': s.studentName,
      Class: s.gradeClass,
      'Total Class Fee ($)': s.totalFee,
      'Total Paid ($)': s.totalPaid,
      'Balance ($)': s.balance,
      Status: s.status,
      'Last Payment Date': s.lastPaymentDate || 'N/A'
    }));
    exportToExcel(exportRows, 'School_Fee_Balances_Springfield');
  };

  return (
    <div className="space-y-6">
      {/* Financial Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Fees Collected</div>
          <div className="text-2xl font-bold text-emerald-600 mt-1">
            ${totalCollected.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Confirmed Bank & Cash Receipts</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
          <div className="text-xs font-medium text-slate-500">Total Outstanding Fees</div>
          <div className="text-2xl font-bold text-amber-600 mt-1">
            ${totalOutstanding.toLocaleString('en-US', { minimumFractionDigits: 2 })}
          </div>
          <div className="text-[11px] text-slate-400 mt-1">Pending Unpaid Balances</div>
        </div>

        <div className="bg-white p-5 rounded-2xl border border-slate-200/80 shadow-2xs flex items-center justify-between">
          <div>
            <div className="text-xs font-medium text-slate-500">Collection Rate</div>
            <div className="text-2xl font-bold text-blue-600 mt-1">
              {totalCollected + totalOutstanding > 0
                ? `${Math.round((totalCollected / (totalCollected + totalOutstanding)) * 100)}%`
                : '100%'}
            </div>
            <div className="text-[11px] text-slate-400 mt-1">Term Fee Progress</div>
          </div>

          {canEdit && (
            <button
              id="record-new-payment-btn"
              onClick={handleOpenRecordModal}
              className="px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md inline-flex items-center space-x-1.5"
            >
              <Plus className="w-4 h-4" />
              <span>Record Payment</span>
            </button>
          )}
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl border shadow-2xs space-x-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('balances')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'balances'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Student Fee Balances
        </button>
        <button
          onClick={() => setActiveTab('payments')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'payments'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Payment Transactions Log
        </button>
        <button
          onClick={() => setActiveTab('structures')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'structures'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Class Fee Structures
        </button>
      </div>

      {/* TAB 1: STUDENT FEE BALANCES */}
      {activeTab === 'balances' && (
        <div className="space-y-4">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3 flex-1">
              <div className="relative flex-1 min-w-[200px]">
                <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
                <input
                  type="text"
                  placeholder="Search student name or ID..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
                />
              </div>

              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="All">All Classes</option>
                {INITIAL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>

              <select
                value={selectedStatus}
                onChange={(e) => setSelectedStatus(e.target.value)}
                className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
              >
                <option value="All">All Payment Statuses</option>
                <option value="Paid">Paid (Full)</option>
                <option value="Partial">Partial</option>
                <option value="Unpaid">Unpaid</option>
              </select>
            </div>

            <button
              onClick={handleExportLedgerExcel}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Ledger</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                <tr>
                  <th className="py-3.5 px-4">Student</th>
                  <th className="py-3.5 px-4">Class</th>
                  <th className="py-3.5 px-4 text-right">Total Fee</th>
                  <th className="py-3.5 px-4 text-right">Total Paid</th>
                  <th className="py-3.5 px-4 text-right">Balance Due</th>
                  <th className="py-3.5 px-4">Status</th>
                  <th className="py-3.5 px-4 text-right">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {filteredSummaries.map((summary) => (
                  <tr key={summary.studentId} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="font-bold text-slate-900">{summary.studentName}</div>
                      <div className="text-[11px] font-mono text-slate-400">{summary.studentId}</div>
                    </td>

                    <td className="py-3 px-4 font-medium text-slate-800">{summary.gradeClass}</td>

                    <td className="py-3 px-4 text-right font-medium text-slate-800">
                      ${summary.totalFee.toLocaleString('en-US')}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-emerald-600">
                      ${summary.totalPaid.toLocaleString('en-US')}
                    </td>

                    <td className="py-3 px-4 text-right font-bold text-rose-600">
                      ${summary.balance.toLocaleString('en-US')}
                    </td>

                    <td className="py-3 px-4">
                      <span
                        className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                          summary.status === 'Paid'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : summary.status === 'Partial'
                            ? 'bg-amber-100 text-amber-800 border border-amber-200'
                            : 'bg-rose-100 text-rose-800 border border-rose-200'
                        }`}
                      >
                        {summary.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      {canEdit && (
                        <button
                          onClick={() => {
                            setPaymentForm({
                              ...paymentForm,
                              studentId: summary.studentId,
                              amountPaid: summary.balance > 0 ? summary.balance : 100
                            });
                            setIsRecordModalOpen(true);
                          }}
                          className="px-3 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs"
                        >
                          Collect Fee
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: PAYMENTS LOG */}
      {activeTab === 'payments' && (
        <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase font-semibold border-b border-slate-200">
              <tr>
                <th className="p-3">Receipt No</th>
                <th className="p-3">Date</th>
                <th className="p-3">Student</th>
                <th className="p-3">Category</th>
                <th className="p-3">Mode</th>
                <th className="p-3 text-right">Amount Paid</th>
                <th className="p-3 text-right">Receipt PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100">
              {payments.map((p) => (
                <tr key={p.id || p.receiptNo} className="hover:bg-slate-50">
                  <td className="p-3 font-mono font-medium text-slate-900">{p.receiptNo}</td>
                  <td className="p-3 text-slate-600">{p.paymentDate}</td>
                  <td className="p-3 font-semibold text-slate-900">{p.studentName}</td>
                  <td className="p-3 text-slate-600">{p.feeType}</td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[11px]">
                      {p.paymentMode}
                    </span>
                  </td>
                  <td className="p-3 text-right font-bold text-emerald-600">+${p.amountPaid}</td>
                  <td className="p-3 text-right space-x-1.5">
                    <button
                      onClick={() => generatePaymentReceiptPDF(p)}
                      className="px-2.5 py-1 rounded-lg bg-blue-50 text-blue-600 hover:bg-blue-100 font-semibold text-xs inline-flex items-center space-x-1"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Print Receipt</span>
                    </button>
                    {canEdit && onDeletePayment && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete payment ${p.receiptNo} ($${p.amountPaid})? This will be moved to Trash.`
                            )
                          ) {
                            onDeletePayment(p);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Payment"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* TAB 3: CLASS FEE STRUCTURES */}
      {activeTab === 'structures' && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
          {feeStructures.map((fs) => (
            <div key={fs.id} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-3">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <h3 className="font-bold text-slate-900 text-base">{fs.gradeClass}</h3>
                <span className="text-xs font-semibold text-blue-600 bg-blue-50 px-2.5 py-0.5 rounded-full">
                  {fs.term}
                </span>
              </div>

              <div className="space-y-1.5 text-xs text-slate-600">
                <div className="flex justify-between">
                  <span>Tuition Fee:</span> <span className="font-semibold text-slate-800">${fs.tuitionFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Examination Fee:</span> <span className="font-semibold text-slate-800">${fs.examFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Transport Fee:</span> <span className="font-semibold text-slate-800">${fs.transportFee}</span>
                </div>
                <div className="flex justify-between">
                  <span>Library & Sports:</span> <span className="font-semibold text-slate-800">${fs.libraryFee + fs.otherFee}</span>
                </div>
              </div>

              <div className="pt-3 border-t border-slate-100 flex items-center justify-between">
                <span className="font-bold text-slate-800 text-xs">Total Term Fee:</span>
                <span className="font-extrabold text-blue-700 text-base">${fs.totalFee}</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Record Fee Payment Modal */}
      {isRecordModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">Record Fee Payment</h3>
              <button onClick={() => setIsRecordModalOpen(false)} className="p-1 text-slate-400">
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleRecordSubmit} className="space-y-4 pt-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Select Student
                </label>
                <select
                  value={paymentForm.studentId}
                  onChange={(e) => setPaymentForm({ ...paymentForm, studentId: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium"
                >
                  {students.map((stu) => (
                    <option key={stu.id} value={stu.studentId}>
                      {stu.fullName} ({stu.studentId} - {stu.gradeClass})
                    </option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Amount Paid ($)
                  </label>
                  <input
                    type="number"
                    required
                    min={1}
                    value={paymentForm.amountPaid}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, amountPaid: Number(e.target.value) })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-bold text-slate-900"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Mode
                  </label>
                  <select
                    value={paymentForm.paymentMode}
                    onChange={(e) =>
                      setPaymentForm({ ...paymentForm, paymentMode: e.target.value as PaymentMode })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Cash">Cash</option>
                    <option value="Bank Transfer">Bank Transfer</option>
                    <option value="Mobile Money">Mobile Money</option>
                    <option value="Card">Card</option>
                    <option value="Cheque">Cheque</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Fee Category
                  </label>
                  <input
                    type="text"
                    required
                    value={paymentForm.feeType}
                    onChange={(e) => setPaymentForm({ ...paymentForm, feeType: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Payment Date
                  </label>
                  <input
                    type="date"
                    required
                    value={paymentForm.paymentDate}
                    onChange={(e) => setPaymentForm({ ...paymentForm, paymentDate: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Transaction / Ref No.
                </label>
                <input
                  type="text"
                  value={paymentForm.transactionRef}
                  onChange={(e) => setPaymentForm({ ...paymentForm, transactionRef: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                />
              </div>

              <div className="pt-4 flex justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsRecordModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold rounded-xl text-xs shadow-sm"
                >
                  Save & Generate Receipt
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Instant Receipt Preview Dialog */}
      {selectedPaymentForReceipt && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-100 text-center space-y-4">
            <div className="w-12 h-12 rounded-full bg-emerald-100 text-emerald-600 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6" />
            </div>
            <h3 className="font-bold text-slate-900 text-lg">Payment Receipt Ready</h3>
            <p className="text-xs text-slate-500">
              Receipt #{selectedPaymentForReceipt.receiptNo} for {selectedPaymentForReceipt.studentName} (${selectedPaymentForReceipt.amountPaid}).
            </p>

            <div className="pt-2 flex items-center justify-center space-x-3">
              <button
                onClick={() => setSelectedPaymentForReceipt(null)}
                className="px-4 py-2 border rounded-xl text-xs font-semibold text-slate-600"
              >
                Close
              </button>
              <button
                onClick={() => generatePaymentReceiptPDF(selectedPaymentForReceipt)}
                className="px-5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center space-x-2"
              >
                <Download className="w-4 h-4" />
                <span>Download PDF Receipt</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
