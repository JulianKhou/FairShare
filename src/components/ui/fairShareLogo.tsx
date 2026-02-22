import React from 'react';

export const FairShareLogo: React.FC<{ size?: number; color1?: string; color2?: string }> = ({ size = 200, color1 = '#00FFFF', color2 = '#BF00FF' }) => {
  const glowFilterId1 = "glow1";
  const glowFilterId2 = "glow2";

  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 100 100"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{
        borderRadius: '15%', // Stark abgerundete Ecken für das äußere Quadrat
        backgroundColor: 'black',
        boxShadow: '0 0 15px rgba(0,0,0,0.5)' // Optionaler leichter Schatten für das gesamte Quadrat
      }}
    >
      <defs>
        {/* Glow Filter für das türkisfarbene Element */}
        <filter id={glowFilterId1} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feFlood floodColor={color1} floodOpacity="1" result="color" />
          <feComposite in="color" in2="SourceGraphic" operator="in" result="glowMask" />
          <feComposite in="SourceGraphic" in2="glowMask" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="compositeGlow" />
        </filter>

        {/* Glow Filter für das violette Element */}
        <filter id={glowFilterId2} x="-50%" y="-50%" width="200%" height="200%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="5" result="blur" />
          <feMerge>
            <feMergeNode in="blur" />
            <feMergeNode in="SourceGraphic" />
          </feMerge>
          <feFlood floodColor={color2} floodOpacity="1" result="color" />
          <feComposite in="color" in2="SourceGraphic" operator="in" result="glowMask" />
          <feComposite in="SourceGraphic" in2="glowMask" operator="arithmetic" k1="0" k2="1" k3="1" k4="0" result="compositeGlow" />
        </filter>
      </defs>

      {/* Linkes Element (Türkis/Cyan) */}
      <path
        d="M 25 20 C 25 15 28 15 28 15 L 28 85 C 28 85 25 85 25 80 C 25 80 25 78 25 75 L 50 50 L 25 25 C 25 22 25 20 25 20 Z"
        fill={color1}
        filter={`url(#${glowFilterId1})`}
      />

      {/* Rechtes Element (Violett/Lila) */}
      <path
        d="M 55 50 L 75 75 C 78 78 78 80 75 80 L 75 20 C 78 22 78 25 75 25 L 55 50 Z"
        fill={color2}
        filter={`url(#${glowFilterId2})`}
      />
    </svg>
  );
};

