import React, { useState } from 'react';
import {
  Trash2,
  RotateCcw,
  Search,
  Filter,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  FileText,
  User,
  GraduationCap,
  Users,
  CalendarCheck,
  CreditCard,
  FileSpreadsheet,
  MessageSquare,
  ShieldCheck,
  RefreshCw
} from 'lucide-react';
import { TrashItem } from '../../types';

interface TrashModuleProps {
  trashItems: TrashItem[];
  onRestore: (item: TrashItem) => Promise<void>;
  onDeletePermanently: (trashId: string) => Promise<void>;
  onEmptyTrash: () => Promise<void>;
  canManageTrash: boolean;
}

export const TrashModule: React.FC<TrashModuleProps> = ({
  trashItems,
  onRestore,
  onDeletePermanently,
  onEmptyTrash,
  canManageTrash
}) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedType, setSelectedType] = useState('All');
  const [isProcessing, setIsProcessing] = useState(false);

  const entityTypes = ['All', 'Student', 'Teacher', 'Attendance', 'Fee Payment', 'Fee Structure', 'Exam', 'Exam Result', 'Notification'];

  const filteredItems = trashItems.filter((item) => {
    const matchesSearch =
      item.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (item.subtitle && item.subtitle.toLowerCase().includes(searchTerm.toLowerCase())) ||
      item.entityType.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesType = selectedType === 'All' || item.entityType === selectedType;
    return matchesSearch && matchesType;
  });

  const getEntityIcon = (type: string) => {
    switch (type) {
      case 'Student':
        return <GraduationCap className="w-4 h-4 text-blue-600" />;
      case 'Teacher':
        return <Users className="w-4 h-4 text-purple-600" />;
      case 'Attendance':
        return <CalendarCheck className="w-4 h-4 text-emerald-600" />;
      case 'Fee Payment':
      case 'Fee Structure':
        return <CreditCard className="w-4 h-4 text-amber-600" />;
      case 'Exam':
      case 'Exam Result':
        return <FileSpreadsheet className="w-4 h-4 text-indigo-600" />;
      case 'Notification':
        return <MessageSquare className="w-4 h-4 text-pink-600" />;
      default:
        return <FileText className="w-4 h-4 text-slate-600" />;
    }
  };

  const handleRestoreClick = async (item: TrashItem) => {
    if (confirm(`Are you sure you want to restore "${item.title}" to its original location?`)) {
      setIsProcessing(true);
      try {
        await onRestore(item);
        alert(`"${item.title}" has been restored successfully!`);
      } catch (err) {
        console.error(err);
        alert('Failed to restore item.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleDeletePermanentClick = async (item: TrashItem) => {
    if (
      confirm(
        `Are you sure you want to PERMANENTLY delete "${item.title}"?\n\nWARNING: This action CANNOT be undone.`
      )
    ) {
      setIsProcessing(true);
      try {
        await onDeletePermanently(item.id);
        alert(`"${item.title}" permanently deleted.`);
      } catch (err) {
        console.error(err);
        alert('Failed to delete item permanently.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  const handleEmptyTrashClick = async () => {
    if (trashItems.length === 0) return;
    if (
      confirm(
        `Are you sure you want to EMPTY the entire Trash (${trashItems.length} items)?\n\nWARNING: All deleted items will be PERMANENTLY removed and cannot be recovered.`
      )
    ) {
      setIsProcessing(true);
      try {
        await onEmptyTrash();
        alert('Trash emptied successfully.');
      } catch (err) {
        console.error(err);
        alert('Failed to empty trash.');
      } finally {
        setIsProcessing(false);
      }
    }
  };

  return (
    <div className="space-y-6">
      {/* Header Banner */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-2xs flex flex-col md:flex-row md:items-center justify-between gap-4">
        <div>
          <div className="flex items-center space-x-2">
            <div className="w-9 h-9 rounded-xl bg-rose-100 flex items-center justify-center text-rose-600 font-bold">
              <Trash2 className="w-5 h-5" />
            </div>
            <div>
              <h2 className="font-bold text-slate-900 text-lg">Trash / Recycle Bin</h2>
              <p className="text-xs text-slate-500">
                Deleted records are safely archived here. Restore them anytime or permanently delete them.
              </p>
            </div>
          </div>
        </div>

        <div className="flex items-center space-x-3">
          <span className="text-xs font-semibold px-3 py-1.5 rounded-xl bg-slate-100 text-slate-700">
            {trashItems.length} Items Trashed
          </span>

          {canManageTrash && trashItems.length > 0 && (
            <button
              onClick={handleEmptyTrashClick}
              disabled={isProcessing}
              className="px-4 py-2 bg-rose-600 hover:bg-rose-700 disabled:opacity-50 text-white font-semibold text-xs rounded-xl shadow-sm inline-flex items-center space-x-1.5 transition-all"
            >
              <Trash2 className="w-4 h-4" />
              <span>Empty Trash</span>
            </button>
          )}
        </div>
      </div>

      {/* Filter and Search Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/80 shadow-2xs">
        <div className="relative flex-1 min-w-[200px]">
          <Search className="w-4 h-4 absolute left-3 top-3 text-slate-400" />
          <input
            type="text"
            placeholder="Search trashed records..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800"
          />
        </div>

        <div className="flex items-center space-x-2">
          <Filter className="w-4 h-4 text-slate-400" />
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value)}
            className="py-2 px-3 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700"
          >
            {entityTypes.map((t) => (
              <option key={t} value={t}>
                {t === 'All' ? 'All Entity Types' : t}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Trashed Items List */}
      <div className="bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden">
        {filteredItems.length === 0 ? (
          <div className="p-12 text-center space-y-3">
            <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 flex items-center justify-center mx-auto">
              <CheckCircle2 className="w-6 h-6 text-emerald-500" />
            </div>
            <h4 className="font-bold text-slate-800 text-sm">Recycle Bin is Empty</h4>
            <p className="text-xs text-slate-400 max-w-sm mx-auto">
              No soft-deleted records found. When records are deleted from Students, Teachers, Fees or Exams, they will appear here.
            </p>
          </div>
        ) : (
          <div className="divide-y divide-slate-100">
            {filteredItems.map((item) => (
              <div
                key={item.id}
                className="p-4 hover:bg-slate-50/80 transition-colors flex flex-col sm:flex-row sm:items-center justify-between gap-4 text-xs"
              >
                <div className="flex items-start space-x-3">
                  <div className="p-2.5 rounded-xl bg-slate-100 border border-slate-200/80 mt-0.5">
                    {getEntityIcon(item.entityType)}
                  </div>
                  <div>
                    <div className="flex items-center space-x-2">
                      <span className="font-bold text-slate-900 text-sm">{item.title}</span>
                      <span className="px-2 py-0.5 rounded-md bg-slate-100 text-slate-600 font-semibold text-[10px]">
                        {item.entityType}
                      </span>
                    </div>
                    {item.subtitle && <p className="text-slate-500 text-xs mt-0.5">{item.subtitle}</p>}
                    <div className="text-[10px] text-slate-400 mt-1 font-mono">
                      Deleted: {item.deletedAt} • By: {item.deletedBy}
                    </div>
                  </div>
                </div>

                <div className="flex items-center space-x-2 self-end sm:self-center">
                  <button
                    onClick={() => handleRestoreClick(item)}
                    disabled={isProcessing}
                    className="px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 border border-blue-200 font-bold text-xs inline-flex items-center space-x-1.5 transition-all"
                    title="Restore Record"
                  >
                    <RotateCcw className="w-3.5 h-3.5" />
                    <span>Restore</span>
                  </button>

                  {canManageTrash && (
                    <button
                      onClick={() => handleDeletePermanentClick(item)}
                      disabled={isProcessing}
                      className="px-3 py-1.5 rounded-xl bg-rose-50 text-rose-700 hover:bg-rose-100 border border-rose-200 font-bold text-xs inline-flex items-center space-x-1.5 transition-all"
                      title="Delete Permanently"
                    >
                      <XCircle className="w-3.5 h-3.5" />
                      <span>Delete Permanently</span>
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};
