import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Shield, Clock, ArrowUpRight, ArrowDownLeft,
  Lock, LogIn, RefreshCw
} from 'lucide-react'

interface ActivityItem {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  descricao: string
  produto: string
  quantidade: number
  dataHora: string
}

export default function Profile() {
  const { user, token } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const lastLogin = 'Hoje às 10:30'

  // Gera iniciais do nome
  const getInitials = (nome?: string) => {
    if (!nome) return 'U'
    return nome
      .split(' ')
      .slice(0, 2)
      .map(n => n[0])
      .join('')
      .toUpperCase()
  }

  // Cor do badge por perfil
  const getBadgeStyle = () => {
    if (user?.perfil === 'ADMIN') {
      return { bg: 'rgba(59,130,246,0.12)', color: '#1e40af', label: 'Administrador', icon: Shield }
    }
    return { bg: 'rgba(16,185,129,0.12)', color: '#047857', label: 'Gestor', icon: Shield }
  }

  // Busca atividades recentes do usuário
  const fetchActivities = async () => {
    try {
      const response = await fetch('/api/movimentacoes?limit=5', {
        headers: { Authorization: `Bearer ${token}` }
      })
      if (response.ok) {
        const result = await response.json()
        const formattedActivities = result.data?.map((mov: any) => ({
          id: mov.id,
          tipo: mov.tipo,
          descricao: getActivityDescription(mov.tipo, mov.produto_nome),
          produto: mov.produto_nome,
          quantidade: mov.quantidade,
          dataHora: formatDate(mov.created_at)
        })) || []
        setActivities(formattedActivities)
      }
    } catch (error) {
      console.error('Erro ao carregar atividades:', error)
    } finally {
      setIsLoading(false)
    }
  }

  const getActivityDescription = (tipo: string, produtoNome: string): string => {
    if (tipo === 'ENTRADA') {
      return `Você registrou uma entrada de ${produtoNome}`
    } else if (tipo === 'SAIDA') {
      return `Você registrou uma saída de ${produtoNome}`
    }
    return `Você realizou uma ação em ${produtoNome}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)

    const isToday = date.toDateString() === today.toDateString()
    const isYesterday = date.toDateString() === yesterday.toDateString()

    if (isToday) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (isYesterday) {
      return `Ontem às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    }

    return date.toLocaleDateString('pt-BR', { day: '2-digit', month: '2-digit', year: '2-digit' })
  }

  const getActivityIcon = (tipo: string) => {
    if (tipo === 'ENTRADA') return <ArrowUpRight size={18} color="#34d399" strokeWidth={2.5} />
    if (tipo === 'SAIDA') return <ArrowDownLeft size={18} color="#fb7185" strokeWidth={2.5} />
    return <Clock size={18} color="#fbbf24" strokeWidth={2.5} />
  }

  const getActivityIconBg = (tipo: string) => {
    if (tipo === 'ENTRADA') return 'rgba(16,185,129,0.12)'
    if (tipo === 'SAIDA') return 'rgba(244,63,94,0.12)'
    return 'rgba(251,191,36,0.12)'
  }

  useEffect(() => {
    fetchActivities()
  }, [token])

  const badgeStyle = getBadgeStyle()

  return (
    <>
      <style>{profileStyles}</style>
      <div className="profile-root">
        {/* Background Orbs */}
        <div className="profile-bg-orb profile-bg-orb--1" />
        <div className="profile-bg-orb profile-bg-orb--2" />

        <div className="profile-content">
          {/* Header */}
          <header className="profile-header">
            <h1 className="profile-header__title">Meu Perfil</h1>
            <p className="profile-header__subtitle">Informações e histórico de atividades</p>
          </header>

          {/* Main Grid */}
          <div className="profile-grid">
            {/* Left Column: Informações */}
            <div className="profile-column profile-column--left">
              {/* Card de Informações Pessoais */}
              <div className="profile-card" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }}>
                <div className="profile-card__header">
                  <h2 className="profile-card__title">Informações Pessoais</h2>
                </div>

                {/* Avatar Section */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar" style={{ background: `linear-gradient(135deg, #3b82f6, #2563eb)` }}>
                    <span className="profile-avatar__text">{getInitials(user?.nome)}</span>
                  </div>
                  <div className="profile-avatar-info">
                    <p className="profile-avatar-info__name">{user?.nome || 'Usuário'}</p>
                    <p className="profile-avatar-info__email">{user?.email || 'email@example.com'}</p>
                  </div>
                </div>

                {/* Form Fields - Read Only */}
                <div className="profile-form-group">
                  <label className="profile-form-label">Nome Completo</label>
                  <input
                    type="text"
                    value={user?.nome || ''}
                    disabled
                    className="profile-form-input profile-form-input--disabled"
                    readOnly
                  />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">E-mail</label>
                  <input
                    type="email"
                    value={user?.email || ''}
                    disabled
                    className="profile-form-input profile-form-input--disabled"
                    readOnly
                  />
                </div>

                {/* Access Badge */}
                <div className="profile-badge-section">
                  <label className="profile-form-label">Nível de Acesso</label>
                  <div className="profile-badge" style={{ background: badgeStyle.bg, borderColor: badgeStyle.color }}>
                    <badgeStyle.icon size={16} color={badgeStyle.color} />
                    <span style={{ color: badgeStyle.color }}>{badgeStyle.label}</span>
                  </div>
                </div>
              </div>

              {/* Card de Segurança */}
              <div className="profile-card" style={{ background: 'rgba(244,63,94,0.06)', borderColor: 'rgba(244,63,94,0.15)' }}>
                <div className="profile-card__header">
                  <h2 className="profile-card__title">Informações de Segurança</h2>
                </div>

                <div className="profile-security-item">
                  <div className="profile-security-item__icon" style={{ background: 'rgba(245,158,11,0.12)' }}>
                    <Lock size={18} color="#f59e0b" />
                  </div>
                  <div className="profile-security-item__content">
                    <p className="profile-security-item__label">Tipo de Autenticação</p>
                    <p className="profile-security-item__value">JWT com chave criptografada</p>
                  </div>
                </div>

                <div className="profile-security-divider" />

                <div className="profile-security-item">
                  <div className="profile-security-item__icon" style={{ background: 'rgba(16,185,129,0.12)' }}>
                    <LogIn size={18} color="#34d399" />
                  </div>
                  <div className="profile-security-item__content">
                    <p className="profile-security-item__label">Último Acesso</p>
                    <p className="profile-security-item__value">{lastLogin}</p>
                  </div>
                </div>

                <div className="profile-security-divider" />

                <p className="profile-security-note">
                  A alteração de senha será implementada em uma próxima atualização.
                </p>
              </div>
            </div>

            {/* Right Column: Atividades */}
            <div className="profile-column profile-column--right">
              <div className="profile-card" style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <div className="profile-card__header">
                  <h2 className="profile-card__title">Minhas Atividades Recentes</h2>
                  <button
                    className="profile-refresh-btn"
                    onClick={fetchActivities}
                    title="Atualizar atividades"
                  >
                    <RefreshCw size={16} />
                  </button>
                </div>

                {isLoading ? (
                  <div className="profile-loading">
                    <RefreshCw size={24} color="#3b82f6" className="profile-loading__spinner" />
                    <p>Carregando atividades...</p>
                  </div>
                ) : activities.length === 0 ? (
                  <div className="profile-empty-state">
                    <Clock size={28} color="#cbd5e1" />
                    <p>Nenhuma atividade registrada</p>
                  </div>
                ) : (
                  <div className="profile-activities">
                    {activities.map((activity) => (
                      <div key={activity.id} className="profile-activity-item">
                        <div
                          className="profile-activity-item__icon"
                          style={{ background: getActivityIconBg(activity.tipo) }}
                        >
                          {getActivityIcon(activity.tipo)}
                        </div>

                        <div className="profile-activity-item__content">
                          <p className="profile-activity-item__description">
                            {activity.descricao}
                          </p>
                          <p className="profile-activity-item__details">
                            {activity.quantidade} unidade{activity.quantidade !== 1 ? 's' : ''}
                          </p>
                        </div>

                        <div className="profile-activity-item__time">
                          <p>{activity.dataHora}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  )
}

const profileStyles = `
  * {
    box-sizing: border-box;
  }

  .profile-root {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    overflow: hidden;
  }

  .profile-bg-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .profile-bg-orb--1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
    top: -150px;
    right: -150px;
  }

  .profile-bg-orb--2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
  }

  .profile-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  /* Header */
  .profile-header {
    margin-bottom: 40px;
  }

  .profile-header__title {
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .profile-header__subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  /* Grid Layout */
  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }

  @media (max-width: 1024px) {
    .profile-grid {
      grid-template-columns: 1fr;
    }
  }

  .profile-column {
    display: flex;
    flex-direction: column;
    gap: 24px;
  }

  /* Card */
  .profile-card {
    background: white;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
    transition: all 0.3s ease;
  }

  .profile-card:hover {
    box-shadow: 0 4px 12px rgba(0, 0, 0, 0.08);
  }

  .profile-card__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    margin-bottom: 24px;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  }

  .profile-card__title {
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
    margin: 0;
  }

  /* Avatar Section */
  .profile-avatar-section {
    display: flex;
    align-items: center;
    gap: 20px;
    margin-bottom: 28px;
    padding-bottom: 24px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  }

  .profile-avatar {
    width: 80px;
    height: 80px;
    border-radius: 12px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.2);
  }

  .profile-avatar__text {
    color: white;
    font-size: 24px;
    font-weight: 700;
    letter-spacing: -0.5px;
  }

  .profile-avatar-info {
    flex: 1;
  }

  .profile-avatar-info__name {
    margin: 0;
    font-size: 16px;
    font-weight: 600;
    color: #0f172a;
  }

  .profile-avatar-info__email {
    margin: 4px 0 0 0;
    font-size: 13px;
    color: #64748b;
  }

  /* Form Group */
  .profile-form-group {
    margin-bottom: 20px;
  }

  .profile-form-label {
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-bottom: 8px;
  }

  .profile-form-input {
    width: 100%;
    padding: 12px 14px;
    border: 1px solid rgba(203, 213, 225, 0.6);
    border-radius: 8px;
    font-size: 14px;
    color: #0f172a;
    background: #f8fafc;
    font-family: inherit;
    transition: all 0.2s ease;
  }

  .profile-form-input:focus {
    outline: none;
    border-color: #3b82f6;
    background: #fff;
    box-shadow: 0 0 0 3px rgba(59, 130, 246, 0.1);
  }

  .profile-form-input--disabled {
    background: rgba(226, 232, 240, 0.4);
    color: #475569;
    cursor: not-allowed;
    border-color: rgba(203, 213, 225, 0.3);
  }

  .profile-form-input--disabled:focus {
    background: rgba(226, 232, 240, 0.4);
    border-color: rgba(203, 213, 225, 0.3);
    box-shadow: none;
  }

  /* Badge Section */
  .profile-badge-section {
    margin-top: 24px;
    padding-top: 24px;
    border-top: 1px solid rgba(203, 213, 225, 0.3);
  }

  .profile-badge {
    display: inline-flex;
    align-items: center;
    gap: 8px;
    padding: 10px 16px;
    border: 1.5px solid;
    border-radius: 8px;
    font-size: 13px;
    font-weight: 600;
  }

  /* Security Section */
  .profile-security-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 16px 0;
  }

  .profile-security-item__icon {
    width: 44px;
    height: 44px;
    border-radius: 8px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .profile-security-item__content {
    flex: 1;
  }

  .profile-security-item__label {
    margin: 0;
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .profile-security-item__value {
    margin: 6px 0 0 0;
    font-size: 14px;
    font-weight: 500;
    color: #0f172a;
  }

  .profile-security-divider {
    height: 1px;
    background: rgba(203, 213, 225, 0.3);
    margin: 8px 0;
  }

  .profile-security-note {
    margin-top: 16px;
    padding: 12px;
    background: rgba(226, 232, 240, 0.5);
    border-left: 3px solid #94a3b8;
    border-radius: 4px;
    font-size: 12px;
    color: #64748b;
  }

  /* Refresh Button */
  .profile-refresh-btn {
    width: 32px;
    height: 32px;
    border: none;
    border-radius: 6px;
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
    cursor: pointer;
    display: flex;
    align-items: center;
    justify-content: center;
    transition: all 0.2s ease;
    padding: 0;
  }

  .profile-refresh-btn:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .profile-refresh-btn:active {
    transform: scale(0.95);
  }

  /* Loading State */
  .profile-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #64748b;
  }

  .profile-loading__spinner {
    animation: spin 2s linear infinite;
    margin-bottom: 16px;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  /* Empty State */
  .profile-empty-state {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #cbd5e1;
  }

  .profile-empty-state p {
    margin: 12px 0 0 0;
    font-size: 14px;
    color: #94a3b8;
  }

  /* Activities List */
  .profile-activities {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .profile-activity-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 14px;
    border-radius: 8px;
    background: rgba(226, 232, 240, 0.3);
    transition: all 0.2s ease;
  }

  .profile-activity-item:hover {
    background: rgba(226, 232, 240, 0.5);
    transform: translateX(2px);
  }

  .profile-activity-item__icon {
    width: 36px;
    height: 36px;
    border-radius: 6px;
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }

  .profile-activity-item__content {
    flex: 1;
    min-width: 0;
  }

  .profile-activity-item__description {
    margin: 0;
    font-size: 13px;
    font-weight: 500;
    color: #0f172a;
    word-break: break-word;
  }

  .profile-activity-item__details {
    margin: 4px 0 0 0;
    font-size: 12px;
    color: #64748b;
  }

  .profile-activity-item__time {
    flex-shrink: 0;
    text-align: right;
  }

  .profile-activity-item__time p {
    margin: 0;
    font-size: 12px;
    color: #94a3b8;
    white-space: nowrap;
  }

  @media (max-width: 768px) {
    .profile-content {
      padding: 24px 16px;
    }

    .profile-header__title {
      font-size: 24px;
    }

    .profile-grid {
      gap: 20px;
    }

    .profile-card {
      padding: 20px;
    }

    .profile-avatar-section {
      flex-direction: column;
      text-align: center;
      gap: 16px;
    }

    .profile-activity-item {
      flex-wrap: wrap;
    }

    .profile-activity-item__time {
      width: 100%;
      text-align: left;
      margin-top: 4px;
    }
  }
`
