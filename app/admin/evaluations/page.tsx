import { getAllEvaluations, getAllEmployees } from '@/lib/queries';
import { EvaluationTable } from '@/components/admin/evaluation-table';

export const dynamic = 'force-dynamic';

export default async function EvaluationsPage() {
  const [evaluations, employees] = await Promise.all([
    getAllEvaluations(),
    getAllEmployees(),
  ]);

  const employeeMap = new Map(employees.map((e) => [e.id, e.name]));
  const enriched = evaluations.map((ev) => ({
    ...ev,
    employee_name: employeeMap.get(ev.employee_id) ?? `#${ev.employee_id}`,
  }));

  return (
    <>
      <h1 className="page-title">Avaliações</h1>
      <EvaluationTable evaluations={enriched} employees={employees} />
    </>
  );
}
