import { useState, useEffect } from 'react'
import { useAuth } from '../contexts/AuthContext'
import jsPDF from 'jspdf'
import {
  FileText, Download, Filter, Package, ArrowUpRight, ArrowDownLeft,
  AlertTriangle, Calendar, Users, RefreshCw
} from 'lucide-react'

interface ReportType {
  id: string
  label: string
  description: string
  icon: React.ReactNode
  requiredRole?: 'ADMIN' | 'GESTAO'
}

interface ProductsReportData {
  id: string
  codigo: string
  nome: string
  categoria: string
  quantidade: number
  estoque_minimo: number
  status: 'crítico' | 'normal'
  fornecedor: string
}

interface MovimentacoesReportData {
  id: string
  tipo: 'ENTRADA' | 'SAIDA'
  produto: string
  quantidade: number
  usuario: string
  data: string
}

interface EstoqueCriticoData {
  id: string
  codigo: string
  nome: string
  quantidade: number
  minimo: number
  diferenca: number
  categoria: string
}

interface VencimentoData {
  id: string
  codigo: string
  nome: string
  data_validade: string
  categoria: string
  quantidade: number
}

type ReportTab = 'produtos' | 'movimentacoes' | 'estoque-critico' | 'vencimento' | 'usuarios'

export default function Reports() {
  const { user, token } = useAuth()
  const [activeTab, setActiveTab] = useState<ReportTab>('produtos')
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState('')

  // Produtos
  const [produtosData, setProdutosData] = useState<ProductsReportData[]>([])
  const [produtosFiltros, setProdutosFiltros] = useState({ categoria: '', status: '' })

  // Movimentações
  const [movimentacoesData, setMovimentacoesData] = useState<MovimentacoesReportData[]>([])
  const [movimentacoesFiltros, setMovimentacoesFiltros] = useState({
    tipo: '',
    data_inicio: '',
    data_fim: ''
  })

  // Estoque Crítico
  const [estoqueCriticoData, setEstoqueCriticoData] = useState<EstoqueCriticoData[]>([])

  // Vencimento
  const [vencimentoData, setVencimentoData] = useState<VencimentoData[]>([])
  const [vencimentoFiltros, setVencimentoFiltros] = useState({
    dias: '15'
  })

  // Usuários
  const [usuariosData, setUsuariosData] = useState<any[]>([])

  const isAdmin = user?.perfil === 'ADMIN'

  const reports: ReportType[] = [
    {
      id: 'produtos',
      label: 'Produtos',
      description: 'Lista completa de produtos com estoque',
      icon: <Package size={20} />,
      requiredRole: 'GESTAO'
    },
    {
      id: 'movimentacoes',
      label: 'Movimentações',
      description: 'Histórico de entradas e saídas',
      icon: <ArrowUpRight size={20} />,
      requiredRole: 'GESTAO'
    },
    {
      id: 'estoque-critico',
      label: 'Estoque Crítico',
      description: 'Produtos abaixo do estoque mínimo',
      icon: <AlertTriangle size={20} />,
      requiredRole: 'GESTAO'
    },
    {
      id: 'vencimento',
      label: 'Próximos Vencimentos',
      description: 'Produtos próximos de vencer',
      icon: <Calendar size={20} />,
      requiredRole: 'GESTAO'
    },
    {
      id: 'usuarios',
      label: 'Usuários',
      description: 'Gerenciamento de usuários do sistema',
      icon: <Users size={20} />,
      requiredRole: 'ADMIN'
    }
  ]

  // Funções de Fetch
  const fetchProdutos = async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (produtosFiltros.categoria) params.set('categoria_id', produtosFiltros.categoria)
      if (produtosFiltros.status) params.set('status', produtosFiltros.status)
      params.set('limit', '1000')

      const response = await fetch(`/api/produtos?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao carregar produtos')

      const result = await response.json()
      const formatted = result.data?.map((p: any) => ({
        id: p.id,
        codigo: p.codigo,
        nome: p.nome,
        categoria: p.categoria_nome || '-',
        quantidade: p.quantidade_atual,
        estoque_minimo: p.estoque_minimo,
        status: p.quantidade_atual <= p.estoque_minimo ? 'crítico' : 'normal',
        fornecedor: p.fornecedor_nome || '-'
      })) || []
      setProdutosData(formatted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchMovimentacoes = async () => {
    setIsLoading(true)
    setError('')
    try {
      const params = new URLSearchParams()
      if (movimentacoesFiltros.tipo) params.set('tipo', movimentacoesFiltros.tipo)
      if (movimentacoesFiltros.data_inicio) params.set('data_inicio', movimentacoesFiltros.data_inicio)
      if (movimentacoesFiltros.data_fim) params.set('data_fim', movimentacoesFiltros.data_fim)
      params.set('limit', '1000')

      const response = await fetch(`/api/movimentacoes?${params}`, {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao carregar movimentações')

      const result = await response.json()
      const formatted = result.data?.map((m: any) => ({
        id: m.id,
        tipo: m.tipo,
        produto: m.produto_nome,
        quantidade: m.quantidade,
        usuario: m.usuario?.nome || '-',
        data: new Date(m.created_at).toLocaleDateString('pt-BR')
      })) || []
      setMovimentacoesData(formatted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchEstoqueCritico = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/produtos?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao carregar dados')

      const result = await response.json()
      const formatted = result.data
        ?.filter((p: any) => p.quantidade_atual <= p.estoque_minimo)
        .map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nome: p.nome,
          quantidade: p.quantidade_atual,
          minimo: p.estoque_minimo,
          diferenca: p.estoque_minimo - p.quantidade_atual,
          categoria: p.categoria_nome || '-'
        })) || []
      setEstoqueCriticoData(formatted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchVencimento = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/produtos?limit=1000', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao carregar dados')

      const result = await response.json()
      const diasAlerta = parseInt(vencimentoFiltros.dias)
      const hoje = new Date()
      const dataLimite = new Date(hoje)
      dataLimite.setDate(dataLimite.getDate() + diasAlerta)

      const formatted = result.data
        ?.filter((p: any) => {
          if (!p.data_validade) return false
          const dataVal = new Date(p.data_validade)
          return dataVal >= hoje && dataVal <= dataLimite
        })
        .map((p: any) => ({
          id: p.id,
          codigo: p.codigo,
          nome: p.nome,
          data_validade: new Date(p.data_validade).toLocaleDateString('pt-BR'),
          categoria: p.categoria_nome || '-',
          quantidade: p.quantidade_atual
        })) || []
      setVencimentoData(formatted)
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  const fetchUsuarios = async () => {
    setIsLoading(true)
    setError('')
    try {
      const response = await fetch('/api/users', {
        headers: { Authorization: `Bearer ${token}` }
      })

      if (!response.ok) throw new Error('Erro ao carregar usuários')

      const result = await response.json()
      setUsuariosData(result || [])
    } catch (err: any) {
      setError(err.message)
    } finally {
      setIsLoading(false)
    }
  }

  // Funções auxiliares para exportação
  const getFilteredHeaders = (headers: string[]) => {
    return headers.filter(h => !['id', 'codigo', 'created_at', 'updated_at'].includes(h))
  }

  const getHeaderLabel = (header: string) => {
    const labels: Record<string, string> = {
      nome: 'Nome',
      categoria: 'Categoria',
      quantidade: 'Quantidade',
      estoque_minimo: 'Estoque Mínimo',
      status: 'Status',
      fornecedor: 'Fornecedor',
      ativo: 'Status',
      tipo: 'Tipo',
      produto: 'Produto',
      usuario: 'Usuário',
      email: 'E-mail',
      perfil: 'Perfil',
      dias_para_vencer: 'Dias para Vencer',
      data_validade: 'Data de Validade',
      quantidade_movida: 'Quantidade Movida'
    }
    return labels[header] || header.charAt(0).toUpperCase() + header.slice(1).replace(/_/g, ' ')
  }

  const getReportTitle = (filename: string) => {
    const titles: Record<string, string> = {
      'relatorio-produtos': 'RELATÓRIO DE PRODUTOS',
      'relatorio-movimentacoes': 'RELATÓRIO DE MOVIMENTAÇÕES',
      'relatorio-estoque-critico': 'RELATÓRIO DE ESTOQUE CRÍTICO',
      'relatorio-vencimento': 'RELATÓRIO DE PRÓXIMOS VENCIMENTOS',
      'relatorio-usuarios': 'RELATÓRIO DE USUÁRIOS'
    }
    return titles[filename] || filename.toUpperCase()
  }

  // Funções de Exportação
  const exportToCSV = (data: any[], filename: string) => {
    if (data.length === 0) {
      setError('Nenhum dado para exportar')
      return
    }

    const allHeaders = Object.keys(data[0])
    const headers = getFilteredHeaders(allHeaders)
    
    const csvContent = [
      headers.map(h => getHeaderLabel(h)).join(','),
      ...data.map(row =>
        headers.map(header => {
          const value = row[header]
          return typeof value === 'string' && value.includes(',')
            ? `"${value}"`
            : value
        }).join(',')
      )
    ].join('\n')

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const link = document.createElement('a')
    const url = URL.createObjectURL(blob)
    link.setAttribute('href', url)
    link.setAttribute('download', `${filename}-${new Date().toISOString().split('T')[0]}.csv`)
    link.click()
  }

  const exportToPDF = (data: any[], filename: string) => {
    if (data.length === 0) {
      setError('Nenhum dado para exportar')
      return
    }

    try {
      const pdf = new jsPDF()
      const pageHeight = pdf.internal.pageSize.getHeight()
      const pageWidth = pdf.internal.pageSize.getWidth()
      const margin = 15
      let yPosition = margin

      const allHeaders = Object.keys(data[0])
      const headers = getFilteredHeaders(allHeaders)
      const reportTitle = getReportTitle(filename)
      const date = new Date().toLocaleDateString('pt-BR')

      // Configurar fonte
      pdf.setFontSize(16)
      pdf.setFont(undefined, 'bold')

      // Título
      const titleWidth = pdf.getStringUnitWidth(reportTitle) * pdf.getFontSize() / pdf.internal.pageSize.getWidth()
      pdf.text(reportTitle, pageWidth / 2, yPosition, { align: 'center' })
      yPosition += 12

      // Data e total
      pdf.setFontSize(10)
      pdf.setFont(undefined, 'normal')
      pdf.text(`Data: ${date} | Total de Registros: ${data.length}`, margin, yPosition)
      yPosition += 8

      // Linha separadora
      pdf.setDrawColor(0)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 6

      // Cabeçalhos da tabela
      pdf.setFont(undefined, 'bold')
      pdf.setFontSize(9)
      const headerLabels = headers.map(h => getHeaderLabel(h))
      const columnWidth = (pageWidth - 2 * margin) / headers.length

      headerLabels.forEach((label, index) => {
        pdf.text(label, margin + columnWidth * index + 2, yPosition)
      })
      yPosition += 6

      // Linha separadora
      pdf.setDrawColor(200)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 4

      // Dados da tabela
      pdf.setFont(undefined, 'normal')
      pdf.setFontSize(8)

      data.forEach((row, rowIndex) => {
        // Verificar se precisa de nova página
        if (yPosition > pageHeight - margin - 5) {
          pdf.addPage()
          yPosition = margin

          // Repetir cabeçalhos em nova página
          pdf.setFont(undefined, 'bold')
          pdf.setFontSize(9)
          headerLabels.forEach((label, index) => {
            pdf.text(label, margin + columnWidth * index + 2, yPosition)
          })
          yPosition += 6
          pdf.setDrawColor(200)
          pdf.line(margin, yPosition, pageWidth - margin, yPosition)
          yPosition += 4
          pdf.setFont(undefined, 'normal')
          pdf.setFontSize(8)
        }

        // Desenhar células
        headers.forEach((header, colIndex) => {
          const value = String(row[header] || '-')
          const truncated = value.substring(0, 30)
          pdf.text(truncated, margin + columnWidth * colIndex + 2, yPosition)
        })

        // Linha separadora entre linhas
        yPosition += 4
        pdf.setDrawColor(240)
        pdf.line(margin, yPosition, pageWidth - margin, yPosition)
        yPosition += 1
      })

      // Rodapé
      yPosition += 4
      pdf.setDrawColor(0)
      pdf.line(margin, yPosition, pageWidth - margin, yPosition)
      yPosition += 5

      pdf.setFont(undefined, 'italic')
      pdf.setFontSize(8)
      pdf.text('Relatório gerado automaticamente | Sistema de Gestão de Estoque', pageWidth / 2, yPosition, { align: 'center' })

      // Salvar PDF
      pdf.save(`${filename}-${new Date().toISOString().split('T')[0]}.pdf`)
    } catch (err) {
      setError('Erro ao gerar PDF')
      console.error(err)
    }
  }

  // Efeitos
  useEffect(() => {
    switch (activeTab) {
      case 'produtos':
        fetchProdutos()
        break
      case 'movimentacoes':
        fetchMovimentacoes()
        break
      case 'estoque-critico':
        fetchEstoqueCritico()
        break
      case 'vencimento':
        fetchVencimento()
        break
      case 'usuarios':
        fetchUsuarios()
        break
    }
  }, [activeTab])

  const handleTabChange = (tab: ReportTab) => {
    if (tab === 'usuarios' && !isAdmin) return
    setActiveTab(tab)
    setError('')
  }

  return (
    <>
      <style>{reportStyles}</style>
      <div className="reports-root">
        <div className="reports-bg-orb reports-bg-orb--1" />
        <div className="reports-bg-orb reports-bg-orb--2" />

        <div className="reports-content">
          {/* Header */}
          <header className="reports-header">
            <h1 className="reports-header__title">Relatórios</h1>
            <p className="reports-header__subtitle">Gere e exporte relatórios do sistema</p>
          </header>

          {/* Reports Menu */}
          <div className="reports-menu">
            {reports.map(report => {
              const isDisabled = report.requiredRole === 'ADMIN' && !isAdmin
              return (
                <button
                  key={report.id}
                  onClick={() => handleTabChange(report.id as ReportTab)}
                  disabled={isDisabled}
                  className={`reports-menu-item ${activeTab === report.id ? 'reports-menu-item--active' : ''} ${isDisabled ? 'reports-menu-item--disabled' : ''}`}
                  title={isDisabled ? 'Apenas administradores' : report.description}
                >
                  <div className="reports-menu-item__icon">
                    {report.icon}
                  </div>
                  <div className="reports-menu-item__content">
                    <p className="reports-menu-item__label">{report.label}</p>
                    <p className="reports-menu-item__description">{report.description}</p>
                  </div>
                </button>
              )
            })}
          </div>

          {/* Error Message */}
          {error && (
            <div className="reports-error">
              <p>{error}</p>
            </div>
          )}

          {/* Report Content */}
          <div className="reports-panel">
            {/* Produtos Report */}
            {activeTab === 'produtos' && (
              <div className="reports-report">
                <div className="reports-report__header">
                  <h2>Relatório de Produtos</h2>
                  <div className="reports-report__actions">
                    <button
                      onClick={() => fetchProdutos()}
                      className="reports-report__btn reports-report__btn--refresh"
                      title="Atualizar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => exportToCSV(produtosData, 'relatorio-produtos')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={() => exportToPDF(produtosData, 'relatorio-produtos')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="reports-filters">
                  <div className="reports-filter-group">
                    <label>Categoria</label>
                    <input
                      type="text"
                      placeholder="Filtrar por categoria"
                      value={produtosFiltros.categoria}
                      onChange={(e) => setProdutosFiltros({ ...produtosFiltros, categoria: e.target.value })}
                      onKeyUp={() => fetchProdutos()}
                    />
                  </div>
                  <div className="reports-filter-group">
                    <label>Status</label>
                    <select
                      value={produtosFiltros.status}
                      onChange={(e) => setProdutosFiltros({ ...produtosFiltros, status: e.target.value })}
                      onChangeCapture={() => fetchProdutos()}
                    >
                      <option value="">Todos</option>
                      <option value="ativo">Ativo</option>
                      <option value="inativo">Inativo</option>
                    </select>
                  </div>
                </div>

                {/* Tabela */}
                <ReportTable
                  data={produtosData}
                  isLoading={isLoading}
                  columns={['codigo', 'nome', 'categoria', 'quantidade', 'estoque_minimo', 'status', 'fornecedor']}
                  columnLabels={{
                    codigo: 'Código',
                    nome: 'Nome',
                    categoria: 'Categoria',
                    quantidade: 'Quantidade',
                    estoque_minimo: 'Mínimo',
                    status: 'Status',
                    fornecedor: 'Fornecedor'
                  }}
                />
              </div>
            )}

            {/* Movimentações Report */}
            {activeTab === 'movimentacoes' && (
              <div className="reports-report">
                <div className="reports-report__header">
                  <h2>Relatório de Movimentações</h2>
                  <div className="reports-report__actions">
                    <button
                      onClick={() => fetchMovimentacoes()}
                      className="reports-report__btn reports-report__btn--refresh"
                      title="Atualizar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => exportToCSV(movimentacoesData, 'relatorio-movimentacoes')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={() => exportToPDF(movimentacoesData, 'relatorio-movimentacoes')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="reports-filters">
                  <div className="reports-filter-group">
                    <label>Tipo</label>
                    <select
                      value={movimentacoesFiltros.tipo}
                      onChange={(e) => setMovimentacoesFiltros({ ...movimentacoesFiltros, tipo: e.target.value })}
                      onChangeCapture={() => fetchMovimentacoes()}
                    >
                      <option value="">Todos</option>
                      <option value="ENTRADA">Entrada</option>
                      <option value="SAIDA">Saída</option>
                    </select>
                  </div>
                  <div className="reports-filter-group">
                    <label>Data Início</label>
                    <input
                      type="date"
                      value={movimentacoesFiltros.data_inicio}
                      onChange={(e) => setMovimentacoesFiltros({ ...movimentacoesFiltros, data_inicio: e.target.value })}
                      onChangeCapture={() => fetchMovimentacoes()}
                    />
                  </div>
                  <div className="reports-filter-group">
                    <label>Data Fim</label>
                    <input
                      type="date"
                      value={movimentacoesFiltros.data_fim}
                      onChange={(e) => setMovimentacoesFiltros({ ...movimentacoesFiltros, data_fim: e.target.value })}
                      onChangeCapture={() => fetchMovimentacoes()}
                    />
                  </div>
                </div>

                <ReportTable
                  data={movimentacoesData}
                  isLoading={isLoading}
                  columns={['tipo', 'produto', 'quantidade', 'usuario', 'data']}
                  columnLabels={{
                    tipo: 'Tipo',
                    produto: 'Produto',
                    quantidade: 'Quantidade',
                    usuario: 'Usuário',
                    data: 'Data'
                  }}
                />
              </div>
            )}

            {/* Estoque Crítico Report */}
            {activeTab === 'estoque-critico' && (
              <div className="reports-report">
                <div className="reports-report__header">
                  <h2>Estoque Crítico</h2>
                  <div className="reports-report__actions">
                    <button
                      onClick={() => fetchEstoqueCritico()}
                      className="reports-report__btn reports-report__btn--refresh"
                      title="Atualizar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => exportToCSV(estoqueCriticoData, 'relatorio-estoque-critico')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={() => exportToPDF(estoqueCriticoData, 'relatorio-estoque-critico')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>

                <ReportTable
                  data={estoqueCriticoData}
                  isLoading={isLoading}
                  columns={['codigo', 'nome', 'categoria', 'quantidade', 'minimo', 'diferenca']}
                  columnLabels={{
                    codigo: 'Código',
                    nome: 'Produto',
                    categoria: 'Categoria',
                    quantidade: 'Atual',
                    minimo: 'Mínimo',
                    diferenca: 'Falta'
                  }}
                />
              </div>
            )}

            {/* Vencimento Report */}
            {activeTab === 'vencimento' && (
              <div className="reports-report">
                <div className="reports-report__header">
                  <h2>Próximos Vencimentos</h2>
                  <div className="reports-report__actions">
                    <button
                      onClick={() => fetchVencimento()}
                      className="reports-report__btn reports-report__btn--refresh"
                      title="Atualizar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => exportToCSV(vencimentoData, 'relatorio-vencimento')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={() => exportToPDF(vencimentoData, 'relatorio-vencimento')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>

                {/* Filtros */}
                <div className="reports-filters">
                  <div className="reports-filter-group">
                    <label>Próximos (dias)</label>
                    <input
                      type="number"
                      min="1"
                      value={vencimentoFiltros.dias}
                      onChange={(e) => setVencimentoFiltros({ dias: e.target.value })}
                      onChangeCapture={() => fetchVencimento()}
                    />
                  </div>
                </div>

                <ReportTable
                  data={vencimentoData}
                  isLoading={isLoading}
                  columns={['codigo', 'nome', 'categoria', 'quantidade', 'data_validade']}
                  columnLabels={{
                    codigo: 'Código',
                    nome: 'Produto',
                    categoria: 'Categoria',
                    quantidade: 'Quantidade',
                    data_validade: 'Vencimento'
                  }}
                />
              </div>
            )}

            {/* Usuários Report - ADMIN Only */}
            {activeTab === 'usuarios' && (
              <div className="reports-report">
                <div className="reports-report__header">
                  <h2>Relatório de Usuários</h2>
                  <div className="reports-report__actions">
                    <button
                      onClick={() => fetchUsuarios()}
                      className="reports-report__btn reports-report__btn--refresh"
                      title="Atualizar"
                    >
                      <RefreshCw size={16} />
                    </button>
                    <button
                      onClick={() => exportToCSV(usuariosData, 'relatorio-usuarios')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> CSV
                    </button>
                    <button
                      onClick={() => exportToPDF(usuariosData, 'relatorio-usuarios')}
                      className="reports-report__btn reports-report__btn--export"
                    >
                      <Download size={16} /> PDF
                    </button>
                  </div>
                </div>

                <ReportTable
                  data={usuariosData}
                  isLoading={isLoading}
                  columns={['nome', 'email', 'perfil', 'ativo']}
                  columnLabels={{
                    nome: 'Nome',
                    email: 'E-mail',
                    perfil: 'Perfil',
                    ativo: 'Status'
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </>
  )
}

// Componente de Tabela Reutilizável
function ReportTable({ data, isLoading, columns, columnLabels }: {
  data: any[]
  isLoading: boolean
  columns: string[]
  columnLabels: Record<string, string>
}) {
  if (isLoading) {
    return (
      <div className="reports-table-loading">
        <RefreshCw size={24} color="#3b82f6" className="reports-table-loading__spinner" />
        <p>Carregando dados...</p>
      </div>
    )
  }

  if (data.length === 0) {
    return (
      <div className="reports-table-empty">
        <FileText size={28} color="#cbd5e1" />
        <p>Nenhum dado encontrado</p>
      </div>
    )
  }

  return (
    <div className="reports-table-wrapper">
      <table className="reports-table">
        <thead>
          <tr>
            {columns.map(col => (
              <th key={col}>{columnLabels[col] || col}</th>
            ))}
          </tr>
        </thead>
        <tbody>
          {data.map((row, idx) => (
            <tr key={idx}>
              {columns.map(col => (
                <td key={col}>
                  {col === 'status' && (
                    <span className={`reports-table-badge reports-table-badge--${row[col]}`}>
                      {row[col]}
                    </span>
                  )}
                  {col === 'ativo' && (
                    <span className={`reports-table-badge reports-table-badge--${row[col] ? 'ativo' : 'inativo'}`}>
                      {row[col] ? 'Ativo' : 'Inativo'}
                    </span>
                  )}
                  {col === 'tipo' && (
                    <span className={`reports-table-badge reports-table-badge--${row[col]?.toLowerCase()}`}>
                      {row[col]}
                    </span>
                  )}
                  {col !== 'status' && col !== 'ativo' && col !== 'tipo' && (
                    row[col] || '-'
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  )
}

const reportStyles = `
  * {
    box-sizing: border-box;
  }

  .reports-root {
    position: relative;
    width: 100%;
    min-height: 100vh;
    background: linear-gradient(135deg, #f8fafc 0%, #f1f5f9 100%);
    overflow: hidden;
  }

  .reports-bg-orb {
    position: absolute;
    border-radius: 50%;
    pointer-events: none;
  }

  .reports-bg-orb--1 {
    width: 500px;
    height: 500px;
    background: radial-gradient(circle, rgba(59, 130, 246, 0.08) 0%, transparent 70%);
    top: -150px;
    right: -150px;
  }

  .reports-bg-orb--2 {
    width: 400px;
    height: 400px;
    background: radial-gradient(circle, rgba(16, 185, 129, 0.08) 0%, transparent 70%);
    bottom: -100px;
    left: -100px;
  }

  .reports-content {
    position: relative;
    z-index: 1;
    max-width: 1400px;
    margin: 0 auto;
    padding: 40px 24px;
  }

  .reports-header {
    margin-bottom: 32px;
  }

  .reports-header__title {
    font-size: 32px;
    font-weight: 700;
    color: #0f172a;
    margin: 0 0 8px 0;
    letter-spacing: -0.5px;
  }

  .reports-header__subtitle {
    font-size: 14px;
    color: #64748b;
    margin: 0;
  }

  /* Menu de Relatórios */
  .reports-menu {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
    gap: 16px;
    margin-bottom: 32px;
  }

  .reports-menu-item {
    display: flex;
    align-items: flex-start;
    gap: 14px;
    padding: 16px;
    background: white;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 12px;
    cursor: pointer;
    transition: all 0.2s ease;
    text-align: left;
    font-family: inherit;
    font-size: 14px;
  }

  .reports-menu-item:hover:not(.reports-menu-item--disabled) {
    border-color: #3b82f6;
    background: rgba(59, 130, 246, 0.02);
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.1);
    transform: translateY(-2px);
  }

  .reports-menu-item--active {
    background: rgba(59, 130, 246, 0.08);
    border-color: #3b82f6;
    box-shadow: 0 4px 12px rgba(59, 130, 246, 0.15);
  }

  .reports-menu-item--disabled {
    opacity: 0.5;
    cursor: not-allowed;
  }

  .reports-menu-item__icon {
    color: #3b82f6;
    flex-shrink: 0;
    margin-top: 2px;
  }

  .reports-menu-item__content {
    flex: 1;
    min-width: 0;
  }

  .reports-menu-item__label {
    margin: 0 0 4px 0;
    font-weight: 600;
    color: #0f172a;
  }

  .reports-menu-item__description {
    margin: 0;
    font-size: 12px;
    color: #64748b;
  }

  /* Panel */
  .reports-panel {
    background: white;
    border: 1px solid rgba(203, 213, 225, 0.5);
    border-radius: 16px;
    padding: 28px;
    box-shadow: 0 1px 3px rgba(0, 0, 0, 0.05);
  }

  .reports-error {
    background: rgba(244, 63, 94, 0.08);
    border: 1px solid rgba(244, 63, 94, 0.3);
    border-radius: 8px;
    padding: 16px;
    margin-bottom: 20px;
    color: #991b1b;
    font-size: 14px;
  }

  /* Report */
  .reports-report {
    display: flex;
    flex-direction: column;
    gap: 20px;
  }

  .reports-report__header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding-bottom: 16px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  }

  .reports-report__header h2 {
    margin: 0;
    font-size: 18px;
    font-weight: 600;
    color: #0f172a;
  }

  .reports-report__actions {
    display: flex;
    gap: 8px;
  }

  .reports-report__btn {
    display: flex;
    align-items: center;
    gap: 6px;
    padding: 8px 14px;
    border: none;
    border-radius: 6px;
    font-size: 12px;
    font-weight: 500;
    cursor: pointer;
    transition: all 0.2s ease;
    font-family: inherit;
  }

  .reports-report__btn--refresh {
    background: rgba(59, 130, 246, 0.1);
    color: #3b82f6;
  }

  .reports-report__btn--refresh:hover {
    background: rgba(59, 130, 246, 0.15);
  }

  .reports-report__btn--export {
    background: rgba(16, 185, 129, 0.1);
    color: #10b981;
  }

  .reports-report__btn--export:hover {
    background: rgba(16, 185, 129, 0.15);
  }

  /* Filtros */
  .reports-filters {
    display: grid;
    grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
    gap: 16px;
    padding: 16px;
    background: rgba(226, 232, 240, 0.3);
    border-radius: 8px;
  }

  .reports-filter-group {
    display: flex;
    flex-direction: column;
    gap: 6px;
  }

  .reports-filter-group label {
    font-size: 12px;
    font-weight: 600;
    color: #64748b;
    text-transform: uppercase;
    letter-spacing: 0.5px;
  }

  .reports-filter-group input,
  .reports-filter-group select {
    padding: 8px 12px;
    border: 1px solid rgba(203, 213, 225, 0.6);
    border-radius: 6px;
    font-size: 13px;
    font-family: inherit;
    background: white;
    color: #0f172a;
  }

  .reports-filter-group input:focus,
  .reports-filter-group select:focus {
    outline: none;
    border-color: #3b82f6;
    box-shadow: 0 0 0 2px rgba(59, 130, 246, 0.1);
  }

  /* Tabela */
  .reports-table-wrapper {
    overflow-x: auto;
  }

  .reports-table {
    width: 100%;
    border-collapse: collapse;
    font-size: 13px;
  }

  .reports-table thead {
    background: rgba(226, 232, 240, 0.5);
  }

  .reports-table th {
    padding: 12px;
    text-align: left;
    font-weight: 600;
    color: #475569;
    border-bottom: 1px solid rgba(203, 213, 225, 0.3);
  }

  .reports-table td {
    padding: 12px;
    border-bottom: 1px solid rgba(203, 213, 225, 0.2);
    color: #0f172a;
  }

  .reports-table tbody tr:hover {
    background: rgba(59, 130, 246, 0.03);
  }

  .reports-table-badge {
    display: inline-block;
    padding: 4px 8px;
    border-radius: 4px;
    font-size: 11px;
    font-weight: 600;
  }

  .reports-table-badge--crítico {
    background: rgba(244, 63, 94, 0.12);
    color: #991b1b;
  }

  .reports-table-badge--normal {
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
  }

  .reports-table-badge--ativo {
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
  }

  .reports-table-badge--inativo {
    background: rgba(107, 114, 128, 0.12);
    color: #374151;
  }

  .reports-table-badge--entrada {
    background: rgba(16, 185, 129, 0.12);
    color: #065f46;
  }

  .reports-table-badge--saida {
    background: rgba(244, 63, 94, 0.12);
    color: #991b1b;
  }

  /* Loading */
  .reports-table-loading,
  .reports-table-empty {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    padding: 60px 20px;
    color: #cbd5e1;
  }

  .reports-table-loading__spinner {
    animation: spin 2s linear infinite;
    margin-bottom: 16px;
    color: #3b82f6;
  }

  @keyframes spin {
    from { transform: rotate(0deg); }
    to { transform: rotate(360deg); }
  }

  .reports-table-empty p,
  .reports-table-loading p {
    margin: 12px 0 0 0;
    font-size: 14px;
    color: #94a3b8;
  }

  @media (max-width: 768px) {
    .reports-content {
      padding: 24px 16px;
    }

    .reports-header__title {
      font-size: 24px;
    }

    .reports-menu {
      grid-template-columns: 1fr;
    }

    .reports-panel {
      padding: 16px;
    }

    .reports-filters {
      grid-template-columns: 1fr;
    }

    .reports-table {
      font-size: 12px;
    }

    .reports-table th,
    .reports-table td {
      padding: 8px;
    }
  }
`
