import { getAllEmployees } from '@/lib/queries';
import { EmployeeTable } from '@/components/admin/employee-table';

export const dynamic = 'force-dynamic';

export default async function EmployeesPage() {
  const employees = await getAllEmployees();

  return (
    <>
      <h1 className="page-title">Funcionários</h1>
      <EmployeeTable employees={employees} />
    </>
  );
}
