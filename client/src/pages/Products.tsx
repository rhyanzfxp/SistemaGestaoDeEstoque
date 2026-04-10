import { useEffect, useState } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { Package, Plus, Edit2, Eye, AlertTriangle, X, Check, Trash2, RefreshCw, Search, Filter } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

interface Produto {
  id: string
  codigo: string
  nome: string
  data_validade?: string
  categoria_id: string
  categoria_nome?: string
  fornecedor_id: string
  fornecedor_nome?: string
  quantidade_atual: number
  estoque_minimo: number
  ativo: boolean
  estoque_status?: 'crítico' | 'normal'
  created_at?: string
}

interface Categoria {
  id: string
  nome: string
  descricao?: string
}

interface Fornecedor {
  id: string
  nome: string
  email?: string
  telefone?: string
}

interface FormData {
  codigo: string
  nome: string
  data_validade?: string
  categoria_id: string
  fornecedor_id: string
  quantidade_atual: number | string
  estoque_minimo: number | string
  ativo?: boolean
}

interface PaginationInfo {
  page: number
  limit: number
  total: number
  totalPages: number
}

export default function Products() {
  const { token, user } = useAuth()
  const [showMovModal, setShowMovModal] = useState(false);
  const [movData, setMovData] = useState({ tipo: 'ENTRADA', quantidade: '' });
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [categorias, setCategorias] = useState<Categoria[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [editingId, setEditingId] = useState<string | null>(null)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [showConfirmInactivate, setShowConfirmInactivate] = useState(false)
  const [productToDelete, setProductToDelete] = useState<string | null>(null)

  const [search, setSearch] = useState('')
  const [selectedCategory, setSelectedCategory] = useState('')
  const [selectedStatus, setSelectedStatus] = useState('')
  const [currentPage, setCurrentPage] = useState(1)

  const [formData, setFormData] = useState<FormData>({
    codigo: '',
    nome: '',
    data_validade: '',
    categoria_id: '',
    fornecedor_id: '',
    quantidade_atual: '',
    estoque_minimo: '',
    ativo: true
  })

  const [pagination, setPagination] = useState<PaginationInfo>({
    page: 1,
    limit: 10,
    total: 0,
    totalPages: 0
  })

  const isAdmin = user?.perfil === 'ADMIN' || user?.perfil === 'GESTAO'
  const canCreate = isAdmin

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const [categoriasRes, fornecedoresRes] = await Promise.all([
          fetch('/api/produtos/categorias', { headers: { Authorization: `Bearer ${token}` } }),
          fetch('/api/produtos/fornecedores', { headers: { Authorization: `Bearer ${token}` } })
        ])

        const categoriasData = await categoriasRes.json()
        const fornecedoresData = await fornecedoresRes.json()

        setCategorias(categoriasData)
        setFornecedores(fornecedoresData)

        if (categoriasData.length > 0) {
          setFormData(prev => ({ ...prev, categoria_id: categoriasData[0].id }))
        }
        if (fornecedoresData.length > 0) {
          setFormData(prev => ({ ...prev, fornecedor_id: fornecedoresData[0].id }))
        }
      } catch (err) {
        console.error('Erro ao carregar dados iniciais:', err)
      }
    }

    fetchInitialData()
  }, [token])

  const fetchProducts = async (page = 1) => {
    try {
      const params = new URLSearchParams()
      params.set('page', page.toString())
      params.set('limit', '10')

      if (search) params.set('search', search)
      if (selectedCategory) params.set('categoria_id', selectedCategory)
      if (selectedStatus) params.set('status', selectedStatus)

      const response = await fetch(`/api/produtos?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao buscar produtos')
      const data = await response.json()
      setProdutos(data.data)
      setPagination(data.pagination)
      setCurrentPage(page)
    } catch (err) {
      setError('Erro ao carregar produtos')
      console.error(err)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    setIsLoading(true)
    const timer = setTimeout(() => {
      fetchProducts(1)
    }, 300)
    return () => clearTimeout(timer)
  }, [search, selectedCategory, selectedStatus, token])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

    try {
      if (!formData.codigo || !formData.nome || !formData.categoria_id || !formData.fornecedor_id || formData.quantidade_atual === '' || formData.estoque_minimo === '') {
        setError('Preencha todos os campos obrigatórios')
        return
      }

      const method = editingId ? 'PUT' : 'POST'
      const url = editingId ? `/api/produtos/${editingId}` : '/api/produtos'

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          ...formData,
          quantidade_atual: parseInt(formData.quantidade_atual.toString()),
          estoque_minimo: parseInt(formData.estoque_minimo.toString()),
          ativo: formData.ativo ?? true
        })
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro na operação')
      }

      setSuccess(editingId ? 'Produto atualizado com sucesso!' : 'Produto criado com sucesso!')
      resetForm()
      setShowModal(false)
      fetchProducts(currentPage)
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar produto')
    }
  }

  const handleMovimentar = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccess('');

    try {
      if (!selectedProductId) return;

      const response = await fetch(`/api/produtos/${selectedProductId}/movimentar`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify({
          tipo: movData.tipo,
          quantidade: parseInt(movData.quantidade)
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Erro ao movimentar estoque');
      }

      setSuccess('Estoque atualizado com sucesso!');
      setShowMovModal(false);
      setMovData({ tipo: 'ENTRADA', quantidade: '' });
      fetchProducts(currentPage); 
    } catch (err) {
      const errorObj = err as Error;
      setError(errorObj.message);
    }
  };

  const handleEdit = (p: Produto) => {
    // Formatar data para o input type="date" (YYYY-MM-DD)
    const dataFormatada = p.data_validade ? p.data_validade.split('T')[0] : ''
    
    setFormData({
      codigo: p.codigo,
      nome: p.nome,
      data_validade: dataFormatada,
      categoria_id: p.categoria_id,
      fornecedor_id: p.fornecedor_id,
      quantidade_atual: p.quantidade_atual,
      estoque_minimo: p.estoque_minimo,
      ativo: p.ativo
    })
    setEditingId(p.id)
    setShowModal(true)
    setError('')
    setSuccess('')
  }

  const handleExcluir = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/produtos/${productToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      const data = await response.json()

      if (response.status === 422) {
        // Produto tem movimentações, mostrar opção de inativar
        setError(data.error)
        setShowConfirmDelete(false)
        
        // Mostrar modal de inativação (mantém productToDelete)
        setTimeout(() => {
          setShowConfirmInactivate(true)
        }, 100)
        return
      }

      if (!response.ok) throw new Error(data.error || 'Erro ao excluir')

      setSuccess('Produto excluído com sucesso!')
      fetchProducts(currentPage)
      setProductToDelete(null)
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir produto')
      setProductToDelete(null)
    }
  }

  const handleInativar = async () => {
    if (!productToDelete) return

    try {
      const response = await fetch(`/api/produtos/${productToDelete}/inativar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao inativar')

      setSuccess('Produto inativado com sucesso!')
      fetchProducts(currentPage)
    } catch (err: any) {
      setError(err.message || 'Erro ao inativar produto')
    } finally {
      setProductToDelete(null)
    }
  }

  const resetForm = () => {
    setFormData({
      codigo: '',
      nome: '',
      data_validade: '',
      categoria_id: categorias[0]?.id || '',
      fornecedor_id: fornecedores[0]?.id || '',
      quantidade_atual: '',
      estoque_minimo: '',
      ativo: true
    })
    setEditingId(null)
  }

  const closeModal = () => {
    setShowModal(false)
    resetForm()
    setError('')
    setSuccess('')
  }

  if (isLoading && produtos.length === 0) {
    return (
      <div className="products-loading">
        <style>{productsStyles}</style>
        <RefreshCw size={32} color="#3b82f6" className="products-spinner" />
        <p>Carregando produtos...</p>
      </div>
    )
  }

  return (
    <>
      <style>{productsStyles}</style>
      <div className="products-root">
        <div className="products-header">
          <div>
            <h1 className="products-title">Produtos</h1>
            <p className="products-subtitle">Gerencie o catálogo de produtos e estoque</p>
          </div>
          {canCreate && (
            <button
              onClick={() => {
                resetForm()
                setError('')
                setSuccess('')
                setShowModal(true)
              }}
              className="products-btn-create"
            >
              <Plus size={18} />
              Novo Produto
            </button>
          )}
        </div>

        {success && (
          <div className="products-message products-message--success">
            <Check size={18} />
            {success}
          </div>
        )}
        {error && (
          <div className="products-message products-message--error">
            <AlertTriangle size={18} />
            {error}
          </div>
        )}

        <div className="products-filters">
          <div className="products-search">
            <Search size={18} />
            <input
              type="text"
              placeholder="Buscar por nome ou código..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="products-search-input"
            />
          </div>

          <select
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="products-filter-select"
          >
            <option value="">Todas as categorias</option>
            {categorias.map(c => (
              <option key={c.id} value={c.id}>{c.nome}</option>
            ))}
          </select>

          <select
            value={selectedStatus}
            onChange={(e) => setSelectedStatus(e.target.value)}
            className="products-filter-select"
          >
            <option value="">Todos os status</option>
            <option value="ativo">Ativo</option>
            <option value="inativo">Inativo</option>
          </select>
        </div>

        <div className="products-table-wrapper">
          {produtos.length > 0 ? (
            <table className="products-table">
              <thead>
                <tr>
                  <th>Código</th>
                  <th>Produto</th>
                  <th>Fornecedor</th>
                  <th>Categoria</th>
                  <th>Saldo atual</th>
                  <th>Estoque mínimo</th>
                  <th>Status</th>
                  <th>Ações</th>
                </tr>
              </thead>
              <tbody>
                {produtos.map((p) => {
                  // Calcular status de validade
                  let validadeStatus: 'vencido' | 'proximo' | 'ok' = 'ok'
                  if (p.data_validade) {
                    const hoje = new Date()
                    hoje.setHours(0, 0, 0, 0)
                    const [ano, mes, dia] = p.data_validade.split('T')[0].split('-')
                    const dataValidade = new Date(parseInt(ano), parseInt(mes) - 1, parseInt(dia))
                    dataValidade.setHours(0, 0, 0, 0)
                    
                    const dataLimite = new Date(hoje)
                    dataLimite.setDate(hoje.getDate() + 15)
                    
                    if (dataValidade < hoje) {
                      validadeStatus = 'vencido'
                    } else if (dataValidade <= dataLimite) {
                      validadeStatus = 'proximo'
                    }
                  }
                  
                  return (
                  <tr key={p.id} className="products-table__row" style={{
                    background: validadeStatus === 'vencido' ? 'rgba(244, 63, 94, 0.05)' : 
                                validadeStatus === 'proximo' ? 'rgba(251, 191, 36, 0.05)' : 
                                undefined
                  }}>
                    <td className="products-table__cell">
                      <span className="products-codigo">{p.codigo}</span>
                    </td>
                    <td className="products-table__cell">
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                        <span className="products-name">{p.nome}</span>
                        {p.data_validade && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <span style={{ fontSize: '12px', color: '#64748b' }}>
                              Validade: {p.data_validade.split('T')[0].split('-').reverse().join('/')}
                            </span>
                            {validadeStatus === 'vencido' && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#dc2626',
                                background: 'rgba(244, 63, 94, 0.15)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                VENCIDO
                              </span>
                            )}
                            {validadeStatus === 'proximo' && (
                              <span style={{
                                fontSize: '10px',
                                fontWeight: 700,
                                color: '#d97706',
                                background: 'rgba(251, 191, 36, 0.15)',
                                padding: '2px 8px',
                                borderRadius: '6px',
                                textTransform: 'uppercase',
                                letterSpacing: '0.5px'
                              }}>
                                VENCE EM BREVE
                              </span>
                            )}
                          </div>
                        )}
                      </div>
                    </td>
                    <td className="products-table__cell">{p.fornecedor_nome || '-'}</td>
                    <td className="products-table__cell">
                      <span className="products-categoria">{p.categoria_nome || '-'}</span>
                    </td>
                    <td className="products-table__cell">
                      <div className="products-amount">
                        <span className="products-amount-value">{p.quantidade_atual}</span>
                        {p.estoque_status === 'crítico' && (
                          <AlertTriangle size={14} color="#dc2626" />
                        )}
                      </div>
                    </td>
                    <td className="products-table__cell">{p.estoque_minimo}</td>
                    <td className="products-table__cell">
                      <span className={`products-status ${p.ativo ? 'products-status--active' : 'products-status--inactive'}`}>
                        {p.ativo ? 'Ativo' : 'Inativo'}
                      </span>
                      {p.estoque_status === 'crítico' && p.ativo && (
                        <span className="products-alert-badge">Estoque baixo</span>
                      )}
                    </td>
                    <td className="products-table__cell products-actions">
                      <button 
                      onClick={() => {
                        setSelectedProductId(p.id);
                        setShowMovModal(true);
                        }}
                        className="products-action-btn"
                        title="Movimentar"
                        style={{ background: 'rgba(16, 185, 129, 0.12)', color: '#059669', marginRight: '4px' }}
                        >
                          <RefreshCw size={16} />
                          </button>
                      <button
                        onClick={() => handleEdit(p)}
                        className="products-action-btn products-action-btn--edit"
                        title="Editar"
                        disabled={!canCreate}
                      >
                        <Edit2 size={16} />
                      </button>
                      {canCreate && (
                        <button
                          onClick={() => {
                            setProductToDelete(p.id)
                            setShowConfirmDelete(true)
                          }}
                          className="products-action-btn products-action-btn--delete"
                          title="Excluir"
                        >
                          <Trash2 size={16} />
                        </button>
                      )}
                      {!canCreate && (
                        <button
                          className="products-action-btn products-action-btn--view"
                          title="Visualizar"
                          disabled
                        >
                          <Eye size={16} />
                        </button>
                      )}
                    </td>
                  </tr>
                  )
                })}
              </tbody>
            </table>
          ) : (
            <div className="products-empty">
              <Package size={48} color="#94a3b8" />
              <p className="products-empty-title">Nenhum produto cadastrado</p>
              <p className="products-empty-sub">Clique em "Novo Produto" para começar</p>
            </div>
          )}
        </div>

        {pagination.totalPages > 1 && (
          <div className="products-pagination">
            <button
              onClick={() => fetchProducts(Math.max(1, currentPage - 1))}
              disabled={currentPage === 1}
              className="products-pagination__btn"
            >
              Anterior
            </button>
            <span className="products-pagination__info">
              Página {currentPage} de {pagination.totalPages}
            </span>
            <button
              onClick={() => fetchProducts(Math.min(pagination.totalPages, currentPage + 1))}
              disabled={currentPage === pagination.totalPages}
              className="products-pagination__btn"
            >
              Próxima
            </button>
          </div>
        )}

        {showModal && canCreate && (
          <div className="products-modal-overlay" onClick={closeModal}>
            <div className="products-modal" onClick={(e) => e.stopPropagation()}>
              <div className="products-modal__header">
                <h2>{editingId ? 'Editar Produto' : 'Novo Produto'}</h2>
                <button onClick={closeModal} className="products-modal__close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="products-form">
                <div className="products-form__grid">
                  <div className="products-form__group">
                    <label>Código *</label>
                    <input
                      type="text"
                      value={formData.codigo}
                      onChange={(e) => setFormData({ ...formData, codigo: e.target.value })}
                      placeholder="Ex: PRD001"
                      className="products-input"
                    />
                  </div>

                  <div className="products-form__group">
                    <label>Nome *</label>
                    <input
                      type="text"
                      value={formData.nome}
                      onChange={(e) => setFormData({ ...formData, nome: e.target.value })}
                      placeholder="Nome do produto"
                      className="products-input"
                    />
                  </div>

                  <div className="products-form__group">
                    <label>Data de Validade</label>
                    <input
                      type="date"
                      value={formData.data_validade}
                      onChange={(e) => setFormData({ ...formData, data_validade: e.target.value })}
                      className="products-input"
                    />
                  </div>

                  <div className="products-form__group">
                    <label>Categoria *</label>
                    <select
                      value={formData.categoria_id}
                      onChange={(e) => setFormData({ ...formData, categoria_id: e.target.value })}
                      className="products-input"
                    >
                      <option value="">Selecione uma categoria</option>
                      {categorias.map(c => (
                        <option key={c.id} value={c.id}>{c.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="products-form__group">
                    <label>Fornecedor *</label>
                    <select
                      value={formData.fornecedor_id}
                      onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                      className="products-input"
                    >
                      <option value="">Selecione um fornecedor</option>
                      {fornecedores.map(f => (
                        <option key={f.id} value={f.id}>{f.nome}</option>
                      ))}
                    </select>
                  </div>

                  <div className="products-form__group">
                    <label>Saldo Atual (unidades) *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.quantidade_atual}
                      onChange={(e) => setFormData({ ...formData, quantidade_atual: e.target.value })}
                      placeholder="0"
                      className="products-input"
                    />
                  </div>

                  <div className="products-form__group">
                    <label>Estoque Mínimo (unidades) *</label>
                    <input
                      type="number"
                      min="0"
                      value={formData.estoque_minimo}
                      onChange={(e) => setFormData({ ...formData, estoque_minimo: e.target.value })}
                      placeholder="0"
                      className="products-input"
                    />
                  </div>

                  <div className="products-form__group">
                    <label>Status *</label>
                    <select
                      value={formData.ativo ? 'ativo' : 'inativo'}
                      onChange={(e) => setFormData({ ...formData, ativo: e.target.value === 'ativo' })}
                      className="products-input"
                    >
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                <div className="products-form__actions">
                  <button type="button" onClick={closeModal} className="products-btn-cancel">
                    Cancelar
                  </button>
                  <button type="submit" className="products-btn-submit">
                    {editingId ? 'Atualizar' : 'Criar'} Produto
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
        {showMovModal && (
  <div className="products-modal-overlay" onClick={() => setShowMovModal(false)}>
    <div className="products-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: '400px' }}>
      <div className="products-modal__header">
        <h2>Movimentar Estoque</h2>
        <button onClick={() => setShowMovModal(false)} className="products-modal__close">
          <X size={20} />
        </button>
      </div>

      <form onSubmit={handleMovimentar} className="products-form">
        <div className="products-form__group">
          <label>Tipo de Operação</label>
          <select
            value={movData.tipo}
            onChange={(e) => setMovData({ ...movData, tipo: e.target.value })}
            className="products-input"
          >
            <option value="ENTRADA">Entrada (+)</option>
            <option value="SAIDA">Saída (-)</option>
          </select>
        </div>

        <div className="products-form__group">
          <label>Quantidade</label>
          <input
            type="number"
            min="1"
            required
            value={movData.quantidade}
            onChange={(e) => setMovData({ ...movData, quantidade: e.target.value })}
            placeholder="Digite a quantidade"
            className="products-input"
          />
        </div>

        <div className="products-form__actions">
          <button type="button" onClick={() => setShowMovModal(false)} className="products-btn-cancel">
            Cancelar
          </button>
          <button type="submit" className="products-btn-submit">
            Confirmar
          </button>
        </div>
      </form>
    </div>
  </div>
)}

        <ConfirmModal
          isOpen={showConfirmDelete}
          title="Excluir Produto"
          message="Tem certeza que deseja excluir este produto? Esta ação não pode ser desfeita."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          onConfirm={handleExcluir}
          onCancel={() => {
            setShowConfirmDelete(false)
            setProductToDelete(null)
          }}
          variant="danger"
        />

        <ConfirmModal
          isOpen={showConfirmInactivate}
          title="Inativar Produto"
          message="Este produto possui movimentações e não pode ser excluído. Deseja inativá-lo? O produto será mantido no histórico mas não aparecerá nas listagens."
          confirmText="Sim, inativar"
          cancelText="Cancelar"
          onConfirm={handleInativar}
          onCancel={() => {
            setShowConfirmInactivate(false)
            setProductToDelete(null)
          }}
          variant="warning"
        />
      </div>
    </>
  )
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