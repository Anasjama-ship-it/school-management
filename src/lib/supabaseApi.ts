import { supabase, createUnpersistedSupabaseClient } from './supabase';
import { hashPassword } from './crypto';
import {
  Student,
  Teacher,
  DailyAttendance,
  FeeStructure,
  FeePayment,
  Exam,
  ExamResult,
  NotificationLog,
  UserProfile,
  TrashItem
} from '../types';
import {
  INITIAL_STUDENTS,
  INITIAL_TEACHERS,
  INITIAL_FEE_STRUCTURES,
  INITIAL_PAYMENTS,
  INITIAL_EXAMS,
  INITIAL_EXAM_RESULTS,
  INITIAL_NOTIFICATIONS
} from './seedData';

const DEFAULT_FEE_STRUCTURES: FeeStructure[] = INITIAL_FEE_STRUCTURES.map((fs, idx) => ({
  id: `fs-${idx + 1}`,
  ...fs
}));

// Local Cache Helpers for Seamless Persistence & Offline Resilience
export const getStorageCache = <T>(key: string, defaultVal: T): T => {
  if (typeof window === 'undefined') return defaultVal;
  try {
    const raw = localStorage.getItem(key);
    if (!raw) return defaultVal;
    return JSON.parse(raw);
  } catch {
    return defaultVal;
  }
};

export const setStorageCache = <T>(key: string, val: T): void => {
  if (typeof window === 'undefined') return;
  try {
    localStorage.setItem(key, JSON.stringify(val));
  } catch (err) {
    console.warn('Could not write storage cache:', err);
  }
};

// ==========================================
// 1. STUDENTS API
// ==========================================
export const fetchStudents = async (): Promise<Student[]> => {
  try {
    const { data, error } = await supabase
      .from('students')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      studentId: d.student_id,
      fullName: d.full_name,
      gradeClass: d.grade_class,
      rollNumber: d.roll_number || '',
      gender: d.gender || 'Other',
      dateOfBirth: d.date_of_birth || '',
      parentName: d.parent_name || '',
      parentPhone: d.parent_phone || '',
      parentEmail: d.parent_email || '',
      photoUrl: d.photo_url || '',
      address: d.address || '',
      status: d.status || 'Active',
      createdAt: d.created_at ? d.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    }));
  } catch (err) {
    console.warn('Using local state fallback for students:', err);
    return [];
  }
};

export const createStudent = async (student: Omit<Student, 'id'>): Promise<Student | null> => {
  try {
    const payload = {
      student_id: student.studentId,
      full_name: student.fullName,
      grade_class: student.gradeClass,
      roll_number: student.rollNumber,
      gender: student.gender,
      date_of_birth: student.dateOfBirth || null,
      parent_name: student.parentName,
      parent_phone: student.parentPhone,
      parent_email: student.parentEmail || null,
      photo_url: student.photoUrl || null,
      address: student.address || null,
      status: student.status
    };

    const { data, error } = await supabase
      .from('students')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      studentId: data.student_id,
      fullName: data.full_name,
      gradeClass: data.grade_class,
      rollNumber: data.roll_number,
      gender: data.gender,
      dateOfBirth: data.date_of_birth || '',
      parentName: data.parent_name,
      parentPhone: data.parent_phone,
      parentEmail: data.parent_email || '',
      photoUrl: data.photo_url || '',
      address: data.address || '',
      status: data.status,
      createdAt: data.created_at ? data.created_at.split('T')[0] : new Date().toISOString().split('T')[0]
    };
  } catch (err) {
    console.error('Error creating student in Supabase:', err);
    return null;
  }
};

export const updateStudentRecord = async (id: string, updates: Partial<Student>): Promise<boolean> => {
  try {
    const payload: any = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.gradeClass !== undefined) payload.grade_class = updates.gradeClass;
    if (updates.rollNumber !== undefined) payload.roll_number = updates.rollNumber;
    if (updates.gender !== undefined) payload.gender = updates.gender;
    if (updates.dateOfBirth !== undefined) payload.date_of_birth = updates.dateOfBirth;
    if (updates.parentName !== undefined) payload.parent_name = updates.parentName;
    if (updates.parentPhone !== undefined) payload.parent_phone = updates.parentPhone;
    if (updates.parentEmail !== undefined) payload.parent_email = updates.parentEmail;
    if (updates.photoUrl !== undefined) payload.photo_url = updates.photoUrl;
    if (updates.address !== undefined) payload.address = updates.address;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('students')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating student in Supabase:', err);
    return false;
  }
};

export const deleteStudentRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('students').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting student from Supabase:', err);
    return false;
  }
};

// ==========================================
// 2. TEACHERS API
// ==========================================
export const fetchTeachers = async (): Promise<Teacher[]> => {
  try {
    const { data, error } = await supabase
      .from('teachers')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      teacherId: d.teacher_id,
      fullName: d.full_name,
      email: d.email,
      phone: d.phone,
      username: d.username || '',
      subjects: d.subjects || [],
      assignedClasses: d.assigned_classes || [],
      qualification: d.qualification || '',
      joiningDate: d.joining_date || '',
      status: d.status || 'Active'
    }));
  } catch (err) {
    console.warn('Error fetching teachers from Supabase:', err);
    return [];
  }
};

export const createTeacher = async (teacher: Omit<Teacher, 'id'>): Promise<Teacher | null> => {
  try {
    const payload = {
      teacher_id: teacher.teacherId,
      full_name: teacher.fullName,
      email: teacher.email,
      phone: teacher.phone,
      username: teacher.username || null,
      subjects: teacher.subjects,
      assigned_classes: teacher.assignedClasses,
      qualification: teacher.qualification,
      joining_date: teacher.joiningDate || null,
      status: teacher.status
    };

    const { data, error } = await supabase
      .from('teachers')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      teacherId: data.teacher_id,
      fullName: data.full_name,
      email: data.email,
      phone: data.phone,
      username: data.username || '',
      subjects: data.subjects || [],
      assignedClasses: data.assigned_classes || [],
      qualification: data.qualification || '',
      joiningDate: data.joining_date || '',
      status: data.status
    };
  } catch (err) {
    console.error('Error creating teacher in Supabase:', err);
    return null;
  }
};

export const updateTeacherRecord = async (id: string, updates: Partial<Teacher>): Promise<boolean> => {
  try {
    const payload: any = {};
    if (updates.fullName !== undefined) payload.full_name = updates.fullName;
    if (updates.email !== undefined) payload.email = updates.email;
    if (updates.phone !== undefined) payload.phone = updates.phone;
    if (updates.username !== undefined) payload.username = updates.username;
    if (updates.subjects !== undefined) payload.subjects = updates.subjects;
    if (updates.assignedClasses !== undefined) payload.assigned_classes = updates.assignedClasses;
    if (updates.qualification !== undefined) payload.qualification = updates.qualification;
    if (updates.joiningDate !== undefined) payload.joining_date = updates.joiningDate;
    if (updates.status !== undefined) payload.status = updates.status;

    const { error } = await supabase
      .from('teachers')
      .update(payload)
      .eq('id', id);

    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error updating teacher in Supabase:', err);
    return false;
  }
};

export const deleteTeacherRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('teachers').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting teacher from Supabase:', err);
    return false;
  }
};

// ==========================================
// 3. ATTENDANCE API
// ==========================================
export const fetchAttendance = async (): Promise<DailyAttendance[]> => {
  try {
    const { data, error } = await supabase.from('attendance').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      date: d.date,
      gradeClass: d.grade_class,
      records: d.records || [],
      markedBy: d.marked_by || 'Teacher',
      updatedAt: d.updated_at || new Date().toISOString()
    }));
  } catch (err) {
    console.warn('Error fetching attendance from Supabase:', err);
    return [];
  }
};

export const saveAttendanceRecord = async (attendance: Omit<DailyAttendance, 'id'>): Promise<boolean> => {
  try {
    const docId = `${attendance.gradeClass.replace(/\s+/g, '')}_${attendance.date}`;
    const payload = {
      id: docId,
      date: attendance.date,
      grade_class: attendance.gradeClass,
      records: attendance.records,
      marked_by: attendance.markedBy || 'Teacher',
      updated_at: new Date().toISOString()
    };

    const { error } = await supabase.from('attendance').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving attendance in Supabase:', err);
    return false;
  }
};

// ==========================================
// 4. FEE STRUCTURES & PAYMENTS API
// ==========================================
export const fetchFeeStructures = async (): Promise<FeeStructure[]> => {
  try {
    const { data, error } = await supabase.from('fee_structures').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return DEFAULT_FEE_STRUCTURES;

    return data.map((d: any) => ({
      id: d.id,
      gradeClass: d.grade_class,
      tuitionFee: Number(d.tuition_fee) || 0,
      examFee: Number(d.exam_fee) || 0,
      transportFee: Number(d.transport_fee) || 0,
      libraryFee: Number(d.library_fee) || 0,
      otherFee: Number(d.other_fee) || 0,
      totalFee: Number(d.total_fee) || 0,
      term: d.term || 'Term 1'
    }));
  } catch (err) {
    console.warn('Error fetching fee structures from Supabase:', err);
    return DEFAULT_FEE_STRUCTURES;
  }
};

export const saveFeeStructure = async (fs: FeeStructure): Promise<boolean> => {
  try {
    const payload = {
      grade_class: fs.gradeClass,
      tuition_fee: fs.tuitionFee,
      exam_fee: fs.examFee,
      transport_fee: fs.transportFee,
      library_fee: fs.libraryFee,
      other_fee: fs.otherFee,
      total_fee: fs.totalFee,
      term: fs.term
    };

    if (fs.id) {
      const { error } = await supabase.from('fee_structures').update(payload).eq('id', fs.id);
      if (error) throw error;
    } else {
      const { error } = await supabase.from('fee_structures').insert([payload]);
      if (error) throw error;
    }
    return true;
  } catch (err) {
    console.error('Error saving fee structure in Supabase:', err);
    return false;
  }
};

export const fetchFeePayments = async (): Promise<FeePayment[]> => {
  try {
    const { data, error } = await supabase
      .from('fee_payments')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      receiptNo: d.receipt_no,
      studentId: d.student_id,
      studentName: d.student_name,
      gradeClass: d.grade_class,
      amountPaid: Number(d.amount_paid) || 0,
      paymentDate: d.payment_date,
      paymentMode: d.payment_mode || 'Cash',
      feeType: d.fee_type || 'Tuition Fee',
      transactionRef: d.transaction_ref || '',
      remarks: d.remarks || '',
      receivedBy: d.received_by || 'Accountant'
    }));
  } catch (err) {
    console.warn('Error fetching fee payments from Supabase:', err);
    return [];
  }
};

export const createFeePayment = async (payment: Omit<FeePayment, 'id'>): Promise<FeePayment | null> => {
  try {
    const payload = {
      receipt_no: payment.receiptNo,
      student_id: payment.studentId,
      student_name: payment.studentName,
      grade_class: payment.gradeClass,
      amount_paid: payment.amountPaid,
      payment_date: payment.paymentDate,
      payment_mode: payment.paymentMode,
      fee_type: payment.feeType,
      transaction_ref: payment.transactionRef || null,
      remarks: payment.remarks || null,
      received_by: payment.receivedBy || 'Accountant'
    };

    const { data, error } = await supabase
      .from('fee_payments')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      receiptNo: data.receipt_no,
      studentId: data.student_id,
      studentName: data.student_name,
      gradeClass: data.grade_class,
      amountPaid: Number(data.amount_paid) || 0,
      paymentDate: data.payment_date,
      paymentMode: data.payment_mode,
      feeType: data.fee_type,
      transactionRef: data.transaction_ref || '',
      remarks: data.remarks || '',
      receivedBy: data.received_by || ''
    };
  } catch (err) {
    console.error('Error creating fee payment in Supabase:', err);
    return null;
  }
};

export const deleteFeePaymentRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('fee_payments').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting fee payment from Supabase:', err);
    return false;
  }
};

// ==========================================
// 5. EXAMS & RESULTS API
// ==========================================
export const fetchExams = async (): Promise<Exam[]> => {
  try {
    const { data, error } = await supabase
      .from('exams')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      title: d.title,
      term: d.term,
      academicYear: d.academic_year,
      startDate: d.start_date || '',
      endDate: d.end_date || '',
      gradeClasses: d.grade_classes || [],
      subjects: d.subjects || [],
      status: d.status || 'Upcoming'
    }));
  } catch (err) {
    console.warn('Error fetching exams from Supabase:', err);
    return [];
  }
};

export const createExamRecord = async (exam: Omit<Exam, 'id'>): Promise<Exam | null> => {
  try {
    const payload = {
      title: exam.title,
      term: exam.term,
      academic_year: exam.academicYear,
      start_date: exam.startDate || null,
      end_date: exam.endDate || null,
      grade_classes: exam.gradeClasses,
      subjects: exam.subjects,
      status: exam.status
    };

    const { data, error } = await supabase.from('exams').insert([payload]).select().single();
    if (error) throw error;
    return {
      id: data.id,
      title: data.title,
      term: data.term,
      academicYear: data.academic_year,
      startDate: data.start_date || '',
      endDate: data.end_date || '',
      gradeClasses: data.grade_classes || [],
      subjects: data.subjects || [],
      status: data.status
    };
  } catch (err) {
    console.error('Error creating exam in Supabase:', err);
    return null;
  }
};

export const deleteExamRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('exams').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting exam from Supabase:', err);
    return false;
  }
};

export const fetchExamResults = async (): Promise<ExamResult[]> => {
  try {
    const { data, error } = await supabase.from('exam_results').select('*');
    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      examId: d.exam_id,
      examTitle: d.exam_title || '',
      studentId: d.student_id,
      studentName: d.student_name || '',
      gradeClass: d.grade_class,
      subjectMarks: d.subject_marks || {},
      totalMarks: Number(d.total_marks) || 0,
      maxPossible: Number(d.max_possible) || 0,
      average: Number(d.average) || 0,
      grade: d.grade || 'F',
      position: d.position || undefined,
      resultStatus: d.result_status || 'Pass',
      teacherRemarks: d.teacher_remarks || ''
    }));
  } catch (err) {
    console.warn('Error fetching exam results from Supabase:', err);
    return [];
  }
};

export const saveExamResultRecord = async (result: Omit<ExamResult, 'id'>): Promise<boolean> => {
  try {
    const docId = `${result.examId}_${result.studentId}`;
    const payload = {
      id: docId,
      exam_id: result.examId,
      exam_title: result.examTitle || null,
      student_id: result.studentId,
      student_name: result.studentName || null,
      grade_class: result.gradeClass,
      subject_marks: result.subjectMarks,
      total_marks: result.totalMarks,
      max_possible: result.maxPossible,
      average: result.average,
      grade: result.grade,
      position: result.position || null,
      result_status: result.resultStatus,
      teacher_remarks: result.teacherRemarks || null
    };

    const { error } = await supabase.from('exam_results').upsert(payload, { onConflict: 'id' });
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error saving exam result in Supabase:', err);
    return false;
  }
};

export const deleteExamResultRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('exam_results').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting exam result from Supabase:', err);
    return false;
  }
};

// ==========================================
// 6. NOTIFICATIONS API
// ==========================================
export const fetchNotifications = async (): Promise<NotificationLog[]> => {
  try {
    const { data, error } = await supabase
      .from('parent_notifications')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      id: d.id,
      studentId: d.student_id || '',
      studentName: d.student_name || '',
      parentPhone: d.parent_phone,
      channel: d.channel || 'SMS',
      type: d.type || 'Announcement',
      message: d.message,
      sentAt: d.sent_at || new Date().toISOString(),
      status: d.status || 'Delivered',
      sentBy: d.sent_by || 'Admin'
    }));
  } catch (err) {
    console.warn('Error fetching notifications from Supabase:', err);
    return [];
  }
};

export const createNotificationLog = async (log: Omit<NotificationLog, 'id'>): Promise<NotificationLog | null> => {
  try {
    const payload = {
      student_id: log.studentId || null,
      student_name: log.studentName || null,
      parent_phone: log.parentPhone,
      channel: log.channel,
      type: log.type,
      message: log.message,
      sent_at: log.sentAt || new Date().toISOString(),
      status: log.status || 'Delivered',
      sent_by: log.sentBy || 'Admin'
    };

    const { data, error } = await supabase
      .from('parent_notifications')
      .insert([payload])
      .select()
      .single();

    if (error) throw error;
    return {
      id: data.id,
      studentId: data.student_id || '',
      studentName: data.student_name || '',
      parentPhone: data.parent_phone,
      channel: data.channel,
      type: data.type,
      message: data.message,
      sentAt: data.sent_at,
      status: data.status,
      sentBy: data.sent_by
    };
  } catch (err) {
    console.error('Error creating notification log in Supabase:', err);
    return null;
  }
};

export const deleteNotificationLogRecord = async (id: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('parent_notifications').delete().eq('id', id);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting notification log from Supabase:', err);
    return false;
  }
};

// ==========================================
// 7. TRASH / RECYCLE BIN API
// ==========================================
export const fetchTrashItems = async (): Promise<TrashItem[]> => {
  try {
    const { data, error } = await supabase
      .from('trash_items')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) {
      return getStorageCache<TrashItem[]>('supabase_trash_items_cache', []);
    }

    const items = data.map((d: any) => ({
      id: d.id,
      originalCollection: d.original_collection,
      originalId: d.original_id,
      entityType: d.entity_type,
      title: d.title,
      subtitle: d.subtitle || '',
      deletedAt: d.deleted_at || new Date().toLocaleString(),
      deletedBy: d.deleted_by || 'Admin',
      data: d.data
    }));

    setStorageCache('supabase_trash_items_cache', items);
    return items;
  } catch (err) {
    console.warn('Using local fallback for trash items:', err);
    return getStorageCache<TrashItem[]>('supabase_trash_items_cache', []);
  }
};

export const createTrashItem = async (item: {
  originalCollection: string;
  originalId: string;
  entityType: string;
  title: string;
  subtitle?: string;
  deletedBy: string;
  data: any;
}): Promise<TrashItem | null> => {
  const localId = `trsh-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
  const trashObj: TrashItem = {
    id: localId,
    originalCollection: item.originalCollection,
    originalId: item.originalId,
    entityType: item.entityType,
    title: item.title,
    subtitle: item.subtitle || '',
    deletedAt: new Date().toLocaleString(),
    deletedBy: item.deletedBy || 'Admin',
    data: item.data
  };

  try {
    // Keep local cache up to date
    const currentTrash = getStorageCache<TrashItem[]>('supabase_trash_items_cache', []);
    setStorageCache('supabase_trash_items_cache', [trashObj, ...currentTrash.filter((t) => t.id !== localId)]);

    const payload = {
      original_collection: item.originalCollection,
      original_id: item.originalId,
      entity_type: item.entityType,
      title: item.title,
      subtitle: item.subtitle || null,
      deleted_by: item.deletedBy || 'Admin',
      data: item.data
    };

    const { data, error } = await supabase
      .from('trash_items')
      .insert([payload])
      .select()
      .single();

    if (error) {
      console.warn('Supabase create trash item note:', error.message);
      return trashObj;
    }

    if (data) {
      trashObj.id = data.id;
      const updatedTrash = getStorageCache<TrashItem[]>('supabase_trash_items_cache', []).map(
        (t) => (t.id === localId ? { ...t, id: data.id } : t)
      );
      setStorageCache('supabase_trash_items_cache', updatedTrash);
    }
    return trashObj;
  } catch (err) {
    console.warn('Using local trash item fallback:', err);
    return trashObj;
  }
};

export const restoreItemFromTrash = async (item: TrashItem): Promise<boolean> => {
  try {
    // 1. Restore to original entity table in Supabase
    if (item.originalCollection === 'students') {
      await createStudent(item.data);
    } else if (item.originalCollection === 'teachers') {
      await createTeacher(item.data);
      if (item.data.teacherId || item.data.email) {
        await reactivateUserAccountByTeacherId(item.data.teacherId, item.data.email);
      }
    } else if (item.originalCollection === 'feePayments' || item.originalCollection === 'fee_payments') {
      await createFeePayment(item.data);
    } else if (item.originalCollection === 'exams') {
      await createExamRecord(item.data);
    } else if (item.originalCollection === 'examResults' || item.originalCollection === 'exam_results') {
      await saveExamResultRecord(item.data);
    } else if (item.originalCollection === 'parent_notifications' || item.originalCollection === 'notifications') {
      await createNotificationLog(item.data);
    } else if (item.originalCollection === 'users') {
      await createUserAccount(item.data);
    }

    // 2. Remove from trash table in Supabase
    try {
      await supabase.from('trash_items').delete().eq('id', item.id);
    } catch (e) {
      console.warn('Supabase delete trash item note:', e);
    }

    // 3. Update local cache
    const currentTrash = getStorageCache<TrashItem[]>('supabase_trash_items_cache', []);
    setStorageCache('supabase_trash_items_cache', currentTrash.filter((t) => t.id !== item.id));

    return true;
  } catch (err) {
    console.error('Error restoring item from trash in Supabase:', err);
    return false;
  }
};

export const deleteTrashItemPermanently = async (trashId: string): Promise<boolean> => {
  try {
    // 1. Remove from local cache
    const currentTrash = getStorageCache<TrashItem[]>('supabase_trash_items_cache', []);
    setStorageCache('supabase_trash_items_cache', currentTrash.filter((t) => t.id !== trashId));

    // 2. Delete from Supabase
    const { error } = await supabase.from('trash_items').delete().eq('id', trashId);
    if (error) {
      console.warn('Supabase permanent delete trash notice:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error permanently deleting trash item from Supabase:', err);
    return false;
  }
};

export const emptyAllTrash = async (): Promise<boolean> => {
  try {
    // 1. Clear local cache
    setStorageCache('supabase_trash_items_cache', []);

    // 2. Clear all from Supabase
    const { error } = await supabase.from('trash_items').delete().neq('id', '00000000-0000-0000-0000-000000000000');
    if (error) {
      console.warn('Supabase empty trash notice:', error.message);
    }
    return true;
  } catch (err) {
    console.error('Error emptying trash in Supabase:', err);
    return false;
  }
};

// ==========================================
// 8. SEED DATA TO SUPABASE UTILITY
// ==========================================
export const seedAllInitialDataToSupabase = async (): Promise<boolean> => {
  try {
    console.log('Seeding initial school data to Supabase...');

    // 1. Seed Students
    for (const stu of INITIAL_STUDENTS) {
      await createStudent(stu);
    }

    // 2. Seed Teachers
    for (const tch of INITIAL_TEACHERS) {
      await createTeacher(tch);
    }

    // 3. Seed Fee Structures
    for (const fs of DEFAULT_FEE_STRUCTURES) {
      await saveFeeStructure(fs);
    }

    // 4. Seed Fee Payments
    for (const fp of INITIAL_PAYMENTS) {
      await createFeePayment(fp);
    }

    // 5. Seed Exams
    for (const ex of INITIAL_EXAMS) {
      await createExamRecord(ex);
    }

    // 6. Seed Exam Results
    for (const er of INITIAL_EXAM_RESULTS) {
      await saveExamResultRecord(er);
    }

    // 7. Seed Notifications
    for (const notif of INITIAL_NOTIFICATIONS) {
      await createNotificationLog(notif);
    }

    console.log('Supabase seeding completed successfully.');
    return true;
  } catch (err) {
    console.error('Error seeding data to Supabase:', err);
    return false;
  }
};

// ==========================================
// 9. USERS & ROLES ACCOUNT MANAGEMENT API
// ==========================================
export const fetchUserProfiles = async (): Promise<UserProfile[]> => {
  try {
    const { data, error } = await supabase
      .from('users')
      .select('*')
      .order('created_at', { ascending: false });

    if (error) throw error;
    if (!data || data.length === 0) return [];

    return data.map((d: any) => ({
      uid: d.uid || d.id,
      email: d.email,
      displayName: d.display_name,
      username: d.username || '',
      teacherId: d.teacher_id || '',
      role: d.role as any,
      status: d.status || 'Active',
      passwordHash: d.password_hash || d.passwordHash || ''
    }));
  } catch (err) {
    console.warn('Error fetching user profiles from Supabase:', err);
    return [];
  }
};

export const createUserAccount = async (params: {
  displayName: string;
  email: string;
  username: string;
  password?: string;
  role: 'Admin' | 'Teacher' | 'Accountant';
  teacherId?: string;
}): Promise<UserProfile | null> => {
  try {
    const cleanEmail = params.email.trim().toLowerCase();
    const cleanUsername = params.username.trim().toLowerCase();
    const password = params.password || 'TeacherPass123!';
    const hashedPassword = await hashPassword(password);

    let createdUid = `usr-${Date.now()}`;

    // 1. Register with Supabase Authentication using unpersisted client so Admin session is retained
    try {
      const tempAuthClient = createUnpersistedSupabaseClient();
      const { data: authData, error: authErr } = await tempAuthClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            displayName: params.displayName,
            username: cleanUsername,
            role: params.role
          }
        }
      });

      if (authData?.user) {
        createdUid = authData.user.id;
      } else if (authErr) {
        console.warn('Supabase Auth signUp notice:', authErr.message);
      }
    } catch (authException) {
      console.warn('Auth registration notice:', authException);
    }

    // 2. Upsert profile in Supabase public.users table with password_hash
    const payload: any = {
      uid: createdUid,
      email: cleanEmail,
      username: cleanUsername,
      display_name: params.displayName,
      role: params.role,
      status: 'Active',
      teacher_id: params.teacherId || null,
      password_hash: hashedPassword
    };

    const { data: userRow, error: userErr } = await supabase
      .from('users')
      .upsert([payload], { onConflict: 'email' })
      .select()
      .single();

    if (userErr) {
      // If table doesn't have password_hash column, retry without it
      const fallbackPayload = {
        uid: createdUid,
        email: cleanEmail,
        username: cleanUsername,
        display_name: params.displayName,
        role: params.role,
        status: 'Active',
        teacher_id: params.teacherId || null
      };
      const { data: fallbackRow, error: fbErr } = await supabase
        .from('users')
        .upsert([fallbackPayload], { onConflict: 'email' })
        .select()
        .single();
      if (fbErr) throw fbErr;
      return {
        uid: fallbackRow.uid || fallbackRow.id,
        email: fallbackRow.email,
        displayName: fallbackRow.display_name,
        username: fallbackRow.username,
        teacherId: fallbackRow.teacher_id,
        role: fallbackRow.role,
        status: fallbackRow.status,
        passwordHash: hashedPassword
      };
    }

    // 3. If linked to a teacher, sync teacher record with username
    if (params.teacherId) {
      await supabase
        .from('teachers')
        .update({ username: cleanUsername, status: 'Active' })
        .eq('teacher_id', params.teacherId);
    }

    return {
      uid: userRow.uid || userRow.id,
      email: userRow.email,
      displayName: userRow.display_name,
      username: userRow.username,
      teacherId: userRow.teacher_id,
      role: userRow.role,
      status: userRow.status,
      passwordHash: hashedPassword
    };
  } catch (err) {
    console.error('Error creating user account in Supabase:', err);
    throw err;
  }
};

export const updateUserAccount = async (
  uid: string,
  updates: {
    username?: string;
    displayName?: string;
    role?: 'Admin' | 'Teacher' | 'Accountant';
    status?: 'Active' | 'Inactive';
    password?: string;
  }
): Promise<boolean> => {
  try {
    const payload: any = {};
    if (updates.username !== undefined) payload.username = updates.username.trim().toLowerCase();
    if (updates.displayName !== undefined) payload.display_name = updates.displayName;
    if (updates.role !== undefined) payload.role = updates.role;
    if (updates.status !== undefined) payload.status = updates.status;
    if (updates.password !== undefined && updates.password.trim().length > 0) {
      payload.password_hash = await hashPassword(updates.password.trim());
    }

    const { data: updatedUser, error } = await supabase
      .from('users')
      .update(payload)
      .or(`uid.eq.${uid},id.eq.${uid}`)
      .select('teacher_id, email, username, status')
      .maybeSingle();

    if (error) {
      // If error was due to unknown column password_hash, remove it and retry
      delete payload.password_hash;
      const { error: retryErr } = await supabase
        .from('users')
        .update(payload)
        .or(`uid.eq.${uid},id.eq.${uid}`);
      if (retryErr) throw retryErr;
    }

    // If updated user is linked to a teacher record, keep teacher record updated too
    if (updatedUser?.teacher_id) {
      const teacherUpdates: any = {};
      if (updates.username !== undefined) teacherUpdates.username = updates.username.trim().toLowerCase();
      if (updates.status !== undefined) teacherUpdates.status = updates.status === 'Active' ? 'Active' : 'Resigned';

      if (Object.keys(teacherUpdates).length > 0) {
        await supabase
          .from('teachers')
          .update(teacherUpdates)
          .eq('teacher_id', updatedUser.teacher_id);
      }
    }

    return true;
  } catch (err) {
    console.error('Error updating user account in Supabase:', err);
    return false;
  }
};

export const saveTeacherAccountInSupabase = async (params: {
  teacherId: string;
  teacherName: string;
  email: string;
  username: string;
  password?: string;
  status: 'Active' | 'Inactive';
}): Promise<{ success: boolean; userProfile?: UserProfile; error?: string }> => {
  try {
    const cleanUsername = params.username.trim().toLowerCase();
    const cleanEmail = (params.email || `${cleanUsername}@school.edu`).trim().toLowerCase();
    const password = params.password || 'TeacherPass123!';
    const hashedPassword = await hashPassword(password);

    // 1. Try to register with Supabase Auth
    try {
      const tempAuthClient = createUnpersistedSupabaseClient();
      await tempAuthClient.auth.signUp({
        email: cleanEmail,
        password: password,
        options: {
          data: {
            displayName: params.teacherName,
            username: cleanUsername,
            role: 'Teacher',
            teacherId: params.teacherId
          }
        }
      });
    } catch (authErr) {
      console.warn('Teacher Supabase Auth note:', authErr);
    }

    // 2. Upsert in public.users table
    const userPayload: any = {
      uid: `usr-${params.teacherId}`,
      email: cleanEmail,
      username: cleanUsername,
      display_name: params.teacherName,
      role: 'Teacher',
      status: params.status,
      teacher_id: params.teacherId,
      password_hash: hashedPassword
    };

    let userRow: any = null;
    const { data, error: userErr } = await supabase
      .from('users')
      .upsert([userPayload], { onConflict: 'email' })
      .select()
      .maybeSingle();

    if (userErr) {
      // Fallback without password_hash if column does not exist
      delete userPayload.password_hash;
      const { data: fbData, error: fbErr } = await supabase
        .from('users')
        .upsert([userPayload], { onConflict: 'email' })
        .select()
        .maybeSingle();
      if (fbErr) throw fbErr;
      userRow = fbData;
    } else {
      userRow = data;
    }

    // 3. Update teacher record in teachers table
    await supabase
      .from('teachers')
      .update({
        username: cleanUsername,
        status: params.status === 'Active' ? 'Active' : 'Resigned'
      })
      .eq('teacher_id', params.teacherId);

    return {
      success: true,
      userProfile: {
        uid: userRow?.uid || `usr-${params.teacherId}`,
        email: cleanEmail,
        displayName: params.teacherName,
        username: cleanUsername,
        teacherId: params.teacherId,
        role: 'Teacher',
        status: params.status,
        passwordHash: hashedPassword
      }
    };
  } catch (err: any) {
    console.error('Error saving teacher account in Supabase:', err);
    return { success: false, error: err?.message || 'Failed to save teacher account' };
  }
};

export const resetUserPassword = async (email: string, newPassword?: string): Promise<{ success: boolean; message: string }> => {
  try {
    const cleanEmail = email.trim().toLowerCase();

    // If a new password is provided, update password hash in users table
    if (newPassword && newPassword.trim().length > 0) {
      const hashedPassword = await hashPassword(newPassword.trim());
      try {
        await supabase
          .from('users')
          .update({ password_hash: hashedPassword })
          .eq('email', cleanEmail);
      } catch (dbErr) {
        console.warn('DB update password hash note:', dbErr);
      }
    }

    // Trigger Supabase auth password reset email or update
    const { error } = await supabase.auth.resetPasswordForEmail(cleanEmail, {
      redirectTo: `${window.location.origin}/reset-password`
    });

    if (error) {
      // Even if email dispatch fails, local hashed password was updated
      return { success: true, message: `Password updated successfully for ${cleanEmail}.` };
    }

    return {
      success: true,
      message: `Password updated and reset email dispatched to ${cleanEmail}.`
    };
  } catch (err: any) {
    return { success: false, message: err?.message || 'Failed to reset password.' };
  }
};

export const deactivateUserAccountByTeacherId = async (teacherId: string, email?: string): Promise<boolean> => {
  try {
    let query = supabase.from('users').update({ status: 'Inactive' });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    }

    const { error } = await query;
    if (error) throw error;

    if (teacherId) {
      await supabase
        .from('teachers')
        .update({ status: 'Resigned' })
        .eq('teacher_id', teacherId);
    }

    return true;
  } catch (err) {
    console.error('Error deactivating teacher user account:', err);
    return false;
  }
};

export const reactivateUserAccountByTeacherId = async (teacherId: string, email?: string): Promise<boolean> => {
  try {
    let query = supabase.from('users').update({ status: 'Active' });

    if (teacherId) {
      query = query.eq('teacher_id', teacherId);
    } else if (email) {
      query = query.eq('email', email.trim().toLowerCase());
    }

    const { error } = await query;
    if (error) console.warn('Supabase reactivate user account warning:', error);

    if (teacherId) {
      await supabase
        .from('teachers')
        .update({ status: 'Active' })
        .eq('teacher_id', teacherId);
    }

    return true;
  } catch (err) {
    console.error('Error reactivating teacher user account:', err);
    return false;
  }
};

export const deleteUserAccountRecord = async (uid: string): Promise<boolean> => {
  try {
    const { error } = await supabase.from('users').delete().or(`uid.eq.${uid},id.eq.${uid}`);
    if (error) throw error;
    return true;
  } catch (err) {
    console.error('Error deleting user account from Supabase:', err);
    return false;
  }
};
