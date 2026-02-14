'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Employee, Evaluation } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select } from '@/components/ui/select';
import { toast } from '@/components/ui/toast';

const STATUS_OPTIONS = [
  { value: 'concluido', label: 'Concluído' },
  { value: 'em_andamento', label: 'Em Andamento' },
  { value: 'nao_iniciado', label: 'Não Iniciado' },
];

const STATUS_CLS: Record<string, string> = {
  concluido: 'done',
  em_andamento: 'wip',
  nao_iniciado: 'notyet',
};

const STATUS_LABEL: Record<string, string> = {
  concluido: 'Concluído',
  em_andamento: 'Em Andamento',
  nao_iniciado: 'Não Iniciado',
};

interface Props {
  evaluations: (Evaluation & { employee_name?: string })[];
  employees: Employee[];
}

type FormData = {
  employee_id: string;
  status: string;
  category: string;
  score: string;
  notes: string;
  evaluated_at: string;
};

const emptyForm: FormData = {
  employee_id: '',
  status: '',
  category: '',
  score: '',
  notes: '',
  evaluated_at: '',
};

export function EvaluationTable({ evaluations, employees }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  const employeeOptions = employees.map((e) => ({ value: String(e.id), label: e.name }));

  const employeeMap = new Map(employees.map((e) => [e.id, e.name]));

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(ev: Evaluation) {
    setEditId(ev.id);
    setForm({
      employee_id: String(ev.employee_id),
      status: ev.status,
      category: ev.category,
      score: ev.score !== null ? String(ev.score) : '',
      notes: ev.notes ?? '',
      evaluated_at: ev.evaluated_at ?? '',
    });
    setShowForm(true);
  }

  function set(field: keyof FormData, value: string) {
    setForm((prev) => ({ ...prev, [field]: value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const payload = {
        employee_id: Number(form.employee_id),
        status: form.status,
        category: form.category,
        score: form.score ? Number(form.score) : null,
        notes: form.notes || null,
        evaluated_at: form.evaluated_at || null,
      };
      const url = editId ? `/api/evaluations/${editId}` : '/api/evaluations';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast(editId ? 'Avaliação atualizada' : 'Avaliação criada', 'success');
      setShowForm(false);
      router.refresh();
    } catch {
      toast('Erro ao salvar avaliação', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/evaluations/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      toast('Avaliação excluída', 'success');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast('Erro ao excluir avaliação', 'error');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <div className="table-header">
        <Button onClick={openCreate}>
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" style={{ marginRight: 6 }}>
            <path d="M8 3v10M3 8h10" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
          </svg>
          Adicionar Avaliação
        </Button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Funcionário</th>
              <th>Status</th>
              <th>Categoria</th>
              <th>Nota</th>
              <th>Data</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {evaluations.length === 0 && (
              <tr>
                <td colSpan={7} className="table-empty">
                  Nenhuma avaliação cadastrada.
                </td>
              </tr>
            )}
            {evaluations.map((ev) => (
              <tr key={ev.id}>
                <td>#{ev.id}</td>
                <td className="td-bold">{ev.employee_name ?? employeeMap.get(ev.employee_id) ?? `#${ev.employee_id}`}</td>
                <td>
                  <span className={`status-pill ${STATUS_CLS[ev.status] ?? ''}`}>
                    {STATUS_LABEL[ev.status] ?? ev.status}
                  </span>
                </td>
                <td>{ev.category}</td>
                <td>{ev.score !== null ? ev.score : '—'}</td>
                <td>{ev.evaluated_at ?? '—'}</td>
                <td>
                  <div className="action-btns">
                    <Button variant="ghost" onClick={() => openEdit(ev)}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => setDeleteId(ev.id)}>
                      Excluir
                    </Button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Create/Edit Modal */}
      <Modal
        open={showForm}
        onClose={() => setShowForm(false)}
        title={editId ? 'Editar Avaliação' : 'Nova Avaliação'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <Select
              label="Funcionário"
              id="ev-employee"
              options={employeeOptions}
              value={form.employee_id}
              onChange={(e) => set('employee_id', e.target.value)}
              required
            />
            <Select
              label="Status"
              id="ev-status"
              options={STATUS_OPTIONS}
              value={form.status}
              onChange={(e) => set('status', e.target.value)}
              required
            />
            <Input label="Categoria" id="ev-category" value={form.category} onChange={(e) => set('category', e.target.value)} required />
            <Input label="Nota" id="ev-score" type="number" step="0.1" min="0" max="100" value={form.score} onChange={(e) => set('score', e.target.value)} />
            <Input label="Data da Avaliação" id="ev-date" type="date" value={form.evaluated_at} onChange={(e) => set('evaluated_at', e.target.value)} />
            <div className="form-group">
              <label className="form-label" htmlFor="ev-notes">Observações</label>
              <textarea
                className="form-input"
                id="ev-notes"
                rows={3}
                value={form.notes}
                onChange={(e) => set('notes', e.target.value)}
              />
            </div>
          </div>
          <div className="modal-footer">
            <Button variant="ghost" type="button" onClick={() => setShowForm(false)}>
              Cancelar
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? 'Salvando...' : 'Salvar'}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation */}
      <Modal open={deleteId !== null} onClose={() => setDeleteId(null)} title="Confirmar Exclusão">
        <div className="modal-body">
          <p>Tem certeza que deseja excluir esta avaliação? Esta ação não pode ser desfeita.</p>
        </div>
        <div className="modal-footer">
          <Button variant="ghost" onClick={() => setDeleteId(null)}>
            Cancelar
          </Button>
          <Button variant="danger" onClick={handleDelete} disabled={loading}>
            {loading ? 'Excluindo...' : 'Excluir'}
          </Button>
        </div>
      </Modal>
    </>
  );
}
