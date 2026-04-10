import { useState, useEffect } from 'react'
import axios from 'axios'
import { useAuth } from '../contexts/AuthContext'
import Toast from '../components/Toast'
import ConfirmModal from '../components/ConfirmModal'

interface Fornecedor {
  id: string
  nome: string
  cnpj: string | null
  email: string | null
  telefone: string | null
  contato: string | null
  total_produtos?: number
  created_at: string
}


const AVATAR_PALETTES = [
  { bg: '#3B5BDB', light: '#EEF2FF' },
  { bg: '#0F9160', light: '#ECFDF5' },
  { bg: '#C2410C', light: '#FFF7ED' },
  { bg: '#7C3AED', light: '#F5F3FF' },
  { bg: '#0369A1', light: '#F0F9FF' },
  { bg: '#BE185D', light: '#FDF2F8' },
]

export default function Fornecedores() {
  const { token } = useAuth()
  const [fornecedores, setFornecedores] = useState<Fornecedor[]>([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [editingFornecedor, setEditingFornecedor] = useState<Fornecedor | null>(null)
  const [toast, setToast] = useState<{ message: string; type: 'success' | 'error' } | null>(null)
  const [confirmDelete, setConfirmDelete] = useState<string | null>(null)
  const [activeCard, setActiveCard] = useState<string | null>(null)

  const [formData, setFormData] = useState({
    nome: '',
    cnpj: '',
    email: '',
    telefone: '',
    contato: ''
  })

  useEffect(() => {
    fetchFornecedores()
    
  }, [searchTerm])

  const fetchFornecedores = async () => {
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/fornecedores`, {
        headers: { Authorization: `Bearer ${token}` },
        params: { search: searchTerm, limit: 100 }
      })
      setFornecedores(response.data.data)
    } catch {
      showToast('Erro ao carregar fornecedores', 'error')
    } finally {
      setLoading(false)
    }
  }

  const showToast = (message: string, type: 'success' | 'error') => {
    setToast({ message, type })
    setTimeout(() => setToast(null), 3000)
  }

  const handleOpenModal = (fornecedor?: Fornecedor) => {
    if (fornecedor) {
      setEditingFornecedor(fornecedor)
      setFormData({
        nome: fornecedor.nome,
        cnpj: fornecedor.cnpj || '',
        email: fornecedor.email || '',
        telefone: fornecedor.telefone || '',
        contato: fornecedor.contato || ''
      })
    } else {
      setEditingFornecedor(null)
      setFormData({ nome: '', cnpj: '', email: '', telefone: '', contato: '' })
    }
    setShowModal(true)
  }

  const handleCloseModal = () => {
    setShowModal(false)
    setEditingFornecedor(null)
    setFormData({ nome: '', cnpj: '', email: '', telefone: '', contato: '' })
  }

  const formatCNPJ = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 14) {
      return numbers
        .replace(/^(\d{2})(\d)/, '$1.$2')
        .replace(/^(\d{2})\.(\d{3})(\d)/, '$1.$2.$3')
        .replace(/\.(\d{3})(\d)/, '.$1/$2')
        .replace(/(\d{4})(\d)/, '$1-$2')
    }
    return value
  }

  const formatPhone = (value: string) => {
    const numbers = value.replace(/\D/g, '')
    if (numbers.length <= 11) {
      return numbers
        .replace(/^(\d{2})(\d)/, '($1) $2')
        .replace(/(\d{4,5})(\d{4})$/, '$1-$2')
    }
    return value
  }

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target
    if (name === 'cnpj') {
      setFormData(prev => ({ ...prev, [name]: formatCNPJ(value) }))
    } else if (name === 'telefone') {
      setFormData(prev => ({ ...prev, [name]: formatPhone(value) }))
    } else {
      setFormData(prev => ({ ...prev, [name]: value }))
    }
  }

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault()
    if (!formData.nome.trim()) {
      showToast('Nome é obrigatório', 'error')
      return
    }
    try {
      if (editingFornecedor) {
        await axios.put(
          `${import.meta.env.VITE_API_URL}/api/fornecedores/${editingFornecedor.id}`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showToast('Fornecedor atualizado com sucesso', 'success')
      } else {
        await axios.post(
          `${import.meta.env.VITE_API_URL}/api/fornecedores`,
          formData,
          { headers: { Authorization: `Bearer ${token}` } }
        )
        showToast('Fornecedor criado com sucesso', 'success')
      }
      handleCloseModal()
      fetchFornecedores()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      showToast(err.response?.data?.error || 'Erro ao salvar fornecedor', 'error')
    }
  }

  const handleDelete = async (id: string) => {
    try {
      await axios.delete(`${import.meta.env.VITE_API_URL}/api/fornecedores/${id}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      showToast('Fornecedor excluído com sucesso', 'success')
      fetchFornecedores()
    } catch (error) {
      const err = error as { response?: { data?: { error?: string } } }
      showToast(err.response?.data?.error || 'Erro ao excluir fornecedor', 'error')
    } finally {
      setConfirmDelete(null)
    }
  }

  const getInitials = (nome: string) => {
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const getPalette = (index: number) => AVATAR_PALETTES[index % AVATAR_PALETTES.length]

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%', minHeight: 320 }}>
        <div style={{
          width: 40, height: 40,
          border: '3px solid #e0e7ff',
          borderTop: '3px solid #3B5BDB',
          borderRadius: '50%',
          animation: 'spin 0.8s linear infinite'
        }} />
        <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
      </div>
    )
  }

  const styles: Record<string, React.CSSProperties> = {
    page: {
      padding: '32px 32px 48px',
      fontFamily: "'DM Sans', 'Segoe UI', sans-serif",
      background: '#F7F8FC',
      minHeight: '100vh',
    },
    header: {
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: 28,
    },
    title: {
      fontSize: 26,
      fontWeight: 700,
      color: '#111827',
      letterSpacing: '-0.5px',
      margin: 0,
      lineHeight: 1.2,
    },
    subtitle: {
      fontSize: 13,
      color: '#9CA3AF',
      marginTop: 4,
      fontWeight: 400,
    },
    newBtn: {
      display: 'inline-flex',
      alignItems: 'center',
      gap: 8,
      background: '#3B5BDB',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      padding: '10px 18px',
      borderRadius: 12,
      border: 'none',
      cursor: 'pointer',
      boxShadow: '0 4px 14px rgba(59,91,219,0.30)',
      transition: 'transform 0.15s, box-shadow 0.15s',
      letterSpacing: '0.01em',
    },
    searchWrap: {
      position: 'relative',
      marginBottom: 28,
    },
    searchIcon: {
      position: 'absolute',
      left: 14,
      top: '50%',
      transform: 'translateY(-50%)',
      color: '#9CA3AF',
      pointerEvents: 'none',
    },
    searchInput: {
      width: '100%',
      padding: '11px 16px 11px 42px',
      background: '#fff',
      border: '1.5px solid #E5E7EB',
      borderRadius: 12,
      fontSize: 13,
      color: '#374151',
      outline: 'none',
      boxSizing: 'border-box',
      boxShadow: '0 1px 4px rgba(0,0,0,0.04)',
      transition: 'border 0.2s',
    },
    statsRow: {
      display: 'flex',
      gap: 14,
      marginBottom: 28,
    },
    statChip: {
      background: '#fff',
      border: '1.5px solid #E5E7EB',
      borderRadius: 10,
      padding: '8px 16px',
      fontSize: 13,
      color: '#6B7280',
      fontWeight: 500,
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    statNum: {
      fontWeight: 700,
      color: '#111827',
      fontSize: 14,
    },
    grid: {
      display: 'grid',
      gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))',
      gap: 18,
    },
    card: {
      background: '#fff',
      borderRadius: 16,
      border: '1.5px solid #E5E7EB',
      overflow: 'hidden',
      cursor: 'default',
      transition: 'transform 0.18s, box-shadow 0.18s, border-color 0.18s',
      position: 'relative',
    },
    cardHovered: {
      transform: 'translateY(-3px)',
      boxShadow: '0 12px 32px rgba(59,91,219,0.10)',
      borderColor: '#C7D2FE',
    },
    cardTopBar: (palette: { bg: string }) => ({
      height: 5,
      background: palette.bg,
    } as React.CSSProperties),
    cardBody: {
      padding: '18px 20px 16px',
    },
    cardHead: {
      display: 'flex',
      alignItems: 'flex-start',
      justifyContent: 'space-between',
      marginBottom: 14,
    },
    avatarWrap: {
      display: 'flex',
      alignItems: 'center',
      gap: 12,
    },
    avatar: (palette: { bg: string }) => ({
      width: 44,
      height: 44,
      borderRadius: 12,
      background: palette.bg,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      color: '#fff',
      fontSize: 14,
      fontWeight: 700,
      flexShrink: 0,
      letterSpacing: '0.03em',
    } as React.CSSProperties),
    nome: {
      fontSize: 14,
      fontWeight: 700,
      color: '#111827',
      marginBottom: 2,
      lineHeight: 1.3,
    },
    cnpj: {
      fontSize: 11,
      color: '#9CA3AF',
      fontFamily: 'monospace',
      letterSpacing: '0.02em',
    },
    actions: (visible: boolean) => ({
      display: 'flex',
      gap: 4,
      opacity: visible ? 1 : 0,
      transition: 'opacity 0.15s',
    } as React.CSSProperties),
    actionBtn: (color: string, hoverBg: string) => ({
      width: 30,
      height: 30,
      borderRadius: 8,
      border: 'none',
      background: 'transparent',
      color,
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      transition: 'background 0.15s',
    } as React.CSSProperties),
    divider: {
      height: 1,
      background: '#F3F4F6',
      margin: '12px 0',
    },
    infoRow: {
      display: 'flex',
      alignItems: 'center',
      gap: 8,
      marginBottom: 7,
    },
    infoText: {
      fontSize: 12,
      color: '#6B7280',
      overflow: 'hidden',
      textOverflow: 'ellipsis',
      whiteSpace: 'nowrap',
    },
    cardFooter: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingTop: 10,
      marginTop: 4,
      borderTop: '1px solid #F3F4F6',
    },
    contactChip: {
      display: 'flex',
      alignItems: 'center',
      gap: 6,
    },
    contactAvatar: {
      width: 22,
      height: 22,
      borderRadius: 999,
      background: '#EEF2FF',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      fontSize: 9,
      fontWeight: 700,
      color: '#3B5BDB',
    },
    contactName: {
      fontSize: 11,
      color: '#6B7280',
    },
    productBadge: (palette: { bg: string; light: string }) => ({
      fontSize: 11,
      fontWeight: 600,
      color: palette.bg,
      background: palette.light,
      padding: '4px 10px',
      borderRadius: 999,
    } as React.CSSProperties),
    // Modal
    overlay: {
      position: 'fixed',
      inset: 0,
      background: 'rgba(17,24,39,0.45)',
      backdropFilter: 'blur(4px)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 50,
      padding: 16,
    },
    modal: {
      background: '#fff',
      borderRadius: 20,
      width: '100%',
      maxWidth: 440,
      boxShadow: '0 24px 60px rgba(0,0,0,0.15)',
      overflow: 'hidden',
    },
    modalHeader: {
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '20px 24px 16px',
      borderBottom: '1px solid #F3F4F6',
    },
    modalTitle: {
      fontSize: 15,
      fontWeight: 700,
      color: '#111827',
    },
    closeBtn: {
      width: 32,
      height: 32,
      borderRadius: 8,
      border: 'none',
      background: '#F9FAFB',
      color: '#9CA3AF',
      cursor: 'pointer',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
    },
    modalBody: {
      padding: '20px 24px 24px',
      display: 'flex',
      flexDirection: 'column',
      gap: 14,
    },
    fieldLabel: {
      display: 'block',
      fontSize: 11,
      fontWeight: 600,
      color: '#374151',
      marginBottom: 5,
      textTransform: 'uppercase',
      letterSpacing: '0.05em',
    },
    fieldInput: {
      width: '100%',
      padding: '10px 14px',
      border: '1.5px solid #E5E7EB',
      borderRadius: 10,
      fontSize: 13,
      color: '#111827',
      outline: 'none',
      boxSizing: 'border-box',
      background: '#FAFAFA',
      transition: 'border 0.2s, background 0.2s',
    },
    modalFooter: {
      display: 'flex',
      gap: 10,
      paddingTop: 4,
    },
    cancelBtn: {
      flex: 1,
      padding: '11px 0',
      border: '1.5px solid #E5E7EB',
      borderRadius: 10,
      background: '#fff',
      color: '#6B7280',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
    },
    submitBtn: {
      flex: 1,
      padding: '11px 0',
      border: 'none',
      borderRadius: 10,
      background: '#3B5BDB',
      color: '#fff',
      fontSize: 13,
      fontWeight: 600,
      cursor: 'pointer',
      boxShadow: '0 4px 12px rgba(59,91,219,0.28)',
    },
    // Empty state
    emptyWrap: {
      display: 'flex',
      flexDirection: 'column',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '64px 24px',
      background: '#fff',
      borderRadius: 20,
      border: '1.5px dashed #E5E7EB',
      textAlign: 'center',
    },
    emptyIcon: {
      width: 56,
      height: 56,
      background: '#EEF2FF',
      borderRadius: 16,
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      marginBottom: 16,
    },
  }

  return (
    <div style={styles.page}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&display=swap');
        .search-input:focus { border-color: #3B5BDB !important; background: #fff !important; }
        .field-input:focus { border-color: #3B5BDB !important; background: #fff !important; }
        .new-btn:hover { transform: translateY(-1px); box-shadow: 0 6px 20px rgba(59,91,219,0.38) !important; }
        .new-btn:active { transform: scale(0.97); }
        .action-edit:hover { background: #EEF2FF !important; }
        .action-del:hover { background: #FEF2F2 !important; }
        .cancel-btn:hover { background: #F9FAFB !important; }
        .submit-btn:hover { background: #2F4AC7 !important; }
      `}</style>

      {/* Header */}
      <div style={styles.header}>
        <div>
          <h1 style={styles.title}>Fornecedores</h1>
          <p style={styles.subtitle}>Gerencie seus fornecedores cadastrados</p>
        </div>
        <button
          className="new-btn"
          onClick={() => handleOpenModal()}
          style={styles.newBtn}
        >
          <svg width="15" height="15" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
          </svg>
          Novo Fornecedor
        </button>
      </div>

      {/* Stats */}
      <div style={styles.statsRow}>
        <div style={styles.statChip}>
          <svg width="14" height="14" fill="none" stroke="#3B5BDB" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5" />
          </svg>
          <span style={styles.statNum}>{fornecedores.length}</span>
          <span>fornecedor{fornecedores.length !== 1 ? 'es' : ''}</span>
        </div>

      </div>

      {/* Search */}
      <div style={styles.searchWrap}>
        <span style={styles.searchIcon}>
          <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
        </span>
        <input
          className="search-input"
          type="text"
          placeholder="Buscar por nome, CNPJ ou contato..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          style={styles.searchInput}
        />
      </div>

      {/* Empty state */}
      {fornecedores.length === 0 ? (
        <div style={styles.emptyWrap as React.CSSProperties}>
          <div style={styles.emptyIcon}>
            <svg width="24" height="24" fill="none" stroke="#3B5BDB" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
            </svg>
          </div>
          <p style={{ color: '#374151', fontWeight: 600, fontSize: 14, margin: 0 }}>Nenhum fornecedor encontrado</p>
          <p style={{ color: '#9CA3AF', fontSize: 13, marginTop: 4 }}>Tente ajustar sua busca ou cadastre um novo</p>
        </div>
      ) : (
        <div style={styles.grid}>
          {fornecedores.map((fornecedor, idx) => {
            const palette = getPalette(idx)
            const isHovered = activeCard === fornecedor.id
            return (
              <div
                key={fornecedor.id}
                style={{
                  ...styles.card,
                  ...(isHovered ? styles.cardHovered : {})
                }}
                onMouseEnter={() => setActiveCard(fornecedor.id)}
                onMouseLeave={() => setActiveCard(null)}
              >
                {/* Barra colorida no topo */}
                <div style={styles.cardTopBar(palette)} />

                <div style={styles.cardBody}>
                  {/* Cabeçalho */}
                  <div style={styles.cardHead}>
                    <div style={styles.avatarWrap}>
                      <div style={styles.avatar(palette)}>
                        {getInitials(fornecedor.nome)}
                      </div>
                      <div>
                        <p style={styles.nome}>{fornecedor.nome}</p>
                        <p style={styles.cnpj}>{fornecedor.cnpj || 'CNPJ não informado'}</p>
                      </div>
                    </div>

                    {/* Botões de ação */}
                    <div style={styles.actions(isHovered)}>
                      <button
                        className="action-edit"
                        onClick={() => handleOpenModal(fornecedor)}
                        style={styles.actionBtn('#3B5BDB', '#EEF2FF')}
                        title="Editar"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        className="action-del"
                        onClick={() => setConfirmDelete(fornecedor.id)}
                        style={styles.actionBtn('#EF4444', '#FEF2F2')}
                        title="Excluir"
                      >
                        <svg width="14" height="14" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </div>

                  {/* Contatos */}
                  <div style={{ marginBottom: 10 }}>
                    {fornecedor.email && (
                      <div style={styles.infoRow}>
                        <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                        </svg>
                        <span style={styles.infoText}>{fornecedor.email}</span>
                      </div>
                    )}
                    {fornecedor.telefone && (
                      <div style={styles.infoRow}>
                        <svg width="13" height="13" fill="none" stroke="#9CA3AF" viewBox="0 0 24 24" style={{ flexShrink: 0 }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                        </svg>
                        <span style={styles.infoText}>{fornecedor.telefone}</span>
                      </div>
                    )}
                    {!fornecedor.email && !fornecedor.telefone && (
                      <p style={{ fontSize: 12, color: '#D1D5DB', fontStyle: 'italic' }}>Sem informações de contato</p>
                    )}
                  </div>

                  {/* Rodapé */}
                  <div style={styles.cardFooter}>
                    {fornecedor.contato ? (
                      <div style={styles.contactChip}>
                        <div style={styles.contactAvatar}>
                          {fornecedor.contato[0].toUpperCase()}
                        </div>
                        <span style={styles.contactName}>{fornecedor.contato}</span>
                      </div>
                    ) : (
                      <span style={{ fontSize: 11, color: '#D1D5DB' }}>Sem responsável</span>
                    )}

                    <div style={styles.productBadge(palette)}>
                      {fornecedor.total_produtos || 0} produto{(fornecedor.total_produtos || 0) !== 1 ? 's' : ''}
                    </div>
                  </div>
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div style={styles.overlay}>
          <div style={styles.modal}>
            <div style={styles.modalHeader}>
              <h2 style={styles.modalTitle}>
                {editingFornecedor ? 'Editar Fornecedor' : 'Novo Fornecedor'}
              </h2>
              <button className="close-btn" onClick={handleCloseModal} style={styles.closeBtn}>
                <svg width="16" height="16" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div style={styles.modalBody as React.CSSProperties}>
                {[
                  { label: 'Nome', name: 'nome', placeholder: 'Razão social ou nome', required: true, type: 'text' },
                  { label: 'CNPJ', name: 'cnpj', placeholder: '00.000.000/0000-00', maxLength: 18, type: 'text' },
                  { label: 'Responsável', name: 'contato', placeholder: 'Nome do responsável', type: 'text' },
                  { label: 'Email', name: 'email', placeholder: 'contato@fornecedor.com', type: 'email' },
                  { label: 'Telefone', name: 'telefone', placeholder: '(00) 00000-0000', maxLength: 15, type: 'text' },
                ].map(({ label, name, placeholder, required, type, maxLength }) => (
                  <div key={name}>
                    <label style={styles.fieldLabel}>
                      {label} {required && <span style={{ color: '#3B5BDB' }}>*</span>}
                    </label>
                    <input
                      className="field-input"
                      type={type}
                      name={name}
                      value={formData[name as keyof typeof formData]}
                      onChange={handleInputChange}
                      placeholder={placeholder}
                      maxLength={maxLength}
                      required={required}
                      style={styles.fieldInput}
                    />
                  </div>
                ))}

                <div style={styles.modalFooter}>
                  <button type="button" className="cancel-btn" onClick={handleCloseModal} style={styles.cancelBtn}>
                    Cancelar
                  </button>
                  <button type="submit" className="submit-btn" style={styles.submitBtn}>
                    {editingFornecedor ? 'Atualizar' : 'Criar Fornecedor'}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {confirmDelete && (
        <ConfirmModal
          isOpen={true}
          title="Excluir Fornecedor"
          message="Tem certeza que deseja excluir este fornecedor? Esta ação não pode ser desfeita."
          onConfirm={() => handleDelete(confirmDelete)}
          onCancel={() => setConfirmDelete(null)}
        />
      )}

      {toast && <Toast message={toast.message} type={toast.type} onClose={() => setToast(null)} />}
    </div>
  )
}