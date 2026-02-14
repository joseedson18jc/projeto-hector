import { getDb } from './db';
import type {
  Employee,
  Evaluation,
  EmployeeWithStatus,
  DashboardStats,
  AreaProgress,
  CategoryDistribution,
  DashboardData,
  DashboardFilters,
  FilterOptions,
} from './types';
import type { Row, InArgs } from '@libsql/client';

function rowTo<T>(row: Row): T {
  return row as unknown as T;
}

function rowsTo<T>(rows: Row[]): T[] {
  return rows.map((r) => r as unknown as T);
}

// ── Filter helpers ──────────────────────────────────────────

function buildFilterClause(filters?: DashboardFilters): { where: string; args: InArgs } {
  if (!filters) return { where: '', args: [] };

  const conditions: string[] = [];
  const args: InArgs = [];

  if (filters.empresa) {
    conditions.push('e.empresa = ?');
    args.push(filters.empresa);
  }
  if (filters.business_partner) {
    conditions.push('e.business_partner = ?');
    args.push(filters.business_partner);
  }
  if (filters.diretoria) {
    conditions.push('e.diretoria = ?');
    args.push(filters.diretoria);
  }
  if (filters.elegibilidade) {
    conditions.push('e.elegibilidade = ?');
    args.push(filters.elegibilidade);
  }
  if (filters.categoria) {
    conditions.push('e.categoria = ?');
    args.push(filters.categoria);
  }
  if (filters.genero) {
    conditions.push('e.genero = ?');
    args.push(filters.genero);
  }
  if (filters.gs) {
    conditions.push('e.gs = ?');
    args.push(filters.gs);
  }

  if (conditions.length === 0) return { where: '', args: [] };
  return { where: ' WHERE ' + conditions.join(' AND '), args };
}

// ── Dashboard aggregation ──────────────────────────────────────

export async function getDashboardStats(filters?: DashboardFilters): Promise<DashboardStats> {
  const db = await getDb();
  const { where, args } = buildFilterClause(filters);
  const { rows } = await db.execute({
    sql: `SELECT
      COUNT(DISTINCT e.id) AS total,
      SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started
    FROM employees e
    LEFT JOIN evaluations ev ON ev.employee_id = e.id${where}`,
    args,
  });
  const row = rowTo<{ total: number; completed: number; in_progress: number; not_started: number }>(rows[0]);
  return {
    ...row,
    completion_rate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
  };
}

export async function getAllEmployeesWithStatus(filters?: DashboardFilters): Promise<EmployeeWithStatus[]> {
  const db = await getDb();
  const { where, args } = buildFilterClause(filters);
  const { rows } = await db.execute({
    sql: `SELECT e.*, ev.status, ev.category
     FROM employees e
     LEFT JOIN evaluations ev ON ev.employee_id = e.id${where}
     ORDER BY e.id`,
    args,
  });
  return rowsTo<EmployeeWithStatus>(rows);
}

export async function getAreaProgress(filters?: DashboardFilters): Promise<AreaProgress[]> {
  const db = await getDb();
  const { where, args } = buildFilterClause(filters);
  const { rows } = await db.execute({
    sql: `SELECT
      e.department,
      SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started,
      COUNT(*) AS total
    FROM employees e
    LEFT JOIN evaluations ev ON ev.employee_id = e.id${where}
    GROUP BY e.department
    ORDER BY e.department`,
    args,
  });
  return rowsTo<AreaProgress>(rows);
}

export async function getCompanyProgress(filters?: DashboardFilters): Promise<AreaProgress[]> {
  const db = await getDb();
  const { where, args } = buildFilterClause(filters);
  const { rows } = await db.execute({
    sql: `SELECT
      e.empresa AS department,
      SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started,
      COUNT(*) AS total
    FROM employees e
    LEFT JOIN evaluations ev ON ev.employee_id = e.id${where}
    GROUP BY e.empresa
    ORDER BY e.empresa`,
    args,
  });
  return rowsTo<AreaProgress>(rows);
}

export async function getCategoryDistribution(filters?: DashboardFilters): Promise<CategoryDistribution[]> {
  const db = await getDb();
  if (!filters || Object.values(filters).every((v) => !v)) {
    const { rows } = await db.execute(
      `SELECT category, COUNT(*) AS count
       FROM evaluations
       GROUP BY category
       ORDER BY category`
    );
    return rowsTo<CategoryDistribution>(rows);
  }

  const { where, args } = buildFilterClause(filters);
  const { rows } = await db.execute({
    sql: `SELECT ev.category, COUNT(*) AS count
     FROM evaluations ev
     JOIN employees e ON e.id = ev.employee_id${where}
     GROUP BY ev.category
     ORDER BY ev.category`,
    args,
  });
  return rowsTo<CategoryDistribution>(rows);
}

export async function getFilterOptions(): Promise<FilterOptions> {
  const db = await getDb();
  const [empresas, bps, dirs, elegs, cats, gens, gss] = await Promise.all([
    db.execute("SELECT DISTINCT empresa FROM employees WHERE empresa != '' ORDER BY empresa"),
    db.execute("SELECT DISTINCT business_partner FROM employees WHERE business_partner != '' ORDER BY business_partner"),
    db.execute("SELECT DISTINCT diretoria FROM employees WHERE diretoria != '' ORDER BY diretoria"),
    db.execute("SELECT DISTINCT elegibilidade FROM employees WHERE elegibilidade != '' ORDER BY elegibilidade"),
    db.execute("SELECT DISTINCT categoria FROM employees WHERE categoria != '' ORDER BY categoria"),
    db.execute("SELECT DISTINCT genero FROM employees WHERE genero != '' ORDER BY genero"),
    db.execute("SELECT DISTINCT gs FROM employees WHERE gs != '' ORDER BY gs"),
  ]);
  return {
    empresas: empresas.rows.map((r) => r.empresa as string),
    business_partners: bps.rows.map((r) => r.business_partner as string),
    diretorias: dirs.rows.map((r) => r.diretoria as string),
    elegibilidades: elegs.rows.map((r) => r.elegibilidade as string),
    categorias: cats.rows.map((r) => r.categoria as string),
    generos: gens.rows.map((r) => r.genero as string),
    gs_list: gss.rows.map((r) => r.gs as string),
  };
}

export async function getDashboardData(filters?: DashboardFilters): Promise<DashboardData> {
  const [stats, employees, areas, categories] = await Promise.all([
    getDashboardStats(filters),
    getAllEmployeesWithStatus(filters),
    getAreaProgress(filters),
    getCategoryDistribution(filters),
  ]);
  return { stats, employees, areas, categories };
}

// ── Employee CRUD ──────────────────────────────────────────────

export async function getEmployee(id: number): Promise<Employee | undefined> {
  const db = await getDb();
  const { rows } = await db.execute({ sql: 'SELECT * FROM employees WHERE id = ?', args: [id] });
  return rows[0] ? rowTo<Employee>(rows[0]) : undefined;
}

export async function getAllEmployees(): Promise<Employee[]> {
  const db = await getDb();
  const { rows } = await db.execute('SELECT * FROM employees ORDER BY id');
  return rowsTo<Employee>(rows);
}

export async function createEmployee(data: Omit<Employee, 'id' | 'created_at'>): Promise<Employee> {
  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO employees (name, initials, role, department, manager_code, avatar_gradient, empresa, business_partner, diretoria, elegibilidade, gestor_nome, employee_code, admissao, grade, categoria, resumo_cat, genero, super_sr, super_val, gs)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
    args: [
      data.name,
      data.initials,
      data.role,
      data.department,
      data.manager_code,
      data.avatar_gradient,
      data.empresa || '',
      data.business_partner || '',
      data.diretoria || '',
      data.elegibilidade || '',
      data.gestor_nome || '',
      data.employee_code || '',
      data.admissao || '',
      data.grade || '',
      data.categoria || '',
      data.resumo_cat || '',
      data.genero || '',
      data.super_sr || '',
      data.super_val || '',
      data.gs || '',
    ],
  });
  return (await getEmployee(Number(result.lastInsertRowid)))!;
}

export async function updateEmployee(
  id: number,
  data: Partial<Omit<Employee, 'id' | 'created_at'>>
): Promise<Employee | undefined> {
  const db = await getDb();
  const entries = Object.entries(data);
  if (entries.length === 0) return getEmployee(id);

  const fields = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v as string);

  await db.execute({ sql: `UPDATE employees SET ${fields} WHERE id = ?`, args: [...values, id] });
  return getEmployee(id);
}

export async function deleteEmployee(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute({ sql: 'DELETE FROM employees WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}

// ── Evaluation CRUD ────────────────────────────────────────────

export async function getEvaluation(id: number): Promise<Evaluation | undefined> {
  const db = await getDb();
  const { rows } = await db.execute({ sql: 'SELECT * FROM evaluations WHERE id = ?', args: [id] });
  return rows[0] ? rowTo<Evaluation>(rows[0]) : undefined;
}

export async function getAllEvaluations(): Promise<Evaluation[]> {
  const db = await getDb();
  const { rows } = await db.execute('SELECT * FROM evaluations ORDER BY id');
  return rowsTo<Evaluation>(rows);
}

export async function createEvaluation(
  data: Omit<Evaluation, 'id' | 'created_at'>
): Promise<Evaluation> {
  const db = await getDb();
  const result = await db.execute({
    sql: `INSERT INTO evaluations (employee_id, status, category, score, notes, evaluated_at)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [data.employee_id, data.status, data.category, data.score ?? null, data.notes ?? null, data.evaluated_at ?? null],
  });
  return (await getEvaluation(Number(result.lastInsertRowid)))!;
}

export async function updateEvaluation(
  id: number,
  data: Partial<Omit<Evaluation, 'id' | 'created_at'>>
): Promise<Evaluation | undefined> {
  const db = await getDb();
  const entries = Object.entries(data);
  if (entries.length === 0) return getEvaluation(id);

  const fields = entries.map(([key]) => `${key} = ?`).join(', ');
  const values = entries.map(([, v]) => v as string | number | null);

  await db.execute({ sql: `UPDATE evaluations SET ${fields} WHERE id = ?`, args: [...values, id] });
  return getEvaluation(id);
}

export async function deleteEvaluation(id: number): Promise<boolean> {
  const db = await getDb();
  const result = await db.execute({ sql: 'DELETE FROM evaluations WHERE id = ?', args: [id] });
  return result.rowsAffected > 0;
}
