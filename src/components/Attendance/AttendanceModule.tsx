import React, { useState, useEffect } from 'react';
import {
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  ShieldAlert,
  Save,
  CheckCheck,
  Search,
  Download,
  Filter,
  GraduationCap
} from 'lucide-react';
import { Student, AttendanceStatus, DailyAttendance, StudentAttendanceRecord } from '../../types';
import { INITIAL_CLASSES } from '../../lib/seedData';
import { exportToExcel } from '../../lib/exportUtils';
import { useAuth } from '../../context/AuthContext';

interface AttendanceModuleProps {
  students: Student[];
  attendanceRecords: DailyAttendance[];
  onSaveAttendance: (attendance: Omit<DailyAttendance, 'id'>) => Promise<void>;
  currentUserRole: string;
}

export const AttendanceModule: React.FC<AttendanceModuleProps> = ({
  students,
  attendanceRecords,
  onSaveAttendance,
  currentUserRole
}) => {
  const { userProfile } = useAuth();
  const [activeTab, setActiveTab] = useState<'daily' | 'monthly' | 'student'>('daily');

  // Available classes: if Teacher, prioritize assigned classes
  const teacherClasses =
    currentUserRole === 'Teacher' && userProfile?.assignedClasses && userProfile.assignedClasses.length > 0
      ? userProfile.assignedClasses
      : INITIAL_CLASSES;

  // Daily Marking State
  const [selectedClass, setSelectedClass] = useState<string>(teacherClasses[0] || 'Grade 10A');
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [dailyStatusMap, setDailyStatusMap] = useState<Record<string, { status: AttendanceStatus; remarks: string }>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState('');

  useEffect(() => {
    if (teacherClasses.length > 0 && !teacherClasses.includes(selectedClass)) {
      setSelectedClass(teacherClasses[0]);
    }
  }, [currentUserRole, userProfile]);

  // Get students in selected class
  const classStudents = students.filter((s) => s.gradeClass === selectedClass);

  // Initialize or load existing attendance for class & date
  useEffect(() => {
    const existingDoc = attendanceRecords.find(
      (r) => r.gradeClass === selectedClass && r.date === selectedDate
    );

    const initialMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};

    classStudents.forEach((stu) => {
      if (existingDoc) {
        const foundRec = existingDoc.records.find((rec) => rec.studentId === stu.studentId || rec.studentId === stu.id);
        if (foundRec) {
          initialMap[stu.id] = { status: foundRec.status, remarks: foundRec.remarks || '' };
          return;
        }
      }
      initialMap[stu.id] = { status: 'Present', remarks: '' };
    });

    setDailyStatusMap(initialMap);
  }, [selectedClass, selectedDate, attendanceRecords, students]);

  const handleStatusChange = (studentId: string, status: AttendanceStatus) => {
    setDailyStatusMap((prev) => ({
      ...prev,
      [studentId]: { ...prev[studentId], status }
    }));
  };

  const handleMarkAll = (status: AttendanceStatus) => {
    const newMap: Record<string, { status: AttendanceStatus; remarks: string }> = {};
    classStudents.forEach((stu) => {
      newMap[stu.id] = { status, remarks: dailyStatusMap[stu.id]?.remarks || '' };
    });
    setDailyStatusMap(newMap);
  };

  const handleSaveDaily = async () => {
    setIsSaving(true);
    setSaveMessage('');

    const records: StudentAttendanceRecord[] = classStudents.map((stu) => ({
      studentId: stu.studentId,
      studentName: stu.fullName,
      status: dailyStatusMap[stu.id]?.status || 'Present',
      remarks: dailyStatusMap[stu.id]?.remarks || ''
    }));

    await onSaveAttendance({
      date: selectedDate,
      gradeClass: selectedClass,
      records,
      markedBy: currentUserRole || 'Teacher',
      updatedAt: new Date().toISOString()
    });

    setIsSaving(false);
    setSaveMessage(`Attendance for ${selectedClass} on ${selectedDate} saved successfully!`);
    setTimeout(() => setSaveMessage(''), 4000);
  };

  // Monthly Report Calculations
  const calculateMonthlyStats = () => {
    return classStudents.map((stu) => {
      let present = 0;
      let absent = 0;
      let late = 0;
      let excused = 0;

      attendanceRecords
        .filter((a) => a.gradeClass === selectedClass)
        .forEach((att) => {
          const rec = att.records.find((r) => r.studentId === stu.studentId || r.studentId === stu.id);
          if (rec) {
            if (rec.status === 'Present') present++;
            else if (rec.status === 'Absent') absent++;
            else if (rec.status === 'Late') late++;
            else if (rec.status === 'Excused') excused++;
          }
        });

      const totalDays = present + absent + late + excused || 1;
      const rate = Math.round(((present + late * 0.5) / totalDays) * 100);

      return {
        studentId: stu.studentId,
        name: stu.fullName,
        present,
        absent,
        late,
        excused,
        rate
      };
    });
  };

  const monthlyData = calculateMonthlyStats();

  const handleExportMonthly = () => {
    const exportRows = monthlyData.map((m) => ({
      'Student ID': m.studentId,
      'Student Name': m.name,
      Class: selectedClass,
      'Present Days': m.present,
      'Absent Days': m.absent,
      'Late Days': m.late,
      'Excused Days': m.excused,
      'Attendance Rate (%)': `${m.rate}%`
    }));
    exportToExcel(exportRows, `Attendance_Report_${selectedClass}_${selectedDate}`);
  };

  return (
    <div className="space-y-6">
      {/* Navigation Sub-Tabs */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl border shadow-2xs space-x-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('daily')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'daily'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Daily Class Attendance
        </button>
        <button
          onClick={() => setActiveTab('monthly')}
          className={`pb-3 transition-colors border-b-2 ${
            activeTab === 'monthly'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Monthly Attendance Report
        </button>
      </div>

      {activeTab === 'daily' && (
        <div className="space-y-4">
          {/* Controls Bar */}
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                >
                  {teacherClasses.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Attendance Date
                </label>
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(e) => setSelectedDate(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold text-slate-800"
                />
              </div>
            </div>

            {/* Quick Actions */}
            <div className="flex items-center space-x-2">
              <button
                onClick={() => handleMarkAll('Present')}
                className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-700 hover:bg-emerald-100 border border-emerald-200 text-xs font-semibold inline-flex items-center space-x-1"
              >
                <CheckCheck className="w-4 h-4" />
                <span>Mark All Present</span>
              </button>

              <button
                id="save-daily-attendance-btn"
                onClick={handleSaveDaily}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold shadow-md inline-flex items-center space-x-2 disabled:opacity-50"
              >
                <Save className="w-4 h-4" />
                <span>{isSaving ? 'Saving...' : 'Save Attendance'}</span>
              </button>
            </div>
          </div>

          {saveMessage && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 text-emerald-800 rounded-xl text-xs font-semibold flex items-center space-x-2">
              <CheckCircle2 className="w-4 h-4 text-emerald-600" />
              <span>{saveMessage}</span>
            </div>
          )}

          {/* Student Attendance Marking Sheet */}
          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="p-4 bg-slate-50 border-b border-slate-200 flex items-center justify-between">
              <span className="text-xs font-bold text-slate-800">
                Class Sheet: {selectedClass} ({classStudents.length} Students)
              </span>
              <span className="text-xs text-slate-500 font-mono">Date: {selectedDate}</span>
            </div>

            <div className="divide-y divide-slate-100">
              {classStudents.length === 0 ? (
                <div className="p-8 text-center text-slate-400 text-xs italic">
                  No enrolled students found in {selectedClass}. Add students to this class first.
                </div>
              ) : (
                classStudents.map((student) => {
                  const currentStatus = dailyStatusMap[student.id]?.status || 'Present';
                  return (
                    <div
                      key={student.id}
                      className="p-3.5 px-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 hover:bg-slate-50/60 transition-colors"
                    >
                      <div className="flex items-center space-x-3">
                        <img
                          src={
                            student.photoUrl ||
                            'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&q=80&w=120'
                          }
                          alt={student.fullName}
                          className="w-9 h-9 rounded-full object-cover border border-slate-200"
                        />
                        <div>
                          <div className="font-bold text-slate-900 text-xs">{student.fullName}</div>
                          <div className="text-[10px] text-slate-400 font-mono">
                            {student.studentId} • Roll #{student.rollNumber}
                          </div>
                        </div>
                      </div>

                      {/* Status Toggle Buttons */}
                      <div className="flex items-center space-x-1.5">
                        <button
                          onClick={() => handleStatusChange(student.id, 'Present')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Present'
                              ? 'bg-emerald-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-emerald-50 hover:text-emerald-700'
                          }`}
                        >
                          Present
                        </button>

                        <button
                          onClick={() => handleStatusChange(student.id, 'Absent')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Absent'
                              ? 'bg-rose-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-rose-50 hover:text-rose-700'
                          }`}
                        >
                          Absent
                        </button>

                        <button
                          onClick={() => handleStatusChange(student.id, 'Late')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Late'
                              ? 'bg-amber-500 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-amber-50 hover:text-amber-700'
                          }`}
                        >
                          Late
                        </button>

                        <button
                          onClick={() => handleStatusChange(student.id, 'Excused')}
                          className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                            currentStatus === 'Excused'
                              ? 'bg-blue-600 text-white shadow-xs'
                              : 'bg-slate-100 text-slate-600 hover:bg-blue-50 hover:text-blue-700'
                          }`}
                        >
                          Excused
                        </button>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>
      )}

      {activeTab === 'monthly' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex items-center space-x-3">
              <span className="text-xs font-bold text-slate-700">Class:</span>
              <select
                value={selectedClass}
                onChange={(e) => setSelectedClass(e.target.value)}
                className="py-1.5 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
              >
                {INITIAL_CLASSES.map((c) => (
                  <option key={c} value={c}>
                    {c}
                  </option>
                ))}
              </select>
            </div>

            <button
              onClick={handleExportMonthly}
              className="px-3.5 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-800 font-semibold text-xs inline-flex items-center space-x-1.5"
            >
              <Download className="w-4 h-4 text-slate-600" />
              <span>Export Excel</span>
            </button>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                <tr>
                  <th className="p-3">Student Name</th>
                  <th className="p-3">Student ID</th>
                  <th className="p-3 text-center">Present</th>
                  <th className="p-3 text-center">Absent</th>
                  <th className="p-3 text-center">Late</th>
                  <th className="p-3 text-center">Excused</th>
                  <th className="p-3 text-right">Attendance Rate</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 text-slate-700">
                {monthlyData.map((m) => (
                  <tr key={m.studentId} className="hover:bg-slate-50">
                    <td className="p-3 font-semibold text-slate-900">{m.name}</td>
                    <td className="p-3 font-mono text-slate-500">{m.studentId}</td>
                    <td className="p-3 text-center font-bold text-emerald-600">{m.present}</td>
                    <td className="p-3 text-center font-bold text-rose-600">{m.absent}</td>
                    <td className="p-3 text-center font-bold text-amber-600">{m.late}</td>
                    <td className="p-3 text-center font-bold text-blue-600">{m.excused}</td>
                    <td className="p-3 text-right">
                      <span
                        className={`font-bold px-2 py-0.5 rounded-full text-[11px] ${
                          m.rate >= 85
                            ? 'bg-emerald-100 text-emerald-800'
                            : m.rate >= 70
                            ? 'bg-amber-100 text-amber-800'
                            : 'bg-rose-100 text-rose-800'
                        }`}
                      >
                        {m.rate}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
};
