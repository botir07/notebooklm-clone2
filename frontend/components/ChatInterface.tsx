// ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';
import { chatAPI } from '../services/authService';
import { Source } from '../types';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

interface ChatInterfaceProps {
  sources?: Source[];
  onAddNote?: (note: { title: string; content: string }) => void;
  theme?: 'light' | 'dark';
  apiKey?: string;
  onOpenSettings?: () => void;
}

const MIN_INTERVAL = 8000;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';
const createGreeting = (): Message => ({
  id: Date.now().toString(),
  role: 'assistant',
  content: 'Salom! Men AI yordamchiman. Sizga qanday yordam bera olaman?'
});

const createSessionId = () => {
  if (typeof crypto !== 'undefined' && 'randomUUID' in crypto) {
    return crypto.randomUUID();
  }
  return `chat_${Date.now()}_${Math.random().toString(36).slice(2, 10)}`;
};

export default function ChatInterface({
  sources = [],
  theme = 'dark',
  apiKey = '',
  onOpenSettings
}: ChatInterfaceProps) {
  const [messages, setMessages] = useState<Message[]>(() => [createGreeting()]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState(0);
  const [model, setModel] = useState('meta-llama/llama-3-8b-instruct');
  const [sessionId, setSessionId] = useState(() => {
    return localStorage.getItem('chatSessionId') || createSessionId();
  });

  const bottomRef = useRef<HTMLDivElement>(null);
  const isDark = theme === 'dark';

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  useEffect(() => {
    localStorage.setItem('chatSessionId', sessionId);
  }, [sessionId]);

  useEffect(() => {
    let isActive = true;
    const loadHistory = async () => {
      try {
        const data = await chatAPI.getHistory();
        const chats = data?.chats || [];
        if (!Array.isArray(chats) || chats.length === 0) return;

        const matched = chats.find((chat: any) => chat.session_id === sessionId) || chats[0];
        if (!matched?.messages || matched.messages.length === 0) return;

        const mappedMessages: Message[] = matched.messages.map((msg: any, index: number) => ({
          id: msg.timestamp ? String(new Date(msg.timestamp).getTime()) : String(Date.now() + index),
          role: msg.role === 'user' ? 'user' : 'assistant',
          content: msg.content || '',
          isError: false
        }));

        if (!isActive) return;
        setMessages(mappedMessages);
        if (matched.settings?.model) setModel(matched.settings.model);
        if (matched.session_id && matched.session_id !== sessionId) {
          setSessionId(matched.session_id);
        }
      } catch (err) {
        console.warn('Chat history load failed:', err);
      }
    };

    loadHistory();
    return () => {
      isActive = false;
    };
  }, [sessionId]);

  const getSourceIds = () => {
    return sources
      .map((source) => Number.parseInt(source.id, 10))
      .filter((id) => Number.isFinite(id));
  };

  const getChatTitle = (nextMessages: Message[]) => {
    const firstUser = nextMessages.find((msg) => msg.role === 'user');
    if (!firstUser) return 'New Chat';
    return firstUser.content.trim().slice(0, 60) || 'New Chat';
  };

  const persistHistory = async (nextMessages: Message[]) => {
    try {
      await chatAPI.saveHistory({
        sessionId,
        messages: nextMessages.map((msg) => ({
          role: msg.role,
          content: msg.content,
          timestamp: new Date(Number(msg.id) || Date.now()).toISOString()
        })),
        sources: getSourceIds(),
        settings: {
          model,
          temperature: 0.7,
          maxTokens: 500
        },
        title: getChatTitle(nextMessages)
      });
    } catch (err) {
      console.warn('Chat history save failed:', err);
    }
  };

  const updateApiKey = () => {
    if (onOpenSettings) onOpenSettings();
  };

  const sendMessage = async () => {
    if (!input.trim() || isLoading) return;

    const now = Date.now();
    if (now - lastRequest < MIN_INTERVAL) {
      setError(`⏳ Iltimos, ${Math.ceil((MIN_INTERVAL - (now - lastRequest)) / 1000)} soniya kuting`);
      return;
    }

    if (!apiKey || !apiKey.startsWith('sk-or-v1-')) {
      setError('❌ Noto‘g‘ri API key. Iltimos, API keyni yangilang.');
      return;
    }

    setLastRequest(now);
    setIsLoading(true);
    setError(null);

    const userMsg: Message = {
      id: now.toString(),
      role: 'user',
      content: input.trim(),
    };

    const updatedMessages = [...messages, userMsg];
    setMessages(updatedMessages);
    setInput('');
    void persistHistory(updatedMessages);

    try {
      console.log('API Request sending...', {
        model,
        apiKeyFirst8: apiKey.substring(0, 20) + '...'
      });

      const response = await fetch(API_URL, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${apiKey}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': window.location.origin || 'http://localhost:3000',
          'X-Title': 'Uzbek AI Assistant',
        },
        body: JSON.stringify({
          model: model,
          messages: [
            {
              role: 'system',
              content: 'Siz foydali AI yordamchisiz. O\'zbek va rus tillarida javob bering. Javoblaringiz qisqa va aniq bo\'lsin.'
            },
            ...updatedMessages
              .filter(msg => msg.role !== 'system')
              .map(msg => ({
                role: msg.role,
                content: msg.content
              }))
          ],
          max_tokens: 500,
          temperature: 0.7,
          stream: false
        }),
      });

      console.log('Response status:', response.status);

      if (!response.ok) {
        let errorText = 'Noma\'lum xato';
        try {
          errorText = await response.text();
        } catch (e) {
          console.error('Error reading response:', e);
        }

        console.error('API Error:', {
          status: response.status,
          statusText: response.statusText,
          errorText
        });

        if (response.status === 429) {
          throw new Error('🚫 So‘rovlar chegarasiga yetdingiz. 5-10 daqiqa kuting.');
        } else if (response.status === 401) {
          throw new Error('🔑 Noto‘g‘ri API key. Iltimos, API keyni tekshiring.');
        } else if (response.status === 404) {
          throw new Error('❌ Model topilmadi. Boshqa model tanlang.');
        } else {
          throw new Error(`API xatosi ${response.status}: ${errorText.substring(0, 100)}`);
        }
      }

      const data = await response.json();
      console.log('API Response:', data);

      const answer = data?.choices?.[0]?.message?.content;

      if (!answer) {
        console.error('Empty response data:', data);
        throw new Error('🤖 Modeldan javob kelmadi');
      }

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: answer,
      };

      const nextMessages = [...updatedMessages, assistantMsg];
      setMessages(nextMessages);
      void persistHistory(nextMessages);

    } catch (error: any) {
      console.error('Full error:', error);

      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ ${error.message || 'Noma\'lum xato yuz berdi'}`,
        isError: true,
      };

      const nextMessages = [...updatedMessages, errorMsg];
      setMessages(nextMessages);
      void persistHistory(nextMessages);
      setError(error.message || 'Xato yuz berdi');

    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm('Haqiqatan ham chatni tozalashni xohlaysizmi?')) {
      void chatAPI.deleteHistory(sessionId).catch(() => {});
      const nextSessionId = createSessionId();
      setSessionId(nextSessionId);
      setMessages([createGreeting()]);
      setError(null);
    }
  };

  return (
    <div
      className={`flex flex-col h-screen ${isDark
        ? 'bg-gradient-to-b from-gray-900 to-black text-white'
        : 'bg-gradient-to-b from-slate-50 to-white text-gray-900'
        }`}
    >
      {/* Header */}
      <div
        className={`border-b px-4 py-3 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between ${isDark
          ? 'border-gray-800'
          : 'border-gray-200'
          }`}
      >
        <div className="flex items-start justify-between gap-3 sm:block">
          <div>
            <h1 className="text-lg sm:text-xl font-bold leading-tight">a?y- O'zbek AI Yordamchi</h1>
            <div className={`text-xs sm:text-sm mt-1 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
              {model.split('/').pop()} OpenRouter API
            </div>
          </div>
          <button
            onClick={resetChat}
            className={`sm:hidden px-3 py-2 rounded-lg text-xs ${isDark
              ? 'bg-red-900/30 hover:bg-red-800/40 text-white'
              : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            disabled={isLoading}
          >
            Tozalash
          </button>
        </div>

        <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row sm:items-center sm:gap-3">
          <div className="flex w-full items-center gap-2">
            <select
              value={model}
              onChange={(e) => setModel(e.target.value)}
              className={`rounded-lg px-3 py-2 text-xs sm:text-sm border flex-1 sm:flex-none sm:w-auto ${isDark
                ? 'bg-gray-800 border-gray-700 text-white'
                : 'bg-white border-gray-300 text-gray-900'
                }`}
              disabled={isLoading}
            >
              <option value="meta-llama/llama-3-8b-instruct">Llama 3 8B</option>
              <option value="meta-llama/llama-3-70b-instruct">Llama 3 70B</option>
              <option value="gpt-3.5-turbo">GPT-3.5 Turbo</option>
              <option value="claude-3-haiku">Claude 3 Haiku</option>
              <option value="google/gemma-7b-it">Gemma 7B</option>
            </select>

            <button
              onClick={updateApiKey}
              className={`px-3 py-2 rounded-lg text-xs sm:text-sm border shrink-0 ${isDark
                ? 'bg-gray-800 hover:bg-gray-700 border-gray-700 text-white'
                : 'bg-white hover:bg-gray-100 border-gray-300 text-gray-800'
                }`}
              title="API keyni yangilash"
            >
              API key
            </button>
          </div>

          <button
            onClick={resetChat}
            className={`hidden sm:inline-flex px-3 py-2 rounded-lg text-xs sm:text-sm ${isDark
              ? 'bg-red-900/30 hover:bg-red-800/40 text-white'
              : 'bg-red-100 hover:bg-red-200 text-red-700'
              }`}
            disabled={isLoading}
          >
            Tozalash
          </button>
        </div>
      </div>

      {!apiKey && (
        <div
          className={`border-b px-4 py-3 flex items-center gap-3 ${isDark
            ? 'border-yellow-800/50 bg-yellow-900/20'
            : 'border-yellow-200 bg-yellow-50'
            }`}
        >
          <AlertCircle size={18} className={`${isDark ? 'text-yellow-300' : 'text-yellow-600'} flex-shrink-0`} />
          <span className={`text-sm flex-1 ${isDark ? 'text-yellow-200' : 'text-yellow-800'}`}>
            API key kiritilmagan. Iltimos, OpenRouter API keyni kiriting.
          </span>
          <button
            onClick={updateApiKey}
            className={`px-3 py-2 rounded-lg text-xs sm:text-sm border ${isDark
              ? 'bg-yellow-600/30 hover:bg-yellow-600/40 border-yellow-500/40 text-yellow-100'
              : 'bg-yellow-100 hover:bg-yellow-200 border-yellow-300 text-yellow-900'
              }`}
          >
            API key kiritish
          </button>
        </div>
      )}

      {/* Error Banner */}
      {error && (
        <div className={`border-y p-3 flex items-center gap-3 ${isDark ? 'bg-red-900/20 border-red-800/50' : 'bg-red-50 border-red-200'}`}>
          <AlertCircle size={18} className={`${isDark ? 'text-red-400' : 'text-red-600'} flex-shrink-0`} />
          <span className={`text-sm flex-1 ${isDark ? 'text-red-300' : 'text-red-700'}`}>{error}</span>
          <button
            onClick={() => setError(null)}
            className={`${isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-800'} text-lg`}
            title="Yopish"
          >
            ✕
          </button>
        </div>
      )}


      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 md:p-6 space-y-4">
        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-[85%] md:max-w-[70%] px-4 py-3 rounded-2xl ${msg.role === 'user'
                  ? 'bg-blue-600 text-white rounded-br-none'
                  : msg.isError
                    ? isDark
                      ? 'bg-red-900/30 border border-red-800/50 text-red-100'
                      : 'bg-red-50 border border-red-200 text-red-700'
                    : isDark
                      ? 'bg-gray-800 text-gray-100 rounded-bl-none'
                      : 'bg-white text-gray-900 border border-gray-200 rounded-bl-none'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.role === 'user'
                    ? 'bg-blue-500'
                    : msg.isError
                      ? isDark
                        ? 'bg-red-600'
                        : 'bg-red-500'
                      : isDark
                        ? 'bg-gray-700'
                        : 'bg-gray-200'
                  }`}>
                  {msg.role === 'user' ? '👤' : msg.isError ? '⚠️' : '🤖'}
                </div>
                <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-blue-200' :
                    msg.isError ? (isDark ? 'text-red-300' : 'text-red-600') : (isDark ? 'text-gray-400' : 'text-gray-500')
                  }`}>
                  {msg.role === 'user' ? 'Siz' : msg.isError ? 'Xato' : 'AI Yordamchi'}
                </span>
              </div>
              <div className="whitespace-pre-wrap">{msg.content}</div>
            </div>
          </div>
        ))}

        {isLoading && (
          <div className="flex justify-start">
            <div className={`px-4 py-3 rounded-2xl rounded-bl-none ${isDark ? 'bg-gray-800' : 'bg-white border border-gray-200'}`}>
              <div className="flex items-center gap-3">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${isDark ? 'bg-gray-700' : 'bg-gray-200'}`}>
                  🤖
                </div>
                <div className={`flex items-center gap-2 ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
                  <Loader2 className="animate-spin" size={16} />
                  <span className="text-sm">Javob yozilmoqda...</span>
                </div>
              </div>
            </div>
          </div>
        )}

        <div ref={bottomRef} />
      </div>

      {/* Input Area */}
      <div className={`border-t p-3 sm:p-4 ${isDark ? 'border-gray-800 bg-gray-900/50' : 'border-gray-200 bg-white'}`}>
        <div className="flex gap-2">
          <div className="flex-1 relative">
            <textarea
              value={input}
              rows={1}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault();
                  sendMessage();
                }
              }}
              disabled={isLoading}
              className={`w-full rounded-xl p-3 pr-12 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed text-sm ${isDark
                ? 'bg-gray-800 border border-gray-700 text-white'
                : 'bg-white border border-gray-300 text-gray-900'
                }`}
              placeholder="Xabaringizni yozing... (Shift+Enter - yangi qator)"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className={`absolute right-3 bottom-3 text-xs ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
              {isLoading ? 'Kutish...' : 'Enter - yuborish'}
            </div>
          </div>

          <button
            onClick={sendMessage}
            disabled={isLoading || !input.trim()}
            className={`flex items-center justify-center w-12 rounded-xl font-medium transition-all ${isLoading || !input.trim()
                ? 'bg-gray-700 text-gray-500 cursor-not-allowed'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
            title="Yuborish"
          >
            {isLoading ? (
              <Loader2 className="animate-spin" size={20} />
            ) : (
              <Send size={20} />
            )}
          </button>
        </div>

        {/* Info Footer */}
        <div className={`mt-3 text-[11px] flex flex-wrap justify-between gap-2 ${isDark ? 'text-gray-500' : 'text-gray-400'}`}>
          <div className="flex flex-wrap items-center gap-3">
            <span>Model: {model.split('/').pop()}</span>
            <span>Xabarlar: {messages.length}</span>
            <span>Kutish: 8 soniya</span>
          </div>
          <div className={`hidden sm:block ${isDark ? 'text-gray-400' : 'text-gray-500'}`}>
            {apiKey ? `API: ${apiKey.substring(0, 12)}...` : 'API key kiritilmagan'}
          </div>
        </div>
      </div>
    </div>
  );
}





