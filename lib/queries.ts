import { getDb } from './db';
import type {
  Employee,
  Evaluation,
  EmployeeWithStatus,
  DashboardStats,
  AreaProgress,
  CategoryDistribution,
  DashboardData,
} from './types';

// ── Dashboard aggregation ──────────────────────────────────────

export function getDashboardStats(): DashboardStats {
  const db = getDb();
  const row = db
    .prepare(
      `SELECT
        COUNT(DISTINCT e.id) AS total,
        SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started
      FROM employees e
      LEFT JOIN evaluations ev ON ev.employee_id = e.id`
    )
    .get() as { total: number; completed: number; in_progress: number; not_started: number };

  return {
    ...row,
    completion_rate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
  };
}

export function getAllEmployeesWithStatus(): EmployeeWithStatus[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT e.*, ev.status, ev.category
       FROM employees e
       LEFT JOIN evaluations ev ON ev.employee_id = e.id
       ORDER BY e.id`
    )
    .all() as EmployeeWithStatus[];
}

export function getAreaProgress(): AreaProgress[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT
        e.department,
        SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
        SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
        SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started,
        COUNT(*) AS total
      FROM employees e
      LEFT JOIN evaluations ev ON ev.employee_id = e.id
      GROUP BY e.department
      ORDER BY e.department`
    )
    .all() as AreaProgress[];
}

export function getCategoryDistribution(): CategoryDistribution[] {
  const db = getDb();
  return db
    .prepare(
      `SELECT category, COUNT(*) AS count
       FROM evaluations
       GROUP BY category
       ORDER BY category`
    )
    .all() as CategoryDistribution[];
}

export function getDashboardData(): DashboardData {
  return {
    stats: getDashboardStats(),
    employees: getAllEmployeesWithStatus(),
    areas: getAreaProgress(),
    categories: getCategoryDistribution(),
  };
}

// ── Employee CRUD ──────────────────────────────────────────────

export function getEmployee(id: number): Employee | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM employees WHERE id = ?').get(id) as Employee | undefined;
}

export function getAllEmployees(): Employee[] {
  const db = getDb();
  return db.prepare('SELECT * FROM employees ORDER BY id').all() as Employee[];
}

export function createEmployee(data: Omit<Employee, 'id' | 'created_at'>): Employee {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO employees (name, initials, role, department, manager_code, avatar_gradient)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(data.name, data.initials, data.role, data.department, data.manager_code, data.avatar_gradient);
  return getEmployee(result.lastInsertRowid as number)!;
}

export function updateEmployee(id: number, data: Partial<Omit<Employee, 'id' | 'created_at'>>): Employee | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return getEmployee(id);

  values.push(id);
  db.prepare(`UPDATE employees SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getEmployee(id);
}

export function deleteEmployee(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM employees WHERE id = ?').run(id);
  return result.changes > 0;
}

// ── Evaluation CRUD ────────────────────────────────────────────

export function getEvaluation(id: number): Evaluation | undefined {
  const db = getDb();
  return db.prepare('SELECT * FROM evaluations WHERE id = ?').get(id) as Evaluation | undefined;
}

export function getAllEvaluations(): Evaluation[] {
  const db = getDb();
  return db.prepare('SELECT * FROM evaluations ORDER BY id').all() as Evaluation[];
}

export function createEvaluation(
  data: Omit<Evaluation, 'id' | 'created_at'>
): Evaluation {
  const db = getDb();
  const result = db
    .prepare(
      `INSERT INTO evaluations (employee_id, status, category, score, notes, evaluated_at)
       VALUES (?, ?, ?, ?, ?, ?)`
    )
    .run(data.employee_id, data.status, data.category, data.score ?? null, data.notes ?? null, data.evaluated_at ?? null);
  return getEvaluation(result.lastInsertRowid as number)!;
}

export function updateEvaluation(
  id: number,
  data: Partial<Omit<Evaluation, 'id' | 'created_at'>>
): Evaluation | undefined {
  const db = getDb();
  const fields: string[] = [];
  const values: unknown[] = [];

  for (const [key, value] of Object.entries(data)) {
    fields.push(`${key} = ?`);
    values.push(value);
  }

  if (fields.length === 0) return getEvaluation(id);

  values.push(id);
  db.prepare(`UPDATE evaluations SET ${fields.join(', ')} WHERE id = ?`).run(...values);
  return getEvaluation(id);
}

export function deleteEvaluation(id: number): boolean {
  const db = getDb();
  const result = db.prepare('DELETE FROM evaluations WHERE id = ?').run(id);
  return result.changes > 0;
}
