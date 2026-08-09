import jsPDF from 'jspdf';
import autoTable from 'jspdf-autotable';
import * as XLSX from 'xlsx';
import { FeePayment, Student, FeeSummary, ExamResult } from '../types';

export function exportToExcel(data: Record<string, any>[], fileName: string) {
  const worksheet = XLSX.utils.json_to_sheet(data);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Data');
  XLSX.writeFile(workbook, `${fileName}.xlsx`);
}

export function exportToCSV(data: Record<string, any>[], fileName: string) {
  if (!data || !data.length) return;
  const headers = Object.keys(data[0]);
  const csvRows = [headers.join(',')];

  for (const row of data) {
    const values = headers.map(h => {
      const val = row[h] ?? '';
      return `"${String(val).replace(/"/g, '""')}"`;
    });
    csvRows.push(values.join(','));
  }

  const blob = new Blob([csvRows.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', `${fileName}.csv`);
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}

export function generatePaymentReceiptPDF(payment: FeePayment, student?: Student) {
  const doc = new jsPDF();

  // School Header
  doc.setFillColor(30, 58, 138); // Dark Navy Blue (#1e3a8a)
  doc.rect(0, 0, 210, 32, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(20);
  doc.setFont('helvetica', 'bold');
  doc.text('SPRINGFIELD INTERNATIONAL ACADEMY', 105, 14, { align: 'center' });

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.text('100 Education Way, Springfield • Phone: +1 (555) 000-SCHOOL • info@springfield.edu', 105, 23, { align: 'center' });

  // Receipt Title & Badge
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(16);
  doc.setFont('helvetica', 'bold');
  doc.text('OFFICIAL FEE PAYMENT RECEIPT', 14, 45);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 48, 196, 48);

  // Meta Info Box
  doc.setTextColor(51, 65, 85);
  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');

  doc.text(`Receipt No: ${payment.receiptNo}`, 14, 56);
  doc.text(`Date: ${payment.paymentDate}`, 130, 56);

  doc.text(`Student Name: ${payment.studentName}`, 14, 64);
  doc.text(`Student ID: ${payment.studentId}`, 130, 64);

  doc.text(`Class: ${payment.gradeClass}`, 14, 72);
  doc.text(`Payment Mode: ${payment.paymentMode}`, 130, 72);

  if (student?.parentName) {
    doc.text(`Parent/Guardian: ${student.parentName}`, 14, 80);
    doc.text(`Parent Contact: ${student.parentPhone}`, 130, 80);
  }

  // Payment Breakdown Table
  autoTable(doc, {
    startY: 88,
    head: [['Description / Fee Category', 'Payment Method', 'Transaction Ref', 'Amount Paid']],
    body: [
      [
        payment.feeType,
        payment.paymentMode,
        payment.transactionRef || 'N/A',
        `$${payment.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`
      ]
    ],
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid'
  });

  // Total Summary
  const finalY = (doc as any).lastAutoTable.finalY || 120;

  doc.setFillColor(241, 245, 249);
  doc.rect(120, finalY + 10, 76, 24, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(120, finalY + 10, 76, 24, 'D');

  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text('TOTAL RECEIVED:', 124, finalY + 22);
  doc.text(`$${payment.amountPaid.toLocaleString('en-US', { minimumFractionDigits: 2 })}`, 192, finalY + 22, { align: 'right' });

  // Remarks
  if (payment.remarks) {
    doc.setFontSize(10);
    doc.setFont('helvetica', 'italic');
    doc.setTextColor(100, 116, 139);
    doc.text(`Remarks: ${payment.remarks}`, 14, finalY + 20);
  }

  // Signatures & Stamp area
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.line(14, finalY + 55, 70, finalY + 55);
  doc.text('Received By: ' + payment.receivedBy, 14, finalY + 60);

  doc.line(130, finalY + 55, 190, finalY + 55);
  doc.text('Authorized School Stamp', 130, finalY + 60);

  // Footer Note
  doc.setFontSize(8);
  doc.setTextColor(148, 163, 184);
  doc.text('This is a computer-generated official receipt from Springfield International Academy.', 105, 285, { align: 'center' });

  doc.save(`Receipt_${payment.receiptNo}.pdf`);
}

export function generateReportCardPDF(result: ExamResult, student?: Student) {
  const doc = new jsPDF();

  // Header
  doc.setFillColor(30, 58, 138);
  doc.rect(0, 0, 210, 36, 'F');

  doc.setTextColor(255, 255, 255);
  doc.setFontSize(22);
  doc.setFont('helvetica', 'bold');
  doc.text('SPRINGFIELD INTERNATIONAL ACADEMY', 105, 15, { align: 'center' });

  doc.setFontSize(11);
  doc.setFont('helvetica', 'normal');
  doc.text('STUDENT ACADEMIC PERFORMANCE REPORT CARD', 105, 25, { align: 'center' });

  // Student & Exam Details
  doc.setTextColor(30, 58, 138);
  doc.setFontSize(14);
  doc.setFont('helvetica', 'bold');
  doc.text(result.examTitle || 'Academic Examination', 14, 48);

  doc.setDrawColor(203, 213, 225);
  doc.line(14, 51, 196, 51);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(51, 65, 85);

  doc.text(`Student Name: ${result.studentName || 'Student'}`, 14, 58);
  doc.text(`Student ID: ${result.studentId}`, 130, 58);

  doc.text(`Grade / Class: ${result.gradeClass}`, 14, 66);
  doc.text(`Roll Number: ${student?.rollNumber || 'N/A'}`, 130, 66);

  doc.text(`Parent Name: ${student?.parentName || 'N/A'}`, 14, 74);
  doc.text(`Date Generated: ${new Date().toLocaleDateString()}`, 130, 74);

  // Marks Table
  const tableData = Object.entries(result.subjectMarks).map(([subject, mark]) => {
    let letterGrade = 'F';
    if (mark >= 90) letterGrade = 'A+';
    else if (mark >= 80) letterGrade = 'A';
    else if (mark >= 70) letterGrade = 'B';
    else if (mark >= 60) letterGrade = 'C';
    else if (mark >= 50) letterGrade = 'D';

    const status = mark >= 50 ? 'Pass' : 'Fail';
    return [subject, '100', String(mark), letterGrade, status];
  });

  autoTable(doc, {
    startY: 82,
    head: [['Subject Title', 'Max Marks', 'Marks Obtained', 'Grade', 'Remarks']],
    body: tableData,
    headStyles: { fillColor: [30, 58, 138], textColor: [255, 255, 255], fontStyle: 'bold' },
    bodyStyles: { textColor: [30, 41, 59] },
    alternateRowStyles: { fillColor: [248, 250, 252] },
    theme: 'grid'
  });

  const finalY = (doc as any).lastAutoTable.finalY || 150;

  // Overview Summary Box
  doc.setFillColor(241, 245, 249);
  doc.rect(14, finalY + 8, 182, 32, 'F');
  doc.setDrawColor(203, 213, 225);
  doc.rect(14, finalY + 8, 182, 32, 'D');

  doc.setFontSize(10);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);

  doc.text(`Total Score: ${result.totalMarks} / ${result.maxPossible}`, 20, finalY + 18);
  doc.text(`Percentage Average: ${result.average.toFixed(1)}%`, 110, finalY + 18);

  doc.text(`Overall Grade: ${result.grade}`, 20, finalY + 28);
  doc.text(`Class Position / Rank: #${result.position || 1}`, 110, finalY + 28);

  // Teacher / Principal Remarks
  doc.setFontSize(11);
  doc.setFont('helvetica', 'bold');
  doc.setTextColor(30, 58, 138);
  doc.text("Teacher's Remarks:", 14, finalY + 50);

  doc.setFontSize(10);
  doc.setFont('helvetica', 'italic');
  doc.setTextColor(51, 65, 85);
  doc.text(`"${result.teacherRemarks || 'Satisfactory academic progress and effort.'}"`, 14, finalY + 58);

  // Signature Block
  doc.setFontSize(9);
  doc.setFont('helvetica', 'normal');
  doc.setTextColor(71, 85, 105);

  doc.line(14, finalY + 80, 65, finalY + 80);
  doc.text('Class Teacher Signature', 14, finalY + 85);

  doc.line(135, finalY + 80, 190, finalY + 80);
  doc.text('Principal Signature & Seal', 135, finalY + 85);

  doc.save(`ReportCard_${result.studentId}_${result.examId}.pdf`);
}
