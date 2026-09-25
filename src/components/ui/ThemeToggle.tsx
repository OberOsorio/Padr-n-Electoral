import React from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

interface ThemeToggleProps {
  className?: string;
  size?: 'sm' | 'md';
}

export const ThemeToggle: React.FC<ThemeToggleProps> = ({
  className = '',
  size = 'sm',
}) => {
  const { theme, toggleTheme } = useTheme();
  const isDark = theme === 'dark';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center rounded-xl p-2 transition-all cursor-pointer select-none ${
        isDark
          ? 'bg-[#07090E] border border-slate-800 text-slate-300 hover:text-white hover:border-slate-700 shadow-sm'
          : 'bg-slate-100 border border-slate-200 text-slate-600 hover:text-slate-900 hover:bg-slate-200/80 shadow-xs'
      } ${className}`}
      title={isDark ? 'Cambiar a modo Claro' : 'Cambiar a modo Oscuro'}
      aria-label="Alternar tema de la interfaz"
    >
      <AnimatePresence mode="wait" initial={false}>
        {isDark ? (
          <motion.div
            key="moon"
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center justify-center text-blue-400"
          >
            <Moon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2} />
          </motion.div>
        ) : (
          <motion.div
            key="sun"
            initial={{ opacity: 0, rotate: -45, scale: 0.8 }}
            animate={{ opacity: 1, rotate: 0, scale: 1 }}
            exit={{ opacity: 0, rotate: 45, scale: 0.8 }}
            transition={{ duration: 0.2, ease: 'easeOut' }}
            className="flex items-center justify-center text-amber-500"
          >
            <Sun className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
