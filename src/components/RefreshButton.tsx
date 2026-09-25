import React, { useState } from 'react';
import { RefreshCw, CheckCircle2, AlertCircle } from 'lucide-react';

export interface RefreshButtonProps {
  onRefresh?: () => Promise<void> | void;
  isRefreshing?: boolean;
  label?: string;
  variant?: 'primary' | 'secondary' | 'dark' | 'outline' | 'minimal';
  size?: 'sm' | 'md' | 'lg';
  showLastSync?: boolean;
  lastSyncTime?: string;
  className?: string;
  title?: string;
  disabled?: boolean;
}

export const RefreshButton: React.FC<RefreshButtonProps> = ({
  onRefresh,
  isRefreshing: externalIsRefreshing,
  label = 'Refresh',
  variant = 'dark',
  size = 'md',
  showLastSync = false,
  lastSyncTime,
  className = '',
  title = 'Force sync daily attendance logs and invalidate cache',
  disabled = false,
}) => {
  const [internalLoading, setInternalLoading] = useState(false);
  const [feedback, setFeedback] = useState<'success' | 'error' | null>(null);
  const [feedbackMsg, setFeedbackMsg] = useState<string>('');

  const isLoading = externalIsRefreshing ?? internalLoading;

  const handleClick = async () => {
    if (isLoading || disabled) return;

    setInternalLoading(true);
    setFeedback(null);

    try {
      if (onRefresh) {
        await onRefresh();
      }
      setFeedback('success');
      setFeedbackMsg('Data synchronized successfully');
      setTimeout(() => {
        setFeedback(null);
      }, 3000);
    } catch (err) {
      console.error('Refresh button error:', err);
      setFeedback('error');
      setFeedbackMsg('Sync failed. Using cached state.');
      setTimeout(() => {
        setFeedback(null);
      }, 4000);
    } finally {
      setInternalLoading(false);
    }
  };

  // Variant styling
  const variantStyles = {
    dark: 'bg-slate-800 hover:bg-slate-700 active:bg-slate-900 text-slate-100 border border-slate-700 shadow-xs',
    primary: 'bg-indigo-600 hover:bg-indigo-500 active:bg-indigo-700 text-white shadow-sm border border-indigo-500',
    secondary: 'bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 text-white shadow-sm border border-emerald-500',
    outline: 'bg-white hover:bg-slate-50 active:bg-slate-100 text-slate-700 border border-slate-300 shadow-xs',
    minimal: 'bg-transparent hover:bg-slate-100/10 text-slate-300 active:bg-slate-200/20',
  };

  // Size styling
  const sizeStyles = {
    sm: 'px-2.5 py-1 text-xs min-h-[32px] rounded-lg gap-1.5',
    md: 'px-3.5 py-1.5 text-xs min-h-[38px] rounded-xl gap-2 font-bold',
    lg: 'px-4 py-2 text-sm min-h-[44px] rounded-xl gap-2.5 font-bold',
  };

  const iconSizes = {
    sm: 'w-3 h-3',
    md: 'w-3.5 h-3.5',
    lg: 'w-4 h-4',
  };

  return (
    <div className="inline-flex items-center gap-2">
      <button
        type="button"
        onClick={handleClick}
        disabled={isLoading || disabled}
        title={title}
        className={`inline-flex items-center justify-center font-bold transition active:scale-95 cursor-pointer touch-manipulation disabled:opacity-50 disabled:cursor-not-allowed ${variantStyles[variant]} ${sizeStyles[size]} ${className}`}
      >
        {feedback === 'success' ? (
          <CheckCircle2 className={`${iconSizes[size]} text-emerald-400 animate-in zoom-in-50 duration-200`} />
        ) : feedback === 'error' ? (
          <AlertCircle className={`${iconSizes[size]} text-rose-400 animate-in zoom-in-50 duration-200`} />
        ) : (
          <RefreshCw
            className={`${iconSizes[size]} ${isLoading ? 'animate-spin text-amber-400' : 'text-emerald-400'}`}
          />
        )}
        <span>{isLoading ? 'Syncing...' : feedback === 'success' ? 'Updated!' : feedback === 'error' ? 'Retry' : label}</span>
      </button>

      {showLastSync && lastSyncTime && (
        <span className="text-[11px] text-slate-400 font-mono hidden sm:inline-block">
          Sync: {lastSyncTime}
        </span>
      )}

      {feedbackMsg && feedback === 'error' && (
        <span className="text-[11px] text-rose-400 font-semibold animate-in fade-in duration-200">
          {feedbackMsg}
        </span>
      )}
    </div>
  );
};
