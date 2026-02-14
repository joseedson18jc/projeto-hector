'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement, Tooltip, Legend } from 'chart.js';
import type { CategoryDistribution } from '@/lib/types';

ChartJS.register(ArcElement, Tooltip, Legend);

const COLORS = ['#6c5ce7', '#00b894', '#fdcb6e', '#e17055', '#a29bfe', '#55efc4'];

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
                backgroundColor: '#1a1a2e',
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
