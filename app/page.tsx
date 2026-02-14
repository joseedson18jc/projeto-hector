import { Suspense } from 'react';
import { RingCard } from '@/components/dashboard/ring-card';
import { KpiRow } from '@/components/dashboard/kpi-row';
import { AreaBars } from '@/components/dashboard/area-bars';
import { Legend } from '@/components/dashboard/legend';
import { PeopleList } from '@/components/dashboard/people-list';
import { CategoryChart } from '@/components/dashboard/category-chart';
import { DashboardFilters } from '@/components/dashboard/dashboard-filters';
import { ProgressToggle } from '@/components/dashboard/progress-toggle';
import {
  getDashboardStats,
  getAllEmployeesWithStatus,
  getAreaProgress,
  getCompanyProgress,
  getCategoryDistribution,
  getFilterOptions,
} from '@/lib/queries';
import type { DashboardFilters as Filters, ProgressGroupBy } from '@/lib/types';

export const dynamic = 'force-dynamic';

export default async function Dashboard({
  searchParams,
}: {
  searchParams: Promise<Record<string, string>>;
}) {
  const params = await searchParams;
  const filters: Filters = {};
  if (params.empresa) filters.empresa = params.empresa;
  if (params.bp) filters.business_partner = params.bp;
  if (params.diretoria) filters.diretoria = params.diretoria;
  if (params.elegibilidade) filters.elegibilidade = params.elegibilidade;
  const hasFilters = Object.values(filters).some(Boolean);
  const activeFilters = hasFilters ? filters : undefined;

  const view = (params.view || 'area') as ProgressGroupBy;

  const [stats, employees, areaProgress, companyProgress, categories, filterOptions] =
    await Promise.all([
      getDashboardStats(activeFilters),
      getAllEmployeesWithStatus(activeFilters),
      getAreaProgress(activeFilters),
      getCompanyProgress(activeFilters),
      getCategoryDistribution(activeFilters),
      getFilterOptions(),
    ]);

  const progressData = view === 'empresa' ? companyProgress : areaProgress;
  const progressLabel = view === 'empresa' ? 'Progresso por Empresa' : 'Progresso por Área';

  return (
    <>
      <div className="page-title-row">
        <h1 className="page-title">Acompanhamento de Avaliações</h1>
        <span className="badge">{stats.total} funcionários</span>
      </div>

      <Suspense fallback={null}>
        <DashboardFilters filterOptions={filterOptions} />
      </Suspense>

      <div className="top-grid">
        <RingCard completionRate={stats.completion_rate} />

        <div className="kpi-area">
          <KpiRow stats={stats} />
          <div className="area-header-row">
            <Suspense fallback={null}>
              <ProgressToggle activeView={view} />
            </Suspense>
          </div>
          <AreaBars areas={progressData} sectionLabel={progressLabel} />
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
