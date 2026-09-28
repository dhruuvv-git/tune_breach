'use client';

import React, { memo } from 'react';

export const AuroraText = memo(
  ({
    children,
    className = '',
    colors = ['#ffffff', '#f3c8ff', '#e100ff', '#a855f7', '#590764', '#e100ff'],
    speed = 1.2,
  }) => {
    const gradientStyle = {
      backgroundImage: `linear-gradient(135deg, ${colors.join(', ')}, ${colors[0]})`,
      WebkitBackgroundClip: 'text',
      WebkitTextFillColor: 'transparent',
      animationDuration: `${10 / speed}s`,
    };

    return (
      <span className={`relative inline-block ${className}`}>
        <span className="sr-only">{children}</span>
        <span
          className="animate-aurora relative inline-block bg-[length:200%_auto] bg-clip-text text-transparent"
          style={gradientStyle}
          aria-hidden="true"
        >
          {children}
        </span>
      </span>
    );
  }
);

AuroraText.displayName = 'AuroraText';

export default AuroraText;
