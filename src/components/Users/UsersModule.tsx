import React from 'react';
import { ShieldCheck, UserCheck, Lock, CheckCircle2, XCircle, KeyRound, Sparkles } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { UserRole } from '../../types';

export const UsersModule: React.FC = () => {
  const { activeRole, switchRole, userProfile } = useAuth();

  const permissionMatrix = [
    {
      feature: 'View Dashboard & Stat Summary',
      Admin: true,
      Teacher: true,
      Accountant: true
    },
    {
      feature: 'Manage Students (Add/Edit/Delete)',
      Admin: true,
      Teacher: false,
      Accountant: false
    },
    {
      feature: 'Manage Faculty & Teachers',
      Admin: true,
      Teacher: false,
      Accountant: false
    },
    {
      feature: 'Mark & Save Class Attendance',
      Admin: true,
      Teacher: true,
      Accountant: false
    },
    {
      feature: 'Record School Fees & Print Receipts',
      Admin: true,
      Teacher: false,
      Accountant: true
    },
    {
      feature: 'Set Fee Structures & Fee Reports',
      Admin: true,
      Teacher: false,
      Accountant: true
    },
    {
      feature: 'Enter Exam Marks & Generate Report Cards',
      Admin: true,
      Teacher: true,
      Accountant: false
    },
    {
      feature: 'Send Parent SMS / WhatsApp Alerts',
      Admin: true,
      Teacher: true,
      Accountant: true
    },
    {
      feature: 'System Configuration & User Management',
      Admin: true,
      Teacher: false,
      Accountant: false
    }
  ];

  return (
    <div className="space-y-6">
      {/* Active Role Control Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-purple-50 text-purple-700 border border-purple-200 text-xs font-semibold mb-2">
              <Sparkles className="w-3.5 h-3.5 text-purple-600" />
              <span>Role-Based Access Control (RBAC)</span>
            </div>
            <h3 className="text-xl font-bold text-slate-900">Current Role Mode: {activeRole}</h3>
            <p className="text-xs text-slate-500 mt-1 max-w-xl">
              Switch roles below to test how the sidebar, action buttons, and permission boundaries adapt dynamically for Admin, Teacher, and Accountant.
            </p>
          </div>

          <div className="flex items-center space-x-2">
            {(['Admin', 'Teacher', 'Accountant'] as UserRole[]).map((r) => (
              <button
                key={r}
                id={`user-module-switch-${r.toLowerCase()}`}
                onClick={() => switchRole(r)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                  activeRole === r
                    ? 'bg-blue-600 text-white shadow-md'
                    : 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                }`}
              >
                Switch to {r}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Permission Matrix Table */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
        <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
          <ShieldCheck className="w-5 h-5 text-blue-600" />
          <h3 className="font-bold text-slate-900 text-base">Role Access & Permission Matrix</h3>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs">
            <thead className="bg-slate-50 text-slate-500 uppercase tracking-wider font-semibold border-b border-slate-200">
              <tr>
                <th className="py-3 px-4">System Feature / Capability</th>
                <th className="py-3 px-4 text-center">Admin</th>
                <th className="py-3 px-4 text-center">Teacher</th>
                <th className="py-3 px-4 text-center">Accountant</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {permissionMatrix.map((item, idx) => (
                <tr key={idx} className="hover:bg-slate-50">
                  <td className="py-3 px-4 font-semibold text-slate-800">{item.feature}</td>

                  <td className="py-3 px-4 text-center">
                    {item.Admin ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.Teacher ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                    )}
                  </td>

                  <td className="py-3 px-4 text-center">
                    {item.Accountant ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500 mx-auto" />
                    ) : (
                      <XCircle className="w-5 h-5 text-slate-300 mx-auto" />
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};
