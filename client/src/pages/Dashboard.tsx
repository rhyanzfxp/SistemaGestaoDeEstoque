import { useEffect, useState } from 'react'
import {
  Package, AlertTriangle, Calendar, TrendingUp,
  ArrowUpRight, ArrowDownRight, Clock, RefreshCw, Boxes
} from 'lucide-react'
import { useAuth } from '../contexts/AuthContext'

interface DashboardData {
  totalProdutos: number
  totalItensEstoque: number
  produtosEstoqueMinimo: number
  produtosProximoVencimento: number
  ultimasMovimentacoes: Array<{
    id: string
    tipo: 'ENTRADA' | 'SAIDA' | 'SOLICITACAO'
    produto: string
    quantidade: number
    usuario: string
    data: string
  }>
}


type Perfil = 'ADMIN' | 'ESTOQUISTA' | 'FUNCIONARIO' | 'GESTAO'

function canWrite(perfil?: Perfil) {
  return perfil === 'ADMIN' || perfil === 'ESTOQUISTA'
}



function getMovIcon(tipo: 'ENTRADA' | 'SAIDA' | 'SOLICITACAO') {
  if (tipo === 'ENTRADA') return <ArrowUpRight size={18} color="#34d399" strokeWidth={2.5} />
  if (tipo === 'SAIDA')   return <ArrowDownRight size={18} color="#fb7185" strokeWidth={2.5} />
  return                         <Clock size={18} color="#fbbf24" strokeWidth={2.5} />
}

function getMovColors(tipo: 'ENTRADA' | 'SAIDA' | 'SOLICITACAO') {
  if (tipo === 'ENTRADA') return { iconBg: 'rgba(16,185,129,0.12)', iconBorder: 'rgba(16,185,129,0.2)', valueColor: '#34d399', prefix: '+' }
  if (tipo === 'SAIDA')   return { iconBg: 'rgba(244,63,94,0.12)',  iconBorder: 'rgba(244,63,94,0.2)',  valueColor: '#fb7185', prefix: '−' }
  return                         { iconBg: 'rgba(251,191,36,0.12)', iconBorder: 'rgba(251,191,36,0.2)', valueColor: '#fbbf24', prefix: '~' }
}

function getMovLabel(tipo: 'ENTRADA' | 'SAIDA' | 'SOLICITACAO') {
  if (tipo === 'ENTRADA') return 'Entrada'
  if (tipo === 'SAIDA')   return 'Saída'
  return                         'Solicitação pendente'
}

const getStats = (data: DashboardData | null) => [
  { label: 'Total de Produtos',       sublabel: 'produtos cadastrados',       value: data?.totalProdutos ?? 0,            icon: Package,       tag: 'TOTAL',   accent: '#6366f1', accentFaint: 'rgba(99,102,241,0.12)',  accentBorder: 'rgba(99,102,241,0.25)',  iconColor: '#818cf8' },
  { label: 'Total de Itens',          sublabel: 'unidades disponíveis',        value: data?.totalItensEstoque ?? 0,        icon: TrendingUp,    tag: 'ESTOQUE', accent: '#10b981', accentFaint: 'rgba(16,185,129,0.10)',  accentBorder: 'rgba(16,185,129,0.22)',  iconColor: '#34d399' },
  { label: 'Estoque Mínimo',          sublabel: 'produtos abaixo do mínimo',   value: data?.produtosEstoqueMinimo ?? 0,    icon: AlertTriangle, tag: 'ALERTA',  accent: '#f59e0b', accentFaint: 'rgba(245,158,11,0.10)',  accentBorder: 'rgba(245,158,11,0.22)',  iconColor: '#fbbf24' },
  { label: 'Próximo ao Vencimento',   sublabel: 'produtos a vencer',           value: data?.produtosProximoVencimento ?? 0,icon: Calendar,      tag: 'URGENTE', accent: '#f43f5e', accentFaint: 'rgba(244,63,94,0.10)',   accentBorder: 'rgba(244,63,94,0.22)',   iconColor: '#fb7185' },
]



export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null)
  const [isLoading, setIsLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState<Date>(new Date())
  const { token, user } = useAuth()

  const firstName = user?.nome?.split(' ')[0] ?? 'Usuário'

  const fetchDashboard = async () => {
    try {
      const response = await fetch('/api/dashboard', {
        headers: { Authorization: `Bearer ${token}` },
      })
      const result = await response.json()
      setData(result)
      setLastUpdated(new Date())
    } catch (error) {
      console.error('Erro ao carregar dashboard:', error)
    } finally {
      setIsLoading(false)
    }
  }


  useEffect(() => {
    fetchDashboard()
    const interval = setInterval(fetchDashboard, 60_000)
    return () => clearInterval(interval)
  }, [token])

  const stats = getStats(data)

  if (isLoading) {
    return (
      <div className="db-loading">
        <div className="db-loading__spinner"><RefreshCw size={28} color="#818cf8" /></div>
        <p className="db-loading__text">Carregando dashboard...</p>
        <style>{dashStyles}</style>
      </div>
    )
  }

  return (
    <>
      <style>{dashStyles}</style>
      <div className="db-root">
        <div className="db-bg-orb db-bg-orb--1" />
        <div className="db-bg-orb db-bg-orb--2" />

        <div className="db-content">

          {/* ── Header ── */}
          <header className="db-header">
            <div>
              <h1 className="db-header__title">
                Olá, {firstName}! <span></span>
              </h1>
              <p className="db-header__subtitle">
                Aqui está o resumo do seu estoque em tempo real
                {}
                {!canWrite(user?.perfil) && (
                  <span className="db-readonly-badge">somente leitura</span>
                )}
              </p>
            </div>

            <div className="db-header__right">
              <div className="db-header__badge">
                <span className="db-header__badge-dot" />
                Atualizado às {lastUpdated.toLocaleTimeString('pt-BR', { hour: '2-digit', minute: '2-digit' })}
              </div>
              {}
              {canWrite(user?.perfil) && (
                <button className="db-action-btn">Nova Movimentação</button>
              )}
            </div>
          </header>

          {}
          <section className="db-stats">
            {stats.map((s, i) => {
              const Icon = s.icon
              return (
                <div key={s.tag} className="db-stat"
                  style={{ background: s.accentFaint, borderColor: s.accentBorder, animationDelay: `${i * 80}ms` }}
                >
                  <div className="db-stat__top">
                    <div className="db-stat__icon-wrap" style={{ background: `${s.accent}22` }}>
                      <Icon size={20} color={s.iconColor} strokeWidth={2} />
                    </div>
                    <span className="db-stat__tag" style={{ color: s.iconColor, background: `${s.accent}18` }}>
                      {s.tag}
                    </span>
                  </div>
                  <p className="db-stat__label">{s.label}</p>
                  <p className="db-stat__value" style={{ color: s.iconColor }}>
                    {s.value.toLocaleString('pt-BR')}
                  </p>
                  <p className="db-stat__sublabel">{s.sublabel}</p>
                </div>
              )
            })}
          </section>

          {}
          <section className="db-mov">
            <div className="db-mov__header">
              <div>
                <h2 className="db-mov__title">Últimas Movimentações</h2>
                <p className="db-mov__subtitle">Histórico recente de entradas, saídas e solicitações</p>
              </div>
              <div className="db-mov__header-right">
                <div className="db-mov__count">
                  <Boxes size={15} color="#818cf8" />
                  <span>{data?.ultimasMovimentacoes?.length ?? 0} registros</span>
                </div>
                {}
                <div className="db-mov__legend">
                  <span style={{ color: '#34d399' }}>● Entrada</span>
                  <span style={{ color: '#fb7185' }}>● Saída</span>
                  <span style={{ color: '#fbbf24' }}>● Solicitação</span>
                </div>
              </div>
            </div>

            <div className="db-mov__list">
              {data?.ultimasMovimentacoes && data.ultimasMovimentacoes.length > 0 ? (
                data.ultimasMovimentacoes.map((mov, i) => {
                  const colors = getMovColors(mov.tipo)
                  return (
                    <div key={mov.id} className="db-mov__item"
                      style={{ animationDelay: `${(i + 4) * 70}ms` }}
                    >
                      {}
                      <div className="db-mov__item-icon"
                        style={{ background: colors.iconBg, borderColor: colors.iconBorder }}
                        title={getMovLabel(mov.tipo)}
                      >
                        {getMovIcon(mov.tipo)}
                      </div>

                      <div className="db-mov__item-info">
                        <p className="db-mov__item-product">{mov.produto}</p>
                        <p className="db-mov__item-user">
                          {mov.usuario}
                          <span className="db-mov__item-tipo" style={{ color: colors.valueColor }}>
                            {getMovLabel(mov.tipo)}
                          </span>
                        </p>
                      </div>

                      <div className="db-mov__item-right">
                        <p className="db-mov__item-qty" style={{ color: colors.valueColor }}>
                          {colors.prefix}{mov.quantidade}
                        </p>
                        <p className="db-mov__item-date">
                          {new Date(mov.data).toLocaleDateString('pt-BR', { day: '2-digit', month: 'short', year: 'numeric' })}
                        </p>
                      </div>
                    </div>
                  )
                })
              ) : (
                <div className="db-mov__empty">
                  <div className="db-mov__empty-icon"><Package size={28} color="rgba(255,255,255,0.2)" /></div>
                  <p className="db-mov__empty-title">Nenhuma movimentação registrada</p>
                  <p className="db-mov__empty-sub">As movimentações aparecerão aqui em tempo real</p>
                </div>
              )}
            </div>
          </section>

        </div>
      </div>
    </>
  )
}

const dashStyles = `
  @import url('https://fonts.googleapis.com/css2?family=Sora:wght@400;600;700;800&family=DM+Sans:wght@400;500;600&display=swap');

  .db-loading { display:flex; flex-direction:column; align-items:center; justify-content:center; height:100vh; background:#04061a; gap:16px; }
  .db-loading__spinner { width:56px; height:56px; border-radius:16px; background:rgba(99,102,241,0.12); display:flex; align-items:center; justify-content:center; animation:db-spin 1.1s linear infinite; }
  @keyframes db-spin { to { transform:rotate(360deg); } }
  .db-loading__text { font-family:'DM Sans',sans-serif; font-size:14px; color:rgba(255,255,255,0.45); }

  .db-root { flex:1; min-height:100vh; background:#04061a; position:relative; overflow-x:hidden; font-family:'DM Sans',sans-serif; }
  .db-bg-orb { position:absolute; border-radius:50%; filter:blur(100px); pointer-events:none; z-index:0; }
  .db-bg-orb--1 { width:600px; height:400px; top:-100px; right:-100px; background:rgba(99,102,241,0.08); }
  .db-bg-orb--2 { width:500px; height:400px; bottom:0; left:-80px; background:rgba(168,85,247,0.07); }

  .db-content { position:relative; z-index:1; max-width:1100px; margin:0 auto; padding:36px 28px 56px; display:flex; flex-direction:column; gap:32px; }
  @media (max-width:640px) { .db-content { padding:24px 16px 40px; } }

  .db-header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:16px; }
  .db-header__title { font-family:'Sora',sans-serif; font-size:clamp(1.8rem,3vw,2.6rem); font-weight:800; color:#f1f5f9; letter-spacing:-0.03em; line-height:1.1; margin-bottom:8px; display:flex; align-items:center; gap:10px; }
  .db-header__subtitle { font-size:14px; color:rgba(255,255,255,0.4); display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .db-readonly-badge { font-size:11px; font-weight:600; padding:3px 10px; border-radius:999px; background:rgba(251,191,36,0.12); border:1px solid rgba(251,191,36,0.25); color:#fbbf24; letter-spacing:0.04em; }
  .db-header__right { display:flex; align-items:center; gap:10px; flex-wrap:wrap; }
  .db-header__badge { display:flex; align-items:center; gap:8px; padding:7px 14px; border-radius:999px; border:1px solid rgba(255,255,255,0.08); background:rgba(255,255,255,0.04); font-size:12px; font-weight:500; color:rgba(255,255,255,0.45); white-space:nowrap; }
  .db-header__badge-dot { width:7px; height:7px; border-radius:50%; background:#34d399; box-shadow:0 0 8px rgba(52,211,153,0.7); flex-shrink:0; }
  .db-action-btn { padding:8px 18px; border-radius:10px; border:none; background:linear-gradient(135deg,#4f46e5,#7c3aed); color:#fff; font-family:'DM Sans',sans-serif; font-size:13px; font-weight:600; cursor:pointer; transition:opacity 0.18s,transform 0.15s; box-shadow:0 4px 12px rgba(124,58,237,0.3); }
  .db-action-btn:hover { opacity:0.88; transform:translateY(-1px); }

  .db-stats { display:grid; grid-template-columns:repeat(2,1fr); gap:16px; }
  @media (min-width:900px) { .db-stats { grid-template-columns:repeat(4,1fr); } }
  .db-stat { padding:22px 20px; border-radius:20px; border:1px solid; display:flex; flex-direction:column; gap:6px; transition:transform 0.18s,box-shadow 0.18s; animation:db-fadeUp 0.4s ease both; }
  .db-stat:hover { transform:translateY(-3px); box-shadow:0 12px 32px rgba(0,0,0,0.25); }
  @keyframes db-fadeUp { from{opacity:0;transform:translateY(14px)} to{opacity:1;transform:translateY(0)} }
  .db-stat__top { display:flex; align-items:center; justify-content:space-between; margin-bottom:10px; }
  .db-stat__icon-wrap { width:38px; height:38px; border-radius:11px; display:flex; align-items:center; justify-content:center; }
  .db-stat__tag { font-size:10px; font-weight:700; letter-spacing:0.08em; padding:3px 8px; border-radius:6px; }
  .db-stat__label { font-size:12.5px; font-weight:500; color:rgba(255,255,255,0.5); }
  .db-stat__value { font-family:'Sora',sans-serif; font-size:clamp(2rem,4vw,2.8rem); font-weight:800; letter-spacing:-0.04em; line-height:1; }
  .db-stat__sublabel { font-size:11px; color:rgba(255,255,255,0.28); }

  .db-mov { background:rgba(255,255,255,0.03); border:1px solid rgba(255,255,255,0.07); border-radius:24px; overflow:hidden; }
  .db-mov__header { display:flex; align-items:flex-start; justify-content:space-between; flex-wrap:wrap; gap:12px; padding:24px 24px 20px; border-bottom:1px solid rgba(255,255,255,0.06); }
  .db-mov__title { font-family:'Sora',sans-serif; font-size:18px; font-weight:700; color:#f1f5f9; letter-spacing:-0.02em; margin-bottom:4px; }
  .db-mov__subtitle { font-size:13px; color:rgba(255,255,255,0.35); }
  .db-mov__header-right { display:flex; flex-direction:column; align-items:flex-end; gap:8px; }
  .db-mov__count { display:flex; align-items:center; gap:7px; padding:6px 12px; border-radius:8px; background:rgba(99,102,241,0.1); border:1px solid rgba(99,102,241,0.2); font-size:12px; font-weight:600; color:#818cf8; }
  .db-mov__legend { display:flex; gap:12px; font-size:11px; font-weight:600; }
  .db-mov__list { padding:8px 16px 16px; }
  .db-mov__item { display:flex; align-items:center; gap:14px; padding:14px 10px; border-radius:14px; border-bottom:1px solid rgba(255,255,255,0.04); transition:background 0.15s; animation:db-fadeUp 0.35s ease both; }
  .db-mov__item:last-child { border-bottom:none; }
  .db-mov__item:hover { background:rgba(255,255,255,0.03); }
  .db-mov__item-icon { width:40px; height:40px; flex-shrink:0; border-radius:12px; border:1px solid; display:flex; align-items:center; justify-content:center; }
  .db-mov__item-info { flex:1; min-width:0; }
  .db-mov__item-product { font-size:14px; font-weight:600; color:#e2e8f0; white-space:nowrap; overflow:hidden; text-overflow:ellipsis; margin-bottom:3px; }
  .db-mov__item-user { font-size:12px; color:rgba(255,255,255,0.35); display:flex; align-items:center; gap:6px; }
  .db-mov__item-tipo { font-size:11px; font-weight:600; }
  .db-mov__item-right { text-align:right; flex-shrink:0; }
  .db-mov__item-qty { font-family:'Sora',sans-serif; font-size:18px; font-weight:800; letter-spacing:-0.03em; line-height:1; margin-bottom:4px; }
  .db-mov__item-date { font-size:11px; color:rgba(255,255,255,0.3); }
  .db-mov__empty { padding:56px 20px; text-align:center; }
  .db-mov__empty-icon { width:64px; height:64px; border-radius:18px; background:rgba(255,255,255,0.04); border:1px solid rgba(255,255,255,0.08); display:flex; align-items:center; justify-content:center; margin:0 auto 16px; }
  .db-mov__empty-title { font-size:15px; font-weight:600; color:rgba(255,255,255,0.4); margin-bottom:6px; }
  .db-mov__empty-sub { font-size:13px; color:rgba(255,255,255,0.22); }
`