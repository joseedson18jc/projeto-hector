import type { Client } from '@libsql/client';

export async function seed(client: Client): Promise<void> {
  const result = await client.execute(
    "SELECT name FROM sqlite_master WHERE type='table' AND name='employees'"
  );

  if (result.rows.length > 0) return;

  await client.batch([
    `CREATE TABLE IF NOT EXISTS employees (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      initials TEXT NOT NULL,
      role TEXT NOT NULL,
      department TEXT NOT NULL,
      manager_code TEXT NOT NULL,
      avatar_gradient TEXT NOT NULL,
      empresa TEXT NOT NULL DEFAULT '',
      business_partner TEXT NOT NULL DEFAULT '',
      diretoria TEXT NOT NULL DEFAULT '',
      elegibilidade TEXT NOT NULL DEFAULT '',
      gestor_nome TEXT NOT NULL DEFAULT '',
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    `CREATE TABLE IF NOT EXISTS evaluations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      employee_id INTEGER NOT NULL REFERENCES employees(id) ON DELETE CASCADE,
      status TEXT NOT NULL CHECK (status IN ('concluido', 'em_andamento', 'nao_iniciado')),
      category TEXT NOT NULL,
      score REAL,
      notes TEXT,
      evaluated_at TEXT,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    )`,
    {
      sql: `INSERT OR IGNORE INTO employees (id, name, initials, role, department, manager_code, avatar_gradient) VALUES
        (1, 'Larissa', 'LA', 'Especialista TI', 'TI', '222', 'linear-gradient(135deg,#6c5ce7,#a29bfe)'),
        (2, 'Hector', 'HE', 'Gerente RH', 'RH', '111', 'linear-gradient(135deg,#fdcb6e,#e8a817)'),
        (3, 'Emilio', 'EM', 'Coordenador Processo', 'Processos', '333', 'linear-gradient(135deg,#e17055,#d63031)')`,
      args: [],
    },
    {
      sql: `INSERT OR IGNORE INTO evaluations (id, employee_id, status, category, score, evaluated_at) VALUES
        (1, 1, 'concluido', 'Especialista', 92.5, '2026-01-15'),
        (2, 2, 'em_andamento', 'GA (Gerente)', NULL, NULL),
        (3, 3, 'nao_iniciado', 'Coordenador', NULL, NULL)`,
      args: [],
    },
  ]);
}
