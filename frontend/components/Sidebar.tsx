
import React, { useState } from 'react';
import { 
  FileText, 
  Plus, 
  Trash2, 
  File, 
  Youtube, 
  Globe, 
  Search, 
  PanelLeftClose,
  PanelLeftOpen,
  FileSpreadsheet,
  FileJson,
  Code,
  CheckSquare,
  Square
} from 'lucide-react';
import { Source } from '../types';

interface SidebarProps {
  sources: Source[];
  activeSourceIds: Set<string>;
  onToggleSourceActive: (id: string) => void;
  onToggleAllSources: (active: boolean) => void;
  onAddSource: (source: Source) => void;
  onRemoveSource: (id: string) => void;
  selectedSourceId: string | null;
  onSelectSource: (id: string | null) => void;
  onOpenSourceAddition: () => void;
  onOpenUrlModal: () => void;
  onOpenYoutubeModal: () => void;
  onOpenSearchModal: () => void;
  theme: 'dark';
  isOpen: boolean;
  onToggle: () => void;
  canAddSource?: boolean;
  canDeleteSource?: boolean;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  sources, 
  activeSourceIds,
  onToggleSourceActive,
  onToggleAllSources,
  onRemoveSource, 
  selectedSourceId,
  onSelectSource,
  onOpenSourceAddition,
  isOpen,
  onToggle,
  canAddSource = true,
  canDeleteSource = true
}) => {
  const [searchQuery, setSearchQuery] = useState('');

  const filteredSources = sources.filter(source => 
    source.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const bgColor = 'bg-[#0f0f0f]';
  const borderColor = 'border-white/5';
  const textColor = 'text-gray-100';
  const subTextColor = 'text-gray-400';
  const inputBg = 'bg-[#1a1b1e]';

  const getSourceIcon = (source: Source) => {
    const name = source.name.toLowerCase();
    
    if (name.endsWith('.pdf')) {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-red-500/10 border border-red-500/20 shadow-sm">
          <FileText size={18} className="text-red-500" />
        </div>
      );
    }
    
    if (name.endsWith('.json') || name.endsWith('.js') || name.endsWith('.ts')) {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-orange-500/10 border border-orange-500/20 shadow-sm">
          <FileJson size={18} className="text-orange-500" />
        </div>
      );
    }

    if (name.endsWith('.py')) {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-yellow-500/10 border border-yellow-500/20 shadow-sm">
          <Code size={18} className="text-yellow-500" />
        </div>
      );
    }
    
    if (name.endsWith('.md') || name.endsWith('.txt')) {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-gray-500/10 border border-gray-500/20 shadow-sm">
          <FileText size={18} className="text-gray-400" />
        </div>
      );
    }

    if (name.endsWith('.xls') || name.endsWith('.xlsx') || name.endsWith('.csv')) {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-green-500/10 border border-green-500/20 shadow-sm">
          <FileSpreadsheet size={18} className="text-green-500" />
        </div>
      );
    }

    if (source.type === 'youtube') {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-red-600/10 border border-red-600/20 shadow-sm">
          <Youtube size={18} className="text-red-600" />
        </div>
      );
    }

    if (source.type === 'link') {
      return (
        <div className="rounded-lg p-2 flex items-center justify-center bg-blue-500/10 border border-blue-500/20 shadow-sm">
          <Globe size={18} className="text-blue-500" />
        </div>
      );
    }

    return (
      <div className="rounded-lg p-2 flex items-center justify-center bg-gray-500/10 border border-white/5 shadow-sm">
        <File size={18} className="text-gray-400" />
      </div>
    );
  };

  const isAllSelected = sources.length > 0 && activeSourceIds.size === sources.length;

  if (!isOpen) {
    return (
      <div className={`w-[68px] ${bgColor} border-r ${borderColor} flex flex-col items-center py-4 h-full shrink-0 transition-all`}>
        <button 
          onClick={onToggle}
          className="p-2.5 mb-6 rounded-xl transition-all hover:bg-white/5 text-gray-500"
        >
          <PanelLeftOpen size={20} />
        </button>

        <button 
          onClick={onOpenSourceAddition}
          className="w-10 h-10 mb-6 flex items-center justify-center rounded-xl transition-all bg-[#1a1b1e] text-blue-400 hover:bg-[#25262b]"
          style={{ display: canAddSource ? undefined : 'none' }}
        >
          <Plus size={20} />
        </button>

        <div className="flex-1 overflow-y-auto w-full flex flex-col items-center gap-4 custom-scrollbar px-1">
          {sources.map(source => (
            <button
              key={source.id}
              onClick={() => onSelectSource(source.id)}
              className={`w-10 h-10 flex items-center justify-center rounded-xl transition-all relative ${
                selectedSourceId === source.id 
                  ? 'bg-white/10' 
                  : 'hover:bg-white/5'
              } ${activeSourceIds.has(source.id) ? 'opacity-100' : 'opacity-40'}`}
            >
              {getSourceIcon(source)}
              {activeSourceIds.has(source.id) && (
                <div className="absolute top-0 right-0 w-2 h-2 bg-blue-500 rounded-full border-2 border-[#0f0f0f]"></div>
              )}
            </button>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className={`w-80 ${bgColor} border-r ${borderColor} flex flex-col h-full transition-all shadow-xl shadow-black/[0.02]`}>
      <div className={`h-16 px-6 border-b flex items-center justify-between shrink-0 ${borderColor}`}>
        <h2 className={`text-xl font-bold ${textColor}`}>Manbalar</h2>
        <button 
          onClick={onToggle}
          className="p-1.5 rounded-lg transition-all hover:bg-white/5 text-gray-400"
        >
          <PanelLeftClose size={20} />
        </button>
      </div>
      
      <div className="p-6 pt-4 space-y-4">
        <div className={`relative flex items-center p-2.5 rounded-xl ${inputBg} border border-transparent focus-within:border-blue-500/30 transition-all shadow-inner`}>
          <Search className="text-gray-500 mr-2" size={16} />
          <input 
            type="text" 
            placeholder="Manbalarni qidirish"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="bg-transparent border-none outline-none text-xs flex-1 text-gray-400 placeholder:text-gray-600 font-medium"
          />
        </div>

        <button 
          onClick={onOpenSourceAddition}
          className="flex items-center justify-center w-full gap-2 p-3 bg-[#1a1b1e] text-blue-400 hover:bg-[#25262b] rounded-xl font-bold text-sm transition-all border border-blue-500/10 shadow-sm active:scale-95"
          style={{ display: canAddSource ? undefined : 'none' }}
        >
          <Plus size={20} />
          <span>Manba qo'shish</span>
        </button>

        <div className="flex items-center justify-between px-1">
          <p className={`text-[10px] font-black uppercase tracking-[0.2em] ${subTextColor} opacity-60`}>
            Yuklanganlar ({activeSourceIds.size}/{sources.length})
          </p>
          <button 
            onClick={() => onToggleAllSources(!isAllSelected)}
            className="text-[10px] font-bold text-blue-500 hover:text-blue-400 uppercase tracking-wider"
          >
            {isAllSelected ? 'O\'chirish' : 'Hammasi'}
          </button>
        </div>
      </div>
      
      <div className="flex-1 overflow-y-auto p-4 space-y-2">
        {filteredSources.length === 0 ? (
          <div className="text-center py-20 px-4 opacity-50">
            <p className={`text-sm ${subTextColor}`}>Manbalar topilmadi.</p>
          </div>
        ) : (
          <>
            {filteredSources.map(source => (
              <div 
                key={source.id}
                onClick={() => onSelectSource(source.id)}
                className={`group relative flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-all border ${
                  selectedSourceId === source.id 
                    ? 'bg-white/5 border-white/5 shadow-md' 
                    : 'border-transparent hover:bg-white/5'
                } ${activeSourceIds.has(source.id) ? 'opacity-100' : 'opacity-40 grayscale-[0.5]'}`}
              >
                <div 
                  className="flex-shrink-0 z-10"
                  onClick={(e) => {
                    e.stopPropagation();
                    onToggleSourceActive(source.id);
                  }}
                >
                  {activeSourceIds.has(source.id) ? (
                    <CheckSquare size={18} className="text-blue-500" />
                  ) : (
                    <Square size={18} className="text-gray-600" />
                  )}
                </div>
                
                <div className="flex-shrink-0">
                  {getSourceIcon(source)}
                </div>
                
                <div className="flex-1 min-w-0">
                  <p className={`text-xs font-bold truncate ${textColor}`}>{source.name}</p>
                  <p className={`text-[10px] font-medium ${subTextColor}`}>
                    {new Date(source.timestamp).toLocaleDateString()}
                  </p>
                </div>
                
                <button 
                  onClick={(e) => {
                    e.stopPropagation();
                    onRemoveSource(source.id);
                  }}
                  className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg transition-all hover:bg-red-500/10 hover:text-red-500 text-gray-500"
                  style={{ display: canDeleteSource ? undefined : 'none' }}
                >
                  <Trash2 size={14} />
                </button>
              </div>
            ))}
          </>
        )}
      </div>

      <div className={`p-4 border-t ${borderColor} bg-[#0f0f0f] space-y-3`}>
        <div className="rounded-xl p-4 bg-[#1e1e1e] border border-white/5 shadow-inner">
          <p className="text-[10px] font-black text-indigo-500 uppercase mb-1 tracking-widest">STATUS</p>
          <p className={`text-sm font-bold text-gray-300`}>{activeSourceIds.size} ta manba faol</p>
        </div>
      </div>
    </div>
  );
};

export default Sidebar;
