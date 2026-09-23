import React from 'react';
import { useAuth } from '../context/AuthContext';
import { Clock, ShieldAlert, CheckCircle, RefreshCw } from 'lucide-react';

export const InactivityWarningBanner: React.FC = () => {
  const { showIdleWarning, remainingIdleSeconds, resetIdleTimer, currentUser } = useAuth();

  if (!showIdleWarning || !currentUser) {
    return null;
  }

  return (
    <div className="fixed bottom-6 right-6 z-50 max-w-md w-full p-4 bg-slate-900/95 backdrop-blur-md border-2 border-amber-500 rounded-2xl shadow-2xl text-white animate-in slide-in-from-bottom-5 duration-300">
      <div className="flex items-start space-x-3">
        <div className="w-10 h-10 rounded-xl bg-amber-500/20 border border-amber-400/40 text-amber-300 flex items-center justify-center shrink-0 animate-pulse">
          <Clock className="w-5 h-5 text-amber-400" />
        </div>

        <div className="flex-1">
          <div className="flex items-center space-x-2">
            <span className="inline-flex items-center space-x-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-300 border border-amber-500/30">
              <ShieldAlert className="w-3 h-3" />
              <span>Inactivity Auto-Logout</span>
            </span>
            <span className="text-xs font-mono font-bold text-amber-400">
              {remainingIdleSeconds}s remaining
            </span>
          </div>

          <h4 className="text-sm font-bold text-white mt-1">
            Session Expiring Due to Inactivity
          </h4>

          <p className="text-xs text-slate-300 mt-0.5 leading-relaxed">
            To safeguard campus attendance and student data, <strong>{currentUser.full_name}</strong> will be logged out automatically.
          </p>

          <div className="mt-3 flex items-center space-x-2">
            <button
              type="button"
              onClick={resetIdleTimer}
              className="flex-1 px-3.5 py-2 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-slate-950 font-bold text-xs rounded-xl shadow-md transition flex items-center justify-center space-x-1.5 active:scale-95 cursor-pointer"
            >
              <RefreshCw className="w-3.5 h-3.5" />
              <span>Stay Logged In ({remainingIdleSeconds}s)</span>
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
