import React, { useState, useEffect } from 'react';
import { useAttendance } from '../context/AttendanceContext';
import { useAuth } from '../context/AuthContext';
import {
  BellRing,
  AlertTriangle,
  ArrowRight,
  X,
  Volume2,
  ShieldAlert,
  Flame,
  CheckCircle2,
} from 'lucide-react';
import { sound } from '../utils/sound';

interface UrgentAlertBannerProps {
  onNavigateToApprovals: () => void;
}

export const UrgentAlertBanner: React.FC<UrgentAlertBannerProps> = ({ onNavigateToApprovals }) => {
  const { activeUrgentAlerts, dismissAlert } = useAttendance();
  const { canApproveEditRequests, currentUser } = useAuth();

  const isTopWindow = typeof window !== 'undefined' && window.self === window.top;
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>(() => {
    try {
      return typeof window !== 'undefined' && 'Notification' in window ? Notification.permission : 'default';
    } catch {
      return 'default';
    }
  });

  const requestPushPermission = async () => {
    if (isTopWindow && typeof window !== 'undefined' && 'Notification' in window) {
      try {
        const perm = await Notification.requestPermission();
        setNotificationPermission(perm);
      } catch {
        // Silently handle if user or browser rejects
      }
    }
  };

  // Only display to Principals, Directors, and Super Users who review requests
  if (!canApproveEditRequests || activeUrgentAlerts.length === 0) {
    return null;
  }

  const latestAlert = activeUrgentAlerts[0];

  return (
    <div className="bg-gradient-to-r from-rose-600 via-red-600 to-amber-600 text-white shadow-lg animate-in slide-in-from-top-3 duration-200 border-b border-rose-700">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3">
          {/* Left: Icon & Alert Summary */}
          <div className="flex items-start sm:items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-white/20 backdrop-blur-md flex items-center justify-center shrink-0 animate-bounce">
              <Flame className="w-5 h-5 text-amber-200 fill-amber-200" />
            </div>

            <div>
              <div className="flex items-center space-x-2">
                <span className="bg-black/30 text-amber-200 font-extrabold text-[10px] tracking-wider uppercase px-2 py-0.5 rounded-full border border-white/20">
                  FCM Push Alert • Priority 1
                </span>
                <span className="text-xs text-white/90 font-medium">
                  {new Date(latestAlert.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
                {activeUrgentAlerts.length > 1 && (
                  <span className="bg-white text-rose-800 text-[10px] font-bold px-1.5 py-0.2 rounded-full">
                    +{activeUrgentAlerts.length - 1} more
                  </span>
                )}
              </div>

              <p className="text-xs sm:text-sm font-bold text-white mt-0.5">
                Urgent Edit Request for{' '}
                <span className="underline decoration-amber-300 font-extrabold">
                  {latestAlert.target_name}
                </span>{' '}
                submitted by {latestAlert.teacher_name}
              </p>

              <p className="text-xs text-rose-100 italic truncate max-w-xl">
                "{latestAlert.reason}"
              </p>
            </div>
          </div>

          {/* Right: Actions */}
          <div className="flex items-center space-x-2 shrink-0 self-end md:self-auto">
            {isTopWindow && notificationPermission !== 'granted' && typeof window !== 'undefined' && 'Notification' in window && (
              <button
                type="button"
                onClick={requestPushPermission}
                className="hidden lg:flex items-center space-x-1 px-2.5 py-1 bg-black/20 hover:bg-black/30 text-[11px] rounded-lg border border-white/20 transition text-amber-100"
                title="Enable browser notifications for FCM alerts"
              >
                <BellRing className="w-3.5 h-3.5" />
                <span>Enable System Push</span>
              </button>
            )}

            <button
              type="button"
              onClick={() => sound.playUrgentAlert()}
              className="p-1.5 bg-black/20 hover:bg-black/30 rounded-lg text-white/80 hover:text-white transition"
              title="Test Alert Chime"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            <button
              type="button"
              onClick={() => {
                onNavigateToApprovals();
              }}
              className="flex items-center space-x-1.5 px-3.5 py-1.5 bg-white text-rose-700 hover:bg-rose-50 rounded-xl text-xs font-bold shadow-md transition transform active:scale-95"
            >
              <span>Review Request</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>

            <button
              type="button"
              onClick={() => dismissAlert(latestAlert.id)}
              className="p-1.5 text-white/70 hover:text-white hover:bg-white/10 rounded-lg transition"
              title="Dismiss alert"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
