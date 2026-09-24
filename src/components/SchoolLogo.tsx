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
 * Official Spirit & Word International School Logo
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
    // If used outside context, fallback to localStorage
    try {
      contextLogo = localStorage.getItem('swis_custom_logo');
    } catch {
      contextLogo = null;
    }
  }

  const activeLogo = customLogo !== undefined ? customLogo : contextLogo;

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
    <svg
      width={emblemPx}
      height={emblemPx}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* Outer Maroon Circular Seal */}
      <circle cx="50" cy="50" r="48" fill="#8B1E2F" stroke="#F59E0B" strokeWidth="2.5" />
      {/* Inner Concentric Ring */}
      <circle cx="50" cy="50" r="43" fill="#6B1321" stroke="#FBBF24" strokeWidth="1" strokeDasharray="2 2" />

      {/* Radiant Sunburst Flares */}
      <circle cx="50" cy="50" r="38" fill="#8B1E2F" />

      {/* Golden Latin Cross */}
      <path
        d="M47 22H53V34H65V40H53V72H47V40H35V34H47V22Z"
        fill="#F59E0B"
        stroke="#FEF08A"
        strokeWidth="0.8"
      />

      {/* Open Book of Knowledge / Word */}
      <path
        d="M28 58C36 54 44 56 50 60C56 56 64 54 72 58V76C64 72 56 74 50 78C44 74 36 72 28 76V58Z"
        fill="#FFFFFF"
        stroke="#D97706"
        strokeWidth="1.2"
      />
      {/* Book Center Binding */}
      <line x1="50" y1="60" x2="50" y2="78" stroke="#8B1E2F" strokeWidth="1.2" />
      {/* Subtle Book Text Lines */}
      <line x1="33" y1="64" x2="45" y2="64" stroke="#94A3B8" strokeWidth="0.8" />
      <line x1="33" y1="68" x2="45" y2="68" stroke="#94A3B8" strokeWidth="0.8" />
      <line x1="55" y1="64" x2="67" y2="64" stroke="#94A3B8" strokeWidth="0.8" />
      <line x1="55" y1="68" x2="67" y2="68" stroke="#94A3B8" strokeWidth="0.8" />

      {/* Academic Mortarboard Graduation Cap at Apex */}
      <polygon points="50,16 64,22 50,28 36,22" fill="#FEF08A" stroke="#B45309" strokeWidth="0.8" />
      <path d="M42 25V30C42 32 50 34 50 34C50 34 58 32 58 30V25" stroke="#FEF08A" strokeWidth="0.8" fill="none" />
      {/* Tassel */}
      <path d="M64 22L67 31" stroke="#F59E0B" strokeWidth="0.8" />
      <circle cx="67" cy="32" r="1" fill="#FEF08A" />
    </svg>
  );

  // Render emblem: either the user's uploaded logo or the clean emblem
  const renderEmblem = (emblemPx: number) => {
    if (activeLogo) {
      return (
        <img
          src={activeLogo}
          alt="Spirit & Word International School"
          style={{ width: emblemPx, height: emblemPx }}
          className="object-contain shrink-0 rounded select-none"
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
            INTERNATIONAL SCHOOL
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
            <span className="font-serif font-extrabold text-sm sm:text-base tracking-wider text-white">
              SPIRIT &amp; WORD
            </span>
          </div>
          <p className="font-serif text-[9px] sm:text-[10px] tracking-widest uppercase text-amber-300 font-bold -mt-0.5">
            INTERNATIONAL SCHOOL
          </p>
          {showMotto && (
            <p className="text-[9px] text-slate-300 italic hidden md:block font-sans">
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
          INTERNATIONAL SCHOOL
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
