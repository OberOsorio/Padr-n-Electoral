import { useCallback } from 'react';
import { useElectorSearch } from '../electors/useElectorSearch';

export interface FastElectorSearchResult {
  found: boolean;
  isDuplicate?: boolean;
  duplicateInfo?: {
    registradorNombre: string;
    nombres: string;
    apellidos: string;
    puesto_votacion?: string;
  };
  data?: {
    nombres: string;
    apellidos: string;
    edad?: number | null;
    puesto_votacion?: string | null;
    mesa?: string | null;
    municipio?: string | null;
    departamento?: string | null;
  };
}

export function useFastElectorSearch() {
  const { buscarDocumento, loading } = useElectorSearch();

  const consultarElectorRapido = useCallback(
    async (cedula: string, tenantId?: string | null): Promise<FastElectorSearchResult | null> => {
      const docLimpio = String(cedula || '').replace(/\D/g, '').trim();
      if (docLimpio.length < 5) return null;

      const res = await buscarDocumento(docLimpio, tenantId);

      if (!res) {
        return { found: false, isDuplicate: false };
      }

      if (res.duplicado) {
        return {
          found: true,
          isDuplicate: true,
          duplicateInfo: {
            registradorNombre: 'otro líder de la campaña',
            nombres: res.nombres,
            apellidos: res.apellidos,
            puesto_votacion: res.puesto_votacion || 'Principal',
          },
        };
      }

      const edadNum = res.edad ? Number(res.edad) : null;

      return {
        found: true,
        isDuplicate: false,
        data: {
          nombres: res.nombres,
          apellidos: res.apellidos,
          edad: edadNum,
          puesto_votacion: res.puesto_votacion || null,
          mesa: res.mesa || null,
          municipio: res.municipio || null,
          departamento: res.departamento || null,
        },
      };
    },
    [buscarDocumento]
  );

  return { consultarElectorRapido, loading };
}
