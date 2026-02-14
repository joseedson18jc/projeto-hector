import type { EmployeeWithStatus } from '@/lib/types';
import { Avatar } from '@/components/ui/avatar';
import { StatusPill } from '@/components/ui/status-pill';

interface PeopleListProps {
  employees: EmployeeWithStatus[];
}

export function PeopleList({ employees }: PeopleListProps) {
  return (
    <div className="people-card">
      <div className="section-title">
        <div className="dot" />
        Funcionários
      </div>
      <div className="people-scroll">
        {employees.map((emp) => (
          <div className="person" key={emp.id}>
            <Avatar initials={emp.initials} gradient={emp.avatar_gradient} />
            <div className="person-info">
              <div className="name">{emp.name}</div>
              <div className="role">
                {emp.role} · Área {emp.department} · Gestor {emp.gestor_nome || emp.manager_code}
              </div>
            </div>
            {emp.status && <StatusPill status={emp.status} />}
          </div>
        ))}
      </div>
    </div>
  );
}
