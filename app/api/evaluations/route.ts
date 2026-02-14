import { NextRequest, NextResponse } from 'next/server';
import { getAllEvaluations, createEvaluation } from '@/lib/queries';

export async function GET() {
  return NextResponse.json(await getAllEvaluations());
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { employee_id, status, category } = body;

  if (!employee_id || !status || !category) {
    return NextResponse.json({ error: 'Missing required fields' }, { status: 400 });
  }

  const evaluation = await createEvaluation({
    employee_id,
    status,
    category,
    score: body.score ?? null,
    notes: body.notes ?? null,
    evaluated_at: body.evaluated_at ?? null,
  });
  return NextResponse.json(evaluation, { status: 201 });
}
