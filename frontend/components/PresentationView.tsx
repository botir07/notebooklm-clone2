
import React, { useState } from 'react';
import { 
  X, Download, ChevronLeft, ChevronRight, Loader2, Check, Maximize2, ZoomIn, ZoomOut, FileText
} from 'lucide-react';
import { PresentationData } from '../types';
import { jsPDF } from 'jspdf';

interface PresentationViewProps {
  data: PresentationData;
  sourceCount: number;
  onClose: () => void;
  theme: 'dark';
}

const PresentationView: React.FC<PresentationViewProps> = ({ data, sourceCount, onClose, theme }) => {
  const [currentSlideIndex, setCurrentSlideIndex] = useState(0);
  const [isExporting, setIsExporting] = useState(false);
  const [isExported, setIsExported] = useState(false);
  const [zoom, setZoom] = useState(1);

  const currentSlide = data.slides[currentSlideIndex];

  const handleNext = () => {
    if (currentSlideIndex < data.slides.length - 1) {
      setCurrentSlideIndex(prev => prev + 1);
    }
  };

  const handlePrev = () => {
    if (currentSlideIndex > 0) {
      setCurrentSlideIndex(prev => prev - 1);
    }
  };

  const downloadPdf = async () => {
    if (isExporting) return;
    
    setIsExporting(true);
    const pdf = new jsPDF({
      orientation: 'landscape',
      unit: 'px',
      format: [1280, 720]
    });

    try {
      for (let i = 0; i < data.slides.length; i++) {
        const slide = data.slides[i];
        if (i > 0) pdf.addPage([1280, 720], 'landscape');
        
        if (slide.imageUrl) {
          pdf.addImage(slide.imageUrl, 'PNG', 0, 0, 1280, 720);
        } else {
          // Rasm yo'q bo'lsa matnni PDFga yozish
          pdf.setFillColor(20, 20, 20);
          pdf.rect(0, 0, 1280, 720, 'F');
          pdf.setTextColor(255, 255, 255);
          pdf.setFontSize(40);
          pdf.text(slide.title, 640, 200, { align: 'center' });
          pdf.setFontSize(24);
          slide.content.forEach((line, idx) => {
            pdf.text(`• ${line}`, 100, 300 + (idx * 40));
          });
        }
      }

      pdf.save(`${data.title.replace(/\s+/g, '_')}_presentation.pdf`);
      setIsExported(true);
      setTimeout(() => setIsExported(false), 3000);
    } catch (err) {
      console.error('PDF export failed:', err);
      alert('PDF yaratishda xatolik yuz berdi.');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[300] bg-[#0a0a0a] flex flex-col text-white animate-in fade-in duration-300">
      {/* Top Header */}
      <div className="h-14 px-6 flex items-center justify-between border-b border-white/5 bg-[#141414] backdrop-blur-xl">
        <div className="flex items-center gap-4">
          <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
            <Maximize2 size={16} />
          </div>
          <div className="flex flex-col">
            <h1 className="text-sm font-bold tracking-tight text-gray-100">{data.title}</h1>
            <p className="text-[10px] text-gray-500 font-medium tracking-widest uppercase">
              {currentSlide.imageUrl ? "AI Visual Slayd" : "AI Matnli Slayd"}
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          <button 
            onClick={downloadPdf}
            disabled={isExporting}
            className={`flex items-center gap-2 px-4 py-1.5 rounded-full text-xs font-black uppercase tracking-tighter transition-all ${isExporting ? 'bg-indigo-500/20 text-indigo-400' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-600/20 active:scale-95'}`}
          >
            {isExporting ? <Loader2 size={14} className="animate-spin" /> : (isExported ? <Check size={14} /> : <Download size={14} />)}
            {isExporting ? 'Eksport...' : (isExported ? 'Tayyor' : 'PDF Yuklash')}
          </button>
          <div className="w-px h-6 bg-white/10 mx-2"></div>
          <button onClick={onClose} className="p-2 text-gray-400 hover:text-red-500 transition-colors">
            <X size={20} />
          </button>
        </div>
      </div>

      <div className="flex-1 flex overflow-hidden">
        {/* Main Slide Area */}
        <div className="flex-1 relative flex flex-col bg-[#050505] items-center justify-center p-6 sm:p-12 overflow-hidden">
          
          <div 
            className="w-full max-w-5xl aspect-[16/9] rounded-2xl shadow-[0_0_100px_rgba(79,70,229,0.15)] relative flex flex-col items-center justify-center transition-all duration-500 overflow-hidden bg-[#111] border border-white/5"
            style={{ transform: `scale(${zoom})` }}
          >
            {currentSlide.imageUrl ? (
              <img 
                src={currentSlide.imageUrl} 
                alt={currentSlide.title} 
                className="w-full h-full object-contain animate-in fade-in zoom-in-95 duration-500"
              />
            ) : (
              <div className="w-full h-full p-16 flex flex-col justify-center animate-in fade-in duration-500">
                <div className="flex items-center gap-3 mb-8 opacity-40">
                  <FileText size={24} className="text-indigo-400" />
                  <span className="text-xs font-black uppercase tracking-widest">Billing cheklovi: Matnli rejim</span>
                </div>
                <h3 className="text-4xl font-black mb-10 tracking-tight text-white leading-tight">{currentSlide.title}</h3>
                <ul className="space-y-6">
                  {currentSlide.content.map((item, i) => (
                    <li key={i} className="flex items-start gap-4 text-xl text-gray-300 font-medium">
                      <div className="w-2 h-2 rounded-full bg-indigo-500 mt-2.5 shrink-0" />
                      {item}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Navigation Overlays */}
            <div className="absolute inset-x-4 top-1/2 -translate-y-1/2 flex justify-between pointer-events-none">
              <button 
                onClick={handlePrev}
                disabled={currentSlideIndex === 0}
                className={`p-3 rounded-full bg-black/40 border border-white/5 backdrop-blur-md transition-all pointer-events-auto ${currentSlideIndex === 0 ? 'opacity-0' : 'hover:bg-indigo-600 hover:text-white text-gray-400'}`}
              >
                <ChevronLeft size={24} />
              </button>
              <button 
                onClick={handleNext}
                disabled={currentSlideIndex === data.slides.length - 1}
                className={`p-3 rounded-full bg-black/40 border border-white/5 backdrop-blur-md transition-all pointer-events-auto ${currentSlideIndex === data.slides.length - 1 ? 'opacity-0' : 'hover:bg-indigo-600 hover:text-white text-gray-400'}`}
              >
                <ChevronRight size={24} />
              </button>
            </div>
          </div>

          {/* Zoom & Progress Controls */}
          <div className="absolute bottom-8 flex items-center gap-6 px-6 py-3 bg-black/40 border border-white/5 backdrop-blur-2xl rounded-2xl shadow-2xl">
             <div className="flex items-center gap-1 border-r border-white/10 pr-6">
                <button onClick={() => setZoom(z => Math.max(0.5, z - 0.1))} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"><ZoomOut size={16} /></button>
                <span className="text-[10px] font-mono w-10 text-center text-gray-500">{Math.round(zoom * 100)}%</span>
                <button onClick={() => setZoom(z => Math.min(1.5, z + 0.1))} className="p-1.5 hover:bg-white/5 rounded-lg text-gray-400"><ZoomIn size={16} /></button>
             </div>
             <div className="flex items-center gap-3">
               <span className="text-[10px] font-black text-indigo-500 tracking-widest uppercase">SLAYD</span>
               <div className="flex gap-1.5">
                  {data.slides.map((_, idx) => (
                    <div 
                      key={idx} 
                      onClick={() => setCurrentSlideIndex(idx)}
                      className={`h-1.5 rounded-full transition-all cursor-pointer ${currentSlideIndex === idx ? 'w-8 bg-indigo-500' : 'w-2 bg-white/10 hover:bg-white/20'}`}
                    />
                  ))}
               </div>
               <span className="text-[10px] font-bold text-gray-500 ml-2">{currentSlideIndex + 1} / {data.slides.length}</span>
             </div>
          </div>
        </div>

        {/* Thumbnails Sidebar */}
        <div className="w-[300px] bg-[#0c0c0c] border-l border-white/5 flex flex-col overflow-y-auto custom-scrollbar p-6 gap-6">
          <div className="mb-2">
            <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-500">Taqdimot tarkibi</h4>
            <p className="text-[11px] text-gray-600 mt-1">Slaydlarning qisqacha ko'rinishi.</p>
          </div>
          
          {data.slides.map((slide, idx) => (
            <div 
              key={idx}
              onClick={() => setCurrentSlideIndex(idx)}
              className={`flex flex-col gap-2 group cursor-pointer transition-all ${currentSlideIndex === idx ? 'opacity-100' : 'opacity-40 hover:opacity-70'}`}
            >
              <div 
                className={`aspect-[16/9] rounded-xl border-2 transition-all overflow-hidden bg-[#111] ${
                  currentSlideIndex === idx ? 'border-indigo-600 scale-[1.02] shadow-xl shadow-indigo-600/10' : 'border-transparent'
                }`}
              >
                {slide.imageUrl ? (
                  <img src={slide.imageUrl} alt={slide.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex flex-col items-center justify-center p-4 text-center">
                    <span className="text-[9px] font-black text-gray-600 uppercase mb-2">Vizualizatsiya yo'q</span>
                    <span className="text-[10px] font-bold text-gray-500 truncate w-full">{slide.title}</span>
                  </div>
                )}
              </div>
              <div className="flex items-center gap-2 px-1">
                <span className={`text-[10px] font-black ${currentSlideIndex === idx ? 'text-indigo-500' : 'text-gray-600'}`}>{idx + 1}</span>
                <h4 className="text-[11px] font-bold truncate text-gray-400">{slide.title}</h4>
              </div>
            </div>
          ))}
        </div>
      </div>
      
      {isExporting && (
        <div className="absolute inset-0 z-[400] bg-black/60 backdrop-blur-md flex items-center justify-center">
          <div className="bg-[#141414] p-10 rounded-[2.5rem] border border-white/5 shadow-2xl flex flex-col items-center gap-6 animate-in zoom-in-95">
            <div className="relative">
              <div className="w-16 h-16 rounded-full border-4 border-indigo-500/20 flex items-center justify-center">
                <Loader2 size={32} className="animate-spin text-indigo-500" />
              </div>
            </div>
            <div className="text-center">
              <h3 className="text-lg font-black tracking-tight uppercase">PDF Tayyorlanmoqda</h3>
              <p className="text-xs text-gray-500 mt-2 font-medium">Iltimos kuting...</p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default PresentationView;
