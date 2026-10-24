import React from 'react';
import type { ElectorWithRegistrant } from '../../../types';
import { AlertTriangle, Trash2, Users } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';

interface BulkDeleteConfirmModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  count: number;
  sampleElectors: ElectorWithRegistrant[];
  deleting: boolean;
}

export const BulkDeleteConfirmModal: React.FC<BulkDeleteConfirmModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  count,
  sampleElectors,
  deleting,
}) => {
  if (count === 0) return null;

  return (
    <Modal.Root open={isOpen} onClose={onClose} variant="danger" loading={deleting}>
      <Modal.Content maxWidth="max-w-md">
        <Modal.Header>
          <Modal.Icon icon={AlertTriangle} variant="danger" />
          <Modal.Title className="text-base sm:text-lg font-bold">
            ¿Eliminar {count} {count === 1 ? 'elector' : 'electores'} del censo?
          </Modal.Title>
          <Modal.Description className="mt-1.5 text-xs text-slate-500 dark:text-zinc-400">
            Esta acción eliminará de forma <strong className="text-rose-600 dark:text-rose-400 font-semibold">permanente</strong> los registros seleccionados de la base de datos. Los conteos de la campaña y puestos se recalcularán automáticamente.
          </Modal.Description>
        </Modal.Header>

        {/* Muestra de electores a eliminar */}
        <Modal.Body className="my-2 p-3 rounded-xl bg-slate-50 dark:bg-[#18181b] border border-slate-200/80 dark:border-white/[0.06] space-y-1.5 max-h-36 overflow-y-auto scrollbar-thin">
          <div className="flex items-center gap-1.5 text-[10px] font-mono uppercase tracking-wider text-slate-500 dark:text-zinc-400 pb-1 border-b border-slate-200/60 dark:border-white/[0.06]">
            <Users className="w-3.5 h-3.5 text-rose-500" />
            <span>Muestra a eliminar ({sampleElectors.length} de {count}):</span>
          </div>
          {sampleElectors.slice(0, 5).map((e) => (
            <div key={e.id} className="flex items-center justify-between text-xs py-0.5 font-mono">
              <span className="text-slate-800 dark:text-zinc-200 truncate font-medium">
                {e.nombres} {e.apellidos}
              </span>
              <span className="text-slate-400 dark:text-zinc-500 shrink-0 ml-2 tabular-nums">
                CC: {e.cedula}
              </span>
            </div>
          ))}
          {count > 5 && (
            <p className="text-[10px] text-slate-400 dark:text-zinc-500 italic pt-1 text-center">
              ... y {count - 5} electores más en el lote seleccionado.
            </p>
          )}
        </Modal.Body>

        <Modal.Footer className="mt-4 pt-3 border-t border-slate-100 dark:border-white/[0.06]">
          <Modal.Cancel disabled={deleting}>
            Cancelar
          </Modal.Cancel>
          <Modal.Action
            variant="danger"
            onClick={onConfirm}
            loading={deleting}
            disabled={deleting}
          >
            <Trash2 className="w-3.5 h-3.5 mr-1" />
            <span>Eliminar {count} {count === 1 ? 'Elector' : 'Electores'}</span>
          </Modal.Action>
        </Modal.Footer>
      </Modal.Content>
    </Modal.Root>
  );
};
