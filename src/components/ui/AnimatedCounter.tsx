import React, { useEffect, useRef } from 'react';
import { useMotionValue, useSpring } from 'framer-motion';

interface AnimatedCounterProps {
  value: number;
  duration?: number; // duration in seconds
  className?: string;
  decimals?: number;
  suffix?: string;
  prefix?: string;
}

export const AnimatedCounter: React.FC<AnimatedCounterProps> = ({
  value,
  className = '',
  decimals = 0,
  suffix = '',
  prefix = '',
}) => {
  const ref = useRef<HTMLSpanElement>(null);
  const motionVal = useMotionValue(0);
  
  // Spring fluido con damping ejecutivo (sin rebote excesivo)
  const springVal = useSpring(motionVal, {
    stiffness: 85,
    damping: 24,
    mass: 0.8,
  });

  useEffect(() => {
    motionVal.set(value);
  }, [value, motionVal]);

  useEffect(() => {
    const unsubscribe = springVal.on('change', (latest) => {
      if (ref.current) {
        const formatted = Number(latest.toFixed(decimals)).toLocaleString('es-CO', {
          minimumFractionDigits: decimals,
          maximumFractionDigits: decimals,
        });
        ref.current.textContent = `${prefix}${formatted}${suffix}`;
      }
    });

    return () => unsubscribe();
  }, [springVal, decimals, prefix, suffix]);

  return (
    <span
      ref={ref}
      className={`tabular-nums ${className}`}
      style={{ willChange: 'contents' }}
    >
      {prefix}
      {value.toLocaleString('es-CO', {
        minimumFractionDigits: decimals,
        maximumFractionDigits: decimals,
      })}
      {suffix}
    </span>
  );
};
