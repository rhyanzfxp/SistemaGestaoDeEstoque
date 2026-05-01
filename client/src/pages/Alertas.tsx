import { useEffect, useState, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  AlertTriangle, Clock, CheckCircle, Eye, EyeOff,
  RefreshCw, BellOff, Filter, Bell, Package, CalendarX
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'
import { useRealtime } from '../hooks/useRealtime'

interface Alerta {
  id: string
  tipo: 'ESTOQUE_MINIMO' | 'VENCIMENTO_PROXIMO' | 'VENCIDO'
  produto_id: string
  produto_nome: string
  produto_codigo: string
  descricao: string
  visualizado: boolean
  visualizado_em: string | null
  created_at: string
}

type Filtro = 'pendentes' | 'visualizados' | 'todos'

function getTipoConfig(tipo: Alerta['tipo']) {
  if (tipo === 'ESTOQUE_MINIMO') {
    return {
      label: 'Estoque Mínimo',
      icon: Package,
      color: '#f59e0b',
      bg: 'rgba(245,158,11,0.10)',
      border: 'rgba(245,158,11,0.25)',
      tag: 'ESTOQUE',
    }
  }
  if (tipo === 'VENCIMENTO_PROXIMO') {
    return {
      label: 'Vencimento Próximo',
      icon: Clock,
      color: '#f97316',
      bg: 'rgba(249,115,22,0.10)',
      border: 'rgba(249,115,22,0.25)',
      tag: 'VENCIMENTO',
    }
  }
  return {
    label: 'Produto Vencido',
    icon: CalendarX,
    color: '#f43f5e',
    bg: 'rgba(244,63,94,0.10)',
    border: 'rgba(244,63,94,0.25)',
    tag: 'VENCIDO',
  }
}

export default function Alertas() {
  const [alertas, setAlertas] = useState<Alerta[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [filtro, setFiltro] = useState<Filtro>('pendentes')
  const [marcandoTodos, setMarcandoTodos] = useState(false)
  const [marcando, setMarcando] = useState<string | null>(null)
  const { token } = useAuth()
  const navigate = useNavigate()

  const fetchAlertas = useCallback(async () => {
    try {
      const params = filtro === 'pendentes'
        ? '?visualizado=false'
        : filtro === 'visualizados'
          ? '?visualizado=true'
          : ''

      const res = await fetch(`/api/alertas${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })
      const data = await res.json()
      setAlertas(Array.isArray(data) ? data : [])
    } catch {
      setAlertas([])
    } finally {
      setIsLoading(false)
    }
  }, [token, filtro])

  useRealtime('alertas_atualizados', fetchAlertas)
  useRealtime('estoque_atualizado', fetchAlertas)

  useEffect(() => {
    setIsLoading(true)
    fetchAlertas()
  }, [fetchAlertas])

  const marcarVisualizado = async (id: string) => {
    setMarcando(id)
    try {
      await fetch(`/api/alertas/${id}/visualizar`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchAlertas()
    } finally {
      setMarcando(null)
    }
  }

  const marcarTodos = async () => {
    setMarcandoTodos(true)
    try {
      await fetch('/api/alertas/visualizar-todos', {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` }
      })
      await fetchAlertas()
    } finally {
      setMarcandoTodos(false)
    }
  }

  const pendentes = alertas.filter(a => !a.visualizado).length

  return (
    <>
      <style>{alertStyles}</style>
      <div className="al-root">
        <div className="al-bg-orb al-bg-orb--1" />
        <div className="al-bg-orb al-bg-orb--2" />

        <div className="al-content">
          <header className="al-header">
            <div className="al-header__left">
              <div className="al-header__icon-wrap">
                <Bell size={22} color="#f59e0b" strokeWidth={2.2} />
              </div>
              <div>
                <h1 className="al-header__title">Central de Alertas</h1>
                <p className="al-header__subtitle">
                  Monitore estoque mínimo e vencimentos
                </p>
              </div>
            </div>

            <div className="al-header__actions">
              {filtro === 'pendentes' && pendentes > 0 && (
                <button
                  className="al-btn al-btn--ghost"
                  onClick={marcarTodos}
                  disabled={marcandoTodos}
                  id="btn-marcar-todos"
                >
                  {marcandoTodos
                    ? <RefreshCw size={14} style={{ animation: 'al-spin 1s linear infinite' }} />
                    : <CheckCircle size={14} />
                  }
                  Marcar todos como vistos
                </button>
              )}
            </div>
          </header>

          <div className="al-filters">
            <div className="al-filters__tabs">
              {(['pendentes', 'visualizados', 'todos'] as Filtro[]).map(f => (
                <button
                  key={f}
                  className={`al-filter-tab ${filtro === f ? 'al-filter-tab--active' : ''}`}
                  onClick={() => setFiltro(f)}
                  id={`tab-${f}`}
                >
                  {f === 'pendentes' && <Bell size={13} />}
                  {f === 'visualizados' && <Eye size={13} />}
                  {f === 'todos' && <Filter size={13} />}
                  {f === 'pendentes' ? 'Pendentes' : f === 'visualizados' ? 'Visualizados' : 'Todos'}
                </button>
              ))}
            </div>

            <div className="al-filters__right">
              <div className="al-count-badge">
                <span className="al-count-dot" />
                {isLoading ? '...' : `${alertas.length} alerta${alertas.length !== 1 ? 's' : ''}`}
              </div>
            </div>
          </div>

          {isLoading ? (
            <div className="al-loading">
              <RefreshCw size={26} color="#f59e0b" style={{ animation: 'al-spin 1s linear infinite' }} />
              <p>Carregando alertas...</p>
            </div>
          ) : alertas.length === 0 ? (
            <div className="al-empty">
              <div className="al-empty__icon">
                <BellOff size={32} color="#64748b" />
              </div>
              <p className="al-empty__title">
                {filtro === 'pendentes'
                  ? 'Nenhum alerta pendente'
                  : filtro === 'visualizados'
                    ? 'Nenhum alerta visualizado'
                    : 'Nenhum alerta registrado'}
              </p>
              <p className="al-empty__sub">
                {filtro === 'pendentes'
                  ? 'Todos os alertas foram verificados. Bom trabalho!'
                  : 'Os alertas aparecerão aqui conforme forem gerados'}
              </p>
            </div>
          ) : (
            <div className="al-list">
              {alertas.map((alerta, i) => {
                const cfg = getTipoConfig(alerta.tipo)
                const Icon = cfg.icon
                return (
                  <div
                    key={alerta.id}
                    className={`al-item ${alerta.visualizado ? 'al-item--seen' : ''}`}
                    style={{
                      borderColor: alerta.visualizado ? 'var(--border-card)' : cfg.border,
                      animationDelay: `${i * 60}ms`
                    }}
                    id={`alerta-${alerta.id}`}
                  >
                    <div
                      className="al-item__icon"
                      style={{
                        background: alerta.visualizado ? 'var(--accent-faint)' : cfg.bg,
                        borderColor: alerta.visualizado ? 'var(--border-card)' : cfg.border,
                      }}
                    >
                      <Icon
                        size={20}
                        color={alerta.visualizado ? 'var(--text-muted)' : cfg.color}
                        strokeWidth={2}
                      />
                    </div>

                    <div className="al-item__body">
                      <div className="al-item__top">
                        <span
                          className="al-item__tag"
                          style={{
                            color: alerta.visualizado ? 'var(--text-muted)' : cfg.color,
                            background: alerta.visualizado ? 'var(--accent-faint)' : cfg.bg,
                          }}
                        >
                          {cfg.tag}
                        </span>
                        <span className="al-item__tipo">{cfg.label}</span>
                        {alerta.visualizado && (
                          <span className="al-item__seen-badge">
                            <Eye size={11} />
                            Visto
                          </span>
                        )}
                      </div>

                      <p className="al-item__produto">{alerta.produto_nome}</p>
                      <p className="al-item__desc">{alerta.descricao}</p>

                      <div className="al-item__meta">
                        <span className="al-item__date">
                          <Clock size={11} />
                          {new Date(alerta.created_at).toLocaleString('pt-BR', {
                            day: '2-digit', month: 'short', year: 'numeric',
                            hour: '2-digit', minute: '2-digit'
                          })}
                        </span>
                        {alerta.visualizado_em && (
                          <span className="al-item__date">
                            <CheckCircle size={11} />
                            Visto em {new Date(alerta.visualizado_em).toLocaleString('pt-BR', {
                              day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit'
                            })}
                          </span>
                        )}
                      </div>
                    </div>

                    {!alerta.visualizado && (
                      <button
                        className="al-item__action"
                        onClick={() => marcarVisualizado(alerta.id)}
                        disabled={marcando === alerta.id}
                        title="Marcar como visto"
                        id={`btn-visualizar-${alerta.id}`}
                      >
                        {marcando === alerta.id
                          ? <RefreshCw size={15} style={{ animation: 'al-spin 1s linear infinite' }} />
                          : <EyeOff size={15} />
                        }
                        <span>Marcar como visto</span>
                      </button>
                    )}
                  </div>
                )
              })}
            </div>
          )}
        </div>
      </div>
    </>
  )
}

const alertStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  @keyframes al-spin { to { transform: rotate(360deg); } }
  @keyframes al-fadeUp { from { opacity:0; transform:translateY(16px); } to { opacity:1; transform:translateY(0); } }

  .al-root {
    flex: 1;
    min-height: 100vh;
    background: var(--bg-page);
    position: relative;
    overflow-x: hidden;
    font-family: 'DM Sans', sans-serif;
  }

  .al-bg-orb {
    position: absolute;
    border-radius: 50%;
    filter: blur(120px);
    pointer-events: none;
    z-index: 0;
  }
  .al-bg-orb--1 {
    width: 600px; height: 500px;
    top: -100px; right: -100px;
    background: radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 70%);
  }
  .al-bg-orb--2 {
    width: 500px; height: 400px;
    bottom: -80px; left: -80px;
    background: radial-gradient(circle, rgba(244,63,94,0.05) 0%, transparent 70%);
  }

  .al-content {
    position: relative;
    z-index: 1;
    max-width: 900px;
    margin: 0 auto;
    padding: 36px 28px 60px;
    display: flex;
    flex-direction: column;
    gap: 28px;
  }

  .al-header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 16px;
  }
  .al-header__left {
    display: flex;
    align-items: center;
    gap: 16px;
  }
  .al-header__icon-wrap {
    width: 52px; height: 52px;
    border-radius: 16px;
    background: rgba(245,158,11,0.12);
    border: 1px solid rgba(245,158,11,0.25);
    display: flex;
    align-items: center;
    justify-content: center;
    flex-shrink: 0;
  }
  .al-header__title {
    font-family: 'Sora', sans-serif;
    font-size: clamp(1.6rem, 3vw, 2.2rem);
    font-weight: 800;
    color: var(--text-primary);
    letter-spacing: -0.03em;
    margin-bottom: 4px;
  }
  .al-header__subtitle {
    font-size: 13px;
    color: var(--text-secondary);
  }
  .al-header__actions {
    display: flex;
    align-items: center;
    gap: 10px;
    flex-wrap: wrap;
  }

  .al-btn {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 9px 18px;
    border-radius: 10px;
    border: none;
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 600;
    cursor: pointer;
    transition: opacity 0.18s, transform 0.15s;
  }
  .al-btn--primary {
    background: linear-gradient(135deg, #2563eb, #1d4ed8);
    color: #fff;
    box-shadow: 0 4px 12px rgba(37,99,235,0.3);
  }
  .al-btn--primary:hover { opacity: 0.88; transform: translateY(-1px); }
  .al-btn--ghost {
    background: var(--bg-card);
    color: var(--text-secondary);
    border: 1px solid var(--border-card);
  }
  .al-btn--ghost:hover { color: var(--text-primary); background: var(--bg-hover); }
  .al-btn:disabled { opacity: 0.5; cursor: not-allowed; transform: none; }

  .al-filters {
    display: flex;
    align-items: center;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
  }
  .al-filters__tabs {
    display: flex;
    gap: 6px;
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 12px;
    padding: 5px;
  }
  .al-filter-tab {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 7px 14px;
    border-radius: 8px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.18s, color 0.18s;
  }
  .al-filter-tab:hover { background: var(--bg-hover); color: var(--text-primary); }
  .al-filter-tab--active {
    background: var(--bg-active) !important;
    color: var(--text-link-active) !important;
    font-weight: 600;
  }
  .al-filters__right { display: flex; align-items: center; gap: 10px; }
  .al-count-badge {
    display: flex;
    align-items: center;
    gap: 7px;
    padding: 6px 13px;
    border-radius: 8px;
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    font-size: 12px;
    font-weight: 600;
    color: var(--text-link-active);
  }
  .al-count-dot {
    width: 7px; height: 7px;
    border-radius: 50%;
    background: #f59e0b;
    box-shadow: 0 0 8px rgba(245,158,11,0.6);
  }

  .al-loading {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 14px;
    padding: 80px 20px;
    color: var(--text-secondary);
    font-size: 14px;
  }

  .al-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 12px;
    padding: 80px 20px;
    text-align: center;
  }
  .al-empty__icon {
    width: 72px; height: 72px;
    border-radius: 20px;
    background: var(--accent-faint);
    border: 1px solid var(--border-card);
    display: flex;
    align-items: center;
    justify-content: center;
    margin-bottom: 8px;
  }
  .al-empty__title {
    font-family: 'Sora', sans-serif;
    font-size: 16px;
    font-weight: 700;
    color: var(--text-secondary);
  }
  .al-empty__sub {
    font-size: 13px;
    color: var(--text-muted);
    max-width: 320px;
  }

  .al-list {
    display: flex;
    flex-direction: column;
    gap: 12px;
  }

  .al-item {
    display: flex;
    align-items: flex-start;
    gap: 16px;
    padding: 20px;
    border-radius: 18px;
    border: 1px solid;
    background: var(--bg-card);
    box-shadow: var(--shadow-card);
    animation: al-fadeUp 0.38s ease both;
    transition: transform 0.18s, box-shadow 0.18s;
  }
  .al-item:hover { transform: translateY(-2px); box-shadow: 0 10px 28px rgba(0,0,0,0.12); }
  .al-item--seen { opacity: 0.65; }
  .al-item--seen:hover { opacity: 0.85; }

  .al-item__icon {
    width: 44px; height: 44px;
    flex-shrink: 0;
    border-radius: 13px;
    border: 1px solid;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-top: 2px;
  }

  .al-item__body { flex: 1; min-width: 0; }

  .al-item__top {
    display: flex;
    align-items: center;
    gap: 8px;
    flex-wrap: wrap;
    margin-bottom: 6px;
  }
  .al-item__tag {
    font-size: 10px;
    font-weight: 700;
    letter-spacing: 0.08em;
    padding: 3px 8px;
    border-radius: 6px;
  }
  .al-item__tipo {
    font-size: 12px;
    font-weight: 600;
    color: var(--text-secondary);
  }
  .al-item__seen-badge {
    display: flex;
    align-items: center;
    gap: 4px;
    font-size: 10px;
    font-weight: 600;
    color: var(--text-muted);
    background: var(--accent-faint);
    padding: 2px 8px;
    border-radius: 6px;
  }

  .al-item__produto {
    font-family: 'Sora', sans-serif;
    font-size: 15px;
    font-weight: 700;
    color: var(--text-primary);
    margin-bottom: 4px;
    white-space: nowrap;
    overflow: hidden;
    text-overflow: ellipsis;
  }
  .al-item__desc {
    font-size: 13px;
    color: var(--text-secondary);
    line-height: 1.5;
    margin-bottom: 10px;
  }
  .al-item__meta {
    display: flex;
    align-items: center;
    gap: 14px;
    flex-wrap: wrap;
  }
  .al-item__date {
    display: flex;
    align-items: center;
    gap: 5px;
    font-size: 11px;
    color: var(--text-muted);
  }

  .al-item__action {
    display: flex;
    flex-direction: column;
    align-items: center;
    gap: 5px;
    padding: 10px 14px;
    border-radius: 12px;
    border: 1px solid var(--border-card);
    background: var(--bg-page);
    color: var(--text-secondary);
    font-family: 'DM Sans', sans-serif;
    font-size: 10px;
    font-weight: 600;
    cursor: pointer;
    flex-shrink: 0;
    transition: background 0.18s, color 0.18s, border-color 0.18s;
    min-width: 80px;
    text-align: center;
    align-self: center;
  }
  .al-item__action:hover {
    background: rgba(34,197,94,0.08);
    border-color: rgba(34,197,94,0.3);
    color: #22c55e;
  }
  .al-item__action:disabled { opacity: 0.5; cursor: not-allowed; }

  @media (max-width: 600px) {
    .al-content { padding: 20px 14px 40px; }
    .al-item { flex-wrap: wrap; }
    .al-item__action { width: 100%; flex-direction: row; justify-content: center; }
  }
`
