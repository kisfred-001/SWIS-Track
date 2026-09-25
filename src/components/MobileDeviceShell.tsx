import React, { useState, useEffect } from 'react';
import { Wifi, BatteryMedium, Smartphone, Monitor } from 'lucide-react';
import { useViewport } from '../context/ViewportContext';

interface MobileDeviceShellProps {
  children: React.ReactNode;
}

export const MobileDeviceShell: React.FC<MobileDeviceShellProps> = ({ children }) => {
  const { setViewportMode } = useViewport();
  const [currentTime, setCurrentTime] = useState<string>('');

  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      setCurrentTime(
        now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', hour12: false })
      );
    };
    updateTime();
    const interval = setInterval(updateTime, 30000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="py-2 px-2 sm:px-4 flex flex-col items-center justify-center min-h-[calc(100vh-8rem)]">
      {/* Informative Shell Toolbar */}
      <div className="w-full max-w-[420px] flex items-center justify-between mb-2 px-2 text-xs text-slate-500">
        <div className="flex items-center space-x-1.5 font-medium">
          <Smartphone className="w-4 h-4 text-indigo-600 animate-pulse" />
          <span className="font-semibold text-slate-700">Mobile Device Preview (390 x 844)</span>
        </div>
        <button
          type="button"
          onClick={() => setViewportMode('auto')}
          className="flex items-center space-x-1 text-xs text-indigo-600 hover:text-indigo-800 font-semibold px-2 py-1 rounded-lg hover:bg-indigo-50 transition cursor-pointer"
          title="Return to fluid responsive desktop view"
        >
          <Monitor className="w-3.5 h-3.5" />
          <span>Exit Mobile Shell</span>
        </button>
      </div>

      {/* Hardware Phone Frame Container */}
      <div className="relative max-w-[410px] w-full h-[85vh] min-h-[640px] max-h-[860px] bg-slate-900 rounded-[2.8rem] p-3 shadow-2xl border-4 border-slate-700 ring-1 ring-slate-600/40 flex flex-col overflow-hidden select-none">
        {/* Left / Right simulated hardware edge buttons */}
        <div className="absolute -left-[6px] top-24 w-[3px] h-10 bg-slate-700 rounded-l-md" />
        <div className="absolute -left-[6px] top-38 w-[3px] h-12 bg-slate-700 rounded-l-md" />
        <div className="absolute -right-[6px] top-28 w-[3px] h-14 bg-slate-700 rounded-r-md" />

        {/* Screen Display Bezel */}
        <div className="relative w-full h-full bg-slate-100 rounded-[2.2rem] flex flex-col overflow-hidden border border-slate-300/40 shadow-inner select-text">
          {/* Simulated Mobile Phone Status Bar */}
          <div className="bg-slate-950 text-white px-5 pt-2 pb-1.5 flex items-center justify-between text-[11px] font-semibold tracking-tight shrink-0 z-30 select-none border-b border-slate-800/60">
            {/* Clock */}
            <span className="font-bold tracking-tight text-[11px] pl-1">{currentTime || '09:41'}</span>

            {/* Simulated Dynamic Island / Notch */}
            <div className="flex items-center space-x-2 bg-black px-3 py-1 rounded-full border border-slate-800 shadow-xs">
              <span className="w-2.5 h-2.5 rounded-full bg-slate-900 border border-slate-700/80 flex items-center justify-center">
                <span className="w-1 h-1 rounded-full bg-blue-500/50"></span>
              </span>
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse"></span>
            </div>

            {/* Status Icons: 5G, Wi-Fi, Battery */}
            <div className="flex items-center space-x-1.5 text-slate-300 pr-1">
              <span className="text-[10px] font-bold text-slate-400 font-mono">5G</span>
              <Wifi className="w-3.5 h-3.5 text-slate-200" />
              <BatteryMedium className="w-4 h-4 text-emerald-400" />
            </div>
          </div>

          {/* Interactive Mobile Content Viewport */}
          <div className="flex-1 overflow-y-auto overflow-x-hidden p-2.5 sm:p-3 space-y-4 mobile-viewport-scroll bg-slate-50">
            <div className="mobile-shell-container w-full max-w-full">
              {children}
            </div>
          </div>

          {/* Bottom Simulated Home Bar Indicator */}
          <div className="bg-white py-2 flex items-center justify-center shrink-0 border-t border-slate-200/60 z-20">
            <div className="w-32 h-1 bg-slate-400/80 rounded-full hover:bg-slate-600 transition" />
          </div>
        </div>
      </div>
    </div>
  );
};
