import React, {
  createContext,
  use,
  useId,
  useEffect,
  useRef,
  type ReactNode,
  type ButtonHTMLAttributes,
  type HTMLAttributes,
} from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { X, Loader2, AlertTriangle, ShieldAlert, CheckCircle2, Info, KeyRound } from 'lucide-react';

// ============================================================================
// 1. CONTEXT INTERFACE (Vercel Composition Patterns: state, actions, meta)
// ============================================================================

export type ModalVariant = 'danger' | 'warning' | 'success' | 'info' | 'default';

export interface ModalState {
  open: boolean;
  loading: boolean;
  variant: ModalVariant;
}

export interface ModalActions {
  close: () => void;
  open: () => void;
  onConfirm?: () => void | Promise<void>;
}

export interface ModalMeta {
  titleId: string;
  descriptionId: string;
  contentRef: React.RefObject<HTMLDivElement | null>;
}

export interface ModalContextValue {
  state: ModalState;
  actions: ModalActions;
  meta: ModalMeta;
}

const ModalContext = createContext<ModalContextValue | null>(null);

export function useModalContext(): ModalContextValue {
  const context = use(ModalContext);
  if (!context) {
    throw new Error('Los subcomponentes de Modal deben usarse dentro de <Modal.Root>');
  }
  return context;
}

// ============================================================================
// 2. EMIL KOWALSKI MOTION TOKENS (Taste, Physics & Snappy Transitions)
// ============================================================================

export const MODAL_EASING = [0.16, 1, 0.3, 1] as const; // strong custom ease-out curve

export const overlayMotion = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.18, ease: MODAL_EASING },
};

export const contentMotion = {
  initial: { opacity: 0, scale: 0.95, y: 10 },
  animate: { opacity: 1, scale: 1, y: 0 },
  exit: { opacity: 0, scale: 0.96, y: 8 },
  transition: { duration: 0.22, ease: MODAL_EASING },
};

// ============================================================================
// 3. COMPOUND SUBCOMPONENTS
// ============================================================================

export interface ModalRootProps {
  open: boolean;
  onOpenChange?: (open: boolean) => void;
  onClose?: () => void;
  loading?: boolean;
  variant?: ModalVariant;
  children: ReactNode;
}

function ModalRoot({
  open,
  onOpenChange,
  onClose,
  loading = false,
  variant = 'default',
  children,
}: ModalRootProps) {
  const titleId = useId();
  const descriptionId = useId();
  const contentRef = useRef<HTMLDivElement | null>(null);

  const handleClose = () => {
    if (loading) return;
    if (onClose) onClose();
    if (onOpenChange) onOpenChange(false);
  };

  const handleOpen = () => {
    if (onOpenChange) onOpenChange(true);
  };

  // Cierre mediante teclado con tecla Escape y bloqueo de scroll
  useEffect(() => {
    if (!open) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && !loading) {
        handleClose();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    const originalOverflow = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    return () => {
      window.removeEventListener('keydown', handleKeyDown);
      document.body.style.overflow = originalOverflow;
    };
  }, [open, loading]);

  const value: ModalContextValue = {
    state: { open, loading, variant },
    actions: { close: handleClose, open: handleOpen },
    meta: { titleId, descriptionId, contentRef },
  };

  return (
    <ModalContext value={value}>
      <ModalPortal>{children}</ModalPortal>
    </ModalContext>
  );
}

function ModalPortal({ children }: { children: ReactNode }) {
  const { state } = useModalContext();

  if (typeof document === 'undefined') return null;

  return createPortal(
    <AnimatePresence mode="wait">
      {state.open && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6"
          role="dialog"
          aria-modal="true"
        >
          {children}
        </div>
      )}
    </AnimatePresence>,
    document.body
  );
}

export interface ModalOverlayProps extends HTMLAttributes<HTMLDivElement> {
  className?: string;
}

function ModalOverlay({ className = '', ...props }: ModalOverlayProps) {
  const { actions, state } = useModalContext();

  return (
    <motion.div
      {...overlayMotion}
      className={`fixed inset-0 bg-slate-950/75 backdrop-blur-md cursor-pointer ${className}`}
      onClick={() => {
        if (!state.loading) actions.close();
      }}
      aria-hidden="true"
      {...(props as any)}
    />
  );
}

export interface ModalContentProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
  maxWidth?: string;
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | '4xl' | '5xl' | 'full';
  ref?: React.Ref<HTMLDivElement>;
}

function ModalContent({ children, className = '', maxWidth, size, ref, ...props }: ModalContentProps) {
  const { state, meta } = useModalContext();

  const sizeClasses: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    full: 'max-w-full',
  };

  const resolvedMaxWidth = maxWidth || (size ? sizeClasses[size] : 'max-w-md');

  // Halo ambiental sutil según el tono de la acción
  const glowMap: Record<ModalVariant, string> = {
    danger: 'bg-rose-500/10',
    warning: 'bg-amber-500/10',
    success: 'bg-emerald-500/10',
    info: 'bg-sky-500/10',
    default: 'bg-blue-500/05',
  };

  return (
    <motion.div
      {...contentMotion}
      ref={ref || meta.contentRef}
      style={{ transformOrigin: 'center' }}
      className={`relative w-full ${resolvedMaxWidth} rounded-[24px] bg-white dark:bg-[#121215] border border-slate-200/90 dark:border-white/[0.08] p-5 sm:p-6 shadow-[0_25px_60px_-15px_rgba(0,0,0,0.55)] backdrop-blur-xl overflow-hidden z-10 text-slate-800 dark:text-zinc-100 ${className}`}
      onClick={(e) => e.stopPropagation()}
      aria-labelledby={meta.titleId}
      aria-describedby={meta.descriptionId}
      {...(props as any)}
    >
      {/* Halo de iluminación ambiental decorativa ultra-sutil */}
      <div
        className={`absolute -top-16 left-1/2 -translate-x-1/2 w-48 h-32 rounded-full ${glowMap[state.variant]} blur-3xl pointer-events-none`}
        aria-hidden="true"
      />
      {children}
    </motion.div>
  );
}

export interface ModalHeaderProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

function ModalHeader({ children, className = '', ...props }: ModalHeaderProps) {
  return (
    <div className={`flex flex-col items-center text-center mb-4 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ModalIconProps {
  variant?: ModalVariant;
  className?: string;
  icon?: React.ComponentType<{ className?: string }>;
}

function ModalIcon({ variant, className = '', icon: CustomIcon }: ModalIconProps) {
  const { state } = useModalContext();
  const effectiveVariant = variant || state.variant;

  const styleMap = {
    danger: {
      bg: 'bg-rose-50 dark:bg-rose-500/10 border-rose-200 dark:border-rose-500/25 text-rose-600 dark:text-rose-400 shadow-rose-500/10',
      icon: ShieldAlert,
    },
    warning: {
      bg: 'bg-amber-50 dark:bg-amber-500/10 border-amber-200 dark:border-amber-500/25 text-amber-600 dark:text-amber-400 shadow-amber-500/10',
      icon: AlertTriangle,
    },
    success: {
      bg: 'bg-emerald-50 dark:bg-emerald-500/10 border-emerald-200 dark:border-emerald-500/25 text-emerald-600 dark:text-emerald-400 shadow-emerald-500/10',
      icon: CheckCircle2,
    },
    info: {
      bg: 'bg-sky-50 dark:bg-sky-500/10 border-sky-200 dark:border-sky-500/25 text-sky-600 dark:text-sky-400 shadow-sky-500/10',
      icon: Info,
    },
    default: {
      bg: 'bg-blue-50 dark:bg-blue-500/10 border-blue-200 dark:border-blue-500/25 text-blue-600 dark:text-blue-400 shadow-blue-500/10',
      icon: KeyRound,
    },
  }[effectiveVariant];

  const IconComponent = CustomIcon || styleMap.icon;

  return (
    <div className="relative inline-flex items-center justify-center mb-3">
      <div
        className={`w-14 h-14 rounded-2xl flex items-center justify-center border shadow-lg transition-transform ${styleMap.bg} ${className}`}
      >
        <IconComponent className="w-6 h-6" />
      </div>
    </div>
  );
}

export interface ModalTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  children: ReactNode;
  className?: string;
}

function ModalTitle({ children, className = '', ...props }: ModalTitleProps) {
  const { meta } = useModalContext();
  return (
    <h3
      id={meta.titleId}
      className={`text-lg sm:text-xl font-bold tracking-tight text-slate-900 dark:text-white ${className}`}
      {...props}
    >
      {children}
    </h3>
  );
}

export interface ModalDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  children: ReactNode;
  className?: string;
}

function ModalDescription({ children, className = '', ...props }: ModalDescriptionProps) {
  const { meta } = useModalContext();
  return (
    <p
      id={meta.descriptionId}
      className={`text-xs sm:text-sm text-slate-600 dark:text-slate-400 leading-relaxed mt-1.5 ${className}`}
      {...props}
    >
      {children}
    </p>
  );
}

export interface ModalBodyProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

function ModalBody({ children, className = '', ...props }: ModalBodyProps) {
  return (
    <div className={`mb-5 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ModalUserPreviewProps {
  name: string;
  email?: string;
  badge?: string;
  className?: string;
}

function ModalUserPreview({ name, email, badge, className = '' }: ModalUserPreviewProps) {
  const initials = name
    .trim()
    .split(' ')
    .filter(Boolean)
    .slice(0, 2)
    .map((p) => p[0])
    .join('')
    .toUpperCase() || 'US';

  return (
    <div
      className={`p-3 rounded-2xl bg-slate-50 dark:bg-[#070c17] border border-slate-200/90 dark:border-slate-800/80 flex items-center gap-3 text-left ${className}`}
    >
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-blue-600 to-indigo-600 border border-blue-400/40 text-white font-bold text-xs flex items-center justify-center shrink-0 shadow-sm">
        {initials}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-bold text-slate-900 dark:text-slate-100 truncate">
            {name}
          </span>
          {badge && (
            <span className="px-1.5 py-0.5 rounded-md text-[9px] font-bold uppercase tracking-wider bg-slate-200/60 dark:bg-slate-800 text-slate-600 dark:text-slate-300">
              {badge}
            </span>
          )}
        </div>
        {email && (
          <span className="text-[11px] font-mono text-slate-500 dark:text-slate-400 block truncate mt-0.5">
            {email}
          </span>
        )}
      </div>
    </div>
  );
}

export interface ModalFooterProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  className?: string;
}

function ModalFooter({ children, className = '', ...props }: ModalFooterProps) {
  return (
    <div className={`flex items-center gap-3 mt-1 ${className}`} {...props}>
      {children}
    </div>
  );
}

export interface ModalCloseButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  className?: string;
}

function ModalCloseButton({ className = '', ...props }: ModalCloseButtonProps) {
  const { actions, state } = useModalContext();

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      type="button"
      onClick={actions.close}
      disabled={state.loading}
      aria-label="Cerrar modal"
      className={`absolute top-4 right-4 p-2 rounded-xl text-slate-400 hover:text-slate-700 dark:hover:text-white hover:bg-slate-100 dark:hover:bg-slate-800/60 transition-colors cursor-pointer disabled:pointer-events-none ${className}`}
      {...(props as any)}
    >
      <X className="w-4 h-4" />
    </motion.button>
  );
}

export interface ModalCloseProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children?: ReactNode;
  className?: string;
}

function ModalClose({ children = 'Cancelar', className = '', ...props }: ModalCloseProps) {
  const { actions, state } = useModalContext();

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      onClick={actions.close}
      disabled={state.loading}
      className={`flex-1 py-3 px-4 rounded-xl border border-slate-200/90 dark:border-slate-800 bg-slate-100/80 dark:bg-slate-800/60 hover:bg-slate-200 dark:hover:bg-slate-800 text-slate-700 dark:text-slate-300 text-xs font-bold transition-colors cursor-pointer disabled:opacity-50 ${className}`}
      {...(props as any)}
    >
      {children}
    </motion.button>
  );
}

export interface ModalActionProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  children: ReactNode;
  className?: string;
  variant?: ModalVariant;
  loading?: boolean;
}

function ModalAction({
  children,
  className = '',
  variant,
  loading: localLoading,
  disabled,
  ...props
}: ModalActionProps) {
  const { state } = useModalContext();
  const effectiveVariant = variant || state.variant;
  const isLoading = localLoading !== undefined ? localLoading : state.loading;

  const styleMap: Record<ModalVariant, string> = {
    danger: 'bg-rose-600 hover:bg-rose-500 shadow-rose-600/30 text-white',
    warning: 'bg-amber-500 hover:bg-amber-400 shadow-amber-500/30 text-white',
    success: 'bg-emerald-600 hover:bg-emerald-500 shadow-emerald-600/30 text-white',
    info: 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/30 text-white',
    default: 'bg-blue-600 hover:bg-blue-500 shadow-blue-600/30 text-white',
  };

  return (
    <motion.button
      whileTap={{ scale: 0.97 }}
      type="button"
      disabled={disabled || isLoading}
      className={`flex-1 py-3 px-4 rounded-xl text-xs font-bold transition-all shadow-lg flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50 ${styleMap[effectiveVariant]} ${className}`}
      {...(props as any)}
    >
      {isLoading && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
      <span>{children}</span>
    </motion.button>
  );
}

// ============================================================================
// 4. MODAL COMPOUND EXPORT
// ============================================================================

export const Modal = {
  Root: ModalRoot,
  Portal: ModalPortal,
  Overlay: ModalOverlay,
  Content: ModalContent,
  Header: ModalHeader,
  Icon: ModalIcon,
  Title: ModalTitle,
  Description: ModalDescription,
  Body: ModalBody,
  UserPreview: ModalUserPreview,
  Footer: ModalFooter,
  CloseButton: ModalCloseButton,
  Close: ModalClose,
  Cancel: ModalClose,
  Action: ModalAction,
};
