export type AppRole = 'superadmin' | 'admin' | 'coordinador' | 'lider';
export type TenantPlan = 'standard' | 'pro' | 'enterprise';

export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: TenantPlan;
  max_electors: number;
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

export interface Profile {
  id: string;
  full_name: string | null;
  role: AppRole;
  tenant_id?: string | null;
  tenant?: Tenant | null;
  is_active: boolean;
  created_at: string;
}

export interface TeamMember {
  id: string;
  full_name: string;
  email: string;
  role: AppRole;
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
  puesto_sugerido?: string | null;
  mesa_sugerida?: number | null;
}

export interface ConsultarDocumentoExternoResult {
  encontrado: boolean;
  nombres?: string | null;
  apellidos?: string | null;
  raw_response?: any;
}

export interface TopPollingPlace {
  puesto: string;
  total: number;
  porcentaje: number;
  mesasCount?: number;
}

export interface DashboardMetrics {
  totalElectores: number;
  metaCobertura?: number;
  porcentajeMeta?: number;
  puestosActivos: number;
  coordinadoresActivos: number;
  lideresActivos?: number;
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
