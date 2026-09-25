import React from 'react';
import { useAttendance } from '../context/AttendanceContext';

interface SchoolLogoProps {
  variant?: 'full' | 'compact' | 'emblem' | 'id-card' | 'white';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showMotto?: boolean;
  customLogo?: string | null;
}

/**
 * Official Spirit & Word Attendance Tracking System Logo & Emblem
 * Motto: "The Quick, The Sharp and The Clever"
 * Supports dynamic uploaded logos from Admin Setup with high-fidelity fallback.
 */
export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
  showMotto = true,
  customLogo,
}) => {
  let contextLogo: string | null = null;
  try {
    const attendance = useAttendance();
    contextLogo = attendance.systemLogo;
  } catch {
    // If used outside context, fallback to localStorage or default emblem
    try {
      contextLogo = localStorage.getItem('swis_custom_logo');
    } catch {
      contextLogo = null;
    }
  }

  const activeLogo = customLogo !== undefined ? customLogo : (contextLogo || '/assets/saw_emblem.svg');

  const getPixelSize = () => {
    switch (size) {
      case 'xs':
        return 24;
      case 'sm':
        return 32;
      case 'md':
        return 44;
      case 'lg':
        return 60;
      case 'xl':
        return 80;
      default:
        return 44;
    }
  };

  const px = getPixelSize();

  // Polished Institutional Emblem Fallback
  const FallbackEmblem = ({ emblemPx }: { emblemPx: number }) => (
    <img
      src="/assets/saw_emblem.svg"
      alt="Spirit & Word Attendance Tracking System Emblem"
      style={{ width: emblemPx, height: emblemPx }}
      className="object-contain shrink-0 rounded select-none drop-shadow-xs"
    />
  );

  // Render emblem: either the user's uploaded logo or the clean emblem
  const renderEmblem = (emblemPx: number) => {
    if (activeLogo) {
      return (
        <img
          src={activeLogo}
          alt="Spirit & Word Attendance Tracking System"
          style={{ width: emblemPx, height: emblemPx }}
          className="object-contain shrink-0 rounded select-none"
          onError={(e) => {
            // Fallback to svg if image fails
            (e.target as HTMLImageElement).src = '/assets/saw_emblem.svg';
          }}
        />
      );
    }
    return <FallbackEmblem emblemPx={emblemPx} />;
  };

  // Pure emblem variant
  if (variant === 'emblem') {
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        {renderEmblem(px)}
      </div>
    );
  }

  // ID Card badge variant (clean, crisp, horizontal layout with school name & motto)
  if (variant === 'id-card') {
    return (
      <div className={`flex items-center space-x-2.5 ${className}`}>
        <div className="bg-white p-1 rounded-lg shrink-0 shadow-xs flex items-center justify-center">
          {renderEmblem(36)}
        </div>
        <div className="text-left leading-tight">
          <h1 className="font-serif font-black tracking-wider text-[12px] uppercase text-white drop-shadow-xs">
            SPIRIT &amp; WORD
          </h1>
          <p className="font-serif text-[8px] tracking-widest uppercase text-amber-200 font-semibold">
            ATTENDANCE TRACKING SYSTEM
          </p>
          {showMotto && (
            <p className="text-[7.5px] italic text-slate-100 font-sans tracking-tight pt-0.5 border-t border-white/20 mt-0.5">
              The Quick, The Sharp and The Clever
            </p>
          )}
        </div>
      </div>
    );
  }

  // Compact variant for Navbar header (light text on dark background)
  if (variant === 'compact' || variant === 'white') {
    return (
      <div className={`flex items-center space-x-2.5 ${className}`}>
        <div className="bg-white/95 p-1 rounded-xl shrink-0 shadow-xs border border-white/20 flex items-center justify-center">
          {renderEmblem(size === 'sm' ? 30 : 36)}
        </div>
        <div className="text-left">
          <div className="flex items-center space-x-1.5">
            <span className="font-serif font-extrabold text-sm sm:text-base tracking-wider text-slate-900">
              SPIRIT &amp; WORD
            </span>
          </div>
          <p className="font-serif text-[9px] sm:text-[10px] tracking-widest uppercase text-[#A71C21] font-bold -mt-0.5">
            ATTENDANCE TRACKING SYSTEM
          </p>
          {showMotto && (
            <p className="text-[9px] text-slate-600 italic hidden md:block font-sans">
              The Quick, The Sharp and The Clever
            </p>
          )}
        </div>
      </div>
    );
  }

  // Full variant (Official branded banner for Login, Dashboard, Roster headers)
  return (
    <div className={`flex items-center space-x-3.5 ${className}`}>
      <div className="bg-white p-1.5 rounded-2xl shrink-0 shadow-sm border border-slate-200 flex items-center justify-center">
        {renderEmblem(px)}
      </div>

      <div className="text-left flex flex-col justify-center">
        <h1 className="font-serif font-black tracking-wider text-lg sm:text-2xl text-[#8B1E2F] uppercase leading-none">
          SPIRIT &amp; WORD
        </h1>
        <h2 className="font-serif font-bold text-xs sm:text-sm tracking-widest text-[#8B1E2F] uppercase leading-tight mt-0.5">
          ATTENDANCE TRACKING SYSTEM
        </h2>

        {/* Maroon underline rule */}
        <div className="h-[2px] w-full bg-[#8B1E2F] my-1 rounded-full" />

        {showMotto && (
          <p className="text-[10px] sm:text-xs text-slate-800 font-sans font-medium tracking-tight">
            The Quick, The Sharp and The Clever
          </p>
        )}
      </div>
    </div>
  );
};
