// ChatInterface.tsx
import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader2, AlertCircle } from 'lucide-react';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  isError?: boolean;
}

const MIN_INTERVAL = 8000;
const API_URL = 'https://openrouter.ai/api/v1/chat/completions';

// TypeScript uchun env deklaratsiya
interface ImportMetaEnv {
  VITE_OPENROUTER_API_KEY?: string;
}

// API key olish funksiyasi
const getApiKey = (): string => {
  // 1. Vite env dan
  if ((import.meta as any).env?.VITE_OPENROUTER_API_KEY) {
    return (import.meta as any).env.VITE_OPENROUTER_API_KEY;
  }

  // 2. LocalStorage dan
  const savedKey = localStorage.getItem('OPENROUTER_API_KEY');
  if (savedKey) return savedKey;

  // 3. Hardcoded (faqat test uchun)
  return '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';
};

export default function ChatInterface() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: 'Salom! Men AI yordamchiman. Sizga qanday yordam bera olaman?'
    }
  ]);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastRequest, setLastRequest] = useState(0);
  const [model, setModel] = useState('meta-llama/llama-3-8b-instruct');
  const [apiKey, setApiKey] = useState(getApiKey());

  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // API keyni yangilash
  const updateApiKey = () => {
    const newKey = prompt('Yangi OpenRouter API key kiriting:', apiKey);
    if (newKey) {
      setApiKey(newKey);
      localStorage.setItem('OPENROUTER_API_KEY', newKey);
    }
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

      setMessages(prev => [...prev, assistantMsg]);

    } catch (error: any) {
      console.error('Full error:', error);

      const errorMsg: Message = {
        id: (Date.now() + 2).toString(),
        role: 'assistant',
        content: `❌ ${error.message || 'Noma\'lum xato yuz berdi'}`,
        isError: true,
      };

      setMessages(prev => [...prev, errorMsg]);
      setError(error.message || 'Xato yuz berdi');

    } finally {
      setIsLoading(false);
    }
  };

  const resetChat = () => {
    if (window.confirm('Haqiqatan ham chatni tozalashni xohlaysizmi?')) {
      setMessages([{
        id: '1',
        role: 'assistant',
        content: 'Salom! Men AI yordamchiman. Sizga qanday yordam bera olaman?'
      }]);
      setError(null);
    }
  };

  return (
    <div className="flex flex-col h-screen bg-gradient-to-b from-gray-900 to-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 p-4 flex justify-between items-center">
        <div>
          <h1 className="text-xl font-bold">🤖 O'zbek AI Yordamchi</h1>
          <div className="text-sm text-gray-400 mt-1">
            {model.split('/').pop()} • OpenRouter API
          </div>
        </div>

        <div className="flex items-center gap-3">
          <select
            value={model}
            onChange={(e) => setModel(e.target.value)}
            className="bg-gray-800 rounded-lg px-3 py-2 text-sm border border-gray-700"
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
            className="px-3 py-2 bg-gray-800 hover:bg-gray-700 rounded-lg text-sm border border-gray-700"
            title="API keyni yangilash"
          >
            🔑
          </button>

          <button
            onClick={resetChat}
            className="px-3 py-2 bg-red-900/30 hover:bg-red-800/40 rounded-lg text-sm"
            disabled={isLoading}
          >
            Tozalash
          </button>
        </div>
      </div>

      {/* Error Banner */}
      {error && (
        <div className="bg-red-900/20 border-y border-red-800/50 p-3 flex items-center gap-3">
          <AlertCircle size={18} className="text-red-400 flex-shrink-0" />
          <span className="text-sm text-red-300 flex-1">{error}</span>
          <button
            onClick={() => setError(null)}
            className="text-gray-400 hover:text-white text-lg"
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
                    ? 'bg-red-900/30 border border-red-800/50'
                    : 'bg-gray-800 text-gray-100 rounded-bl-none'
                }`}
            >
              <div className="flex items-center gap-2 mb-2">
                <div className={`w-6 h-6 rounded-full flex items-center justify-center ${msg.role === 'user'
                    ? 'bg-blue-500'
                    : msg.isError
                      ? 'bg-red-600'
                      : 'bg-gray-700'
                  }`}>
                  {msg.role === 'user' ? '👤' : msg.isError ? '⚠️' : '🤖'}
                </div>
                <span className={`text-xs font-medium ${msg.role === 'user' ? 'text-blue-200' :
                    msg.isError ? 'text-red-300' : 'text-gray-400'
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
            <div className="bg-gray-800 px-4 py-3 rounded-2xl rounded-bl-none">
              <div className="flex items-center gap-3">
                <div className="w-6 h-6 rounded-full bg-gray-700 flex items-center justify-center">
                  🤖
                </div>
                <div className="flex items-center gap-2 text-gray-400">
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
      <div className="border-t border-gray-800 p-4 bg-gray-900/50">
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
              className="w-full bg-gray-800 border border-gray-700 rounded-xl p-3 pr-12 resize-none focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
              placeholder="Xabaringizni yozing... (Shift+Enter - yangi qator)"
              style={{ minHeight: '44px', maxHeight: '120px' }}
            />
            <div className="absolute right-3 bottom-3 text-xs text-gray-500">
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
        <div className="mt-3 text-xs text-gray-500 flex flex-wrap justify-between gap-2">
          <div className="flex items-center gap-4">
            <span>Model: {model.split('/').pop()}</span>
            <span>Xabarlar: {messages.length}</span>
            <span>Kutish: 8 soniya</span>
          </div>
          <div className="text-gray-400">
            {apiKey ? `API: ${apiKey.substring(0, 12)}...` : 'API key kiritilmagan'}
          </div>
        </div>
      </div>
    </div>
  );
}