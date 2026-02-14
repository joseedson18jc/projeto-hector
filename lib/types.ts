export interface Employee {
  id: number;
  name: string;
  initials: string;
  role: string;
  department: string;
  manager_code: string;
  avatar_gradient: string;
  empresa: string;
  business_partner: string;
  diretoria: string;
  elegibilidade: string;
  gestor_nome: string;
  employee_code: string;
  admissao: string;
  grade: string;
  categoria: string;
  resumo_cat: string;
  genero: string;
  super_sr: string;
  super_val: string;
  gs: string;
  created_at: string;
}

export interface Evaluation {
  id: number;
  employee_id: number;
  status: 'concluido' | 'em_andamento' | 'nao_iniciado';
  category: string;
  score: number | null;
  notes: string | null;
  evaluated_at: string | null;
  created_at: string;
}

export interface EmployeeWithStatus extends Employee {
  status: Evaluation['status'] | null;
  category: string | null;
}

export interface DashboardStats {
  total: number;
  completed: number;
  in_progress: number;
  not_started: number;
  completion_rate: number;
}

export interface AreaProgress {
  department: string;
  completed: number;
  in_progress: number;
  not_started: number;
  total: number;
}

export interface CategoryDistribution {
  category: string;
  count: number;
}

export interface DashboardFilters {
  empresa?: string;
  business_partner?: string;
  diretoria?: string;
  elegibilidade?: string;
  categoria?: string;
  genero?: string;
  gs?: string;
}

export interface FilterOptions {
  empresas: string[];
  business_partners: string[];
  diretorias: string[];
  elegibilidades: string[];
  categorias: string[];
  generos: string[];
  gs_list: string[];
}

export type ProgressGroupBy = 'area' | 'empresa';

export interface DashboardData {
  stats: DashboardStats;
  employees: EmployeeWithStatus[];
  areas: AreaProgress[];
  categories: CategoryDistribution[];
}
