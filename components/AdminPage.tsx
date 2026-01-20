import React from 'react';
import { Source } from '../types';

type AdminPageProps = {
  isAdminAuthed: boolean;
  adminUsername: string;
  adminPassword: string;
  adminError: string;
  sources: Source[];
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onLogin: (e: React.FormEvent) => void;
  onLogout: () => void;
  onBack: () => void;
  onUploadClick: () => void;
  onFileChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  onDeleteSource: (id: string) => void;
  adminFileRef: React.RefObject<HTMLInputElement>;
};

export const AdminPage: React.FC<AdminPageProps> = ({
  isAdminAuthed,
  adminUsername,
  adminPassword,
  adminError,
  sources,
  onUsernameChange,
  onPasswordChange,
  onLogin,
  onLogout,
  onBack,
  onUploadClick,
  onFileChange,
  onDeleteSource,
  adminFileRef
}) => {
  return (
    <div className="h-screen bg-slate-50 overflow-hidden">
      <header className="h-16 border-b flex items-center justify-between px-8 bg-white">
        <div>
          <h1 className="font-black text-slate-900">Admin Panel</h1>
          <p className="text-[10px] text-slate-400 uppercase tracking-widest font-bold">Fayllar faqat admin uchun</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminAuthed && (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-500 hover:bg-slate-50"
            >
              Chiqish
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-slate-200 text-slate-600 hover:bg-slate-50"
          >
            Orqaga
          </button>
        </div>
      </header>
      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-white rounded-3xl border shadow-sm p-8">
          {!isAdminAuthed ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Login</label>
                <input
                  value={adminUsername}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500"
                  placeholder="admin"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-slate-600 uppercase tracking-widest">Parol</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-slate-200 text-sm outline-none focus:border-indigo-500"
                  placeholder="admin123"
                />
              </div>
              {adminError && (
                <div className="text-xs font-bold text-red-500 uppercase tracking-widest">{adminError}</div>
              )}
              <button className="w-full py-3 rounded-xl bg-slate-900 text-white text-xs font-black uppercase tracking-widest hover:bg-slate-800">
                Kirish
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={onUploadClick}
                  className="px-4 py-3 rounded-2xl bg-slate-900 text-white text-[10px] font-black uppercase tracking-widest"
                >
                  PDF Yuklash
                </button>
                <input
                  type="file"
                  ref={adminFileRef}
                  className="hidden"
                  accept="application/pdf"
                  onChange={onFileChange}
                />
                <span className="text-xs text-slate-400">User interfeysidan yuklab bo'lmaydi</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">Yuklangan manbalar</h3>
                {sources.length === 0 ? (
                  <div className="text-xs text-slate-400">Hozircha manbalar yo'q</div>
                ) : (
                  sources.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-slate-100 bg-slate-50/60">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-slate-700 truncate">{item.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-slate-400">
                          {item.isAnalyzing ? 'Tahlil...' : 'Tayyor'}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteSource(item.id)}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-200 text-red-500 hover:bg-red-50"
                      >
                        Delete
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
