'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import type { ProgressGroupBy } from '@/lib/types';

interface ProgressToggleProps {
  activeView: ProgressGroupBy;
}

export function ProgressToggle({ activeView }: ProgressToggleProps) {
  const searchParams = useSearchParams();
  const router = useRouter();

  function setView(view: ProgressGroupBy) {
    const params = new URLSearchParams(searchParams.toString());
    if (view === 'area') {
      params.delete('view');
    } else {
      params.set('view', view);
    }
    router.push(`/?${params.toString()}`);
  }

  return (
    <div className="progress-toggle">
      <button
        className={`toggle-btn ${activeView === 'area' ? 'toggle-active' : ''}`}
        onClick={() => setView('area')}
      >
        Por Area
      </button>
      <button
        className={`toggle-btn ${activeView === 'empresa' ? 'toggle-active' : ''}`}
        onClick={() => setView('empresa')}
      >
        Por Empresa
      </button>
    </div>
  );
}
