import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase, isSupabaseConfigured } from '../../lib/supabase';
import type { ElectorWithRegistrant } from '../../types';
import { PREDEFINED_POLLING_PLACES } from '../electors/constants';
import {
  type ReportFilters,
  generateReportFileName,
  formatElectorsForExport,
  buildFiltersSummary,
  exportToExcel,
  exportToCSV,
} from './reportGenerator';

interface UseReportDataOptions {
  onExportSuccess?: (info: {
    format: 'xlsx' | 'csv';
    count: number;
    filtersSummary: string;
  }) => void;
}

export const useReportData = (options?: UseReportDataOptions) => {
  const [filters, setFilters] = useState<ReportFilters>({
    puesto: 'all',
    mesa: 'all',
    startDate: '',
    endDate: '',
    coordinador: 'all',
    format: 'xlsx',
  });

  const [totalMatching, setTotalMatching] = useState<number>(0);
  const [previewRows, setPreviewRows] = useState<ElectorWithRegistrant[]>([]);
  const [coordinatorsList, setCoordinatorsList] = useState<{ id: string; name: string }[]>([]);
  const [loadingPreview, setLoadingPreview] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [downloadSuccessMessage, setDownloadSuccessMessage] = useState<string | null>(null);

  const isMountedRef = useRef(true);

  // 1. Cargar coordinadores disponibles para el filtro
  useEffect(() => {
    const fetchCoordinators = async () => {
      if (!isSupabaseConfigured) {
        setCoordinatorsList([
          { id: 'cdor-1', name: 'Cdor. Javier Rivas' },
          { id: 'cdor-2', name: 'Cdra. Patricia Gómez' },
          { id: 'cdor-3', name: 'Cdor. Manuel Rojas' },
        ]);
        return;
      }

      try {
        const { data } = await supabase
          .from('profiles')
          .select('id, full_name')
          .eq('is_active', true);

        if (data) {
          setCoordinatorsList(
            (data as any[]).map((p) => ({
              id: p.id,
              name: p.full_name || 'Personal Autorizado',
            }))
          );
        }
      } catch (err) {
        console.error('Error al cargar coordinadores para reporte:', err);
      }
    };

    fetchCoordinators();
  }, []);

  // 2. Consultar conteo y vista previa según los filtros seleccionados
  const fetchReportPreview = useCallback(async () => {
    setLoadingPreview(true);

    if (!isSupabaseConfigured) {
      const stored = localStorage.getItem('electoral_local_electors');
      const list: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];

      let filtered = [...list];

      if (filters.puesto !== 'all') {
        filtered = filtered.filter((e) => e.puesto_votacion === filters.puesto);
      }
      if (filters.mesa !== 'all') {
        filtered = filtered.filter((e) => e.mesa === Number(filters.mesa));
      }
      if (filters.coordinador !== 'all') {
        filtered = filtered.filter((e) => e.registrado_por === filters.coordinador);
      }
      if (filters.startDate) {
        filtered = filtered.filter(
          (e) => new Date(e.created_at) >= new Date(`${filters.startDate}T00:00:00`)
        );
      }
      if (filters.endDate) {
        filtered = filtered.filter(
          (e) => new Date(e.created_at) <= new Date(`${filters.endDate}T23:59:59`)
        );
      }

      if (isMountedRef.current) {
        setTotalMatching(filtered.length);
        setPreviewRows(filtered.slice(0, 5));
        setLoadingPreview(false);
      }
      return;
    }

    try {
      let query = (supabase.from('electores') as any).select(
        `
        id,
        cedula,
        nombres,
        apellidos,
        telefono,
        puesto_votacion,
        mesa,
        notas,
        registrado_por,
        created_at,
        registrador:profiles(full_name, role)
      `,
        { count: 'exact' }
      );

      if (filters.puesto !== 'all') {
        query = query.eq('puesto_votacion', filters.puesto);
      }
      if (filters.mesa !== 'all') {
        query = query.eq('mesa', Number(filters.mesa));
      }
      if (filters.coordinador !== 'all') {
        query = query.eq('registrado_por', filters.coordinador);
      }
      if (filters.startDate) {
        query = query.gte('created_at', `${filters.startDate}T00:00:00Z`);
      }
      if (filters.endDate) {
        query = query.lte('created_at', `${filters.endDate}T23:59:59Z`);
      }

      query = query.order('created_at', { ascending: false }).limit(5);

      const { data, count, error } = await query;
      if (error) throw error;

      if (isMountedRef.current) {
        setTotalMatching(count ?? 0);
        setPreviewRows(
          (data || []).map((item: any) => ({
            id: item.id,
            cedula: item.cedula,
            nombres: item.nombres,
            apellidos: item.apellidos,
            telefono: item.telefono,
            puesto_votacion: item.puesto_votacion,
            mesa: item.mesa,
            notas: item.notas,
            registrado_por: item.registrado_por,
            created_at: item.created_at,
            registrador: item.registrador
              ? { full_name: item.registrador.full_name, role: item.registrador.role }
              : null,
          }))
        );
      }
    } catch (err) {
      console.error('Error al generar vista previa de reporte:', err);
    } finally {
      if (isMountedRef.current) {
        setLoadingPreview(false);
      }
    }
  }, [filters]);

  useEffect(() => {
    isMountedRef.current = true;
    fetchReportPreview();

    return () => {
      isMountedRef.current = false;
    };
  }, [fetchReportPreview]);

  // 3. Generación y descarga completa de los datos
  const generateAndDownload = async () => {
    setGenerating(true);
    setDownloadSuccessMessage(null);

    try {
      let fullData: ElectorWithRegistrant[] = [];

      if (!isSupabaseConfigured) {
        const stored = localStorage.getItem('electoral_local_electors');
        let filtered: ElectorWithRegistrant[] = stored ? JSON.parse(stored) : [];

        if (filters.puesto !== 'all') {
          filtered = filtered.filter((e) => e.puesto_votacion === filters.puesto);
        }
        if (filters.mesa !== 'all') {
          filtered = filtered.filter((e) => e.mesa === Number(filters.mesa));
        }
        if (filters.coordinador !== 'all') {
          filtered = filtered.filter((e) => e.registrado_por === filters.coordinador);
        }
        if (filters.startDate) {
          filtered = filtered.filter(
            (e) => new Date(e.created_at) >= new Date(`${filters.startDate}T00:00:00`)
          );
        }
        if (filters.endDate) {
          filtered = filtered.filter(
            (e) => new Date(e.created_at) <= new Date(`${filters.endDate}T23:59:59`)
          );
        }
        fullData = filtered;
      } else {
        let query = (supabase.from('electores') as any).select(`
          id,
          cedula,
          nombres,
          apellidos,
          telefono,
          puesto_votacion,
          mesa,
          notas,
          registrado_por,
          created_at,
          registrador:profiles(full_name, role)
        `);

        if (filters.puesto !== 'all') {
          query = query.eq('puesto_votacion', filters.puesto);
        }
        if (filters.mesa !== 'all') {
          query = query.eq('mesa', Number(filters.mesa));
        }
        if (filters.coordinador !== 'all') {
          query = query.eq('registrado_por', filters.coordinador);
        }
        if (filters.startDate) {
          query = query.gte('created_at', `${filters.startDate}T00:00:00Z`);
        }
        if (filters.endDate) {
          query = query.lte('created_at', `${filters.endDate}T23:59:59Z`);
        }

        query = query.order('puesto_votacion', { ascending: true }).order('mesa', { ascending: true });

        const { data, error } = await query;
        if (error) throw error;

        fullData = (data || []).map((item: any) => ({
          id: item.id,
          cedula: item.cedula,
          nombres: item.nombres,
          apellidos: item.apellidos,
          telefono: item.telefono,
          puesto_votacion: item.puesto_votacion,
          mesa: item.mesa,
          notas: item.notas,
          registrado_por: item.registrado_por,
          created_at: item.created_at,
          registrador: item.registrador
            ? { full_name: item.registrador.full_name, role: item.registrador.role }
            : null,
        }));
      }

      if (fullData.length === 0) {
        alert('No existen registros que coincidan con los filtros seleccionados.');
        return;
      }

      const rows = formatElectorsForExport(fullData);
      const fileName = generateReportFileName(filters.puesto, filters.mesa, filters.format);

      if (filters.format === 'xlsx') {
        exportToExcel(rows, fileName);
      } else {
        exportToCSV(rows, fileName);
      }

      // Notificar éxito y registrar en auditoría
      const coordinatorObj = coordinatorsList.find((c) => c.id === filters.coordinador);
      const filtersSummary = buildFiltersSummary(filters, coordinatorObj?.name);

      if (options?.onExportSuccess) {
        options.onExportSuccess({
          format: filters.format,
          count: fullData.length,
          filtersSummary,
        });
      }

      setDownloadSuccessMessage(
        `Reporte descargado: ${fileName} (${fullData.length} registros).`
      );
      setTimeout(() => setDownloadSuccessMessage(null), 4500);
    } catch (err) {
      console.error('Error al generar archivo:', err);
      alert('Ocurrió un error al preparar la exportación.');
    } finally {
      setGenerating(false);
    }
  };

  return {
    filters,
    setFilters,
    totalMatching,
    previewRows,
    coordinatorsList,
    pollingPlacesList: PREDEFINED_POLLING_PLACES,
    loadingPreview,
    generating,
    downloadSuccessMessage,
    generateAndDownload,
  };
};
