import React, { type ReactNode } from 'react';
import { Modal, type ModalVariant } from './Modal';

// ============================================================================
// 1. PROPS & INTERFACES (Full backwards compatibility + Composable Children)
// ============================================================================

export interface ConfirmActionModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm?: () => void | Promise<void>;
  loading?: boolean;
  title?: string;
  description?: string;
  userName?: string;
  userEmail?: string;
  confirmText?: string;
  cancelText?: string;
  isDestructive?: boolean;
  variant?: 'danger' | 'success' | 'info';
  children?: ReactNode;
}

// ============================================================================
// 2. EXPLICIT VARIANT IMPLEMENTATION (Vercel Composition Patterns)
// ============================================================================

/**
 * ConfirmActionModal refactorizado siguiendo:
 * - @vercel-composition-patterns: Arquitectura de componentes compuestos,
 *   desacoplamiento de estado y soporte explícito para variantes y children.
 * - @emilkowalski: Animaciones físicas suaves con Framer Motion, nunca desde scale(0)
 *   (inicia en scale(0.95)), curva custom [0.16, 1, 0.3, 1], transform-origin al centro
 *   y respuesta táctil instantánea con active/whileTap scale(0.97).
 */
export const ConfirmActionModalComponent: React.FC<ConfirmActionModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  loading = false,
  title = '¿Confirmar acción?',
  description = 'Esta operación modificará los permisos del usuario en la plataforma.',
  userName,
  userEmail,
  confirmText = 'Confirmar',
  cancelText = 'Cancelar',
  isDestructive = true,
  variant,
  children,
}) => {
  const effectiveVariant: ModalVariant = variant || (isDestructive ? 'danger' : 'success');

  return (
    <Modal.Root
      open={isOpen}
      onClose={onClose}
      loading={loading}
      variant={effectiveVariant}
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.CloseButton />

        {children ? (
          // Si el consumidor provee hijos directos, se prioriza la composición libre
          children
        ) : (
          // De lo contrario, se renderiza la variante explícita de confirmación prearmada
          <>
            <Modal.Header>
              <Modal.Icon variant={effectiveVariant} />
              <Modal.Title>{title}</Modal.Title>
              {description && <Modal.Description>{description}</Modal.Description>}
            </Modal.Header>

            {userName && (
              <Modal.Body>
                <Modal.UserPreview name={userName} email={userEmail} />
              </Modal.Body>
            )}

            <Modal.Footer>
              <Modal.Close>{cancelText}</Modal.Close>
              <Modal.Action
                variant={effectiveVariant}
                loading={loading}
                onClick={onConfirm}
              >
                {confirmText}
              </Modal.Action>
            </Modal.Footer>
          </>
        )}
      </Modal.Content>
    </Modal.Root>
  );
};

// ============================================================================
// 3. COMPOUND ATTACHMENTS (Permite tanto <ConfirmActionModal.Root> como <ConfirmActionModal />)
// ============================================================================

export const ConfirmActionModal = Object.assign(ConfirmActionModalComponent, {
  Root: Modal.Root,
  Portal: Modal.Portal,
  Overlay: Modal.Overlay,
  Content: Modal.Content,
  Header: Modal.Header,
  Icon: Modal.Icon,
  Title: Modal.Title,
  Description: Modal.Description,
  Body: Modal.Body,
  UserPreview: Modal.UserPreview,
  Footer: Modal.Footer,
  CloseButton: Modal.CloseButton,
  Close: Modal.Close,
  Action: Modal.Action,
});

export { Modal, type ModalVariant } from './Modal';
