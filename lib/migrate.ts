import type { Client } from '@libsql/client';

export async function migrate(client: Client): Promise<void> {
  // Check if migration is needed by looking for the 'empresa' column
  const { rows } = await client.execute("PRAGMA table_info(employees)");
  const columns = rows.map((r) => r.name as string);

  if (columns.includes('empresa')) return; // Already migrated

  await client.batch([
    "ALTER TABLE employees ADD COLUMN empresa TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE employees ADD COLUMN business_partner TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE employees ADD COLUMN diretoria TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE employees ADD COLUMN elegibilidade TEXT NOT NULL DEFAULT ''",
    "ALTER TABLE employees ADD COLUMN gestor_nome TEXT NOT NULL DEFAULT ''",
    'CREATE INDEX IF NOT EXISTS idx_emp_empresa ON employees(empresa)',
    'CREATE INDEX IF NOT EXISTS idx_emp_bp ON employees(business_partner)',
    'CREATE INDEX IF NOT EXISTS idx_emp_dir ON employees(diretoria)',
    'CREATE INDEX IF NOT EXISTS idx_emp_eleg ON employees(elegibilidade)',
  ]);
}
