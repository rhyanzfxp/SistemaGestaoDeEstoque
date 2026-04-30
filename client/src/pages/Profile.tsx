import { useState, useEffect, useRef } from 'react'
import { useAuth } from '../contexts/AuthContext'
import {
  Shield, Clock, ArrowUpRight, ArrowDownLeft,
  RefreshCw, Camera, Trash2
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
  const { user, token, updateAvatar } = useAuth()
  const [activities, setActivities] = useState<ActivityItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [avatarUploading, setAvatarUploading] = useState(false)
  const [avatarError, setAvatarError] = useState('')
  const [avatarSuccess, setAvatarSuccess] = useState('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const getInitials = (nome?: string) => {
    if (!nome) return 'U'
    return nome.split(' ').slice(0, 2).map(n => n[0]).join('').toUpperCase()
  }

  const getBadgeStyle = () => {
    if (user?.perfil === 'ADMIN') {
      return { bg: 'rgba(59,130,246,0.12)', color: '#1e40af', label: 'Administrador', icon: Shield }
    }
    return { bg: 'rgba(16,185,129,0.12)', color: '#047857', label: 'Gestor', icon: Shield }
  }

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
    if (tipo === 'ENTRADA') return `Você registrou uma entrada de ${produtoNome}`
    if (tipo === 'SAIDA') return `Você registrou uma saída de ${produtoNome}`
    return `Você realizou uma ação em ${produtoNome}`
  }

  const formatDate = (dateString: string): string => {
    const date = new Date(dateString)
    const today = new Date()
    const yesterday = new Date(today)
    yesterday.setDate(yesterday.getDate() - 1)
    if (date.toDateString() === today.toDateString()) {
      return `Hoje às ${date.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}`
    } else if (date.toDateString() === yesterday.toDateString()) {
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

  const handleAvatarChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/gif']
    if (!allowed.includes(file.type)) {
      setAvatarError('Tipo não permitido. Use JPEG, PNG, WebP ou GIF.')
      return
    }
    if (file.size > 5 * 1024 * 1024) {
      setAvatarError('Arquivo muito grande. Máximo 5 MB.')
      return
    }

    setAvatarUploading(true)
    setAvatarError('')
    setAvatarSuccess('')

    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'POST',
        headers: {
          'Content-Type': file.type,
          Authorization: `Bearer ${token}`
        },
        body: file
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.error || 'Erro ao fazer upload')
      }

      const data = await response.json()
      updateAvatar(data.avatar_url)
      setAvatarSuccess('Foto atualizada com sucesso!')
      setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (err: any) {
      setAvatarError(err.message || 'Erro ao fazer upload')
    } finally {
      setAvatarUploading(false)
      // Limpa o input para permitir re-upload do mesmo arquivo
      if (fileInputRef.current) fileInputRef.current.value = ''
    }
  }

  const handleRemoveAvatar = async () => {
    setAvatarUploading(true)
    setAvatarError('')
    setAvatarSuccess('')
    try {
      const response = await fetch('/api/users/me/avatar', {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` }
      })
      if (!response.ok) throw new Error('Erro ao remover foto')
      updateAvatar(null)
      setAvatarSuccess('Foto removida.')
      setTimeout(() => setAvatarSuccess(''), 3000)
    } catch (err: any) {
      setAvatarError(err.message || 'Erro ao remover foto')
    } finally {
      setAvatarUploading(false)
    }
  }

  useEffect(() => {
    fetchActivities()
  }, [token])

  const badgeStyle = getBadgeStyle()

  return (
    <>
      <style>{profileStyles}</style>
      <div className="profile-root">
        <div className="profile-bg-orb profile-bg-orb--1" />
        <div className="profile-bg-orb profile-bg-orb--2" />

        <div className="profile-content">
          <header className="profile-header">
            <h1 className="profile-header__title">Meu Perfil</h1>
            <p className="profile-header__subtitle">Informações e histórico de atividades</p>
          </header>

          <div className="profile-grid">
            {/* Coluna esquerda */}
            <div className="profile-column profile-column--left">
              <div className="profile-card" style={{ background: 'rgba(59,130,246,0.06)', borderColor: 'rgba(59,130,246,0.15)' }}>
                <div className="profile-card__header">
                  <h2 className="profile-card__title">Informações Pessoais</h2>
                </div>

                {/* Avatar com upload */}
                <div className="profile-avatar-section">
                  <div className="profile-avatar-wrapper">
                    <div className="profile-avatar" style={!user?.avatar_url ? { background: 'linear-gradient(135deg, #3b82f6, #2563eb)' } : {}}>
                      {user?.avatar_url
                        ? <img src={user.avatar_url} alt="Foto de perfil" className="profile-avatar__img" />
                        : <span className="profile-avatar__text">{getInitials(user?.nome)}</span>
                      }
                    </div>

                    {/* Botão de câmera sobre o avatar */}
                    <button
                      className="profile-avatar-camera"
                      onClick={() => fileInputRef.current?.click()}
                      disabled={avatarUploading}
                      title="Alterar foto"
                    >
                      {avatarUploading
                        ? <RefreshCw size={14} className="profile-avatar-camera__spinner" />
                        : <Camera size={14} />
                      }
                    </button>

                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      style={{ display: 'none' }}
                      onChange={handleAvatarChange}
                    />
                  </div>

                  <div className="profile-avatar-info">
                    <p className="profile-avatar-info__name">{user?.nome || 'Usuário'}</p>
                    <p className="profile-avatar-info__email">{user?.email || 'email@example.com'}</p>

                    <div className="profile-avatar-actions">
                      <button
                        className="profile-avatar-btn profile-avatar-btn--upload"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={avatarUploading}
                      >
                        <Camera size={13} />
                        {user?.avatar_url ? 'Alterar foto' : 'Adicionar foto'}
                      </button>

                      {user?.avatar_url && (
                        <button
                          className="profile-avatar-btn profile-avatar-btn--remove"
                          onClick={handleRemoveAvatar}
                          disabled={avatarUploading}
                        >
                          <Trash2 size={13} />
                          Remover
                        </button>
                      )}
                    </div>

                    {avatarError && <p className="profile-avatar-msg profile-avatar-msg--error">{avatarError}</p>}
                    {avatarSuccess && <p className="profile-avatar-msg profile-avatar-msg--success">{avatarSuccess}</p>}
                  </div>
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">Nome Completo</label>
                  <input type="text" value={user?.nome || ''} disabled className="profile-form-input profile-form-input--disabled" readOnly />
                </div>

                <div className="profile-form-group">
                  <label className="profile-form-label">E-mail</label>
                  <input type="email" value={user?.email || ''} disabled className="profile-form-input profile-form-input--disabled" readOnly />
                </div>

                <div className="profile-badge-section">
                  <label className="profile-form-label">Nível de Acesso</label>
                  <div className="profile-badge" style={{ background: badgeStyle.bg, borderColor: badgeStyle.color }}>
                    <badgeStyle.icon size={16} color={badgeStyle.color} />
                    <span style={{ color: badgeStyle.color }}>{badgeStyle.label}</span>
                  </div>
                </div>
              </div>

            </div>

            {/* Coluna direita: Atividades */}
            <div className="profile-column profile-column--right">
              <div className="profile-card" style={{ background: 'rgba(16,185,129,0.06)', borderColor: 'rgba(16,185,129,0.15)' }}>
                <div className="profile-card__header">
                  <h2 className="profile-card__title">Minhas Movimentações Recentes</h2>
                  <button className="profile-refresh-btn" onClick={fetchActivities} title="Atualizar atividades">
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
                        <div className="profile-activity-item__icon" style={{ background: getActivityIconBg(activity.tipo) }}>
                          {getActivityIcon(activity.tipo)}
                        </div>
                        <div className="profile-activity-item__content">
                          <p className="profile-activity-item__description">{activity.descricao}</p>
                          <p className="profile-activity-item__details">{activity.quantidade} unidade{activity.quantidade !== 1 ? 's' : ''}</p>
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
  * { box-sizing: border-box; }

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
    width: 500px; height: 500px;
    background: radial-gradient(circle, rgba(59,130,246,0.08) 0%, transparent 70%);
    top: -150px; right: -150px;
  }
  .profile-bg-orb--2 {
    width: 400px; height: 400px;
    background: radial-gradient(circle, rgba(16,185,129,0.08) 0%, transparent 70%);
    bottom: -100px; left: -100px;
  }

  .profile-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  .profile-header { margin-bottom: 40px; }
  .profile-header__title {
    font-size: 32px; font-weight: 700; color: #0f172a;
    margin: 0 0 8px 0; letter-spacing: -0.5px;
  }
  .profile-header__subtitle { font-size: 14px; color: #64748b; margin: 0; }

  .profile-grid {
    display: grid;
    grid-template-columns: 1fr 1fr;
    gap: 28px;
  }
  @media (max-width: 1024px) {
    .profile-grid { grid-template-columns: 1fr; }
  }

  .profile-column { display: flex; flex-direction: column; gap: 24px; }

  .profile-card {
    background: white;
    border: 1px solid rgba(203,213,225,0.5);
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 1px 3px rgba(0,0,0,0.05);
    transition: all 0.3s ease;
  }
  .profile-card:hover { box-shadow: 0 4px 12px rgba(0,0,0,0.08); }

  .profile-card__header {
    display: flex; align-items: center; justify-content: space-between;
    margin-bottom: 24px; padding-bottom: 16px;
    border-bottom: 1px solid rgba(203,213,225,0.3);
  }
  .profile-card__title { font-size: 18px; font-weight: 600; color: #0f172a; margin: 0; }

  /* Avatar section */
  .profile-avatar-section {
    display: flex; align-items: flex-start; gap: 20px;
    margin-bottom: 28px; padding-bottom: 24px;
    border-bottom: 1px solid rgba(203,213,225,0.3);
  }

  .profile-avatar-wrapper {
    position: relative;
    flex-shrink: 0;
  }

  .profile-avatar {
    width: 80px; height: 80px;
    border-radius: 50%;
    display: flex; align-items: center; justify-content: center;
    box-shadow: 0 0 0 3px #fff, 0 0 0 5px rgba(59,130,246,0.3), 0 8px 20px rgba(37,99,235,0.2);
    overflow: hidden;
    flex-shrink: 0;
  }

  .profile-avatar__img {
    width: 100%; height: 100%;
    object-fit: cover;
    border-radius: 50%;
    display: block;
  }

  .profile-avatar__text {
    color: white; font-size: 24px; font-weight: 700; letter-spacing: -0.5px;
  }

  .profile-avatar-camera {
    position: absolute;
    bottom: 0px; right: -4px;
    width: 28px; height: 28px;
    border-radius: 50%;
    border: 2.5px solid white;
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: white;
    display: flex; align-items: center; justify-content: center;
    cursor: pointer;
    transition: transform 0.15s, box-shadow 0.15s;
    padding: 0;
    box-shadow: 0 2px 8px rgba(37,99,235,0.35);
  }
  .profile-avatar-camera:hover:not(:disabled) {
    transform: scale(1.1);
    box-shadow: 0 4px 12px rgba(37,99,235,0.45);
  }
  .profile-avatar-camera:disabled { opacity: 0.6; cursor: not-allowed; }
  .profile-avatar-camera__spinner { animation: spin 0.8s linear infinite; }

  @keyframes spin { to { transform: rotate(360deg); } }

  .profile-avatar-info { flex: 1; min-width: 0; }
  .profile-avatar-info__name { margin: 0; font-size: 16px; font-weight: 600; color: #0f172a; }
  .profile-avatar-info__email { margin: 4px 0 12px 0; font-size: 13px; color: #64748b; }

  .profile-avatar-actions { display: flex; gap: 8px; flex-wrap: wrap; }

  .profile-avatar-btn {
    display: inline-flex; align-items: center; gap: 5px;
    padding: 6px 12px;
    border-radius: 8px; border: none;
    font-size: 12px; font-weight: 600;
    cursor: pointer; transition: opacity 0.15s;
  }
  .profile-avatar-btn:disabled { opacity: 0.5; cursor: not-allowed; }

  .profile-avatar-btn--upload {
    background: rgba(37,99,235,0.1); color: #1d4ed8;
  }
  .profile-avatar-btn--upload:hover:not(:disabled) { background: rgba(37,99,235,0.18); }

  .profile-avatar-btn--remove {
    background: rgba(220,38,38,0.1); color: #dc2626;
  }
  .profile-avatar-btn--remove:hover:not(:disabled) { background: rgba(220,38,38,0.18); }

  .profile-avatar-msg {
    margin: 8px 0 0 0; font-size: 12px; font-weight: 500;
  }
  .profile-avatar-msg--error { color: #dc2626; }
  .profile-avatar-msg--success { color: #059669; }

  /* Form */
  .profile-form-group { margin-bottom: 20px; }
  .profile-form-label {
    display: block; font-size: 12px; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 8px;
  }
  .profile-form-input {
    width: 100%; padding: 12px 14px;
    border: 1px solid rgba(203,213,225,0.6); border-radius: 8px;
    font-size: 14px; color: #0f172a; background: #f8fafc;
    font-family: inherit; transition: all 0.2s ease;
  }
  .profile-form-input--disabled {
    background: rgba(226,232,240,0.4); color: #475569;
    cursor: not-allowed; border-color: rgba(203,213,225,0.3);
  }

  /* Badge */
  .profile-badge-section { margin-top: 24px; padding-top: 24px; border-top: 1px solid rgba(203,213,225,0.3); }
  .profile-badge {
    display: inline-flex; align-items: center; gap: 8px;
    padding: 10px 16px; border: 1.5px solid; border-radius: 8px;
    font-size: 13px; font-weight: 600;
  }

  /* Security */
  .profile-security-item { display: flex; align-items: flex-start; gap: 16px; padding: 16px 0; }
  .profile-security-item__icon {
    width: 44px; height: 44px; border-radius: 8px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .profile-security-item__content { flex: 1; }
  .profile-security-item__label {
    margin: 0; font-size: 12px; font-weight: 600; color: #64748b;
    text-transform: uppercase; letter-spacing: 0.5px;
  }
  .profile-security-item__value { margin: 6px 0 0 0; font-size: 14px; font-weight: 500; color: #0f172a; }
  .profile-security-divider { height: 1px; background: rgba(203,213,225,0.3); margin: 8px 0; }
  .profile-security-note {
    margin-top: 16px; padding: 12px;
    background: rgba(226,232,240,0.5); border-left: 3px solid #94a3b8;
    border-radius: 4px; font-size: 12px; color: #64748b;
  }

  /* Refresh */
  .profile-refresh-btn {
    width: 32px; height: 32px; border: none; border-radius: 6px;
    background: rgba(59,130,246,0.1); color: #3b82f6;
    cursor: pointer; display: flex; align-items: center; justify-content: center;
    transition: all 0.2s ease; padding: 0;
  }
  .profile-refresh-btn:hover { background: rgba(59,130,246,0.15); }

  /* Loading */
  .profile-loading {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 60px 20px; color: #64748b;
  }
  .profile-loading__spinner { animation: spin 2s linear infinite; margin-bottom: 16px; }

  /* Empty */
  .profile-empty-state {
    display: flex; flex-direction: column; align-items: center;
    justify-content: center; padding: 60px 20px; color: #cbd5e1;
  }
  .profile-empty-state p { margin: 12px 0 0 0; font-size: 14px; color: #94a3b8; }

  /* Activities */
  .profile-activities { display: flex; flex-direction: column; gap: 12px; }
  .profile-activity-item {
    display: flex; align-items: flex-start; gap: 14px; padding: 14px;
    border-radius: 8px; background: rgba(226,232,240,0.3); transition: all 0.2s ease;
  }
  .profile-activity-item:hover { background: rgba(226,232,240,0.5); transform: translateX(2px); }
  .profile-activity-item__icon {
    width: 36px; height: 36px; border-radius: 6px;
    display: flex; align-items: center; justify-content: center; flex-shrink: 0;
  }
  .profile-activity-item__content { flex: 1; min-width: 0; }
  .profile-activity-item__description { margin: 0; font-size: 13px; font-weight: 500; color: #0f172a; word-break: break-word; }
  .profile-activity-item__details { margin: 4px 0 0 0; font-size: 12px; color: #64748b; }
  .profile-activity-item__time { flex-shrink: 0; text-align: right; }
  .profile-activity-item__time p { margin: 0; font-size: 12px; color: #94a3b8; white-space: nowrap; }

  @media (max-width: 768px) {
    .profile-content { padding: 24px 16px; }
    .profile-header__title { font-size: 24px; }
    .profile-grid { gap: 20px; }
    .profile-card { padding: 20px; }
    .profile-avatar-section { flex-direction: column; gap: 16px; }
    .profile-activity-item { flex-wrap: wrap; }
    .profile-activity-item__time { width: 100%; text-align: left; margin-top: 4px; }
  }
`
