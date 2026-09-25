import React from 'react';
import { motion } from 'framer-motion';

interface AnimatedCheckProps {
  size?: number;
  className?: string;
}

export const AnimatedCheck: React.FC<AnimatedCheckProps> = ({
  size = 24,
  className = 'text-emerald-400',
}) => {
  return (
    <motion.svg
      width={size}
      height={size}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2.5}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      initial={{ scale: 0.8, opacity: 0 }}
      animate={{ scale: 1, opacity: 1 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
    >
      <motion.circle
        cx={12}
        cy={12}
        r={10}
        initial={{ pathLength: 0, opacity: 0 }}
        animate={{ pathLength: 1, opacity: 1 }}
        transition={{ duration: 0.35, ease: 'easeOut' }}
      />
      <motion.path
        d="M8 12.5l2.5 2.5 5.5-5.5"
        initial={{ pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={{ duration: 0.3, delay: 0.15, ease: 'easeOut' }}
      />
    </motion.svg>
  );
};
