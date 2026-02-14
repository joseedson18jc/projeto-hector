import type { Client } from '@libsql/client';

async function addColumnIfNotExists(
  client: Client,
  column: string,
  definition: string
): Promise<void> {
  try {
    await client.execute(`ALTER TABLE employees ADD COLUMN ${column} ${definition}`);
  } catch {
    // Column already exists — ignore
  }
}

export async function migrate(client: Client): Promise<void> {
  // Phase 1 columns (from first migration)
  await addColumnIfNotExists(client, 'empresa', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'business_partner', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'diretoria', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'elegibilidade', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'gestor_nome', "TEXT NOT NULL DEFAULT ''");

  // Phase 2 columns (Excel template fields)
  await addColumnIfNotExists(client, 'employee_code', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'admissao', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'grade', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'categoria', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'resumo_cat', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'genero', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'super_sr', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'super_val', "TEXT NOT NULL DEFAULT ''");
  await addColumnIfNotExists(client, 'gs', "TEXT NOT NULL DEFAULT ''");

  await client.batch([
    'CREATE INDEX IF NOT EXISTS idx_emp_empresa ON employees(empresa)',
    'CREATE INDEX IF NOT EXISTS idx_emp_bp ON employees(business_partner)',
    'CREATE INDEX IF NOT EXISTS idx_emp_dir ON employees(diretoria)',
    'CREATE INDEX IF NOT EXISTS idx_emp_eleg ON employees(elegibilidade)',
    'CREATE INDEX IF NOT EXISTS idx_emp_cat ON employees(categoria)',
    'CREATE INDEX IF NOT EXISTS idx_emp_genero ON employees(genero)',
    'CREATE INDEX IF NOT EXISTS idx_emp_gs ON employees(gs)',
  ]);
}
