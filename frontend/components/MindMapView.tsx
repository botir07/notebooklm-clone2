
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { X, ZoomIn, ZoomOut, RotateCcw, Download, Move, Compass } from 'lucide-react';
import { MindMapData, MindMapNode } from '../types';
import * as htmlToImage from 'html-to-image';

interface MindMapViewProps {
  data: MindMapData;
  sourceCount: number;
  onClose: () => void;
  theme: 'light' | 'dark';
}

const MindMapNodeComponent: React.FC<{ 
  node: MindMapNode; 
  level: number; 
  index: number;
  theme: 'light' | 'dark';
  direction: 'left' | 'right' | 'center';
}> = ({ node, level, index, theme, direction }) => {
  if (!node || !node.label) return null;

  const isRoot = direction === 'center';
  const hasChildren = node.children && node.children.length > 0;
  
  const colors = [
    'from-indigo-600 to-purple-600', // Root
    'from-blue-500 to-indigo-500',   // Level 1
    'from-cyan-500 to-blue-500',     // Level 2
    'from-teal-500 to-emerald-500',  // Level 3+
  ];
  
  const currentColor = colors[Math.min(level, colors.length - 1)];

  return (
    <div className={`flex items-center ${direction === 'left' ? 'flex-row-reverse' : 'flex-row'} relative`}>
      {/* Node Content */}
      <div 
        className={`
          relative px-5 py-3.5 rounded-2xl text-[14px] font-bold border transition-all duration-300
          hover:scale-[1.05] hover:shadow-2xl z-20 cursor-default
          ${isRoot ? 
            `bg-gradient-to-br ${currentColor} border-white/20 text-white shadow-2xl shadow-indigo-500/30 min-w-[200px] text-center text-base` : 
            theme === 'dark' ? 
              'bg-[#1a1a1f] border-gray-800 text-gray-200 hover:border-indigo-500/60' : 
              'bg-white border-gray-100 text-gray-800 shadow-lg hover:border-indigo-300'}
        `}
      >
        <span className="whitespace-nowrap tracking-tight">{node.label}</span>
      </div>

      {/* Children branches */}
      {hasChildren && (
        <div className={`flex flex-col gap-3 ${direction === 'left' ? 'mr-10 items-end' : 'ml-10 items-start'} relative`}>
          {/* Connecting line to parent */}
          <div className={`absolute ${direction === 'left' ? '-right-10' : '-left-10'} top-1/2 -translate-y-1/2 w-10 h-[2px] ${theme === 'dark' ? 'bg-indigo-500/20' : 'bg-gray-200'}`}></div>
          
          {/* Child nodes */}
          {node.children!.map((child, idx) => (
            <div key={idx} className="relative flex items-center">
               <MindMapNodeComponent 
                 node={child} 
                 level={level + 1} 
                 index={idx}
                 theme={theme}
                 direction={direction}
               />
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

const MindMapView: React.FC<MindMapViewProps> = ({ data, sourceCount, onClose, theme }) => {
  const [zoom, setZoom] = useState(0.9);
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isDragging, setIsDragging] = useState(false);
  const [isDownloading, setIsDownloading] = useState(false);
  
  const containerRef = useRef<HTMLDivElement>(null);
  const mapContentRef = useRef<HTMLDivElement>(null);
  const dragStartRef = useRef({ x: 0, y: 0 });

  useEffect(() => {
    // Har safar ma'lumot o'zgarganda markazlashtirish
    const timer = setTimeout(() => {
        setZoom(0.9);
        setPosition({ x: 0, y: 0 });
    }, 50);
    return () => clearTimeout(timer);
  }, [data]);

  const handleZoomIn = () => setZoom(prev => Math.min(prev + 0.1, 2.0));
  const handleZoomOut = () => setZoom(prev => Math.max(prev - 0.1, 0.4));
  const handleReset = () => { setZoom(0.9); setPosition({ x: 0, y: 0 }); };

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(prev => Math.min(Math.max(prev - e.deltaY * 0.001, 0.4), 2.0));
  }, []);

  useEffect(() => {
    const container = containerRef.current;
    if (container) container.addEventListener('wheel', handleWheel, { passive: false });
    return () => container?.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const onMouseDown = (e: React.MouseEvent) => {
    if (e.button !== 0) return;
    setIsDragging(true);
    dragStartRef.current = { x: e.clientX - position.x, y: e.clientY - position.y };
  };

  const onMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    setPosition({ x: e.clientX - dragStartRef.current.x, y: e.clientY - dragStartRef.current.y });
  };

  const handleDownload = async () => {
    if (!mapContentRef.current || isDownloading) return;
    setIsDownloading(true);
    try {
      const dataUrl = await htmlToImage.toJpeg(mapContentRef.current, {
        quality: 0.98,
        backgroundColor: theme === 'dark' ? '#0b0c10' : '#f8f9fa',
        pixelRatio: 2,
      });
      const link = document.createElement('a');
      link.download = `Optimal_Aqliy_Xarita.jpg`;
      link.href = dataUrl;
      link.click();
    } catch (error) { console.error(error); } finally { setIsDownloading(false); }
  };

  if (!data || !data.rootNode) return null;

  // Split children into left and right for symmetry
  const children = data.rootNode.children || [];
  const midIndex = Math.ceil(children.length / 2);
  const rightChildren = children.slice(0, midIndex);
  const leftChildren = children.slice(midIndex);

  return (
    <div 
      className={`fixed inset-0 z-[250] flex flex-col overflow-hidden ${theme === 'dark' ? 'bg-[#0b0c10] text-white' : 'bg-gray-50 text-gray-900'}`}
      onMouseUp={() => setIsDragging(false)}
      onMouseLeave={() => setIsDragging(false)}
    >
      {/* Header */}
      <div className="relative z-50 flex items-center justify-between p-6 border-b border-white/5 backdrop-blur-3xl bg-opacity-80">
        <div className="flex items-center gap-5">
          <div className="w-11 h-11 bg-gradient-to-tr from-indigo-600 to-purple-600 rounded-2xl flex items-center justify-center text-white shadow-xl shadow-indigo-500/20">
            <Compass size={22} />
          </div>
          <div>
            <h2 className="text-xl font-black tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-indigo-400 to-purple-400 uppercase">
              {data.title}
            </h2>
            <p className="text-[10px] font-bold text-gray-500 uppercase tracking-widest mt-1">
              OPTIMAL AQLIY XARITA • {sourceCount} ta manba
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4">
          <div className={`flex items-center gap-1 p-1 rounded-2xl border ${theme === 'dark' ? 'bg-black/40 border-gray-800' : 'bg-white border-gray-200'}`}>
            <button onClick={handleZoomOut} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><ZoomOut size={16} /></button>
            <span className="text-xs font-mono w-12 text-center font-bold">{Math.round(zoom * 100)}%</span>
            <button onClick={handleZoomIn} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><ZoomIn size={16} /></button>
            <div className="w-px h-5 bg-gray-500/20 mx-1"></div>
            <button onClick={handleReset} className="p-2.5 hover:bg-white/10 rounded-xl transition-all"><RotateCcw size={16} /></button>
          </div>
          <button onClick={handleDownload} disabled={isDownloading} className="px-5 py-2.5 bg-indigo-600 text-white rounded-xl text-xs font-bold hover:bg-indigo-700 transition-all shadow-xl shadow-indigo-600/20 active:scale-95">
            SAQLASH
          </button>
          <button onClick={onClose} className="p-2.5 bg-red-500/10 text-red-500 hover:bg-red-500 hover:text-white rounded-xl transition-all active:scale-95">
            <X size={20} />
          </button>
        </div>
      </div>

      {/* Map Content - Centered properly */}
      <div 
        ref={containerRef}
        className={`flex-1 overflow-hidden relative cursor-grab ${isDragging ? 'cursor-grabbing' : ''}`}
        onMouseDown={onMouseDown}
        onMouseMove={onMouseMove}
      >
        <div 
          ref={mapContentRef}
          className="absolute inset-0 flex items-center justify-center transition-transform duration-75 ease-out"
          style={{ transform: `translate(${position.x}px, ${position.y}px) scale(${zoom})` }}
        >
          {/* Main Layout Container - Tightened */}
          <div className="flex items-center justify-center gap-10">
            
            {/* Left Branches */}
            <div className="flex flex-col gap-6 items-end">
              {leftChildren.map((child, idx) => (
                <MindMapNodeComponent 
                  key={`left-${idx}`}
                  node={child} 
                  level={1} 
                  index={idx} 
                  theme={theme} 
                  direction="left"
                />
              ))}
            </div>

            {/* Central Root */}
            <div className="relative z-30">
              <MindMapNodeComponent 
                node={{ label: data.rootNode.label }} 
                level={0} 
                index={0} 
                theme={theme} 
                direction="center"
              />
            </div>

            {/* Right Branches */}
            <div className="flex flex-col gap-6 items-start">
              {rightChildren.map((child, idx) => (
                <MindMapNodeComponent 
                  key={`right-${idx}`}
                  node={child} 
                  level={1} 
                  index={idx} 
                  theme={theme} 
                  direction="right"
                />
              ))}
            </div>

          </div>
        </div>
      </div>

      {/* Control Help */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex items-center gap-4 px-6 py-3 rounded-2xl bg-black/40 border border-white/5 backdrop-blur-2xl text-[10px] font-bold text-gray-400 tracking-widest uppercase shadow-2xl">
        <div className="flex items-center gap-2"><Move size={14} className="text-indigo-400" /> Siljitish</div>
        <div className="w-px h-4 bg-white/10"></div>
        <div className="flex items-center gap-2"><ZoomIn size={14} className="text-indigo-400" /> Masshtab</div>
        <div className="w-px h-4 bg-white/10"></div>
        <div className="text-gray-500">O'qish uchun Space/Scroll'dan foydalaning</div>
      </div>
    </div>
  );
};

export default MindMapView;
