'use client';

import React, { useState } from 'react';

export type LogoHoverAnimation = 'both' | 'left' | 'right' | 'none';

export interface LogoProps {
  /** 'full' renders the Six Volunteers symbol + VolunteerPortal wordmark; 'symbol' renders only the icon */
  variant?: 'full' | 'symbol';
  /** 'default' uses brand colors; 'white' uses pure white (#FFFFFF); 'on-red' uses white for red elements */
  colorScheme?: 'default' | 'white' | 'on-red';
  /** Hover behavior on the icon: 'left' (+360deg + scale 75%), 'right' (-360deg + scale 75%), 'both' (left then right), or 'none' */
  hoverAnimation?: LogoHoverAnimation;
  /** When true, continuously runs the back-to-back left-then-right 360deg spin + 75% scale animation */
  loading?: boolean;
  /** Incrementing counter to trigger a single 360deg spin + 75% scale animation on click */
  spinTrigger?: number;
  /** Optional width/size class or CSS className */
  className?: string;
  /** Accessible label */
  ariaLabel?: string;
}

export const Logo: React.FC<LogoProps> = ({
  variant = 'full',
  colorScheme = 'default',
  hoverAnimation = 'both',
  loading = false,
  spinTrigger = 0,
  className = '',
  ariaLabel = 'Triton VolunteerPortal Logo',
}) => {
  const [internalSpin] = useState(0);
  const totalSpinCount = spinTrigger + internalSpin;
  const symbolSrc =
    colorScheme === 'white'
      ? '/logo-symbol-white.svg'
      : colorScheme === 'on-red'
        ? '/logo-symbol-on-red.svg'
        : '/logo-symbol.svg';

  const animClass = loading
    ? 'triton-symbol-loading'
    : totalSpinCount > 0
      ? 'triton-symbol-spin-once'
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
        <span
          key={totalSpinCount}
          className={`triton-logo-symbol flex h-full w-full items-center justify-center ${animClass}`}
        >
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={symbolSrc}
            alt=""
            className="h-full w-full object-contain pointer-events-none"
            draggable={false}
          />
        </span>
      </span>
    );
  }

  return (
    <div
      className={`triton-logo-wrapper inline-flex flex-col items-center select-none ${className}`}
      role="img"
      aria-label={ariaLabel}
    >
      <span
        key={totalSpinCount}
        className={`triton-logo-symbol flex w-24 h-24 items-center justify-center ${animClass}`}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={symbolSrc}
          alt=""
          className="w-full h-full object-contain pointer-events-none"
          draggable={false}
        />
      </span>
      <span className="mt-1 text-lg font-extrabold tracking-tight">
        <span style={{ color: colorScheme === 'white' ? '#FFFFFF' : 'var(--brand-navy)' }}>Volunteer</span>
        <span style={{ color: colorScheme === 'white' || colorScheme === 'on-red' ? '#FFFFFF' : 'var(--brand-accent)' }}>Portal</span>
      </span>
    </div>
  );
};

export default Logo;
