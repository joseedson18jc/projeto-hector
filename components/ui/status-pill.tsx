import type { Evaluation } from '@/lib/types';

const STATUS_MAP: Record<Evaluation['status'], { label: string; cls: string }> = {
  concluido: { label: 'Concluído', cls: 'done' },
  em_andamento: { label: 'Em Andamento', cls: 'wip' },
  nao_iniciado: { label: 'Não Iniciado', cls: 'notyet' },
};

interface StatusPillProps {
  status: Evaluation['status'];
}

export function StatusPill({ status }: StatusPillProps) {
  const { label, cls } = STATUS_MAP[status];
  return <span className={`status-pill ${cls}`}>{label}</span>;
}
