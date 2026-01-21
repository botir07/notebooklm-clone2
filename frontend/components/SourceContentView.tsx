
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, ArrowLeft, Clock, FileText, Globe, Youtube, Download, 
  Copy, Share2, PlusCircle, Sparkles, HelpCircle, Network, 
  CopyPlus, MessageSquare, Loader2, BookOpen
} from 'lucide-react';
import { Source, StudyMaterialType } from '../types';
import { geminiService } from '../services/geminiService';

interface SourceContentViewProps {
  source: Source;
  onClose: () => void;
  onActionWithSelection: (text: string, type: StudyMaterialType | 'note' | 'chat') => void;
  theme: 'light' | 'dark';
}

const SourceContentView: React.FC<SourceContentViewProps> = ({ source, onClose, onActionWithSelection, theme }) => {
  const [selection, setSelection] = useState<{ text: string; x: number; y: number } | null>(null);
  const [summary, setSummary] = useState<string | null>(null);
  const [isSummarizing, setIsSummarizing] = useState(false);
  const contentRef = useRef<HTMLDivElement>(null);

  const handleMouseUp = () => {
    const sel = window.getSelection();
    if (sel && sel.toString().trim().length > 0) {
      const range = sel.getRangeAt(0);
      const rect = range.getBoundingClientRect();
      
      setSelection({
        text: sel.toString().trim(),
        x: rect.left + rect.width / 2,
        y: rect.top + window.scrollY - 10
      });
    } else {
      setSelection(null);
    }
  };

  const handleSummarize = async () => {
    if (isSummarizing) return;
    setIsSummarizing(true);
    try {
      const result = await geminiService.summarizeSource(source);
      setSummary(result);
    } catch (e) {
      alert("Xulosa yaratishda xatolik.");
    } finally {
      setIsSummarizing(false);
    }
  };

  useEffect(() => {
    const handleScroll = () => setSelection(null);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';
  const bgColor = theme === 'dark' ? 'bg-[#1a1a1a]' : 'bg-white';
  const borderColor = theme === 'dark' ? 'border-white/5' : 'border-gray-100';
  const isPdf = source.fileType === 'pdf' || source.name.toLowerCase().endsWith('.pdf');
  const pdfSrc = source.content.startsWith('data:application/pdf')
    ? source.content
    : `data:application/pdf;base64,${source.content}`;

  const getIcon = () => {
    switch (source.type) {
      case 'youtube': return <Youtube size={20} className="text-red-500" />;
      case 'link': return <Globe size={20} className="text-green-500" />;
      default: return <FileText size={20} className="text-blue-500" />;
    }
  };

  return (
    <div className={`flex-1 flex flex-col overflow-hidden animate-in fade-in slide-in-from-right-4 duration-500 relative bg-[#121212]`}>
      {/* Header */}
      <div className={`px-8 py-4 border-b flex items-center justify-between shrink-0 bg-[#1e1e1e] ${borderColor} z-10`}>
        <div className="flex items-center gap-4">
          <button 
            onClick={onClose}
            className={`p-2 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/5 text-gray-400' : 'hover:bg-gray-100 text-gray-500'}`}
          >
            <ArrowLeft size={20} />
          </button>
          <div className="flex items-center gap-3">
            <div className={`w-10 h-10 rounded-xl flex items-center justify-center bg-[#1a1b1e] border ${borderColor}`}>
              {getIcon()}
            </div>
            <div>
              <h2 className={`text-sm font-bold truncate max-w-md ${textColor}`}>{source.name}</h2>
              <div className="flex items-center gap-2 mt-0.5">
                <Clock size={10} className={subTextColor} />
                <span className={`text-[10px] font-medium uppercase tracking-wider ${subTextColor}`}>
                  {new Date(source.timestamp).toLocaleDateString()}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <button 
            onClick={handleSummarize}
            disabled={isSummarizing}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${isSummarizing ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20'}`}
          >
            {isSummarizing ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
            {summary ? 'Yangilash' : 'AI Xulosa'}
          </button>
          <div className="w-px h-6 bg-white/10"></div>
          <button className="p-2 text-gray-400 hover:text-white transition-all"><Copy size={18} /></button>
          <button className="p-2 text-gray-400 hover:text-white transition-all"><Download size={18} /></button>
        </div>
      </div>

      {/* Main Content Viewport */}
      <div className={`flex-1 overflow-y-auto custom-scrollbar p-6 sm:p-12 ${theme === 'dark' ? 'bg-[#121212]' : 'bg-gray-50/50'}`}>
        <div className="max-w-3xl mx-auto space-y-10">
          
          {/* AI Summary Section */}
          {(isSummarizing || summary) && (
            <div className={`p-8 rounded-[2rem] border animate-in slide-in-from-top-4 duration-500 ${theme === 'dark' ? 'bg-[#1e1e24] border-indigo-500/20 shadow-2xl shadow-indigo-500/5' : 'bg-indigo-50 border-indigo-100 shadow-sm'}`}>
              <div className="flex items-center gap-3 mb-4">
                <div className="p-1.5 bg-indigo-500 rounded-lg text-white">
                  <Sparkles size={14} />
                </div>
                <h3 className={`text-xs font-black uppercase tracking-[0.2em] text-indigo-400`}>Tezkor xulosa</h3>
              </div>
              
              {isSummarizing ? (
                <div className="space-y-3">
                  <div className="h-3 w-full bg-indigo-500/10 rounded-full animate-pulse"></div>
                  <div className="h-3 w-[90%] bg-indigo-500/10 rounded-full animate-pulse delay-75"></div>
                  <div className="h-3 w-[80%] bg-indigo-500/10 rounded-full animate-pulse delay-150"></div>
                </div>
              ) : (
                <div className={`text-sm leading-relaxed whitespace-pre-wrap font-medium ${theme === 'dark' ? 'text-gray-300' : 'text-gray-700'}`}>
                  {summary}
                </div>
              )}
            </div>
          )}

          {/* Document Content - Styled as a paper sheet */}
          <div 
            ref={contentRef}
            onMouseUp={handleMouseUp}
            className={`
              relative p-10 sm:p-16 rounded-[2.5rem] shadow-2xl min-h-[80vh]
              ${theme === 'dark' ? 'bg-[#1e1e1e] border border-white/5 text-gray-300' : 'bg-white border border-gray-100 text-gray-800'}
            `}
          >
            {/* Paper texture overlay (subtle) */}
            <div className="absolute inset-0 pointer-events-none opacity-[0.03] mix-blend-overlay bg-[url('https://www.transparenttextures.com/patterns/notebook.png')]"></div>
            
            <div className="relative">
              <div className="flex items-center gap-3 mb-12 opacity-40">
                <BookOpen size={16} />
                <span className="text-[10px] font-black uppercase tracking-[0.3em]">Hujjat matni</span>
              </div>
              
              {isPdf ? (
                <div className="w-full h-[80vh] rounded-2xl overflow-hidden border border-white/10 bg-black/20">
                  <iframe
                    title={source.name}
                    src={pdfSrc}
                    className="w-full h-full"
                  />
                </div>
              ) : (
                <div className="prose prose-lg max-w-none">
                  <p className={`whitespace-pre-wrap leading-[2.2] text-[17px] font-serif selection:bg-indigo-500/30 selection:text-white`}>
                    {source.content}
                  </p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Floating Action Menu */}
      {selection && (
        <div 
          className="fixed z-[1000] -translate-x-1/2 -translate-y-[120%] flex items-center bg-[#1a1b1e] border border-white/10 rounded-2xl shadow-2xl p-1.5 gap-1 animate-in zoom-in-95 duration-200"
          style={{ left: selection.x, top: selection.y }}
        >
          <button 
            onClick={() => onActionWithSelection(selection.text, 'note')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl hover:bg-white/5 text-[11px] font-bold text-blue-400 transition-all"
          >
            <PlusCircle size={14} />
            Saqlash
          </button>
          <div className="w-px h-4 bg-white/10 mx-1"></div>
          
          <button onClick={() => onActionWithSelection(selection.text, 'quiz')} className="p-2 rounded-xl hover:bg-purple-500/10 text-purple-400 transition-all" title="Test tuzish"><HelpCircle size={16} /></button>
          <button onClick={() => onActionWithSelection(selection.text, 'mindmap')} className="p-2 rounded-xl hover:bg-green-500/10 text-green-500 transition-all" title="Aqliy xarita"><Network size={16} /></button>
          <button onClick={() => onActionWithSelection(selection.text, 'flashcard')} className="p-2 rounded-xl hover:bg-orange-500/10 text-orange-400 transition-all" title="Kartochka"><CopyPlus size={16} /></button>

          <div className="w-px h-4 bg-white/10 mx-1"></div>

          <button 
            onClick={() => onActionWithSelection(selection.text, 'chat')}
            className="flex items-center gap-2 px-3 py-2 rounded-xl bg-indigo-600 hover:bg-indigo-700 text-[11px] font-bold text-white transition-all shadow-lg shadow-indigo-600/20"
          >
            <Sparkles size={14} />
            AI Tahlil
          </button>
        </div>
      )}
    </div>
  );
};

export default SourceContentView;
