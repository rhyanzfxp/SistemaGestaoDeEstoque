import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import { ArrowUpRight, ArrowDownRight, Plus, X, Search, Filter, Calendar, Trash2, Edit2 } from 'lucide-react'
import ConfirmModal from '../components/ConfirmModal'
import { useRealtime } from '../hooks/useRealtime'
import { useSubmitting } from '../hooks/useSubmitting'

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

interface Entrada extends Movimentacao { numero_nf: string }
interface Saida extends Movimentacao { motivo: string }
interface Historico extends Movimentacao { categoria_nome: string }
interface Produto { id: string; nome: string; quantidade_atual: number }

type TabType = 'entrada' | 'saida' | 'historico'

export default function Movimentacoes() {
    const { token } = useAuth()
    const [activeTab, setActiveTab] = useState<TabType>('entrada')
    const [showModal, setShowModal] = useState(false)
    const [, setLoading] = useState(false)
    const [success, setSuccess] = useState('')
    const [error, setError] = useState('')
    const wrap = useSubmitting()
    const [entradas, setEntradas] = useState<Entrada[]>([])
    const [saidas, setSaidas] = useState<Saida[]>([])
    const [historico, setHistorico] = useState<Historico[]>([])
    const [produtos, setProdutos] = useState<Produto[]>([])
    const [formData, setFormData] = useState({ produto_id: '', quantidade: '', numero_nf: '', motivo: '', data: new Date().toISOString().split('T')[0], observacao: '' })
    const [selectedProduto, setSelectedProduto] = useState<Produto | null>(null)
    const [searchTerm, setSearchTerm] = useState('')
    const [filterTipo, setFilterTipo] = useState('')
    const [filterData, setFilterData] = useState('')
    const [showConfirmDelete, setShowConfirmDelete] = useState(false)
    const [movToDelete, setMovToDelete] = useState<string | null>(null)
    const [editingMov, setEditingMov] = useState<string | null>(null)
    const [showConfirmClearHistory, setShowConfirmClearHistory] = useState(false)

    useEffect(() => { fetchProdutos(); fetchData() }, [activeTab, filterTipo, filterData])

    const fetchProdutos = async () => {
        try {
            const res = await fetch('/api/produtos?limit=1000', { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            setProdutos(data.data || [])
        } catch (err) { console.error(err) }
    }

    const fetchData = async () => {
        setLoading(true)
        try {
            let url = '/api/movimentacoes'
            const params = new URLSearchParams()
            if (activeTab === 'entrada') url = '/api/movimentacoes/entradas'
            else if (activeTab === 'saida') url = '/api/movimentacoes/saidas'
            if (filterTipo && activeTab === 'historico') params.set('tipo', filterTipo)
            if (filterData) params.set('data_inicio', filterData)
            if (params.toString()) url += '?' + params.toString()
            const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } })
            const data = await res.json()
            if (activeTab === 'entrada') setEntradas(data.data || [])
            if (activeTab === 'saida') setSaidas(data.data || [])
            if (activeTab === 'historico') setHistorico(data.data || [])
        } catch (err) { console.error(err) }
        finally { setLoading(false) }
    }

    useRealtime('estoque_atualizado', () => { fetchData(); fetchProdutos() })

    const handleOpenModal = () => {
        setFormData({ produto_id: '', quantidade: '', numero_nf: '', motivo: '', data: new Date().toISOString().split('T')[0], observacao: '' })
        setSelectedProduto(null); setEditingMov(null); setError(''); setSuccess(''); setShowModal(true)
    }

    const handleEdit = (mov: Entrada | Saida) => {
        let numero_nf = '', motivo = '', observacaoLimpa = ''
        if (activeTab === 'entrada') {
            numero_nf = mov.observacao?.match(/NF:\s*(\S+)/)?.[1] || ''
            observacaoLimpa = mov.observacao?.replace(/^NF:\s*\S+\s*\n?/, '').trim() || ''
        } else {
            motivo = mov.observacao?.match(/Motivo:\s*([^\n]+)/)?.[1] || ''
            observacaoLimpa = mov.observacao?.replace(/^Motivo:\s*[^\n]+\s*\n?/, '').trim() || ''
        }
        setFormData({ produto_id: '', quantidade: mov.quantidade.toString(), numero_nf, motivo, data: mov.created_at.split('T')[0], observacao: observacaoLimpa })
        setEditingMov(mov.id); setError(''); setSuccess(''); setShowModal(true)
    }

    const handleProdutoChange = (produtoId: string) => {
        setFormData({ ...formData, produto_id: produtoId })
        setSelectedProduto(produtos.find(p => p.id === produtoId) || null)
    }

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault()
        wrap(async () => {
            setError(''); setSuccess('')
            if (!editingMov && !formData.produto_id) { setError('Selecione um produto'); return }
            if (!formData.quantidade) { setError('Preencha a quantidade'); return }
            const quantidade = parseInt(formData.quantidade)
            if (quantidade <= 0) { setError('Quantidade deve ser maior que zero'); return }
            if (activeTab === 'saida' && !editingMov && selectedProduto && quantidade > selectedProduto.quantidade_atual) {
                setError(`Estoque insuficiente. Disponível: ${selectedProduto.quantidade_atual} unidades`); return
            }
            try {
                const isEditing = !!editingMov
                const url = isEditing ? `/api/movimentacoes/${editingMov}` : activeTab === 'entrada' ? '/api/movimentacoes/entrada' : '/api/movimentacoes/saida'
                const body = activeTab === 'entrada'
                    ? { ...(isEditing ? {} : { produto_id: formData.produto_id }), quantidade, numero_nf: formData.numero_nf, data: formData.data, observacao: formData.observacao }
                    : { ...(isEditing ? {} : { produto_id: formData.produto_id }), quantidade, motivo: formData.motivo, data: formData.data, observacao: formData.observacao }
                const res = await fetch(url, { method: isEditing ? 'PUT' : 'POST', headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }, body: JSON.stringify(body) })
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao salvar') }
                setSuccess(`${activeTab === 'entrada' ? 'Entrada' : 'Saída'} ${isEditing ? 'atualizada' : 'registrada'} com sucesso!`)
                setShowModal(false); setEditingMov(null); fetchData(); fetchProdutos()
            } catch (err: any) { setError(err.message || 'Erro ao salvar movimentação') }
        })
    }

    const formatDate = (d: string) => new Date(d).toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })

    const handleDelete = async () => {
        if (!movToDelete) return
        wrap(async () => {
            try {
                const res = await fetch(`/api/movimentacoes/${movToDelete}`, { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao excluir') }
                setSuccess('Movimentação excluída com sucesso! Estoque mantido.')
                setShowConfirmDelete(false); setMovToDelete(null)
                setTimeout(async () => { await fetchData(); await fetchProdutos() }, 100)
            } catch (err: any) { setError(err.message || 'Erro ao excluir'); setShowConfirmDelete(false); setMovToDelete(null) }
        })
    }

    const handleClearHistory = async () => {
        wrap(async () => {
            try {
                const res = await fetch('/api/movimentacoes', { method: 'DELETE', headers: { Authorization: `Bearer ${token}` } })
                if (!res.ok) { const d = await res.json(); throw new Error(d.error || 'Erro ao limpar') }
                setSuccess('Histórico limpo com sucesso! Os estoques atuais foram mantidos.')
                setShowConfirmClearHistory(false); fetchData(); fetchProdutos()
            } catch (err: any) { setError(err.message || 'Erro ao limpar histórico'); setShowConfirmClearHistory(false) }
        })
    }

    const filterEntradas = (list: Entrada[]) => !searchTerm ? list : list.filter(e => e.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) || e.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) || e.numero_nf.toLowerCase().includes(searchTerm.toLowerCase()))
    const filterSaidas = (list: Saida[]) => !searchTerm ? list : list.filter(s => s.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) || s.motivo.toLowerCase().includes(searchTerm.toLowerCase()) || s.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()))
    const filterHistorico = (list: Historico[]) => !searchTerm ? list : list.filter(m => m.produto_nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.usuario_nome.toLowerCase().includes(searchTerm.toLowerCase()) || m.categoria_nome.toLowerCase().includes(searchTerm.toLowerCase()))

    return (
        <>
            <style>{styles}</style>
            <div className="mov-root">
                <div className="mov-header">
                    <h1 className="mov-title">Movimentações</h1>
                    <p className="mov-subtitle">Gerencie entradas e saídas de produtos</p>
                </div>

                {success && <div className="mov-message mov-message--success">{success}</div>}
                {error && <div className="mov-message mov-message--error">{error}</div>}

                <div className="mov-tabs">
                    <button className={`mov-tab ${activeTab === 'entrada' ? 'mov-tab--active' : ''}`} onClick={() => setActiveTab('entrada')}><ArrowUpRight size={18} />Entrada</button>
                    <button className={`mov-tab ${activeTab === 'saida' ? 'mov-tab--active' : ''}`} onClick={() => setActiveTab('saida')}><ArrowDownRight size={18} />Saída</button>
                    <button className={`mov-tab ${activeTab === 'historico' ? 'mov-tab--active' : ''}`} onClick={() => setActiveTab('historico')}><Calendar size={18} />Histórico</button>
                </div>

                <div className="mov-content">
                    <div className="mov-filters">
                        <div className="mov-filter-search">
                            <Search size={18} />
                            <input type="text" placeholder="Buscar por produto, setor ou responsável..." value={searchTerm} onChange={(e) => setSearchTerm(e.target.value)} className="mov-filter-input" />
                        </div>
                        {activeTab === 'historico' && (
                            <div className="mov-filter-group">
                                <Filter size={16} />
                                <select value={filterTipo} onChange={(e) => setFilterTipo(e.target.value)} className="mov-filter-select">
                                    <option value="">Todos os tipos</option>
                                    <option value="ENTRADA">Entrada</option>
                                    <option value="SAIDA">Saída</option>
                                </select>
                            </div>
                        )}
                        <div className="mov-filter-group">
                            <Calendar size={16} />
                            <input type="date" value={filterData} onChange={(e) => setFilterData(e.target.value)} className="mov-filter-date" />
                        </div>
                        {activeTab === 'historico' && (
                            <button onClick={() => setShowConfirmClearHistory(true)} className="mov-btn-clear-history"><Trash2 size={18} />Limpar Histórico</button>
                        )}
                    </div>

                    {(activeTab === 'entrada' || activeTab === 'saida') && (
                        <div className="mov-action-bar">
                            <button onClick={handleOpenModal} className="mov-btn-primary"><Plus size={18} />Registrar {activeTab === 'entrada' ? 'Entrada' : 'Saída'}</button>
                        </div>
                    )}

                    {activeTab === 'entrada' && (
                        <div className="mov-table-wrapper">
                            <table className="mov-table">
                                <thead><tr><th>Produto</th><th>Quantidade</th><th>Nº NF</th><th>Responsável</th><th>Data</th><th>Observação</th><th>Ações</th></tr></thead>
                                <tbody>
                                    {filterEntradas(entradas).map(entrada => {
                                        const obs = entrada.observacao?.replace(/^NF:\s*\S+\s*\n?/, '').trim() || '-'
                                        return (
                                            <tr key={entrada.id}>
                                                <td>{entrada.produto_nome}</td>
                                                <td className="mov-qty mov-qty--entrada">+{entrada.quantidade}</td>
                                                <td>{entrada.numero_nf}</td>
                                                <td>{entrada.usuario_nome}</td>
                                                <td>{formatDate(entrada.created_at)}</td>
                                                <td><span className="mov-observacao" title={obs}>{obs.length > 30 ? obs.substring(0, 30) + '...' : obs}</span></td>
                                                <td><div className="mov-actions">
                                                    <button onClick={() => handleEdit(entrada)} className="mov-btn-edit" title="Editar"><Edit2 size={16} /></button>
                                                    <button onClick={() => { setMovToDelete(entrada.id); setShowConfirmDelete(true) }} className="mov-btn-delete" title="Excluir"><Trash2 size={16} /></button>
                                                </div></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {filterEntradas(entradas).length === 0 && <div className="mov-empty">Nenhuma entrada encontrada</div>}
                        </div>
                    )}

                    {activeTab === 'saida' && (
                        <div className="mov-table-wrapper">
                            <table className="mov-table">
                                <thead><tr><th>Produto</th><th>Quantidade</th><th>Motivo/Destino</th><th>Responsável</th><th>Data</th><th>Observação</th><th>Ações</th></tr></thead>
                                <tbody>
                                    {filterSaidas(saidas).map(saida => {
                                        const obs = saida.observacao?.replace(/^Motivo:\s*[^\n]+\s*\n?/, '').trim() || '-'
                                        return (
                                            <tr key={saida.id}>
                                                <td>{saida.produto_nome}</td>
                                                <td className="mov-qty mov-qty--saida">-{saida.quantidade}</td>
                                                <td>{saida.motivo}</td>
                                                <td>{saida.usuario_nome}</td>
                                                <td>{formatDate(saida.created_at)}</td>
                                                <td><span className="mov-observacao" title={obs}>{obs.length > 30 ? obs.substring(0, 30) + '...' : obs}</span></td>
                                                <td><div className="mov-actions">
                                                    <button onClick={() => handleEdit(saida)} className="mov-btn-edit" title="Editar"><Edit2 size={16} /></button>
                                                    <button onClick={() => { setMovToDelete(saida.id); setShowConfirmDelete(true) }} className="mov-btn-delete" title="Excluir"><Trash2 size={16} /></button>
                                                </div></td>
                                            </tr>
                                        )
                                    })}
                                </tbody>
                            </table>
                            {filterSaidas(saidas).length === 0 && <div className="mov-empty">Nenhuma saída encontrada</div>}
                        </div>
                    )}

                    {activeTab === 'historico' && (
                        <div className="mov-table-wrapper">
                            <table className="mov-table">
                                <thead><tr><th>Tipo</th><th>Produto</th><th>Categoria</th><th>Quantidade</th><th>Responsável</th><th>Data</th></tr></thead>
                                <tbody>
                                    {filterHistorico(historico).map(mov => (
                                        <tr key={mov.id}>
                                            <td><span className={`mov-badge mov-badge--${mov.tipo.toLowerCase()}`}>{mov.tipo === 'ENTRADA' ? 'Entrada' : 'Saída'}</span></td>
                                            <td>{mov.produto_nome}</td>
                                            <td>{mov.categoria_nome}</td>
                                            <td className={`mov-qty mov-qty--${mov.tipo.toLowerCase()}`}>{mov.tipo === 'ENTRADA' ? '+' : '-'}{mov.quantidade}</td>
                                            <td>{mov.usuario_nome}</td>
                                            <td>{formatDate(mov.created_at)}</td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                            {filterHistorico(historico).length === 0 && <div className="mov-empty">Nenhuma movimentação encontrada</div>}
                        </div>
                    )}
                </div>

                {showModal && (
                    <div className="mov-modal-overlay" onClick={() => setShowModal(false)}>
                        <div className="mov-modal" onClick={(e) => e.stopPropagation()}>
                            <div className="mov-modal-header">
                                <h2>{editingMov ? 'Editar' : 'Registrar'} {activeTab === 'entrada' ? 'Entrada' : 'Saída'}</h2>
                                <button onClick={() => setShowModal(false)} className="mov-modal-close"><X size={20} /></button>
                            </div>
                            <form onSubmit={handleSubmit} className="mov-form">
                                {!editingMov && (
                                    <div className="mov-form-group">
                                        <label>Produto *</label>
                                        <select value={formData.produto_id} onChange={(e) => handleProdutoChange(e.target.value)} className="mov-input" required>
                                            <option value="">Selecione um produto</option>
                                            {produtos.map(p => <option key={p.id} value={p.id}>{p.nome}</option>)}
                                        </select>
                                    </div>
                                )}
                                {activeTab === 'saida' && selectedProduto && !editingMov && (
                                    <div className="mov-saldo-info">Saldo disponível: <strong>{selectedProduto.quantidade_atual}</strong> unidades</div>
                                )}
                                <div className="mov-form-group">
                                    <label>Quantidade *</label>
                                    <input type="number" min="1" value={formData.quantidade} onChange={(e) => setFormData({ ...formData, quantidade: e.target.value })} className="mov-input" required />
                                </div>
                                {activeTab === 'entrada' && (
                                    <div className="mov-form-group">
                                        <label>Número da NF</label>
                                        <input type="text" value={formData.numero_nf} onChange={(e) => setFormData({ ...formData, numero_nf: e.target.value })} className="mov-input" placeholder="Ex: 12345" />
                                    </div>
                                )}
                                {activeTab === 'saida' && (
                                    <div className="mov-form-group">
                                        <label>Motivo/Destino</label>
                                        <input type="text" value={formData.motivo} onChange={(e) => setFormData({ ...formData, motivo: e.target.value })} className="mov-input" placeholder="Ex: Consumo interno" />
                                    </div>
                                )}
                                <div className="mov-form-group">
                                    <label>Data</label>
                                    <input type="date" value={formData.data} onChange={(e) => setFormData({ ...formData, data: e.target.value })} className="mov-input" />
                                </div>
                                <div className="mov-form-group">
                                    <label>Observação</label>
                                    <textarea value={formData.observacao} onChange={(e) => setFormData({ ...formData, observacao: e.target.value })} className="mov-input" rows={3} placeholder="Observações adicionais..." />
                                </div>
                                <div className="mov-form-actions">
                                    <button type="button" onClick={() => setShowModal(false)} className="mov-btn-cancel">Cancelar</button>
                                    <button type="submit" className="mov-btn-submit">{editingMov ? 'Atualizar' : 'Confirmar'}</button>
                                </div>
                            </form>
                        </div>
                    </div>
                )}

                <ConfirmModal isOpen={showConfirmDelete} title="Excluir Movimentação" message="Tem certeza que deseja excluir esta movimentação? O estoque atual será mantido." confirmText="Sim, excluir" cancelText="Cancelar" onConfirm={handleDelete} onCancel={() => { setShowConfirmDelete(false); setMovToDelete(null) }} variant="danger" />
                <ConfirmModal isOpen={showConfirmClearHistory} title="Limpar Histórico" message="Esta ação irá excluir TODAS as movimentações. Os estoques atuais serão mantidos. Tem certeza?" confirmText="Sim, limpar histórico" cancelText="Cancelar" onConfirm={handleClearHistory} onCancel={() => setShowConfirmClearHistory(false)} variant="danger" />
            </div>
        </>
    )
}

const styles = `
  @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
  .mov-root { flex:1; min-height:100vh; background:var(--bg-page); font-family:'DM Sans',sans-serif; padding:36px 28px; }
  .mov-header { margin-bottom:24px; }
  .mov-title { font-size:28px; font-weight:700; color:var(--text-primary); margin:0 0 8px 0; }
  .mov-subtitle { font-size:14px; color:var(--text-secondary); margin:0; }
  .mov-message { padding:12px 16px; border-radius:8px; margin-bottom:20px; font-size:14px; }
  .mov-message--success { background:rgba(16,185,129,0.15); color:#34d399; border:1px solid rgba(16,185,129,0.3); }
  .mov-message--error { background:rgba(239,68,68,0.15); color:#f87171; border:1px solid rgba(239,68,68,0.3); }
  .mov-tabs { display:flex; gap:8px; margin-bottom:24px; border-bottom:2px solid var(--border-subtle); }
  .mov-tab { display:flex; align-items:center; gap:8px; padding:12px 20px; background:transparent; border:none; border-bottom:3px solid transparent; color:var(--text-secondary); font-size:14px; font-weight:600; cursor:pointer; transition:all 0.2s; margin-bottom:-2px; font-family:'DM Sans',sans-serif; }
  .mov-tab:hover { color:var(--accent-primary); background:var(--bg-hover); }
  .mov-tab--active { color:var(--accent-primary); border-bottom-color:var(--accent-primary); }
  .mov-content { background:var(--bg-card); border-radius:12px; padding:24px; box-shadow:var(--shadow-card); border:1px solid var(--border-card); }
  .mov-action-bar { margin-bottom:20px; }
  .mov-btn-primary { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; background:var(--accent-primary); color:white; border:none; border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; transition:background 0.2s; font-family:'DM Sans',sans-serif; }
  .mov-btn-primary:hover { background:var(--accent-hover); }
  .mov-table-wrapper { overflow-x:auto; }
  .mov-table { width:100%; border-collapse:collapse; }
  .mov-table th { text-align:left; padding:12px; background:var(--bg-hover); color:var(--text-secondary); font-size:13px; font-weight:600; border-bottom:2px solid var(--border-card); }
  .mov-table td { padding:12px; border-bottom:1px solid var(--border-card); font-size:14px; color:var(--text-primary); }
  .mov-table tr:hover td { background:var(--bg-hover); }
  .mov-qty { font-weight:700; font-size:15px; }
  .mov-qty--entrada { color:#10b981; }
  .mov-qty--saida { color:#ef4444; }
  .mov-observacao { font-size:13px; color:var(--text-secondary); font-style:italic; display:block; max-width:200px; overflow:hidden; text-overflow:ellipsis; white-space:nowrap; }
  .mov-badge { display:inline-block; padding:4px 10px; border-radius:6px; font-size:12px; font-weight:600; }
  .mov-badge--entrada { background:rgba(16,185,129,0.15); color:#34d399; }
  .mov-badge--saida { background:rgba(239,68,68,0.15); color:#f87171; }
  .mov-empty { text-align:center; padding:40px; color:var(--text-muted); font-size:14px; }
  .mov-filters { display:flex; gap:12px; margin-bottom:20px; flex-wrap:wrap; }
  .mov-filter-search { flex:1; min-width:250px; position:relative; display:flex; align-items:center; }
  .mov-filter-search svg { position:absolute; left:12px; color:var(--text-muted); pointer-events:none; }
  .mov-filter-input { width:100%; padding:10px 12px 10px 40px; border:1px solid var(--border-input); border-radius:8px; font-size:14px; color:var(--text-primary); background:var(--bg-input); font-family:'DM Sans',sans-serif; }
  .mov-filter-input:focus { outline:none; border-color:var(--accent-primary); }
  .mov-filter-input::placeholder { color:var(--text-muted); }
  .mov-filter-group { display:flex; align-items:center; gap:8px; padding:10px 14px; border:1px solid var(--border-input); border-radius:8px; background:var(--bg-input); }
  .mov-filter-group svg { color:var(--text-muted); flex-shrink:0; }
  .mov-filter-select, .mov-filter-date { border:none; background:transparent; font-size:14px; color:var(--text-primary); font-family:'DM Sans',sans-serif; outline:none; cursor:pointer; }
  .mov-filter-select { min-width:140px; }
  .mov-filter-date { min-width:140px; }
  .mov-btn-clear-history { display:inline-flex; align-items:center; gap:8px; padding:10px 18px; background:rgba(239,68,68,0.12); color:#f87171; border:1px solid rgba(239,68,68,0.25); border-radius:8px; font-size:14px; font-weight:600; cursor:pointer; white-space:nowrap; font-family:'DM Sans',sans-serif; }
  .mov-btn-clear-history:hover { background:rgba(239,68,68,0.2); }
  .mov-modal-overlay { position:fixed; inset:0; background:rgba(0,0,0,0.6); display:flex; align-items:center; justify-content:center; z-index:50; padding:20px; }
  .mov-modal { background:var(--bg-card); border-radius:12px; width:100%; max-width:500px; max-height:90vh; overflow-y:auto; border:1px solid var(--border-card); }
  .mov-modal-header { display:flex; align-items:center; justify-content:space-between; padding:20px 24px; border-bottom:1px solid var(--border-card); }
  .mov-modal-header h2 { font-size:18px; font-weight:700; color:var(--text-primary); margin:0; }
  .mov-modal-close { background:transparent; border:none; color:var(--text-secondary); cursor:pointer; padding:4px; display:flex; align-items:center; }
  .mov-modal-close:hover { color:var(--text-primary); }
  .mov-form { padding:24px; }
  .mov-form-group { margin-bottom:16px; }
  .mov-form-group label { display:block; margin-bottom:6px; font-size:13px; font-weight:600; color:var(--text-secondary); }
  .mov-input { width:100%; padding:10px 12px; border:1px solid var(--border-input); border-radius:8px; font-size:14px; color:var(--text-primary); background:var(--bg-input); font-family:'DM Sans',sans-serif; box-sizing:border-box; }
  .mov-input:focus { outline:none; border-color:var(--accent-primary); }
  .mov-saldo-info { padding:12px; background:var(--accent-faint); border:1px solid var(--border-input); border-radius:8px; font-size:14px; color:var(--text-link-active); margin-bottom:16px; }
  .mov-form-actions { display:flex; gap:12px; margin-top:24px; }
  .mov-btn-cancel { flex:1; padding:10px; background:var(--bg-input); border:1px solid var(--border-input); border-radius:8px; font-size:14px; font-weight:600; color:var(--text-secondary); cursor:pointer; font-family:'DM Sans',sans-serif; }
  .mov-btn-cancel:hover { background:var(--bg-hover); }
  .mov-btn-submit { flex:1; padding:10px; background:var(--accent-primary); border:none; border-radius:8px; font-size:14px; font-weight:600; color:white; cursor:pointer; font-family:'DM Sans',sans-serif; }
  .mov-btn-submit:hover { background:var(--accent-hover); }
  .mov-btn-delete { background:transparent; border:none; color:#ef4444; cursor:pointer; padding:6px; border-radius:6px; display:inline-flex; align-items:center; }
  .mov-btn-delete:hover { background:rgba(239,68,68,0.12); }
  .mov-btn-edit { background:transparent; border:none; color:var(--accent-primary); cursor:pointer; padding:6px; border-radius:6px; display:inline-flex; align-items:center; }
  .mov-btn-edit:hover { background:var(--accent-faint); }
  .mov-actions { display:flex; gap:4px; }
`
