import React from 'react';
import { X, Moon, Sun, KeyRound, User } from 'lucide-react';

type SettingsModalProps = {
  isOpen: boolean;
  theme: 'light' | 'dark';
  onThemeChange: (theme: 'light' | 'dark') => void;
  apiKeyInput: string;
  onApiKeyInputChange: (value: string) => void;
  onSaveApiKey: () => void;
  username: string;
  password: string;
  error: string;
  isSaving: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onSaveCredentials: () => void;
  onClose: () => void;
};

const SettingsModal: React.FC<SettingsModalProps> = ({
  isOpen,
  theme,
  onThemeChange,
  apiKeyInput,
  onApiKeyInputChange,
  onSaveApiKey,
  username,
  password,
  error,
  isSaving,
  onUsernameChange,
  onPasswordChange,
  onSaveCredentials,
  onClose
}) => {
  if (!isOpen) return null;

  const isDark = theme === 'dark';
  const panelBase = isDark
    ? 'bg-[#1e1e1e] border-gray-800 text-white'
    : 'bg-white border-gray-200 text-gray-900';
  const subText = isDark ? 'text-gray-400' : 'text-gray-500';
  const inputBase = isDark
    ? 'bg-gray-900 border-gray-700 text-white focus:border-indigo-500'
    : 'bg-gray-50 border-gray-300 text-gray-900 focus:border-indigo-500';
  const buttonBase = isDark
    ? 'bg-gray-800 text-gray-200 border-gray-700 hover:bg-gray-700'
    : 'bg-white text-gray-700 border-gray-300 hover:bg-gray-50';

  return (
    <div className="fixed inset-0 z-[120] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className={`w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden border ${panelBase}`}>
        <div className={`p-4 border-b flex items-center justify-between ${isDark ? 'bg-[#252525] border-gray-800' : 'bg-white border-gray-200'}`}>
          <h3 className="font-bold">Sozlamalar</h3>
          <button onClick={onClose} className={isDark ? 'text-gray-400 hover:text-white' : 'text-gray-500 hover:text-gray-900'}>
            <X size={18} />
          </button>
        </div>

        <div className="p-6 space-y-6">
          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <Moon size={16} />
              Tema
            </div>
            <div className="grid grid-cols-2 gap-3">
              <button
                onClick={() => onThemeChange('dark')}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${theme === 'dark'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : buttonBase
                  }`}
              >
                <Moon size={14} />
                Dark
              </button>
              <button
                onClick={() => onThemeChange('light')}
                className={`px-4 py-3 rounded-xl border text-sm font-semibold flex items-center justify-center gap-2 ${theme === 'light'
                  ? 'bg-indigo-600 text-white border-indigo-600'
                  : buttonBase
                  }`}
              >
                <Sun size={14} />
                Light
              </button>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <KeyRound size={16} />
              API key
            </div>
            <div className="flex flex-col gap-3">
              <input
                type="password"
                placeholder="sk-or-v1-..."
                value={apiKeyInput}
                onChange={(e) => onApiKeyInputChange(e.target.value)}
                className={`w-full px-4 py-3 rounded-xl border outline-none ${inputBase}`}
              />
              <div className="flex items-center justify-between gap-3">
                <span className={`text-xs ${subText}`}>API key lokal qurilmangizda saqlanadi.</span>
                <button
                  onClick={onSaveApiKey}
                  className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700"
                >
                  Saqlash
                </button>
              </div>
            </div>
          </section>

          <section className="space-y-3">
            <div className="flex items-center gap-2 text-sm font-bold">
              <User size={16} />
              Login va parol
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <input
                value={username}
                onChange={(e) => onUsernameChange(e.target.value)}
                placeholder="Login"
                className={`w-full px-4 py-3 rounded-xl border outline-none ${inputBase}`}
              />
              <input
                type="password"
                value={password}
                onChange={(e) => onPasswordChange(e.target.value)}
                placeholder="Parol"
                className={`w-full px-4 py-3 rounded-xl border outline-none ${inputBase}`}
              />
            </div>
            {error && (
              <div className="text-xs font-bold text-red-500">{error}</div>
            )}
            <div className="flex justify-end">
              <button
                onClick={onSaveCredentials}
                disabled={isSaving}
                className="px-4 py-2 rounded-xl bg-indigo-600 text-white text-xs font-bold hover:bg-indigo-700 disabled:opacity-60"
              >
                Saqlash
              </button>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
