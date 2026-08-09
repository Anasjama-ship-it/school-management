import React, { useState } from 'react';
import {
  Plus,
  Search,
  Filter,
  User,
  Phone,
  Mail,
  Edit2,
  Trash2,
  Eye,
  X,
  CreditCard,
  FileSpreadsheet,
  CalendarCheck,
  CheckCircle2,
  XCircle,
  FileText,
  Download,
  DownloadCloud,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';
import { Student, StudentStatus, FeeSummary, FeePayment, ExamResult } from '../../types';
import { INITIAL_CLASSES } from '../../lib/seedData';
import { generateReportCardPDF, generatePaymentReceiptPDF, exportToExcel } from '../../lib/exportUtils';

interface StudentsModuleProps {
  students: Student[];
  feeSummaries: FeeSummary[];
  payments: FeePayment[];
  examResults: ExamResult[];
  onAddStudent: (student: Omit<Student, 'id'>) => Promise<void>;
  onUpdateStudent: (id: string, updates: Partial<Student>) => Promise<void>;
  onDeleteStudent: (student: Student) => Promise<void>;
  onDeleteAllStudents?: () => Promise<void>;
  canEdit: boolean;
}

export const StudentsModule: React.FC<StudentsModuleProps> = ({
  students,
  feeSummaries,
  payments,
  examResults,
  onAddStudent,
  onUpdateStudent,
  onDeleteStudent,
  onDeleteAllStudents,
  canEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedClass, setSelectedClass] = useState('All');
  const [selectedStatus, setSelectedStatus] = useState('All');

  // Modal States
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [editingStudent, setEditingStudent] = useState<Student | null>(null);
  const [profileStudent, setProfileStudent] = useState<Student | null>(null);
  const [profileTab, setProfileTab] = useState<'overview' | 'fees' | 'attendance' | 'exams'>('overview');
  const [isRemoveAllModalOpen, setIsRemoveAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleConfirmRemoveAll = async () => {
    if (!onDeleteAllStudents) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllStudents();
      setIsRemoveAllModalOpen(false);
      setSuccessMessage('All students were moved to Trash successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to remove all students:', err);
      alert('Failed to remove all students. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteSingleStudent = async (student: Student) => {
    try {
      await onDeleteStudent(student);
      setSuccessMessage(`Student "${student.fullName}" was moved to Trash successfully.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to delete student:', err);
      alert('Failed to delete student.');
    }
  };

  // Form state
  const [formData, setFormData] = useState<Omit<Student, 'id'>>({
    studentId: `STU-2026-0${Math.floor(100 + Math.random() * 900)}`,
    fullName: '',
    gradeClass: 'Grade 10A',
    rollNumber: '',
    gender: 'Male',
    dateOfBirth: '2010-01-01',
    parentName: '',
    parentPhone: '',
    parentEmail: '',
    photoUrl: '',
    address: '',
    status: 'Active',
    createdAt: new Date().toISOString().split('T')[0]
  });

  const filteredStudents = students.filter((s) => {
    const matchesSearch =
      s.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.studentId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      s.parentPhone.includes(searchTerm);
    const matchesClass = selectedClass === 'All' || s.gradeClass === selectedClass;
    const matchesStatus = selectedStatus === 'All' || s.status === selectedStatus;

    return matchesSearch && matchesClass && matchesStatus;
  });

  const handleOpenAddModal = () => {
    setFormData({
      studentId: `STU-2026-${Math.floor(100 + Math.random() * 900)}`,
      fullName: '',
      gradeClass: 'Grade 10A',
      rollNumber: String(students.length + 101),
      gender: 'Male',
      dateOfBirth: '2010-05-15',
      parentName: '',
      parentPhone: '',
      parentEmail: '',
      photoUrl: `https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=200`,
      address: '',
      status: 'Active',
      createdAt: new Date().toISOString().split('T')[0]
    });
    setEditingStudent(null);
    setIsAddModalOpen(true);
  };

  const handleOpenEditModal = (s: Student) => {
    setEditingStudent(s);
    setFormData({
      studentId: s.studentId,
      fullName: s.fullName,
      gradeClass: s.gradeClass,
      rollNumber: s.rollNumber,
      gender: s.gender,
      dateOfBirth: s.dateOfBirth,
      parentName: s.parentName,
      parentPhone: s.parentPhone,
      parentEmail: s.parentEmail || '',
      photoUrl: s.photoUrl || '',
      address: s.address || '',
      status: s.status,
      createdAt: s.createdAt
    });
    setIsAddModalOpen(true);
  };

  const handleSubmitForm = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.parentName || !formData.parentPhone) {
      alert('Please fill in required fields: Student Name, Parent Name, and Parent Phone.');
      return;
    }

    if (editingStudent) {
      await onUpdateStudent(editingStudent.id, formData);
    } else {
      await onAddStudent(formData);
    }
    setIsAddModalOpen(false);
  };

  const handleExportExcel = () => {
    const exportData = filteredStudents.map((s) => ({
      'Student ID': s.studentId,
      'Full Name': s.fullName,
      Class: s.gradeClass,
      'Roll No': s.rollNumber,
      Gender: s.gender,
      DOB: s.dateOfBirth,
      'Parent Name': s.parentName,
      'Parent Phone': s.parentPhone,
      Email: s.parentEmail || 'N/A',
      Status: s.status
    }));
    exportToExcel(exportData, 'Students_List_Springfield');
  };

  return (
    <div className="space-y-6">
      {/* Success Notification Banner */}
      {successMessage && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-2xl p-4 flex items-center justify-between text-emerald-800 text-xs font-semibold shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{successMessage}</span>
          </div>
          <button onClick={() => setSuccessMessage(null)} className="text-emerald-600 hover:text-emerald-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Header Controls */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="flex flex-wrap items-center gap-3 flex-1">
          {/* Search Box */}
          <div className="relative flex-1 min-w-[220px]">
            <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
            <input
              type="text"
              placeholder="Search by student name, ID or parent phone..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
            />
          </div>

          {/* Class Filter */}
          <div className="flex items-center space-x-2">
            <Filter className="w-4 h-4 text-slate-400 hidden sm:block" />
            <select
              value={selectedClass}
              onChange={(e) => setSelectedClass(e.target.value)}
              className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
            >
              <option value="All">All Classes</option>
              {INITIAL_CLASSES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            <option value="All">All Statuses</option>
            <option value="Active">Active</option>
            <option value="Inactive">Inactive</option>
            <option value="Graduated">Graduated</option>
          </select>
        </div>

        <div className="flex items-center space-x-2">
          <button
            onClick={handleExportExcel}
            className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 font-medium text-xs transition-colors"
          >
            <DownloadCloud className="w-4 h-4 text-slate-500" />
            <span>Export Excel</span>
          </button>

          {canEdit && (
            <>
              {students.length > 0 && onDeleteAllStudents && (
                <button
                  id="remove-all-students-btn"
                  onClick={() => setIsRemoveAllModalOpen(true)}
                  className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all active:scale-95"
                  title="Remove all students to Trash"
                >
                  <Trash2 className="w-4 h-4 text-rose-600" />
                  <span>Remove All</span>
                </button>
              )}

              <button
                id="add-new-student-btn"
                onClick={handleOpenAddModal}
                className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
              >
                <Plus className="w-4 h-4" />
                <span>Add Student</span>
              </button>
            </>
          )}
        </div>
      </div>

      {/* Student Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200/80">
              <tr>
                <th className="py-3.5 px-4">Student</th>
                <th className="py-3.5 px-4">Class & Roll</th>
                <th className="py-3.5 px-4">Parent Details</th>
                <th className="py-3.5 px-4">Phone</th>
                <th className="py-3.5 px-4">Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {filteredStudents.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 italic">
                    No students match the selected filters.
                  </td>
                </tr>
              ) : (
                filteredStudents.map((student) => (
                  <tr key={student.id} className="hover:bg-slate-50/80 transition-colors">
                    <td className="py-3 px-4">
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            student.photoUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                          }
                          alt={student.fullName}
                          className="w-10 h-10 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-sm">{student.fullName}</div>
                          <div className="text-[11px] text-slate-400 font-mono">
                            {student.studentId}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-semibold text-slate-800">{student.gradeClass}</div>
                      <div className="text-[11px] text-slate-400">Roll No: #{student.rollNumber}</div>
                    </td>

                    <td className="py-3 px-4">
                      <div className="font-medium text-slate-800">{student.parentName}</div>
                      <div className="text-[11px] text-slate-400">{student.parentEmail || 'No email'}</div>
                    </td>

                    <td className="py-3 px-4 font-mono text-slate-600">{student.parentPhone}</td>

                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                          student.status === 'Active'
                            ? 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                            : student.status === 'Inactive'
                            ? 'bg-rose-100 text-rose-800 border border-rose-200'
                            : 'bg-blue-100 text-blue-800 border border-blue-200'
                        }`}
                      >
                        {student.status}
                      </span>
                    </td>

                    <td className="py-3 px-4 text-right">
                      <div className="inline-flex items-center space-x-1">
                        <button
                          id={`view-student-profile-${student.id}`}
                          onClick={() => {
                            setProfileStudent(student);
                            setProfileTab('overview');
                          }}
                          className="p-1.5 rounded-lg text-slate-500 hover:text-blue-600 hover:bg-blue-50 transition-colors"
                          title="View Profile"
                        >
                          <Eye className="w-4 h-4" />
                        </button>

                        {canEdit && (
                          <>
                            <button
                              id={`edit-student-${student.id}`}
                              onClick={() => handleOpenEditModal(student)}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-indigo-600 hover:bg-indigo-50 transition-colors"
                              title="Edit Student"
                            >
                              <Edit2 className="w-4 h-4" />
                            </button>

                            <button
                              id={`delete-student-${student.id}`}
                              onClick={() => {
                                if (
                                  confirm(
                                    `Are you sure you want to delete ${student.fullName} (${student.studentId})? This record will be moved to Trash.`
                                  )
                                ) {
                                  handleDeleteSingleStudent(student);
                                }
                              }}
                              className="p-1.5 rounded-lg text-slate-500 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                              title="Delete Student"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add / Edit Student Modal */}
      {isAddModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingStudent ? 'Edit Student Details' : 'Add New Student'}
              </h3>
              <button
                onClick={() => setIsAddModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmitForm} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Student ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.studentId}
                    onChange={(e) => setFormData({ ...formData, studentId: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Full Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Alex Johnson"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Assigned Class <span className="text-rose-500">*</span>
                  </label>
                  <select
                    value={formData.gradeClass}
                    onChange={(e) => setFormData({ ...formData, gradeClass: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    {INITIAL_CLASSES.map((c) => (
                      <option key={c} value={c}>
                        {c}
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Roll Number
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. 101"
                    value={formData.rollNumber}
                    onChange={(e) => setFormData({ ...formData, rollNumber: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Gender</label>
                  <select
                    value={formData.gender}
                    onChange={(e) => setFormData({ ...formData, gender: e.target.value as any })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Male">Male</option>
                    <option value="Female">Female</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Date of Birth
                  </label>
                  <input
                    type="date"
                    value={formData.dateOfBirth}
                    onChange={(e) => setFormData({ ...formData, dateOfBirth: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent / Guardian Name <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. Robert Johnson"
                    value={formData.parentName}
                    onChange={(e) => setFormData({ ...formData, parentName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="e.g. +1 (555) 234-5678"
                    value={formData.parentPhone}
                    onChange={(e) => setFormData({ ...formData, parentPhone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Parent Email
                  </label>
                  <input
                    type="email"
                    placeholder="e.g. parent@example.com"
                    value={formData.parentEmail}
                    onChange={(e) => setFormData({ ...formData, parentEmail: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div className="sm:col-span-2">
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Photo URL (Optional)
                  </label>
                  <input
                    type="url"
                    placeholder="https://..."
                    value={formData.photoUrl}
                    onChange={(e) => setFormData({ ...formData, photoUrl: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) => setFormData({ ...formData, status: e.target.value as StudentStatus })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="Inactive">Inactive</option>
                    <option value="Graduated">Graduated</option>
                  </select>
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsAddModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                >
                  {editingStudent ? 'Save Changes' : 'Create Student'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Comprehensive Student Profile Modal */}
      {profileStudent && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-3xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            {/* Modal Header */}
            <div className="flex items-start justify-between pb-4 border-b border-slate-100">
              <div className="flex items-center space-x-4">
                <img
                  src={
                    profileStudent.photoUrl ||
                    'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                  }
                  alt={profileStudent.fullName}
                  className="w-16 h-16 rounded-2xl object-cover border-2 border-blue-500/20"
                />
                <div>
                  <h3 className="text-xl font-bold text-slate-900">{profileStudent.fullName}</h3>
                  <div className="flex items-center space-x-3 text-xs text-slate-500 mt-1 font-medium">
                    <span className="font-mono text-blue-600 font-bold">{profileStudent.studentId}</span>
                    <span>•</span>
                    <span>Class: {profileStudent.gradeClass}</span>
                    <span>•</span>
                    <span>Roll #{profileStudent.rollNumber}</span>
                  </div>
                </div>
              </div>

              <button
                onClick={() => setProfileStudent(null)}
                className="p-1.5 text-slate-400 hover:text-slate-600 rounded-lg"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Profile Navigation Tabs */}
            <div className="flex border-b border-slate-200 mt-4 space-x-6 text-xs font-semibold text-slate-500">
              <button
                onClick={() => setProfileTab('overview')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  profileTab === 'overview'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent hover:text-slate-800'
                }`}
              >
                Overview
              </button>
              <button
                onClick={() => setProfileTab('fees')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  profileTab === 'fees'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent hover:text-slate-800'
                }`}
              >
                Fee Statement
              </button>
              <button
                onClick={() => setProfileTab('exams')}
                className={`pb-2.5 transition-colors border-b-2 ${
                  profileTab === 'exams'
                    ? 'border-blue-600 text-blue-600'
                    : 'border-transparent hover:text-slate-800'
                }`}
              >
                Report Cards & Marks
              </button>
            </div>

            {/* Tab Contents */}
            <div className="py-5">
              {profileTab === 'overview' && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wider text-blue-700">
                      Personal Information
                    </h4>
                    <div><span className="text-slate-400">Gender:</span> <span className="font-medium text-slate-800">{profileStudent.gender}</span></div>
                    <div><span className="text-slate-400">Date of Birth:</span> <span className="font-medium text-slate-800">{profileStudent.dateOfBirth}</span></div>
                    <div><span className="text-slate-400">Status:</span> <span className="font-bold text-emerald-600">{profileStudent.status}</span></div>
                    <div><span className="text-slate-400">Enrolled Date:</span> <span className="font-medium text-slate-800">{profileStudent.createdAt}</span></div>
                  </div>

                  <div className="p-4 rounded-xl bg-slate-50 border border-slate-100 space-y-2">
                    <h4 className="font-bold text-slate-800 text-xs mb-2 uppercase tracking-wider text-blue-700">
                      Parent / Guardian Details
                    </h4>
                    <div><span className="text-slate-400">Parent Name:</span> <span className="font-medium text-slate-800">{profileStudent.parentName}</span></div>
                    <div><span className="text-slate-400">Phone Number:</span> <span className="font-mono font-medium text-slate-800">{profileStudent.parentPhone}</span></div>
                    <div><span className="text-slate-400">Email:</span> <span className="font-medium text-slate-800">{profileStudent.parentEmail || 'N/A'}</span></div>
                    <div><span className="text-slate-400">Address:</span> <span className="font-medium text-slate-800">{profileStudent.address || 'Springfield'}</span></div>
                  </div>
                </div>
              )}

              {profileTab === 'fees' && (
                <div className="space-y-4">
                  {/* Fee Ledger Summary */}
                  {(() => {
                    const studentPayments = payments.filter((p) => p.studentId === profileStudent.studentId || p.studentName === profileStudent.fullName);
                    const totalPaid = studentPayments.reduce((acc, p) => acc + p.amountPaid, 0);
                    const studentFeeSummary = feeSummaries.find((f) => f.studentId === profileStudent.studentId) || {
                      totalFee: 950,
                      totalPaid,
                      balance: Math.max(0, 950 - totalPaid),
                      status: totalPaid >= 950 ? 'Paid' : totalPaid > 0 ? 'Partial' : 'Unpaid'
                    };

                    return (
                      <>
                        <div className="grid grid-cols-3 gap-3 p-4 rounded-xl bg-blue-50 border border-blue-100 text-xs">
                          <div>
                            <div className="text-slate-500">Total Class Fee</div>
                            <div className="text-base font-bold text-slate-900">${studentFeeSummary.totalFee}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Amount Paid</div>
                            <div className="text-base font-bold text-emerald-600">${totalPaid}</div>
                          </div>
                          <div>
                            <div className="text-slate-500">Current Balance</div>
                            <div className="text-base font-bold text-amber-600">${studentFeeSummary.balance}</div>
                          </div>
                        </div>

                        <h5 className="font-bold text-slate-800 text-xs mt-3">Payment Receipts History</h5>
                        <div className="border border-slate-200 rounded-xl overflow-hidden">
                          <table className="w-full text-left text-xs">
                            <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                              <tr>
                                <th className="p-2.5">Receipt #</th>
                                <th className="p-2.5">Date</th>
                                <th className="p-2.5">Mode</th>
                                <th className="p-2.5">Amount</th>
                                <th className="p-2.5 text-right">PDF</th>
                              </tr>
                            </thead>
                            <tbody className="divide-y divide-slate-100">
                              {studentPayments.length === 0 ? (
                                <tr>
                                  <td colSpan={5} className="p-4 text-center text-slate-400 italic">No payments recorded for this student.</td>
                                </tr>
                              ) : (
                                studentPayments.map((pay) => (
                                  <tr key={pay.id || pay.receiptNo}>
                                    <td className="p-2.5 font-mono font-medium">{pay.receiptNo}</td>
                                    <td className="p-2.5 text-slate-600">{pay.paymentDate}</td>
                                    <td className="p-2.5">{pay.paymentMode}</td>
                                    <td className="p-2.5 font-bold text-emerald-600">${pay.amountPaid}</td>
                                    <td className="p-2.5 text-right">
                                      <button
                                        onClick={() => generatePaymentReceiptPDF(pay, profileStudent)}
                                        className="p-1 rounded bg-blue-50 text-blue-600 hover:bg-blue-100 font-medium text-[11px] inline-flex items-center space-x-1"
                                      >
                                        <Download className="w-3 h-3" />
                                        <span>PDF</span>
                                      </button>
                                    </td>
                                  </tr>
                                ))
                              )}
                            </tbody>
                          </table>
                        </div>
                      </>
                    );
                  })()}
                </div>
              )}

              {profileTab === 'exams' && (
                <div className="space-y-4">
                  {(() => {
                    const studentResults = examResults.filter(
                      (r) => r.studentId === profileStudent.studentId || r.studentName === profileStudent.fullName
                    );

                    if (studentResults.length === 0) {
                      return <div className="p-6 text-center text-slate-400 text-xs italic">No exam report cards published for this student yet.</div>;
                    }

                    return studentResults.map((res) => (
                      <div key={res.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50 space-y-3">
                        <div className="flex items-center justify-between">
                          <div>
                            <div className="font-bold text-slate-800 text-sm">{res.examTitle || 'Term Exam'}</div>
                            <div className="text-xs text-slate-500">Average: {res.average}% • Grade: {res.grade}</div>
                          </div>
                          <button
                            onClick={() => generateReportCardPDF(res, profileStudent)}
                            className="inline-flex items-center space-x-1.5 px-3 py-1.5 rounded-lg bg-blue-600 text-white text-xs font-semibold shadow-xs hover:bg-blue-700"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download Report Card PDF</span>
                          </button>
                        </div>
                      </div>
                    ));
                  })()}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Remove All Confirmation Modal */}
      {isRemoveAllModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-start space-x-3">
              <div className="w-10 h-10 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 shrink-0">
                <AlertTriangle className="w-5 h-5" />
              </div>
              <div>
                <h3 className="font-bold text-slate-900 text-base">
                  Are you sure you want to remove all students?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  All {students.length} active student records will be removed from this page and moved safely to the <strong>Trash / Recycle Bin</strong>. You can restore them anytime.
                </p>
              </div>
            </div>

            <div className="flex items-center justify-end space-x-3 pt-2">
              <button
                type="button"
                onClick={() => setIsRemoveAllModalOpen(false)}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold transition-all disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={handleConfirmRemoveAll}
                disabled={isDeletingAll}
                className="px-4 py-2 rounded-xl bg-rose-600 hover:bg-rose-700 text-white text-xs font-semibold shadow-sm transition-all disabled:opacity-50 inline-flex items-center space-x-1.5"
              >
                {isDeletingAll ? (
                  <>
                    <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                    <span>Removing...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Yes, Remove All</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
