import { RingCard } from '@/components/dashboard/ring-card';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { AreaBars } from '@/components/dashboard/area-bars';
import { Legend } from '@/components/dashboard/legend';
import { PeopleList } from '@/components/dashboard/people-list';
import { CategoryChart } from '@/components/dashboard/category-chart';
import {
  getDashboardStats,
  getAllEmployeesWithStatus,
  getAreaProgress,
  getCategoryDistribution,
} from '@/lib/queries';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const [stats, employees, areas, categories] = await Promise.all([
    getDashboardStats(),
    getAllEmployeesWithStatus(),
    getAreaProgress(),
    getCategoryDistribution(),
  ]);

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Acompanhamento de Avaliações</h1>
        <span className="badge">{stats.total} funcionários</span>
      </div>

      <div className="top-grid">
        <RingCard completionRate={stats.completion_rate} />

        <div className="kpi-area">
          <KpiRow stats={stats} />
          <AreaBars areas={areas} />
          <Legend />
        </div>
      </div>

      <div className="bottom-grid">
        <PeopleList employees={employees} />
        <CategoryChart categories={categories} />
      </div>
    </>
  );
}
