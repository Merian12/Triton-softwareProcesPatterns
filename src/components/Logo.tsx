'use client';

import React from 'react';

export type LogoHoverAnimation = 'both' | 'left' | 'right' | 'none';

export interface LogoProps {
  /** 'full' renders the Six Volunteers symbol + VolunteerPortal wordmark; 'symbol' renders only the icon */
  variant?: 'full' | 'symbol';
  /** Hover behavior on the icon: 'left' (+360deg + scale 75%), 'right' (-360deg + scale 75%), 'both' (left then right), or 'none' */
  hoverAnimation?: LogoHoverAnimation;
  /** When true, continuously runs the back-to-back left-then-right 360deg spin + 75% scale animation */
  loading?: boolean;
  /** Optional width/size class or CSS className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

const LOGO_KEYFRAMES_CSS = `
@keyframes triton-spin-left {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(180deg) scale(0.75); }
  100% { transform: rotate(360deg) scale(1); }
}

@keyframes triton-spin-right {
  0%   { transform: rotate(0deg) scale(1); }
  50%  { transform: rotate(-180deg) scale(0.75); }
  100% { transform: rotate(-360deg) scale(1); }
}

@keyframes triton-spin-both {
  0%   { transform: rotate(0deg) scale(1); }
  25%  { transform: rotate(180deg) scale(0.75); }
  50%  { transform: rotate(360deg) scale(1); }
  75%  { transform: rotate(180deg) scale(0.75); }
  100% { transform: rotate(0deg) scale(1); }
}

.triton-logo-symbol {
  transform-origin: center center;
  will-change: transform;
}

.triton-logo-wrapper:hover .triton-hover-left {
  animation: triton-spin-left 0.9s ease-in-out infinite;
}

.triton-logo-wrapper:hover .triton-hover-right {
  animation: triton-spin-right 0.9s ease-in-out infinite;
}

.triton-logo-wrapper:hover .triton-hover-both {
  animation: triton-spin-both 1.8s ease-in-out infinite;
}

.triton-symbol-loading {
  animation: triton-spin-both 1.8s ease-in-out infinite;
}
`;

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  hoverAnimation = 'both',
  loading = false,
  className = '',
  ariaLabel = 'Triton VolunteerPortal Logo',
}) => {
  const animClass = loading
    ? 'triton-symbol-loading'
    : hoverAnimation === 'left'
      ? 'triton-hover-left'
      : hoverAnimation === 'right'
        ? 'triton-hover-right'
        : hoverAnimation === 'both'
          ? 'triton-hover-both'
          : '';

  if (variant === 'symbol') {
    return (
      <span
        className={`triton-logo-wrapper inline-flex items-center justify-center select-none ${className}`}
        role="img"
        aria-label={ariaLabel}
      >
        <style>{LOGO_KEYFRAMES_CSS}</style>
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/logo-symbol.svg"
          alt=""
          className={`triton-logo-symbol h-full w-full object-contain ${animClass}`}
          draggable={false}
        />
      </span>
    );
  }

  return (
    <div
      className={`triton-logo-wrapper inline-flex flex-col items-center select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <style>{LOGO_KEYFRAMES_CSS}</style>
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src="/logo-symbol.svg"
        alt=""
        className={`triton-logo-symbol w-24 h-24 object-contain ${animClass}`}
        draggable={false}
      />
      <span className="mt-1 text-lg font-extrabold tracking-tight">
        <span style={{ color: '#262E40' }}>Volunteer</span>
        <span style={{ color: '#D7142A' }}>Portal</span>
      </span>
    </div>
  );
};

export default Logo;
