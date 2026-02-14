'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Employee } from '@/lib/types';
import { Modal } from '@/components/ui/modal';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { toast } from '@/components/ui/toast';

const GRADIENTS = [
  { value: 'linear-gradient(135deg,#6c5ce7,#a29bfe)', label: 'Roxo' },
  { value: 'linear-gradient(135deg,#fdcb6e,#e8a817)', label: 'Amarelo' },
  { value: 'linear-gradient(135deg,#e17055,#d63031)', label: 'Vermelho' },
  { value: 'linear-gradient(135deg,#00b894,#00a381)', label: 'Verde' },
  { value: 'linear-gradient(135deg,#0984e3,#6c5ce7)', label: 'Azul' },
];

interface Props {
  employees: Employee[];
}

type FormData = {
  name: string;
  initials: string;
  role: string;
  department: string;
  manager_code: string;
  avatar_gradient: string;
  empresa: string;
  business_partner: string;
  diretoria: string;
  elegibilidade: string;
  gestor_nome: string;
  employee_code: string;
  admissao: string;
  grade: string;
  categoria: string;
  resumo_cat: string;
  genero: string;
  super_sr: string;
  super_val: string;
  gs: string;
};

const emptyForm: FormData = {
  name: '',
  initials: '',
  role: '',
  department: '',
  manager_code: '',
  avatar_gradient: GRADIENTS[0].value,
  empresa: '',
  business_partner: '',
  diretoria: '',
  elegibilidade: '',
  gestor_nome: '',
  employee_code: '',
  admissao: '',
  grade: '',
  categoria: '',
  resumo_cat: '',
  genero: '',
  super_sr: '',
  super_val: '',
  gs: '',
};

export function EmployeeTable({ employees }: Props) {
  const router = useRouter();
  const [showForm, setShowForm] = useState(false);
  const [editId, setEditId] = useState<number | null>(null);
  const [deleteId, setDeleteId] = useState<number | null>(null);
  const [form, setForm] = useState<FormData>(emptyForm);
  const [loading, setLoading] = useState(false);

  function openCreate() {
    setEditId(null);
    setForm(emptyForm);
    setShowForm(true);
  }

  function openEdit(emp: Employee) {
    setEditId(emp.id);
    setForm({
      name: emp.name,
      initials: emp.initials,
      role: emp.role,
      department: emp.department,
      manager_code: emp.manager_code,
      avatar_gradient: emp.avatar_gradient,
      empresa: emp.empresa || '',
      business_partner: emp.business_partner || '',
      diretoria: emp.diretoria || '',
      elegibilidade: emp.elegibilidade || '',
      gestor_nome: emp.gestor_nome || '',
      employee_code: emp.employee_code || '',
      admissao: emp.admissao || '',
      grade: emp.grade || '',
      categoria: emp.categoria || '',
      resumo_cat: emp.resumo_cat || '',
      genero: emp.genero || '',
      super_sr: emp.super_sr || '',
      super_val: emp.super_val || '',
      gs: emp.gs || '',
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
      const url = editId ? `/api/employees/${editId}` : '/api/employees';
      const method = editId ? 'PUT' : 'POST';
      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });
      if (!res.ok) throw new Error('Erro ao salvar');
      toast(editId ? 'Funcionário atualizado' : 'Funcionário criado', 'success');
      setShowForm(false);
      router.refresh();
    } catch {
      toast('Erro ao salvar funcionário', 'error');
    } finally {
      setLoading(false);
    }
  }

  async function handleDelete() {
    if (!deleteId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/employees/${deleteId}`, { method: 'DELETE' });
      if (!res.ok) throw new Error('Erro ao excluir');
      toast('Funcionário excluído', 'success');
      setDeleteId(null);
      router.refresh();
    } catch {
      toast('Erro ao excluir funcionário', 'error');
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
          Adicionar Funcionário
        </Button>
      </div>

      <div className="table-responsive">
        <table className="data-table">
          <thead>
            <tr>
              <th></th>
              <th>Nome</th>
              <th>Cargo</th>
              <th>Departamento</th>
              <th>Cód. Gestor</th>
              <th>Empresa</th>
              <th>Categoria</th>
              <th>Elegibilidade</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {employees.length === 0 && (
              <tr>
                <td colSpan={8} className="table-empty">
                  Nenhum funcionário cadastrado.
                </td>
              </tr>
            )}
            {employees.map((emp) => (
              <tr key={emp.id}>
                <td>
                  <div className="avatar avatar-sm" style={{ background: emp.avatar_gradient }}>
                    {emp.initials}
                  </div>
                </td>
                <td className="td-bold">{emp.name}</td>
                <td>{emp.role}</td>
                <td>{emp.department}</td>
                <td>{emp.manager_code}</td>
                <td>{emp.empresa}</td>
                <td>{emp.categoria}</td>
                <td>{emp.elegibilidade}</td>
                <td>
                  <div className="action-btns">
                    <Button variant="ghost" onClick={() => openEdit(emp)}>
                      Editar
                    </Button>
                    <Button variant="danger" onClick={() => setDeleteId(emp.id)}>
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
        title={editId ? 'Editar Funcionário' : 'Novo Funcionário'}
      >
        <form onSubmit={handleSubmit}>
          <div className="modal-body">
            <Input label="Nome" id="emp-name" value={form.name} onChange={(e) => set('name', e.target.value)} required />
            <Input label="Iniciais" id="emp-initials" value={form.initials} onChange={(e) => set('initials', e.target.value.toUpperCase())} maxLength={3} required />
            <Input label="Cargo" id="emp-role" value={form.role} onChange={(e) => set('role', e.target.value)} required />
            <Input label="Departamento" id="emp-dept" value={form.department} onChange={(e) => set('department', e.target.value)} required />
            <Input label="Código Gestor" id="emp-mgr" value={form.manager_code} onChange={(e) => set('manager_code', e.target.value)} />
            <Input label="Nome do Gestor" id="emp-gestor" value={form.gestor_nome} onChange={(e) => set('gestor_nome', e.target.value)} />
            <Input label="Empresa" id="emp-empresa" value={form.empresa} onChange={(e) => set('empresa', e.target.value)} />
            <Input label="Business Partner" id="emp-bp" value={form.business_partner} onChange={(e) => set('business_partner', e.target.value)} />
            <Input label="Diretoria" id="emp-dir" value={form.diretoria} onChange={(e) => set('diretoria', e.target.value)} />
            <Input label="Elegibilidade" id="emp-eleg" value={form.elegibilidade} onChange={(e) => set('elegibilidade', e.target.value)} />
            <Input label="Codigo Funcionario" id="emp-code" value={form.employee_code} onChange={(e) => set('employee_code', e.target.value)} />
            <Input label="Admissao" id="emp-admissao" value={form.admissao} onChange={(e) => set('admissao', e.target.value)} placeholder="AAAA-MM-DD" />
            <Input label="Grade" id="emp-grade" value={form.grade} onChange={(e) => set('grade', e.target.value)} />
            <Input label="Categoria" id="emp-cat" value={form.categoria} onChange={(e) => set('categoria', e.target.value)} />
            <Input label="Resumo Categoria" id="emp-resumo" value={form.resumo_cat} onChange={(e) => set('resumo_cat', e.target.value)} />
            <Input label="Genero" id="emp-genero" value={form.genero} onChange={(e) => set('genero', e.target.value)} />
            <Input label="Super SR" id="emp-supersr" value={form.super_sr} onChange={(e) => set('super_sr', e.target.value)} />
            <Input label="Super" id="emp-super" value={form.super_val} onChange={(e) => set('super_val', e.target.value)} />
            <Input label="GS" id="emp-gs" value={form.gs} onChange={(e) => set('gs', e.target.value)} />
            <div className="form-group">
              <label className="form-label">Cor do Avatar</label>
              <div className="gradient-picker">
                {GRADIENTS.map((g) => (
                  <button
                    key={g.value}
                    type="button"
                    className={`gradient-swatch ${form.avatar_gradient === g.value ? 'gradient-swatch-active' : ''}`}
                    style={{ background: g.value }}
                    onClick={() => set('avatar_gradient', g.value)}
                    title={g.label}
                  />
                ))}
              </div>
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
          <p>Tem certeza que deseja excluir este funcionário? Esta ação não pode ser desfeita.</p>
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
