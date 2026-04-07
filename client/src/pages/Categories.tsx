import React, { useState, useEffect } from 'react';
import { Plus, Edit2, X, AlertTriangle, Check, RefreshCw } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

type CategoriaTipo = 'alimentício' | 'escolar' | 'escritório' | 'uso coletivo';

interface Categoria {
  id: number;
  nome: string;
  tipo: CategoriaTipo;
  perecivel: boolean;
  prazo_alerta: number;
}

export default function Categories() {
  const { token } = useAuth(); 
  const [categorias, setCategorias] = useState<Categoria[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [editingId, setEditingId] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    nome: '',
    tipo: 'alimentício' as CategoriaTipo,
    perecivel: false,
    prazo_alerta: '' as string | number
  });

  const handleEdit = (cat: Categoria) => {
    setFormData({
      nome: cat.nome,
      tipo: cat.tipo,
      perecivel: cat.perecivel,
      prazo_alerta: cat.prazo_alerta.toString()
    });
    setEditingId(cat.id.toString());
    setShowModal(true);
  };

  const fetchCategories = async () => {
    try {
      const response = await fetch('/api/categories', {
        headers: { Authorization: `Bearer ${token}` }
      });
      if (!response.ok) throw new Error('Erro na resposta do servidor');
      const data = await response.json();
      setCategorias(data);
    } catch {
      setError('Erro ao carregar categorias');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => { 
    if (token) fetchCategories(); 
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    const method = editingId ? 'PUT' : 'POST';
    const url = editingId ? `/api/categories/${editingId}` : '/api/categories';

    try {
      const response = await fetch(url, {
        method: method, 
        headers: { 
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          prazo_alerta: formData.prazo_alerta !== '' 
            ? parseInt(formData.prazo_alerta.toString()) 
            : (formData.perecivel ? 3 : 30)
        })
      });

      if (!response.ok) throw new Error('Erro ao salvar');

      setSuccess(editingId ? 'Categoria atualizada!' : 'Categoria criada com sucesso!');
      setShowModal(false);
      setEditingId(null); 
      setFormData({ nome: '', tipo: 'alimentício', perecivel: false, prazo_alerta: '' });
      fetchCategories();
    } catch {
      setError('Erro ao salvar categoria');
    }
  };

  if (isLoading) {
    return (
      <div className="products-loading">
        <RefreshCw size={32} color="#3b82f6" className="products-spinner" />
        <p>Carregando categorias...</p>
      </div>
    );
  }

  return (
    <>
      <style>{productsStyles}</style>
      <div className="products-root">
        <div className="products-header">
          <div>
            <h1 className="products-title">Categorias</h1>
            <p className="products-subtitle">Gerencie as classificações para o estoque</p>
          </div>
          <button 
  className="products-btn-create" 
  onClick={() => {
    setEditingId(null);
    setFormData({ nome: '', tipo: 'alimentício', perecivel: false, prazo_alerta: '' });
    setShowModal(true);
  }}
>
  <Plus size={18} /> Nova Categoria
</button>
        </div>

        {success && <div className="products-message products-message--success"><Check size={18} />{success}</div>}
        {error && <div className="products-message products-message--error"><AlertTriangle size={18} />{error}</div>}

        <div className="products-table-wrapper">
          <table className="products-table">
            <thead>
              <tr>
                <th>Nome</th>
                <th>Tipo</th>
                <th>Perecível</th>
                <th>Alerta (dias)</th>
                <th>Ações</th>
              </tr>
            </thead>
            <tbody>
              {categorias.map(cat => (
                <tr key={cat.id} className="products-table__row">
                  <td className="products-table__cell"><span className="products-name">{cat.nome}</span></td>
                  <td className="products-table__cell">
                    <span className="products-categoria">{cat.tipo}</span>
                  </td>
                  <td className="products-table__cell">{cat.perecivel ? 'Sim' : 'Não'}</td>
                  <td className="products-table__cell">{cat.prazo_alerta} dias</td>
                  <td className="products-table__cell">
                     <button className="products-action-btn products-action-btn--edit"
                     onClick={() => handleEdit(cat)}
                     ><Edit2 size={16} /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="products-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="products-modal" onClick={e => e.stopPropagation()} style={{ maxWidth: '450px' }}>
              <div className="products-modal__header">
                <h2>{editingId ? 'Editar Categoria' : 'Nova Categoria'}</h2>
                <button onClick={() => setShowModal(false)} className="products-modal__close"><X size={20} /></button>
              </div>
              <form onSubmit={handleSubmit} className="products-form">
                <div className="products-form__group">
                  <label>Nome da Categoria *</label>
                  <input 
                    type="text" required className="products-input"
                    value={formData.nome}
                    onChange={e => setFormData({...formData, nome: e.target.value})}
                  />
                </div>
                <div className="products-form__group">
                  <label>Tipo *</label>
                  <select 
                    className="products-input"
                    value={formData.tipo}
                    onChange={e => setFormData({...formData, tipo: e.target.value as CategoriaTipo})}
                  >
                    <option value="alimentício">Alimentício</option>
                    <option value="escolar">Escolar</option>
                    <option value="escritório">Escritório</option>
                    <option value="uso coletivo">Uso Coletivo</option>
                  </select>
                </div>
                <div className="products-form__group">
                  <label>Prazo de Alerta (opcional)</label>
                  <input 
                    type="number" className="products-input" placeholder="Padrão: 3 p/ perecível, 30 p/ outros"
                    value={formData.prazo_alerta}
                    onChange={e => setFormData({...formData, prazo_alerta: e.target.value})}
                  />
                </div>
                <div className="products-form__group" style={{ flexDirection: 'row', gap: '10px', alignItems: 'center', marginTop: '10px' }}>
                  <input 
                    type="checkbox" id="perecivel"
                    checked={formData.perecivel}
                    onChange={e => setFormData({...formData, perecivel: e.target.checked})}
                  />
                  <label htmlFor="perecivel" style={{ cursor: 'pointer' }}>Esta categoria é perecível?</label>
                </div>
                <button type="submit" className="products-btn-submit" style={{ marginTop: '10px' }}>{editingId ? 'Salvar Alterações' : 'Criar Categoria'}</button>
              </form>
            </div>
          </div>
        )}
      </div>
    </>
  );
}

const productsStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .products-root {
    flex: 1;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    position: relative;
    overflow-x: hidden;
    font-family: 'DM Sans', sans-serif;
    padding: 36px 28px;
  }

  .products-loading {
    flex: 1;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    gap: 16px;
    color: #64748b;
  }

  .products-spinner {
    animation: products-spin 1.1s linear infinite;
  }

  @keyframes products-spin {
    to { transform: rotate(360deg); }
  }

  .products-header {
    display: flex;
    justify-content: space-between;
    align-items: flex-start;
    gap: 24px;
    margin-bottom: 32px;
    flex-wrap: wrap;
  }

  .products-title {
    font-family: 'Sora', sans-serif;
    font-size: 28px;
    font-weight: 800;
    color: #0f172a;
    letter-spacing: -0.02em;
    margin-bottom: 8px;
  }

  .products-subtitle {
    font-size: 14px;
    color: #64748b;
  }

  .products-btn-create {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 20px;
    border-radius: 12px;
    border: none;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.15s;
    box-shadow: 0 4px 12px rgba(37, 99, 235, 0.35);
  }

  .products-btn-create:hover {
    opacity: 0.88;
    transform: translateY(-2px);
  }

  .products-message {
    display: flex;
    align-items: center;
    gap: 12px;
    padding: 14px 18px;
    border-radius: 12px;
    margin-bottom: 20px;
    font-size: 14px;
    font-weight: 500;
    animation: products-slideDown 0.3s ease;
  }

  @keyframes products-slideDown {
    from { opacity: 0; transform: translateY(-10px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .products-message--success {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
    border: 1px solid rgba(16, 185, 129, 0.2);
  }

  .products-message--error {
    background: rgba(244, 63, 94, 0.12);
    color: #be123c;
    border: 1px solid rgba(244, 63, 94, 0.2);
  }

  .products-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 24px;
    flex-wrap: wrap;
  }

  .products-search {
    flex: 1;
    min-width: 200px;
    display: flex;
    align-items: center;
    gap: 10px;
    padding: 11px 14px;
    background: #fff;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    color: #64748b;
  }

  .products-search-input {
    flex: 1;
    border: none;
    background: transparent;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0f172a;
    outline: none;
  }

  .products-search-input::placeholder {
    color: #94a3b8;
  }

  .products-filter-select {
    padding: 10px 14px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 12px;
    background: #fff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0f172a;
    cursor: pointer;
    transition: border-color 0.15s;
  }

  .products-filter-select:focus {
    outline: none;
    border-color: #2563eb;
  }

  .products-table-wrapper {
    background: #ffffff;
    border: 1px solid rgba(59, 130, 246, 0.15);
    border-radius: 16px;
    overflow: hidden;
    box-shadow: 0 4px 16px rgba(0, 0, 0, 0.06);
    margin-bottom: 24px;
  }

  .products-table {
    width: 100%;
    border-collapse: collapse;
  }

  .products-table thead {
    background: rgba(59, 130, 246, 0.08);
    border-bottom: 1px solid rgba(59, 130, 246, 0.15);
  }

  .products-table th {
    padding: 16px 18px;
    text-align: left;
    font-size: 12px;
    font-weight: 700;
    color: #475569;
    letter-spacing: 0.05em;
    text-transform: uppercase;
  }

  .products-table__row {
    border-bottom: 1px solid rgba(59, 130, 246, 0.08);
    transition: background 0.15s;
  }

  .products-table__row:hover {
    background: rgba(59, 130, 246, 0.04);
  }

  .products-table__cell {
    padding: 16px 18px;
    font-size: 14px;
    color: #0f172a;
  }

  .products-codigo {
    font-family: monospace;
    font-weight: 600;
    color: #2563eb;
    font-size: 13px;
  }

  .products-name {
    font-weight: 600;
    color: #0f172a;
  }

  .products-categoria {
    font-size: 13px;
    padding: 4px 10px;
    background: rgba(59, 130, 246, 0.12);
    border-radius: 6px;
    color: #1e40af;
  }

  .products-amount {
    display: flex;
    align-items: center;
    gap: 8px;
  }

  .products-amount-value {
    font-weight: 700;
    font-family: 'Sora', sans-serif;
    font-size: 16px;
  }

  .products-status {
    display: inline-flex;
    align-items: center;
    gap: 6px;
    padding: 6px 12px;
    border-radius: 8px;
    font-size: 12px;
    font-weight: 600;
  }

  .products-status--active {
    background: rgba(16, 185, 129, 0.12);
    color: #059669;
  }

  .products-status--active::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #10b981;
  }

  .products-status--inactive {
    background: rgba(148, 163, 184, 0.12);
    color: #64748b;
  }

  .products-status--inactive::before {
    content: '';
    display: inline-block;
    width: 6px;
    height: 6px;
    border-radius: 50%;
    background: #94a3b8;
  }

  .products-alert-badge {
    display: block;
    font-size: 10px;
    color: #dc2626;
    font-weight: 700;
    margin-top: 4px;
  }

  .products-actions {
    display: flex;
    gap: 8px;
  }

  .products-action-btn {
    width: 36px;
    height: 36px;
    border-radius: 8px;
    border: none;
    display: flex;
    align-items: center;
    justify-content: center;
    cursor: pointer;
    transition: opacity 0.18s, background 0.18s;
    flex-shrink: 0;
  }

  .products-action-btn:disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .products-action-btn--edit {
    background: rgba(59, 130, 246, 0.12);
    color: #2563eb;
  }

  .products-action-btn--edit:hover:not(:disabled) {
    background: rgba(59, 130, 246, 0.2);
  }

  .products-action-btn--delete {
    background: rgba(244, 63, 94, 0.12);
    color: #dc2626;
  }

  .products-action-btn--delete:hover {
    background: rgba(244, 63, 94, 0.2);
  }

  .products-action-btn--view {
    background: rgba(107, 114, 128, 0.12);
    color: #6b7280;
  }

  .products-empty {
    text-align: center;
    padding: 80px 20px;
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 16px;
  }

  .products-empty-title {
    font-size: 16px;
    font-weight: 600;
    color: #64748b;
    margin-top: 16px;
  }

  .products-empty-sub {
    font-size: 13px;
    color: #94a3b8;
  }

  .products-pagination {
    display: flex;
    align-items: center;
    justify-content: center;
    gap: 16px;
    margin-top: 24px;
  }

  .products-pagination__btn {
    padding: 10px 16px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    background: #fff;
    color: #1e40af;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .products-pagination__btn:hover:not(:disabled) {
    opacity: 0.7;
  }

  .products-pagination__btn:disabled {
    opacity: 0.4;
    cursor: not-allowed;
  }

  .products-pagination__info {
    font-size: 14px;
    color: #64748b;
  }

  .products-modal-overlay {
    position: fixed;
    top: 0;
    left: 0;
    right: 0;
    bottom: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 1000;
    animation: products-fadeIn 0.2s ease;
  }

  @keyframes products-fadeIn {
    from { opacity: 0; }
    to { opacity: 1; }
  }

  .products-modal {
    background: #ffffff;
    border-radius: 16px;
    box-shadow: 0 20px 60px rgba(0, 0, 0, 0.3);
    max-width: 600px;
    width: 90%;
    max-height: 90vh;
    overflow-y: auto;
    animation: products-slideUp 0.3s ease;
  }

  @keyframes products-slideUp {
    from { opacity: 0; transform: translateY(20px); }
    to { opacity: 1; transform: translateY(0); }
  }

  .products-modal__header {
    display: flex;
    justify-content: space-between;
    align-items: center;
    padding: 24px;
    border-bottom: 1px solid rgba(59, 130, 246, 0.1);
  }

  .products-modal__header h2 {
    font-family: 'Sora', sans-serif;
    font-size: 20px;
    font-weight: 700;
    color: #0f172a;
  }

  .products-modal__close {
    width: 36px;
    height: 36px;
    border: none;
    background: transparent;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    border-radius: 8px;
    transition: background 0.15s;
    color: #64748b;
  }

  .products-modal__close:hover {
    background: rgba(59, 130, 246, 0.1);
  }

  .products-form {
    padding: 24px;
    display: flex;
    flex-direction: column;
    gap: 18px;
  }

  .products-form__grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 16px;
  }

  .products-form__group {
    display: flex;
    flex-direction: column;
    gap: 8px;
  }

  .products-form__group label {
    font-size: 14px;
    font-weight: 600;
    color: #0f172a;
  }

  .products-input {
    padding: 11px 14px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    color: #0f172a;
    transition: border-color 0.15s, background 0.15s;
    background: #f8fafc;
  }

  .products-input:focus {
    outline: none;
    border-color: #2563eb;
    background: #ffffff;
  }

  .products-form__actions {
    display: flex;
    gap: 12px;
    margin-top: 12px;
  }

  .products-btn-cancel {
    flex: 1;
    padding: 11px 16px;
    border: 1px solid rgba(59, 130, 246, 0.2);
    border-radius: 10px;
    background: transparent;
    color: #475569;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .products-btn-cancel:hover {
    opacity: 0.7;
  }

  .products-btn-submit {
    flex: 1;
    padding: 11px 16px;
    border: none;
    border-radius: 10px;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #ffffff;
    font-family: 'DM Sans', sans-serif;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.15s;
  }

  .products-btn-submit:hover {
    opacity: 0.88;
  }

  @media (max-width: 640px) {
    .products-root {
      padding: 20px 16px;
    }

    .products-header {
      flex-direction: column;
    }

    .products-title {
      font-size: 24px;
    }

    .products-form__grid {
      grid-template-columns: 1fr;
    }

    .products-filters {
      flex-direction: column;
    }

    .products-search {
      min-width: auto;
    }

    .products-table {
      font-size: 12px;
    }

    .products-table th, .products-table__cell {
      padding: 12px 10px;
    }

    .products-modal {
      width: 95%;
    }
  }
`