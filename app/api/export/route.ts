import { NextRequest, NextResponse } from 'next/server';
import * as XLSX from 'xlsx';
import {
  getDashboardStats,
  getAllEmployeesWithStatus,
  getAreaProgress,
} from '@/lib/queries';
import type { DashboardFilters } from '@/lib/types';

function statusLabel(status: string | null): string {
  switch (status) {
    case 'concluido': return 'Concluida';
    case 'em_andamento': return 'Em Andamento';
    case 'nao_iniciado': return 'Nao Iniciado';
    default: return 'Sem Avaliacao';
  }
}

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: DashboardFilters = {};
  if (searchParams.get('empresa')) filters.empresa = searchParams.get('empresa')!;
  if (searchParams.get('bp')) filters.business_partner = searchParams.get('bp')!;
  if (searchParams.get('diretoria')) filters.diretoria = searchParams.get('diretoria')!;
  if (searchParams.get('elegibilidade')) filters.elegibilidade = searchParams.get('elegibilidade')!;
  if (searchParams.get('categoria')) filters.categoria = searchParams.get('categoria')!;
  if (searchParams.get('genero')) filters.genero = searchParams.get('genero')!;
  if (searchParams.get('gs')) filters.gs = searchParams.get('gs')!;

  const hasFilters = Object.values(filters).some(Boolean);

  const [stats, employees, areas] = await Promise.all([
    getDashboardStats(hasFilters ? filters : undefined),
    getAllEmployeesWithStatus(hasFilters ? filters : undefined),
    getAreaProgress(hasFilters ? filters : undefined),
  ]);

  const data: (string | number | null)[][] = [];

  // Row 1: Title
  data.push(['Dashboard — Avaliacao de Desempenho']);
  data.push([]);

  // Row 3: Filter summary
  const activeFilters: string[] = [];
  if (filters.empresa) activeFilters.push(`Empresa: ${filters.empresa}`);
  if (filters.business_partner) activeFilters.push(`Business Partner: ${filters.business_partner}`);
  if (filters.diretoria) activeFilters.push(`Diretoria: ${filters.diretoria}`);
  if (filters.elegibilidade) activeFilters.push(`Elegibilidade: ${filters.elegibilidade}`);
  if (filters.categoria) activeFilters.push(`Categoria: ${filters.categoria}`);
  if (filters.genero) activeFilters.push(`Genero: ${filters.genero}`);
  if (filters.gs) activeFilters.push(`GS: ${filters.gs}`);
  data.push([activeFilters.length > 0 ? `Filtros: ${activeFilters.join(' | ')}` : 'Filtros: Nenhum (Todos)']);
  data.push([]);

  // Row 5: Completion rate
  data.push(['Taxa de Conclusao (%)', stats.completion_rate]);
  data.push([]);

  // KPI
  data.push(['Status', 'Quantidade']);
  data.push(['Concluido', stats.completed]);
  data.push(['Em Andamento', stats.in_progress]);
  data.push(['Nao Iniciado', stats.not_started]);
  data.push(['Total', stats.total]);
  data.push([]);

  // Area progress
  data.push(['Progresso por Area']);
  data.push(['Area', 'Concluido', 'Em Andamento', 'Nao Iniciado', 'Total']);
  for (const area of areas) {
    data.push([area.department, area.completed, area.in_progress, area.not_started, area.total]);
  }
  data.push([]);

  // Employee list — full template columns
  data.push(['Lista de Funcionarios']);
  data.push([
    'ID', 'Nome', 'Admissao', 'Gestor Imediato', 'Cargo', 'Empresa',
    'Grade', 'Categoria', 'Resumo Cat', 'Genero', 'Area',
    'Business Partner', 'Diretoria', 'Super SR', 'Super', 'GS',
    'Elegibilidade', 'Status Avaliacao', 'Nota Avaliacao',
  ]);
  for (const emp of employees) {
    data.push([
      emp.employee_code || emp.manager_code,
      emp.name,
      emp.admissao,
      emp.gestor_nome || emp.manager_code,
      emp.role,
      emp.empresa,
      emp.grade,
      emp.categoria,
      emp.resumo_cat,
      emp.genero,
      emp.department,
      emp.business_partner,
      emp.diretoria,
      emp.super_sr,
      emp.super_val,
      emp.gs,
      emp.elegibilidade,
      statusLabel(emp.status),
      emp.status === 'concluido' && emp.category ? emp.category : '',
    ]);
  }

  const ws = XLSX.utils.aoa_to_sheet(data);

  // Set column widths
  ws['!cols'] = [
    { wch: 10 }, { wch: 25 }, { wch: 12 }, { wch: 20 }, { wch: 30 },
    { wch: 15 }, { wch: 8 }, { wch: 15 }, { wch: 15 }, { wch: 8 },
    { wch: 20 }, { wch: 15 }, { wch: 15 }, { wch: 15 }, { wch: 15 },
    { wch: 10 }, { wch: 14 }, { wch: 18 }, { wch: 15 },
  ];

  const wb = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(wb, ws, 'Dashboard');

  const buf = XLSX.write(wb, { type: 'buffer', bookType: 'xlsx' });

  return new NextResponse(buf, {
    headers: {
      'Content-Type': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'Content-Disposition': 'attachment; filename="dashboard-avaliacao.xlsx"',
    },
  });
}
