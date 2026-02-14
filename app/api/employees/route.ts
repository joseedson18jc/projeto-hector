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
  });
  return NextResponse.json(employee, { status: 201 });
}
