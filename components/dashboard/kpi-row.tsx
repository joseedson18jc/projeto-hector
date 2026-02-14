import type { DashboardStats } from '@/lib/types';

interface KpiRowProps {
  stats: DashboardStats;
}

export function KpiRow({ stats }: KpiRowProps) {
  return (
    <div className="kpi-row">
      <div className="kpi green">
        <div className="num">{stats.completed}</div>
        <div className="kpi-label">Concluído</div>
      </div>
      <div className="kpi amber">
        <div className="num">{stats.in_progress}</div>
        <div className="kpi-label">Em Andamento</div>
      </div>
      <div className="kpi red">
        <div className="num">{stats.not_started}</div>
        <div className="kpi-label">Não Iniciado</div>
      </div>
    </div>
  );
}
