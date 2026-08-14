export type UserRole = 'Admin' | 'Teacher' | 'Accountant';

export type StudentStatus = 'Active' | 'Inactive' | 'Graduated';

export interface Student {
  id: string;
  studentId: string; // e.g. STU-2026-001
  fullName: string;
  gradeClass: string; // e.g. Grade 10A
  rollNumber: string;
  gender: 'Male' | 'Female' | 'Other';
  dateOfBirth: string;
  parentName: string;
  parentPhone: string;
  parentEmail?: string;
  photoUrl?: string;
  address?: string;
  status: StudentStatus;
  createdAt: string;
}

export type TeacherStatus = 'Active' | 'On Leave' | 'Resigned';

export interface Teacher {
  id: string;
  teacherId: string; // e.g. TCH-2026-01
  fullName: string;
  email: string;
  phone: string;
  username?: string;
  subjects: string[]; // e.g. ['Mathematics', 'Physics']
  assignedClasses: string[]; // e.g. ['Grade 10A', 'Grade 11B']
  qualification: string;
  joiningDate: string;
  status: TeacherStatus;
}

export type AttendanceStatus = 'Present' | 'Absent' | 'Late' | 'Excused';

export interface StudentAttendanceRecord {
  studentId: string;
  studentName?: string;
  status: AttendanceStatus;
  remarks?: string;
}

export interface DailyAttendance {
  id: string;
  date: string; // YYYY-MM-DD
  gradeClass: string;
  records: StudentAttendanceRecord[];
  markedBy: string;
  updatedAt: string;
}

export interface FeeStructure {
  id: string;
  gradeClass: string;
  tuitionFee: number;
  examFee: number;
  transportFee: number;
  libraryFee: number;
  otherFee: number;
  totalFee: number;
  term: string;
}

export type PaymentMode = 'Cash' | 'Bank Transfer' | 'Mobile Money' | 'Card' | 'Cheque';

export interface FeePayment {
  id: string;
  receiptNo: string;
  studentId: string; // references Student.studentId or Student.id
  studentName: string;
  gradeClass: string;
  amountPaid: number;
  paymentDate: string; // YYYY-MM-DD
  paymentMode: PaymentMode;
  feeType: string; // e.g. Tuition Fee, Exam Fee, Total Fee
  transactionRef?: string;
  remarks?: string;
  receivedBy: string;
}

export type ExamStatus = 'Upcoming' | 'Ongoing' | 'Completed';

export interface Exam {
  id: string;
  title: string; // e.g. Mid-Term Assessment 2026
  term: string; // e.g. Term 1, Term 2
  academicYear: string; // e.g. 2025-2026
  startDate: string;
  endDate: string;
  gradeClasses: string[];
  subjects: string[];
  status: ExamStatus;
}

export interface ExamResult {
  id: string;
  examId: string;
  examTitle?: string;
  studentId: string;
  studentName?: string;
  gradeClass: string;
  subjectMarks: Record<string, number>; // { Mathematics: 88, Physics: 92, English: 78 }
  totalMarks: number;
  maxPossible: number;
  average: number;
  grade: string; // A+, A, B, C, D, F
  position?: number;
  resultStatus: 'Pass' | 'Fail';
  teacherRemarks?: string;
}

export type NotificationChannel = 'SMS' | 'WhatsApp';
export type NotificationType = 'Absence' | 'Unpaid Fee' | 'Payment Receipt' | 'Exam Result' | 'Announcement';

export interface NotificationLog {
  id: string;
  studentId?: string;
  studentName?: string;
  parentPhone: string;
  channel: NotificationChannel;
  type: NotificationType;
  message: string;
  sentAt: string;
  status: 'Delivered' | 'Pending' | 'Failed';
  sentBy: string;
}

export interface UserProfile {
  uid: string;
  email: string;
  displayName: string;
  username?: string;
  teacherId?: string;
  role: UserRole;
  status: 'Active' | 'Inactive';
  passwordHash?: string;
  assignedClasses?: string[];
}

export interface FeeSummary {
  studentId: string;
  studentName: string;
  gradeClass: string;
  totalFee: number;
  totalPaid: number;
  balance: number;
  status: 'Paid' | 'Partial' | 'Unpaid';
  lastPaymentDate?: string;
}

export interface TrashItem {
  id: string;
  originalCollection: string;
  originalId: string;
  entityType: string;
  title: string;
  subtitle?: string;
  deletedAt: string;
  deletedBy: string;
  data: any;
}
