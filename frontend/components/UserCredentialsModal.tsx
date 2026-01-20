import React from 'react';

type UserCredentialsModalProps = {
  isOpen: boolean;
  username: string;
  password: string;
  error: string;
  isSaving: boolean;
  onUsernameChange: (value: string) => void;
  onPasswordChange: (value: string) => void;
  onClose: () => void;
  onSave: () => void;
};

const UserCredentialsModal: React.FC<UserCredentialsModalProps> = ({
  isOpen,
  username,
  password,
  error,
  isSaving,
  onUsernameChange,
  onPasswordChange,
  onClose,
  onSave
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-6 bg-black/60 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden bg-[#1e1e1e] border border-gray-800">
        <div className="p-4 border-b flex items-center justify-between bg-[#252525]">
          <h3 className="font-bold text-white">Login va parol</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-white">
            ✕
          </button>
        </div>
        <div className="p-6 space-y-4">
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Login</label>
            <input
              value={username}
              onChange={(e) => onUsernameChange(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white outline-none focus:border-indigo-500"
            />
          </div>
          <div>
            <label className="text-xs font-bold text-gray-400 uppercase tracking-widest">Parol</label>
            <input
              type="password"
              value={password}
              onChange={(e) => onPasswordChange(e.target.value)}
              className="mt-2 w-full px-4 py-3 rounded-xl border border-gray-700 bg-gray-900 text-white outline-none focus:border-indigo-500"
            />
          </div>
          {error && (
            <div className="text-xs font-bold text-red-400 uppercase tracking-widest">{error}</div>
          )}
        </div>
        <div className="p-4 border-t border-gray-700 flex justify-end gap-3">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-xl text-xs font-bold border border-gray-700 text-gray-300 hover:bg-gray-800"
          >
            Bekor
          </button>
          <button
            onClick={onSave}
            disabled={isSaving}
            className="px-4 py-2 rounded-xl text-xs font-bold bg-indigo-600 text-white hover:bg-indigo-700 disabled:opacity-60"
          >
            Saqlash
          </button>
        </div>
      </div>
    </div>
  );
};

export default UserCredentialsModal;
