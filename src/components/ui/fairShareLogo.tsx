import React from 'react';

export const FairShareLogo: React.FC<{ size?: number; color1?: string; color2?: string }> = ({ size = 200, color1 = '#00FFFF', color2 = '#BF00FF' }) => {
  const logo = "../public/icon.svg"

  return (
    <img src={logo} alt="FairShare Logo" width={size} height={size} />
  );
};

