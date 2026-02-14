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
import type { Row } from '@libsql/client';

function rowTo<T>(row: Row): T {
  return row as unknown as T;
}

function rowsTo<T>(rows: Row[]): T[] {
  return rows.map((r) => r as unknown as T);
}

// ── Dashboard aggregation ──────────────────────────────────────

export async function getDashboardStats(): Promise<DashboardStats> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT
      COUNT(DISTINCT e.id) AS total,
      SUM(CASE WHEN ev.status = 'concluido' THEN 1 ELSE 0 END) AS completed,
      SUM(CASE WHEN ev.status = 'em_andamento' THEN 1 ELSE 0 END) AS in_progress,
      SUM(CASE WHEN ev.status = 'nao_iniciado' THEN 1 ELSE 0 END) AS not_started
    FROM employees e
    LEFT JOIN evaluations ev ON ev.employee_id = e.id`
  );
  const row = rowTo<{ total: number; completed: number; in_progress: number; not_started: number }>(rows[0]);
  return {
    ...row,
    completion_rate: row.total > 0 ? Math.round((row.completed / row.total) * 100) : 0,
  };
}

export async function getAllEmployeesWithStatus(): Promise<EmployeeWithStatus[]> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT e.*, ev.status, ev.category
     FROM employees e
     LEFT JOIN evaluations ev ON ev.employee_id = e.id
     ORDER BY e.id`
  );
  return rowsTo<EmployeeWithStatus>(rows);
}

export async function getAreaProgress(): Promise<AreaProgress[]> {
  const db = await getDb();
  const { rows } = await db.execute(
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
  );
  return rowsTo<AreaProgress>(rows);
}

export async function getCategoryDistribution(): Promise<CategoryDistribution[]> {
  const db = await getDb();
  const { rows } = await db.execute(
    `SELECT category, COUNT(*) AS count
     FROM evaluations
     GROUP BY category
     ORDER BY category`
  );
  return rowsTo<CategoryDistribution>(rows);
}

export async function getDashboardData(): Promise<DashboardData> {
  const [stats, employees, areas, categories] = await Promise.all([
    getDashboardStats(),
    getAllEmployeesWithStatus(),
    getAreaProgress(),
    getCategoryDistribution(),
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
    sql: `INSERT INTO employees (name, initials, role, department, manager_code, avatar_gradient)
          VALUES (?, ?, ?, ?, ?, ?)`,
    args: [data.name, data.initials, data.role, data.department, data.manager_code, data.avatar_gradient],
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
