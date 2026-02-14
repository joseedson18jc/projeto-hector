interface HeaderProps {
  employeeCount: number;
}

export function Header({ employeeCount }: HeaderProps) {
  return (
    <div className="header">
      <h1>Acompanhamento de Avaliações</h1>
      <span className="badge">{employeeCount} funcionários</span>
    </div>
  );
}
