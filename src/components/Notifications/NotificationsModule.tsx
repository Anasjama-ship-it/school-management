import React, { useState } from 'react';
import {
  MessageSquare,
  Send,
  ExternalLink,
  CheckCircle2,
  Clock,
  AlertTriangle,
  User,
  Phone,
  Sparkles,
  FileText,
  Trash2
} from 'lucide-react';
import { Student, NotificationLog, NotificationChannel, NotificationType } from '../../types';

interface NotificationsModuleProps {
  students: Student[];
  notifications: NotificationLog[];
  onSendNotification: (notif: Omit<NotificationLog, 'id'>) => Promise<void>;
  onDeleteNotification?: (notif: NotificationLog) => Promise<void>;
  currentUserRole: string;
}

export const NotificationsModule: React.FC<NotificationsModuleProps> = ({
  students,
  notifications,
  onSendNotification,
  onDeleteNotification,
  currentUserRole
}) => {
  const [selectedStudentId, setSelectedStudentId] = useState(students[0]?.studentId || '');
  const [channel, setChannel] = useState<NotificationChannel>('WhatsApp');
  const [notificationType, setNotificationType] = useState<NotificationType>('Absence');
  const [customMessage, setCustomMessage] = useState('');
  const [isSending, setIsSending] = useState(false);

  const selectedStudent = students.find((s) => s.studentId === selectedStudentId || s.id === selectedStudentId);

  // Template message generator
  const getTemplateText = (type: NotificationType, student?: Student) => {
    const name = student?.fullName || 'the student';
    const parent = student?.parentName || 'Parent';

    switch (type) {
      case 'Absence':
        return `Dear ${parent}, please be informed that ${name} was marked ABSENT today from Springfield Academy. Please contact the school if this is an excused leave.`;
      case 'Unpaid Fee':
        return `Dear ${parent}, this is a gentle reminder that ${name} has an outstanding school fee balance. Kindly make the payment at your earliest convenience to avoid administrative delay.`;
      case 'Payment Receipt':
        return `Dear ${parent}, fee payment for ${name} has been received with thanks. Your official payment receipt is generated and stored in your portal.`;
      case 'Exam Result':
        return `Dear ${parent}, examination results for ${name} have been published. Log into the student portal or view report card PDF for details.`;
      case 'Announcement':
        return `Dear Parents, Springfield Academy will hold a parent-teacher meeting next Friday at 10:00 AM. Your attendance is highly requested.`;
      default:
        return '';
    }
  };

  const handleTemplateSelect = (type: NotificationType) => {
    setNotificationType(type);
    setCustomMessage(getTemplateText(type, selectedStudent));
  };

  const handleSend = async () => {
    if (!selectedStudent) {
      alert('Please select a student first');
      return;
    }

    const msg = customMessage || getTemplateText(notificationType, selectedStudent);

    setIsSending(true);

    const notif: Omit<NotificationLog, 'id'> = {
      studentId: selectedStudent.studentId,
      studentName: selectedStudent.fullName,
      parentPhone: selectedStudent.parentPhone,
      channel,
      type: notificationType,
      message: msg,
      sentAt: new Date().toLocaleString(),
      status: 'Delivered',
      sentBy: currentUserRole || 'Admin'
    };

    await onSendNotification(notif);
    setIsSending(false);

    // If WhatsApp channel, launch wa.me
    if (channel === 'WhatsApp') {
      const cleanPhone = selectedStudent.parentPhone.replace(/[^0-9]/g, '');
      const encodedMsg = encodeURIComponent(msg);
      window.open(`https://wa.me/${cleanPhone}?text=${encodedMsg}`, '_blank');
    } else {
      alert(`SMS notification sent to ${selectedStudent.parentPhone}!`);
    }
  };

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left Column: Composer Form (1 col) */}
        <div className="lg:col-span-1 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs space-y-4">
          <div className="flex items-center space-x-2 border-b border-slate-100 pb-3">
            <MessageSquare className="w-5 h-5 text-blue-600" />
            <h3 className="font-bold text-slate-900 text-sm">Compose Parent Alert</h3>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Select Student</label>
            <select
              value={selectedStudentId}
              onChange={(e) => {
                setSelectedStudentId(e.target.value);
                const s = students.find((st) => st.studentId === e.target.value);
                setCustomMessage(getTemplateText(notificationType, s));
              }}
              className="w-full px-3 py-2 bg-slate-50 border rounded-xl text-xs font-medium"
            >
              {students.map((stu) => (
                <option key={stu.id} value={stu.studentId}>
                  {stu.fullName} ({stu.parentPhone})
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Communication Channel
            </label>
            <div className="grid grid-cols-2 gap-2">
              <button
                type="button"
                onClick={() => setChannel('WhatsApp')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  channel === 'WhatsApp'
                    ? 'bg-emerald-600 text-white border-emerald-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                WhatsApp Direct
              </button>
              <button
                type="button"
                onClick={() => setChannel('SMS')}
                className={`py-2 px-3 rounded-xl text-xs font-bold transition-all border ${
                  channel === 'SMS'
                    ? 'bg-blue-600 text-white border-blue-600 shadow-sm'
                    : 'bg-slate-50 text-slate-700 border-slate-200'
                }`}
              >
                Standard SMS
              </button>
            </div>
          </div>

          {/* Quick Preset Templates */}
          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">
              Message Template Trigger
            </label>
            <div className="flex flex-wrap gap-1.5">
              {(['Absence', 'Unpaid Fee', 'Payment Receipt', 'Exam Result', 'Announcement'] as NotificationType[]).map(
                (type) => (
                  <button
                    key={type}
                    type="button"
                    onClick={() => handleTemplateSelect(type)}
                    className={`px-2.5 py-1 rounded-lg text-[11px] font-semibold border transition-all ${
                      notificationType === type
                        ? 'bg-blue-50 text-blue-700 border-blue-300'
                        : 'bg-slate-50 text-slate-600 border-slate-200 hover:bg-slate-100'
                    }`}
                  >
                    {type}
                  </button>
                )
              )}
            </div>
          </div>

          <div>
            <label className="block text-xs font-semibold text-slate-700 mb-1">Message Content</label>
            <textarea
              rows={4}
              value={customMessage || getTemplateText(notificationType, selectedStudent)}
              onChange={(e) => setCustomMessage(e.target.value)}
              className="w-full p-3 bg-slate-50 border rounded-xl text-xs text-slate-800"
            />
          </div>

          <button
            onClick={handleSend}
            disabled={isSending}
            className="w-full py-2.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold text-xs rounded-xl shadow-md inline-flex items-center justify-center space-x-2"
          >
            <Send className="w-4 h-4" />
            <span>
              {channel === 'WhatsApp' ? 'Launch WhatsApp & Send' : 'Send SMS Alert'}
            </span>
          </button>
        </div>

        {/* Right Column: Sent Logs History (2 cols) */}
        <div className="lg:col-span-2 bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs">
          <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
            <h3 className="font-bold text-slate-900 text-sm">Parent Communication History</h3>
            <span className="text-xs text-slate-400 font-mono">
              Total Logged: {notifications.length}
            </span>
          </div>

          <div className="space-y-3">
            {notifications.length === 0 ? (
              <div className="p-8 text-center text-slate-400 text-xs italic">
                No notification history recorded yet. Use the composer to send WhatsApp or SMS alerts.
              </div>
            ) : (
              notifications.map((notif) => (
                <div
                  key={notif.id}
                  className="p-3.5 rounded-xl bg-slate-50 border border-slate-200/60 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs"
                >
                  <div className="space-y-1">
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900">{notif.studentName || 'Parent'}</span>
                      <span className="font-mono text-slate-400 text-[11px]">{notif.parentPhone}</span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-bold ${
                          notif.channel === 'WhatsApp'
                            ? 'bg-emerald-100 text-emerald-800'
                            : 'bg-blue-100 text-blue-800'
                        }`}
                      >
                        {notif.channel}
                      </span>
                    </div>
                    <p className="text-slate-600 text-xs italic">"{notif.message}"</p>
                    <div className="text-[10px] text-slate-400">
                      Sent by {notif.sentBy} • {notif.sentAt}
                    </div>
                  </div>

                  <div className="flex items-center space-x-2 self-start sm:self-center">
                    <span className="px-2.5 py-1 rounded-full bg-emerald-100 text-emerald-800 text-[10px] font-bold">
                      {notif.status}
                    </span>
                    {onDeleteNotification && (
                      <button
                        onClick={() => {
                          if (confirm(`Move notification for "${notif.studentName || 'Parent'}" to Trash?`)) {
                            onDeleteNotification(notif);
                          }
                        }}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors title='Delete notification'"
                        title="Delete notification"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
