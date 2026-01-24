import React, { useState, useEffect, useRef } from 'react';
import { AuthProvider, useAuth } from './components/AuthContext';
import AuthPage from './components/AuthPage';
import Sidebar from './components/Sidebar';
import ChatInterface from './components/ChatInterface';
import NotesPanel from './components/NotesPanel';
import QuizView from './components/QuizView';
import FlashcardView from './components/FlashcardView';
import MindMapView from './components/MindMapView';
import SourceContentView from './components/SourceContentView';
import InfographicView from './components/InfographicView';
import PresentationView from './components/PresentationView';
import AdminPage from './components/AdminPage';
import SettingsModal from './components/SettingsModal';
import ProfileStatsModal from './components/ProfileStatsModal';
import QuizSetupModal from './components/QuizSetupModal';
import FlashcardSetupModal from './components/FlashcardSetupModal';
import InfographicSetupModal from './components/InfographicSetupModal';
import PresentationSetupModal from './components/PresentationSetupModal';
import MindMapSetupModal from './components/MindMapSetupModal';
import SourceAdditionModal from './components/SourceAdditionModal';
import { Source, Note, StudyMaterialType, QuizData, FlashcardData, MindMapData, PresentationData } from './types';
import {
  BookOpen, X, LogOut, PanelLeftOpen, PanelRightOpen, Settings
} from 'lucide-react';
import { geminiService, QuizConfig, FlashcardConfig, InfographicConfig, PresentationConfig, MindMapConfig, AnyAIConfig } from './services/geminiService';

const API_HOST = typeof window !== 'undefined' ? window.location.hostname : 'localhost';
const API_URL = `${window.location.protocol}//${API_HOST}:5001/api`;

const getInitialTheme = (): 'light' | 'dark' => {
  const stored = localStorage.getItem('theme');
  return stored === 'light' ? 'light' : 'dark';
};

const getInitialApiKey = (): string => {
  const stored = localStorage.getItem('OPENROUTER_API_KEY');
  const envKey = (import.meta as any).env?.VITE_OPENROUTER_API_KEY || '';
  return stored || envKey;
};

const formatDuration = (ms: number): string => {
  const totalSeconds = Math.max(0, Math.floor(ms / 1000));
  const hours = Math.floor(totalSeconds / 3600);
  const minutes = Math.floor((totalSeconds % 3600) / 60);
  const seconds = totalSeconds % 60;
  if (hours > 0) {
    return `${hours} soat ${minutes} daqiqa`;
  }
  if (minutes > 0) {
    return `${minutes} daqiqa ${seconds} soniya`;
  }
  return `${seconds} soniya`;
};

const MainApp: React.FC = () => {
  const { user, logout, updateProfile } = useAuth();
  const [sources, setSources] = useState<Source[]>([]);
  const [activeSourceIds, setActiveSourceIds] = useState<Set<string>>(new Set());
  const [selectedSourceId, setSelectedSourceId] = useState<string | null>(null);
  const [notes, setNotes] = useState<Note[]>([]);
  const [generatingMaterials, setGeneratingMaterials] = useState<Set<StudyMaterialType>>(new Set());
  const [isNotesOpen, setIsNotesOpen] = useState(true);
  const [isSidebarOpen, setIsSidebarOpen] = useState(true);
  const [currentPage, setCurrentPage] = useState<'main' | 'admin'>(() => {
    return window.location.pathname === '/admin' ? 'admin' : 'main';
  });
  const [adminToken, setAdminToken] = useState<string | null>(() => localStorage.getItem('adminToken'));
  const [isAdminAuthed, setIsAdminAuthed] = useState(!!localStorage.getItem('adminToken'));
  const [adminUsername, setAdminUsername] = useState('');
  const [adminPassword, setAdminPassword] = useState('');
  const [adminError, setAdminError] = useState('');
  const adminFileRef = useRef<HTMLInputElement>(null);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isProfileOpen, setIsProfileOpen] = useState(false);
  const [theme, setTheme] = useState<'light' | 'dark'>(() => getInitialTheme());
  const [apiKey, setApiKey] = useState(() => getInitialApiKey());
  const [apiKeyInput, setApiKeyInput] = useState('');
  const [baseTimeMs] = useState(() => Number(localStorage.getItem('totalTimeMs') || 0));
  const [sessionStart] = useState(() => Date.now());
  const [totalTimeMs, setTotalTimeMs] = useState(() => Number(localStorage.getItem('totalTimeMs') || 0));
  const [profileUsername, setProfileUsername] = useState('');
  const [profilePassword, setProfilePassword] = useState('');
  const [profileError, setProfileError] = useState('');
  const [isProfileSaving, setIsProfileSaving] = useState(false);

  const [workspaceName] = useState('Research Workspace');

  const [isSourceAdditionOpen, setIsSourceAdditionOpen] = useState(false);
  const [isNoteModalOpen, setIsNoteModalOpen] = useState(false);
  const [isQuizSetupOpen, setIsQuizSetupOpen] = useState(false);
  const [isFlashcardSetupOpen, setIsFlashcardSetupOpen] = useState(false);
  const [isInfographicSetupOpen, setIsInfographicSetupOpen] = useState(false);
  const [isPresentationSetupOpen, setIsPresentationSetupOpen] = useState(false);
  const [isMindMapSetupOpen, setIsMindMapSetupOpen] = useState(false);

  const [activeQuiz, setActiveQuiz] = useState<{ data: QuizData, sourceCount: number } | null>(null);
  const [activeFlashcards, setActiveFlashcards] = useState<{ data: FlashcardData, sourceCount: number } | null>(null);
  const [activeMindMap, setActiveMindMap] = useState<{ data: MindMapData, sourceCount: number } | null>(null);
  const [activeInfographic, setActiveInfographic] = useState<{ url: string, title: string } | null>(null);
  const [activePresentation, setActivePresentation] = useState<{ data: PresentationData, sourceCount: number } | null>(null);

  const [editNote, setEditNote] = useState<{ id?: string; title: string; content: string }>({ title: '', content: '' });

  const selectedSource = sources.find(s => s.id === selectedSourceId);
  const isDark = theme === 'dark';
  const sessionTimeMs = Math.max(0, totalTimeMs - baseTimeMs);
  const materialsByType = {
    'Xulosa': notes.filter((n) => !n.type || n.type === 'reminders').length,
    'Test': notes.filter((n) => n.type === 'quiz').length,
    'Kartochka': notes.filter((n) => n.type === 'flashcard').length,
    'Aqliy xarita': notes.filter((n) => n.type === 'mindmap').length,
    'Infografika': notes.filter((n) => n.type === 'infographic').length,
    'Taqdimot': notes.filter((n) => n.type === 'presentation').length,
    'Tugatilgan mavzular': notes.filter((n) => n.type === 'topicComplete').length
  };
  const materialsTotal = Object.values(materialsByType).reduce((sum, count) => sum + count, 0);

  useEffect(() => {
    document.documentElement.classList.toggle('dark', theme === 'dark');
    document.body.style.backgroundColor = theme === 'dark' ? '#121212' : '#f8fafc';
    document.body.style.color = theme === 'dark' ? '#f3f4f6' : '#0f172a';
    localStorage.setItem('theme', theme);
  }, [theme]);

  useEffect(() => {
    const tick = () => {
      const next = baseTimeMs + (Date.now() - sessionStart);
      setTotalTimeMs(next);
      localStorage.setItem('totalTimeMs', String(next));
    };
    tick();
    const id = window.setInterval(tick, 1000);
    return () => window.clearInterval(id);
  }, [baseTimeMs, sessionStart]);

  useEffect(() => {
    const demoSource: Source = {
      id: 'demo-1',
      name: 'Welcome Guide.md',
      content: 'Gemini Notebook — bu matnli hujjatlarni tahlil qilishga yordam beradigan dastur bo\'lib, quyidagi imkoniyatlarni taqdim etadi: \n\n* **Fayllarni yuklash:** Chap tarafdagi "Manbalar" bo\'limiga `.txt` yoki `.md` formatidagi hujjatlarni yuklashingiz mumkin.\n* **Muloqot:** Yuklangan hujjatlar yuzasitasidan chat orqali savollar berish imkoniyati mavjud.\n* **Qaydlar:** Muhim ma\'lumotlarni o\'ng tarafdagi daftaringizga saqlab qo\'yishingiz mumkin.',
      type: 'file',
      timestamp: Date.now(),
    };
    setSources([]);
    setActiveSourceIds(new Set());
  }, []);

  useEffect(() => {
    const media = window.matchMedia('(max-width: 1023px)');
    const handle = (event: MediaQueryListEvent | MediaQueryList) => {
      const isSmall = 'matches' in event ? event.matches : media.matches;
      if (isSmall) {
        setIsSidebarOpen(false);
        setIsNotesOpen(false);
      }
    };

    handle(media);
    if ('addEventListener' in media) {
      media.addEventListener('change', handle);
      return () => media.removeEventListener('change', handle);
    }
    // @ts-expect-error - Safari fallback
    media.addListener(handle);
    // @ts-expect-error - Safari fallback
    return () => media.removeListener(handle);
  }, []);

  const fetchPublicSources = async () => {
    try {
      const response = await fetch(`${API_URL}/public/sources`);
      const data = await response.json();
      if (!response.ok || !data.success) return;
      const mapped = (data.sources || []).map((source: any): Source => ({
        id: String(source.id),
        name: source.name,
        content: source.content || '',
        type: source.type || 'file',
        fileType: source.file_type || source.fileType || undefined,
        timestamp: source.created_at ? new Date(source.created_at).getTime() : Date.now(),
        metadata: source.metadata || {}
      }));
      setSources(mapped);
      setActiveSourceIds(new Set(mapped.map((source: Source) => source.id)));
    } catch (error) {
      console.error('Failed to load sources:', error);
    }
  };

  useEffect(() => {
    fetchPublicSources();
  }, []);

  useEffect(() => {
    if (!isSettingsOpen) return;
    setProfileUsername(user?.username || '');
    setProfilePassword('');
    setProfileError('');
    setApiKeyInput(apiKey);
  }, [isSettingsOpen, user, apiKey]);

  useEffect(() => {
    const handlePopState = () => {
      setCurrentPage(window.location.pathname === '/admin' ? 'admin' : 'main');
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigate = (path: '/' | '/admin') => {
    window.history.pushState({}, '', path);
    setCurrentPage(path === '/admin' ? 'admin' : 'main');
  };

  const getEnabledSources = () => sources.filter(s => activeSourceIds.has(s.id));

  const handleAddSource = (source: Source) => {
    setSources(prev => [source, ...prev]);
    setActiveSourceIds(prev => new Set(prev).add(source.id));
  };

  const handleRemoveSource = (id: string) => {
    setSources(prev => prev.filter(s => s.id !== id));
    setActiveSourceIds(prev => {
      const next = new Set(prev);
      next.delete(id);
      return next;
    });
    if (selectedSourceId === id) setSelectedSourceId(null);
  };

  const handleAdminLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setAdminError('');
    try {
      const response = await fetch(`${API_URL}/auth/login`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ username: adminUsername, password: adminPassword })
      });
      const data = await response.json();
      if (!response.ok || !data.token) {
        throw new Error(data.message || 'Login xato');
      }
      localStorage.setItem('adminToken', data.token);
      setAdminToken(data.token);
      setIsAdminAuthed(true);
      setAdminPassword('');
    } catch (error: any) {
      setAdminError(error.message || 'Login xato');
    }
  };

  const handleAdminLogout = () => {
    setIsAdminAuthed(false);
    setAdminToken(null);
    localStorage.removeItem('adminToken');
    setAdminUsername('');
    setAdminPassword('');
  };

  const handleUserCredentialsSave = async () => {
    const nextUsername = profileUsername.trim();
    const nextPassword = profilePassword.trim();
    if (!nextUsername && !nextPassword) return;
    setIsProfileSaving(true);
    setProfileError('');
    try {
      await updateProfile({
        ...(nextUsername ? { username: nextUsername } : {}),
        ...(nextPassword ? { password: nextPassword } : {})
      });
      setProfilePassword('');
      setIsSettingsOpen(false);
    } catch (error: any) {
      setProfileError(error.message || 'Login yoki parol xato');
    } finally {
      setIsProfileSaving(false);
    }
  };

  const handlePreferencesSave = () => {
    const nextKey = apiKeyInput.trim();
    if (nextKey) {
      setApiKey(nextKey);
      localStorage.setItem('OPENROUTER_API_KEY', nextKey);
    } else {
      setApiKey('');
      localStorage.removeItem('OPENROUTER_API_KEY');
    }
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
        await fetchPublicSources();
      } catch (error) {
        console.error('Upload error:', error);
      }
    };

    if (isPdf) reader.readAsDataURL(file);
    else reader.readAsText(file);
  };

  const handleAdminDeleteSource = async (id: string) => {
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

  const toggleSourceActive = (id: string) => {
    setActiveSourceIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const toggleAllSources = (active: boolean) => {
    if (active) setActiveSourceIds(new Set(sources.map(s => s.id)));
    else setActiveSourceIds(new Set());
  };

  const handleLaunchMaterial = (note: Note) => {
    if (note.type === 'quiz' && note.quizData) {
      setActiveQuiz({ data: note.quizData, sourceCount: note.sourceCount || 0 });
    } else if (note.type === 'flashcard' && note.flashcardData) {
      // FlashcardData strukturasini tekshirish va tuzatish
      let flashcardData = note.flashcardData;

      // Agar flashcardData faqat cards massivi bo'lsa
      if (Array.isArray(flashcardData) && !flashcardData.title) {
        flashcardData = {
          title: note.title || 'Kartochkalar',
          cards: flashcardData
        };
      }

      setActiveFlashcards({
        data: flashcardData as FlashcardData,
        sourceCount: note.sourceCount || 0
      });
    } else if (note.type === 'mindmap' && note.mindMapData) {
      setActiveMindMap({ data: note.mindMapData, sourceCount: note.sourceCount || 0 });
    } else if (note.type === 'infographic' && note.infographicImageUrl) {
      setActiveInfographic({ url: note.infographicImageUrl, title: note.title });
    } else if (note.type === 'presentation' && note.presentationData) {
      setActivePresentation({ data: note.presentationData, sourceCount: note.sourceCount || 0 });
    } else {
      setEditNote({ id: note.id, title: note.title, content: note.content });
      setIsNoteModalOpen(true);
    }
  };

  const handleAddNote = (noteData: Omit<Note, 'id' | 'timestamp'>) => {
    const newNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: noteData.title || 'Chatdan eslatma',
      content: noteData.content,
      timestamp: Date.now(),
      sourceCount: getEnabledSources().length
    };
    setNotes(prev => [newNote, ...prev]);
  };

  const saveNoteFromModal = () => {
    if (!editNote.content.trim()) return;
    if (editNote.id) {
      setNotes(prev => prev.map(n => n.id === editNote.id ? { ...n, title: editNote.title, content: editNote.content } : n));
    } else {
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: editNote.title || 'Sarlavhasiz eslatma',
        content: editNote.content,
        timestamp: Date.now(),
        sourceCount: getEnabledSources().length
      };
      setNotes(prev => [newNote, ...prev]);
    }
    setIsNoteModalOpen(false);
    setEditNote({ title: '', content: '' });
  };

  const handleRemoveNote = (id: string) => setNotes(prev => prev.filter(n => n.id !== id));

  const buildSummarySource = (selectedSources: Source[], customContext?: string): Source => {
    if (customContext && customContext.trim()) {
      return {
        id: 'summary-temp',
        name: 'Tanlangan matn',
        content: customContext,
        type: 'text',
        timestamp: Date.now(),
        metadata: {}
      };
    }

    const joined = selectedSources
      .map((source) => {
        const text = source.metadata?.text || source.content || '';
        if (!text) return '';
        return `# ${source.name}\n${text}`;
      })
      .filter(Boolean)
      .join('\n\n');

    return {
      id: 'summary-temp',
      name: 'Tanlangan manbalar',
      content: joined,
      type: 'text',
      timestamp: Date.now(),
      metadata: {}
    };
  };

  const buildPdfContext = (selectedSources: Source[]): string => {
    const joined = selectedSources
      .map((source) => {
        const text = source.metadata?.text || source.content || '';
        if (!text) return '';
        return `# ${source.name}\n${text}`;
      })
      .filter(Boolean)
      .join('\n\n');
    if (!joined.trim()) return '';
    return `Faqat quyidagi PDF matniga tayangan holda javob bering. Tashqi bilim ishlatmang.\n\n${joined}`;
  };

  const handleSummaryAction = async (customContext?: string) => {
    const enabledSources = getEnabledSources();
    if (enabledSources.length === 0 && !customContext) {
      alert("Iltimos, avval kamida bitta manbani belgilang.");
      return;
    }

    setGeneratingMaterials(prev => new Set(prev).add('reminders'));
    try {
      const summarySource = buildSummarySource(enabledSources, customContext);
      const summary = await geminiService.summarizeSource(summarySource);
      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: customContext ? 'Xulosa (tanlangan matn)' : 'Xulosa',
        content: summary,
        timestamp: Date.now(),
        type: 'reminders',
        sourceCount: customContext ? 1 : enabledSources.length
      };
      setNotes(prev => [newNote, ...prev]);
    } catch (error) {
      console.error("Xulosa yaratishda xatolik:", error);
      alert("Xulosa yaratishda xatolik yuz berdi.");
    } finally {
      setGeneratingMaterials(prev => {
        const n = new Set(prev);
        n.delete('reminders');
        return n;
      });
    }
  };

  const handleTopicCompleted = async () => {
    const enabledSources = getEnabledSources();
    if (enabledSources.length === 0) {
      alert("Iltimos, avval kamida bitta manbani belgilang.");
      return;
    }

    const pdfSources = enabledSources.filter((source) => source.fileType === 'pdf');
    const targetPdfSources = selectedSource?.fileType === 'pdf'
      ? pdfSources.filter((source) => source.id === selectedSource.id)
      : pdfSources;

    if (targetPdfSources.length === 0) {
      alert("PDF manba topilmadi. Testlar faqat PDF matnidan yaratiladi.");
      return;
    }

    const defaultTopic = selectedSource?.name || (targetPdfSources.length === 1 ? targetPdfSources[0].name : '');
    const cleanedTopic = defaultTopic ? defaultTopic.replace(/\.[^.]+$/, '') : '';
    const topicName = cleanedTopic || window.prompt("Qaysi mavzu tugatildi?", "")?.trim();

    if (!topicName) return;

    const pdfContext = buildPdfContext(targetPdfSources);
    if (!pdfContext) {
      alert("PDF matnini o'qib bo'lmadi. Iltimos, boshqa manba tanlang.");
      return;
    }

    setGeneratingMaterials(prev => new Set(prev).add('quiz'));

    const completedNote: Note = {
      id: Math.random().toString(36).substr(2, 9),
      title: `Mavzu tugatildi: ${topicName}`,
      content: `Tugatilgan mavzu: ${topicName}`,
      timestamp: Date.now(),
      type: 'topicComplete',
      sourceCount: targetPdfSources.length
    };
    setNotes(prev => [completedNote, ...prev]);

    try {
      const quizSource: Source = {
        id: 'topic-complete',
        name: 'PDF kontekst',
        content: pdfContext,
        type: 'text',
        timestamp: Date.now(),
        metadata: {}
      };
      const quizResult = await geminiService.generateStudyMaterial('quiz', [quizSource], {
        questionCount: 'more',
        difficulty: 'hard',
        topic: topicName
      }) as QuizData;
      const shuffledQuiz = quizResult?.questions?.length ? shuffleQuizOptions(quizResult) : quizResult;
      const quizNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: `${topicName} testi`,
        content: JSON.stringify(shuffledQuiz),
        timestamp: Date.now(),
        type: 'quiz',
        sourceCount: targetPdfSources.length,
        quizData: shuffledQuiz
      };
      setNotes(prev => [quizNote, ...prev]);
    } catch (error) {
      console.error("Test yaratishda xatolik:", error);
      alert("Test yaratishda xatolik yuz berdi.");
    } finally {
      setGeneratingMaterials(prev => {
        const n = new Set(prev);
        n.delete('quiz');
        return n;
      });
    }
  };

  const shuffleQuizOptions = (quiz: QuizData): QuizData => {
    const shuffledQuestions = quiz.questions.map((question) => {
      const options = question.options.map((option, index) => ({ option, index }));
      for (let i = options.length - 1; i > 0; i -= 1) {
        const j = Math.floor(Math.random() * (i + 1));
        [options[i], options[j]] = [options[j], options[i]];
      }
      const newOptions = options.map((item) => item.option);
      const newCorrectIndex = options.findIndex((item) => item.index === question.correctAnswerIndex);
      return {
        ...question,
        options: newOptions,
        correctAnswerIndex: newCorrectIndex
      };
    });

    return {
      ...quiz,
      questions: shuffledQuestions
    };
  };

  const handleAdvanceTopic = () => {
    if (!selectedSourceId) {
      alert("Keyingi mavzuga o'tish uchun manba tanlang.");
      return;
    }

    const activeSources = sources.filter((source) => activeSourceIds.has(source.id));
    if (activeSources.length === 0) {
      alert("Faol manba topilmadi.");
      return;
    }

    const currentIndex = activeSources.findIndex((source) => source.id === selectedSourceId);
    const nextSource = currentIndex >= 0 ? activeSources[currentIndex + 1] : activeSources[0];
    if (!nextSource) {
      alert("Keyingi mavzu topilmadi.");
      return;
    }

    setSelectedSourceId(nextSource.id);
    setActiveQuiz(null);
  };

  const handleAIAction = async (type: StudyMaterialType, aiConfig?: AnyAIConfig, customContext?: string) => {
    if (type === 'topicComplete') {
      await handleTopicCompleted();
      return;
    }
    if (type === 'reminders') {
      await handleSummaryAction(customContext);
      return;
    }

    const enabledSources = getEnabledSources();
    if (enabledSources.length === 0 && !customContext) {
      alert("Iltimos, avval kamida bitta manbani belgilang.");
      return;
    }

    if (type === 'quiz' && !aiConfig) { setIsQuizSetupOpen(true); return; }
    if (type === 'flashcard' && !aiConfig) { setIsFlashcardSetupOpen(true); return; }
    if (type === 'infographic' && !aiConfig) { setIsInfographicSetupOpen(true); return; }
    if (type === 'presentation' && !aiConfig) { setIsPresentationSetupOpen(true); return; }
    if (type === 'mindmap' && !aiConfig) { setIsMindMapSetupOpen(true); return; }

    setGeneratingMaterials(prev => new Set(prev).add(type));
    setIsQuizSetupOpen(false);
    setIsFlashcardSetupOpen(false);
    setIsInfographicSetupOpen(false);
    setIsPresentationSetupOpen(false);
    setIsMindMapSetupOpen(false);

    try {
      let result: any;
      let infographicUrl: string | undefined;
      const activeSources = customContext ? [{ id: 'temp', name: 'Tanlangan matn', content: customContext, type: 'text' as const, timestamp: Date.now() }] : enabledSources;

      if (type === 'infographic') {
        infographicUrl = await geminiService.generateInfographicImage(activeSources, aiConfig as InfographicConfig);
        result = "Infografika rasmi yaratildi.";
      } else {
        result = await geminiService.generateStudyMaterial(type, activeSources, aiConfig);
      }

      // Flashcard data strukturasini tuzatish
      if (type === 'flashcard' && Array.isArray(result) && !result.title) {
        result = {
          title: customContext ? 'Tanlangan kartochkalar' : 'Kartochkalar',
          cards: result
        };
      }
      if (type === 'quiz' && result?.questions?.length) {
        result = shuffleQuizOptions(result as QuizData);
      }

      const labels: Record<StudyMaterialType, string> = {
        infographic: 'Infografika',
        mindmap: 'Aqliy xarita',
        quiz: 'Test',
        presentation: 'Taqdimot',
        reminders: 'Xulosa',
        flashcard: 'Kartochka',
        topicComplete: 'Mavzu tugatildi'
      };

      const newNote: Note = {
        id: Math.random().toString(36).substr(2, 9),
        title: customContext ? `${labels[type]} (Tanlangan)` : labels[type],
        content: typeof result === 'string' ? result : JSON.stringify(result),
        timestamp: Date.now(),
        type,
        sourceCount: activeSources.length,
        quizData: type === 'quiz' ? result : undefined,
        flashcardData: type === 'flashcard' ? result : undefined,
        mindMapData: type === 'mindmap' ? result : undefined,
        presentationData: type === 'presentation' ? result : undefined,
        infographicImageUrl: infographicUrl
      };
      setNotes(prev => [newNote, ...prev]);
    } catch (e) {
      console.error("AI material yaratishda xatolik:", e);
      alert("Xatolik yuz berdi. Iltimos, qaytadan urinib ko'ring.");
    } finally {
      setGeneratingMaterials(prev => {
        const n = new Set(prev);
        n.delete(type);
        return n;
      });
    }
  };

  const handleActionWithSelection = (text: string, type: StudyMaterialType | 'note' | 'chat') => {
    if (type === 'note') {
      handleAddNote({ title: 'Tanlangan matndan', content: text });
    } else if (type === 'chat') {
      handleAIAction('reminders', undefined, text);
    } else {
      handleAIAction(type as StudyMaterialType, undefined, text);
    }
  };

  // FlashcardData obyektini to'g'ri formatda tekshirish
  useEffect(() => {
    if (activeFlashcards?.data) {
      console.log('Flashcard data:', activeFlashcards.data);

      // Data strukturasini tekshirish va tuzatish
      if (Array.isArray(activeFlashcards.data)) {
        // Agar data faqat cards massivi bo'lsa
        const fixedData = {
          title: 'Kartochkalar',
          cards: activeFlashcards.data
        };
        setActiveFlashcards(prev => prev ? {
          ...prev,
          data: fixedData
        } : null);
      } else if (!activeFlashcards.data.cards || !Array.isArray(activeFlashcards.data.cards)) {
        console.error('FlashcardData.cards massiv emas yoki mavjud emas');
        setActiveFlashcards(null);
      }
    }
  }, [activeFlashcards]);

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
        onDeleteSource={handleAdminDeleteSource}
        adminFileRef={adminFileRef}
      />
    );
  }

  return (
    <div className={`flex h-screen w-full overflow-hidden ${isDark ? 'bg-[#121212] text-gray-100' : 'bg-slate-50 text-gray-900'}`}>
      {(isSidebarOpen || isNotesOpen) && (
        <button
          className="fixed inset-0 z-30 bg-black/60 md:hidden"
          onClick={() => {
            setIsSidebarOpen(false);
            setIsNotesOpen(false);
          }}
          aria-label="Close overlays"
        />
      )}
      <Sidebar
        sources={sources}
        activeSourceIds={activeSourceIds}
        onToggleSourceActive={toggleSourceActive}
        onToggleAllSources={toggleAllSources}
        onAddSource={handleAddSource}
        onRemoveSource={handleRemoveSource}
        selectedSourceId={selectedSourceId}
        onSelectSource={setSelectedSourceId}
        onOpenSourceAddition={() => setIsSourceAdditionOpen(true)}
        onOpenUrlModal={() => { }}
        onOpenYoutubeModal={() => { }}
        onOpenSearchModal={() => { }}
        theme={theme}
        isOpen={isSidebarOpen}
        onToggle={() => setIsSidebarOpen(!isSidebarOpen)}
        canAddSource={false}
        canDeleteSource={false}
      />

      <main className={`flex-1 flex flex-col overflow-hidden relative ${isDark ? 'bg-[#1a1a1a]' : 'bg-white'}`}>
        <header className={`min-h-16 px-4 sm:px-8 py-3 sm:py-0 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between border-b shrink-0 ${isDark ? 'bg-[#1e1e1e] border-gray-800' : 'bg-white border-gray-200'}`}>
          <div className="flex items-center gap-3 sm:gap-4">
            <div className="flex items-center gap-2 md:hidden">
              <button
                onClick={() => setIsSidebarOpen(true)}
                className={`p-2 rounded-xl border ${isDark
                  ? 'bg-gray-800/50 border-gray-700 text-gray-200 hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                aria-label="Open sources"
              >
                <PanelLeftOpen size={18} />
              </button>
              <button
                onClick={() => setIsNotesOpen(true)}
                className={`p-2 rounded-xl border ${isDark
                  ? 'bg-gray-800/50 border-gray-700 text-gray-200 hover:bg-gray-800'
                  : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                  }`}
                aria-label="Open notes"
              >
                <PanelRightOpen size={18} />
              </button>
            </div>
            <div className="bg-indigo-600 text-white p-2 rounded-lg">
              <BookOpen size={20} />
            </div>
            <h1 className="text-lg font-bold text-white">{workspaceName}</h1>
          </div>
          <div className="flex items-center gap-3 sm:gap-4 justify-between sm:justify-end w-full sm:w-auto">
            <button
              onClick={() => setIsProfileOpen(true)}
              className={`flex items-center gap-3 px-3 sm:px-4 py-2 rounded-xl border flex-1 sm:flex-none ${isDark
                ? 'bg-gray-800/50 border-gray-700 hover:bg-gray-800 text-white'
                : 'bg-white border-gray-200 hover:bg-gray-50 text-gray-900'
                }`}
            >
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white font-bold text-xs">
                {user?.username?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <span className={`text-sm font-medium truncate max-w-[120px] sm:max-w-[180px] ${isDark ? 'text-white' : 'text-gray-900'}`} title={user?.username || 'Foydalanuvchi'}>
                {user?.username || 'Foydalanuvchi'}
              </span>
            </button>
            <button
              onClick={() => setIsSettingsOpen(true)}
              className={`p-2 rounded-xl border ${isDark
                ? 'bg-gray-800/50 border-gray-700 text-gray-200 hover:bg-gray-800'
                : 'bg-white border-gray-200 text-gray-700 hover:bg-gray-50'
                }`}
              title="Sozlamalar"
            >
              <Settings size={18} />
            </button>
            <button
              onClick={logout}
              className="flex items-center gap-2 px-4 py-2 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 hover:bg-red-500/20 transition-all"
              title="Chiqish"
            >
              <LogOut size={18} />
            </button>
          </div>
        </header>

        <div className="flex-1 flex overflow-hidden">
          <div className="flex-1 flex flex-col min-w-0 h-full overflow-hidden">
            {selectedSource ? (
              <SourceContentView
                source={selectedSource}
                onClose={() => setSelectedSourceId(null)}
                onActionWithSelection={handleActionWithSelection}
                theme={theme}
              />
            ) : (
              <ChatInterface
                sources={getEnabledSources()}
                onAddNote={handleAddNote}
                theme={theme}
                apiKey={apiKey}
                onOpenSettings={() => setIsSettingsOpen(true)}
                onSelectSource={setSelectedSourceId}
              />
            )}
          </div>

          <NotesPanel
            notes={notes}
            onRemoveNote={handleRemoveNote}
            onGenerateAction={handleAIAction}
            onOpenNote={handleLaunchMaterial}
            theme={theme}
            onOpenManualNote={() => {
              setEditNote({ title: '', content: '' });
              setIsNoteModalOpen(true);
            }}
            generatingMaterials={generatingMaterials}
            isOpen={isNotesOpen}
            onToggle={() => setIsNotesOpen(!isNotesOpen)}
            isSourcesActive={activeSourceIds.size > 0}
            onCompleteTopic={handleTopicCompleted}
          />
        </div>

        {/* Modal oynalar */}
        {false && (
          <SourceAdditionModal
            isOpen={isSourceAdditionOpen}
            onClose={() => setIsSourceAdditionOpen(false)}
            onAddSource={handleAddSource}
            sourcesCount={sources.length}
            theme={theme}
          />
        )}

        {isQuizSetupOpen && (
          <QuizSetupModal
            onClose={() => setIsQuizSetupOpen(false)}
            onGenerate={(c) => handleAIAction('quiz', c)}
            theme={theme}
          />
        )}

        {isFlashcardSetupOpen && (
          <FlashcardSetupModal
            onClose={() => setIsFlashcardSetupOpen(false)}
            onGenerate={(c) => handleAIAction('flashcard', c)}
            theme={theme}
          />
        )}

        {isInfographicSetupOpen && (
          <InfographicSetupModal
            onClose={() => setIsInfographicSetupOpen(false)}
            onGenerate={(c) => handleAIAction('infographic', c)}
            theme={theme}
          />
        )}

        {isPresentationSetupOpen && (
          <PresentationSetupModal
            onClose={() => setIsPresentationSetupOpen(false)}
            onGenerate={(c) => handleAIAction('presentation', c)}
            theme={theme}
          />
        )}

        {isMindMapSetupOpen && (
          <MindMapSetupModal
            onClose={() => setIsMindMapSetupOpen(false)}
            onGenerate={(c) => handleAIAction('mindmap', c)}
            theme={theme}
          />
        )}

        {/* Material view oynalar */}
        {activeQuiz && (
          <QuizView
            quiz={activeQuiz.data}
            sourceCount={activeQuiz.sourceCount}
            onClose={() => setActiveQuiz(null)}
            onAdvanceTopic={handleAdvanceTopic}
            theme={theme}
          />
        )}

        {activeFlashcards && activeFlashcards.data && (
          <FlashcardView
            data={activeFlashcards.data}
            sourceCount={activeFlashcards.sourceCount}
            onClose={() => setActiveFlashcards(null)}
            theme={theme}
          />
        )}

        {activeMindMap && (
          <MindMapView
            data={activeMindMap.data}
            sourceCount={activeMindMap.sourceCount}
            onClose={() => setActiveMindMap(null)}
            theme={theme}
          />
        )}

        {activeInfographic && (
          <InfographicView
            imageUrl={activeInfographic.url}
            title={activeInfographic.title}
            onClose={() => setActiveInfographic(null)}
            theme={theme}
          />
        )}

        {activePresentation && (
          <PresentationView
            data={activePresentation.data}
            sourceCount={activePresentation.sourceCount}
            onClose={() => setActivePresentation(null)}
            theme={theme}
          />
        )}

        <ProfileStatsModal
          isOpen={isProfileOpen}
          theme={theme}
          username={user?.username || 'Foydalanuvchi'}
          totalTimeLabel={formatDuration(totalTimeMs)}
          sessionTimeLabel={formatDuration(sessionTimeMs)}
          sourcesCount={sources.length}
          notesCount={notes.length}
          materialsTotal={materialsTotal}
          materialsByType={materialsByType}
          onClose={() => setIsProfileOpen(false)}
        />

        <SettingsModal
          isOpen={isSettingsOpen}
          theme={theme}
          onThemeChange={setTheme}
          apiKeyInput={apiKeyInput}
          onApiKeyInputChange={setApiKeyInput}
          onSaveApiKey={handlePreferencesSave}
          username={profileUsername}
          password={profilePassword}
          error={profileError}
          isSaving={isProfileSaving}
          onUsernameChange={setProfileUsername}
          onPasswordChange={setProfilePassword}
          onSaveCredentials={handleUserCredentialsSave}
          onClose={() => setIsSettingsOpen(false)}
        />


        {/* Qo'lda eslatma qo'shish modali */}
        {isNoteModalOpen && (
          <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
            <div className="w-full max-w-xl rounded-2xl shadow-2xl overflow-hidden bg-[#1e1e1e] border border-gray-800">
              <div className="p-4 border-b flex items-center justify-between bg-[#252525]">
                <h3 className="font-bold text-white">Eslatma</h3>
                <button
                  onClick={() => setIsNoteModalOpen(false)}
                  className="text-gray-400 hover:text-white"
                >
                  <X size={20} />
                </button>
              </div>
              <div className="p-6 space-y-4">
                <input
                  type="text"
                  placeholder="Sarlavha"
                  value={editNote.title}
                  onChange={e => setEditNote(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 text-white outline-none"
                />
                <textarea
                  placeholder="Mazmun..."
                  value={editNote.content}
                  onChange={e => setEditNote(prev => ({ ...prev, content: e.target.value }))}
                  className="w-full p-3 rounded-xl border border-gray-700 bg-gray-800 text-white outline-none h-48"
                />
              </div>
              <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
                <button
                  onClick={saveNoteFromModal}
                  className="px-6 py-2 bg-indigo-600 text-white rounded-xl font-bold hover:bg-indigo-700 transition-colors"
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

const App: React.FC = () => {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
};

const AppContent: React.FC = () => {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex items-center justify-center h-screen bg-gray-900">
        <div className="text-center">
          <div className="w-16 h-16 border-4 border-indigo-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-400">Yuklanmoqda...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <AuthPage />;
  }

  return <MainApp />;
};

export default App;
