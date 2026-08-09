import React, { useState, useEffect } from 'react';
import { supabase } from './lib/supabase';
import {
  fetchStudents,
  createStudent,
  updateStudentRecord,
  deleteStudentRecord,
  fetchTeachers,
  createTeacher,
  updateTeacherRecord,
  deleteTeacherRecord,
  fetchAttendance,
  saveAttendanceRecord,
  fetchFeeStructures,
  saveFeeStructure,
  fetchFeePayments,
  createFeePayment,
  deleteFeePaymentRecord,
  fetchExams,
  createExamRecord,
  deleteExamRecord,
  fetchExamResults,
  saveExamResultRecord,
  deleteExamResultRecord,
  fetchNotifications,
  createNotificationLog,
  fetchTrashItems,
  createTrashItem,
  restoreItemFromTrash,
  deleteTrashItemPermanently,
  emptyAllTrash,
  seedAllInitialDataToSupabase
} from './lib/supabaseApi';

import { AuthProvider, useAuth } from './context/AuthContext';
import { Sidebar } from './components/Sidebar';
import { Header } from './components/Header';
import { DashboardView } from './components/Dashboard/DashboardView';
import { StudentsModule } from './components/Students/StudentsModule';
import { TeachersModule } from './components/Teachers/TeachersModule';
import { AttendanceModule } from './components/Attendance/AttendanceModule';
import { FeesModule } from './components/Fees/FeesModule';
import { ExamsModule } from './components/Exams/ExamsModule';
import { NotificationsModule } from './components/Notifications/NotificationsModule';
import { UsersModule } from './components/Users/UsersModule';
import { TrashModule } from './components/Trash/TrashModule';
import { SupabaseConfigModal } from './components/Supabase/SupabaseConfigModal';

import {
  Student,
  Teacher,
  DailyAttendance,
  FeeStructure,
  FeePayment,
  Exam,
  ExamResult,
  NotificationLog,
  FeeSummary,
  TrashItem
} from './types';

function SchoolManagementApp() {
  const { activeRole, hasRole } = useAuth();

  // Navigation State
  const [activeTab, setActiveTab] = useState('dashboard');
  const [isMobileSidebarOpen, setIsMobileSidebarOpen] = useState(false);
  const [globalSearchTerm, setGlobalSearchTerm] = useState('');
  const [isRecordPaymentModalOpen, setIsRecordPaymentModalOpen] = useState(false);
  const [isSeeding, setIsSeeding] = useState(false);
  const [isSupabaseModalOpen, setIsSupabaseModalOpen] = useState(false);

  // Supabase State Collections
  const [students, setStudents] = useState<Student[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [attendanceRecords, setAttendanceRecords] = useState<DailyAttendance[]>([]);
  const [feeStructures, setFeeStructures] = useState<FeeStructure[]>([]);
  const [feePayments, setFeePayments] = useState<FeePayment[]>([]);
  const [exams, setExams] = useState<Exam[]>([]);
  const [examResults, setExamResults] = useState<ExamResult[]>([]);
  const [notifications, setNotifications] = useState<NotificationLog[]>([]);
  const [trashItems, setTrashItems] = useState<TrashItem[]>([]);

  // Load all Supabase tables
  const loadAllSupabaseData = async () => {
    try {
      const [stus, tchs, atts, fees, pymts, exms, rslts, notifs, trsh] = await Promise.all([
        fetchStudents(),
        fetchTeachers(),
        fetchAttendance(),
        fetchFeeStructures(),
        fetchFeePayments(),
        fetchExams(),
        fetchExamResults(),
        fetchNotifications(),
        fetchTrashItems()
      ]);

      setStudents(stus);
      setTeachers(tchs);
      setAttendanceRecords(atts);
      setFeeStructures(fees);
      setFeePayments(pymts);
      setExams(exms);
      setExamResults(rslts);
      setNotifications(notifs);
      setTrashItems(trsh);
    } catch (err) {
      console.warn('Error syncing Supabase tables:', err);
    }
  };

  // Subscribe to Supabase Realtime changes
  useEffect(() => {
    loadAllSupabaseData();

    const channel = supabase
      .channel('school-db-realtime')
      .on('postgres_changes', { event: '*', schema: 'public' }, () => {
        loadAllSupabaseData();
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  // Check & Auto Seed Supabase if empty on first load only
  useEffect(() => {
    const hasSeeded = localStorage.getItem('has_supabase_seeded_v2');
    if (students.length === 0 && !isSeeding && !hasSeeded) {
      handleSeedData();
    }
  }, [students.length]);

  const handleSeedData = async () => {
    setIsSeeding(true);
    await seedAllInitialDataToSupabase();
    localStorage.setItem('has_supabase_seeded_v2', 'true');
    await loadAllSupabaseData();
    setIsSeeding(false);
  };

  // Compute Fee Summaries dynamically
  const feeSummaries: FeeSummary[] = students.map((stu) => {
    const classStructure =
      feeStructures.find((f) => f.gradeClass === stu.gradeClass) || { totalFee: 950 };
    const totalFee = classStructure.totalFee || 950;

    const stuPayments = feePayments.filter(
      (p) => p.studentId === stu.studentId || p.studentName === stu.fullName
    );
    const totalPaid = stuPayments.reduce((acc, p) => acc + p.amountPaid, 0);
    const balance = Math.max(0, totalFee - totalPaid);

    let status: 'Paid' | 'Partial' | 'Unpaid' = 'Unpaid';
    if (totalPaid >= totalFee) status = 'Paid';
    else if (totalPaid > 0) status = 'Partial';

    const lastPaymentDate =
      stuPayments.length > 0 ? stuPayments[stuPayments.length - 1].paymentDate : undefined;

    return {
      studentId: stu.studentId,
      studentName: stu.fullName,
      gradeClass: stu.gradeClass,
      totalFee,
      totalPaid,
      balance,
      status,
      lastPaymentDate
    };
  });

  // Today Attendance Stats
  const todayStr = new Date().toISOString().split('T')[0];
  const todayRecords = attendanceRecords.filter((r) => r.date === todayStr);
  let presentToday = 0;
  let absentToday = 0;
  let totalMarked = 0;

  todayRecords.forEach((att) => {
    att.records.forEach((rec) => {
      totalMarked++;
      if (rec.status === 'Present') presentToday++;
      else if (rec.status === 'Absent') absentToday++;
    });
  });

  // Soft Delete & Trash System Handlers in Supabase
  const moveToTrash = async (
    originalCollection: string,
    originalId: string,
    entityType: string,
    title: string,
    subtitle: string,
    data: any
  ) => {
    await createTrashItem({
      originalCollection,
      originalId,
      entityType,
      title,
      subtitle,
      deletedBy: activeRole || 'Admin',
      data
    });

    if (originalCollection === 'students') await deleteStudentRecord(originalId);
    else if (originalCollection === 'teachers') await deleteTeacherRecord(originalId);
    else if (originalCollection === 'feePayments') await deleteFeePaymentRecord(originalId);
    else if (originalCollection === 'exams') await deleteExamRecord(originalId);
    else if (originalCollection === 'examResults') await deleteExamResultRecord(originalId);

    await loadAllSupabaseData();
  };

  const handleRestoreFromTrash = async (item: TrashItem) => {
    await restoreItemFromTrash(item);
    await loadAllSupabaseData();
  };

  const handleDeletePermanently = async (trashId: string) => {
    await deleteTrashItemPermanently(trashId);
    await loadAllSupabaseData();
  };

  const handleEmptyTrash = async () => {
    await emptyAllTrash();
    await loadAllSupabaseData();
  };

  // CRUD Handlers for Supabase
  const handleAddStudent = async (data: Omit<Student, 'id'>) => {
    await createStudent(data);
    await loadAllSupabaseData();
  };

  const handleUpdateStudent = async (id: string, updates: Partial<Student>) => {
    await updateStudentRecord(id, updates);
    await loadAllSupabaseData();
  };

  const handleDeleteStudent = async (student: Student) => {
    await moveToTrash(
      'students',
      student.id,
      'Student',
      student.fullName,
      `${student.studentId} • Class ${student.gradeClass}`,
      student
    );
  };

  const handleDeleteAllStudents = async () => {
    for (const student of students) {
      await handleDeleteStudent(student);
    }
  };

  const handleAddTeacher = async (data: Omit<Teacher, 'id'>) => {
    await createTeacher(data);
    await loadAllSupabaseData();
  };

  const handleUpdateTeacher = async (id: string, updates: Partial<Teacher>) => {
    await updateTeacherRecord(id, updates);
    await loadAllSupabaseData();
  };

  const handleDeleteTeacher = async (teacher: Teacher) => {
    await moveToTrash(
      'teachers',
      teacher.id,
      'Teacher',
      teacher.fullName,
      `${teacher.teacherId} • ${teacher.qualification}`,
      teacher
    );
  };

  const handleDeleteAllTeachers = async () => {
    for (const teacher of teachers) {
      await handleDeleteTeacher(teacher);
    }
  };

  const handleSaveAttendance = async (data: Omit<DailyAttendance, 'id'>) => {
    await saveAttendanceRecord(data);
    await loadAllSupabaseData();
  };

  const handleRecordPayment = async (data: Omit<FeePayment, 'id'>) => {
    await createFeePayment(data);
    await loadAllSupabaseData();
  };

  const handleDeletePayment = async (payment: FeePayment) => {
    await moveToTrash(
      'feePayments',
      payment.id,
      'Fee Payment',
      `Receipt #${payment.receiptNo}`,
      `${payment.studentName} • $${payment.amountPaid}`,
      payment
    );
  };

  const handleUpdateFeeStructure = async (fs: FeeStructure) => {
    await saveFeeStructure(fs);
    await loadAllSupabaseData();
  };

  const handleCreateExam = async (data: Omit<Exam, 'id'>) => {
    await createExamRecord(data);
    await loadAllSupabaseData();
  };

  const handleDeleteExam = async (exam: Exam) => {
    await moveToTrash(
      'exams',
      exam.id,
      'Exam',
      exam.title,
      `${exam.term} • ${exam.academicYear}`,
      exam
    );
  };

  const handleSaveResult = async (data: Omit<ExamResult, 'id'>) => {
    await saveExamResultRecord(data);
    await loadAllSupabaseData();
  };

  const handleDeleteExamResult = async (result: ExamResult) => {
    await moveToTrash(
      'examResults',
      result.id,
      'Exam Result',
      `Report Card: ${result.studentName}`,
      `${result.examTitle} • Grade: ${result.grade}`,
      result
    );
  };

  const handleSendNotification = async (data: Omit<NotificationLog, 'id'>) => {
    await createNotificationLog(data);
    await loadAllSupabaseData();
  };

  const canEditStudents = hasRole(['Admin']);
  const canEditTeachers = hasRole(['Admin']);
  const canEditFees = hasRole(['Admin', 'Accountant']);
  const canEditExams = hasRole(['Admin', 'Teacher']);

  return (
    <div className="min-h-screen bg-slate-100/70 font-sans text-slate-800 antialiased flex">
      {/* Sidebar Navigation */}
      <Sidebar
        activeTab={activeTab}
        setActiveTab={setActiveTab}
        isOpen={isMobileSidebarOpen}
        setIsOpen={setIsMobileSidebarOpen}
        onSeedData={handleSeedData}
        isSeeding={isSeeding}
      />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64">
        <Header
          activeTab={activeTab}
          onOpenMobileSidebar={() => setIsMobileSidebarOpen(true)}
          searchTerm={globalSearchTerm}
          setSearchTerm={setGlobalSearchTerm}
          unreadNotifsCount={notifications.length}
          onOpenNotifsTab={() => setActiveTab('notifications')}
          onOpenSupabaseModal={() => setIsSupabaseModalOpen(true)}
        />

        <main className="flex-1 p-4 lg:p-8 max-w-7xl w-full mx-auto">
          {activeTab === 'dashboard' && (
            <DashboardView
              students={students}
              teachers={teachers}
              payments={feePayments}
              feeSummaries={feeSummaries}
              exams={exams}
              todayAttendanceStats={{
                present: presentToday,
                absent: absentToday,
                total: totalMarked
              }}
              onNavigate={setActiveTab}
              onOpenAddStudentModal={() => setActiveTab('students')}
              onOpenAddPaymentModal={() => {
                setActiveTab('fees');
                setIsRecordPaymentModalOpen(true);
              }}
            />
          )}

          {activeTab === 'students' && (
            <StudentsModule
              students={students}
              feeSummaries={feeSummaries}
              payments={feePayments}
              examResults={examResults}
              onAddStudent={handleAddStudent}
              onUpdateStudent={handleUpdateStudent}
              onDeleteStudent={handleDeleteStudent}
              onDeleteAllStudents={handleDeleteAllStudents}
              canEdit={canEditStudents}
            />
          )}

          {activeTab === 'teachers' && (
            <TeachersModule
              teachers={teachers}
              onAddTeacher={handleAddTeacher}
              onUpdateTeacher={handleUpdateTeacher}
              onDeleteTeacher={handleDeleteTeacher}
              onDeleteAllTeachers={handleDeleteAllTeachers}
              canEdit={canEditTeachers}
            />
          )}

          {activeTab === 'attendance' && (
            <AttendanceModule
              students={students}
              attendanceRecords={attendanceRecords}
              onSaveAttendance={handleSaveAttendance}
              currentUserRole={activeRole}
            />
          )}

          {activeTab === 'fees' && (
            <FeesModule
              students={students}
              feeStructures={feeStructures}
              payments={feePayments}
              feeSummaries={feeSummaries}
              onRecordPayment={handleRecordPayment}
              onUpdateFeeStructure={handleUpdateFeeStructure}
              onDeletePayment={handleDeletePayment}
              canEdit={canEditFees}
              isRecordModalOpen={isRecordPaymentModalOpen}
              setIsRecordModalOpen={setIsRecordPaymentModalOpen}
            />
          )}

          {activeTab === 'exams' && (
            <ExamsModule
              students={students}
              exams={exams}
              examResults={examResults}
              onCreateExam={handleCreateExam}
              onSaveResult={handleSaveResult}
              onDeleteExam={handleDeleteExam}
              onDeleteExamResult={handleDeleteExamResult}
              canEdit={canEditExams}
            />
          )}

          {activeTab === 'notifications' && (
            <NotificationsModule
              students={students}
              notifications={notifications}
              onSendNotification={handleSendNotification}
              currentUserRole={activeRole}
            />
          )}

          {activeTab === 'users' && <UsersModule />}

          {activeTab === 'trash' && (
            <TrashModule
              trashItems={trashItems}
              onRestore={handleRestoreFromTrash}
              onDeletePermanently={handleDeletePermanently}
              onEmptyTrash={handleEmptyTrash}
              canManageTrash={hasRole(['Admin'])}
            />
          )}
        </main>
      </div>

      {/* Supabase Connection Modal */}
      <SupabaseConfigModal
        isOpen={isSupabaseModalOpen}
        onClose={() => setIsSupabaseModalOpen(false)}
        onReseedData={handleSeedData}
      />
    </div>
  );
}

export default function App() {
  return (
    <AuthProvider>
      <SchoolManagementApp />
    </AuthProvider>
  );
}
