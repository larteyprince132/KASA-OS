import React from 'react';
import { AlertTriangle, LogOut, Mail } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const SuspendedNotice: React.FC = () => {
  const { business, signOut } = useAuth();

  return (
    <div className="min-h-screen bg-neutral-900 text-neutral-100 flex items-center justify-center p-4 font-sans">
      <div className="max-w-md w-full bg-neutral-800 border border-red-500/30 rounded-2xl p-8 shadow-2xl text-center">
        <div className="w-14 h-14 rounded-2xl bg-red-500/20 text-red-400 flex items-center justify-center mx-auto mb-4 border border-red-500/30">
          <AlertTriangle className="w-7 h-7" />
        </div>

        <span className="text-[11px] font-bold uppercase tracking-wider px-3 py-1 rounded-full bg-red-500/20 text-red-300 border border-red-500/30">
          Account Suspended
        </span>

        <h2 className="text-xl font-bold text-white mt-4">Workspace Access Paused</h2>
        <p className="text-xs text-neutral-400 mt-2 leading-relaxed">
          The workspace for <strong className="text-white">{business?.name || 'this business'}</strong> has been temporarily suspended by the Super Administrator.
        </p>

        <div className="my-6 p-4 rounded-xl bg-neutral-900 border border-neutral-700 text-xs text-neutral-300 text-left space-y-1.5">
          <div className="flex items-center gap-2 text-neutral-400">
            <Mail className="w-4 h-4 text-emerald-400" /> Platform Support:
          </div>
          <div className="font-mono text-emerald-400 font-semibold">support@kasaos.com</div>
          <p className="text-[11px] text-neutral-500 mt-2">
            Please contact platform administration to verify your subscription or compliance status and reactivate your workspace.
          </p>
        </div>

        <button
          onClick={() => signOut()}
          className="w-full py-2.5 px-4 rounded-xl text-xs font-bold text-neutral-300 bg-neutral-700 hover:bg-neutral-600 transition-colors flex items-center justify-center gap-2"
        >
          <LogOut className="w-4 h-4" /> Sign Out
        </button>
      </div>
    </div>
  );
};
