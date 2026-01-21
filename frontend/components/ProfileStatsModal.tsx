import React from 'react';
import { X, Clock, ListChecks, BookOpen } from 'lucide-react';

type ProfileStatsModalProps = {
  isOpen: boolean;
  theme: 'light' | 'dark';
  username: string;
  totalTimeLabel: string;
  sessionTimeLabel: string;
  sourcesCount: number;
  notesCount: number;
  materialsTotal: number;
  materialsByType: Record<string, number>;
  onClose: () => void;
};

const ProfileStatsModal: React.FC<ProfileStatsModalProps> = ({
  isOpen,
  theme,
  username,
  totalTimeLabel,
  sessionTimeLabel,
  sourcesCount,
  notesCount,
  materialsTotal,
  materialsByType,
  onClose
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const panelBase = isDark
    ? 'bg-[#1e1e1e] border-gray-800 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const cardBase = isDark ? 'bg-[#252525] border-gray-800' : 'bg-gray-50 border-gray-200';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden border ${panelBase}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-gray-200'}`}>
          <div>
            <h3 className="font-bold">Profil statistikasi</h3>
            <p className={`text-xs ${subText}`}>{username}</p>
          </div>
          <button onClick={onClose} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div className={`rounded-xl border p-4 ${cardBase}`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <Clock size={14} />
                Vaqt
              </div>
              <div className="mt-2 text-sm font-semibold">Jami: {totalTimeLabel}</div>
              <div className={`text-xs ${subText}`}>Sessiya: {sessionTimeLabel}</div>
            </div>

            <div className={`rounded-xl border p-4 ${cardBase}`}>
              <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
                <BookOpen size={14} />
                Manbalar
              </div>
              <div className="mt-2 text-sm font-semibold">Jami: {sourcesCount} ta</div>
              <div className={`text-xs ${subText}`}>Qaydlar: {notesCount} ta</div>
            </div>
          </div>

          <div className={`rounded-xl border p-4 ${cardBase}`}>
            <div className="flex items-center gap-2 text-xs font-bold uppercase tracking-widest">
              <ListChecks size={14} />
              Bajarilganlar
            </div>
            <div className="mt-2 text-sm font-semibold">Jami: {materialsTotal} ta</div>
            <div className="mt-3 grid grid-cols-2 sm:grid-cols-3 gap-2 text-xs">
              {Object.entries(materialsByType).map(([label, count]) => (
                <div key={label} className={`rounded-lg border px-3 py-2 ${isDark ? 'border-gray-800 bg-black/20' : 'border-gray-200 bg-white'}`}>
                  <div className={`uppercase tracking-widest ${subText}`}>{label}</div>
                  <div className="font-semibold">{count}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProfileStatsModal;
