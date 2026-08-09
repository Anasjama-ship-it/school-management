import {
  collection,
  getDocs,
  doc,
  setDoc,
  writeBatch
} from 'firebase/firestore';
import { db } from './firebase';
import {
  Student,
  Teacher,
  FeeStructure,
  FeePayment,
  Exam,
  ExamResult,
  DailyAttendance,
  NotificationLog,
  UserProfile
} from '../types';

export const INITIAL_CLASSES = [
  'Grade 9A',
  'Grade 9B',
  'Grade 10A',
  'Grade 10B',
  'Grade 11A',
  'Grade 12A'
];

export const ALL_SUBJECTS = [
  'Mathematics',
  'Physics',
  'Chemistry',
  'Biology',
  'English Language',
  'History',
  'Computer Science',
  'Economics'
];

export const INITIAL_STUDENTS: Omit<Student, 'id'>[] = [
  {
    studentId: 'STU-2026-001',
    fullName: 'Alex Johnson',
    gradeClass: 'Grade 10A',
    rollNumber: '101',
    gender: 'Male',
    dateOfBirth: '2010-04-15',
    parentName: 'Robert Johnson',
    parentPhone: '+1 (555) 234-5678',
    parentEmail: 'robert.j@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200',
    address: '124 Oak Ridge Ave, Springfield',
    status: 'Active',
    createdAt: '2026-01-10'
  },
  {
    studentId: 'STU-2026-002',
    fullName: 'Sophia Martinez',
    gradeClass: 'Grade 10A',
    rollNumber: '102',
    gender: 'Female',
    dateOfBirth: '2010-08-22',
    parentName: 'Elena Martinez',
    parentPhone: '+1 (555) 876-5432',
    parentEmail: 'elena.m@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1517841905240-472988babdf9?auto=format&fit=crop&q=80&w=200',
    address: '456 Maple Street, Springfield',
    status: 'Active',
    createdAt: '2026-01-10'
  },
  {
    studentId: 'STU-2026-003',
    fullName: 'Ethan Williams',
    gradeClass: 'Grade 10A',
    rollNumber: '103',
    gender: 'Male',
    dateOfBirth: '2010-02-11',
    parentName: 'David Williams',
    parentPhone: '+1 (555) 345-6789',
    parentEmail: 'david.w@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1539571696357-5a69c17a67c6?auto=format&fit=crop&q=80&w=200',
    address: '789 Pine Drive, Springfield',
    status: 'Active',
    createdAt: '2026-01-11'
  },
  {
    studentId: 'STU-2026-004',
    fullName: 'Olivia Brown',
    gradeClass: 'Grade 10B',
    rollNumber: '201',
    gender: 'Female',
    dateOfBirth: '2010-11-05',
    parentName: 'Sarah Brown',
    parentPhone: '+1 (555) 456-7890',
    parentEmail: 'sarah.b@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1494790108377-be9c29b29330?auto=format&fit=crop&q=80&w=200',
    address: '321 Cedar Blvd, Springfield',
    status: 'Active',
    createdAt: '2026-01-12'
  },
  {
    studentId: 'STU-2026-005',
    fullName: 'Liam Davis',
    gradeClass: 'Grade 10B',
    rollNumber: '202',
    gender: 'Male',
    dateOfBirth: '2010-06-30',
    parentName: 'Michael Davis',
    parentPhone: '+1 (555) 567-8901',
    parentEmail: 'michael.d@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&q=80&w=200',
    address: '654 Birch Road, Springfield',
    status: 'Active',
    createdAt: '2026-01-12'
  },
  {
    studentId: 'STU-2026-006',
    fullName: 'Emma Wilson',
    gradeClass: 'Grade 11A',
    rollNumber: '301',
    gender: 'Female',
    dateOfBirth: '2009-09-19',
    parentName: 'James Wilson',
    parentPhone: '+1 (555) 678-9012',
    parentEmail: 'james.w@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?auto=format&fit=crop&q=80&w=200',
    address: '987 Willow Way, Springfield',
    status: 'Active',
    createdAt: '2026-01-14'
  },
  {
    studentId: 'STU-2026-007',
    fullName: 'Noah Taylor',
    gradeClass: 'Grade 12A',
    rollNumber: '401',
    gender: 'Male',
    dateOfBirth: '2008-01-25',
    parentName: 'Patricia Taylor',
    parentPhone: '+1 (555) 789-0123',
    parentEmail: 'patricia.t@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&q=80&w=200',
    address: '159 Elm Street, Springfield',
    status: 'Active',
    createdAt: '2026-01-15'
  },
  {
    studentId: 'STU-2026-008',
    fullName: 'Mia Anderson',
    gradeClass: 'Grade 9A',
    rollNumber: '501',
    gender: 'Female',
    dateOfBirth: '2011-07-14',
    parentName: 'Thomas Anderson',
    parentPhone: '+1 (555) 890-1234',
    parentEmail: 'thomas.a@example.com',
    photoUrl: 'https://images.unsplash.com/photo-1438761681033-6461ffad8d80?auto=format&fit=crop&q=80&w=200',
    address: '753 Ash Lane, Springfield',
    status: 'Active',
    createdAt: '2026-01-16'
  }
];

export const INITIAL_TEACHERS: Omit<Teacher, 'id'>[] = [
  {
    teacherId: 'TCH-2026-01',
    fullName: 'Dr. Marcus Vance',
    email: 'marcus.vance@school.edu',
    phone: '+1 (555) 911-2233',
    subjects: ['Mathematics', 'Computer Science'],
    assignedClasses: ['Grade 10A', 'Grade 10B', 'Grade 12A'],
    qualification: 'Ph.D. in Applied Mathematics',
    joiningDate: '2021-08-15',
    status: 'Active'
  },
  {
    teacherId: 'TCH-2026-02',
    fullName: 'Sarah Jenkins',
    email: 'sarah.jenkins@school.edu',
    phone: '+1 (555) 922-3344',
    subjects: ['Physics', 'Chemistry'],
    assignedClasses: ['Grade 10A', 'Grade 11A'],
    qualification: 'M.Sc. Physics',
    joiningDate: '2022-09-01',
    status: 'Active'
  },
  {
    teacherId: 'TCH-2026-03',
    fullName: 'David Thorne',
    email: 'david.thorne@school.edu',
    phone: '+1 (555) 933-4455',
    subjects: ['English Language', 'History'],
    assignedClasses: ['Grade 9A', 'Grade 10B'],
    qualification: 'M.A. English Literature',
    joiningDate: '2020-01-10',
    status: 'Active'
  },
  {
    teacherId: 'TCH-2026-04',
    fullName: 'Rachel Green',
    email: 'rachel.green@school.edu',
    phone: '+1 (555) 944-5566',
    subjects: ['Biology', 'Chemistry'],
    assignedClasses: ['Grade 9B', 'Grade 12A'],
    qualification: 'B.Sc. Biochemistry',
    joiningDate: '2023-01-15',
    status: 'Active'
  }
];

export const INITIAL_FEE_STRUCTURES: Omit<FeeStructure, 'id'>[] = [
  {
    gradeClass: 'Grade 9A',
    tuitionFee: 600,
    examFee: 50,
    transportFee: 100,
    libraryFee: 30,
    otherFee: 20,
    totalFee: 800,
    term: 'Term 1 2026'
  },
  {
    gradeClass: 'Grade 9B',
    tuitionFee: 600,
    examFee: 50,
    transportFee: 100,
    libraryFee: 30,
    otherFee: 20,
    totalFee: 800,
    term: 'Term 1 2026'
  },
  {
    gradeClass: 'Grade 10A',
    tuitionFee: 700,
    examFee: 60,
    transportFee: 120,
    libraryFee: 40,
    otherFee: 30,
    totalFee: 950,
    term: 'Term 1 2026'
  },
  {
    gradeClass: 'Grade 10B',
    tuitionFee: 700,
    examFee: 60,
    transportFee: 120,
    libraryFee: 40,
    otherFee: 30,
    totalFee: 950,
    term: 'Term 1 2026'
  },
  {
    gradeClass: 'Grade 11A',
    tuitionFee: 800,
    examFee: 70,
    transportFee: 130,
    libraryFee: 50,
    otherFee: 50,
    totalFee: 1100,
    term: 'Term 1 2026'
  },
  {
    gradeClass: 'Grade 12A',
    tuitionFee: 900,
    examFee: 80,
    transportFee: 150,
    libraryFee: 50,
    otherFee: 70,
    totalFee: 1250,
    term: 'Term 1 2026'
  }
];

export const INITIAL_PAYMENTS: Omit<FeePayment, 'id'>[] = [
  {
    receiptNo: 'RCP-2026-001',
    studentId: 'STU-2026-001',
    studentName: 'Alex Johnson',
    gradeClass: 'Grade 10A',
    amountPaid: 950,
    paymentDate: '2026-01-20',
    paymentMode: 'Bank Transfer',
    feeType: 'Full Term 1 Fee',
    transactionRef: 'TRX9988231',
    remarks: 'Paid in full for Term 1',
    receivedBy: 'Accountant User'
  },
  {
    receiptNo: 'RCP-2026-002',
    studentId: 'STU-2026-002',
    studentName: 'Sophia Martinez',
    gradeClass: 'Grade 10A',
    amountPaid: 500,
    paymentDate: '2026-01-22',
    paymentMode: 'Cash',
    feeType: 'Partial Tuition',
    transactionRef: 'CASH-881',
    remarks: 'Remaining balance $450 due next month',
    receivedBy: 'Accountant User'
  },
  {
    receiptNo: 'RCP-2026-003',
    studentId: 'STU-2026-003',
    studentName: 'Ethan Williams',
    gradeClass: 'Grade 10A',
    amountPaid: 950,
    paymentDate: '2026-01-25',
    paymentMode: 'Mobile Money',
    feeType: 'Full Term 1 Fee',
    transactionRef: 'MM-449102',
    remarks: 'Paid in full',
    receivedBy: 'Accountant User'
  },
  {
    receiptNo: 'RCP-2026-004',
    studentId: 'STU-2026-004',
    studentName: 'Olivia Brown',
    gradeClass: 'Grade 10B',
    amountPaid: 600,
    paymentDate: '2026-02-01',
    paymentMode: 'Card',
    feeType: 'Tuition Fee',
    transactionRef: 'CRD-77213',
    remarks: 'Balance $350 unpaid',
    receivedBy: 'Accountant User'
  },
  {
    receiptNo: 'RCP-2026-005',
    studentId: 'STU-2026-007',
    studentName: 'Noah Taylor',
    gradeClass: 'Grade 12A',
    amountPaid: 1250,
    paymentDate: '2026-02-03',
    paymentMode: 'Bank Transfer',
    feeType: 'Full Term 1 Fee',
    transactionRef: 'TRX7733190',
    remarks: 'Full payment clear',
    receivedBy: 'Accountant User'
  }
];

export const INITIAL_EXAMS: Omit<Exam, 'id'>[] = [
  {
    title: 'Mid-Term Examinations 2026',
    term: 'Term 1',
    academicYear: '2025-2026',
    startDate: '2026-03-10',
    endDate: '2026-03-20',
    gradeClasses: ['Grade 9A', 'Grade 10A', 'Grade 10B', 'Grade 11A', 'Grade 12A'],
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English Language', 'Biology'],
    status: 'Upcoming'
  },
  {
    title: 'First Term Assessment 2026',
    term: 'Term 1',
    academicYear: '2025-2026',
    startDate: '2026-01-15',
    endDate: '2026-01-25',
    gradeClasses: ['Grade 10A', 'Grade 10B'],
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English Language'],
    status: 'Completed'
  }
];

export const INITIAL_EXAM_RESULTS: Omit<ExamResult, 'id'>[] = [
  {
    examId: 'EXM-FIRST-TERM',
    examTitle: 'First Term Assessment 2026',
    studentId: 'STU-2026-001',
    studentName: 'Alex Johnson',
    gradeClass: 'Grade 10A',
    subjectMarks: {
      Mathematics: 92,
      Physics: 88,
      Chemistry: 85,
      'English Language': 90
    },
    totalMarks: 355,
    maxPossible: 400,
    average: 88.75,
    grade: 'A+',
    position: 1,
    resultStatus: 'Pass',
    teacherRemarks: 'Outstanding performance across all STEM and Humanities subjects.'
  },
  {
    examId: 'EXM-FIRST-TERM',
    examTitle: 'First Term Assessment 2026',
    studentId: 'STU-2026-002',
    studentName: 'Sophia Martinez',
    gradeClass: 'Grade 10A',
    subjectMarks: {
      Mathematics: 84,
      Physics: 80,
      Chemistry: 82,
      'English Language': 94
    },
    totalMarks: 340,
    maxPossible: 400,
    average: 85.0,
    grade: 'A',
    position: 2,
    resultStatus: 'Pass',
    teacherRemarks: 'Excellent language skills. Good progress in sciences.'
  },
  {
    examId: 'EXM-FIRST-TERM',
    examTitle: 'First Term Assessment 2026',
    studentId: 'STU-2026-003',
    studentName: 'Ethan Williams',
    gradeClass: 'Grade 10A',
    subjectMarks: {
      Mathematics: 68,
      Physics: 72,
      Chemistry: 65,
      'English Language': 75
    },
    totalMarks: 280,
    maxPossible: 400,
    average: 70.0,
    grade: 'B',
    position: 3,
    resultStatus: 'Pass',
    teacherRemarks: 'Consistent work. Needs additional focus in Mathematics problem solving.'
  }
];

export const INITIAL_NOTIFICATIONS: Omit<NotificationLog, 'id'>[] = [
  {
    studentId: 'STU-2026-002',
    studentName: 'Sophia Martinez',
    parentPhone: '+1 (555) 876-5432',
    channel: 'WhatsApp',
    type: 'Unpaid Fee',
    message: 'Dear Parent, this is a reminder that Sophia Martinez has an unpaid school fee balance of $450. Kindly resolve at your earliest convenience.',
    sentAt: '2026-02-05 10:30 AM',
    status: 'Delivered',
    sentBy: 'Accountant User'
  },
  {
    studentId: 'STU-2026-001',
    studentName: 'Alex Johnson',
    parentPhone: '+1 (555) 234-5678',
    channel: 'SMS',
    type: 'Payment Receipt',
    message: 'Dear Robert Johnson, payment of $950 for Alex Johnson (Receipt #RCP-2026-001) has been received with thanks. Remaining balance: $0.',
    sentAt: '2026-01-20 02:15 PM',
    status: 'Delivered',
    sentBy: 'Accountant User'
  },
  {
    studentId: 'STU-2026-005',
    studentName: 'Liam Davis',
    parentPhone: '+1 (555) 567-8901',
    channel: 'SMS',
    type: 'Absence',
    message: 'Dear Parent, Liam Davis was marked ABSENT today (2026-02-08) in Grade 10B. Please notify the school if this is an excused leave.',
    sentAt: '2026-02-08 09:15 AM',
    status: 'Delivered',
    sentBy: 'Teacher User'
  }
];

export const DEMO_USERS: UserProfile[] = [
  {
    uid: 'demo-admin-01',
    email: 'admin@school.edu',
    displayName: 'Principal Sarah Connor',
    role: 'Admin',
    status: 'Active'
  },
  {
    uid: 'demo-teacher-01',
    email: 'teacher@school.edu',
    displayName: 'Dr. Marcus Vance',
    role: 'Teacher',
    status: 'Active'
  },
  {
    uid: 'demo-accountant-01',
    email: 'accountant@school.edu',
    displayName: 'John Sterling',
    role: 'Accountant',
    status: 'Active'
  }
];

export async function seedInitialDataToFirestore() {
  try {
    const studentsSnap = await getDocs(collection(db, 'students'));
    if (!studentsSnap.empty) {
      console.log('Database already populated.');
      return false;
    }

    console.log('Seeding initial school management data...');

    // Seed Students
    for (const stu of INITIAL_STUDENTS) {
      const newRef = doc(collection(db, 'students'));
      await setDoc(newRef, { ...stu, id: newRef.id });
    }

    // Seed Teachers
    for (const tch of INITIAL_TEACHERS) {
      const newRef = doc(collection(db, 'teachers'));
      await setDoc(newRef, { ...tch, id: newRef.id });
    }

    // Seed Fee Structures
    for (const fs of INITIAL_FEE_STRUCTURES) {
      const newRef = doc(collection(db, 'feeStructures'));
      await setDoc(newRef, { ...fs, id: newRef.id });
    }

    // Seed Payments
    for (const pay of INITIAL_PAYMENTS) {
      const newRef = doc(collection(db, 'feePayments'));
      await setDoc(newRef, { ...pay, id: newRef.id });
    }

    // Seed Exams
    for (const ex of INITIAL_EXAMS) {
      const newRef = doc(collection(db, 'exams'));
      await setDoc(newRef, { ...ex, id: newRef.id });
    }

    // Seed Exam Results
    for (const res of INITIAL_EXAM_RESULTS) {
      const newRef = doc(collection(db, 'examResults'));
      await setDoc(newRef, { ...res, id: newRef.id });
    }

    // Seed Notifications
    for (const notif of INITIAL_NOTIFICATIONS) {
      const newRef = doc(collection(db, 'notifications'));
      await setDoc(newRef, { ...notif, id: newRef.id });
    }

    // Seed Users
    for (const u of DEMO_USERS) {
      await setDoc(doc(db, 'users', u.uid), u);
    }

    console.log('Successfully seeded all initial school management data!');
    return true;
  } catch (error) {
    console.error('Error seeding data:', error);
    return false;
  }
}
