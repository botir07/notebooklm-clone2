import React, { useState, useRef, useEffect } from 'react';
import { StudioSidebar } from './components/StudioSidebar'; 
import { ProjectSidebar } from './components/ProjectSidebar';
import { ChatWorkspace } from './components/ChatWorkspace';
import { ImageEditor } from './components/ImageEditor';
import { AdminPage } from './components/AdminPage';
import { analyzeSource, generatePresentation, generateFlashcards, generateQuiz } from './services/geminiService';
import { Source, Project } from './types';

const API_URL = 'http://localhost:5001/api';

const App: React.FC = () => {
  const [activeTab, setActiveTab] = useState<'chat' | 'editor'>('chat');
  const [sources, setSources] = useState<Source[]>([]);
  const [projects, setProjects] = useState<Project[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [currentPage, setCurrentPage] = useState<'main' | 'admin'>(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'main';
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [isAdminAuthed, setIsAdminAuthed] = useState(!!localStorage.getItem('adminToken'));
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const adminFileRef = useRef<HTMLInputElement>(null);
  const [isKeyOpen, setIsKeyOpen] = useState(false);
  const [apiKeyInput, setApiKeyInput] = useState(() => {
    return localStorage.getItem('openrouterApiKey') || '';
  });

  const addSource = async (newSource: { id?: string, name: string, data?: string, type: 'pdf' | 'text', createdAt?: number }) => {
    const id = newSource.id || Math.random().toString(36).substr(2, 9);
    const sourceObj: Source = {
      id,
      name: newSource.name,
      data: newSource.data,
      type: newSource.type,
      isAnalyzing: !!newSource.data,
      createdAt: newSource.createdAt || Date.now()
    };
    setSources(prev => [sourceObj, ...prev]);
    if (newSource.data) {
      try {
        const analysis = await analyzeSource(newSource.data);
        setSources(prev => prev.map(s => s.id === id ? { ...s, analysis, isAnalyzing: false } : s));
      } catch (err) {
        setSources(prev => prev.map(s => s.id === id ? { ...s, isAnalyzing: false } : s));
      }
    }
  };

  const mapApiSource = (source: any): Source => {
    const createdAt = source.created_at ? new Date(source.created_at).getTime() : Date.now();
    const type = source.file_type === 'pdf' ? 'pdf' : 'text';
    return {
      id: String(source.id),
      name: source.name,
      data: source.content,
      type,
      isAnalyzing: false,
      createdAt
    };
  };

  const fetchPublicSources = async () => {
    try {
      const response = await fetch(`${API_URL}/public/sources`);
      const data = await response.json();
      if (!response.ok || !data.success) return;
      const mapped = (data.sources || []).map(mapApiSource);
      setSources(mapped);
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  const removeSource = async (id: string) => {
    if (!adminToken) return;
    try {
      const response = await fetch(`${API_URL}/sources/${id}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${adminToken}`
        }
      });
      if (!response.ok) {
        throw new Error('Delete failed');
      }
      await fetchPublicSources();
    } catch (error) {
      console.error('Delete source error:', error);
    }
  };

  const handleStudioAction = async (type: string) => {
    if (sources.length === 0) return alert("Avval PDF yuklang!");
    setIsGenerating(true);
    try {
      let result;
      const latest = sources[sources.length - 1];
      if (type === 'slaydlar') result = await generatePresentation(latest);
      else if (type === 'kartochka') result = await generateFlashcards(latest);
      else if (type === 'testlar') result = await generateQuiz(latest);
      
      const newProject: Project = {
        id: Date.now().toString(),
        title: "Loyiha: " + type,
        type: type as any,
        content: result,
        createdAt: Date.now()
      };
      setProjects(prev => [newProject, ...prev]);
    } catch (err) {
      alert("AI xatosi yuz berdi");
    } finally { setIsGenerating(false); }
  };

  const handleAdminLogin = (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    fetch(`${API_URL}/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username: adminUsername, password: adminPassword })
    })
      .then(async (res) => {
        const data = await res.json();
        if (!res.ok || !data.token) {
          throw new Error(data.message || 'Login xato');
        }
        localStorage.setItem('adminToken', data.token);
        setAdminToken(data.token);
        setIsAdminAuthed(true);
        setAdminPassword('');
      })
      .catch((err) => {
        setAdminError(err.message || 'Login xato');
      });
  };

  const handleAdminLogout = () => {
    setIsAdminAuthed(false);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    setAdminUsername('');
    setAdminPassword('');
  };

  const handleAdminFile = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !adminToken) return;
    const reader = new FileReader();
    const isPdf = file.type === 'application/pdf';

    reader.onloadend = async () => {
      const raw = reader.result as string;
      const data = isPdf ? raw.split(',')[1] : raw;
      const payload = {
        name: file.name,
        content: data,
        type: 'file',
        fileType: isPdf ? 'pdf' : 'text',
        metadata: {},
        tags: []
      };

      try {
        const response = await fetch(`${API_URL}/sources`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${adminToken}`
          },
          body: JSON.stringify(payload)
        });

        const result = await response.json();
        if (!response.ok || !result.source) {
          throw new Error(result.message || 'Upload failed');
        }

        await addSource({
          id: String(result.source.id),
          name: result.source.name,
          data: result.source.content,
          type: isPdf ? 'pdf' : 'text',
          createdAt: Date.now()
        });
      } catch (error) {
        console.error('Upload error:', error);
      }
    };

    if (isPdf) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const handleSaveApiKey = () => {
    const trimmed = apiKeyInput.trim();
    if (trimmed) {
      localStorage.setItem('openrouterApiKey', trimmed);
    } else {
      localStorage.removeItem('openrouterApiKey');
    }
    setIsKeyOpen(false);
  };

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname === '/admin' ? 'admin' : 'main');
    };
    window.addEventListener('popstate', handlePopState);
    fetchPublicSources();
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: '/' | '/admin') => {
    window.history.pushState({}, '', path);
    setCurrentPage(path === '/admin' ? 'admin' : 'main');
  };

  if (currentPage === 'admin') {
    return (
      <AdminPage
        isAdminAuthed={isAdminAuthed}
        adminUsername={adminUsername}
        adminPassword={adminPassword}
        adminError={adminError}
        sources={sources}
        onUsernameChange={setAdminUsername}
        onPasswordChange={setAdminPassword}
        onLogin={handleAdminLogin}
        onLogout={handleAdminLogout}
        onBack={() => navigate('/')}
        onUploadClick={() => adminFileRef.current?.click()}
        onFileChange={handleAdminFile}
        onDeleteSource={removeSource}
        adminFileRef={adminFileRef}
      />
    );
  }

  return (
    <div className="flex h-screen bg-slate-50 overflow-hidden">
      <StudioSidebar projects={projects || []} onAction={handleStudioAction} isGenerating={isGenerating} />
      <ProjectSidebar sources={sources || []} onAddSource={addSource} canUpload={false} />
      <main className="flex-1 flex flex-col bg-white shadow-2xl m-2 rounded-[2rem] overflow-hidden border">
        <header className="h-16 border-b flex items-center justify-between px-8 bg-slate-50/50">
          <h1 className="font-black text-indigo-600">BILIMGRAFIK AI</h1>
          <div className="flex items-center gap-3">
            <div className="flex bg-white p-1 rounded-xl border">
              <button onClick={() => setActiveTab('chat')} className={`px-6 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'chat' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>CHAT</button>
              <button onClick={() => setActiveTab('editor')} className={`px-6 py-1.5 rounded-lg text-xs font-bold ${activeTab === 'editor' ? 'bg-indigo-600 text-white' : 'text-slate-500'}`}>EDITOR</button>
            </div>
            <button
              onClick={() => setIsKeyOpen(true)}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border bg-white text-slate-600 border-slate-200 hover:bg-slate-50"
            >
              API Key
            </button>
          </div>
        </header>
        <div className="flex-1 relative overflow-hidden">
          {activeTab === 'chat' ? <ChatWorkspace sources={sources || []} onNewInfographic={(d) => setProjects(p => [d, ...p])} /> : <ImageEditor />}
        </div>
        {isKeyOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/40 backdrop-blur-sm">
            <div className="w-full max-w-md rounded-2xl bg-white border shadow-xl p-6">
              <h3 className="text-sm font-black uppercase tracking-widest text-slate-600">OpenRouter API Key</h3>
              <p className="mt-2 text-xs text-slate-400">Key brauzerda saqlanadi. Xohlasangiz keyni o'chirib tashlashingiz mumkin.</p>
              <input
                type="password"
                value={apiKeyInput}
                onChange={(e) => setApiKeyInput(e.target.value)}
                className="mt-4 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500"
                placeholder="sk-..."
              />
              <div className="mt-5 flex justify-end gap-2">
                <button
                  onClick={() => setIsKeyOpen(false)}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50"
                >
                  Bekor
                </button>
                <button
                  onClick={handleSaveApiKey}
                  className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest bg-slate-900 text-white hover:bg-slate-800"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};
export default App;
