import React from 'react';

interface SchoolLogoProps {
  variant?: 'full' | 'compact' | 'emblem' | 'id-card' | 'white';
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl';
  showMotto?: boolean;
}

/**
 * Official Spirit & Word International School Logo
 * Motto: "The Quick, The Sharp and The Clever"
 * Faithfully styled from official school brand identity
 */
export const SchoolLogo: React.FC<SchoolLogoProps> = ({
  variant = 'full',
  className = '',
  size = 'md',
  showMotto = true,
}) => {
  // SVG Emblem of Spirit & Word International School
  const Emblem = ({ emblemSize = 44 }: { emblemSize?: number }) => (
    <svg
      width={emblemSize}
      height={emblemSize}
      viewBox="0 0 200 200"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="shrink-0 drop-shadow-xs"
    >
      {/* Radiant Orange Arc Circle */}
      <circle
        cx="92"
        cy="92"
        r="70"
        stroke="#F58220"
        strokeWidth="11"
        strokeLinecap="round"
        strokeDasharray="360 80"
        transform="rotate(-30 92 92)"
      />

      {/* Maroon Primary Joyful Figure (Head) */}
      <circle cx="78" cy="88" r="16" fill="#8B1E2F" />

      {/* Maroon Primary Joyful Figure (Body & Outstretched Arms) */}
      <path
        d="M48 108C52 98 62 94 78 102C92 94 104 98 114 108C108 128 88 142 78 142C68 142 54 128 48 108Z"
        fill="#8B1E2F"
      />
      {/* Left arm extended */}
      <path
        d="M48 108C38 100 28 104 22 108C30 118 42 120 54 116L48 108Z"
        fill="#8B1E2F"
      />

      {/* Inner Yellow Figure (Head & Joyous Arm) */}
      <circle cx="112" cy="94" r="12" fill="#F9A01B" />
      <path
        d="M102 110C108 102 118 100 124 108C120 122 108 130 102 130C98 124 98 116 102 110Z"
        fill="#F9A01B"
      />
      {/* Yellow arm raised */}
      <path
        d="M116 94C122 82 128 72 132 68C134 76 130 90 124 102L116 94Z"
        fill="#F9A01B"
      />

      {/* Maroon Dynamic Origami / Star Wing Base */}
      <path
        d="M28 140L72 122L162 98L68 178L78 142L28 140Z"
        fill="#8B1E2F"
      />
      {/* Wing fold facet */}
      <path
        d="M68 178L106 156L162 98L72 122L68 178Z"
        fill="#6D1422"
      />
      {/* Lower supporting wing strut */}
      <path
        d="M68 178L92 186L106 156L68 178Z"
        stroke="#8B1E2F"
        strokeWidth="3"
        fill="#8B1E2F"
      />
    </svg>
  );

  if (variant === 'emblem') {
    const s = size === 'xs' ? 24 : size === 'sm' ? 32 : size === 'md' ? 44 : size === 'lg' ? 56 : 72;
    return (
      <div className={`inline-flex items-center justify-center ${className}`}>
        <Emblem emblemSize={s} />
      </div>
    );
  }

  // ID Card badge variant (clean, crisp, horizontal layout with school name & motto)
  if (variant === 'id-card') {
    return (
      <div className={`flex items-center space-x-2.5 ${className}`}>
        <div className="bg-white p-1 rounded-lg shrink-0 shadow-xs">
          <Emblem emblemSize={36} />
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
        <div className="bg-white/95 p-1 rounded-xl shrink-0 shadow-xs border border-white/20">
          <Emblem emblemSize={size === 'sm' ? 30 : 36} />
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
      <div className="bg-white p-1.5 rounded-2xl shrink-0 shadow-sm border border-slate-200">
        <Emblem
          emblemSize={
            size === 'xs' ? 32 : size === 'sm' ? 44 : size === 'md' ? 56 : size === 'lg' ? 72 : 88
          }
        />
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
