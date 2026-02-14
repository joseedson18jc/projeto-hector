import { NextRequest, NextResponse } from 'next/server';
import { getAllEmployees, createEmployee } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(await getAllEmployees());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const {
    name, initials, role, department, manager_code, avatar_gradient,
    empresa, business_partner, diretoria, elegibilidade, gestor_nome,
    employee_code, admissao, grade, categoria, resumo_cat, genero,
    super_sr, super_val, gs,
  } = body;

  if (!name || !initials || !role || !department || !avatar_gradient) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const employee = await createEmployee({
    name,
    initials,
    role,
    department,
    manager_code: manager_code || '',
    avatar_gradient,
    empresa: empresa || '',
    business_partner: business_partner || '',
    diretoria: diretoria || '',
    elegibilidade: elegibilidade || '',
    gestor_nome: gestor_nome || '',
    employee_code: employee_code || '',
    admissao: admissao || '',
    grade: grade || '',
    categoria: categoria || '',
    resumo_cat: resumo_cat || '',
    genero: genero || '',
    super_sr: super_sr || '',
    super_val: super_val || '',
    gs: gs || '',
  });
  return NextResponse.json(employee, { status: 201 });
}
