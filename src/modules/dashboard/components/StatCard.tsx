import React from 'react';
import { motion } from 'framer-motion';
import { SpotlightCard } from '../../../components/ui/SpotlightCard';
import { AnimatedCounter } from '../../../components/ui/AnimatedCounter';

interface StatCardProps {
  title: string;
  value: string | number;
  subtitle?: string;
  icon: React.ComponentType<{ className?: string; strokeWidth?: number }>;
  iconColor?: string;
  iconBg?: string;
  accentBorderHover?: string;
  spotlightColor?: string;
  progressPercentage?: number;
  progressLabel?: string;
  trendText?: string;
  trendPositive?: boolean;
  valueClassName?: string;
  customValue?: React.ReactNode;
  badge?: React.ReactNode;
}

export const StatCard = ({
  title,
  value,
  subtitle,
  icon: Icon,
  iconColor = 'text-blue-600 dark:text-blue-400',
  iconBg = 'bg-blue-50 border-blue-200 dark:bg-blue-950/40 dark:border-blue-800/40',
  spotlightColor = 'rgba(37, 99, 235, 0.12)',
  progressPercentage,
  progressLabel,
  trendText,
  trendPositive = true,
  valueClassName,
  customValue,
  badge,
}: StatCardProps) => {
  // Manejo de valores numéricos o porcentuales para el contador animado
  const isNumeric = typeof value === 'number';
  const isPercentString = typeof value === 'string' && value.endsWith('%');
  const numericPercent = isPercentString ? parseFloat(value.replace('%', '')) : null;
  const isLongString = typeof value === 'string' && value.length > 10;
  const defaultSizeClass = isLongString
    ? 'text-xl sm:text-2xl font-semibold'
    : 'text-3xl font-semibold';

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 12 },
        visible: { opacity: 1, y: 0, transition: { duration: 0.28, ease: [0.16, 1, 0.3, 1] } },
      }}
      whileHover={{ y: -2 }}
      transition={{ duration: 0.15 }}
      className="h-full"
    >
      <SpotlightCard
        spotlightColor={spotlightColor}
        className="p-5 h-full flex flex-col justify-between"
      >
        <div>
          {/* Cabecera de la tarjeta */}
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase tracking-wider text-slate-500 dark:text-slate-400 font-medium">
              {title}
            </span>
            <div
              className={`h-9 w-9 rounded-xl border flex items-center justify-center ${iconBg} ${iconColor} shadow-xs dark:shadow-inner transition-colors`}
            >
              <Icon className="w-4.5 h-4.5" strokeWidth={1.8} />
            </div>
          </div>

          {/* Valor principal con AnimatedCounter o customValue */}
          <div className="mt-3 flex items-baseline flex-wrap gap-2">
            {customValue ? (
              customValue
            ) : (
              <span
                className={`${valueClassName || defaultSizeClass} text-slate-900 dark:text-white tracking-tight font-mono tabular-nums`}
              >
                {isNumeric ? (
                  <AnimatedCounter value={value} />
                ) : numericPercent !== null && !isNaN(numericPercent) ? (
                  <AnimatedCounter value={numericPercent} suffix="%" decimals={0} />
                ) : (
                  value
                )}
              </span>
            )}
            {progressLabel && (
              <span className="text-xs font-mono font-medium text-slate-500 dark:text-slate-400">
                {progressLabel}
              </span>
            )}
            {badge}
          </div>

          {/* Barra de progreso animada con brillo en la punta */}
          {typeof progressPercentage === 'number' && (
            <div className="mt-3 w-full bg-slate-100 dark:bg-slate-900/80 rounded-full h-2 overflow-hidden border border-slate-200 dark:border-slate-700/60 p-0.5">
              <motion.div
                initial={{ width: 0 }}
                animate={{ width: `${Math.min(100, Math.max(0, progressPercentage))}%` }}
                transition={{ duration: 0.9, ease: [0.16, 1, 0.3, 1] }}
                className="relative bg-gradient-to-r from-blue-600 via-blue-500 to-[#E5B869] h-full rounded-full shadow-[0_0_10px_rgba(229,184,105,0.5)]"
              >
                {/* Micro destello luminoso en la punta */}
                <span className="absolute right-0 top-0 bottom-0 w-2 rounded-full bg-white/80 shadow-[0_0_8px_rgba(255,255,255,0.9)]" />
              </motion.div>
            </div>
          )}
        </div>

        {/* Subtítulo o tendencia */}
        <div className="mt-4 pt-2 border-t border-slate-100 dark:border-slate-700/50 flex items-center gap-1.5 text-xs text-slate-500 dark:text-slate-300">
          {trendText && (
            <span
              className={`inline-flex items-center font-medium ${
                trendPositive ? 'text-emerald-600 dark:text-emerald-400' : 'text-rose-600 dark:text-rose-400'
              }`}
            >
              {trendText}
            </span>
          )}
          {subtitle && <span className="text-slate-400 dark:text-slate-400">{subtitle}</span>}
        </div>
      </SpotlightCard>
    </motion.div>
  );
};
