import type { AreaProgress } from '@/lib/types';

interface AreaBarsProps {
  areas: AreaProgress[];
  sectionLabel?: string;
}

export function AreaBars({ areas, sectionLabel = 'Progresso por Área' }: AreaBarsProps) {
  return (
    <div className="area-bars">
      <div className="section-label">{sectionLabel}</div>
      {areas.map((area) => {
        const total = area.total || 1;
        return (
          <div className="bar-row" key={area.department}>
            <span className="area-name">{area.department}</span>
            <div className="stacked-bar">
              {area.completed > 0 && (
                <div
                  className="seg g"
                  style={{ width: `${(area.completed / total) * 100}%` }}
                >
                  {area.completed}
                </div>
              )}
              {area.in_progress > 0 && (
                <div
                  className="seg a"
                  style={{ width: `${(area.in_progress / total) * 100}%` }}
                >
                  {area.in_progress}
                </div>
              )}
              {area.not_started > 0 && (
                <div
                  className="seg r"
                  style={{ width: `${(area.not_started / total) * 100}%` }}
                >
                  {area.not_started}
                </div>
              )}
            </div>
          </div>
        );
      })}
    </div>
  );
}
