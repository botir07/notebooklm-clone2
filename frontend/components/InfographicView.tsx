
import React, { useState } from 'react';
import { X, Download, ZoomIn, ZoomOut, RotateCcw, Copy, Check, Maximize2 } from 'lucide-react';

interface InfographicViewProps {
  imageUrl: string;
  title: string;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const InfographicView: React.FC<InfographicViewProps> = ({ imageUrl, title, onClose, theme }) => {
  const [zoom, setZoom] = useState(1);
  const [copied, setCopied] = useState(false);

  const handleDownload = () => {
    const link = document.createElement('a');
    link.href = imageUrl;
    link.download = `${title.replace(/\s+/g, '_')}_infographic.png`;
    link.click();
  };

  const handleCopy = async () => {
    try {
      const response = await fetch(imageUrl);
      const blob = await response.blob();
      await navigator.clipboard.write([
        new ClipboardItem({ [blob.type]: blob })
      ]);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      console.error(err);
    }
  };

  return (
    <div className={`fixed inset-0 z-[250] flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#0b0c10]' : 'bg-gray-100'} animate-in fade-in duration-500`}>
      {/* Dynamic Background Glow */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-20">
        <div className="absolute top-1/4 -left-20 w-96 h-96 bg-blue-600/10 rounded-full blur-[120px]"></div>
        <div className="absolute bottom-1/4 -right-20 w-96 h-96 bg-purple-600/10 rounded-full blur-[120px]"></div>
      </div>

      {/* Header */}
      <div className="relative z-10 flex items-center justify-between p-6 sm:px-10 border-b border-white/5 backdrop-blur-3xl bg-black/40 shrink-0 shadow-2xl">
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 bg-indigo-600 rounded-xl flex items-center justify-center text-white shadow-[0_0_20px_rgba(79,70,229,0.3)]">
            <Maximize2 size={22} />
          </div>
          <div>
            <h2 className={`text-xl sm:text-2xl font-black tracking-tighter ${theme === 'dark' ? 'text-white' : 'text-gray-900 uppercase'}`}>{title}</h2>
            <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${theme === 'dark' ? 'text-gray-500' : 'text-gray-400'}`}>Visual Analysis • Transparent Display</p>
          </div>
        </div>
        
        <div className="flex items-center gap-2 sm:gap-4">
          <button onClick={handleCopy} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-600'}`}>
            {copied ? <Check size={20} className="text-green-500" /> : <Copy size={20} />}
          </button>
          <button onClick={handleDownload} className={`p-2.5 rounded-xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400 hover:text-white' : 'hover:bg-black/5 text-gray-600'}`}>
            <Download size={20} />
          </button>
          <div className="w-px h-6 bg-white/10 mx-1"></div>
          <button onClick={onClose} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all shadow-lg active:scale-95">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Viewport Area - Zero scroll, contain logic */}
      <div className="flex-1 relative flex items-center justify-center p-6 sm:p-12 overflow-hidden">
        <div 
          className="relative transition-transform duration-300 ease-out flex items-center justify-center w-full h-full"
          style={{ transform: `scale(${zoom})` }}
        >
          {/* 
             Image Wrapper:
             - Background removed (transparent)
             - Padding removed for direct image viewing
             - max-h/max-w: Ensures it never overflows the viewport
          */}
          <div className="relative flex items-center justify-center max-h-full max-w-full overflow-hidden transition-all">
             <img 
               src={imageUrl} 
               alt={title} 
               className="max-w-full max-h-full h-auto w-auto object-contain block select-none"
               style={{ 
                 maxWidth: '100%', 
                 maxHeight: '100%',
                 display: 'block' 
               }}
             />
          </div>
        </div>
      </div>

      {/* Controls Footer */}
      <div className="p-10 flex flex-col items-center gap-6 shrink-0 z-10">
        <div className={`flex items-center gap-1.5 p-1.5 rounded-[1.5rem] border ${theme === 'dark' ? 'bg-black/60 border-gray-800' : 'bg-white border-gray-200'} shadow-[0_20px_40px_rgba(0,0,0,0.3)] backdrop-blur-2xl`}>
          <button onClick={() => setZoom(z => Math.max(0.3, z - 0.1))} className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-600'}`}>
            <ZoomOut size={20} />
          </button>
          <div className="px-5 text-xs font-mono font-black text-gray-400 min-w-[75px] text-center">{Math.round(zoom * 100)}%</div>
          <button onClick={() => setZoom(z => Math.min(3.0, z + 0.1))} className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-600'}`}>
            <ZoomIn size={20} />
          </button>
          <div className="w-[1px] h-6 bg-white/10 mx-2"></div>
          <button onClick={() => setZoom(1)} className={`p-3 rounded-2xl transition-all ${theme === 'dark' ? 'hover:bg-white/10 text-gray-400' : 'hover:bg-black/5 text-gray-600'}`}>
            <RotateCcw size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default InfographicView;
