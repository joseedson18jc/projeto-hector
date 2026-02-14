import { NextRequest, NextResponse } from 'next/server';
import { getDashboardData } from '@/lib/queries';
import type { DashboardFilters } from '@/lib/types';

export async function GET(request: NextRequest) {
  const { searchParams } = request.nextUrl;
  const filters: DashboardFilters = {};
  if (searchParams.get('empresa')) filters.empresa = searchParams.get('empresa')!;
  if (searchParams.get('bp')) filters.business_partner = searchParams.get('bp')!;
  if (searchParams.get('diretoria')) filters.diretoria = searchParams.get('diretoria')!;
  if (searchParams.get('elegibilidade')) filters.elegibilidade = searchParams.get('elegibilidade')!;

  const hasFilters = Object.values(filters).some(Boolean);
  const data = await getDashboardData(hasFilters ? filters : undefined);
  return NextResponse.json(data);
}
