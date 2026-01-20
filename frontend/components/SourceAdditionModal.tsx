
import React, { useState, useRef } from 'react';
import { 
  X, 
  Search, 
  UploadCloud, 
  Globe, 
  Youtube, 
  FileText, 
  HardDrive, 
  Clipboard,
  Loader2,
  FileDigit,
  LayoutGrid,
  CheckCircle2
} from 'lucide-react';
import { Source } from '../types';

interface SourceAdditionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onAddSource: (source: Source) => void;
  sourcesCount: number;
  theme: 'light' | 'dark';
}

const SourceAdditionModal: React.FC<SourceAdditionModalProps> = ({ 
  isOpen, 
  onClose, 
  onAddSource, 
  sourcesCount,
  theme 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<'main' | 'text' | 'link'>('main');
  const [textInput, setTextInput] = useState({ title: '', content: '' });
  const [urlInput, setUrlInput] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleFile = (file: File) => {
    setIsUploading(true);
    setUploadProgress(0);
    
    const reader = new FileReader();
    const isText = file.type.startsWith('text/') || file.name.endsWith('.md') || file.name.endsWith('.txt');

    // Real progress from the FileReader
    reader.onprogress = (event) => {
      if (event.lengthComputable) {
        const progress = Math.round((event.loaded / event.total) * 50); // First 50% is reading
        setUploadProgress(progress);
      }
    };

    reader.onload = (event) => {
      // Simulate the remaining 50% "processing/uploading" time
      let currentProgress = 50;
      const interval = setInterval(() => {
        currentProgress += 5;
        setUploadProgress(currentProgress);
        
        if (currentProgress >= 100) {
          clearInterval(interval);
          setTimeout(() => {
            onAddSource({
              id: Math.random().toString(36).substr(2, 9),
              name: file.name,
              content: isText ? (event.target?.result as string) : `Fayl yuklandi: ${file.name}`,
              type: 'file',
              timestamp: Date.now(),
            });
            setIsUploading(false);
            setUploadProgress(0);
            onClose();
          }, 200);
        }
      }, 50);
    };

    if (isText) reader.readAsText(file);
    else reader.readAsArrayBuffer(file);
  };

  const onDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const onDragLeave = () => setIsDragging(false);

  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  };

  const handleTextSubmit = () => {
    if (!textInput.content.trim()) return;
    onAddSource({
      id: Math.random().toString(36).substr(2, 9),
      name: textInput.title || 'Kiritilgan matn',
      content: textInput.content,
      type: 'text',
      timestamp: Date.now(),
    });
    setTextInput({ title: '', content: '' });
    onClose();
  };

  const handleUrlSubmit = (type: 'link' | 'youtube') => {
    if (!urlInput.trim()) return;
    onAddSource({
      id: Math.random().toString(36).substr(2, 9),
      name: urlInput.replace(/(^\w+:|^)\/\//, '').split('/')[0] || 'Havola',
      content: `URL manbasi: ${urlInput}`,
      type: type,
      timestamp: Date.now(),
    });
    setUrlInput('');
    onClose();
  };

  const modalBg = theme === 'dark' ? 'bg-[#1a1c1e]' : 'bg-white';
  const cardBg = theme === 'dark' ? 'bg-[#25282c]' : 'bg-gray-50';
  const borderColor = theme === 'dark' ? 'border-gray-800' : 'border-gray-100';
  const textColor = theme === 'dark' ? 'text-white' : 'text-gray-900';
  const subTextColor = theme === 'dark' ? 'text-gray-400' : 'text-gray-500';

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 sm:p-6 bg-black/80 backdrop-blur-md animate-in fade-in duration-300">
      <div className={`w-full max-w-5xl h-[90vh] rounded-[2.5rem] shadow-2xl overflow-hidden flex flex-col border ${borderColor} ${modalBg} animate-in zoom-in-95 duration-300`}>
        
        {/* Top Header */}
        <div className="p-8 pb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
             <div className="w-8 h-8 rounded-lg bg-indigo-600 flex items-center justify-center text-white">
                <LayoutGrid size={20} />
             </div>
             <h1 className={`text-2xl font-bold tracking-tight ${textColor}`}>Manbalarni qo'shing</h1>
          </div>
          <div className="flex items-center gap-3">
            <button onClick={onClose} className="p-2 rounded-full hover:bg-red-500/10 text-gray-500 hover:text-red-500 transition-all">
              <X size={24} />
            </button>
          </div>
        </div>

        {/* Description */}
        <div className="px-8 mb-8">
           <p className={`text-sm leading-relaxed max-w-2xl ${subTextColor}`}>
             NotebookLM javoblar yozishda ularga tayanadi. Yuklang: marketing rejalari, kurs materiallari, tadqiqot qaydlari, uchrashuv transkriptlari va boshqalar.
           </p>
        </div>

        {/* Content Area */}
        <div className="flex-1 overflow-y-auto px-8 pb-8 custom-scrollbar">
          
          {/* Main Dropzone */}
          <div 
            onDragOver={onDragOver}
            onDragLeave={onDragLeave}
            onDrop={onDrop}
            onClick={() => !isUploading && fileInputRef.current?.click()}
            className={`
              relative w-full h-72 rounded-[2rem] border-2 border-dashed flex flex-col items-center justify-center gap-4 transition-all cursor-pointer group mb-8
              ${isDragging ? 'border-indigo-500 bg-indigo-500/10' : `${borderColor} hover:border-indigo-500/50 hover:bg-white/5`}
              ${isUploading ? 'cursor-wait pointer-events-none' : ''}
            `}
          >
            {isUploading ? (
              <div className="flex flex-col items-center gap-6 w-full max-w-md px-10 animate-in fade-in duration-300">
                <div className="relative">
                  <div className="w-20 h-20 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                    <Loader2 size={32} className="animate-spin text-indigo-500" />
                  </div>
                  <div className="absolute inset-0 flex items-center justify-center">
                    <span className="text-[10px] font-black text-indigo-500">{uploadProgress}%</span>
                  </div>
                </div>
                <div className="w-full">
                  <div className="flex justify-between items-center mb-2">
                    <span className={`text-xs font-bold ${textColor}`}>Fayl yuklanmoqda...</span>
                    <span className={`text-xs font-bold text-indigo-500`}>{uploadProgress}%</span>
                  </div>
                  <div className={`h-2 w-full rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'} overflow-hidden`}>
                    <div 
                      className="h-full bg-indigo-500 transition-all duration-300 ease-out shadow-[0_0_10px_rgba(99,102,241,0.5)]" 
                      style={{ width: `${uploadProgress}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            ) : (
              <>
                <div className={`w-16 h-16 rounded-full flex items-center justify-center transition-transform group-hover:scale-110 ${theme === 'dark' ? 'bg-indigo-900/20 text-indigo-400' : 'bg-indigo-50 text-indigo-600'}`}>
                   <UploadCloud size={32} />
                </div>
                <div className="text-center">
                  <h3 className={`text-lg font-bold ${textColor}`}>Manbalarni yuklang</h3>
                  <p className={`text-sm mt-1 ${subTextColor}`}>
                    <span className="text-indigo-500 font-bold hover:underline">Faylni tanlang</span> yoki bu yerga tortib keling.
                  </p>
                </div>
              </>
            )}
            <p className={`text-[10px] font-medium absolute bottom-6 px-10 text-center opacity-60 ${subTextColor}`}>
              Qo'llab-quvvatlanadigan fayl turlari: PDF, .txt, Markdown, audio (MP3 va boshqalar), .docx, .avif, .bmp, .gif, .ico, .jp2, .png, .webp, .tif, .tiff, .heic, .heif, .jpeg, .jpg, .jpe.
            </p>
            <input type="file" ref={fileInputRef} onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])} className="hidden" />
          </div>

          {/* Grid Cards - Reduced to 2 columns */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Links */}
            <div className={`p-6 rounded-3xl border ${borderColor} ${cardBg} flex flex-col gap-6`}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 flex items-center justify-center text-green-500">
                    <Globe size={20} />
                 </div>
                 <h4 className={`text-sm font-bold ${textColor}`}>Havola qo'shish</h4>
              </div>
              <div className="flex flex-col gap-2">
                <div className="flex gap-2">
                  <button onClick={() => setActiveTab('link')} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border ${borderColor} transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-white shadow-sm'}`}>
                    <Globe size={14} className="text-green-500" />
                    <span className={`text-xs font-bold ${textColor}`}>Sayt</span>
                  </button>
                  <button onClick={() => setActiveTab('link')} className={`flex-1 flex items-center gap-2 p-3 rounded-xl border ${borderColor} transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-white shadow-sm'}`}>
                    <Youtube size={14} className="text-red-500" />
                    <span className={`text-xs font-bold ${textColor}`}>YouTube</span>
                  </button>
                </div>
              </div>
            </div>

            {/* Paste Text */}
            <div className={`p-6 rounded-3xl border ${borderColor} ${cardBg} flex flex-col gap-6`}>
              <div className="flex items-center gap-3">
                 <div className="w-8 h-8 flex items-center justify-center text-indigo-500">
                    <Clipboard size={20} />
                 </div>
                 <h4 className={`text-sm font-bold ${textColor}`}>Matnni joylang</h4>
              </div>
              <button onClick={() => setActiveTab('text')} className={`w-full flex items-center gap-3 p-3 rounded-xl border ${borderColor} transition-all ${theme === 'dark' ? 'hover:bg-white/5' : 'hover:bg-white shadow-sm'}`}>
                <div className="w-6 h-6 rounded flex items-center justify-center bg-gray-700 text-white">
                  <FileText size={14} />
                </div>
                <span className={`text-xs font-bold ${textColor}`}>Nusxalangan matn</span>
              </button>
            </div>

          </div>
        </div>

        {/* Footer Progress */}
        <div className={`px-10 py-6 border-t ${borderColor} flex items-center justify-between`}>
          <div className="flex items-center gap-4 flex-1 max-w-md">
            <FileText size={18} className="text-gray-500" />
            <div className="flex-1">
               <div className="flex justify-between items-center mb-1.5">
                  <span className={`text-[11px] font-bold ${subTextColor}`}>Fayllar soni:</span>
                  <span className={`text-[11px] font-bold ${textColor}`}>{sourcesCount}/50</span>
               </div>
               <div className={`h-1.5 w-full rounded-full ${theme === 'dark' ? 'bg-gray-800' : 'bg-gray-100'}`}>
                  <div className="h-full bg-indigo-500 rounded-full transition-all duration-500" style={{ width: `${(sourcesCount/50)*100}%` }}></div>
               </div>
            </div>
          </div>
          <p className={`text-[10px] font-bold uppercase tracking-widest ${subTextColor}`}>Gemini AI Research Assistant</p>
        </div>

        {/* Sub-Modals for URL and Text */}
        {activeTab !== 'main' && (
          <div className="absolute inset-0 z-10 flex items-center justify-center p-8 bg-black/40 backdrop-blur-sm animate-in fade-in zoom-in-95 duration-200">
             <div className={`w-full max-w-lg rounded-3xl shadow-2xl p-6 border ${borderColor} ${modalBg}`}>
                <div className="flex items-center justify-between mb-6">
                  <h3 className={`text-lg font-bold ${textColor}`}>{activeTab === 'text' ? 'Matnni joylash' : 'Havola qo\'shish'}</h3>
                  <button onClick={() => setActiveTab('main')} className="p-1.5 rounded-full hover:bg-gray-500/10 text-gray-500">
                    <X size={20} />
                  </button>
                </div>

                {activeTab === 'text' ? (
                  <div className="space-y-4">
                    <input 
                      type="text" 
                      placeholder="Sarlavha (ixtiyoriy)" 
                      value={textInput.title}
                      onChange={e => setTextInput(prev => ({ ...prev, title: e.target.value }))}
                      className={`w-full p-3 rounded-xl border outline-none text-sm ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50 text-gray-800'}`}
                    />
                    <textarea 
                      placeholder="Matnni bu yerga kiriting..." 
                      value={textInput.content}
                      onChange={e => setTextInput(prev => ({ ...prev, content: e.target.value }))}
                      className={`w-full h-48 p-3 rounded-xl border outline-none text-sm resize-none ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50 text-gray-800'}`}
                    ></textarea>
                    <button onClick={handleTextSubmit} className="w-full py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Qo'shish</button>
                  </div>
                ) : (
                  <div className="space-y-4">
                    <input 
                      type="url" 
                      placeholder="https://example.com" 
                      value={urlInput}
                      onChange={e => setUrlInput(e.target.value)}
                      className={`w-full p-3 rounded-xl border outline-none text-sm ${borderColor} ${theme === 'dark' ? 'bg-black/20 text-white' : 'bg-gray-50 text-gray-800'}`}
                    />
                    <div className="flex gap-2">
                      <button onClick={() => handleUrlSubmit('link')} className="flex-1 py-3 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-all">Saytni qo'shish</button>
                      <button onClick={() => handleUrlSubmit('youtube')} className="flex-1 py-3 bg-red-600 text-white rounded-xl font-bold hover:bg-red-700 transition-all">YouTube qo'shish</button>
                    </div>
                  </div>
                )}
             </div>
          </div>
        )}

      </div>
    </div>
  );
};

export default SourceAdditionModal;
