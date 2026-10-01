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

  const sizeClasses =
    size === 'md'
      ? 'w-11 h-11 rounded-2xl'
      : 'p-2 rounded-xl';

  return (
    <button
      type="button"
      onClick={toggleTheme}
      className={`relative inline-flex items-center justify-center shrink-0 transition-all active:scale-95 cursor-pointer select-none ${sizeClasses} ${
        isDark
          ? 'bg-[#0c162d] hover:bg-[#132245] border border-[#1d2f59] text-slate-300 hover:text-white shadow-sm'
          : 'bg-slate-100 hover:bg-slate-200/80 border border-slate-200 text-slate-600 hover:text-slate-900 shadow-xs'
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
            className="flex items-center justify-center text-sky-400"
          >
            <Moon className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2.2} />
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
            <Sun className={size === 'sm' ? 'w-4 h-4' : 'w-5 h-5'} strokeWidth={2.2} />
          </motion.div>
        )}
      </AnimatePresence>
    </button>
  );
};
