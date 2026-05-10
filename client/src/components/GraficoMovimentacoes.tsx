import { useCallback, useEffect, useState } from 'react'
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
} from 'recharts'
import { useRealtime } from '../hooks/useRealtime'

// ─── Types & Interfaces ───────────────────────────────────────────────────────

export interface GraficoMovimentacoesProps {
  token: string
}

type Periodo = 'semana' | 'mes' | 'ano'

interface DadosCategoria {
  categoria_nome: string
  total_entradas: number
  total_saidas: number
  total_solicitacoes: number
  total_geral: number
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

export function formatarCategoria(nome: string): string {
  if (nome.length > 15) {
    return nome.slice(0, 15) + '…'
  }
  return nome
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

interface TooltipPayloadEntry {
  name: string
  value: number
  color: string
}

interface CustomTooltipProps {
  active?: boolean
  payload?: TooltipPayloadEntry[]
  label?: string
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload || payload.length === 0) return null
  return (
    <div style={{
      background: 'rgba(15, 23, 42, 0.92)',
      border: '1px solid rgba(255,255,255,0.08)',
      borderRadius: '12px',
      padding: '10px 14px',
      boxShadow: '0 8px 24px rgba(0,0,0,0.4)',
      backdropFilter: 'blur(8px)',
      fontFamily: "'DM Sans', sans-serif",
      fontSize: '13px',
      minWidth: '140px',
    }}>
      <p style={{ fontWeight: 600, color: '#f1f5f9', marginBottom: '6px', fontSize: '13px' }}>{label}</p>
      {payload.map((entry) => (
        <p key={entry.name} style={{ color: entry.color, margin: '3px 0', fontSize: '12px' }}>
          {entry.name}: <strong style={{ color: '#f1f5f9' }}>{entry.value.toLocaleString('pt-BR')}</strong>
        </p>
      ))}
    </div>
  )
}

// ─── Component ────────────────────────────────────────────────────────────────

export default function GraficoMovimentacoes({ token }: GraficoMovimentacoesProps) {
  const [dados, setDados] = useState<DadosCategoria[]>([])
  const [periodo, setPeriodo] = useState<Periodo>('mes')
  const [carregando, setCarregando] = useState(true)
  const [erro, setErro] = useState<string | null>(null)

  const fetchGrafico = useCallback(async () => {
    setCarregando(true)
    setErro(null)
    try {
      const response = await fetch(
        `/api/dashboard/movimentacoes-por-categoria?periodo=${periodo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) {
        const body = await response.json().catch(() => ({}))
        throw new Error(body?.error ?? `Erro ${response.status}`)
      }
      const result: DadosCategoria[] = await response.json()
      setDados(result)
    } catch (err) {
      setErro(err instanceof Error ? err.message : 'Erro ao carregar dados do gráfico')
    } finally {
      setCarregando(false)
    }
  }, [periodo, token])

  const fetchGraficoSilencioso = useCallback(async () => {
    try {
      const response = await fetch(
        `/api/dashboard/movimentacoes-por-categoria?periodo=${periodo}`,
        { headers: { Authorization: `Bearer ${token}` } }
      )
      if (!response.ok) return
      const result: DadosCategoria[] = await response.json()
      setDados(result)
    } catch {
      // Silent
    }
  }, [periodo, token])

  useRealtime('estoque_atualizado', fetchGraficoSilencioso)

  useEffect(() => {
    fetchGrafico()
    const interval = setInterval(() => fetchGraficoSilencioso(), 60_000)
    return () => clearInterval(interval)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => {
    fetchGrafico()
  }, [periodo]) // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <section className="db-grafico">
      <style>{graficoStyles}</style>

      <div className="db-grafico__header">
        <div>
          <h2 className="db-grafico__title">Movimentações por Categoria</h2>
          <p className="db-grafico__subtitle">Volume de entradas, saídas e solicitações por categoria</p>
        </div>

        <div className="db-grafico__periodo" role="group" aria-label="Selecionar período">
          {(['semana', 'mes', 'ano'] as Periodo[]).map((p) => {
            const labels: Record<Periodo, string> = { semana: 'Semana', mes: 'Mês', ano: 'Ano' }
            return (
              <button
                key={p}
                className={`db-grafico__periodo-btn${periodo === p ? ' db-grafico__periodo-btn--active' : ''}`}
                onClick={() => setPeriodo(p)}
                aria-pressed={periodo === p}
              >
                {labels[p]}
              </button>
            )
          })}
        </div>
      </div>

      <div className="db-grafico__body" aria-label="Gráfico de movimentações por categoria">
        {carregando ? (
          <div className="db-grafico__loading">
            <div className="db-grafico__spinner" />
            <p className="db-grafico__loading-text">Carregando gráfico...</p>
          </div>
        ) : erro !== null ? (
          <div className="db-grafico__error"><p>{erro}</p></div>
        ) : dados.length === 0 ? (
          <div className="db-grafico__empty">
            <p>Nenhuma movimentação encontrada no período selecionado</p>
          </div>
        ) : (
          <ResponsiveContainer width="100%" height={320}>
            <BarChart data={dados} margin={{ top: 8, right: 16, left: 0, bottom: 8 }}>
              <XAxis
                dataKey="categoria_nome"
                tickFormatter={formatarCategoria}
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                axisLine={{ stroke: 'var(--border-card)' }}
                tickLine={false}
              />
              <YAxis
                tick={{ fontSize: 12, fill: 'var(--text-secondary)' }}
                axisLine={false}
                tickLine={false}
              />
              <Tooltip content={<CustomTooltip />} cursor={{ fill: 'rgba(255,255,255,0.04)' }} />
              <Legend wrapperStyle={{ fontSize: 12, paddingTop: 12 }} />
              <Bar dataKey="total_entradas" name="Entradas" fill="#34d399" radius={[4, 4, 0, 0]} minPointSize={2} />
              <Bar dataKey="total_saidas" name="Saídas" fill="#fb7185" radius={[4, 4, 0, 0]} minPointSize={2} />
            </BarChart>
          </ResponsiveContainer>
        )}
      </div>
    </section>
  )
}

// ─── Styles ───────────────────────────────────────────────────────────────────

const graficoStyles = `
  .db-grafico {
    background: var(--bg-card);
    border: 1px solid var(--border-card);
    border-radius: 24px;
    overflow: hidden;
    box-shadow: var(--shadow-card);
  }
  .db-grafico__header {
    display: flex;
    align-items: flex-start;
    justify-content: space-between;
    flex-wrap: wrap;
    gap: 12px;
    padding: 24px 24px 20px;
    border-bottom: 1px solid var(--border-card);
  }
  .db-grafico__title {
    font-family: 'Sora', sans-serif;
    font-size: 18px;
    font-weight: 700;
    color: var(--text-primary);
    letter-spacing: -0.02em;
    margin-bottom: 4px;
  }
  .db-grafico__subtitle { font-size: 13px; color: var(--text-secondary); }
  .db-grafico__periodo {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 4px;
    border-radius: 10px;
    background: var(--bg-active);
    border: 1px solid var(--border-input);
  }
  .db-grafico__periodo-btn {
    padding: 6px 14px;
    border-radius: 7px;
    border: none;
    background: transparent;
    color: var(--text-secondary);
    font-family: 'DM Sans', sans-serif;
    font-size: 13px;
    font-weight: 500;
    cursor: pointer;
    transition: background 0.15s, color 0.15s;
  }
  .db-grafico__periodo-btn:hover { background: var(--bg-card); color: var(--text-primary); }
  .db-grafico__periodo-btn--active {
    background: var(--bg-card);
    color: var(--text-link-active);
    font-weight: 600;
    box-shadow: 0 1px 4px rgba(0,0,0,0.12);
    border: 1px solid var(--border-input);
  }
  .db-grafico__body {
    padding: 24px;
    min-height: 200px;
    display: flex;
    align-items: center;
    justify-content: center;
  }
  .db-grafico__loading { display: flex; flex-direction: column; align-items: center; gap: 12px; }
  .db-grafico__spinner {
    width: 36px; height: 36px;
    border-radius: 50%;
    border: 3px solid var(--border-card);
    border-top-color: var(--text-link-active);
    animation: db-grafico-spin 0.8s linear infinite;
  }
  @keyframes db-grafico-spin { to { transform: rotate(360deg); } }
  .db-grafico__loading-text { font-size: 13px; color: var(--text-muted); }
  .db-grafico__empty { text-align: center; padding: 32px 20px; }
  .db-grafico__empty p { font-size: 14px; color: var(--text-muted); }
  .db-grafico__error { text-align: center; padding: 32px 20px; }
  .db-grafico__error p { font-size: 14px; color: #fb7185; }
`
