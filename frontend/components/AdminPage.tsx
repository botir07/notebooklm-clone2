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

const AdminPage: React.FC<AdminPageProps> = ({
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
    <div className="h-screen w-full overflow-hidden bg-[#121212] text-gray-100">
      <header className="h-16 px-8 flex items-center justify-between border-b bg-[#1e1e1e] border-gray-800">
        <div>
          <h1 className="text-lg font-bold text-white">Admin Panel</h1>
          <p className="text-xs text-gray-400 uppercase tracking-widest font-bold">Fayllar faqat admin uchun</p>
        </div>
        <div className="flex items-center gap-3">
          {isAdminAuthed && (
            <button
              onClick={onLogout}
              className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:bg-gray-800"
            >
              Chiqish
            </button>
          )}
          <button
            onClick={onBack}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Orqaga
          </button>
        </div>
      </header>

      <div className="h-[calc(100vh-4rem)] overflow-y-auto p-8">
        <div className="max-w-3xl mx-auto bg-[#1e1e1e] border border-gray-800 rounded-3xl p-8 shadow-2xl">
          {!isAdminAuthed ? (
            <form onSubmit={onLogin} className="space-y-4">
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login</label>
                <input
                  value={adminUsername}
                  onChange={(e) => onUsernameChange(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white outline-none focus:border-indigo-500"
                />
              </div>
              <div>
                <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parol</label>
                <input
                  type="password"
                  value={adminPassword}
                  onChange={(e) => onPasswordChange(e.target.value)}
                  className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white outline-none focus:border-indigo-500"
                />
              </div>
              {adminError && (
                <div className="text-xs font-bold text-red-400 uppercase tracking-widest">{adminError}</div>
              )}
              <button className="w-full py-3 rounded-xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest hover:bg-indigo-700">
                Kirish
              </button>
            </form>
          ) : (
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <button
                  onClick={onUploadClick}
                  className="px-4 py-3 rounded-2xl bg-indigo-600 text-white text-xs font-black uppercase tracking-widest"
                >
                  Fayl yuklash
                </button>
                <input type="file" ref={adminFileRef} className="hidden" onChange={onFileChange} />
                <span className="text-xs text-gray-400">User interfeysidan yuklab bo'lmaydi</span>
              </div>

              <div className="space-y-3">
                <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-gray-400">Yuklangan manbalar</h3>
                {sources.length === 0 ? (
                  <div className="text-xs text-gray-400">Hozircha manbalar yo'q</div>
                ) : (
                  sources.map((item) => (
                    <div key={item.id} className="flex items-center justify-between p-4 rounded-2xl border border-gray-800 bg-gray-900/40">
                      <div className="min-w-0">
                        <p className="text-sm font-bold text-gray-200 truncate">{item.name}</p>
                        <p className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                          {new Date(item.timestamp).toLocaleDateString()}
                        </p>
                      </div>
                      <button
                        onClick={() => onDeleteSource(item.id)}
                        className="px-3 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest border border-red-500/20 text-red-400 hover:bg-red-500/10"
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

export default AdminPage;
