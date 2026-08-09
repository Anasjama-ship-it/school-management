import React, { useState } from 'react';
import {
  FileSpreadsheet,
  Plus,
  Search,
  BookOpen,
  Award,
  Download,
  Printer,
  CheckCircle2,
  XCircle,
  X,
  FileText,
  Trash2
} from 'lucide-react';
import { Student, Exam, ExamResult } from '../../types';
import { INITIAL_CLASSES, ALL_SUBJECTS } from '../../lib/seedData';
import { generateReportCardPDF, exportToExcel } from '../../lib/exportUtils';

interface ExamsModuleProps {
  students: Student[];
  exams: Exam[];
  examResults: ExamResult[];
  onCreateExam: (exam: Omit<Exam, 'id'>) => Promise<void>;
  onSaveResult: (result: Omit<ExamResult, 'id'>) => Promise<void>;
  onDeleteExam?: (exam: Exam) => Promise<void>;
  onDeleteExamResult?: (result: ExamResult) => Promise<void>;
  canEdit: boolean;
}

export const ExamsModule: React.FC<ExamsModuleProps> = ({
  students,
  exams,
  examResults,
  onCreateExam,
  onSaveResult,
  onDeleteExam,
  onDeleteExamResult,
  canEdit
}) => {
  const [activeTab, setActiveTab] = useState<'gradebook' | 'exams' | 'reportcards'>('gradebook');

  // Gradebook Selection
  const [selectedExamId, setSelectedExamId] = useState(exams[0]?.id || 'EXM-FIRST-TERM');
  const [selectedClass, setSelectedClass] = useState('Grade 10A');

  // Mark Entry Local State
  const classStudents = students.filter((s) => s.gradeClass === selectedClass);
  const [marksState, setMarksState] = useState<Record<string, Record<string, number>>>({});

  // Modal States
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [newExamForm, setNewExamForm] = useState<Omit<Exam, 'id'>>({
    title: 'Final Examinations 2026',
    term: 'Term 2',
    academicYear: '2025-2026',
    startDate: '2026-06-01',
    endDate: '2026-06-15',
    gradeClasses: ['Grade 10A', 'Grade 10B'],
    subjects: ['Mathematics', 'Physics', 'Chemistry', 'English Language'],
    status: 'Upcoming'
  });

  const activeExam = exams.find((e) => e.id === selectedExamId) || exams[0];

  const handleMarkChange = (studentId: string, subject: string, val: number) => {
    const clamped = Math.max(0, Math.min(100, val));
    setMarksState((prev) => ({
      ...prev,
      [studentId]: {
        ...(prev[studentId] || {}),
        [subject]: clamped
      }
    }));
  };

  const calculateGrade = (avg: number) => {
    if (avg >= 90) return 'A+';
    if (avg >= 80) return 'A';
    if (avg >= 70) return 'B';
    if (avg >= 60) return 'C';
    if (avg >= 50) return 'D';
    return 'F';
  };

  const handleSaveGradebook = async (studentId: string, studentName: string) => {
    const subjectMarks = marksState[studentId] || {
      Mathematics: 85,
      Physics: 80,
      Chemistry: 82,
      'English Language': 90
    };

    const marksArray: number[] = Object.values(subjectMarks);
    const totalMarks: number = marksArray.reduce((a: number, b: number) => a + b, 0);
    const maxPossible: number = (marksArray.length || 1) * 100;
    const average: number = totalMarks / (marksArray.length || 1);
    const grade = calculateGrade(average);

    const result: Omit<ExamResult, 'id'> = {
      examId: activeExam?.id || 'EXM-FIRST-TERM',
      examTitle: activeExam?.title || 'First Term Assessment 2026',
      studentId,
      studentName,
      gradeClass: selectedClass,
      subjectMarks,
      totalMarks,
      maxPossible,
      average,
      grade,
      position: 1,
      resultStatus: average >= 50 ? 'Pass' : 'Fail',
      teacherRemarks:
        average >= 80
          ? 'Outstanding academic performance with strong subject understanding.'
          : 'Satisfactory effort. Keep working on weak areas.'
    };

    await onSaveResult(result);
    alert(`Gradebook saved for ${studentName}!`);
  };

  const handleCreateExamSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    await onCreateExam(newExamForm);
    setIsExamModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Sub-Nav Bar */}
      <div className="flex border-b border-slate-200 bg-white px-4 pt-3 rounded-2xl border shadow-2xs space-x-6 text-xs font-semibold text-slate-500">
        <button
          onClick={() => setActiveTab('gradebook')}
          className={`pb-3 border-b-2 ${
            activeTab === 'gradebook'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Gradebook / Mark Entry
        </button>
        <button
          onClick={() => setActiveTab('exams')}
          className={`pb-3 border-b-2 ${
            activeTab === 'exams'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Examinations Schedule
        </button>
        <button
          onClick={() => setActiveTab('reportcards')}
          className={`pb-3 border-b-2 ${
            activeTab === 'reportcards'
              ? 'border-blue-600 text-blue-600 font-bold'
              : 'border-transparent hover:text-slate-800'
          }`}
        >
          Student Report Cards
        </button>
      </div>

      {/* TAB 1: GRADEBOOK MARK ENTRY */}
      {activeTab === 'gradebook' && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
            <div className="flex flex-wrap items-center gap-3">
              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Select Exam
                </label>
                <select
                  value={selectedExamId}
                  onChange={(e) => setSelectedExamId(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {exams.map((ex) => (
                    <option key={ex.id} value={ex.id}>
                      {ex.title} ({ex.term})
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-[10px] uppercase font-bold text-slate-400 mb-1">
                  Select Class
                </label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-semibold"
                >
                  {INITIAL_CLASSES.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div className="text-xs text-slate-500">
              Auto-calculates <span className="font-bold text-blue-600">Total, Avg %, Grade & Pass/Fail</span>
            </div>
          </div>

          <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-xs">
                <thead className="bg-slate-50 text-slate-500 font-semibold border-b border-slate-200">
                  <tr>
                    <th className="p-3">Student</th>
                    <th className="p-3">Math</th>
                    <th className="p-3">Physics</th>
                    <th className="p-3">Chemistry</th>
                    <th className="p-3">English</th>
                    <th className="p-3 text-center">Avg %</th>
                    <th className="p-3 text-center">Grade</th>
                    <th className="p-3 text-right">Save</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-100">
                  {classStudents.map((stu) => {
                    const studentMarks = marksState[stu.id] || {
                      Mathematics: 88,
                      Physics: 82,
                      Chemistry: 85,
                      'English Language': 90
                    };
                    const vals: number[] = Object.values(studentMarks);
                    const avg = Math.round(vals.reduce((a: number, b: number) => a + b, 0) / (vals.length || 1));
                    const grade = calculateGrade(avg);

                    return (
                      <tr key={stu.id} className="hover:bg-slate-50">
                        <td className="p-3 font-bold text-slate-900">
                          {stu.fullName}
                          <div className="text-[10px] font-mono text-slate-400">{stu.studentId}</div>
                        </td>

                        {['Mathematics', 'Physics', 'Chemistry', 'English Language'].map((sub) => (
                          <td key={sub} className="p-3">
                            <input
                              type="number"
                              min={0}
                              max={100}
                              value={studentMarks[sub] ?? 85}
                              onChange={(e) => handleMarkChange(stu.id, sub, Number(e.target.value))}
                              className="w-16 px-2 py-1 bg-slate-50 border border-slate-200 rounded-lg font-mono text-center font-semibold text-slate-800"
                            />
                          </td>
                        ))}

                        <td className="p-3 text-center font-bold text-blue-600">{avg}%</td>

                        <td className="p-3 text-center font-bold">
                          <span className="px-2 py-0.5 bg-blue-100 text-blue-800 rounded-md">
                            {grade}
                          </span>
                        </td>

                        <td className="p-3 text-right">
                          {canEdit && (
                            <button
                              onClick={() => handleSaveGradebook(stu.studentId, stu.fullName)}
                              className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-semibold text-[11px]"
                            >
                              Save
                            </button>
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: EXAMS SCHEDULE */}
      {activeTab === 'exams' && (
        <div className="space-y-4">
          <div className="flex justify-between items-center bg-white p-4 rounded-2xl border shadow-2xs">
            <h3 className="font-bold text-slate-800 text-sm">Scheduled Examinations</h3>
            {canEdit && (
              <button
                onClick={() => setIsExamModalOpen(true)}
                className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center space-x-1.5"
              >
                <Plus className="w-4 h-4" />
                <span>Create Exam</span>
              </button>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {exams.map((exam) => (
              <div key={exam.id} className="bg-white rounded-2xl border p-5 shadow-2xs space-y-2 relative group">
                <div className="flex justify-between items-start">
                  <h4 className="font-bold text-slate-900 text-sm">{exam.title}</h4>
                  <div className="flex items-center space-x-2">
                    <span className="px-2.5 py-0.5 rounded-full bg-blue-100 text-blue-800 text-[10px] font-bold">
                      {exam.status}
                    </span>
                    {canEdit && onDeleteExam && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete exam "${exam.title}"? This record will be moved to Trash.`
                            )
                          ) {
                            onDeleteExam(exam);
                          }
                        }}
                        className="p-1 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Exam"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
                <div className="text-xs text-slate-500 font-medium">
                  Term: {exam.term} • Year: {exam.academicYear}
                </div>
                <div className="text-xs text-slate-600">
                  Dates: {exam.startDate} to {exam.endDate}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* TAB 3: REPORT CARDS */}
      {activeTab === 'reportcards' && (
        <div className="bg-white rounded-2xl border p-5 shadow-2xs space-y-4">
          <h3 className="font-bold text-slate-800 text-sm">Published Student Report Cards</h3>
          <div className="divide-y divide-slate-100">
            {examResults.map((res) => {
              const studentObj = students.find((s) => s.studentId === res.studentId || s.fullName === res.studentName);
              return (
                <div key={res.id} className="py-3 flex items-center justify-between">
                  <div>
                    <div className="font-bold text-slate-900 text-xs">{res.studentName || 'Student'}</div>
                    <div className="text-[11px] text-slate-500">
                      {res.examTitle} • Class: {res.gradeClass} • Average: {res.average}% • Grade: {res.grade}
                    </div>
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => generateReportCardPDF(res, studentObj)}
                      className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs inline-flex items-center space-x-1.5"
                    >
                      <Download className="w-3.5 h-3.5" />
                      <span>Download Report Card PDF</span>
                    </button>
                    {canEdit && onDeleteExamResult && (
                      <button
                        onClick={() => {
                          if (
                            confirm(
                              `Are you sure you want to delete report card for ${res.studentName}? This will be moved to Trash.`
                            )
                          ) {
                            onDeleteExamResult(res);
                          }
                        }}
                        className="p-1.5 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors"
                        title="Delete Report Card"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Create Exam Modal */}
      {isExamModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs">
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl">
            <div className="flex justify-between items-center pb-3 border-b">
              <h3 className="font-bold text-slate-900 text-base">Create Exam Schedule</h3>
              <button onClick={() => setIsExamModalOpen(false)}>
                <X className="w-5 h-5 text-slate-400" />
              </button>
            </div>

            <form onSubmit={handleCreateExamSubmit} className="space-y-3 pt-3">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1">Exam Title</label>
                <input
                  type="text"
                  required
                  value={newExamForm.title}
                  onChange={(e) => setNewExamForm({ ...newExamForm, title: e.target.value })}
                  className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                />
              </div>

              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Term</label>
                  <input
                    type="text"
                    value={newExamForm.term}
                    onChange={(e) => setNewExamForm({ ...newExamForm, term: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
                <div>
                  <label className="block text-xs font-semibold text-slate-700 mb-1">Academic Year</label>
                  <input
                    type="text"
                    value={newExamForm.academicYear}
                    onChange={(e) => setNewExamForm({ ...newExamForm, academicYear: e.target.value })}
                    className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs"
                  />
                </div>
              </div>

              <div className="pt-3 flex justify-end space-x-2">
                <button
                  type="button"
                  onClick={() => setIsExamModalOpen(false)}
                  className="px-4 py-2 border rounded-xl text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-5 py-2 bg-blue-600 text-white font-semibold text-xs rounded-xl"
                >
                  Save Exam
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};
