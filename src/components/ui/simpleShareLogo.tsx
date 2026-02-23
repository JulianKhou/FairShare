import React from 'react';

export const SimpleShareLogo: React.FC<{ size?: number; color1?: string; color2?: string }> = ({ size = 200, color1 = '#00FFFF', color2 = '#BF00FF' }) => {
  const logo = "icon.svg"

  return (
    <img src={logo} alt="SimpleShare Logo" width={size} height={size} />
  );
};

