export type AppRole = 'superadmin' | 'admin' | 'coordinador' | 'lider';
export type TenantPlan = 'standard' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan?: TenantPlan | string;
  max_electors?: number | null;
  es_ilimitado?: boolean;
  departamento?: string;
  municipio?: string;
  is_active: boolean;
  created_at: string;
  admin_name?: string;
  admin_email?: string;
  totalElectores?: number;
  totalUsers?: number;
}

export interface AccessAuditLog {
  id: string;
  user_email: string;
  user_name: string;
  user_role: AppRole;
  tenant_name?: string;
  tenant_id?: string | null;
  ip_address: string;
  user_agent: string;
  event_type: 'login_success' | 'login_failed' | 'campaign_suspended' | 'campaign_activated' | 'password_change' | 'data_export' | 'tenant_created' | 'plan_upgrade' | 'tenant_quota_changed';
  description: string;
  created_at: string;
}

export interface UserPermissions {
  can_register_electors: boolean;     // Registrar Elector manualmente
  can_view_all_electors: boolean;     // Ver lista completa del padrón (o solo los suyos)
  can_use_bulk_import: boolean;       // Acceso al módulo de Carga Masiva
  can_export_reports: boolean;        // Descarga de reportes en Excel
  can_query_registraduria: boolean;   // Acceso a la consulta oficial de censo
}

export const DEFAULT_ROLE_PERMISSIONS: Record<'lider' | 'coordinador', UserPermissions> = {
  lider: {
    can_register_electors: true,
    can_view_all_electors: false, // Solo ve sus propios registros
    can_use_bulk_import: false,
    can_export_reports: false,
    can_query_registraduria: true,
  },
  coordinador: {
    can_register_electors: true,
    can_view_all_electors: true,  // Puede auditar el padrón completo
    can_use_bulk_import: true,
    can_export_reports: true,
    can_query_registraduria: true,
  },
};

export interface Profile {
  id: string;
  full_name: string | null;
  email?: string | null;
  role: AppRole;
  permissions?: UserPermissions;
  meta_electores?: number;
  tenant_id?: string | null;
  tenant?: Tenant | null;
  is_active: boolean;
  created_at: string;
}

export interface ActiveSessionData {
  email: string;
  id: string;
  userName: string;
  role: AppRole | string;
  tenantId?: string | null;
  isDemo?: boolean;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  permissions?: UserPermissions;
  meta_electores?: number;
  tenant_id?: string | null;
  is_active: boolean;
  created_at: string;
  totalElectores: number;
  lastActivity?: string | null;
}

export interface Elector {
  id: string;
  cedula: string;
  nombres: string;
  apellidos: string;
  edad?: number | null;
  telefono?: string | null;
  puesto_votacion: string;
  mesa: number;
  notas?: string | null;
  registrado_por: string | null;
  tenant_id?: string | null;
  created_at: string;
}

export interface ElectorWithRegistrant extends Elector {
  registrador?: {
    full_name: string | null;
    role: AppRole;
  } | null;
}

export interface CollisionCheckResult {
  exists: boolean;
  elector?: {
    id?: string;
    cedula: string;
    nombres: string;
    apellidos: string;
    edad?: number | null;
    telefono?: string | null;
    puesto_votacion: string;
    mesa: number;
    created_at: string;
    registrado_por_nombre?: string;
    registrado_por_rol?: string;
  };
}

export interface CensoLookupResult {
  found: boolean;
  nombres?: string | null;
  apellidos?: string | null;
  edad?: number | null;
  puesto_sugerido?: string | null;
  mesa_sugerida?: number | null;
  municipio?: string | null;
  departamento?: string | null;
}

export interface ConsultarDocumentoExternoResult {
  encontrado: boolean;
  nombres?: string | null;
  apellidos?: string | null;
  edad?: number | null;
  municipio?: string | null;
  departamento?: string | null;
  raw_response?: any;
}

export interface TopPollingPlace {
  puesto: string;
  zona?: string;
  total: number;
  porcentaje: number;
  mesasCount?: number;
}

export interface DashboardTeamMember {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
  meta_electores: number;
  totalElectores: number;
  is_active: boolean;
}

export interface DashboardMetrics {
  totalElectores: number;
  equipoOperativoActivo: number;
  coordinadoresActivos: number;
  lideresActivos: number;
  metaGlobal: number;
  cumplimientoGlobalPct: number;
  puestosConElectores: number;
  totalPuestosCampana: number;
  lideresConRegistros: number;
  metaCobertura?: number;
  porcentajeMeta?: number;
  puestosActivos?: number;
  contactabilidadPct?: number;
  totalConTelefono?: number;
}

export interface ExportLog {
  id: string;
  tenant_id?: string | null;
  user_id: string | null;
  user_name: string;
  user_email: string;
  user_role: string;
  record_count: number;
  export_format: 'xlsx' | 'csv';
  filters_summary: string | null;
  created_at: string;
}

export interface Database {
  public: {
    Tables: {
      tenants: {
        Row: Tenant;
        Insert: {
          id?: string;
          name: string;
          slug: string;
          plan?: TenantPlan;
          max_electors?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          name?: string;
          slug?: string;
          plan?: TenantPlan;
          max_electors?: number;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [];
      };
      profiles: {
        Row: Profile;
        Insert: {
          id: string;
          full_name?: string | null;
          role?: AppRole;
          tenant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Update: {
          id?: string;
          full_name?: string | null;
          role?: AppRole;
          tenant_id?: string | null;
          is_active?: boolean;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "profiles_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      electores: {
        Row: Elector;
        Insert: {
          id?: string;
          cedula: string;
          nombres: string;
          apellidos: string;
          telefono?: string | null;
          puesto_votacion: string;
          mesa: number;
          notas?: string | null;
          registrado_por?: string | null;
          tenant_id?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          cedula?: string;
          nombres?: string;
          apellidos?: string;
          telefono?: string | null;
          puesto_votacion?: string;
          mesa?: number;
          notas?: string | null;
          registrado_por?: string | null;
          tenant_id?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "electores_registrado_por_fkey";
            columns: ["registrado_por"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "electores_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
      export_logs: {
        Row: ExportLog;
        Insert: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          user_name: string;
          user_email: string;
          user_role: string;
          record_count?: number;
          export_format: 'xlsx' | 'csv';
          filters_summary?: string | null;
          created_at?: string;
        };
        Update: {
          id?: string;
          tenant_id?: string | null;
          user_id?: string | null;
          user_name?: string;
          user_email?: string;
          user_role?: string;
          record_count?: number;
          export_format?: 'xlsx' | 'csv';
          filters_summary?: string | null;
          created_at?: string;
        };
        Relationships: [
          {
            foreignKeyName: "export_logs_user_id_fkey";
            columns: ["user_id"];
            isOneToOne: false;
            referencedRelation: "profiles";
            referencedColumns: ["id"];
          },
          {
            foreignKeyName: "export_logs_tenant_id_fkey";
            columns: ["tenant_id"];
            isOneToOne: false;
            referencedRelation: "tenants";
            referencedColumns: ["id"];
          }
        ];
      };
    };
    Views: Record<string, never>;
    Functions: Record<string, never>;
    Enums: {
      app_role: AppRole;
    };
    CompositeTypes: Record<string, never>;
  };
}

export type { PollingPlace } from '../data/monteriaDivipole2026';
