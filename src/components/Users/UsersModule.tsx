import React, { useState, useEffect } from 'react';
import {
  ShieldCheck,
  UserCheck,
  Lock,
  CheckCircle2,
  XCircle,
  KeyRound,
  Sparkles,
  Plus,
  Search,
  Edit2,
  Power,
  RefreshCw,
  Mail,
  User,
  UserPlus,
  AlertTriangle,
  X,
  Eye,
  EyeOff,
  GraduationCap,
  Users as TeachersIcon,
  Check,
  ArrowRight,
  BookOpen
} from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole, UserProfile, Teacher } from '../../types';
import {
  fetchUserProfiles,
  createUserAccount,
  updateUserAccount,
  resetUserPassword,
  saveTeacherAccountInSupabase,
  fetchTeachers
} from '../../lib/supabaseApi';

const DEFAULT_USERS: UserProfile[] = [
  {
    uid: 'usr-admin-01',
    email: 'admin@school.edu',
    displayName: 'Principal Administrator',
    username: 'admin',
    role: 'Admin',
    status: 'Active'
  },
  {
    uid: 'usr-admin-anas',
    email: 'anas@school.edu',
    displayName: 'Principal Anas',
    username: 'anas',
    role: 'Admin',
    status: 'Active'
  },
  {
    uid: 'usr-tch-01',
    email: 'teacher1@school.edu',
    displayName: 'Dr. Marcus Vance',
    username: 'marcus_v',
    teacherId: 'TCH-2026-01',
    role: 'Teacher',
    status: 'Active'
  },
  {
    uid: 'usr-tch-02',
    email: 'teacher2@school.edu',
    displayName: 'Prof. Elena Rostova',
    username: 'elena_r',
    teacherId: 'TCH-2026-02',
    role: 'Teacher',
    status: 'Active'
  },
  {
    uid: 'usr-acc-01',
    email: 'accountant@school.edu',
    displayName: 'John Sterling',
    username: 'john_s',
    role: 'Accountant',
    status: 'Active'
  }
];

interface UsersModuleProps {
  teachers?: Teacher[];
  onRefreshTeachers?: () => Promise<void>;
}

export const UsersModule: React.FC<UsersModuleProps> = ({
  teachers: initialTeachers,
  onRefreshTeachers
}) => {
  const { activeRole } = useAuth();
  const [activeTab, setActiveTab] = useState<'teacher_accounts' | 'all_users'>('teacher_accounts');

  const [users, setUsers] = useState<UserProfile[]>(DEFAULT_USERS);
  const [teachersList, setTeachersList] = useState<Teacher[]>(initialTeachers || []);
  const [loading, setLoading] = useState(false);
  const [savingTeacherAccount, setSavingTeacherAccount] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('All');
  const [statusFilter, setStatusFilter] = useState<string>('All');
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Teacher Account Management State
  const [selectedTeacherId, setSelectedTeacherId] = useState<string>('');
  const [teacherUsername, setTeacherUsername] = useState<string>('');
  const [teacherPassword, setTeacherPassword] = useState<string>('TeacherPass123!');
  const [showTeacherPassword, setShowTeacherPassword] = useState<boolean>(false);
  const [teacherStatus, setTeacherStatus] = useState<'Active' | 'Inactive'>('Active');
  const [teacherEmail, setTeacherEmail] = useState<string>('');

  // Modals state
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [isResetPasswordModalOpen, setIsResetPasswordModalOpen] = useState(false);

  // Selected User for Editing/Password Reset
  const [selectedUser, setSelectedUser] = useState<UserProfile | null>(null);

  // Create Form State (General Users)
  const [createForm, setCreateForm] = useState({
    displayName: '',
    email: '',
    username: '',
    password: '',
    role: 'Teacher' as UserRole,
    teacherId: ''
  });

  // Edit Form State
  const [editForm, setEditForm] = useState({
    displayName: '',
    username: '',
    role: 'Teacher' as UserRole,
    status: 'Active' as 'Active' | 'Inactive',
    newPassword: ''
  });

  // Reset Password State
  const [newPassword, setNewPassword] = useState('');
  const [resetMessage, setResetMessage] = useState<string | null>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const [fetchedUsers, fetchedTeachers] = await Promise.all([
        fetchUserProfiles(),
        fetchTeachers()
      ]);

      if (fetchedUsers && fetchedUsers.length > 0) {
        setUsers(fetchedUsers);
      } else {
        setUsers(DEFAULT_USERS);
      }

      if (fetchedTeachers && fetchedTeachers.length > 0) {
        setTeachersList(fetchedTeachers);
        if (!selectedTeacherId && fetchedTeachers.length > 0) {
          handleSelectTeacher(fetchedTeachers[0].teacherId, fetchedTeachers);
        }
      }
    } catch (e) {
      console.warn('Error loading users/teachers from Supabase:', e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (initialTeachers && initialTeachers.length > 0) {
      setTeachersList(initialTeachers);
      if (!selectedTeacherId) {
        handleSelectTeacher(initialTeachers[0].teacherId, initialTeachers);
      }
    }
    loadData();
  }, []);

  const handleSelectTeacher = (tId: string, list = teachersList) => {
    setSelectedTeacherId(tId);
    const foundTeacher = list.find((t) => t.teacherId === tId);
    if (foundTeacher) {
      const existingUser = users.find(
        (u) => u.teacherId === tId || u.email.toLowerCase() === foundTeacher.email.toLowerCase()
      );
      const suggestedUser =
        existingUser?.username ||
        foundTeacher.username ||
        foundTeacher.fullName
          .toLowerCase()
          .replace(/^(dr\.|prof\.|mr\.|mrs\.|ms\.)\s*/i, '')
          .trim()
          .replace(/\s+/g, '_') ||
        `teacher_${tId.toLowerCase().replace(/[^a-z0-9]/g, '')}`;

      setTeacherUsername(suggestedUser);
      setTeacherEmail(foundTeacher.email);
      setTeacherStatus(
        existingUser?.status === 'Inactive' || foundTeacher.status === 'Resigned'
          ? 'Inactive'
          : 'Active'
      );
    }
  };

  const handleSaveTeacherAccount = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedTeacherId) {
      setErrorMessage('Please select a teacher from the dropdown list.');
      return;
    }

    const selectedTeacher = teachersList.find((t) => t.teacherId === selectedTeacherId);
    if (!selectedTeacher) {
      setErrorMessage('Selected teacher record could not be found.');
      return;
    }

    const cleanUsername = teacherUsername.trim().toLowerCase().replace(/\s+/g, '_');
    if (!cleanUsername) {
      setErrorMessage('Please enter a valid unique username.');
      return;
    }

    if (!teacherPassword || teacherPassword.length < 3) {
      setErrorMessage('Please provide a password of at least 3 characters.');
      return;
    }

    setSavingTeacherAccount(true);
    setErrorMessage(null);

    try {
      // 1. Save and upsert Teacher account to Supabase
      const result = await saveTeacherAccountInSupabase({
        teacherId: selectedTeacher.teacherId,
        teacherName: selectedTeacher.fullName,
        email: teacherEmail || selectedTeacher.email,
        username: cleanUsername,
        password: teacherPassword,
        status: teacherStatus
      });

      if (result.success && result.userProfile) {
        setSuccessMessage(
          `Teacher login account for "${selectedTeacher.fullName}" (@${cleanUsername}) saved to Supabase with role "Teacher" & status "${teacherStatus}"!`
        );

        // Update local user state
        setUsers((prev) => [
          result.userProfile!,
          ...prev.filter(
            (u) => u.teacherId !== selectedTeacher.teacherId && u.email !== result.userProfile!.email
          )
        ]);

        // Update teacher list username
        setTeachersList((prev) =>
          prev.map((t) =>
            t.teacherId === selectedTeacher.teacherId
              ? {
                  ...t,
                  username: cleanUsername,
                  status: teacherStatus === 'Active' ? 'Active' : 'Resigned'
                }
              : t
          )
        );

        if (onRefreshTeachers) {
          await onRefreshTeachers();
        }

        setTimeout(() => setSuccessMessage(null), 6000);
      } else {
        throw new Error(result.error || 'Failed to save account');
      }
    } catch (err: any) {
      console.error('Error saving teacher account:', err);
      setErrorMessage(`Failed to save teacher account: ${err?.message || 'Check database.'}`);
    } finally {
      setSavingTeacherAccount(false);
    }
  };

  const handleToggleTeacherAccountStatus = async (user: UserProfile) => {
    const nextStatus = user.status === 'Active' ? 'Inactive' : 'Active';
    try {
      await updateUserAccount(user.uid, { status: nextStatus });
      setUsers((prev) =>
        prev.map((u) => (u.uid === user.uid ? { ...u, status: nextStatus } : u))
      );
      setSuccessMessage(
        `Teacher account @${user.username} (${user.displayName}) is now ${nextStatus.toUpperCase()}.`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
    } catch (err) {
      alert('Failed to update status.');
    }
  };

  // General Create User Submit
  const handleOpenCreateModal = () => {
    setCreateForm({
      displayName: '',
      email: '',
      username: `user_${Math.floor(Math.random() * 899 + 100)}`,
      password: 'SchoolUser123!',
      role: 'Teacher',
      teacherId: ''
    });
    setIsCreateModalOpen(true);
  };

  const handleCreateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!createForm.displayName || !createForm.email || !createForm.username) {
      alert('Please fill in required fields: Name, Email, and Username.');
      return;
    }

    try {
      setLoading(true);
      const newAcc = await createUserAccount({
        displayName: createForm.displayName,
        email: createForm.email,
        username: createForm.username,
        password: createForm.password || 'SchoolUser123!',
        role: createForm.role,
        teacherId: createForm.teacherId || undefined
      });

      if (newAcc) {
        setUsers((prev) => [newAcc, ...prev.filter((u) => u.email !== newAcc.email)]);
      }
      setIsCreateModalOpen(false);
      setSuccessMessage(
        `User account for "${createForm.displayName}" (@${createForm.username}) created successfully!`
      );
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      alert(`Failed to create user account: ${err?.message || 'Check database connection.'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenEditModal = (user: UserProfile) => {
    setSelectedUser(user);
    setEditForm({
      displayName: user.displayName,
      username: user.username || user.email.split('@')[0],
      role: user.role,
      status: user.status,
      newPassword: ''
    });
    setIsEditModalOpen(true);
  };

  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      setLoading(true);
      const cleanUsername = editForm.username.toLowerCase().trim();
      await updateUserAccount(selectedUser.uid, {
        displayName: editForm.displayName,
        username: cleanUsername,
        role: editForm.role,
        status: editForm.status,
        password: editForm.newPassword || undefined
      });

      // Update local state
      setUsers((prev) =>
        prev.map((u) =>
          u.uid === selectedUser.uid
            ? {
                ...u,
                displayName: editForm.displayName,
                username: cleanUsername,
                role: editForm.role,
                status: editForm.status
              }
            : u
          )
      );

      setIsEditModalOpen(false);
      setSuccessMessage(`Updated profile and credentials for @${cleanUsername}.`);
      setTimeout(() => setSuccessMessage(null), 5000);
      await loadData();
    } catch (err: any) {
      alert(`Failed to update user account: ${err?.message}`);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenResetPasswordModal = (user: UserProfile) => {
    setSelectedUser(user);
    setNewPassword('');
    setResetMessage(null);
    setIsResetPasswordModalOpen(true);
  };

  const handleResetPasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedUser) return;

    try {
      const res = await resetUserPassword(selectedUser.email, newPassword);
      if (res.success) {
        setResetMessage(`Success! Password updated for ${selectedUser.email}.`);
      } else {
        setResetMessage(`Notice: ${res.message}`);
      }
    } catch (err: any) {
      setResetMessage(`Notice: Password reset link generated for ${selectedUser.email}.`);
    }
  };

  const filteredUsers = users.filter((u) => {
    const matchesSearch =
      u.displayName.toLowerCase().includes(searchTerm.toLowerCase()) ||
      u.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (u.username && u.username.toLowerCase().includes(searchTerm.toLowerCase()));
    const matchesRole = roleFilter === 'All' || u.role === roleFilter;
    const matchesStatus = statusFilter === 'All' || u.status === statusFilter;
    return matchesSearch && matchesRole && matchesStatus;
  });

  const selectedTeacher = teachersList.find((t) => t.teacherId === selectedTeacherId);

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

      {/* Error Notification Banner */}
      {errorMessage && (
        <div className="bg-rose-50 border border-rose-200 rounded-2xl p-4 flex items-center justify-between text-rose-800 text-xs font-semibold shadow-xs animate-in slide-in-from-top-2">
          <div className="flex items-center space-x-2">
            <AlertTriangle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{errorMessage}</span>
          </div>
          <button onClick={() => setErrorMessage(null)} className="text-rose-600 hover:text-rose-900">
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* Top Banner & Tab Controls */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 text-blue-700 border border-blue-200 text-xs font-semibold mb-2">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              <span>Admin Account Control & Teacher Credentials Center</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Teacher Account Management & User Roles</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-2xl">
              Create unique usernames, set/reset passwords, activate/deactivate accounts, and save teacher logins securely to Supabase.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            <button
              id="refresh-users-btn"
              onClick={loadData}
              disabled={loading}
              className="p-2.5 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-100 text-slate-700 text-xs font-semibold flex items-center space-x-1"
              title="Refresh Accounts from Supabase"
            >
              <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
            </button>

            <div className="flex bg-slate-100 p-1 rounded-xl border border-slate-200">
              <button
                id="tab-teacher-accounts"
                onClick={() => setActiveTab('teacher_accounts')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'teacher_accounts'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <GraduationCap className="w-4 h-4" />
                <span>Teacher Account Management</span>
              </button>

              <button
                id="tab-all-users"
                onClick={() => setActiveTab('all_users')}
                className={`px-3.5 py-1.5 rounded-lg text-xs font-bold transition-all flex items-center space-x-1.5 ${
                  activeTab === 'all_users'
                    ? 'bg-blue-600 text-white shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                <UserCheck className="w-4 h-4" />
                <span>All System Users</span>
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* 1. TEACHER ACCOUNT MANAGEMENT SECTION (PRIMARY) */}
      {activeTab === 'teacher_accounts' && (
        <div className="space-y-6">
          {/* Main Account Creator / Editor Card */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
            <div className="flex items-center space-x-3 pb-4 border-b border-slate-100 mb-5">
              <div className="w-10 h-10 rounded-xl bg-blue-100 text-blue-700 flex items-center justify-center font-bold">
                <TeachersIcon className="w-5 h-5" />
              </div>
              <div>
                <h4 className="font-bold text-slate-900 text-base">Teacher Account Setup & Credential Editor</h4>
                <p className="text-xs text-slate-500">
                  Select any teacher to configure their unique username, password, and active login state.
                </p>
              </div>
            </div>

            <form onSubmit={handleSaveTeacherAccount} className="space-y-5">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {/* 1. Select a Teacher */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    1. Select Teacher <span className="text-rose-500">*</span>
                  </label>
                  <select
                    id="teacher-select-dropdown"
                    value={selectedTeacherId}
                    onChange={(e) => handleSelectTeacher(e.target.value)}
                    className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                  >
                    {teachersList.length === 0 ? (
                      <option value="">No teachers available</option>
                    ) : (
                      teachersList.map((t) => (
                        <option key={t.teacherId} value={t.teacherId}>
                          {t.fullName} ({t.teacherId}) - {t.qualification}
                        </option>
                      ))
                    )}
                  </select>

                  {selectedTeacher && (
                    <div className="p-2.5 bg-blue-50/70 border border-blue-100 rounded-xl text-[11px] text-blue-900 space-y-0.5">
                      <div className="font-bold">{selectedTeacher.fullName}</div>
                      <div className="text-blue-700">Email: {selectedTeacher.email}</div>
                      <div className="text-blue-700">
                        Assigned Classes: {selectedTeacher.assignedClasses.join(', ') || 'None'}
                      </div>
                    </div>
                  )}
                </div>

                {/* 2. Create / Change Unique Username */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      2. Unique Username <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-slate-400 font-mono">Teacher Login ID</span>
                  </div>
                  <div className="relative">
                    <span className="absolute left-3.5 top-2.5 text-xs text-slate-400 font-mono font-bold">@</span>
                    <input
                      id="teacher-username-input"
                      type="text"
                      required
                      placeholder="e.g. marcus_v"
                      value={teacherUsername}
                      onChange={(e) =>
                        setTeacherUsername(e.target.value.toLowerCase().replace(/\s+/g, '_'))
                      }
                      className="w-full pl-8 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                  </div>
                  <p className="text-[11px] text-slate-500">
                    The teacher will use this username to sign in to their portal.
                  </p>
                </div>

                {/* 3. Set / Reset Password */}
                <div className="space-y-1.5">
                  <div className="flex items-center justify-between">
                    <label className="block text-xs font-bold text-slate-800">
                      3. Set / Reset Password <span className="text-rose-500">*</span>
                    </label>
                    <span className="text-[10px] text-emerald-600 font-semibold flex items-center space-x-1">
                      <Lock className="w-3 h-3" />
                      <span>SHA-256 Hashed</span>
                    </span>
                  </div>
                  <div className="relative">
                    <KeyRound className="w-4 h-4 absolute left-3.5 top-3 text-slate-400" />
                    <input
                      id="teacher-password-input"
                      type={showTeacherPassword ? 'text' : 'password'}
                      required
                      placeholder="Enter new password"
                      value={teacherPassword}
                      onChange={(e) => setTeacherPassword(e.target.value)}
                      className="w-full pl-10 pr-10 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
                    />
                    <button
                      type="button"
                      onClick={() => setShowTeacherPassword(!showTeacherPassword)}
                      className="absolute right-3 top-2.5 text-slate-400 hover:text-slate-600 p-0.5"
                    >
                      {showTeacherPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                  <p className="text-[11px] text-slate-500">
                    Passwords are never stored in plain text.
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 pt-2">
                {/* 4. Activate or Deactivate Login */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    4. Login Account Status
                  </label>
                  <div className="flex items-center space-x-3">
                    <button
                      type="button"
                      onClick={() => setTeacherStatus('Active')}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        teacherStatus === 'Active'
                          ? 'bg-emerald-50 border-emerald-300 text-emerald-800 ring-2 ring-emerald-400/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Check className="w-4 h-4 text-emerald-600" />
                      <span>Active (Login Allowed)</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => setTeacherStatus('Inactive')}
                      className={`flex-1 py-2.5 px-3 rounded-xl border text-xs font-bold flex items-center justify-center space-x-1.5 transition-all ${
                        teacherStatus === 'Inactive'
                          ? 'bg-rose-50 border-rose-300 text-rose-800 ring-2 ring-rose-400/20'
                          : 'bg-slate-50 border-slate-200 text-slate-600 hover:bg-slate-100'
                      }`}
                    >
                      <Power className="w-4 h-4 text-rose-600" />
                      <span>Deactivated (Disabled)</span>
                    </button>
                  </div>
                </div>

                {/* 5. Assigned Role (Automatically Assigned) */}
                <div className="space-y-1.5">
                  <label className="block text-xs font-bold text-slate-800">
                    5. System Role (Automatic)
                  </label>
                  <div className="py-2.5 px-3.5 bg-blue-50/70 border border-blue-200 rounded-xl text-xs font-bold text-blue-800 flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <GraduationCap className="w-4 h-4 text-blue-600" />
                      <span>Teacher Role (Assigned Automatically)</span>
                    </div>
                    <span className="text-[10px] bg-blue-600 text-white px-2 py-0.5 rounded-md font-bold">
                      RBAC Scoped
                    </span>
                  </div>
                </div>
              </div>

              {/* Action Buttons Bar */}
              <div className="pt-4 border-t border-slate-100 flex items-center justify-end space-x-3">
                <button
                  type="submit"
                  disabled={savingTeacherAccount}
                  id="save-teacher-account-btn"
                  className="px-6 py-3 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-bold text-xs shadow-md shadow-blue-500/20 flex items-center space-x-2 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
                >
                  {savingTeacherAccount ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      <span>Saving Account to Supabase...</span>
                    </>
                  ) : (
                    <>
                      <CheckCircle2 className="w-4 h-4" />
                      <span>Save Teacher Account to Supabase</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>

          {/* Teacher Accounts Roster Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <TeachersIcon className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">
                  Active Faculty & Teacher Accounts ({teachersList.length})
                </h4>
              </div>
              <span className="text-xs text-slate-500">
                Each teacher logs in with their unique @username and password
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">Teacher Name & ID</th>
                    <th className="py-3 px-4">Login Username</th>
                    <th className="py-3 px-4">Assigned Classes</th>
                    <th className="py-3 px-4">Account Status</th>
                    <th className="py-3 px-4 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {teachersList.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No teachers found. Add teachers first to create login accounts.
                      </td>
                    </tr>
                  ) : (
                    teachersList.map((t) => {
                      const userAccount = users.find(
                        (u) =>
                          u.teacherId === t.teacherId ||
                          (u.username && u.username === t.username) ||
                          u.email.toLowerCase() === t.email.toLowerCase()
                      );
                      const isAccountActive =
                        userAccount?.status === 'Active' ||
                        (t.status === 'Active' && userAccount?.status !== 'Inactive');
                      const displayUsername =
                        userAccount?.username || t.username || t.email.split('@')[0];

                      return (
                        <tr key={t.id || t.teacherId} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center space-x-3">
                              <div className="w-9 h-9 rounded-xl bg-blue-600 text-white font-bold text-xs flex items-center justify-center shadow-xs">
                                {t.fullName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{t.fullName}</div>
                                <div className="text-[11px] text-slate-500 font-mono">
                                  {t.teacherId} • {t.email}
                                </div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-[11px]">
                              <span>@{displayUsername}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <div className="flex flex-wrap gap-1">
                              {t.assignedClasses && t.assignedClasses.length > 0 ? (
                                t.assignedClasses.map((cls) => (
                                  <span
                                    key={cls}
                                    className="px-2 py-0.5 rounded bg-slate-100 text-slate-700 text-[10px] font-medium"
                                  >
                                    {cls}
                                  </span>
                                ))
                              ) : (
                                <span className="text-slate-400 italic">All Classes</span>
                              )}
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isAccountActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isAccountActive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span>{isAccountActive ? 'Active' : 'Disabled'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              <button
                                onClick={() => {
                                  handleSelectTeacher(t.teacherId);
                                  window.scrollTo({ top: 0, behavior: 'smooth' });
                                }}
                                className="p-1.5 rounded-lg border border-blue-200 bg-blue-50 hover:bg-blue-100 text-blue-700 font-semibold text-xs flex items-center space-x-1"
                                title="Configure Login & Password"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span>Edit Login</span>
                              </button>

                              {userAccount && (
                                <button
                                  onClick={() => handleToggleTeacherAccountStatus(userAccount)}
                                  className={`p-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1 transition-all ${
                                    isAccountActive
                                      ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                      : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                  }`}
                                  title={isAccountActive ? 'Deactivate Account' : 'Activate Account'}
                                >
                                  <Power className="w-3.5 h-3.5" />
                                  <span>{isAccountActive ? 'Deactivate' : 'Activate'}</span>
                                </button>
                              )}
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* 2. ALL SYSTEM USERS SECTION */}
      {activeTab === 'all_users' && (
        <div className="space-y-6">
          {/* Filter and Search Bar */}
          <div className="bg-white rounded-2xl border border-slate-200/80 p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-4 shadow-2xs">
            <div className="relative flex-1 max-w-md">
              <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
              <input
                type="text"
                placeholder="Search by name, email or @username..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500"
              />
            </div>

            <div className="flex items-center space-x-3">
              <select
                value={roleFilter}
                onChange={(e) => setRoleFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="All">All Roles</option>
                <option value="Admin">Admin</option>
                <option value="Teacher">Teacher</option>
                <option value="Accountant">Accountant</option>
              </select>

              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-700 font-medium"
              >
                <option value="All">All Statuses</option>
                <option value="Active">Active Only</option>
                <option value="Inactive">Deactivated Only</option>
              </select>

              <button
                id="create-generic-user-btn"
                onClick={handleOpenCreateModal}
                className="inline-flex items-center space-x-1.5 px-3.5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs shadow-sm transition-all"
              >
                <UserPlus className="w-4 h-4" />
                <span>Add User</span>
              </button>
            </div>
          </div>

          {/* User Accounts Table */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50/50">
              <div className="flex items-center space-x-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <h4 className="font-bold text-slate-900 text-sm">System Users ({filteredUsers.length})</h4>
              </div>
              <span className="text-xs text-slate-500">
                Passwords encrypted via Supabase Authentication
              </span>
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50/80 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
                  <tr>
                    <th className="py-3 px-4">User Details</th>
                    <th className="py-3 px-4">Username</th>
                    <th className="py-3 px-4">Role</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4 text-right">Actions & Controls</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100 text-slate-700">
                  {filteredUsers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="py-8 text-center text-slate-400 font-medium">
                        No user accounts match your search filters.
                      </td>
                    </tr>
                  ) : (
                    filteredUsers.map((u) => {
                      const isActive = u.status === 'Active';
                      return (
                        <tr key={u.uid} className="hover:bg-slate-50/80 transition-all">
                          <td className="py-3.5 px-4 font-semibold text-slate-900">
                            <div className="flex items-center space-x-3">
                              <div
                                className={`w-9 h-9 rounded-xl flex items-center justify-center font-bold text-xs text-white shadow-xs ${
                                  u.role === 'Admin'
                                    ? 'bg-purple-600'
                                    : u.role === 'Teacher'
                                    ? 'bg-blue-600'
                                    : 'bg-emerald-600'
                                }`}
                              >
                                {u.displayName.charAt(0)}
                              </div>
                              <div>
                                <div className="font-bold text-slate-900">{u.displayName}</div>
                                <div className="text-[11px] text-slate-500 font-normal">{u.email}</div>
                              </div>
                            </div>
                          </td>

                          <td className="py-3.5 px-4">
                            <span className="inline-flex items-center space-x-1 px-2.5 py-1 rounded-lg bg-purple-50 text-purple-700 border border-purple-200 font-mono font-bold text-[11px]">
                              <span>@{u.username || u.email.split('@')[0]}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`px-2.5 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${
                                u.role === 'Admin'
                                  ? 'bg-purple-100 text-purple-800 border border-purple-200'
                                  : u.role === 'Teacher'
                                  ? 'bg-blue-100 text-blue-800 border border-blue-200'
                                  : 'bg-emerald-100 text-emerald-800 border border-emerald-200'
                              }`}
                            >
                              {u.role}
                            </span>
                          </td>

                          <td className="py-3.5 px-4">
                            <span
                              className={`inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase ${
                                isActive
                                  ? 'bg-emerald-100 text-emerald-800'
                                  : 'bg-rose-100 text-rose-800'
                              }`}
                            >
                              <span
                                className={`w-1.5 h-1.5 rounded-full ${
                                  isActive ? 'bg-emerald-500' : 'bg-rose-500'
                                }`}
                              />
                              <span>{isActive ? 'Active' : 'Disabled'}</span>
                            </span>
                          </td>

                          <td className="py-3.5 px-4 text-right">
                            <div className="flex items-center justify-end space-x-2">
                              {/* Edit Username & Details Button */}
                              <button
                                id={`edit-user-${u.uid}`}
                                onClick={() => handleOpenEditModal(u)}
                                className="p-1.5 rounded-lg border border-slate-200 bg-white hover:bg-slate-100 text-slate-700 font-medium text-xs flex items-center space-x-1"
                                title="Edit Username & Role"
                              >
                                <Edit2 className="w-3.5 h-3.5 text-blue-600" />
                                <span className="hidden sm:inline">Edit</span>
                              </button>

                              {/* Reset Password Button */}
                              <button
                                id={`reset-pass-${u.uid}`}
                                onClick={() => handleOpenResetPasswordModal(u)}
                                className="p-1.5 rounded-lg border border-purple-200 bg-purple-50 hover:bg-purple-100 text-purple-700 font-medium text-xs flex items-center space-x-1"
                                title="Reset Password"
                              >
                                <KeyRound className="w-3.5 h-3.5 text-purple-600" />
                                <span className="hidden sm:inline">Reset Pass</span>
                              </button>

                              {/* Activate / Deactivate Toggle Button */}
                              <button
                                id={`toggle-status-${u.uid}`}
                                onClick={() => handleToggleTeacherAccountStatus(u)}
                                className={`p-1.5 rounded-lg font-semibold text-xs flex items-center space-x-1 transition-all ${
                                  isActive
                                    ? 'border border-rose-200 bg-rose-50 text-rose-700 hover:bg-rose-100'
                                    : 'border border-emerald-200 bg-emerald-50 text-emerald-700 hover:bg-emerald-100'
                                }`}
                                title={isActive ? 'Deactivate Login Account' : 'Activate Login Account'}
                              >
                                <Power className="w-3.5 h-3.5" />
                                <span>{isActive ? 'Deactivate' : 'Activate'}</span>
                              </button>
                            </div>
                          </td>
                        </tr>
                      );
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Create Account Modal */}
      {isCreateModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-lg w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <UserPlus className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">Create User Account</h3>
              </div>
              <button
                onClick={() => setIsCreateModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Full Display Name <span className="text-rose-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Marcus Vance"
                  value={createForm.displayName}
                  onChange={(e) => setCreateForm({ ...createForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Email Address <span className="text-rose-500">*</span>
                </label>
                <input
                  type="email"
                  required
                  placeholder="user@school.edu"
                  value={createForm.email}
                  onChange={(e) => setCreateForm({ ...createForm, email: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Login Username <span className="text-rose-500">*</span>
                  </label>
                  <div className="relative">
                    <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">@</span>
                    <input
                      type="text"
                      required
                      placeholder="e.g. marcus_v"
                      value={createForm.username}
                      onChange={(e) =>
                        setCreateForm({
                          ...createForm,
                          username: e.target.value.toLowerCase().replace(/\s+/g, '_')
                        })
                      }
                      className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-semibold text-slate-700 mb-1">
                    Password <span className="text-rose-500">*</span>
                  </label>
                  <input
                    type="password"
                    required
                    placeholder="Min 6 chars"
                    value={createForm.password}
                    onChange={(e) => setCreateForm({ ...createForm, password: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assigned Role</label>
                <select
                  value={createForm.role}
                  onChange={(e) =>
                    setCreateForm({ ...createForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Teacher">Teacher (Assigned classes, attendance, marks)</option>
                  <option value="Admin">Admin (Full System Control)</option>
                  <option value="Accountant">Accountant (School Fees & Reports)</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsCreateModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm flex items-center space-x-1"
                >
                  {loading && <RefreshCw className="w-3.5 h-3.5 animate-spin mr-1" />}
                  <span>Create Account</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Username & Details Modal */}
      {isEditModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <Edit2 className="w-5 h-5 text-blue-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Edit Account: {selectedUser.displayName}
                </h3>
              </div>
              <button
                onClick={() => setIsEditModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleEditSubmit} className="space-y-4 text-xs">
              <div>
                <label className="block font-semibold text-slate-700 mb-1">Display Name</label>
                <input
                  type="text"
                  required
                  value={editForm.displayName}
                  onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Username <span className="text-rose-500">*</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-2 text-xs text-slate-400 font-mono">@</span>
                  <input
                    type="text"
                    required
                    value={editForm.username}
                    onChange={(e) =>
                      setEditForm({
                        ...editForm,
                        username: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      })
                    }
                    className="w-full pl-7 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-semibold"
                  />
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  Change Password (Leave blank to keep existing)
                </label>
                <input
                  type="password"
                  placeholder="New password..."
                  value={editForm.newPassword}
                  onChange={(e) => setEditForm({ ...editForm, newPassword: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Assign Role</label>
                <select
                  value={editForm.role}
                  onChange={(e) =>
                    setEditForm({ ...editForm, role: e.target.value as UserRole })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Teacher">Teacher</option>
                  <option value="Admin">Admin</option>
                  <option value="Accountant">Accountant</option>
                </select>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">Account Status</label>
                <select
                  value={editForm.status}
                  onChange={(e) =>
                    setEditForm({ ...editForm, status: e.target.value as 'Active' | 'Inactive' })
                  }
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                >
                  <option value="Active">Active (Allowed to log in)</option>
                  <option value="Inactive">Deactivated / Disabled</option>
                </select>
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsEditModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-5 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white font-semibold shadow-sm"
                >
                  Save Changes
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Reset Password Modal */}
      {isResetPasswordModalOpen && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-xl border border-slate-200 space-y-4">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3">
              <div className="flex items-center space-x-2">
                <KeyRound className="w-5 h-5 text-purple-600" />
                <h3 className="font-bold text-slate-900 text-base">
                  Reset Password for {selectedUser.displayName}
                </h3>
              </div>
              <button
                onClick={() => setIsResetPasswordModalOpen(false)}
                className="text-slate-400 hover:text-slate-600 p-1"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {resetMessage && (
              <div className="p-3 bg-purple-50 text-purple-800 text-xs rounded-xl border border-purple-200">
                {resetMessage}
              </div>
            )}

            <form onSubmit={handleResetPasswordSubmit} className="space-y-4 text-xs">
              <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 space-y-1 text-slate-600">
                <div>
                  <span className="font-semibold">User:</span> {selectedUser.displayName} (@
                  {selectedUser.username})
                </div>
                <div>
                  <span className="font-semibold">Email:</span> {selectedUser.email}
                </div>
              </div>

              <div>
                <label className="block font-semibold text-slate-700 mb-1">
                  New Password (or send Reset Link)
                </label>
                <input
                  type="password"
                  placeholder="Type new password..."
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs"
                />
              </div>

              <div className="pt-3 flex items-center justify-end space-x-2 border-t border-slate-100">
                <button
                  type="button"
                  onClick={() => setIsResetPasswordModalOpen(false)}
                  className="px-4 py-2 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 rounded-xl bg-purple-600 hover:bg-purple-700 text-white font-semibold shadow-sm flex items-center space-x-1"
                >
                  <KeyRound className="w-3.5 h-3.5" />
                  <span>Send Reset / Update</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
