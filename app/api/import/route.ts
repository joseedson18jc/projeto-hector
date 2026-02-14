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

function excelSerialToDate(serial: number | string): string {
  const n = Number(serial);
  if (isNaN(n) || n < 1) return String(serial);
  // Excel serial date: days since 1899-12-30
  const epoch = new Date(1899, 11, 30);
  const date = new Date(epoch.getTime() + n * 86400000);
  return date.toISOString().split('T')[0];
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
  // Exact match first
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

function str(row: (string | number | null | undefined)[], col: number): string {
  if (col === -1) return '';
  return String(row[col] ?? '').trim();
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
    const raw: (string | number)[][] = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' });

    if (raw.length < 2) {
      return NextResponse.json({ error: 'Planilha vazia ou sem dados' }, { status: 400 });
    }

    // Find header row (first row with "nome" or "name" or "id")
    let headerIdx = 0;
    for (let i = 0; i < Math.min(raw.length, 10); i++) {
      const row = raw[i].map((c) => String(c).toLowerCase().trim());
      if (row.some((h) => h === 'nome' || h === 'name' || h === 'id')) {
        headerIdx = i;
        break;
      }
    }

    const headers = raw[headerIdx].map((h) => String(h).trim());
    const dataRows = raw.slice(headerIdx + 1);

    // Map all template columns
    const colId = findCol(headers, 'ID');
    const colName = findCol(headers, 'Nome', 'Name');
    const colAdmissao = findCol(headers, 'Admissao');
    const colGestor = findCol(headers, 'Gestor Imediato', 'Gestor', 'Manager');
    const colRole = findCol(headers, 'Cargo', 'Role', 'Funcao');
    const colEmpresa = findCol(headers, 'Empresa', 'Company');
    const colGrade = findCol(headers, 'Grade');
    const colCategoria = findCol(headers, 'Catergoria', 'Categoria', 'Category');
    const colResumoCat = findCol(headers, 'Resumo Cat', 'Resumo');
    const colGenero = findCol(headers, 'Genero', 'Gender');
    const colDept = findCol(headers, 'Area', 'Departamento', 'Department');
    const colBP = findCol(headers, 'Business Partner', 'BP');
    const colDir = findCol(headers, 'Diretoria');
    const colSuperSr = findCol(headers, 'Super SR');
    const colSuper = findCol(headers, 'Super');
    const colGS = findCol(headers, 'GS');
    const colEleg = findCol(headers, 'Elegibilidade');
    const colStatus = findCol(headers, 'Status Avaliacao', 'Status');
    const colScore = findCol(headers, 'Nota Avaliacao', 'Nota', 'Score');

    if (colName === -1) {
      return NextResponse.json(
        { error: 'Coluna "NOME" nao encontrada na planilha' },
        { status: 400 }
      );
    }

    let imported = 0;
    const errors: string[] = [];

    for (let i = 0; i < dataRows.length; i++) {
      const row = dataRows[i];
      const name = str(row, colName);
      if (!name) continue;

      try {
        const admissaoRaw = colAdmissao !== -1 ? row[colAdmissao] : '';
        const admissao = typeof admissaoRaw === 'number'
          ? excelSerialToDate(admissaoRaw)
          : String(admissaoRaw || '').trim();

        const employee = await createEmployee({
          name,
          initials: getInitials(name),
          role: str(row, colRole) || 'N/A',
          department: str(row, colDept) || 'N/A',
          manager_code: str(row, colId),
          avatar_gradient: GRADIENTS[imported % GRADIENTS.length],
          empresa: str(row, colEmpresa),
          business_partner: str(row, colBP),
          diretoria: str(row, colDir),
          elegibilidade: str(row, colEleg),
          gestor_nome: str(row, colGestor),
          employee_code: str(row, colId),
          admissao,
          grade: str(row, colGrade),
          categoria: str(row, colCategoria),
          resumo_cat: str(row, colResumoCat),
          genero: str(row, colGenero),
          super_sr: str(row, colSuperSr),
          super_val: str(row, colSuper),
          gs: str(row, colGS),
        });

        // Create evaluation if status is provided
        const statusRaw = str(row, colStatus);
        const status = normalizeStatus(statusRaw);
        if (status) {
          const category = str(row, colResumoCat) || str(row, colCategoria) || 'Geral';
          const scoreRaw = colScore !== -1 ? row[colScore] : null;
          const score = scoreRaw !== null && scoreRaw !== '' ? Number(scoreRaw) : null;

          await createEvaluation({
            employee_id: employee.id,
            status,
            category,
            score: score !== null && !isNaN(score) ? score : null,
            notes: null,
            evaluated_at: null,
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
