import React from 'react';
import Svg, { Defs, LinearGradient, Stop, Path } from 'react-native-svg';

interface GradientHeartIconProps {
  size?: number;
  focused?: boolean;
}

const GradientHeartIcon = ({ size = 24, focused = true }: GradientHeartIconProps) => {
  if (!focused) {
    return (
      <Svg width={size} height={size} viewBox="0 0 512 512">
        <Path 
          fill="none" 
          stroke="white" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          strokeWidth="32" 
          d="M352.92,80C288,80,256,144,256,144s-32-64-96.92-64C106.32,80,64.54,124.14,64,176.81c-1.1,97.74,122,190.1,192,255.19c70-65.09,193.1-157.45,192-255.19C447.46,124.14,405.68,80,352.92,80z"
        />
      </Svg>
    );
  }

  return (
    <Svg width={size} height={size} viewBox="0 0 512 512">
      <Defs>
        <LinearGradient id="grad" x1="0%" y1="0%" x2="0%" y2="100%">
          <Stop offset="0%" stopColor="#B3B8E2" />
          <Stop offset="50%" stopColor="#8860D9" />
          <Stop offset="100%" stopColor="#9575CD" />
        </LinearGradient>
      </Defs>
      <Path 
        fill="url(#grad)" 
        d="M352.92,80C288,80,256,144,256,144s-32-64-96.92-64C106.32,80,64.54,124.14,64,176.81c-1.1,97.74,122,190.1,192,255.19c70-65.09,193.1-157.45,192-255.19C447.46,124.14,405.68,80,352.92,80z"
      />
    </Svg>
  );
};

export default GradientHeartIcon;
