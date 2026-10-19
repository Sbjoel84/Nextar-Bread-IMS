import React, { useState } from 'react';

interface LogoProps {
  className?: string;
  size?: 'sm' | 'md' | 'lg';
  showSubtitle?: boolean;
}

export const NextarLogo: React.FC<LogoProps> = ({
  className = '',
  size = 'md',
  showSubtitle = true,
}) => {
  const [imgError, setImgError] = useState(false);

  const imgHeight = size === 'sm' ? 'h-9' : size === 'lg' ? 'h-16' : 'h-11';

  return (
    <div className={`flex items-center gap-3 ${className}`}>
      {!imgError ? (
        <img
          src="/logo.jpg"
          alt="Nextar Logo"
          onError={() => setImgError(true)}
          className={`${imgHeight} object-contain rounded-lg shadow-sm border border-blue-500/20 bg-white/5 p-1 backdrop-blur-sm`}
        />
      ) : (
        <div className="relative flex items-center justify-center bg-gradient-to-br from-blue-700 via-blue-800 to-indigo-950 text-white font-extrabold rounded-lg px-3 py-1.5 shadow-md border border-blue-400/30">
          <span className="text-xl tracking-tight italic font-serif text-blue-200">
            nex<span className="text-white drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]">tar</span>
          </span>
          <span className="absolute -top-1 -right-1 text-xs text-cyan-300">✦</span>
        </div>
      )}

      {showSubtitle && (
        <div className="flex flex-col">
          <div className="flex items-center gap-1.5">
            <span className="text-sm font-bold tracking-tight text-white">
              NEXTAR BREAD BAKERY
            </span>
            <span className="text-[10px] font-semibold uppercase tracking-wider bg-blue-600/30 text-blue-300 px-1.5 py-0.5 rounded border border-blue-500/30">
              ERP
            </span>
          </div>
          <span className="text-[11px] text-slate-400 font-medium">
            Kubwa, Abuja • Nigeria
          </span>
        </div>
      )}
    </div>
  );
};
