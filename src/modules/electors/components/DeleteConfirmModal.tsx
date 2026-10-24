import { useState } from 'react';
import type { ElectorWithRegistrant } from '../../../types';
import { AlertTriangle, Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

interface DeleteConfirmModalProps {
  elector: ElectorWithRegistrant | null;
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (id: string) => Promise<boolean>;
}

export const DeleteConfirmModal = ({
  elector,
  isOpen,
  onClose,
  onConfirm,
}: DeleteConfirmModalProps) => {
  const [deleting, setDeleting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!elector) return null;

  const handleDelete = async () => {
    setDeleting(true);
    setError(null);
    try {
      const success = await onConfirm(elector.id);
      if (success) {
        onClose();
      }
    } catch (err: unknown) {
      setError(
        err instanceof Error
          ? err.message
          : 'No se pudo eliminar el registro. Verifique sus permisos de administrador.'
      );
    } finally {
      setDeleting(false);
    }
  };

  return (
    <Modal.Root
      open={isOpen}
      onClose={onClose}
      loading={deleting}
      variant="danger"
    >
      <Modal.Overlay />
      <Modal.Content>
        <Modal.CloseButton />

        <Modal.Header>
          <Modal.Icon variant="danger" icon={AlertTriangle} />
          <Modal.Title>¿Eliminar Elector del Padrón?</Modal.Title>
          <Modal.Description>
            Esta acción es destructiva e irreversible. El registro será desvinculado del censo electoral y los indicadores en tiempo real se recalcularán automáticamente.
          </Modal.Description>
        </Modal.Header>

        <Modal.Body>
          {/* Resumen del elector */}
          <div className="p-3.5 rounded-2xl bg-slate-50 dark:bg-[#070c17] border border-slate-200/90 dark:border-slate-800/80 space-y-1 text-xs font-mono">
            <p className="text-slate-900 dark:text-[#F8FAFC] font-bold">
              {elector.nombres} {elector.apellidos}
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Cédula: <span className="text-slate-800 dark:text-slate-200 font-semibold">{elector.cedula}</span>
            </p>
            <p className="text-slate-500 dark:text-slate-400 text-[11px]">
              Puesto: <span className="text-slate-800 dark:text-slate-200 font-semibold">{elector.puesto_votacion}</span> (Mesa {elector.mesa})
            </p>
          </div>

          {error && (
            <div className="mt-3 p-2.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-800/50 text-[11px] text-rose-700 dark:text-rose-300">
              {error}
            </div>
          )}
        </Modal.Body>

        <Modal.Footer>
          <Modal.Close>Cancelar</Modal.Close>
          <Modal.Action
            variant="danger"
            loading={deleting}
            onClick={handleDelete}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Eliminar Definitivamente</span>
          </Modal.Action>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
