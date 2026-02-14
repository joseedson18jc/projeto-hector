import { Header } from '@/components/dashboard/header';
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

export default function Dashboard() {
  const stats = getDashboardStats();
  const employees = getAllEmployeesWithStatus();
  const areas = getAreaProgress();
  const categories = getCategoryDistribution();

  return (
    <>
      <Header employeeCount={stats.total} />

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
