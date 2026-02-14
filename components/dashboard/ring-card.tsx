'use client';

import { Doughnut } from 'react-chartjs-2';
import { Chart as ChartJS, ArcElement } from 'chart.js';

ChartJS.register(ArcElement);

interface RingCardProps {
  completionRate: number;
}

export function RingCard({ completionRate }: RingCardProps) {
  const remaining = 100 - completionRate;

  return (
    <div className="ring-card">
      <div className="label">Taxa de Conclusão</div>
      <div className="ring-wrapper">
        <Doughnut
          data={{
            datasets: [
              {
                data: [completionRate, remaining],
                backgroundColor: ['#6366f1', '#f0f1f3'],
                borderWidth: 0,
                borderRadius: 6,
              },
            ],
          }}
          options={{
            cutout: '78%',
            responsive: false,
            plugins: {
              legend: { display: false },
              tooltip: { enabled: false },
            },
            animation: { animateRotate: true, duration: 1200 },
          }}
          width={160}
          height={160}
        />
        <div className="ring-center">
          <div className="pct">{completionRate}%</div>
          <div className="sub">concluído</div>
        </div>
      </div>
    </div>
  );
}
