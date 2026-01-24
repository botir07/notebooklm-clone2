
import React, { useState } from 'react';
import { 
  Trash2, 
  HelpCircle, 
  BarChart3, 
  CopyPlus, 
  MonitorPlay, 
  FileText, 
  Network, 
  Loader2,
  PanelRightClose,
  PanelRightOpen,
  Pencil,
  Lock,
  Check,
  X,
  Sparkles,
  CheckCircle
} from 'lucide-react';
import { Note, StudyMaterialType } from '../types';

interface NotesPanelProps {
  notes: Note[];
  onRemoveNote: (id: string) => void;
  onGenerateAction: (type: StudyMaterialType) => void;
  onOpenNote: (note: Note) => void;
  theme: 'light' | 'dark';
  onOpenManualNote: () => void;
  generatingMaterials: Set<StudyMaterialType>;
  isOpen: boolean;
  onToggle: () => void;
  isSourcesActive: boolean;
  onCompleteTopic: () => void;
}

const NotesPanel: React.FC<NotesPanelProps> = ({ 
  notes, 
  onRemoveNote, 
  onGenerateAction, 
  onOpenNote,
  theme,
  onOpenManualNote,
  generatingMaterials,
  isOpen,
  onToggle,
  isSourcesActive,
  onCompleteTopic
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);
  const isDark = theme === 'dark';
  const isQuizGenerating = generatingMaterials.has('quiz');

  const actions = [
    { type: 'mindmap' as StudyMaterialType, label: 'Aqliy xarita', icon: <Network size={18} />, color: 'text-green-500', bgColor: isDark ? 'bg-[#1a221a]' : 'bg-[#1a3a1a]', borderColor: 'border-green-500/20' },
    { type: 'quiz' as StudyMaterialType, label: 'Test', icon: <HelpCircle size={18} />, color: 'text-purple-400', bgColor: isDark ? 'bg-[#201a25]' : 'bg-[#2a1a3a]', borderColor: 'border-purple-500/20' },
    { type: 'presentation' as StudyMaterialType, label: 'Taqdimot', icon: <MonitorPlay size={18} />, color: 'text-blue-400', bgColor: isDark ? 'bg-[#1a1e25]' : 'bg-[#1a2a4a]', borderColor: 'border-blue-500/20' },
    { type: 'infographic' as StudyMaterialType, label: 'Infografika', icon: <BarChart3 size={18} />, color: 'text-teal-400', bgColor: isDark ? 'bg-[#1a2222]' : 'bg-[#1a3a3a]', borderColor: 'border-teal-500/20' },
    { type: 'reminders' as StudyMaterialType, label: 'Xulosa', icon: <Sparkles size={18} />, color: 'text-indigo-300', bgColor: isDark ? 'bg-[#1a1a25]' : 'bg-[#1a1a3a]', borderColor: 'border-indigo-500/20' },
    { type: 'flashcard' as StudyMaterialType, label: 'Kartochka', icon: <CopyPlus size={18} />, color: 'text-orange-400', bgColor: isDark ? 'bg-[#251e1a]' : 'bg-[#4a2a1a]', borderColor: 'border-orange-500/20' },
  ];
  const completeAction = {
    label: 'Mavzu tugatildi',
    icon: <CheckCircle size={18} />,
    color: 'text-emerald-400',
    bgColor: isDark ? 'bg-[#152320]' : 'bg-[#143a2f]',
  };

  const getNoteIcon = (type?: StudyMaterialType) => {
    switch (type) {
      case 'mindmap': return { icon: <Network size={18} />, color: 'text-green-500', bg: 'bg-[#1a221a]' };
      case 'quiz': return { icon: <HelpCircle size={18} />, color: 'text-purple-400', bg: 'bg-[#201a25]' };
      case 'presentation': return { icon: <MonitorPlay size={18} />, color: 'text-blue-400', bg: 'bg-[#1a1e25]' };
      case 'infographic': return { icon: <BarChart3 size={18} />, color: 'text-teal-400', bg: 'bg-[#1a2222]' };
      case 'reminders': return { icon: <Sparkles size={18} />, color: 'text-indigo-300', bg: 'bg-[#1a1a25]' };
      case 'flashcard': return { icon: <CopyPlus size={18} />, color: 'text-orange-400', bg: 'bg-[#251e1a]' };
      case 'topicComplete': return { icon: <CheckCircle size={18} />, color: 'text-emerald-400', bg: 'bg-[#152320]' };
      default: return { icon: <FileText size={18} />, color: 'text-indigo-400', bg: 'bg-[#1a1a25]' };
    }
  };

  const panelBg = isDark ? 'bg-[#0f0f0f]' : 'bg-white';
  const borderColor = isDark ? 'border-white/5' : 'border-gray-200';
  const textColor = isDark ? 'text-gray-100' : 'text-gray-800';

  if (!isOpen) {
    return (
      <div className={`hidden md:flex h-full ${panelBg} border-l ${borderColor} w-[68px] flex-col items-center py-4 shrink-0 transition-all gap-6 shadow-xl`}>
        <button 
          onClick={onToggle}
          className={`p-2.5 rounded-xl transition-all ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
        >
          <PanelRightOpen size={20} />
        </button>
        <div className="flex-1 flex flex-col items-center gap-4 w-full px-2 overflow-y-auto custom-scrollbar">
          {actions.map((action) => {
            const isDisabled = !isSourcesActive;
            return (
              <button
                key={action.type}
                disabled={isDisabled}
                onClick={() => onGenerateAction(action.type)}
                className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all border border-white/5 shadow-sm active:scale-95 ${isDisabled ? 'bg-gray-800/20 text-gray-700 cursor-not-allowed opacity-50' : `${action.bgColor} ${action.color} hover:brightness-125`}`}
                title={isDisabled ? "Manba tanlanmagan" : action.label}
              >
                {isDisabled ? <Lock size={14} /> : (generatingMaterials.has(action.type) ? <Loader2 size={18} className="animate-spin" /> : action.icon)}
              </button>
            );
          })}
          <button
            disabled={!isSourcesActive}
            onClick={onCompleteTopic}
            className={`group relative flex items-center justify-center w-11 h-11 rounded-xl transition-all border border-white/5 shadow-sm active:scale-95 ${!isSourcesActive ? 'bg-gray-800/20 text-gray-700 cursor-not-allowed opacity-50' : `${completeAction.bgColor} ${completeAction.color} hover:brightness-125`}`}
            title={!isSourcesActive ? "Manba tanlanmagan" : completeAction.label}
          >
            {!isSourcesActive ? <Lock size={14} /> : (isQuizGenerating ? <Loader2 size={18} className="animate-spin" /> : completeAction.icon)}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className={`fixed inset-y-0 right-0 z-40 h-full ${panelBg} border-l ${borderColor} w-[90vw] sm:w-96 flex flex-col shrink-0 transition-all shadow-2xl md:relative md:z-auto md:w-96`}>
      <div className="px-5 py-4 flex items-center justify-between">
        <h3 className={`text-sm font-bold ${isDark ? 'text-gray-100' : 'text-gray-900'}`}>Daftar</h3>
        <button onClick={onToggle} className={`p-1.5 rounded-md transition-colors ${isDark ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}>
           <PanelRightClose size={18} />
        </button>
      </div>

      <div className="px-5 pt-2 flex items-center justify-between">
        <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Studio</h4>
        {!isSourcesActive && <span className="text-[9px] font-bold text-amber-500 flex items-center gap-1"><Lock size={10} /> MANBA TANLANG</span>}
      </div>

      <div className={`p-4 grid grid-cols-2 gap-2`}>
        {actions.map((action) => {
          const isDisabled = !isSourcesActive;
          return (
            <button
              key={action.type}
              disabled={isDisabled}
              onClick={() => onGenerateAction(action.type)}
              className={`flex items-center gap-2.5 p-3 rounded-xl text-[13px] font-bold transition-all border border-white/5 ${isDisabled ? 'bg-gray-800/10 text-gray-600 cursor-not-allowed' : `${action.bgColor} ${action.color} hover:brightness-110 active:scale-95`}`}
            >
              {isDisabled ? <Lock size={14} /> : (generatingMaterials.has(action.type) ? <Loader2 size={16} className="animate-spin" /> : action.icon)}
              <span className="truncate">{action.label}</span>
            </button>
          );
        })}
        <button
          disabled={!isSourcesActive}
          onClick={onCompleteTopic}
          className={`flex items-center gap-2.5 p-3 rounded-xl text-[13px] font-bold transition-all border border-white/5 ${!isSourcesActive ? 'bg-gray-800/10 text-gray-600 cursor-not-allowed' : `${completeAction.bgColor} ${completeAction.color} hover:brightness-110 active:scale-95`}`}
        >
          {!isSourcesActive ? <Lock size={14} /> : (isQuizGenerating ? <Loader2 size={16} className="animate-spin" /> : completeAction.icon)}
          <span className="truncate">{completeAction.label}</span>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto flex flex-col custom-scrollbar border-t border-white/5 mt-2">
        {notes.length === 0 ? (
          <div className="flex-1 flex flex-col items-center justify-center text-center px-10">
            <div className={`w-16 h-16 rounded-full flex items-center justify-center mb-6 ${isDark ? 'bg-[#1a1b1e]' : 'bg-gray-100'}`}>
              <Pencil size={24} className="text-gray-400" />
            </div>
            <p className={`text-[13px] font-medium max-w-[220px] leading-relaxed ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Notebookingiz bo'sh. Chatdan natijalarni saqlang.</p>
          </div>
        ) : (
          <div className="py-4">
            <div className="px-6 mb-4">
              <h4 className={`text-[10px] font-black uppercase tracking-[0.2em] ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>Ma'lumotlar ({notes.length})</h4>
            </div>
            <div className="space-y-1">
              {notes.map((note) => {
                const info = getNoteIcon(note.type);
                const isConfirming = confirmDeleteId === note.id;

                return (
                  <div 
                    key={note.id} 
                    onClick={() => !isConfirming && onOpenNote(note)} 
                    className={`group relative flex items-center gap-4 px-6 py-3.5 cursor-pointer transition-all ${isDark ? 'hover:bg-white/5' : 'hover:bg-gray-50'} ${isConfirming ? 'bg-red-500/5' : ''}`}
                  >
                    <div className={`flex-shrink-0 w-11 h-11 rounded-xl flex items-center justify-center ${info.bg} ${info.color} border border-white/5 shadow-sm`}>
                      {info.icon}
                    </div>
                    <div className="flex-1 min-w-0">
                      <h3 className={`text-[13px] font-bold truncate tracking-tight ${textColor}`}>{note.title}</h3>
                      <p className={`text-[11px] font-medium mt-0.5 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>{new Date(note.timestamp).toLocaleDateString()}</p>
                    </div>
                    
                    <div className="flex items-center gap-1">
                      {isConfirming ? (
                        <div className="flex items-center gap-1 animate-in slide-in-from-right-2">
                          <button 
                            onClick={(e) => { e.stopPropagation(); onRemoveNote(note.id); setConfirmDeleteId(null); }}
                            className="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700 shadow-lg"
                          >
                            <Check size={14} />
                          </button>
                          <button 
                            onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(null); }}
                            className="p-2 bg-gray-700 text-gray-300 rounded-lg hover:bg-gray-600"
                          >
                            <X size={14} />
                          </button>
                        </div>
                      ) : (
                        <button 
                          onClick={(e) => { e.stopPropagation(); setConfirmDeleteId(note.id); }}
                          className="opacity-0 group-hover:opacity-100 p-2 rounded-lg text-gray-500 hover:text-red-500 hover:bg-red-500/10 transition-all active:scale-90"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NotesPanel;
