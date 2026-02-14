'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { CategoryDistribution } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#818cf8', '#34d399'];

interface CategoryChartProps {
  categories: CategoryDistribution[];
}

export function CategoryChart({ categories }: CategoryChartProps) {
  return (
    <div className="chart-card">
      <div className="section-title">
        <div className="dot" />
        Distribuição por Categoria
      </div>
      <div className="chart-wrapper">
        <Doughnut
          data={{
            labels: categories.map((c) => c.category),
            datasets: [
              {
                data: categories.map((c) => c.count),
                backgroundColor: COLORS.slice(0, categories.length),
                borderWidth: 3,
                borderColor: '#ffffff',
                borderRadius: 4,
              },
            ],
          }}
          options={{
            cutout: '55%',
            responsive: true,
            maintainAspectRatio: false,
            plugins: {
              legend: {
                position: 'bottom',
                labels: {
                  padding: 16,
                  usePointStyle: true,
                  pointStyle: 'rectRounded',
                  font: { family: 'Inter', size: 12, weight: 500 },
                  color: '#8b8fa3',
                },
              },
              tooltip: {
                backgroundColor: '#111827',
                titleFont: { family: 'Inter', weight: 'bold' },
                bodyFont: { family: 'Inter' },
                cornerRadius: 8,
                padding: 12,
              },
            },
            animation: { animateRotate: true, duration: 1000 },
          }}
        />
      </div>
    </div>
  );
}
