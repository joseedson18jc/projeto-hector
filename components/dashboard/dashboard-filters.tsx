'use client';

import { useSearchParams, useRouter } from 'next/navigation';
import { useRef } from 'react';
import type { FilterOptions } from '@/lib/types';
import { toast } from '@/components/ui/toast';

interface DashboardFiltersProps {
  filterOptions: FilterOptions;
}

export function DashboardFilters({ filterOptions }: DashboardFiltersProps) {
  const searchParams = useSearchParams();
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  function updateFilter(key: string, value: string) {
    const params = new URLSearchParams(searchParams.toString());
    if (value) {
      params.set(key, value);
    } else {
      params.delete(key);
    }
    router.push(`/?${params.toString()}`);
  }

  async function handleImport() {
    fileRef.current?.click();
  }

  async function handleFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append('file', file);

    try {
      const res = await fetch('/api/import', { method: 'POST', body: formData });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Erro na importacao');
      toast(`Importados: ${data.imported} funcionarios`, 'success');
      if (data.errors?.length) {
        toast(`${data.errors.length} erros encontrados`, 'error');
      }
      router.refresh();
    } catch (err) {
      toast(err instanceof Error ? err.message : 'Erro ao importar', 'error');
    }
    // Reset so same file can be re-imported
    e.target.value = '';
  }

  function handleExport() {
    const params = new URLSearchParams(searchParams.toString());
    window.location.href = `/api/export?${params.toString()}`;
  }

  const filters = [
    { key: 'bp', label: 'Business Partner', options: filterOptions.business_partners },
    { key: 'diretoria', label: 'Diretoria', options: filterOptions.diretorias },
    { key: 'empresa', label: 'Empresa', options: filterOptions.empresas },
    { key: 'elegibilidade', label: 'Elegibilidade', options: filterOptions.elegibilidades },
    { key: 'categoria', label: 'Categoria', options: filterOptions.categorias },
    { key: 'genero', label: 'Genero', options: filterOptions.generos },
    { key: 'gs', label: 'GS', options: filterOptions.gs_list },
  ];

  return (
    <div className="dashboard-filters">
      <div className="filter-row">
        {filters.map((f) => (
          <div className="filter-group" key={f.key}>
            <label className="filter-label">{f.label}</label>
            <select
              className="filter-select"
              value={searchParams.get(f.key) || ''}
              onChange={(e) => updateFilter(f.key, e.target.value)}
            >
              <option value="">Todos</option>
              {f.options.map((opt) => (
                <option key={opt} value={opt}>
                  {opt}
                </option>
              ))}
            </select>
          </div>
        ))}
      </div>
      <div className="dashboard-actions">
        <input
          ref={fileRef}
          type="file"
          accept=".xlsx,.xls"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />
        <button className="btn btn-ghost" onClick={handleImport}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 2v8M4 6l4-4 4 4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Importar Excel
        </button>
        <button className="btn btn-primary" onClick={handleExport}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path d="M8 10V2M4 6l4 4 4-4" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
            <path d="M2 12h12" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
          Exportar Excel
        </button>
      </div>
    </div>
  );
}
