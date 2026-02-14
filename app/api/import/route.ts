import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import { createEmployee, createEvaluation } from '@/lib/queries';
import type { Evaluation } from '@/lib/types';

const GRADIENTS = [
  'linear-gradient(135deg,#6c5ce7,#a29bfe)',
  'linear-gradient(135deg,#fdcb6e,#e8a817)',
  'linear-gradient(135deg,#e17055,#d63031)',
  'linear-gradient(135deg,#00b894,#00a381)',
  'linear-gradient(135deg,#0984e3,#6c5ce7)',
];

function getInitials(name: string): string {
  const parts = name.trim().split(/\s+/);
  if (parts.length >= 2) {
    return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
  }
  return name.slice(0, 2).toUpperCase();
}

function normalizeStatus(raw: string | undefined): Evaluation['status'] | null {
  if (!raw) return null;
  const s = raw.toLowerCase().trim();
  if (s.includes('conclu') || s === 'done' || s === 'completo') return 'concluido';
  if (s.includes('andamento') || s === 'wip' || s.includes('progress')) return 'em_andamento';
  if (s.includes('iniciado') || s === 'pending' || s.includes('not')) return 'nao_iniciado';
  return null;
}

function findCol(headers: string[], ...candidates: string[]): number {
  for (const c of candidates) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().trim() === c.toLowerCase()
    );
    if (idx !== -1) return idx;
  }
  // Partial match
  for (const c of candidates) {
    const idx = headers.findIndex(
      (h) => h.toLowerCase().includes(c.toLowerCase())
    );
    if (idx !== -1) return idx;
  }
  return -1;
}

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get('file') as File | null;

    if (!file) {
      return NextResponse.json({ error: 'Nenhum arquivo enviado' }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());
    const workbook = XLSX.read(buffer, { type: 'buffer' });
    const sheet = workbook.Sheets[workbook.SheetNames[0]];
    const raw: string[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (raw.length < 2) {
      return NextResponse.json({ error: 'Planilha vazia ou sem dados' }, { status: 400 });
    }

    // Find header row (first row with "nome" or "name")
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i].map((c) => String(c).toLowerCase().trim());
      if (row.some((h) => h === 'nome' || h === 'name')) {
        headerIdx = i;
        break;
      }
    }

    const headers = raw[headerIdx].map((h) => String(h).trim());
    const dataRows = raw.slice(headerIdx + 1);

    const colName = findCol(headers, 'Nome', 'Name');
    const colRole = findCol(headers, 'Cargo', 'Role', 'Funcao');
    const colDept = findCol(headers, 'Area', 'Departamento', 'Department');
    const colManager = findCol(headers, 'Gestor', 'Manager', 'Cod. Gestor', 'Codigo Gestor');
    const colEmpresa = findCol(headers, 'Empresa', 'Company');
    const colBP = findCol(headers, 'Business Partner', 'BP');
    const colDir = findCol(headers, 'Diretoria');
    const colEleg = findCol(headers, 'Elegibilidade');
    const colStatus = findCol(headers, 'Status');
    const colCategory = findCol(headers, 'Categoria', 'Category', 'Resumo');
    const colScore = findCol(headers, 'Nota', 'Score');
    const colDate = findCol(headers, 'Data', 'Date', 'Data Avaliacao');
    const colGestorNome = findCol(headers, 'Gestor Nome', 'Nome Gestor', 'Gestor');

    if (colName === -1) {
      return NextResponse.json(
        { error: 'Coluna "Nome" nao encontrada na planilha' },
        { status: 400 }
      );
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const name = String(row[colName] || '').trim();
      if (!name) continue;

      try {
        const role = colRole !== -1 ? String(row[colRole] || '').trim() : '';
        const department = colDept !== -1 ? String(row[colDept] || '').trim() : '';
        const managerCode = colManager !== -1 ? String(row[colManager] || '').trim() : '';
        const empresa = colEmpresa !== -1 ? String(row[colEmpresa] || '').trim() : '';
        const bp = colBP !== -1 ? String(row[colBP] || '').trim() : '';
        const dir = colDir !== -1 ? String(row[colDir] || '').trim() : '';
        const eleg = colEleg !== -1 ? String(row[colEleg] || '').trim() : '';
        const gestorNome = colGestorNome !== -1 ? String(row[colGestorNome] || '').trim() : '';

        const employee = await createEmployee({
          name,
          initials: getInitials(name),
          role: role || 'N/A',
          department: department || 'N/A',
          manager_code: managerCode || '',
          avatar_gradient: GRADIENTS[imported % GRADIENTS.length],
          empresa,
          business_partner: bp,
          diretoria: dir,
          elegibilidade: eleg,
          gestor_nome: gestorNome,
        });

        // Create evaluation if status is provided
        const statusRaw = colStatus !== -1 ? String(row[colStatus] || '').trim() : '';
        const status = normalizeStatus(statusRaw);
        if (status) {
          const category = colCategory !== -1 ? String(row[colCategory] || '').trim() : '';
          const scoreRaw = colScore !== -1 ? row[colScore] : null;
          const score = scoreRaw !== null && scoreRaw !== '' ? Number(scoreRaw) : null;
          const dateRaw = colDate !== -1 ? String(row[colDate] || '').trim() : '';

          await createEvaluation({
            employee_id: employee.id,
            status,
            category: category || 'Geral',
            score: score !== null && !isNaN(score) ? score : null,
            notes: null,
            evaluated_at: dateRaw || null,
          });
        }

        imported++;
      } catch (err) {
        errors.push(`Linha ${headerIdx + 2 + i}: ${err instanceof Error ? err.message : 'Erro desconhecido'}`);
      }
    }

    return NextResponse.json({ imported, errors });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : 'Erro ao processar arquivo' },
      { status: 500 }
    );
  }
}
