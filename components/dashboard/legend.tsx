export function Legend() {
  return (
    <div className="legend">
      <div className="legend-item">
        <div className="swatch" style={{ background: 'var(--green)' }} />
        Concluído
      </div>
      <div className="legend-item">
        <div className="swatch" style={{ background: 'var(--amber)' }} />
        Em Andamento
      </div>
      <div className="legend-item">
        <div className="swatch" style={{ background: 'var(--red)' }} />
        Não Iniciado
      </div>
    </div>
  );
}
