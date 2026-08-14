import React, { useState } from 'react';
import {
  Plus,
  Search,
  BookOpen,
  Users,
  Mail,
  Phone,
  Edit2,
  Trash2,
  X,
  Check,
  Building,
  Award,
  AlertTriangle,
  CheckCircle2,
  RefreshCw,
  UserCheck,
  KeyRound,
  ShieldCheck,
  Lock
} from 'lucide-react';
import { Teacher, TeacherStatus } from '../../types';
import { INITIAL_CLASSES, ALL_SUBJECTS } from '../../lib/seedData';
import { createUserAccount } from '../../lib/supabaseApi';

interface TeachersModuleProps {
  teachers: Teacher[];
  onAddTeacher: (teacher: Omit<Teacher, 'id'>) => Promise<void>;
  onUpdateTeacher: (id: string, updates: Partial<Teacher>) => Promise<void>;
  onDeleteTeacher: (teacher: Teacher) => Promise<void>;
  onDeleteAllTeachers?: () => Promise<void>;
  canEdit: boolean;
}

export const TeachersModule: React.FC<TeachersModuleProps> = ({
  teachers,
  onAddTeacher,
  onUpdateTeacher,
  onDeleteTeacher,
  onDeleteAllTeachers,
  canEdit
}) => {
  const [searchTerm, setSearchTerm] = useState('');

  // Modal States
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState<Teacher | null>(null);
  const [isRemoveAllModalOpen, setIsRemoveAllModalOpen] = useState(false);
  const [isDeletingAll, setIsDeletingAll] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const handleConfirmRemoveAll = async () => {
    if (!onDeleteAllTeachers) return;
    setIsDeletingAll(true);
    try {
      await onDeleteAllTeachers();
      setIsRemoveAllModalOpen(false);
      setSuccessMessage('All teachers were moved to Trash successfully.');
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to remove all teachers:', err);
      alert('Failed to remove all teachers. Please try again.');
    } finally {
      setIsDeletingAll(false);
    }
  };

  const handleDeleteSingleTeacher = async (teacher: Teacher) => {
    try {
      await onDeleteTeacher(teacher);
      setSuccessMessage(`Teacher "${teacher.fullName}" was moved to Trash successfully.`);
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      console.error('Failed to delete teacher:', err);
      alert('Failed to delete teacher.');
    }
  };

  const [teacherUsername, setTeacherUsername] = useState('');
  const [teacherPassword, setTeacherPassword] = useState('Teacher2026!');

  const [formData, setFormData] = useState<Omit<Teacher, 'id'>>({
    teacherId: `TCH-2026-0${teachers.length + 1}`,
    fullName: '',
    email: '',
    phone: '',
    username: '',
    subjects: ['Mathematics'],
    assignedClasses: ['Grade 10A'],
    qualification: 'M.Sc. Education',
    joiningDate: '2023-08-01',
    status: 'Active'
  });

  const filteredTeachers = teachers.filter(
    (t) =>
      t.fullName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      t.teacherId.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (t.username && t.username.toLowerCase().includes(searchTerm.toLowerCase())) ||
      t.subjects.some((s) => s.toLowerCase().includes(searchTerm.toLowerCase()))
  );

  const handleOpenAddModal = () => {
    setEditingTeacher(null);
    const nextNum = teachers.length + 1;
    const defaultUser = `teacher${nextNum}`;
    setTeacherUsername(defaultUser);
    setTeacherPassword('Teacher2026!');
    setFormData({
      teacherId: `TCH-2026-0${nextNum}`,
      fullName: '',
      email: `teacher${nextNum}@school.edu`,
      phone: '+1 (555) 012-3456',
      username: defaultUser,
      subjects: ['Mathematics'],
      assignedClasses: ['Grade 10A'],
      qualification: 'M.Sc.',
      joiningDate: new Date().toISOString().split('T')[0],
      status: 'Active'
    });
    setIsModalOpen(true);
  };

  const handleOpenEditModal = (t: Teacher) => {
    setEditingTeacher(t);
    const uname = t.username || t.email.split('@')[0] || '';
    setTeacherUsername(uname);
    setTeacherPassword('');
    setFormData({
      teacherId: t.teacherId,
      fullName: t.fullName,
      email: t.email,
      phone: t.phone,
      username: uname,
      subjects: t.subjects,
      assignedClasses: t.assignedClasses,
      qualification: t.qualification,
      joiningDate: t.joiningDate,
      status: t.status
    });
    setIsModalOpen(true);
  };

  const handleToggleSubject = (sub: string) => {
    if (formData.subjects.includes(sub)) {
      setFormData({
        ...formData,
        subjects: formData.subjects.filter((s) => s !== sub)
      });
    } else {
      setFormData({ ...formData, subjects: [...formData.subjects, sub] });
    }
  };

  const handleToggleClass = (cls: string) => {
    if (formData.assignedClasses.includes(cls)) {
      setFormData({
        ...formData,
        assignedClasses: formData.assignedClasses.filter((c) => c !== cls)
      });
    } else {
      setFormData({
        ...formData,
        assignedClasses: [...formData.assignedClasses, cls]
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!formData.fullName || !formData.email || !formData.phone || !teacherUsername) {
      alert('Please fill in required fields: Full Name, Email, Phone, and Username.');
      return;
    }

    const cleanUsername = teacherUsername.toLowerCase().trim();

    try {
      if (editingTeacher) {
        await onUpdateTeacher(editingTeacher.id, {
          ...formData,
          username: cleanUsername
        });

        // Also sync/create user account in Supabase
        await createUserAccount({
          displayName: formData.fullName,
          email: formData.email,
          username: cleanUsername,
          role: 'Teacher',
          teacherId: formData.teacherId
        });

        setSuccessMessage(`Updated teacher record & login username for "${formData.fullName}" (@${cleanUsername}).`);
      } else {
        await onAddTeacher({
          ...formData,
          username: cleanUsername
        });

        // Create Supabase Auth & Users table login account
        await createUserAccount({
          displayName: formData.fullName,
          email: formData.email,
          username: cleanUsername,
          password: teacherPassword || 'Teacher2026!',
          role: 'Teacher',
          teacherId: formData.teacherId
        });

        setSuccessMessage(`Created Teacher profile and login account (@${cleanUsername}) with Supabase Auth!`);
      }
      setIsModalOpen(false);
      setTimeout(() => setSuccessMessage(null), 6000);
    } catch (err: any) {
      console.error('Error saving teacher and user account:', err);
      alert(`Error saving teacher: ${err?.message || 'Failed to create login account.'}`);
    }
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

      {/* Top Header & Search */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 lg:p-5 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 max-w-md">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search teacher name, ID or subject..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
          />
        </div>

        {canEdit && (
          <div className="flex items-center space-x-2">
            {teachers.length > 0 && onDeleteAllTeachers && (
              <button
                id="remove-all-teachers-btn"
                onClick={() => setIsRemoveAllModalOpen(true)}
                className="inline-flex items-center space-x-2 px-3.5 py-2.5 rounded-xl border border-rose-200 bg-rose-50 hover:bg-rose-100 text-rose-700 font-semibold text-xs transition-all active:scale-95"
                title="Remove all teachers to Trash"
              >
                <Trash2 className="w-4 h-4 text-rose-600" />
                <span>Remove All</span>
              </button>
            )}

            <button
              id="add-new-teacher-btn"
              onClick={handleOpenAddModal}
              className="inline-flex items-center space-x-2 px-4 py-2.5 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-md transition-all active:scale-95"
            >
              <Plus className="w-4 h-4" />
              <span>Add Teacher</span>
            </button>
          </div>
        )}
      </div>

      {/* Teacher Cards Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {filteredTeachers.map((teacher) => (
          <div
            key={teacher.id}
            className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs hover:shadow-md transition-all flex flex-col justify-between"
          >
            <div>
              {/* Card Header */}
              <div className="flex items-start justify-between">
                <div className="flex items-center space-x-3">
                  <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-blue-500 to-indigo-600 text-white font-bold text-lg flex items-center justify-center shadow-md shadow-blue-500/20">
                    {teacher.fullName.charAt(0)}
                  </div>
                  <div>
                    <h3 className="font-bold text-slate-900 text-sm leading-snug">
                      {teacher.fullName}
                    </h3>
                    <div className="flex items-center space-x-1.5 mt-0.5">
                      <span className="text-[11px] font-mono text-blue-600 font-semibold">
                        {teacher.teacherId}
                      </span>
                      <span className="text-[10px] px-1.5 py-0.2 rounded bg-purple-100 text-purple-700 font-mono font-bold border border-purple-200">
                        @{teacher.username || teacher.email.split('@')[0]}
                      </span>
                    </div>
                  </div>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                    teacher.status === 'Active'
                      ? 'bg-emerald-100 text-emerald-800'
                      : 'bg-amber-100 text-amber-800'
                  }`}
                >
                  {teacher.status}
                </span>
              </div>

              {/* Contact Info */}
              <div className="mt-4 pt-3 border-t border-slate-100 space-y-1.5 text-xs text-slate-600">
                <div className="flex items-center space-x-2">
                  <Mail className="w-3.5 h-3.5 text-slate-400" />
                  <span className="truncate">{teacher.email}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Phone className="w-3.5 h-3.5 text-slate-400" />
                  <span className="font-mono">{teacher.phone}</span>
                </div>
                <div className="flex items-center space-x-2">
                  <Award className="w-3.5 h-3.5 text-slate-400" />
                  <span>{teacher.qualification}</span>
                </div>
              </div>

              {/* Assigned Subjects & Classes Badges */}
              <div className="mt-4 space-y-2">
                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Teaching Subjects
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.subjects.map((sub) => (
                      <span
                        key={sub}
                        className="px-2 py-0.5 rounded-md bg-blue-50 text-blue-700 text-[11px] font-semibold border border-blue-100"
                      >
                        {sub}
                      </span>
                    ))}
                  </div>
                </div>

                <div>
                  <span className="text-[10px] uppercase font-bold text-slate-400 block mb-1">
                    Assigned Classes
                  </span>
                  <div className="flex flex-wrap gap-1">
                    {teacher.assignedClasses.map((cls) => (
                      <span
                        key={cls}
                        className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-700 text-[11px] font-medium"
                      >
                        {cls}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>

            {/* Actions Footer */}
            {canEdit && (
              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-end space-x-2">
                <button
                  onClick={() => handleOpenEditModal(teacher)}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-indigo-600 hover:text-indigo-800 p-1.5 rounded-lg hover:bg-indigo-50"
                >
                  <Edit2 className="w-3.5 h-3.5" />
                  <span>Edit Teacher</span>
                </button>
                <button
                  onClick={() => {
                    if (
                      confirm(
                        `Are you sure you want to delete teacher ${teacher.fullName}? This record will be moved to Trash.`
                      )
                    ) {
                      handleDeleteSingleTeacher(teacher);
                    }
                  }}
                  className="inline-flex items-center space-x-1 text-xs font-semibold text-rose-600 hover:text-rose-800 p-1.5 rounded-lg hover:bg-rose-50"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>Delete</span>
                </button>
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Add / Edit Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs overflow-y-auto">
          <div className="bg-white rounded-2xl max-w-xl w-full p-6 shadow-2xl border border-slate-100 my-8">
            <div className="flex items-center justify-between pb-4 border-b border-slate-100">
              <h3 className="text-lg font-bold text-slate-900">
                {editingTeacher ? 'Manage Teacher Profile' : 'Add Faculty Teacher'}
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="p-1 text-slate-400 hover:text-slate-600"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4 pt-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Teacher ID <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.teacherId}
                    onChange={(e) => setFormData({ ...formData, teacherId: e.target.value })}
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
                    placeholder="e.g. Dr. Marcus Vance"
                    value={formData.fullName}
                    onChange={(e) => setFormData({ ...formData, fullName: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Email Address <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="email"
                    required
                    placeholder="teacher@school.edu"
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Phone Number <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="text"
                    required
                    placeholder="+1 (555) 000-0000"
                    value={formData.phone}
                    onChange={(e) => setFormData({ ...formData, phone: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">
                    Qualification
                  </label>
                  <input
                    type="text"
                    placeholder="e.g. Ph.D., M.Sc."
                    value={formData.qualification}
                    onChange={(e) => setFormData({ ...formData, qualification: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Status</label>
                  <select
                    value={formData.status}
                    onChange={(e) =>
                      setFormData({ ...formData, status: e.target.value as TeacherStatus })
                    }
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  >
                    <option value="Active">Active</option>
                    <option value="On Leave">On Leave</option>
                    <option value="Resigned">Resigned</option>
                  </select>
                </div>
              </div>

              {/* Login Account Credentials */}
              <div className="p-4 bg-purple-50/60 rounded-2xl border border-purple-200 space-y-3">
                <div className="flex items-center space-x-2 text-purple-900 font-bold text-xs">
                  <ShieldCheck className="w-4 h-4 text-purple-600" />
                  <span>Teacher Login Credentials (Supabase Auth Account)</span>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      Login Username <span className="text-rose-500">*</span>
                    </label>
                    <div className="relative">
                      <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">@</span>
                      <input
                        type="text"
                        required
                        placeholder="e.g. m_vance"
                        value={teacherUsername}
                        onChange={(e) => setTeacherUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))}
                        className="w-full pl-7 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs font-mono font-medium focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Unique login handle for teacher portal access.</p>
                  </div>

                  <div>
                    <label className="block text-[11px] font-semibold text-slate-700 mb-1">
                      {editingTeacher ? 'Set New Password (Optional)' : 'Login Password *'}
                    </label>
                    <div className="relative">
                      <KeyRound className="w-3.5 h-3.5 absolute left-3 top-2.5 text-slate-400" />
                      <input
                        type="password"
                        required={!editingTeacher}
                        placeholder={editingTeacher ? 'Leave blank to keep existing password' : 'At least 6 characters'}
                        value={teacherPassword}
                        onChange={(e) => setTeacherPassword(e.target.value)}
                        className="w-full pl-8 pr-3 py-2 bg-white border border-slate-200 rounded-xl text-xs focus:ring-2 focus:ring-purple-500/20 focus:border-purple-500"
                      />
                    </div>
                    <p className="text-[10px] text-slate-500 mt-1">Stored securely via Supabase Auth (encrypted).</p>
                  </div>
                </div>
              </div>

              {/* Assign Subjects Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Teaching Subjects
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {ALL_SUBJECTS.map((sub) => {
                    const isChecked = formData.subjects.includes(sub);
                    return (
                      <label
                        key={sub}
                        className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleSubject(sub)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span className="truncate">{sub}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              {/* Assign Classes Checkboxes */}
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">
                  Assign Grade Classes
                </label>
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 p-3 bg-slate-50 rounded-xl border border-slate-200">
                  {INITIAL_CLASSES.map((cls) => {
                    const isChecked = formData.assignedClasses.includes(cls);
                    return (
                      <label
                        key={cls}
                        className="flex items-center space-x-2 text-xs text-slate-700 cursor-pointer"
                      >
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => handleToggleClass(cls)}
                          className="rounded text-blue-600 focus:ring-blue-500"
                        />
                        <span>{cls}</span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium text-xs hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm"
                >
                  {editingTeacher ? 'Save Changes' : 'Create Teacher'}
                </button>
              </div>
            </form>
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
                  Are you sure you want to remove all teachers?
                </h3>
                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                  All {teachers.length} active teacher records will be removed from this page and moved safely to the <strong>Trash / Recycle Bin</strong>. You can restore them anytime.
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
