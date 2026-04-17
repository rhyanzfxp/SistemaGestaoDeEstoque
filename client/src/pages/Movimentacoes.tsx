import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ArrowUpRight, ArrowDownRight, Plus, X, Search, Filter, Calendar, Trash2, Edit2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'

interface Movimentacao {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  produto_id?: string
  produto_nome: string
  quantidade: number
  usuario_nome: string
  created_at: string
  observacao?: string
}

interface Entrada extends Movimentacao {
  fornecedor_nome: string
  fornecedor_id?: string
  numero_nf: string
}

interface Saida extends Movimentacao {
  motivo: string
}

interface Historico extends Movimentacao {
  categoria_nome: string
}

interface Produto {
  id: string
  nome: string
  quantidade_atual: number
}

interface Fornecedor {
  id: string
  nome: string
}

type TabType = 'entrada' | 'saida' | 'historico'

export default function Movimentacoes() {
  const { token } = useAuth()
  const [activeTab, setActiveTab] = useState<TabType>('entrada')
  const [showModal, setShowModal] = useState(false)
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState('')
  const [error, setError] = useState('')

 
  const [entradas, setEntradas] = useState<Entrada[]>([])
  const [saidas, setSaidas] = useState<Saida[]>([])
  const [historico, setHistorico] = useState<Historico[]>([])
  const [produtos, setProdutos] = useState<Produto[]>([])
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])

  
  const [formData, setFormData] = useState({
    produto_id: '',
    quantidade: '',
    fornecedor_id: '',
    numero_nf: '',
    motivo: '',
    data: new Date().toISOString().split('T')[0],
    observacao: ''
  })

  const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)

  
  const [searchTerm, setSearchTerm] = useState('')
  const [filterTipo, setFilterTipo] = useState('')
  const [filterData, setFilterData] = useState('')

  
  const [showConfirmDelete, setShowConfirmDelete] = useState(false)
  const [movToDelete, setMovToDelete] = useState<string | null>(null)
  const [editingMov, setEditingMov] = useState<string | null>(null)
  const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false)

  useEffect(() => {
    fetchProdutos()
    fetchFornecedores()
    fetchData()
  }, [activeTab, filterTipo, filterData])

  const fetchProdutos = async () => {
    try {
      const response = await fetch('/api/produtos?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setProdutos(data.data || [])
    } catch (err) {
      console.error('Erro ao carregar produtos:', err)
    }
  }

  const fetchFornecedores = async () => {
    try {
      const response = await fetch('/api/fornecedores?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()
      setFornecedores(data.data || [])
    } catch (err) {
      console.error('Erro ao carregar fornecedores:', err)
    }
  }

  const fetchData = async () => {
    setLoading(true)
    try {
      let url = '/api/movimentacoes'
      const params = new URLSearchParams()
      
      if (activeTab === 'entrada') {
        url = '/api/movimentacoes/entradas'
      } else if (activeTab === 'saida') {
        url = '/api/movimentacoes/saidas'
      }

      if (filterTipo && activeTab === 'historico') {
        params.set('tipo', filterTipo)
      }
      if (filterData) {
        params.set('data_inicio', filterData)
      }
      
      if (params.toString()) {
        url += '?' + params.toString()
      }

      const response = await fetch(url, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await response.json()

      if (activeTab === 'entrada') setEntradas(data.data || [])
      if (activeTab === 'saida') setSaidas(data.data || [])
      if (activeTab === 'historico') setHistorico(data.data || [])
    } catch (err) {
      console.error('Erro ao carregar dados:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleOpenModal = () => {
    setFormData({
      produto_id: '',
      quantidade: '',
      fornecedor_id: '',
      numero_nf: '',
      motivo: '',
      data: new Date().toISOString().split('T')[0],
      observacao: ''
    })
    setSelectedProduto(null)
    setEditingMov(null)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const handleEdit = async (mov: Entrada | Saida) => {
    let numero_nf = ''
    let motivo = ''
    let observacaoLimpa = ''
    let fornecedor_id = ''
    
    if (activeTab === 'entrada') {
      numero_nf = mov.observacao?.match(/NF:\s*(\S+)/)?.[1] || ''
      observacaoLimpa = mov.observacao?.replace(/^NF:\s*\S+\s*\n?/, '').trim() || ''
      
      fornecedor_id = (mov as Entrada).fornecedor_id || ''
    } else {
      motivo = mov.observacao?.match(/Motivo:\s*([^\n]+)/)?.[1] || ''
      observacaoLimpa = mov.observacao?.replace(/^Motivo:\s*[^\n]+\s*\n?/, '').trim() || ''
    }

    setFormData({
      produto_id: '', 
      quantidade: mov.quantidade.toString(),
      fornecedor_id,
      numero_nf,
      motivo,
      data: mov.created_at.split('T')[0],
      observacao: observacaoLimpa
    })
    setEditingMov(mov.id)
    setError('')
    setSuccess('')
    setShowModal(true)
  }

  const handleProdutoChange = (produtoId: string) => {
    setFormData({ ...formData, produto_id: produtoId })
    const produto = produtos.find(p => p.id === produtoId)
    setSelectedProduto(produto || null)
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setError('')
    setSuccess('')

   
    if (!editingMov && !formData.produto_id) {
      setError('Selecione um produto')
      return
    }

    if (!formData.quantidade) {
      setError('Preencha a quantidade')
      return
    }

    const quantidade = parseInt(formData.quantidade)
    if (quantidade <= 0) {
      setError('Quantidade deve ser maior que zero')
      return
    }

    if (activeTab === 'saida' && !editingMov && selectedProduto && quantidade > selectedProduto.quantidade_atual) {
      setError(`Estoque insuficiente. Disponível: ${selectedProduto.quantidade_atual} unidades`)
      return
    }

    try {
      const isEditing = !!editingMov
      const url = isEditing 
        ? `/api/movimentacoes/${editingMov}`
        : activeTab === 'entrada' ? '/api/movimentacoes/entrada' : '/api/movimentacoes/saida'
      
      const method = isEditing ? 'PUT' : 'POST'
      
      const body = activeTab === 'entrada' 
        ? {
            ...(isEditing ? {} : { produto_id: formData.produto_id }),
            quantidade,
            fornecedor_id: formData.fornecedor_id,
            numero_nf: formData.numero_nf,
            data: formData.data,
            observacao: formData.observacao
          }
        : {
            ...(isEditing ? {} : { produto_id: formData.produto_id }),
            quantidade,
            motivo: formData.motivo,
            data: formData.data,
            observacao: formData.observacao
          }

      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`
        },
        body: JSON.stringify(body)
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao salvar movimentação')
      }

      setSuccess(`${activeTab === 'entrada' ? 'Entrada' : 'Saída'} ${isEditing ? 'atualizada' : 'registrada'} com sucesso!`)
      setShowModal(false)
      setEditingMov(null)
      fetchData()
      fetchProdutos()
    } catch (err: any) {
      setError(err.message || 'Erro ao salvar movimentação')
    }
  }

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('pt-BR', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    })
  }

  const handleDelete = async () => {
    if (!movToDelete) return

    try {
      const response = await fetch(`/api/movimentacoes/${movToDelete}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao excluir movimentação')
      }

      const result = await response.json()
      console.log('Resultado da exclusão:', result)

      setSuccess('Movimentação excluída com sucesso! Estoque mantido.')
      setShowConfirmDelete(false)
      setMovToDelete(null)
      
      setTimeout(async () => {
        await fetchData()
        await fetchProdutos()
      }, 100)
    } catch (err: any) {
      setError(err.message || 'Erro ao excluir movimentação')
      setShowConfirmDelete(false)
      setMovToDelete(null)
    }
  }

  const handleClearHistory = async () => {
    try {
      const response = await fetch('/api/movimentacoes', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Erro ao limpar histórico')
      }

      setSuccess('Histórico limpo com sucesso! Os estoques atuais foram mantidos.')
      setShowConfirmClearHistory(false)
      fetchData()
      fetchProdutos()
    } catch (err: any) {
      setError(err.message || 'Erro ao limpar histórico')
      setShowConfirmClearHistory(false)
    }
  }

  return (
    <>
      <style>{styles}</style>
      <div className="mov-root">
        <div className="mov-header">
          <div>
            <h1 className="mov-title">Movimentações</h1>
            <p className="mov-subtitle">Gerencie entradas e saídas de produtos</p>
          </div>
        </div>

        {success && (
          <div className="mov-message mov-message--success">
            {success}
          </div>
        )}
        {error && (
          <div className="mov-message mov-message--error">
            {error}
          </div>
        )}

        <div className="mov-tabs">
          <button
            className={`mov-tab ${activeTab === 'entrada' ? 'mov-tab--active' : ''}`}
            onClick={() => setActiveTab('entrada')}
          >
            <ArrowUpRight size={18} />
            Entrada
          </button>
          <button
            className={`mov-tab ${activeTab === 'saida' ? 'mov-tab--active' : ''}`}
            onClick={() => setActiveTab('saida')}
          >
            <ArrowDownRight size={18} />
            Saída
          </button>
          <button
            className={`mov-tab ${activeTab === 'historico' ? 'mov-tab--active' : ''}`}
            onClick={() => setActiveTab('historico')}
          >
            <Calendar size={18} />
            Histórico
          </button>
        </div>

        <div className="mov-content">
          <div className="mov-filters">
            <div className="mov-filter-search">
              <Search size={18} />
              <input
                type="text"
                placeholder="Buscar por produto, setor ou responsável..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="mov-filter-input"
              />
            </div>

            {activeTab === 'historico' && (
              <div className="mov-filter-group">
                <Filter size={16} />
                <select
                  value={filterTipo}
                  onChange={(e) => setFilterTipo(e.target.value)}
                  className="mov-filter-select"
                >
                  <option value="">Todos os tipos</option>
                  <option value="ENTRADA">Entrada</option>
                  <option value="SAIDA">Saída</option>
                </select>
              </div>
            )}

            <div className="mov-filter-group">
              <Calendar size={16} />
              <input
                type="date"
                value={filterData}
                onChange={(e) => setFilterData(e.target.value)}
                className="mov-filter-date"
                placeholder="dd/mm/aaaa"
              />
            </div>

            {activeTab === 'historico' && (
              <button
                onClick={() => setShowConfirmClearHistory(true)}
                className="mov-btn-clear-history"
                title="Limpar histórico"
              >
                <Trash2 size={18} />
                Limpar Histórico
              </button>
            )}
          </div>

          {(activeTab === 'entrada' || activeTab === 'saida') && (
            <div className="mov-action-bar">
              <button onClick={handleOpenModal} className="mov-btn-primary">
                <Plus size={18} />
                Registrar {activeTab === 'entrada' ? 'Entrada' : 'Saída'}
              </button>
            </div>
          )}

          {activeTab === 'entrada' && (
            <div className="mov-table-wrapper">
              <table className="mov-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Fornecedor</th>
                    <th>Nº NF</th>
                    <th>Responsável</th>
                    <th>Data</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {entradas
                    .filter(entrada => {
                      if (!searchTerm) return true
                      const search = searchTerm.toLowerCase()
                      return (
                        entrada.produto_nome.toLowerCase().includes(search) ||
                        entrada.fornecedor_nome.toLowerCase().includes(search) ||
                        entrada.usuario_nome.toLowerCase().includes(search) ||
                        entrada.numero_nf.toLowerCase().includes(search)
                      )
                    })
                    .map(entrada => {
                    const obsLimpa = entrada.observacao?.replace(/^NF:\s*\S+\s*\n?/, '').trim() || '-'
                    return (
                    <tr key={entrada.id}>
                      <td>{entrada.produto_nome}</td>
                      <td className="mov-qty mov-qty--entrada">+{entrada.quantidade}</td>
                      <td>{entrada.fornecedor_nome}</td>
                      <td>{entrada.numero_nf}</td>
                      <td>{entrada.usuario_nome}</td>
                      <td>{formatDate(entrada.created_at)}</td>
                      <td>
                        <span className="mov-observacao" title={obsLimpa}>
                          {obsLimpa.length > 30 ? obsLimpa.substring(0, 30) + '...' : obsLimpa}
                        </span>
                      </td>
                      <td>
                        <div className="mov-actions">
                          <button
                            onClick={() => handleEdit(entrada)}
                            className="mov-btn-edit"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setMovToDelete(entrada.id)
                              setShowConfirmDelete(true)
                            }}
                            className="mov-btn-delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              {entradas.filter(entrada => {
                if (!searchTerm) return true
                const search = searchTerm.toLowerCase()
                return (
                  entrada.produto_nome.toLowerCase().includes(search) ||
                  entrada.fornecedor_nome.toLowerCase().includes(search) ||
                  entrada.usuario_nome.toLowerCase().includes(search) ||
                  entrada.numero_nf.toLowerCase().includes(search)
                )
              }).length === 0 && (
                <div className="mov-empty">Nenhuma entrada encontrada</div>
              )}
            </div>
          )}

          {activeTab === 'saida' && (
            <div className="mov-table-wrapper">
              <table className="mov-table">
                <thead>
                  <tr>
                    <th>Produto</th>
                    <th>Quantidade</th>
                    <th>Motivo/Destino</th>
                    <th>Responsável</th>
                    <th>Data</th>
                    <th>Observação</th>
                    <th>Ações</th>
                  </tr>
                </thead>
                <tbody>
                  {saidas
                    .filter(saida => {
                      if (!searchTerm) return true
                      const search = searchTerm.toLowerCase()
                      return (
                        saida.produto_nome.toLowerCase().includes(search) ||
                        saida.motivo.toLowerCase().includes(search) ||
                        saida.usuario_nome.toLowerCase().includes(search)
                      )
                    })
                    .map(saida => {
                    const obsLimpa = saida.observacao?.replace(/^Motivo:\s*[^\n]+\s*\n?/, '').trim() || '-'
                    return (
                    <tr key={saida.id}>
                      <td>{saida.produto_nome}</td>
                      <td className="mov-qty mov-qty--saida">-{saida.quantidade}</td>
                      <td>{saida.motivo}</td>
                      <td>{saida.usuario_nome}</td>
                      <td>{formatDate(saida.created_at)}</td>
                      <td>
                        <span className="mov-observacao" title={obsLimpa}>
                          {obsLimpa.length > 30 ? obsLimpa.substring(0, 30) + '...' : obsLimpa}
                        </span>
                      </td>
                      <td>
                        <div className="mov-actions">
                          <button
                            onClick={() => handleEdit(saida)}
                            className="mov-btn-edit"
                            title="Editar"
                          >
                            <Edit2 size={16} />
                          </button>
                          <button
                            onClick={() => {
                              setMovToDelete(saida.id)
                              setShowConfirmDelete(true)
                            }}
                            className="mov-btn-delete"
                            title="Excluir"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
              {saidas.filter(saida => {
                if (!searchTerm) return true
                const search = searchTerm.toLowerCase()
                return (
                  saida.produto_nome.toLowerCase().includes(search) ||
                  saida.motivo.toLowerCase().includes(search) ||
                  saida.usuario_nome.toLowerCase().includes(search)
                )
              }).length === 0 && (
                <div className="mov-empty">Nenhuma saída encontrada</div>
              )}
            </div>
          )}

          {activeTab === 'historico' && (
            <>
              <div className="mov-table-wrapper">
                <table className="mov-table">
                  <thead>
                    <tr>
                      <th>Tipo</th>
                      <th>Produto</th>
                      <th>Categoria</th>
                      <th>Quantidade</th>
                      <th>Responsável</th>
                      <th>Data</th>
                    </tr>
                  </thead>
                  <tbody>
                    {historico
                      .filter(mov => {
                        if (!searchTerm) return true
                        const search = searchTerm.toLowerCase()
                        return (
                          mov.produto_nome.toLowerCase().includes(search) ||
                          mov.usuario_nome.toLowerCase().includes(search) ||
                          mov.categoria_nome.toLowerCase().includes(search)
                        )
                      })
                      .map(mov => (
                        <tr key={mov.id}>
                          <td>
                            <span className={`mov-badge mov-badge--${mov.tipo.toLowerCase()}`}>
                              {mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}
                            </span>
                          </td>
                          <td>{mov.produto_nome}</td>
                          <td>{mov.categoria_nome}</td>
                          <td className={`mov-qty mov-qty--${mov.tipo.toLowerCase()}`}>
                            {mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}
                          </td>
                          <td>{mov.usuario_nome}</td>
                          <td>{formatDate(mov.created_at)}</td>
                        </tr>
                      ))}
                  </tbody>
                </table>
                {historico.filter(mov => {
                  if (!searchTerm) return true
                  const search = searchTerm.toLowerCase()
                  return (
                    mov.produto_nome.toLowerCase().includes(search) ||
                    mov.usuario_nome.toLowerCase().includes(search) ||
                    mov.categoria_nome.toLowerCase().includes(search)
                  )
                }).length === 0 && (
                  <div className="mov-empty">Nenhuma movimentação encontrada</div>
                )}
              </div>
            </>
          )}
        </div>

        {showModal && (
          <div className="mov-modal-overlay" onClick={() => setShowModal(false)}>
            <div className="mov-modal" onClick={(e) => e.stopPropagation()}>
              <div className="mov-modal-header">
                <h2>{editingMov ? 'Editar' : 'Registrar'} {activeTab === 'entrada' ? 'Entrada' : 'Saída'}</h2>
                <button onClick={() => setShowModal(false)} className="mov-modal-close">
                  <X size={20} />
                </button>
              </div>

              <form onSubmit={handleSubmit} className="mov-form">
                {!editingMov && (
                  <div className="mov-form-group">
                    <label>Produto *</label>
                    <select
                      value={formData.produto_id}
                      onChange={(e) => handleProdutoChange(e.target.value)}
                      className="mov-input"
                      required
                    >
                      <option value="">Selecione um produto</option>
                      {produtos.map(p => (
                        <option key={p.id} value={p.id}>{p.nome}</option>
                      ))}
                    </select>
                  </div>
                )}

                {activeTab === 'saida' && selectedProduto && !editingMov && (
                  <div className="mov-saldo-info">
                    Saldo disponível: <strong>{selectedProduto.quantidade_atual}</strong> unidades
                  </div>
                )}

                <div className="mov-form-group">
                  <label>Quantidade *</label>
                  <input
                    type="number"
                    min="1"
                    value={formData.quantidade}
                    onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })}
                    className="mov-input"
                    required
                  />
                </div>

                {activeTab === 'entrada' && (
                  <>
                    <div className="mov-form-group">
                      <label>Fornecedor</label>
                      <select
                        value={formData.fornecedor_id}
                        onChange={(e) => setFormData({ ...formData, fornecedor_id: e.target.value })}
                        className="mov-input"
                      >
                        <option value="">Selecione um fornecedor</option>
                        {fornecedores.map(f => (
                          <option key={f.id} value={f.id}>{f.nome}</option>
                        ))}
                      </select>
                    </div>

                    <div className="mov-form-group">
                      <label>Número da NF</label>
                      <input
                        type="text"
                        value={formData.numero_nf}
                        onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })}
                        className="mov-input"
                        placeholder="Ex: 12345"
                      />
                    </div>
                  </>
                )}

                {activeTab === 'saida' && (
                  <div className="mov-form-group">
                    <label>Motivo/Destino</label>
                    <input
                      type="text"
                      value={formData.motivo}
                      onChange={(e) => setFormData({ ...formData, motivo: e.target.value })}
                      className="mov-input"
                      placeholder="Ex: Consumo interno"
                    />
                  </div>
                )}

                <div className="mov-form-group">
                  <label>Data</label>
                  <input
                    type="date"
                    value={formData.data}
                    onChange={(e) => setFormData({ ...formData, data: e.target.value })}
                    className="mov-input"
                  />
                </div>

                <div className="mov-form-group">
                  <label>Observação</label>
                  <textarea
                    value={formData.observacao}
                    onChange={(e) => setFormData({ ...formData, observacao: e.target.value })}
                    className="mov-input"
                    rows={3}
                    placeholder="Observações adicionais..."
                  />
                </div>

                <div className="mov-form-actions">
                  <button type="button" onClick={() => setShowModal(false)} className="mov-btn-cancel">
                    Cancelar
                  </button>
                  <button type="submit" className="mov-btn-submit">
                    {editingMov ? 'Atualizar' : 'Confirmar'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        <ConfirmModal
          isOpen={showConfirmDelete}
          title="Excluir Movimentação"
          message="Tem certeza que deseja excluir esta movimentação? O estoque atual será mantido. Esta ação não pode ser desfeita."
          confirmText="Sim, excluir"
          cancelText="Cancelar"
          onConfirm={handleDelete}
          onCancel={() => {
            setShowConfirmDelete(false)
            setMovToDelete(null)
          }}
          variant="danger"
        />

        <ConfirmModal
          isOpen={showConfirmClearHistory}
          title="Limpar Histórico"
          message="Esta ação irá excluir TODAS as movimentações do histórico. Os estoques atuais dos produtos serão mantidos. Esta ação não pode ser desfeita. Tem certeza que deseja continuar?"
          confirmText="Sim, limpar histórico"
          cancelText="Cancelar"
          onConfirm={handleClearHistory}
          onCancel={() => setShowConfirmClearHistory(false)}
          variant="danger"
        />
      </div>
    </>
  )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');

  .mov-root {
    flex: 1;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #e0e7ff 50%, #dbeafe 100%);
    font-family: 'DM Sans', sans-serif;
    padding: 36px 28px;
  }

  .mov-header {
    margin-bottom: 24px;
  }

  .mov-title {
    font-size: 28px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
  }

  .mov-subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  .mov-message {
    padding: 12px 16px;
    border-radius: 8px;
    margin-bottom: 20px;
    font-size: 14px;
  }

  .mov-message--success {
    background: #d1fae5;
    color: #065f46;
    border: 1px solid #6ee7b7;
  }

  .mov-message--error {
    background: #fee2e2;
    color: #991b1b;
    border: 1px solid #fca5a5;
  }

  .mov-tabs {
    display: flex;
    gap: 8px;
    margin-bottom: 24px;
    border-bottom: 2px solid #e2e8f0;
  }

  .mov-tab {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 12px 20px;
    background: transparent;
    border: none;
    border-bottom: 3px solid transparent;
    color: #64748b;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: all 0.2s;
    margin-bottom: -2px;
  }

  .mov-tab:hover {
    color: #3b82f6;
    background: rgba(59, 130, 246, 0.05);
  }

  .mov-tab--active {
    color: #3b82f6;
    border-bottom-color: #3b82f6;
  }

  .mov-content {
    background: white;
    border-radius: 12px;
    padding: 24px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.1);
  }

  .mov-action-bar {
    margin-bottom: 20px;
  }

  .mov-btn-primary {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #3b82f6;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
  }

  .mov-btn-primary:hover {
    background: #2563eb;
  }

  .mov-table-wrapper {
    overflow-x: auto;
  }

  .mov-table {
    width: 100%;
    border-collapse: collapse;
  }

  .mov-table th {
    text-align: left;
    padding: 12px;
    background: #f8fafc;
    color: #475569;
    font-size: 13px;
    font-weight: 600;
    border-bottom: 2px solid #e2e8f0;
  }

  .mov-table td {
    padding: 12px;
    border-bottom: 1px solid #e2e8f0;
    font-size: 14px;
    color: #1e293b;
  }

  .mov-table tr:hover {
    background: #f8fafc;
  }

  .mov-qty {
    font-weight: 700;
    font-size: 15px;
  }

  .mov-qty--entrada {
    color: #10b981;
  }

  .mov-qty--saida {
    color: #ef4444;
  }

  .mov-observacao {
    font-size: 13px;
    color: #64748b;
    font-style: italic;
    display: block;
    max-width: 200px;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .mov-badge {
    display: inline-block;
    padding: 4px 10px;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 600;
  }

  .mov-badge--entrada {
    background: #d1fae5;
    color: #065f46;
  }

  .mov-badge--saida {
    background: #fee2e2;
    color: #991b1b;
  }

  .mov-empty {
    text-align: center;
    padding: 40px;
    color: #94a3b8;
    font-size: 14px;
  }

  .mov-filters {
    display: flex;
    gap: 12px;
    margin-bottom: 20px;
    flex-wrap: wrap;
  }

  .mov-filter-search {
    flex: 1;
    min-width: 250px;
    position: relative;
    display: flex;
    align-items: center;
  }

  .mov-filter-search svg {
    position: absolute;
    left: 12px;
    color: #94a3b8;
    pointer-events: none;
  }

  .mov-filter-input {
    width: 100%;
    padding: 10px 12px 10px 40px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1e293b;
    font-family: 'DM Sans', sans-serif;
  }

  .mov-filter-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .mov-filter-group {
    display: flex;
    align-items: center;
    gap: 8px;
    padding: 10px 14px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    background: white;
  }

  .mov-filter-group svg {
    color: #94a3b8;
    flex-shrink: 0;
  }

  .mov-filter-select,
  .mov-filter-date {
    border: none;
    background: transparent;
    font-size: 14px;
    color: #1e293b;
    font-family: 'DM Sans', sans-serif;
    outline: none;
    cursor: pointer;
  }

  .mov-filter-select {
    min-width: 140px;
  }

  .mov-filter-date {
    min-width: 140px;
  }

  .mov-filter-date::-webkit-calendar-picker-indicator {
    cursor: pointer;
  }

  .mov-btn-clear-history {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 18px;
    background: #ef4444;
    color: white;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    cursor: pointer;
    transition: background 0.2s;
    white-space: nowrap;
  }

  .mov-btn-clear-history:hover {
    background: #dc2626;
  }

  .mov-modal-overlay {
    position: fixed;
    inset: 0;
    background: rgba(0, 0, 0, 0.5);
    display: flex;
    align-items: center;
    justify-content: center;
    z-index: 50;
    padding: 20px;
  }

  .mov-modal {
    background: white;
    border-radius: 12px;
    width: 100%;
    max-width: 500px;
    max-height: 90vh;
    overflow-y: auto;
  }

  .mov-modal-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 20px 24px;
    border-bottom: 1px solid #e2e8f0;
  }

  .mov-modal-header h2 {
    font-size: 18px;
    font-weight: 700;
    color: #0f172a;
    margin: 0;
  }

  .mov-modal-close {
    background: transparent;
    border: none;
    color: #64748b;
    cursor: pointer;
    padding: 4px;
    display: flex;
    align-items: center;
    justify-content: center;
  }

  .mov-modal-close:hover {
    color: #0f172a;
  }

  .mov-form {
    padding: 24px;
  }

  .mov-form-group {
    margin-bottom: 16px;
  }

  .mov-form-group label {
    display: block;
    margin-bottom: 6px;
    font-size: 13px;
    font-weight: 600;
    color: #475569;
  }

  .mov-input {
    width: 100%;
    padding: 10px 12px;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    color: #1e293b;
    font-family: 'DM Sans', sans-serif;
    box-sizing: border-box;
  }

  .mov-input:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .mov-saldo-info {
    padding: 12px;
    background: #dbeafe;
    border: 1px solid #93c5fd;
    border-radius: 8px;
    font-size: 14px;
    color: #1e40af;
    margin-bottom: 16px;
  }

  .mov-form-actions {
    display: flex;
    gap: 12px;
    margin-top: 24px;
  }

  .mov-btn-cancel {
    flex: 1;
    padding: 10px;
    background: white;
    border: 1px solid #e2e8f0;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: #64748b;
    cursor: pointer;
  }

  .mov-btn-cancel:hover {
    background: #f8fafc;
  }

  .mov-btn-submit {
    flex: 1;
    padding: 10px;
    background: #3b82f6;
    border: none;
    border-radius: 8px;
    font-size: 14px;
    font-weight: 600;
    color: white;
    cursor: pointer;
  }

  .mov-btn-submit:hover {
    background: #2563eb;
  }

  .mov-btn-delete {
    background: transparent;
    border: none;
    color: #ef4444;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .mov-btn-delete:hover {
    background: #fee2e2;
  }

  .mov-btn-edit {
    background: transparent;
    border: none;
    color: #3b82f6;
    cursor: pointer;
    padding: 6px;
    border-radius: 6px;
    display: inline-flex;
    align-items: center;
    justify-content: center;
    transition: background 0.2s;
  }

  .mov-btn-edit:hover {
    background: #dbeafe;
  }

  .mov-actions {
    display: flex;
    gap: 4px;
    align-items: center;
  }
`
