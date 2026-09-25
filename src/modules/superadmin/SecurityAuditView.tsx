import React, { useState, useMemo } from 'react';
import {
  ShieldAlert,
  Search,
  Download,
  CheckCircle2,
  Building2,
  Globe,
  Monitor,
  KeyRound,
  Power,
  ShieldCheck,
  ChevronLeft,
  ChevronRight,
  Filter,
  RefreshCw,
  Lock
} from 'lucide-react';
import { motion } from 'framer-motion';
import { useAccessAuditLogs } from './useAccessAuditLogs';
import type { AccessAuditLog, AppRole } from '../../types';

type FilterSeverity = 'all' | 'valid' | 'blocked' | 'control';

export const SecurityAuditView: React.FC = () => {
  const { logs, loading, refetchLogs } = useAccessAuditLogs();
  const [searchTerm, setSearchTerm] = useState('');
  const [severityFilter, setSeverityFilter] = useState<FilterSeverity>('all');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 8;

  // Filtrado de logs de seguridad
  const filteredLogs = useMemo(() => {
    return logs.filter((log) => {
      // 1. Búsqueda universal por IP, correo o campaña
      const term = searchTerm.toLowerCase();
      const matchesSearch =
        !term ||
        log.user_name.toLowerCase().includes(term) ||
        log.user_email.toLowerCase().includes(term) ||
        (log.tenant_name && log.tenant_name.toLowerCase().includes(term)) ||
        log.ip_address.toLowerCase().includes(term) ||
        log.description.toLowerCase().includes(term);

      // 2. Filtro de Severidad / Tipo de Evento
      let matchesSeverity = true;
      if (severityFilter === 'valid') {
        matchesSeverity = log.event_type === 'login_success';
      } else if (severityFilter === 'blocked') {
        matchesSeverity = log.event_type === 'login_failed';
      } else if (severityFilter === 'control') {
        matchesSeverity = [
          'campaign_suspended',
          'campaign_activated',
          'password_change',
          'data_export',
          'tenant_created',
        ].includes(log.event_type);
      }

      return matchesSearch && matchesSeverity;
    });
  }, [logs, searchTerm, severityFilter]);

  // Paginación
  const totalPages = Math.max(1, Math.ceil(filteredLogs.length / itemsPerPage));
  const currentSafePage = Math.min(currentPage, totalPages);
  const paginatedLogs = useMemo(() => {
    const startIndex = (currentSafePage - 1) * itemsPerPage;
    return filteredLogs.slice(startIndex, startIndex + itemsPerPage);
  }, [filteredLogs, currentSafePage, itemsPerPage]);

  // Métricas agregadas
  const stats = useMemo(() => {
    const total = logs.length;
    const validLogins = logs.filter((l) => l.event_type === 'login_success').length;
    const blockedAttempts = logs.filter((l) => l.event_type === 'login_failed').length;
    const controlActions = logs.filter((l) =>
      ['campaign_suspended', 'campaign_activated', 'password_change', 'data_export'].includes(
        l.event_type
      )
    ).length;

    return { total, validLogins, blockedAttempts, controlActions };
  }, [logs]);

  // Exportar Log Inmutable (.CSV)
  const handleExportCSV = () => {
    const headers = [
      'ID Evento',
      'Fecha UTC',
      'Hora Local',
      'Nombre Usuario',
      'Email Institucional',
      'Rol',
      'Campaña / Contexto',
      'Tipo de Evento',
      'Dirección IP',
      'Dispositivo / Agente',
      'Descripción Operativa',
    ];

    const rows = filteredLogs.map((log) => {
      const dateObj = new Date(log.created_at);
      const fecha = dateObj.toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
      });
      const hora = dateObj.toLocaleTimeString('es-ES', {
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit',
      });

      return [
        `"${log.id}"`,
        `"${log.created_at}"`,
        `"${fecha} ${hora}"`,
        `"${log.user_name.replace(/"/g, '""')}"`,
        `"${log.user_email}"`,
        `"${log.user_role.toUpperCase()}"`,
        `"${(log.tenant_name || 'Plataforma Global').replace(/"/g, '""')}"`,
        `"${log.event_type}"`,
        `"${log.ip_address}"`,
        `"${log.user_agent.replace(/"/g, '""')}"`,
        `"${log.description.replace(/"/g, '""')}"`,
      ].join(',');
    });

    const csvContent = '\uFEFF' + [headers.join(','), ...rows].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute(
      'download',
      `auditoria_seguridad_${new Date().toISOString().slice(0, 10)}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Helper de badges para tipo de evento
  const renderEventBadge = (type: AccessAuditLog['event_type']) => {
    switch (type) {
      case 'login_success':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <span className="relative flex h-1.5 w-1.5">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-1.5 w-1.5 bg-emerald-500" />
            </span>
            Acceso Exitoso
          </span>
        );
      case 'login_failed':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-red-500/10 text-red-600 dark:text-red-400 border border-red-500/20 whitespace-nowrap">
            <ShieldAlert className="w-3.5 h-3.5 text-red-500 shrink-0" />
            Acceso Denegado
          </span>
        );
      case 'campaign_suspended':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-amber-500/10 text-amber-600 dark:text-amber-400 border border-amber-500/20 whitespace-nowrap">
            <Power className="w-3.5 h-3.5 text-amber-500 shrink-0" />
            Campaña Suspendida
          </span>
        );
      case 'campaign_activated':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border border-emerald-500/20 whitespace-nowrap">
            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
            Campaña Activada
          </span>
        );
      case 'password_change':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-purple-500/10 text-purple-600 dark:text-purple-400 border border-purple-500/20 whitespace-nowrap">
            <KeyRound className="w-3.5 h-3.5 text-purple-500 shrink-0" />
            Cambio de Contraseña
          </span>
        );
      case 'data_export':
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-blue-500/10 text-blue-600 dark:text-blue-400 border border-blue-500/20 whitespace-nowrap">
            <Download className="w-3.5 h-3.5 text-blue-500 shrink-0" />
            Exportación Oficial
          </span>
        );
      default:
        return (
          <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-semibold bg-slate-500/10 text-slate-600 dark:text-slate-400 border border-slate-500/20 whitespace-nowrap">
            <Lock className="w-3.5 h-3.5 text-slate-500 shrink-0" />
            Acción de Control
          </span>
        );
    }
  };

  // Helper de badges para roles
  const renderRoleBadge = (role: AppRole) => {
    switch (role) {
      case 'superadmin':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-purple-100 text-purple-700 dark:bg-purple-950/70 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60">
            SUPERADMIN
          </span>
        );
      case 'admin':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-blue-100 text-blue-700 dark:bg-blue-950/70 dark:text-blue-300 border border-blue-200 dark:border-blue-800/60">
            ADMIN
          </span>
        );
      case 'coordinador':
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-700 dark:bg-slate-800 dark:text-slate-300 border border-slate-200 dark:border-slate-700">
            COORDINADOR
          </span>
        );
      default:
        return (
          <span className="px-1.5 py-0.5 rounded text-[10px] font-mono font-bold uppercase tracking-wider bg-slate-100 text-slate-600 dark:bg-slate-800 dark:text-slate-400 border border-slate-200 dark:border-slate-700">
            {role.toUpperCase()}
          </span>
        );
    }
  };

  return (
    <div className="space-y-6 sm:space-y-8">
      {/* Encabezado Institucional */}
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-slate-200 dark:border-slate-800/80">
        <div>
          <div className="flex items-center gap-2">
            <span className="p-1.5 rounded-lg bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-5 h-5" />
            </span>
            <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-slate-900 dark:text-white">
              Auditoría de Accesos y Seguridad
            </h1>
          </div>
          <p className="text-xs sm:text-sm text-slate-600 dark:text-slate-400 mt-1.5">
            Registro inmutable de trazabilidad, intentos de inicio de sesión, bloqueos y control de campañas.
          </p>
        </div>

        {/* Badge Institucional y Botón de Refresco */}
        <div className="flex items-center gap-3 self-start md:self-auto">
          <button
            type="button"
            onClick={refetchLogs}
            disabled={loading}
            className="p-2 rounded-xl bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 text-slate-600 dark:text-slate-300 hover:text-slate-900 dark:hover:text-white hover:bg-slate-50 dark:hover:bg-slate-800 transition-colors cursor-pointer shadow-2xs"
            title="Actualizar registro"
          >
            <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
          </button>
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-xl bg-purple-50 dark:bg-purple-950/40 border border-purple-200 dark:border-purple-500/30 text-purple-700 dark:text-purple-300 text-xs font-semibold shadow-2xs">
            <ShieldCheck className="w-4 h-4 text-purple-600 dark:text-purple-400" />
            <span>Logs Inmutables (SHA-256)</span>
          </div>
        </div>
      </div>

      {/* Grid Superior de 4 KPIs */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 sm:gap-4 lg:gap-5">
        {/* KPI 1: Total Registros */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Total Eventos Auditados
            </span>
            <div className="h-9 w-9 rounded-xl bg-purple-50 dark:bg-purple-950/60 border border-purple-200 dark:border-purple-800/50 flex items-center justify-center text-purple-600 dark:text-purple-400">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.total}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Registro secuencial inmutable
            </p>
          </div>
        </motion.div>

        {/* KPI 2: Accesos Válidos */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Inicios de Sesión Válidos
            </span>
            <div className="h-9 w-9 rounded-xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/50 flex items-center justify-center text-emerald-600 dark:text-emerald-400">
              <CheckCircle2 className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.validLogins}
            </span>
            <p className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium mt-1 truncate">
              Autenticación 100% verificada
            </p>
          </div>
        </motion.div>

        {/* KPI 3: Bloqueos y Alertas */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Intentos Bloqueados / Alertas
            </span>
            <div className="h-9 w-9 rounded-xl bg-red-50 dark:bg-red-950/60 border border-red-200 dark:border-red-800/50 flex items-center justify-center text-red-600 dark:text-red-400">
              <ShieldAlert className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-red-600 dark:text-red-400 font-mono">
              {stats.blockedAttempts}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Protección perimetral WAF & Auth
            </p>
          </div>
        </motion.div>

        {/* KPI 4: Acciones de Control */}
        <motion.div
          whileHover={{ y: -2 }}
          transition={{ duration: 0.15 }}
          className="rounded-2xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 p-5 shadow-xs relative overflow-hidden"
        >
          <div className="flex items-center justify-between">
            <span className="text-[11px] font-mono uppercase font-semibold text-slate-500 dark:text-slate-400">
              Acciones de Control y Gobierno
            </span>
            <div className="h-9 w-9 rounded-xl bg-blue-50 dark:bg-blue-950/60 border border-blue-200 dark:border-blue-800/50 flex items-center justify-center text-blue-600 dark:text-blue-400">
              <Power className="w-4.5 h-4.5" />
            </div>
          </div>
          <div className="mt-3">
            <span className="text-3xl font-extrabold text-slate-900 dark:text-white font-mono">
              {stats.controlActions}
            </span>
            <p className="text-[11px] text-slate-500 dark:text-slate-400 mt-1 truncate">
              Suspensiones, claves y exportaciones
            </p>
          </div>
        </motion.div>
      </div>

      {/* 1. Barra Superior de Control y Filtros Rápidos */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3.5">
        {/* Buscador Universal */}
        <div className="relative flex-1 max-w-md">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
          <input
            type="text"
            value={searchTerm}
            onChange={(e) => {
              setSearchTerm(e.target.value);
              setCurrentPage(1);
            }}
            placeholder="Buscar por IP, usuario, correo o campaña..."
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white dark:bg-slate-900/80 border border-slate-200 dark:border-slate-800 text-xs text-slate-900 dark:text-white placeholder-slate-400 focus:outline-none focus:ring-2 focus:ring-purple-500/40 focus:border-purple-500 transition-all shadow-2xs"
          />
        </div>

        {/* Pills Interactivas de Severidad & Botón de Exportación */}
        <div className="flex flex-wrap items-center gap-2">
          {/* Pills de Filtro */}
          <div className="inline-flex items-center p-1 rounded-xl bg-slate-100 dark:bg-slate-900/90 border border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={() => {
                setSeverityFilter('all');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all cursor-pointer ${
                severityFilter === 'all'
                  ? 'bg-white dark:bg-slate-800 text-slate-900 dark:text-white shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-slate-900 dark:hover:text-white'
              }`}
            >
              Todos los Eventos
            </button>

            <button
              type="button"
              onClick={() => {
                setSeverityFilter('valid');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                severityFilter === 'valid'
                  ? 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800/60 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-emerald-600 dark:hover:text-emerald-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-emerald-500" />
              Accesos Válidos
            </button>

            <button
              type="button"
              onClick={() => {
                setSeverityFilter('blocked');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                severityFilter === 'blocked'
                  ? 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800/60 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-red-600 dark:hover:text-red-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
              Bloqueos y Alertas
            </button>

            <button
              type="button"
              onClick={() => {
                setSeverityFilter('control');
                setCurrentPage(1);
              }}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 cursor-pointer ${
                severityFilter === 'control'
                  ? 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border border-purple-200 dark:border-purple-800/60 shadow-2xs'
                  : 'text-slate-600 dark:text-slate-400 hover:text-purple-600 dark:hover:text-purple-400'
              }`}
            >
              <span className="w-1.5 h-1.5 rounded-full bg-purple-500" />
              Acciones de Control
            </button>
          </div>

          {/* Botón de Exportación Inmutable */}
          <button
            type="button"
            onClick={handleExportCSV}
            className="px-3.5 py-2 rounded-xl bg-purple-600 hover:bg-purple-500 active:bg-purple-700 text-white font-semibold text-xs tracking-wide transition-all shadow-md shadow-purple-600/20 flex items-center gap-2 cursor-pointer shrink-0"
          >
            <Download className="w-4 h-4" />
            <span>Exportar Log Inmutable (.CSV)</span>
          </button>
        </div>
      </div>

      {/* 2 & 3. Tabla Corporativa y Paginación */}
      <div className="rounded-2xl border border-slate-200 dark:border-slate-800/80 bg-white dark:bg-slate-900/60 backdrop-blur-md overflow-hidden shadow-xs">
        <div className="overflow-x-auto">
          <table className="w-full min-w-[950px] text-left text-xs">
            <thead className="bg-slate-50 dark:bg-slate-950/70 text-[10px] font-mono uppercase text-slate-500 dark:text-slate-400 border-b border-slate-200 dark:border-slate-800">
              <tr>
                <th className="py-3 px-4 font-semibold">Marca Temporal</th>
                <th className="py-3 px-4 font-semibold">Usuario y Rol</th>
                <th className="py-3 px-4 font-semibold">Tipo de Evento</th>
                <th className="py-3 px-4 font-semibold">Campaña / Contexto</th>
                <th className="py-3 px-4 font-semibold">Origen & Dispositivo</th>
                <th className="py-3 px-4 font-semibold">Detalle Operativo</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 dark:divide-slate-800/60">
              {paginatedLogs.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-slate-400 dark:text-slate-500">
                    <Filter className="w-8 h-8 mx-auto mb-2 opacity-50" />
                    <p className="text-sm font-medium">No se encontraron eventos con los filtros seleccionados.</p>
                    <p className="text-xs mt-1">Prueba restableciendo el buscador o cambiando la severidad.</p>
                  </td>
                </tr>
              ) : (
                paginatedLogs.map((log) => {
                  const dateObj = new Date(log.created_at);
                  const fecha = dateObj.toLocaleDateString('es-ES', {
                    day: '2-digit',
                    month: 'short',
                    year: 'numeric',
                  });
                  const hora = dateObj.toLocaleTimeString('es-ES', {
                    hour: '2-digit',
                    minute: '2-digit',
                    second: '2-digit',
                  });

                  return (
                    <tr
                      key={log.id}
                      className="hover:bg-slate-50/80 dark:hover:bg-slate-800/30 transition-colors"
                    >
                      {/* 1. Marca Temporal */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <div className="text-xs font-mono font-semibold text-slate-900 dark:text-white">
                          {hora}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5">
                          {fecha}
                        </div>
                      </td>

                      {/* 2. Usuario y Rol */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold text-slate-900 dark:text-white tracking-tight">
                            {log.user_name}
                          </span>
                          {renderRoleBadge(log.user_role)}
                        </div>
                        <div className="text-[11px] text-slate-500 dark:text-slate-400 font-mono mt-0.5 truncate max-w-[200px]">
                          {log.user_email}
                        </div>
                      </td>

                      {/* 3. Tipo de Evento */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        {renderEventBadge(log.event_type)}
                      </td>

                      {/* 4. Campaña / Contexto */}
                      <td className="py-3.5 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-slate-700 dark:text-slate-300 font-medium">
                          {log.tenant_id ? (
                            <Building2 className="w-3.5 h-3.5 text-purple-600 dark:text-purple-400 shrink-0" />
                          ) : (
                            <Globe className="w-3.5 h-3.5 text-blue-600 dark:text-blue-400 shrink-0" />
                          )}
                          <span className="truncate max-w-[170px]">
                            {log.tenant_name || 'Plataforma Global'}
                          </span>
                        </div>
                      </td>

                      {/* 5. Origen & Dispositivo */}
                      <td className="py-3.5 px-4 whitespace-nowrap">
                        <span className="inline-block font-mono text-xs text-slate-800 dark:text-slate-200 bg-slate-100 dark:bg-slate-800/80 px-2 py-0.5 rounded border border-slate-200 dark:border-slate-700/60">
                          {log.ip_address}
                        </span>
                        <div className="flex items-center gap-1 text-[11px] text-slate-500 dark:text-slate-400 mt-1">
                          <Monitor className="w-3 h-3 text-slate-400 shrink-0" />
                          <span className="truncate max-w-[160px]">{log.user_agent}</span>
                        </div>
                      </td>

                      {/* 6. Detalle Operativo */}
                      <td className="py-3.5 px-4">
                        <p className="text-xs text-slate-600 dark:text-slate-300 leading-relaxed max-w-xs line-clamp-2">
                          {log.description}
                        </p>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

        {/* Footer de Paginación Integrada */}
        <div className="p-4 bg-slate-50/70 dark:bg-slate-950/60 border-t border-slate-200 dark:border-slate-800 flex flex-col sm:flex-row sm:items-center justify-between gap-3 text-xs">
          <div className="text-slate-600 dark:text-slate-400">
            Mostrando{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              {filteredLogs.length > 0 ? (currentSafePage - 1) * itemsPerPage + 1 : 0}
            </strong>{' '}
            -{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              {Math.min(currentSafePage * itemsPerPage, filteredLogs.length)}
            </strong>{' '}
            de{' '}
            <strong className="text-slate-900 dark:text-white font-mono">
              {filteredLogs.length}
            </strong>{' '}
            registros de seguridad
          </div>

          <div className="flex items-center gap-1.5 self-center sm:self-auto">
            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
              disabled={currentSafePage <= 1}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <ChevronLeft className="w-3.5 h-3.5" />
              <span>Anterior</span>
            </button>

            <span className="px-2.5 py-1 text-slate-500 dark:text-slate-400 font-mono text-xs">
              {currentSafePage} / {totalPages}
            </span>

            <button
              type="button"
              onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
              disabled={currentSafePage >= totalPages}
              className="px-3 py-1.5 rounded-lg border border-slate-200 dark:border-slate-800 text-slate-700 dark:text-slate-300 hover:bg-slate-100 dark:hover:bg-slate-800 disabled:opacity-40 disabled:cursor-not-allowed transition-colors font-medium flex items-center gap-1 cursor-pointer"
            >
              <span>Siguiente</span>
              <ChevronRight className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
